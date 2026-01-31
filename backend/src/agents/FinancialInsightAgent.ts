import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../app";
import { logger } from "../utils/logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class FinancialInsightAgent {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  async analyzeTransactions(userId: string) {
    try {
      const transactions = await prisma.payment.findMany({
        where: { createdBy: userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      if (transactions.length === 0) {
        return "No transaction history found to analyze.";
      }

      const summary = transactions.map((t) => ({
        amount: t.amount,
        method: t.paymentMethod,
        status: t.status,
        date: t.createdAt,
        description: t.description,
      }));

      const prompt = `Analyze the following financial transactions and provide 3 key insights and 2 recommendations for the user. Keep it concise and professional.
      Transactions: ${JSON.stringify(summary)}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error("Error in FinancialInsightAgent:", error);
      throw new Error("Failed to generate financial insights");
    }
  }

  async predictCashFlow(userId: string) {
    // Advanced cash flow prediction logic using AI
    try {
      const transactions = await prisma.payment.findMany({
        where: { createdBy: userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      const prompt = `Based on these transactions, predict the cash flow for the next 30 days. Identify any potential shortfalls or surplus periods.
      Transactions: ${JSON.stringify(transactions)}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error("Error predicting cash flow:", error);
      throw new Error("Failed to predict cash flow");
    }
  }
}

export const financialInsightAgent = new FinancialInsightAgent();
