import { Router } from "express";
import {
  auditContractCode,
  auditContractABI,
} from "../controllers/auditController";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

/**
 * @route POST /api/audit/code
 * @desc Audit smart contract source code
 * @access Private (Admin only)
 */
router.post(
  "/code",
  authenticateToken,
  requireRole(["ADMIN"]),
  auditContractCode,
);

/**
 * @route POST /api/audit/abi
 * @desc Audit smart contract ABI
 * @access Private (Admin only)
 */
router.post(
  "/abi",
  authenticateToken,
  requireRole(["ADMIN"]),
  auditContractABI,
);

export default router;
