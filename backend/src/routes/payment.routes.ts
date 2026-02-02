import { Router, Request, Response } from 'express';
import { getPaymentService } from '../config/services';
import { getStripeClient, getWebhookSecret } from '../config/stripe';
import { logger } from "../utils/logger";

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    
    if (!idempotencyKey) {
      return res.status(400).json({ 
        error: 'Idempotency-Key header is required for payment operations' 
      });
    }

    const { 
      amount, 
      currency, 
      paymentMethod, 
      description,
      patientId,
      facilityId,
      providerId,
      metadata 
    } = req.body;
    
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    if (!patientId || !facilityId) {
      return res.status(400).json({ 
        error: 'Patient ID and Facility ID are required' 
      });
    }

    const paymentService = getPaymentService();
    
    const result = await paymentService.processPayment({
      userId,
      amount: parseFloat(amount),
      currency,
      paymentMethod,
      description: description || 'Healthcare payment',
      patientId,
      facilityId,
      providerId,
      idempotencyKey,
      metadata,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error: any) {
    logger.error("Payment processing error", { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refund', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    
    if (!idempotencyKey) {
      return res.status(400).json({ 
        error: 'Idempotency-Key header is required for refund operations' 
      });
    }

    const { paymentId, reason } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Refund reason is required' });
    }

    const paymentService = getPaymentService();
    
    const result = await paymentService.refundPayment(
      paymentId,
      userId,
      reason,
      idempotencyKey
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error: any) {
    logger.error("Refund processing error", { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/webhook/stripe', async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const stripe = getStripeClient();
    const webhookSecret = getWebhookSecret();
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      logger.error("Webhook signature verification failed", {
        error: err.message,
      });
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const paymentService = getPaymentService();
    await paymentService.handleStripeWebhook(event);

    res.json({ received: true });
  } catch (error: any) {
    logger.error("Webhook processing error", { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
