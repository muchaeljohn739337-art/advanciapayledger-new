import { PaymentRepository } from '../repositories/payment.repository';
import { CryptoPaymentProvider } from '../providers/crypto-payment.provider';
import { FiatPaymentProvider } from '../providers/fiat-payment.provider';
import { WebhookService } from '../services/webhook.service';
import { 
  Payment, 
  PaymentType, 
  PaymentStatus, 
  CreateCryptoPaymentRequest,
  CreateFiatPaymentRequest,
  PaymentResponse 
} from '../types/payment.types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export class PaymentService {
  constructor(
    private paymentRepository: PaymentRepository,
    private cryptoProvider: CryptoPaymentProvider,
    private fiatProvider: FiatPaymentProvider,
    private webhookService: WebhookService
  ) {}

  async createCryptoPayment(request: CreateCryptoPaymentRequest): Promise<PaymentResponse> {
    const payment: Payment = {
      id: uuidv4(),
      type: PaymentType.CRYPTO,
      status: PaymentStatus.PENDING,
      amount: request.amount,
      currency: request.currency,
      cryptoCurrency: request.cryptoCurrency,
      walletAddress: request.walletAddress,
      userId: request.userId,
      metadata: request.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // Create payment in database
      const savedPayment = await this.paymentRepository.create(payment);
      
      // Initialize crypto payment
      const cryptoPaymentResult = await this.cryptoProvider.createPayment({
        paymentId: payment.id,
        amount: request.amount,
        cryptoCurrency: request.cryptoCurrency,
        walletAddress: request.walletAddress,
        network: request.network || 'ethereum'
      });

      // Update payment with crypto details
      savedPayment.transactionHash = cryptoPaymentResult.transactionHash;
      savedPayment.expectedAmount = cryptoPaymentResult.expectedAmount;
      savedPayment.expiryTime = cryptoPaymentResult.expiryTime;
      
      await this.paymentRepository.update(savedPayment);

      logger.info('Crypto payment created', { paymentId: payment.id });

      return {
        success: true,
        payment: savedPayment,
        paymentUrl: cryptoPaymentResult.paymentUrl,
        qrCode: cryptoPaymentResult.qrCode
      };
    } catch (error) {
      logger.error('Failed to create crypto payment', { error, paymentId: payment.id });
      throw new Error('Failed to create crypto payment');
    }
  }

  async createFiatPayment(request: CreateFiatPaymentRequest): Promise<PaymentResponse> {
    const payment: Payment = {
      id: uuidv4(),
      type: PaymentType.FIAT,
      status: PaymentStatus.PENDING,
      amount: request.amount,
      currency: request.currency,
      paymentMethod: request.paymentMethod,
      cardDetails: this.sanitizeCardDetails(request.cardDetails),
      userId: request.userId,
      metadata: request.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // Create payment in database
      const savedPayment = await this.paymentRepository.create(payment);
      
      // Process fiat payment
      const fiatPaymentResult = await this.fiatProvider.processPayment({
        paymentId: payment.id,
        amount: request.amount,
        currency: request.currency,
        paymentMethod: request.paymentMethod,
        cardDetails: request.cardDetails,
        billingAddress: request.billingAddress
      });

      // Update payment with fiat details
      savedPayment.transactionId = fiatPaymentResult.transactionId;
      savedPayment.status = fiatPaymentResult.status;
      savedPayment.processorResponse = fiatPaymentResult.processorResponse;
      
      await this.paymentRepository.update(savedPayment);

      logger.info('Fiat payment created', { paymentId: payment.id });

      return {
        success: true,
        payment: savedPayment,
        redirectUrl: fiatPaymentResult.redirectUrl
      };
    } catch (error) {
      logger.error('Failed to create fiat payment', { error, paymentId: payment.id });
      throw new Error('Failed to create fiat payment');
    }
  }

  async getPayment(paymentId: string): Promise<Payment | null> {
    return await this.paymentRepository.findById(paymentId);
  }

  async listPayments(userId: string, filters?: any): Promise<Payment[]> {
    return await this.paymentRepository.findByUserId(userId, filters);
  }

  async confirmPayment(paymentId: string): Promise<PaymentResponse> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    try {
      if (payment.type === PaymentType.CRYPTO) {
        const cryptoStatus = await this.cryptoProvider.getPaymentStatus(paymentId);
        if (cryptoStatus.status === 'completed') {
          payment.status = PaymentStatus.COMPLETED;
          payment.transactionHash = cryptoStatus.transactionHash;
          payment.completedAt = new Date();
        }
      } else if (payment.type === PaymentType.FIAT) {
        const fiatStatus = await this.fiatProvider.getPaymentStatus(payment.transactionId!);
        if (fiatStatus.status === 'completed') {
          payment.status = PaymentStatus.COMPLETED;
          payment.completedAt = new Date();
        }
      }

      await this.paymentRepository.update(payment);

      // Send webhook notification
      await this.webhookService.sendPaymentNotification(payment);

      logger.info('Payment confirmed', { paymentId, status: payment.status });

      return {
        success: true,
        payment
      };
    } catch (error) {
      logger.error('Failed to confirm payment', { error, paymentId });
      throw new Error('Failed to confirm payment');
    }
  }

  async refundPayment(paymentId: string, reason?: string): Promise<PaymentResponse> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Only completed payments can be refunded');
    }

    try {
      let refundResult;

      if (payment.type === PaymentType.CRYPTO) {
        refundResult = await this.cryptoProvider.refundPayment({
          paymentId,
          transactionHash: payment.transactionHash!,
          amount: payment.amount,
          cryptoCurrency: payment.cryptoCurrency!
        });
      } else {
        refundResult = await this.fiatProvider.refundPayment({
          paymentId,
          transactionId: payment.transactionId!,
          amount: payment.amount,
          currency: payment.currency
        });
      }

      payment.status = PaymentStatus.REFUNDED;
      payment.refundId = refundResult.refundId;
      payment.refundReason = reason;
      payment.refundedAt = new Date();

      await this.paymentRepository.update(payment);

      // Send webhook notification
      await this.webhookService.sendRefundNotification(payment);

      logger.info('Payment refunded', { paymentId, refundId: refundResult.refundId });

      return {
        success: true,
        payment
      };
    } catch (error) {
      logger.error('Failed to refund payment', { error, paymentId });
      throw new Error('Failed to refund payment');
    }
  }

  async handleCryptoWebhook(payload: any): Promise<void> {
    try {
      const { paymentId, status, transactionHash, blockNumber } = payload;
      
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        logger.warn('Webhook for unknown payment', { paymentId });
        return;
      }

      if (status === 'confirmed') {
        payment.status = PaymentStatus.COMPLETED;
        payment.transactionHash = transactionHash;
        payment.blockNumber = blockNumber;
        payment.completedAt = new Date();
      } else if (status === 'failed') {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = payload.reason;
      }

      await this.paymentRepository.update(payment);
      await this.webhookService.sendPaymentNotification(payment);

      logger.info('Crypto webhook processed', { paymentId, status });
    } catch (error) {
      logger.error('Failed to process crypto webhook', { error, payload });
      throw error;
    }
  }

  async handleFiatWebhook(payload: any): Promise<void> {
    try {
      const { paymentId, status, transactionId, processorResponse } = payload;
      
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        logger.warn('Webhook for unknown payment', { paymentId });
        return;
      }

      if (status === 'succeeded') {
        payment.status = PaymentStatus.COMPLETED;
        payment.transactionId = transactionId;
        payment.processorResponse = processorResponse;
        payment.completedAt = new Date();
      } else if (status === 'failed') {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = processorResponse?.failureReason;
      }

      await this.paymentRepository.update(payment);
      await this.webhookService.sendPaymentNotification(payment);

      logger.info('Fiat webhook processed', { paymentId, status });
    } catch (error) {
      logger.error('Failed to process fiat webhook', { error, payload });
      throw error;
    }
  }

  private sanitizeCardDetails(cardDetails: any): any {
    // Remove sensitive data, keep only last 4 digits
    if (cardDetails?.number) {
      return {
        ...cardDetails,
        number: `****-****-****-${cardDetails.number.slice(-4)}`,
        cvv: undefined,
        expiry: cardDetails.expiry
      };
    }
    return cardDetails;
  }
}
