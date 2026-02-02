import { PrismaClient, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import RedisLockService from './redisLockService';
import IdempotencyService from './idempotencyService';
import WalletService from './walletService';
import { logger } from "../utils/logger";

interface PaymentOptions {
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  description: string;
  patientId: string;
  facilityId: string;
  providerId?: string;
  idempotencyKey: string;
  metadata?: any;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  status?: string;
}

export class PaymentService {
  private prisma: PrismaClient;
  private stripe: Stripe;
  private lockService: RedisLockService;
  private idempotencyService: IdempotencyService;
  private walletService: WalletService;

  constructor(
    prisma: PrismaClient,
    stripe: Stripe,
    lockService: RedisLockService,
    idempotencyService: IdempotencyService,
    walletService: WalletService
  ) {
    this.prisma = prisma;
    this.stripe = stripe;
    this.lockService = lockService;
    this.idempotencyService = idempotencyService;
    this.walletService = walletService;
  }

  async processPayment(options: PaymentOptions): Promise<PaymentResult> {
    const { idempotencyKey, userId } = options;

    const idempotencyCheck = await this.idempotencyService.checkIdempotency(
      idempotencyKey
    );

    if (idempotencyCheck.isProcessed) {
      return idempotencyCheck.result as PaymentResult;
    }

    const lockKey = `payment:${userId}:${idempotencyKey}`;

    try {
      const result = await this.lockService.withLock(
        lockKey,
        async () => {
          return await this.executePayment(options);
        },
        { ttl: 30, retries: 3, retryDelay: 200 }
      );

      await this.idempotencyService.storeIdempotencyResult(
        idempotencyKey,
        result
      );

      return result;
    } catch (error: any) {
      const errorResult = {
        success: false,
        error: error.message || 'Payment processing failed',
      };

      await this.idempotencyService.storeIdempotencyResult(
        idempotencyKey,
        errorResult
      );

      return errorResult;
    }
  }

  private async executePayment(options: PaymentOptions): Promise<PaymentResult> {
    const {
      userId,
      amount,
      currency,
      paymentMethod,
      description,
      patientId,
      facilityId,
      providerId,
      idempotencyKey,
      metadata,
    } = options;

    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    return await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          amount: new Prisma.Decimal(amount),
          currency,
          paymentMethod: paymentMethod as any,
          status: 'PENDING',
          description,
          patientId,
          facilityId,
          providerId,
          createdBy: userId,
        },
      });

      let stripePaymentIntent;
      try {
        stripePaymentIntent = await this.stripe.paymentIntents.create(
          {
            amount: Math.round(amount * 100),
            currency: currency.toLowerCase(),
            description,
            metadata: {
              paymentId: payment.id,
              userId,
              ...metadata,
            },
          },
          {
            idempotencyKey,
          }
        );

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            transactionId: stripePaymentIntent.id,
            status: 'PROCESSING',
          },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'PAYMENT_CREATED',
            resource: 'payment',
            resourceId: payment.id,
            details: {
              amount,
              currency,
              paymentMethod,
              stripePaymentIntentId: stripePaymentIntent.id,
            },
          },
        });

        return {
          success: true,
          paymentId: payment.id,
          status: 'PROCESSING',
        };
      } catch (stripeError: any) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });

        throw new Error(`Stripe error: ${stripeError.message}`);
      }
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000,
    });
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    const lockKey = `webhook:stripe:${event.id}`;

    await this.lockService.withLock(
      lockKey,
      async () => {
        switch (event.type) {
          case 'payment_intent.succeeded':
            await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
            break;
          case 'payment_intent.payment_failed':
            await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
            break;
          default:
            logger.warn("Unhandled Stripe webhook event", { type: event.type });
        }
      },
      { ttl: 10, retries: 3, retryDelay: 100 }
    );
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const paymentId = paymentIntent.metadata.paymentId;

    if (!paymentId) {
      logger.error("Payment ID not found in metadata for succeeded intent");
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status === 'COMPLETED') {
        logger.info("Payment already completed, skipping", { paymentId });
        return;
      }

      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'COMPLETED' },
      });

      await tx.auditLog.create({
        data: {
          userId: payment.createdBy,
          action: 'PAYMENT_COMPLETED',
          resource: 'payment',
          resourceId: paymentId,
          details: {
            stripePaymentIntentId: paymentIntent.id,
            amount: payment.amount,
          },
        },
      });
    });
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const paymentId = paymentIntent.metadata.paymentId;

    if (!paymentId) {
      logger.error("Payment ID not found in metadata for failed intent");
      return;
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'FAILED' },
    });
  }

  async refundPayment(
    paymentId: string,
    userId: string,
    reason: string,
    idempotencyKey: string
  ): Promise<PaymentResult> {
    const idempotencyCheck = await this.idempotencyService.checkIdempotency(
      idempotencyKey
    );

    if (idempotencyCheck.isProcessed) {
      return idempotencyCheck.result as PaymentResult;
    }

    const lockKey = `refund:${paymentId}`;

    try {
      const result = await this.lockService.withLock(
        lockKey,
        async () => {
          return await this.executeRefund(paymentId, userId, reason);
        },
        { ttl: 30, retries: 3, retryDelay: 200 }
      );

      await this.idempotencyService.storeIdempotencyResult(
        idempotencyKey,
        result
      );

      return result;
    } catch (error: any) {
      const errorResult = {
        success: false,
        error: error.message || 'Refund processing failed',
      };

      await this.idempotencyService.storeIdempotencyResult(
        idempotencyKey,
        errorResult
      );

      return errorResult;
    }
  }

  private async executeRefund(
    paymentId: string,
    userId: string,
    reason: string
  ): Promise<PaymentResult> {
    return await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Only completed payments can be refunded');
      }

      if (!payment.transactionId) {
        throw new Error('Payment has no Stripe transaction ID');
      }

      const existingRefund = await tx.refund.findFirst({
        where: { paymentId },
      });

      if (existingRefund) {
        throw new Error('Payment already refunded');
      }

      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: payment.transactionId,
      });

      const refund = await tx.refund.create({
        data: {
          paymentId,
          amount: payment.amount,
          reason,
          status: 'PROCESSING',
          processedBy: userId,
        },
      });

      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'REFUND_CREATED',
          resource: 'refund',
          resourceId: refund.id,
          details: {
            paymentId,
            amount: payment.amount,
            stripeRefundId: stripeRefund.id,
          },
        },
      });

      return {
        success: true,
        paymentId: refund.id,
        status: 'PROCESSING',
      };
    });
  }
}

export default PaymentService;
