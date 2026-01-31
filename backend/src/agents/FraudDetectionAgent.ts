import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../app";
import { logger } from "../utils/logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface FraudAnalysisResult {
  isSuspicious: boolean;
  riskScore: number; // 0-100
  reason?: string;
  recommendation?: string;
}

export class FraudDetectionAgent {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  /**
   * Analyze a single transaction for potential fraud
   */
  async analyzeTransaction(
    userId: string,
    amount: number,
    currency: string,
    description: string,
    metadata?: any
  ): Promise<FraudAnalysisResult> {
    try {
      // Get user's recent transaction history for context
      const recentTransactions = await prisma.payment.findMany({
        where: { createdBy: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const prompt = `
        Analyze this new transaction for potential fraud based on the user's history.
        User History (last 10): ${JSON.stringify(recentTransactions)}
        
        NEW TRANSACTION:
        Amount: ${amount} ${currency}
        Description: ${description}
        Metadata: ${JSON.stringify(metadata)}
        
        Return a JSON response with:
        {
          "isSuspicious": boolean,
          "riskScore": number (0-100),
          "reason": "short explanation",
          "recommendation": "ACTION or MONITOR or ALLOW"
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean up markdown code blocks if Gemini returns them
      const jsonStr = text.replace(/```json|```/gi, "").trim();
      return JSON.parse(jsonStr) as FraudAnalysisResult;
    } catch (error) {
      logger.error("Fraud Detection Agent Error:", error);
      // Fail safe: if AI fails, allow the transaction but log the error
      return {
        isSuspicious: false,
        riskScore: 0,
        reason: "Fraud analysis unavailable",
        recommendation: "ALLOW"
      };
    }
  }

  /**
   * Batch analyze user behavior
   */
  async analyzeUserBehavior(userId: string): Promise<string> {
    try {
      const transactions = await prisma.payment.findMany({
        where: { createdBy: userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const prompt = `
        Analyze the overall financial behavior of this user for patterns indicative of money laundering, structuring, or account takeover.
        Transactions: ${JSON.stringify(transactions)}
        
        Provide a concise security summary and risk rating.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error("User Behavior Analysis Error:", error);
      throw new Error("Failed to analyze user behavior");
    }
  }
}

export const fraudDetectionAgent = new FraudDetectionAgent();
