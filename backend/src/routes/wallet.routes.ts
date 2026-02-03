import { Router } from "express";
import { walletController } from "../controllers/wallet.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", walletController.getWallet);
router.put("/balance", walletController.updateBalance);

export { router as walletRoutes };
