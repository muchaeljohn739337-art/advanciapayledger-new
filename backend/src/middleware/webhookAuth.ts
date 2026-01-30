import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Validate Stripe webhook signatures
 */
export const validateWebhookSignature = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const signature = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res
      .status(400)
      .json({ error: "Missing webhook signature or secret" });
  }

  try {
    // Verify the webhook signature
    const body = req.body;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(body))
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    next();
  } catch (error) {
    console.error("Webhook signature validation error:", error);
    return res
      .status(400)
      .json({ error: "Webhook signature validation failed" });
  }
};
