import { Request, Response } from "express";
import { smartContractAuditorAgent } from "../agents/SmartContractAuditorAgent";
import { logger } from "../utils/logger";

/**
 * Audit a smart contract source code
 */
export const auditContractCode = async (req: Request, res: Response) => {
  try {
    const { contractName, sourceCode } = req.body;

    if (!contractName || !sourceCode) {
      return res.status(400).json({ error: "Missing contractName or sourceCode" });
    }

    logger.info(`Starting audit for contract: ${contractName}`);

    const result = await smartContractAuditorAgent.auditContract(
      contractName,
      sourceCode
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error during contract audit:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error during contract audit",
    });
  }
};

/**
 * Audit a smart contract ABI
 */
export const auditContractABI = async (req: Request, res: Response) => {
  try {
    const { abi } = req.body;

    if (!abi) {
      return res.status(400).json({ error: "Missing ABI" });
    }

    const summary = await smartContractAuditorAgent.auditABI(abi);

    res.json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    logger.error("Error during ABI audit:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error during ABI audit",
    });
  }
};
