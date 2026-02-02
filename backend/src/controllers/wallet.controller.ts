import { Request, Response } from "express";
import { logger } from "../utils/logger";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getAccount,
} from "@solana/spl-token";
import bs58 from "bs58";
import { prisma } from "../utils/prisma";
import { emailIntegrationService } from "../services/emailIntegrationService";

class WalletController {
  async executeTransfer(req: Request, res: Response) {
    const { recipient, amount, token, network, memo } = req.body;

    if (!recipient || !amount || !token || !network) {
      return res
        .status(400)
        .json({ error: "Missing required transfer details" });
    }

    if (network !== "Solana" || token !== "USDC") {
      return res.status(400).json({
        error: "This endpoint only supports USDC transfers on Solana.",
      });
    }

    logger.info(
      `Admin transfer for ${amount} ${token} to ${recipient} initiated by user: ${req.user?.id}`,
    );

    try {
      const connection = new Connection(
        process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
        "confirmed",
      );

      const privateKey = process.env.PLATFORM_WALLET_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("Platform wallet private key is not set.");
      }
      const platformWallet = Keypair.fromSecretKey(bs58.decode(privateKey));

      const recipientPubkey = new PublicKey(recipient);
      const usdcMintAddress = new PublicKey(
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      ); // USDC Mint on Solana

      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        platformWallet,
        usdcMintAddress,
        platformWallet.publicKey,
      );

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        platformWallet,
        usdcMintAddress,
        recipientPubkey,
      );

      const transaction = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount.address,
          toTokenAccount.address,
          platformWallet.publicKey,
          amount * 1_000_000, // USDC has 6 decimals
          [],
        ),
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [platformWallet],
      );

      logger.info(`Transfer successful. Transaction signature: ${signature}`);

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: "ADMIN_CRYPTO_TRANSFER",
          resource: "WALLET",
          resourceId: platformWallet.publicKey.toBase58(),
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
          details: {
            recipient,
            amount,
            token,
            network,
            memo,
            signature,
          },
        },
      });

      res.status(200).json({ success: true, tx_hash: signature });
    } catch (error) {
      logger.error("Transfer execution failed:", error);
      res
        .status(500)
        .json({ error: "Transfer failed", details: (error as Error).message });
    }
  }

  async getWalletDetails(req: Request, res: Response) {
    logger.info(`Wallet details requested by user: ${req.user?.id}`);

    try {
      const connection = new Connection(
        process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
        "confirmed",
      );

      const privateKey = process.env.PLATFORM_WALLET_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("Platform wallet private key is not set.");
      }
      const platformWallet = Keypair.fromSecretKey(bs58.decode(privateKey));
      const usdcMintAddress = new PublicKey(
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      );

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        platformWallet,
        usdcMintAddress,
        platformWallet.publicKey,
      );

      const accountInfo = await getAccount(connection, tokenAccount.address);
      const balance = Number(accountInfo.amount) / 1_000_000; // Adjust for USDC decimals

      res.status(200).json({
        address: platformWallet.publicKey.toBase58(),
        balance,
        token: "USDC",
      });
    } catch (error) {
      logger.error("Failed to get wallet details:", error);
      res.status(500).json({
        error: "Failed to get wallet details",
        details: (error as Error).message,
      });
    }
  }

  async getTransferHistory(req: Request, res: Response) {
    logger.info(`Transfer history requested by user: ${req.user?.id}`);

    try {
      const history = await prisma.auditLog.findMany({
        where: {
          action: "ADMIN_CRYPTO_TRANSFER",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50, // Limit to the last 50 transfers
      });

      res.status(200).json(history);
    } catch (error) {
      logger.error("Failed to get transfer history:", error);
      res.status(500).json({
        error: "Failed to get transfer history",
        details: (error as Error).message,
      });
    }
  }

  async notifyAccountant(req: Request, res: Response) {
    const { txHash, amount, token, recipient, network, memo } = req.body;
    const adminEmail = req.user?.email;

    logger.info(
      `Accountant notification triggered by ${adminEmail} for tx: ${txHash}`,
    );

    try {
      await emailIntegrationService.sendAccountantTransferNotification({
        accountantName: "Accountant",
        date: new Date().toLocaleString(),
        amount,
        token,
        network,
        recipient,
        memo,
        txHash,
        adminEmail,
      });
      res
        .status(200)
        .json({ success: true, message: "Accountant notified successfully." });
    } catch (error) {
      logger.error("Failed to send accountant notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  }
}

export const walletController = new WalletController();
