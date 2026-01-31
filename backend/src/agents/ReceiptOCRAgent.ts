import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ParsedReceipt {
  merchantName: string;
  date: string;
  totalAmount: number;
  currency: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  category: string;
  confidence: number;
}

export class ReceiptOCRAgent {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  /**
   * Parse a receipt from an image buffer
   */
  async parseReceipt(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<ParsedReceipt> {
    try {
      const prompt = `
        Analyze this receipt image and extract the following details in JSON format:
        - merchantName: Name of the store or provider
        - date: Date of the transaction (YYYY-MM-DD)
        - totalAmount: Total amount paid (as a number)
        - currency: Currency symbol or code (e.g., USD, EUR)
        - items: Array of objects with { "description": string, "amount": number }
        - category: One of [Medical, Supplies, Travel, Meals, Utilities, Other]
        
        Only return the JSON object.
      `;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Clean up markdown code blocks if Gemini returns them
      const jsonStr = text.replace(/```json|```/gi, "").trim();
      const parsed = JSON.parse(jsonStr);

      return {
        ...parsed,
        confidence: 0.95, // Gemini is usually very high confidence
      } as ParsedReceipt;
    } catch (error) {
      logger.error("Receipt OCR Agent Error:", error);
      throw new Error("Failed to parse receipt image");
    }
  }
}

export const receiptOCRAgent = new ReceiptOCRAgent();
