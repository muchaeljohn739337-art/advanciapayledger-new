import EmailTemplates from '../lib/emailTemplates';
import { emailService } from '../lib/emailService';

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
  type: 'crypto' | 'fiat' | 'exchange';
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

class EmailIntegrationService {
  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user: User): Promise<void> {
    try {
      const email = EmailTemplates.welcomePremium({
        name: user.name || `${user.firstName} ${user.lastName}`,
        userName: user.name || user.firstName || 'there',
        email: user.email,
      });

      await emailService.sendEmail({
        from: process.env.EMAIL_FROM || 'noreply@advanciapayledger.com',
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      throw error;
    }
  }

  /**
   * Send transaction notification email
   */
  async sendTransactionNotification(transaction: Transaction): Promise<void> {
    try {
      const isCrypto = transaction.type === 'crypto' || 
                      ['SOL', 'ETH', 'BTC', 'MATIC'].includes(transaction.currency);

      const email = EmailTemplates.transactionNotification({
        amount: transaction.amount.toFixed(2),
        cryptoAmount: isCrypto ? transaction.amount.toString() : '',
        cryptoSymbol: isCrypto ? transaction.currency : '',
        cryptoUSD: `$${transaction.amount.toFixed(2)}`,
        senderName: transaction.senderName,
        paymentMethod: transaction.method,
        transactionId: transaction.id,
        dateTime: transaction.createdAt.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        transactionUrl: `${process.env.FRONTEND_URL}/transactions/${transaction.id}`,
        isCrypto,
        blockchain: transaction.blockchain || '',
        blockNumber: transaction.blockNumber || '',
        gasUsed: transaction.gasUsed || '',
        explorerUrl: this.getExplorerUrl(transaction.blockchain, transaction.txHash),
      });

      await emailService.sendEmail({
        from: 'notifications@advanciapayledger.com',
        to: transaction.recipientEmail,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      console.log(`✅ Transaction notification sent to ${transaction.recipientEmail}`);
    } catch (error) {
      console.error('❌ Failed to send transaction notification:', error);
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
    transactionId: string
  ): Promise<void> {
    try {
      const isCrypto = ['SOL', 'ETH', 'BTC', 'USDC', 'USDT'].includes(toCurrency);

      const email = EmailTemplates.transactionNotification({
        amount: fromAmount.toFixed(2),
        cryptoAmount: isCrypto ? toAmount.toFixed(6) : '',
        cryptoSymbol: isCrypto ? toCurrency : '',
        cryptoUSD: `$${fromAmount.toFixed(2)}`,
        senderName: user.name,
        paymentMethod: `${fromCurrency} → ${toCurrency} Exchange`,
        transactionId,
        dateTime: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        transactionUrl: `${process.env.FRONTEND_URL}/transactions/${transactionId}`,
        isCrypto,
      });

      await emailService.sendEmail({
        from: 'notifications@advanciapayledger.com',
        to: user.email,
        subject: `Currency Exchange Completed - ${fromCurrency} to ${toCurrency}`,
        html: email.html,
        text: email.text,
      });

      console.log(`✅ Exchange notification sent to ${user.email}`);
    } catch (error) {
      console.error('❌ Failed to send exchange notification:', error);
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
        location: loginAttempt.location || 'Unknown Location',
        device: loginAttempt.device || loginAttempt.userAgent || 'Unknown Device',
        ipAddress: loginAttempt.ipAddress,
        timestamp: loginAttempt.timestamp.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZoneName: 'short',
        }),
      });

      await emailService.sendEmail({
        from: 'security@advanciapayledger.com',
        to: loginAttempt.userEmail,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      console.log(`✅ Security alert sent to ${loginAttempt.userEmail}`);
    } catch (error) {
      console.error('❌ Failed to send security alert:', error);
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
        from: 'security@advanciapayledger.com',
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      console.log(`✅ Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
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
    }
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
        from: 'invoices@advanciapayledger.com',
        to: recipientEmail,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      console.log(`✅ Invoice email sent to ${recipientEmail}`);
    } catch (error) {
      console.error('❌ Failed to send invoice email:', error);
      throw error;
    }
  }

  /**
   * Get blockchain explorer URL
   */
  private getExplorerUrl(blockchain?: string, txHash?: string): string {
    if (!blockchain || !txHash) return '';

    const explorers: { [key: string]: string } = {
      ethereum: `https://etherscan.io/tx/${txHash}`,
      polygon: `https://polygonscan.com/tx/${txHash}`,
      solana: `https://explorer.solana.com/tx/${txHash}`,
      bitcoin: `https://blockchain.com/btc/tx/${txHash}`,
    };

    return explorers[blockchain.toLowerCase()] || '';
  }

  /**
   * Queue email for later sending (using Bull Queue)
   */
  async queueEmail(
    type: 'welcome' | 'transaction' | 'security' | 'invoice',
    data: any
  ): Promise<void> {
    // In production, use Bull Queue with Redis
    // For now, send immediately
    switch (type) {
      case 'welcome':
        await this.sendWelcomeEmail(data);
        break;
      case 'transaction':
        await this.sendTransactionNotification(data);
        break;
      case 'security':
        await this.sendSecurityAlert(data);
        break;
      case 'invoice':
        await this.sendInvoiceEmail(data.email, data.name, data.invoice);
        break;
    }
  }
}

export const emailIntegrationService = new EmailIntegrationService();
export default EmailIntegrationService;
