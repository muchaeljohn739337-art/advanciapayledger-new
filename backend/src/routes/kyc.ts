import { Router } from "express";
import { authenticate } from "../middleware/auth";
import kycService from "../services/kyc-stripe";
import { logger } from "../utils/logger";

const router = Router();

router.post("/verify", authenticate, async (req, res) => {
  try {
    const session = await kycService.createVerificationSession(req.user.id);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        clientSecret: session.client_secret,
        url: session.url,
      },
    });
  } catch (error) {
    logger.error("KYC verification error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to create verification session",
    });
  }
});

router.get("/status", authenticate, async (req, res) => {
  try {
    const status = await kycService.getUserVerificationStatus(req.user.id);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error("KYC status check error", { error });
    res.status(500).json({
      success: false,
      error: "Failed to check verification status",
    });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    await kycService.handleWebhook(req.body);
    res.json({ success: true });
  } catch (error) {
    logger.error("KYC webhook error", { error });
    res.status(500).json({ success: false });
  }
});

export default router;
