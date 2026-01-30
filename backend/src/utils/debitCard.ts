import { logger } from "./logger";
import { PaymentMethod } from "@prisma/client";

export interface DebitCardData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  pin?: string;
  cardholderName: string;
  billingZip: string;
}

export interface HSAFSAData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  planType: "HSA" | "FSA";
  availableBalance?: number;
}

export interface DebitProcessingResult {
  success: boolean;
  transactionId?: string | undefined;
  fee: number;
  settledAmount: number;
  settlementDate: Date;
  error?: string | undefined;
}

/**
 * Process debit card payment with lower fees and faster settlement
 */
export const processDebitCard = async (
  cardData: DebitCardData,
  amount: number,
  description: string,
): Promise<DebitProcessingResult> => {
  try {
    logger.info(`Processing debit card payment: $${amount}`);

    // Debit card processing fee (1.5% + $0.10)
    const processingFee = Math.max(amount * 0.015, 0.1);
    const settledAmount = amount - processingFee;

    // Verify PIN if provided
    if (cardData.pin) {
      const pinValid = await verifyPIN(cardData.pin, cardData.cardNumber);
      if (!pinValid) {
        return {
          success: false,
          fee: 0,
          settledAmount: 0,
          settlementDate: new Date(),
          error: "Invalid PIN",
        };
      }
    }

    // Check available balance
    const balanceCheck = await checkBalance(cardData.cardNumber, amount);
    if (!balanceCheck.sufficient) {
      return {
        success: false,
        fee: 0,
        settledAmount: 0,
        settlementDate: new Date(),
        error: "Insufficient funds",
      };
    }

    // Process through Stripe (or other processor)
    const transactionResult = await processStripePayment({
      card: cardData,
      amount: Math.round(amount * 100), // Convert to cents
      description,
      debit: true,
    });

    if (transactionResult.success) {
      // Debit cards settle faster (2-3 business days)
      const settlementDate = new Date();
      settlementDate.setDate(settlementDate.getDate() + 2);

      logger.info(
        `Debit card processed successfully: ${transactionResult.transactionId}`,
      );

      return {
        success: true,
        transactionId: transactionResult.transactionId,
        fee: processingFee,
        settledAmount,
        settlementDate,
      };
    } else {
      return {
        success: false,
        fee: 0,
        settledAmount: 0,
        settlementDate: new Date(),
        error: transactionResult.error,
      };
    }
  } catch (error) {
    logger.error("Error processing debit card:", error);
    return {
      success: false,
      fee: 0,
      settledAmount: 0,
      settlementDate: new Date(),
      error: "Processing failed",
    };
  }
};

/**
 * Process HSA/FSA card with healthcare-specific validation
 */
export const processHSAFSA = async (
  cardData: HSAFSAData,
  amount: number,
  description: string,
  isMedicalExpense: boolean,
): Promise<DebitProcessingResult> => {
  try {
    logger.info(`Processing ${cardData.planType} card payment: $${amount}`);

    // HSA/FSA processing fee (1.2% + $0.05 - even lower!)
    const processingFee = Math.max(amount * 0.012, 0.05);
    const settledAmount = amount - processingFee;

    // Validate it's a medical expense if using HSA/FSA
    if (!isMedicalExpense) {
      return {
        success: false,
        fee: 0,
        settledAmount: 0,
        settlementDate: new Date(),
        error: "HSA/FSA cards can only be used for medical expenses",
      };
    }

    // Check available balance
    if (cardData.availableBalance && cardData.availableBalance < amount) {
      return {
        success: false,
        fee: 0,
        settledAmount: 0,
        settlementDate: new Date(),
        error: "Insufficient HSA/FSA funds",
      };
    }

    // Process with HSA/FSA specific logic
    const transactionResult = await processHSAFSAPayment({
      card: cardData,
      amount: Math.round(amount * 100),
      description,
      planType: cardData.planType,
    });

    if (transactionResult.success) {
      // HSA/FSA cards settle even faster (1-2 business days)
      const settlementDate = new Date();
      settlementDate.setDate(settlementDate.getDate() + 1);

      logger.info(
        `${cardData.planType} card processed successfully: ${transactionResult.transactionId}`,
      );

      return {
        success: true,
        transactionId: transactionResult.transactionId,
        fee: processingFee,
        settledAmount,
        settlementDate,
      };
    } else {
      return {
        success: false,
        fee: 0,
        settledAmount: 0,
        settlementDate: new Date(),
        error: transactionResult.error,
      };
    }
  } catch (error) {
    logger.error(`Error processing ${cardData.planType} card:`, error);
    return {
      success: false,
      fee: 0,
      settledAmount: 0,
      settlementDate: new Date(),
      error: "Processing failed",
    };
  }
};

/**
 * Verify PIN for debit card transactions
 */
const verifyPIN = async (pin: string, cardNumber: string): Promise<boolean> => {
  try {
    // In production, this would integrate with your payment processor
    // For demo purposes, we'll simulate PIN verification
    logger.info(`Verifying PIN for card: ****${cardNumber.slice(-4)}`);

    // Simulate PIN verification (90% success rate for demo)
    return Math.random() > 0.1;
  } catch (error) {
    logger.error("PIN verification failed:", error);
    return false;
  }
};

/**
 * Check available balance on debit card
 */
const checkBalance = async (
  cardNumber: string,
  amount: number,
): Promise<{ sufficient: boolean; balance?: number }> => {
  try {
    // In production, this would check with the bank
    // For demo purposes, we'll simulate balance checking
    logger.info(`Checking balance for card: ****${cardNumber.slice(-4)}`);

    // Simulate balance check (80% sufficient for demo)
    const sufficient = Math.random() > 0.2;
    const balance = sufficient ? amount + Math.random() * 1000 : amount * 0.5;

    return { sufficient, balance };
  } catch (error) {
    logger.error("Balance check failed:", error);
    return { sufficient: false };
  }
};

/**
 * Process payment through Stripe with debit card optimization
 */
const processStripePayment = async (data: {
  card: DebitCardData;
  amount: number;
  description: string;
  debit: boolean;
}): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    // In production, this would use Stripe's API
    logger.info(
      `Processing ${data.debit ? "debit" : "credit"} card payment: $${data.amount / 100}`,
    );

    // Simulate Stripe processing (95% success rate)
    if (Math.random() > 0.05) {
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return { success: true, transactionId };
    } else {
      return { success: false, error: "Payment declined" };
    }
  } catch (error) {
    logger.error("Stripe processing failed:", error);
    return { success: false, error: "Processor error" };
  }
};

/**
 * Process HSA/FSA payment with healthcare-specific rules
 */
const processHSAFSAPayment = async (data: {
  card: HSAFSAData;
  amount: number;
  description: string;
  planType: "HSA" | "FSA";
}): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    // In production, this would use a specialized HSA/FSA processor
    logger.info(`Processing ${data.planType} payment: $${data.amount / 100}`);

    // Simulate HSA/FSA processing (98% success rate - higher than regular cards)
    if (Math.random() > 0.02) {
      const transactionId = `hsa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return { success: true, transactionId };
    } else {
      return { success: false, error: "HSA/FSA payment declined" };
    }
  } catch (error) {
    logger.error("HSA/FSA processing failed:", error);
    return { success: false, error: "Processor error" };
  }
};

/**
 * Get processing fee based on payment method
 */
export const getProcessingFee = (
  method: PaymentMethod,
  amount: number,
): number => {
  switch (method) {
    case PaymentMethod.CREDIT_CARD:
      return Math.max(amount * 0.029, 0.3); // 2.9% + $0.30
    case PaymentMethod.DEBIT_CARD:
      return Math.max(amount * 0.015, 0.1); // 1.5% + $0.10
    case PaymentMethod.HSA_CARD:
    case PaymentMethod.FSA_CARD:
      return Math.max(amount * 0.012, 0.05); // 1.2% + $0.05
    case PaymentMethod.ACH:
      return Math.max(amount * 0.008, 0.25); // 0.8% + $0.25
    case PaymentMethod.CRYPTO:
      return amount * 0.01; // 1% flat fee
    default:
      return 0;
  }
};

/**
 * Get settlement time based on payment method
 */
export const getSettlementDays = (method: PaymentMethod): number => {
  switch (method) {
    case PaymentMethod.CREDIT_CARD:
      return 5; // 5 business days
    case PaymentMethod.DEBIT_CARD:
      return 2; // 2 business days
    case PaymentMethod.HSA_CARD:
    case PaymentMethod.FSA_CARD:
      return 1; // 1 business day
    case PaymentMethod.ACH:
      return 3; // 3 business days
    case PaymentMethod.CRYPTO:
      return 0; // Instant
    default:
      return 5;
  }
};
