import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface AuditVulnerability {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  description: string;
  location?: string;
  recommendation: string;
}

export interface SmartContractAuditResult {
  score: number; // 0-100
  summary: string;
  vulnerabilities: AuditVulnerability[];
  isSafe: boolean;
  auditedAt: Date;
}

export class SmartContractAuditorAgent {
  private model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  /**
   * Audit smart contract source code for vulnerabilities
   */
  async auditContract(
    contractName: string,
    sourceCode: string
  ): Promise<SmartContractAuditResult> {
    try {
      const prompt = `
        You are an expert Web3 Security Auditor. Analyze the following Solidity smart contract code for vulnerabilities, logic errors, and security best practices.
        
        CONTRACT NAME: ${contractName}
        SOURCE CODE:
        ${sourceCode}
        
        Return a detailed audit report in JSON format with:
        {
          "score": number (0-100, where 100 is perfectly secure),
          "summary": "overall executive summary",
          "vulnerabilities": [
            {
              "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
              "title": "short vulnerability title",
              "description": "detailed description of the issue",
              "location": "line number or function name",
              "recommendation": "how to fix this"
            }
          ],
          "isSafe": boolean (true if score > 80 and no CRITICAL/HIGH vulnerabilities)
        }
        
        Focus on: Reentrancy, Overflow/Underflow, Access Control, Gas Optimization, and Logical Flaws.
        Only return the JSON object.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean up markdown code blocks if Gemini returns them
      const jsonStr = text.replace(/```json|```/gi, "").trim();
      const parsed = JSON.parse(jsonStr);

      return {
        ...parsed,
        auditedAt: new Date(),
      } as SmartContractAuditResult;
    } catch (error) {
      logger.error("Smart Contract Auditor Agent Error:", error);
      throw new Error("Failed to audit smart contract code");
    }
  }

  /**
   * Audit contract based on ABI (limited analysis)
   */
  async auditABI(abi: any): Promise<string> {
    try {
      const prompt = `
        Analyze this Smart Contract ABI for potential interface issues or suspicious function signatures.
        ABI: ${JSON.stringify(abi)}
        
        Provide a concise security overview.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error("ABI Audit Error:", error);
      throw new Error("Failed to audit contract ABI");
    }
  }
}

export const smartContractAuditorAgent = new SmartContractAuditorAgent();
