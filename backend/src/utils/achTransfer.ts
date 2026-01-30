import { logger } from "./logger";

export interface ACHTransferData {
  routingNumber: string;
  accountNumber: string;
  accountType: "checking" | "savings";
  accountHolderName: string;
  authorization: string; // Customer authorization for ACH
}

export interface ACHProcessingResult {
  success: boolean;
  transactionId: string | undefined;
  fee: number;
  settledAmount: number;
  settlementDate: Date;
  error: string | undefined;
}

/**
 * Process ACH bank transfer with routing and account numbers
 */
export const processACHTransfer = async (
  achData: ACHTransferData,
  amount: number,
  description: string,
): Promise<ACHProcessingResult> => {
  try {
    logger.info(`Processing ACH transfer: $${amount}`);

    // ACH processing fee (0.8% + $0.25 - lowest fee!)
    const processingFee = Math.max(amount * 0.008, 0.25);
    const settledAmount = amount - processingFee;

    // Validate routing number (must be 9 digits)
    if (!isValidRoutingNumber(achData.routingNumber)) {
      return {
        success: false,
        transactionId: undefined,
        fee: 0,
        settledAmount: 0,
        settlementDate: new Date(),
        error: "Invalid routing number",
      };
    }

    // Validate account number
    if (!achData.accountNumber || achData.accountNumber.length < 4) {
      return {
        success: false,
        transactionId: undefined,
        fee: 0,
        settledAmount: 0,
        settlementDate: new Date(),
        error: "Invalid account number",
      };
    }

    // Verify bank account (in production, this would use Plaid or similar)
    const accountVerification = await verifyBankAccount(achData);
    if (!accountVerification.valid) {
      return {
        success: false,
        transactionId: undefined,
        fee: 0,
        settledAmount: 0,
        settlementDate: new Date(),
        error: "Account verification failed",
      };
    }

    // Process ACH transfer
    const transactionResult = await processACHPayment({
      ach: achData,
      amount: Math.round(amount * 100), // Convert to cents
      description,
    });

    if (transactionResult.success) {
      // ACH transfers take 3 business days to settle
      const settlementDate = new Date();
      let businessDays = 0;
      while (businessDays < 3) {
        settlementDate.setDate(settlementDate.getDate() + 1);
        if (settlementDate.getDay() !== 0 && settlementDate.getDay() !== 6) {
          businessDays++;
        }
      }

      logger.info(
        `ACH transfer processed successfully: ${transactionResult.transactionId}`,
      );

      return {
        success: true,
        transactionId: transactionResult.transactionId,
        fee: processingFee,
        settledAmount,
        settlementDate,
        error: undefined,
      };
    } else {
      return {
        success: false,
        transactionId: undefined,
        fee: 0,
        settledAmount: 0,
        settlementDate: new Date(),
        error: transactionResult.error,
      };
    }
  } catch (error) {
    logger.error("Error processing ACH transfer:", error);
    return {
      success: false,
      transactionId: undefined,
      fee: 0,
      settledAmount: 0,
      settlementDate: new Date(),
      error: "ACH processing failed",
    };
  }
};

/**
 * Validate US routing number
 */
const isValidRoutingNumber = (routingNumber: string): boolean => {
  // Remove any spaces or dashes
  const cleanNumber = routingNumber.replace(/[\s-]/g, "");

  // Must be exactly 9 digits
  if (!/^\d{9}$/.test(cleanNumber)) {
    return false;
  }

  // Checksum validation (standard algorithm)
  const digits = cleanNumber.split("").map(Number);
  if (digits.length !== 9) return false;
  const checksum =
    (3 * (digits[0]! + digits[3]! + digits[6]!) +
      7 * (digits[1]! + digits[4]! + digits[7]!) +
      (digits[2]! + digits[5]! + digits[8]!)) %
    10;

  return checksum === 0;
};

/**
 * Verify bank account details
 */
const verifyBankAccount = async (
  achData: ACHTransferData,
): Promise<{ valid: boolean; bankName?: string }> => {
  try {
    logger.info(
      `Verifying bank account: ****${achData.accountNumber.slice(-4)}`,
    );

    // In production, this would use Plaid, Stripe ACH, or similar service
    // For demo purposes, we'll simulate verification (95% success rate)
    const valid = Math.random() > 0.05;

    // Simulate bank name lookup based on routing number
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

    return { valid, bankName: bankName || undefined };
  } catch (error) {
    logger.error("Bank account verification failed:", error);
    return { valid: false };
  }
};

/**
 * Process ACH payment through payment processor
 */
const processACHPayment = async (data: {
  ach: ACHTransferData;
  amount: number;
  description: string;
}): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    // In production, this would use Stripe ACH, Plaid, or similar
    logger.info(`Processing ACH payment: $${data.amount / 100}`);

    // Simulate ACH processing (98% success rate - very reliable)
    if (Math.random() > 0.02) {
      const transactionId = `ach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return { success: true, transactionId };
    } else {
      return { success: false, error: "ACH transfer declined" };
    }
  } catch (error) {
    logger.error("ACH processing failed:", error);
    return { success: false, error: "ACH processor error" };
  }
};

/**
 * Get ACH processing fee
 */
export const getACHFee = (amount: number): number => {
  return Math.max(amount * 0.008, 0.25); // 0.8% + $0.25 minimum
};

/**
 * Get ACH settlement days
 */
export const getACHSettlementDays = (): number => {
  return 3; // 3 business days
};
