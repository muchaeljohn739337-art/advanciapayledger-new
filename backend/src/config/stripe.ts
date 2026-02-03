import Stripe from 'stripe';
import { logger } from "../utils/logger";

let stripeClient: Stripe | null = null;

export const getStripeClient = (): Stripe => {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    stripeClient = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
      maxNetworkRetries: 3,
      timeout: 30000,
    });

    logger.info("Stripe client initialized");
  }

  return stripeClient;
};

export const getWebhookSecret = (): string => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
  }

  return webhookSecret;
};

export default getStripeClient;
