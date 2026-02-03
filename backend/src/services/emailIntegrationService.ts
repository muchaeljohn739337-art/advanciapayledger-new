import * as EmailTemplates from "../lib/emailTemplates";
import type { TemplateData } from "../lib/emailTemplates";
import { emailService } from "../lib/emailService";
import { logger } from "../utils/logger";

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  method: string;
  type: "crypto" | "fiat" | "exchange";
  blockchain?: string;
  blockNumber?: string;
  gasUsed?: string;
  txHash?: string;
  createdAt: Date;
}

interface LoginAttempt {
  userId: string;
  userEmail: string;
  userName: string;
  ipAddress: string;
  location?: string;
  device?: string;
  userAgent?: string;
  timestamp: Date;
}

type InvoiceItemData = { description: string; amount: number };
interface InvoicePayload {
  email: string;
  name: string;
  invoice: {
    invoiceNumber: string;
    invoiceId: string;
    total: number;
    items: InvoiceItemData[];
  };
}

type AccountantTransferData = TemplateData & {
  accountantName: string;
  amount: number;
  token: string;
  network: string;
  recipient: string;
  memo?: string;
  txHash: string;
  adminEmail: string;
};

class EmailIntegrationService {
  /**
   * Send verification email to new user
   */
  async sendVerificationEmail(
    user: User,
    verificationToken: string,
  ): Promise<void> {
    try {
      const email = EmailTemplates.emailVerification({
        name: user.name || user.firstName || "there",
        verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
      });

      await emailService.sendEmail({
        from: process.env.EMAIL_FROM || "noreply@advanciapayledger.com",
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      logger.info("Verification email sent", { to: user.email });
    } catch (error) {
      logger.error("Failed to send verification email", {
        error,
        to: user.email,
      });
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user: User): Promise<void> {
    try {
      const email = EmailTemplates.welcomePremium({
        name: user.name || `${user.firstName} ${user.lastName}`,
        userName: user.name || user.firstName || "there",
        email: user.email,
      });

      await emailService.sendEmail({
        from: process.env.EMAIL_FROM || "noreply@advanciapayledger.com",
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      logger.info(`Welcome email sent`, { to: user.email });
    } catch (error) {
      logger.error("Failed to send welcome email", { error, to: user.email });
      throw error;
    }
  }

  /**
   * Send transaction notification email
   */
  async sendTransactionNotification(transaction: Transaction): Promise<void> {
    try {
      const isCrypto =
        transaction.type === "crypto" ||
        ["SOL", "ETH", "BTC", "MATIC"].includes(transaction.currency);

      const email = EmailTemplates.transactionNotification({
        amount: transaction.amount.toFixed(2),
        cryptoAmount: isCrypto ? transaction.amount.toString() : "",
        cryptoSymbol: isCrypto ? transaction.currency : "",
        cryptoUSD: `$${transaction.amount.toFixed(2)}`,
        senderName: transaction.senderName,
        paymentMethod: transaction.method,
        transactionId: transaction.id,
        dateTime: transaction.createdAt.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        transactionUrl: `${process.env.FRONTEND_URL}/transactions/${transaction.id}`,
        isCrypto,
        blockchain: transaction.blockchain || "",
        blockNumber: transaction.blockNumber || "",
        gasUsed: transaction.gasUsed || "",
        explorerUrl: this.getExplorerUrl(
          transaction.blockchain,
          transaction.txHash,
        ),
      });

      await emailService.sendEmail({
        from: "notifications@advanciapayledger.com",
        to: transaction.recipientEmail,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      logger.info("Transaction notification sent", {
        to: transaction.recipientEmail,
        txId: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
      });
    } catch (error) {
      logger.error("Failed to send transaction notification", {
        error,
        to: transaction.recipientEmail,
        txId: transaction.id,
      });
      throw error;
    }
  }

  /**
   * Send currency exchange notification
   */
  async sendExchangeNotification(
    user: User,
    fromAmount: number,
    fromCurrency: string,
    toAmount: number,
    toCurrency: string,
    transactionId: string,
  ): Promise<void> {
    try {
      const isCrypto = ["SOL", "ETH", "BTC", "USDC", "USDT"].includes(
        toCurrency,
      );

      const email = EmailTemplates.transactionNotification({
        amount: fromAmount.toFixed(2),
        cryptoAmount: isCrypto ? toAmount.toFixed(6) : "",
        cryptoSymbol: isCrypto ? toCurrency : "",
        cryptoUSD: `$${fromAmount.toFixed(2)}`,
        senderName: user.name,
        paymentMethod: `${fromCurrency} → ${toCurrency} Exchange`,
        transactionId,
        dateTime: new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        transactionUrl: `${process.env.FRONTEND_URL}/transactions/${transactionId}`,
        isCrypto,
      });

      await emailService.sendEmail({
        from: "notifications@advanciapayledger.com",
        to: user.email,
        subject: `Currency Exchange Completed - ${fromCurrency} to ${toCurrency}`,
        html: email.html,
        text: email.text,
      });

      logger.info("Exchange notification sent", {
        to: user.email,
        transactionId,
      });
    } catch (error) {
      logger.error("Failed to send exchange notification", {
        error,
        to: user.email,
        transactionId,
      });
      throw error;
    }
  }

  /**
   * Send security alert for new login
   */
  async sendSecurityAlert(loginAttempt: LoginAttempt): Promise<void> {
    try {
      const email = EmailTemplates.securityAlert({
        name: loginAttempt.userName,
        userName: loginAttempt.userName,
        email: loginAttempt.userEmail,
        location: loginAttempt.location || "Unknown Location",
        device:
          loginAttempt.device || loginAttempt.userAgent || "Unknown Device",
        ipAddress: loginAttempt.ipAddress,
        timestamp: loginAttempt.timestamp.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZoneName: "short",
        }),
      });

      await emailService.sendEmail({
        from: "security@advanciapayledger.com",
        to: loginAttempt.userEmail,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      logger.info("Security alert email sent", {
        to: loginAttempt.userEmail,
        ip: loginAttempt.ipAddress,
      });
    } catch (error) {
      logger.error("Failed to send security alert", {
        error,
        to: loginAttempt.userEmail,
      });
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: User, resetToken: string): Promise<void> {
    try {
      const email = EmailTemplates.passwordReset({
        name: user.name,
        token: resetToken,
        resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      });

      await emailService.sendEmail({
        from: "security@advanciapayledger.com",
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      logger.info("Password reset email sent", { to: user.email });
    } catch (error) {
      logger.error("Failed to send password reset email", {
        error,
        to: user.email,
      });
      throw error;
    }
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(
    recipientEmail: string,
    recipientName: string,
    invoiceData: {
      invoiceNumber: string;
      invoiceId: string;
      total: number;
      items: Array<{ description: string; amount: number }>;
    },
  ): Promise<void> {
    try {
      const email = EmailTemplates.invoice({
        name: recipientName,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceId: invoiceData.invoiceId,
        total: invoiceData.total,
        items: invoiceData.items,
        invoiceLink: `${process.env.FRONTEND_URL}/invoices/${invoiceData.invoiceId}`,
      });

      await emailService.sendEmail({
        from: "invoices@advanciapayledger.com",
        to: recipientEmail,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      logger.info("Invoice email sent", {
        to: recipientEmail,
        invoiceId: invoiceData.invoiceId,
      });
    } catch (error) {
      logger.error("Failed to send invoice email", {
        error,
        to: recipientEmail,
        invoiceId: invoiceData.invoiceId,
      });
      throw error;
    }
  }

  async sendAccountantTransferNotification(
    data: AccountantTransferData,
  ): Promise<void> {
    try {
      const email = EmailTemplates.accountantTransferNotification(data);

      await emailService.sendEmail({
        from: process.env.EMAIL_FROM || "noreply@advanciapayledger.com",
        to: process.env.ACCOUNTANT_EMAIL || "accountant@example.com",
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      logger.info("Accountant notification sent", { txHash: data.txHash });
    } catch (error) {
      logger.error("Failed to send accountant notification", {
        error,
        txHash: data.txHash,
      });
      throw error;
    }
  }

  /**
   * Get blockchain explorer URL
   */
  private getExplorerUrl(blockchain?: string, txHash?: string): string {
    if (!blockchain || !txHash) return "";

    const explorers: { [key: string]: string } = {
      ethereum: `https://etherscan.io/tx/${txHash}`,
      polygon: `https://polygonscan.com/tx/${txHash}`,
      solana: `https://explorer.solana.com/tx/${txHash}`,
      bitcoin: `https://blockchain.com/btc/tx/${txHash}`,
    };

    return explorers[blockchain.toLowerCase()] || "";
  }

  /**
   * Queue email for later sending (using Bull Queue)
   */
  async queueEmail(type: "welcome", data: User): Promise<void>;
  async queueEmail(type: "transaction", data: Transaction): Promise<void>;
  async queueEmail(type: "security", data: LoginAttempt): Promise<void>;
  async queueEmail(type: "invoice", data: InvoicePayload): Promise<void>;
  async queueEmail(
    type: "welcome" | "transaction" | "security" | "invoice",
    data: unknown,
  ): Promise<void> {
    switch (type) {
      case "welcome":
        await this.sendWelcomeEmail(data as User);
        break;
      case "transaction":
        await this.sendTransactionNotification(data as Transaction);
        break;
      case "security":
        await this.sendSecurityAlert(data as LoginAttempt);
        break;
      case "invoice": {
        const payload = data as InvoicePayload;
        await this.sendInvoiceEmail(
          payload.email,
          payload.name,
          payload.invoice,
        );
        break;
      }
    }
  }
}

export const emailIntegrationService = new EmailIntegrationService();
export default EmailIntegrationService;
