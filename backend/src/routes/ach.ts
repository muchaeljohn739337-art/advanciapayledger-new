import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  processACHTransfer,
  getACHFee,
  getACHSettlementDays,
  ACHTransferData,
} from "../utils/achTransfer";
import { logger } from "../utils/logger";

const router = Router();

// Validation middleware
const validateACHTransfer = [
  body("routingNumber").isLength({ min: 9, max: 9 }).isNumeric(),
  body("accountNumber").isLength({ min: 4, max: 17 }).isNumeric(),
  body("accountType").isIn(["checking", "savings"]),
  body("accountHolderName").isLength({ min: 3, max: 100 }),
  body("authorization").isLength({ min: 10, max: 500 }),
];

/**
 * Verify routing number
 */
router.post(
  "/verify-routing",
  authenticateToken,
  [body("routingNumber").isLength({ min: 9, max: 9 }).isNumeric()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { routingNumber } = req.body;

      // In production, this would verify with routing number database
      // For demo, we'll simulate validation
      const isValid = /^\d{9}$/.test(routingNumber.replace(/[\s-]/g, ""));

      logger.info(
        `Routing number verification: ${routingNumber} - ${isValid ? "Valid" : "Invalid"}`,
      );

      res.json({
        valid: isValid,
        routingNumber: routingNumber.replace(/[\s-]/g, ""),
        maskedRouting: `***${routingNumber.slice(-3)}`,
      });
    } catch (error) {
      logger.error("Routing number verification error:", error);
      res.status(500).json({ error: "Routing number verification failed" });
    }
  },
);

/**
 * Verify bank account details
 */
router.post(
  "/verify-account",
  authenticateToken,
  [
    body("routingNumber").isLength({ min: 9, max: 9 }).isNumeric(),
    body("accountNumber").isLength({ min: 4, max: 17 }).isNumeric(),
    body("accountType").isIn(["checking", "savings"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { routingNumber, accountNumber, accountType } = req.body;

      // Simulate bank account verification
      const valid = Math.random() > 0.05; // 95% success rate
      const bankNames = [
        "Bank of America",
        "Chase",
        "Wells Fargo",
        "Citibank",
        "U.S. Bank",
        "PNC Bank",
        "Capital One",
        "TD Bank",
      ];
      const bankName = valid
        ? bankNames[Math.floor(Math.random() * bankNames.length)]
        : undefined;

      logger.info(
        `Account verification: ****${accountNumber.slice(-4)} - ${valid ? "Valid" : "Invalid"}`,
      );

      res.json({
        valid,
        bankName: bankName,
        accountType,
        maskedAccount: `****${accountNumber.slice(-4)}`,
        maskedRouting: `***${routingNumber.slice(-3)}`,
        verifiedAt: new Date(),
      });
    } catch (error) {
      logger.error("Account verification error:", error);
      res.status(500).json({ error: "Account verification failed" });
    }
  },
);

/**
 * Process ACH transfer
 */
router.post(
  "/process",
  authenticateToken,
  validateACHTransfer,
  [
    body("amount").isNumeric().isFloat({ min: 0.01 }),
    body("description").isLength({ min: 3, max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount, description, achData } = req.body;

      const result = await processACHTransfer(achData, amount, description);

      if (result.success) {
        logger.info(
          `ACH transfer processed: $${amount} - ${result.transactionId}`,
        );
        res.json({
          success: true,
          transactionId: result.transactionId,
          fee: result.fee,
          settledAmount: result.settledAmount,
          settlementDate: result.settlementDate,
          maskedAccount: `****${achData.accountNumber.slice(-4)}`,
          maskedRouting: `***${achData.routingNumber.slice(-3)}`,
        });
      } else {
        logger.error(`ACH transfer failed: ${result.error}`);
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error("ACH processing error:", error);
      res.status(500).json({ error: "ACH processing failed" });
    }
  },
);

/**
 * Get ACH processing fee
 */
router.get("/fee", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { amount } = req.query;

    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: "Valid amount required" });
    }

    const amt = Number(amount);
    const fee = getACHFee(amt);

    res.json({
      amount: amt,
      fee,
      effectiveRate: (fee / amt) * 100,
      settlementDays: getACHSettlementDays(),
    });
  } catch (error) {
    logger.error("ACH fee calculation error:", error);
    res.status(500).json({ error: "Fee calculation failed" });
  }
});

/**
 * Get ACH transfer statistics (admin only)
 */
router.get(
  "/stats",
  authenticateToken,
  requireRole(["ADMIN"]),
  async (req: Request, res: Response) => {
    try {
      // In production, this would query your database
      const stats = {
        totalACHTransactions: 890,
        averageAmount: 485.25,
        successRate: 0.98,
        monthlyGrowth: 0.22,
        feeSavings: 3420.75,
        topBanks: [
          { name: "Bank of America", count: 245 },
          { name: "Chase", count: 189 },
          { name: "Wells Fargo", count: 156 },
          { name: "Citibank", count: 98 },
          { name: "U.S. Bank", count: 76 },
        ],
        accountTypes: {
          checking: 0.72,
          savings: 0.28,
        },
      };

      res.json(stats);
    } catch (error) {
      logger.error("ACH stats error:", error);
      res.status(500).json({ error: "Failed to get ACH statistics" });
    }
  },
);

/**
 * Test routing number validation (for development)
 */
router.post("/test-routing", async (req: Request, res: Response) => {
  try {
    const { routingNumber } = req.body;

    // Test with the routing number from your image: 124303162
    const testNumbers = {
      "124303162": { valid: true, bank: "GO2BANK" },
      "021000021": { valid: true, bank: "Bank of America" },
      "111000025": { valid: true, bank: "Chase" },
      "121000248": { valid: true, bank: "Wells Fargo" },
    };

    const result = testNumbers[routingNumber] || { valid: false, bank: null };

    res.json({
      routingNumber,
      ...result,
      note: "This is a test endpoint for development",
    });
  } catch (error) {
    logger.error("Test routing error:", error);
    res.status(500).json({ error: "Test failed" });
  }
});

export { router as achRoutes };
