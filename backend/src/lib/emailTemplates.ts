// @ts-nocheck
// Email templates for Advancia Pay Ledger
import * as fs from "fs";
import * as path from "path";
import { logger } from "../utils/logger";

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface InvoiceItem {
  description: string;
  amount: number;
}

export interface TemplateData {
  [key: string]: string | number | boolean | object | InvoiceItem[] | undefined;
}

// Base template wrapper
const baseTemplate = (content: string, title?: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || "Advancia Pay Ledger"}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
        }
        .highlight {
            color: #667eea;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Advancia Pay Ledger</div>
    </div>

    ${content}

    <div class="footer">
        <p>&copy; 2026 Advancia Pay Ledger. All rights reserved.</p>
        <p>This email was sent to {{email}}. <a href="{{frontendUrl}}/unsubscribe?email={{email}}">Unsubscribe</a></p>
    </div>
</body>
</html>
`;

// Template generators
export class EmailTemplates {
  private static replaceVariables = (
    template: string,
    data: TemplateData,
  ): string => {
    let result = template;
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, data[key] || "");
    });
    return result;
  };

  private static loadTemplate = (templateName: string): string => {
    try {
      const templatePath = path.join(
        __dirname,
        "..",
        "..",
        "email-templates",
        `${templateName}.html`,
      );
      return fs.readFileSync(templatePath, "utf-8");
    } catch (error) {
      logger.error("Failed to load email template", { templateName, error });
      return "";
    }
  };

  static emailVerification(data: TemplateData): EmailTemplate {
    const content = `
        <div class="content">
            <h2>Verify Your Email Address 📧</h2>
            <p>Hi {{name}},</p>
            <p>Thanks for signing up for Advancia Pay Ledger! Please click the button below to verify your email address and activate your account.</p>

            <p style="text-align: center; margin: 30px 0;">
                <a href="{{verificationLink}}" class="button">Verify Email</a>
            </p>

            <p><strong>Note:</strong> This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account, please ignore this email.</p>
        </div>
    `;

    const variables = {
      ...data,
      verificationLink: data.verificationLink,
    };

    return {
      subject: "Verify Your Email - Advancia Pay Ledger",
      html: this.replaceVariables(
        baseTemplate(content, "Verify Your Email"),
        variables,
      ),
      text: `Verify your email for Advancia Pay Ledger. Visit: ${variables.verificationLink}`,
    };
  }

  static welcome(data: TemplateData): EmailTemplate {
    const content = `
        <div class="content">
            <h2>Welcome to Advancia Pay Ledger! 🎉</h2>
            <p>Hi {{name}},</p>
            <p>Welcome to the future of healthcare payments! Your account has been successfully created.</p>

            <h3>What's Next?</h3>
            <ul>
                <li>✅ Verify your email address</li>
                <li>🏥 Set up your healthcare facility profile</li>
                <li>💳 Configure payment methods</li>
                <li>🚀 Start accepting payments!</li>
            </ul>

            <p style="text-align: center; margin: 30px 0;">
                <a href="{{frontendUrl}}/dashboard" class="button">Go to Dashboard</a>
            </p>
        </div>
    `;

    const variables = {
      ...data,
      frontendUrl: process.env.FRONTEND_URL || "https://advanciapayledger.com",
    };

    return {
      subject: "Welcome to Advancia Pay Ledger! 🎉",
      html: this.replaceVariables(baseTemplate(content, "Welcome"), variables),
      text: `Welcome to Advancia Pay Ledger! Hi ${
        data.name || "there"
      }, your account has been created. Visit ${
        variables.frontendUrl
      }/dashboard to get started.`,
    };
  }

  static paymentReceived(data: TemplateData): EmailTemplate {
    const content = `
        <div class="content">
            <h2>Payment Received! 💰</h2>
            <p>Hi {{name}},</p>
            <p>We've received your payment of <span class="highlight">{{amount}} {{currency}}</span>.</p>

            <h3>Payment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Transaction ID:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{transactionId}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{date}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Method:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">{{method}}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span style="color: #28a745;">Completed</span></td>
                </tr>
            </table>

            <p style="text-align: center; margin: 30px 0;">
                <a href="{{frontendUrl}}/transactions" class="button">View Transaction</a>
            </p>
        </div>
    `;

    const variables = {
      ...data,
      date: data.date || new Date().toLocaleDateString(),
      frontendUrl: process.env.FRONTEND_URL || "https://advanciapayledger.com",
    };

    return {
      subject: "Payment Received - Advancia Pay Ledger",
      html: this.replaceVariables(
        baseTemplate(content, "Payment Received"),
        variables,
      ),
      text: `Payment received: ${data.amount || "0.00"} ${
        data.currency || "USD"
      }. Transaction ID: ${data.transactionId || "N/A"}`,
    };
  }

  static welcomePremium(data: TemplateData): EmailTemplate {
    const template = this.loadTemplate("welcome-premium");
    const variables = {
      ...data,
      dashboardUrl: `${process.env.FRONTEND_URL || "https://advanciapayledger.com"}/dashboard`,
      socialTwitter: "https://twitter.com/advanciapay",
      socialLinkedIn: "https://linkedin.com/company/advanciapay",
      websiteUrl: "https://advanciapayledger.com",
      unsubscribeUrl: `${process.env.FRONTEND_URL || "https://advanciapayledger.com"}/unsubscribe?email=${data.email}`,
      privacyUrl: `${process.env.FRONTEND_URL || "https://advanciapayledger.com"}/privacy`,
    };

    return {
      subject: "Welcome to Advancia Pay! 🎉",
      html: this.replaceVariables(template, variables),
      text: `Welcome to Advancia Pay! Hi ${data.userName || "there"}, thank you for joining our healthcare payments platform.`,
    };
  }

  static transactionNotification(data: TemplateData): EmailTemplate {
    const template = this.loadTemplate("transaction-notification");
    const variables = {
      ...data,
      transactionUrl: `${process.env.FRONTEND_URL || "https://advanciapayledger.com"}/transactions/${data.transactionId}`,
    };

    return {
      subject: `Payment Received - $${data.amount}`,
      html: this.replaceVariables(template, variables),
      text: `Payment received: $${data.amount} from ${data.senderName}. Transaction ID: ${data.transactionId}`,
    };
  }

  static securityAlert(data: TemplateData): EmailTemplate {
    const template = this.loadTemplate("security-alert");
    const variables = {
      ...data,
      secureAccountUrl: `${process.env.FRONTEND_URL || "https://advanciapayledger.com"}/security`,
      changePasswordUrl: `${process.env.FRONTEND_URL || "https://advanciapayledger.com"}/reset-password`,
    };

    return {
      subject: "Security Alert - New Login Detected",
      html: this.replaceVariables(template, variables),
      text: `Security alert: New login detected from ${data.location}. If this wasn't you, please secure your account immediately.`,
    };
  }

  static passwordReset(data: TemplateData): EmailTemplate {
    const content = `
        <div class="content">
            <h2>Password Reset Request 🔐</h2>
            <p>Hi {{name}},</p>
            <p>We received a request to reset your password. Click the link below to reset it:</p>

            <p style="text-align: center; margin: 30px 0;">
                <a href="{{resetLink}}" class="button">Reset Password</a>
            </p>

            <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
        </div>
    `;

    const variables = {
      ...data,
      resetLink:
        data.resetLink ||
        `${process.env.FRONTEND_URL}/reset-password?token=${data.token}`,
    };

    return {
      subject: "Password Reset - Advancia Pay Ledger",
      html: this.replaceVariables(
        baseTemplate(content, "Password Reset"),
        variables,
      ),
      text: `Password reset requested for your account. Visit: ${variables.resetLink}`,
    };
  }

  static invoice(data: TemplateData): EmailTemplate {
    const items = (data.items as InvoiceItem[]) || [];
    const itemsHtml = items
      .map(
        (item: InvoiceItem) => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.amount.toFixed(2)}</td>
        </tr>
    `,
      )
      .join("");

    const content = `
        <div class="content">
            <h2>Invoice {{invoiceNumber}} 📄</h2>
            <p>Hi {{name}},</p>
            <p>Please find your invoice details below:</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border-top: 2px solid #ddd;">Total:</td>
                        <td style="padding: 12px; font-weight: bold; text-align: right; border-top: 2px solid #ddd;">$${data.total}</td>
                    </tr>
                </tfoot>
            </table>

            <p style="text-align: center; margin: 30px 0;">
                <a href="{{invoiceLink}}" class="button">View Invoice</a>
            </p>
        </div>
    `;

    const variables = {
      ...data,
      invoiceLink: `${process.env.FRONTEND_URL || "https://advanciapayledger.com"}/invoices/${data.invoiceId}`,
    };

    return {
      subject: `Invoice ${data.invoiceNumber} - Advancia Pay Ledger`,
      html: this.replaceVariables(
        baseTemplate(content, `Invoice ${data.invoiceNumber}`),
        variables,
      ),
      text: `Invoice ${data.invoiceNumber} for $${data.total}. Total items: ${items.length}`,
    };
  }

  static accountantTransferNotification(data: TemplateData): EmailTemplate {
    const content = `
        <div class="content">
            <h2>Crypto Transfer Executed</h2>
            <p>Hi {{accountantName}},</p>
            <p>This is an automated notification that a cryptocurrency transfer has been executed from the platform's treasury wallet by an administrator.</p>

            <h3>Transaction Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{date}}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{amount}} {{token}}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Network:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{network}}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Recipient:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{recipient}}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Memo:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{memo}}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Transaction Hash:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{txHash}}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Executed By:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{adminEmail}}</td></tr>
            </table>

            <p style="text-align: center; margin: 30px 0;">
                <a href="{{explorerUrl}}" class="button">View on Explorer</a>
            </p>
        </div>
    `;

    const variables = {
      ...data,
      date: new Date().toLocaleString(),
      explorerUrl: `https://solscan.io/tx/${data.txHash}`,
    };

    return {
      subject: `[Action Required] Crypto Transfer Executed: ${data.amount} ${data.token}`,
      html: this.replaceVariables(
        baseTemplate(content, "Crypto Transfer Notification"),
        variables,
      ),
      text: `A transfer of ${data.amount} ${data.token} to ${data.recipient} was executed. TX Hash: ${data.txHash}`,
    };
  }
}

