import { Router } from "express";
import { walletController } from "../controllers/wallet.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", walletController.getWallet);

export { router as walletRoutes };
