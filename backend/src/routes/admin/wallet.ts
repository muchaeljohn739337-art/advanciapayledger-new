import { Router } from "express";
import { walletController } from "../../controllers/wallet.controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router = Router();

router.use(authenticate, requireRole(["ADMIN"]));

router.post("/transfer", walletController.executeTransfer);
router.get("/details", walletController.getWalletDetails);
router.get("/history", walletController.getTransferHistory);
router.post("/notify-accountant", walletController.notifyAccountant);

export { router as adminWalletRoutes };
