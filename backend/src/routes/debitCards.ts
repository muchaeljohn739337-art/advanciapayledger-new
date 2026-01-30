import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  processDebitCard,
  processHSAFSA,
  getProcessingFee,
  getSettlementDays,
  DebitCardData,
  HSAFSAData,
} from "../utils/debitCard";
import { logger } from "../utils/logger";

const router = Router();

// Validation middleware
const validateDebitCard = [
  body("cardNumber").isLength({ min: 16, max: 16 }).isNumeric(),
  body("expiryDate").matches(/^(0[1-9]|1[0-2])\/\d{2}$/),
  body("cvv").isLength({ min: 3, max: 4 }).isNumeric(),
  body("cardholderName").isLength({ min: 3, max: 100 }),
  body("billingZip").isPostalCode("US"),
  body("pin").optional().isLength({ min: 4, max: 6 }).isNumeric(),
];

const validateHSAFSA = [
  body("cardNumber").isLength({ min: 16, max: 16 }).isNumeric(),
  body("expiryDate").matches(/^(0[1-9]|1[0-2])\/\d{2}$/),
  body("cvv").isLength({ min: 3, max: 4 }).isNumeric(),
  body("cardholderName").isLength({ min: 3, max: 100 }),
  body("planType").isIn(["HSA", "FSA"]),
  body("availableBalance").optional().isNumeric(),
];

/**
 * Verify debit card PIN
 */
router.post(
  "/verify-pin",
  authenticateToken,
  [
    body("cardNumber").isLength({ min: 16, max: 16 }).isNumeric(),
    body("pin").isLength({ min: 4, max: 6 }).isNumeric(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { cardNumber, pin } = req.body;

      // In production, this would verify with the payment processor
      // For demo, we'll simulate PIN verification
      const isValid = Math.random() > 0.1; // 90% success rate

      logger.info(
        `PIN verification for card: ****${cardNumber.slice(-4)} - ${isValid ? "Success" : "Failed"}`,
      );

      res.json({
        valid: isValid,
        maskedCard: `****${cardNumber.slice(-4)}`,
      });
    } catch (error) {
      logger.error("PIN verification error:", error);
      res.status(500).json({ error: "PIN verification failed" });
    }
  },
);

/**
 * Check debit card balance
 */
router.post(
  "/check-balance",
  authenticateToken,
  [
    body("cardNumber").isLength({ min: 16, max: 16 }).isNumeric(),
    body("amount").isNumeric().isFloat({ min: 0.01 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { cardNumber, amount } = req.body;

      // Simulate balance check
      const sufficient = Math.random() > 0.2; // 80% sufficient
      const balance = sufficient ? amount + Math.random() * 1000 : amount * 0.5;

      logger.info(
        `Balance check for card: ****${cardNumber.slice(-4)} - $${amount} - ${sufficient ? "Sufficient" : "Insufficient"}`,
      );

      res.json({
        sufficient,
        balance: Math.round(balance * 100) / 100,
        maskedCard: `****${cardNumber.slice(-4)}`,
        checkedAt: new Date(),
      });
    } catch (error) {
      logger.error("Balance check error:", error);
      res.status(500).json({ error: "Balance check failed" });
    }
  },
);

/**
 * Process debit card payment
 */
router.post(
  "/process",
  authenticateToken,
  validateDebitCard,
  [
    body("amount").isNumeric().isFloat({ min: 0.01 }),
    body("description").isLength({ min: 3, max: 500 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount, description, cardData } = req.body;

      const result = await processDebitCard(cardData, amount, description);

      if (result.success) {
        logger.info(
          `Debit card processed: $${amount} - ${result.transactionId}`,
        );
        res.json({
          success: true,
          transactionId: result.transactionId,
          fee: result.fee,
          settledAmount: result.settledAmount,
          settlementDate: result.settlementDate,
          maskedCard: `****${cardData.cardNumber.slice(-4)}`,
        });
      } else {
        logger.error(`Debit card failed: ${result.error}`);
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error("Debit card processing error:", error);
      res.status(500).json({ error: "Debit card processing failed" });
    }
  },
);

/**
 * Process HSA/FSA card payment
 */
router.post(
  "/process-hsafsa",
  authenticateToken,
  validateHSAFSA,
  [
    body("amount").isNumeric().isFloat({ min: 0.01 }),
    body("description").isLength({ min: 3, max: 500 }),
    body("isMedicalExpense").isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { amount, description, cardData, isMedicalExpense } = req.body;

      const result = await processHSAFSA(
        cardData,
        amount,
        description,
        isMedicalExpense,
      );

      if (result.success) {
        logger.info(
          `${cardData.planType} card processed: $${amount} - ${result.transactionId}`,
        );
        res.json({
          success: true,
          transactionId: result.transactionId,
          fee: result.fee,
          settledAmount: result.settledAmount,
          settlementDate: result.settlementDate,
          planType: cardData.planType,
          maskedCard: `****${cardData.cardNumber.slice(-4)}`,
        });
      } else {
        logger.error(`${cardData.planType} card failed: ${result.error}`);
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      logger.error("HSA/FSA processing error:", error);
      res.status(500).json({ error: "HSA/FSA processing failed" });
    }
  },
);

/**
 * Get processing fees for all payment methods
 */
router.get("/fees", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { amount } = req.query;

    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: "Valid amount required" });
    }

    const amt = Number(amount);
    const fees = {
      CREDIT_CARD: getProcessingFee("CREDIT_CARD", amt),
      DEBIT_CARD: getProcessingFee("DEBIT_CARD", amt),
      HSA_CARD: getProcessingFee("HSA_CARD", amt),
      FSA_CARD: getProcessingFee("FSA_CARD", amt),
      ACH: getProcessingFee("ACH", amt),
      CRYPTO: getProcessingFee("CRYPTO", amt),
    };

    return res.json({
      amount: amt,
      fees,
      savings: {
        debitVsCredit: fees.CREDIT_CARD - fees.DEBIT_CARD,
        hsaFsaVsCredit: fees.CREDIT_CARD - fees.HSA_CARD,
      },
    });
  } catch (error) {
    logger.error("Fee calculation error:", error);
    res.status(500).json({ error: "Fee calculation failed" });
  }
});

/**
 * Get settlement times for all payment methods
 */
router.get(
  "/settlement-times",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const settlementTimes = {
        CREDIT_CARD: getSettlementDays("CREDIT_CARD"),
        DEBIT_CARD: getSettlementDays("DEBIT_CARD"),
        HSA_CARD: getSettlementDays("HSA_CARD"),
        FSA_CARD: getSettlementDays("FSA_CARD"),
        ACH: getSettlementDays("ACH"),
        CRYPTO: getSettlementDays("CRYPTO"),
      };

      res.json(settlementTimes);
    } catch (error) {
      logger.error("Settlement time error:", error);
      res.status(500).json({ error: "Settlement time calculation failed" });
    }
  },
);

/**
 * Get debit card statistics (admin only)
 */
router.get(
  "/stats",
  authenticateToken,
  requireRole(["ADMIN"]),
  async (req: Request, res: Response) => {
    try {
      // In production, this would query your database
      const stats = {
        totalDebitTransactions: 1250,
        totalHSAFSATransactions: 340,
        averageDebitAmount: 125.5,
        averageHSAFSAAmount: 285.75,
        successRate: {
          debit: 0.95,
          hsaFsa: 0.98,
        },
        monthlyGrowth: 0.15,
        feeSavings: 2840.5,
      };

      return res.json(stats);
    } catch (error) {
      logger.error("Debit card stats error:", error);
      res.status(500).json({ error: "Failed to get debit card statistics" });
    }
  },
);

export { router as debitCardRoutes };
