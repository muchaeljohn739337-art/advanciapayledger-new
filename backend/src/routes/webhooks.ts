import { Router } from "express";
import { webhookController } from "../controllers/webhooks.controller";
import { validateWebhookSignature } from "../middleware/webhookAuth";

const router = Router();

// Stripe webhook endpoint
router.post("/stripe", validateWebhookSignature, webhookController.stripeWebhook);

// Crypto payment webhooks
router.post("/crypto/solana", webhookController.solanaWebhook);
router.post("/crypto/ethereum", webhookController.ethereumWebhook);
router.post("/crypto/polygon", webhookController.polygonWebhook);

export { router as webhookRoutes };
