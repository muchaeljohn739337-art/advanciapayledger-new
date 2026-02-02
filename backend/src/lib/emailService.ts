import nodemailer from "nodemailer";
import postmark from "postmark";
import { Resend } from "resend";
import { logger } from "../utils/logger";

// Email service types
export type EmailProvider = "postmark" | "resend" | "zoho" | "smtp";

export interface EmailConfig {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: EmailProvider;
}

class EmailService {
  private postmarkClient?: postmark.ServerClient;
  private resendClient?: Resend;
  private smtpTransporter?: nodemailer.Transporter;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize Postmark
    if (process.env.POSTMARK_API_KEY) {
      this.postmarkClient = new postmark.ServerClient(
        process.env.POSTMARK_API_KEY
      );
      logger.info("Postmark client initialized");
    }

    // Initialize Resend
    if (process.env.RESEND_API_KEY) {
      this.resendClient = new Resend(process.env.RESEND_API_KEY);
      logger.info("Resend client initialized");
    }

    // Initialize SMTP (Zoho/Gmail)
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      this.smtpTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      logger.info("SMTP client initialized", { host: process.env.SMTP_HOST });
    }
  }

  /**
   * Send email using the specified provider with fallback
   */
  async sendEmail(
    config: EmailConfig,
    preferredProvider?: EmailProvider
  ): Promise<EmailResponse> {
    const providers = this.getProviderOrder(preferredProvider);

    for (const provider of providers) {
      try {
        const result = await this.sendWithProvider(provider, config);
        if (result.success) {
          logger.info("Email sent successfully", { provider });
          return result;
        }
      } catch (error) {
        logger.warn("Failed to send email via provider", { provider, error });
        continue;
      }
    }

    return {
      success: false,
      error: "All email providers failed",
      provider: preferredProvider || "postmark",
    };
  }

  private getProviderOrder(preferred?: EmailProvider): EmailProvider[] {
    const allProviders: EmailProvider[] = [
      "postmark",
      "resend",
      "zoho",
      "smtp",
    ];

    if (preferred) {
      // Put preferred provider first, then the rest in order
      return [preferred, ...allProviders.filter((p) => p !== preferred)];
    }

    // Default order: Postmark -> Resend -> Zoho/SMTP
    return allProviders;
  }

  private async sendWithProvider(
    provider: EmailProvider,
    config: EmailConfig
  ): Promise<EmailResponse> {
    switch (provider) {
      case "postmark":
        return this.sendViaPostmark(config);
      case "resend":
        return this.sendViaResend(config);
      case "zoho":
      case "smtp":
        return this.sendViaSMTP(config);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async sendViaPostmark(config: EmailConfig): Promise<EmailResponse> {
    if (!this.postmarkClient) {
      throw new Error("Postmark client not initialized");
    }

    const result = await this.postmarkClient.sendEmail({
      From: config.from,
      To: Array.isArray(config.to) ? config.to.join(",") : config.to,
      Subject: config.subject,
      HtmlBody: config.html,
      TextBody: config.text,
      Attachments: config.attachments?.map((att) => ({
        Name: att.filename,
        Content:
          att.content instanceof Buffer
            ? att.content.toString("base64")
            : Buffer.from(att.content).toString("base64"),
        ContentType: att.contentType || "application/octet-stream",
        ContentID: att.filename,
      })),
    });

    return {
      success: result.MessageID !== undefined,
      messageId: result.MessageID,
      provider: "postmark",
    };
  }

  private async sendViaResend(config: EmailConfig): Promise<EmailResponse> {
    if (!this.resendClient) {
      throw new Error("Resend client not initialized");
    }

    const emailData = {
      from: config.from,
      to: Array.isArray(config.to) ? config.to : [config.to],
      subject: config.subject,
      html: config.html,
      text: config.text,
      attachments: config.attachments?.map((att) => ({
        filename: att.filename,
        content:
          att.content instanceof Buffer
            ? att.content.toString("base64")
            : Buffer.from(att.content).toString("base64"),
        type: att.contentType || "application/octet-stream",
      })),
    };

    const { data, error } = await this.resendClient.emails.send(
      emailData as any
    );

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      messageId: data?.id,
      provider: "resend",
    };
  }

  private async sendViaSMTP(config: EmailConfig): Promise<EmailResponse> {
    if (!this.smtpTransporter) {
      throw new Error("SMTP transporter not initialized");
    }

    const mailOptions = {
      from: config.from,
      to: config.to,
      subject: config.subject,
      html: config.html,
      text: config.text,
      attachments: config.attachments,
    };

    const result = await this.smtpTransporter.sendMail(mailOptions);

    return {
      success: result.messageId !== undefined,
      messageId: result.messageId,
      provider: process.env.SMTP_HOST?.includes("zoho") ? "zoho" : "smtp",
    };
  }

  /**
   * Test all configured email providers
   */
  async testProviders(): Promise<
    { provider: EmailProvider; status: "success" | "error"; message?: string }[]
  > {
    const testConfig: EmailConfig = {
      from: process.env.EMAIL_FROM || "test@advanciapayledger.com",
      to: "test@example.com",
      subject: "Email Service Test",
      html: "<p>This is a test email from Advancia Pay Ledger.</p>",
      text: "This is a test email from Advancia Pay Ledger.",
    };

    const results: {
      provider: EmailProvider;
      status: "success" | "error";
      message?: string;
    }[] = [];

    // Test Postmark
    if (this.postmarkClient) {
      try {
        await this.sendViaPostmark(testConfig);
        results.push({ provider: "postmark", status: "success" });
      } catch (error) {
        results.push({
          provider: "postmark",
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Test Resend
    if (this.resendClient) {
      try {
        await this.sendViaResend(testConfig);
        results.push({ provider: "resend", status: "success" });
      } catch (error) {
        results.push({
          provider: "resend",
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Test SMTP/Zoho
    if (this.smtpTransporter) {
      try {
        await this.sendViaSMTP(testConfig);
        results.push({
          provider: process.env.SMTP_HOST?.includes("zoho") ? "zoho" : "smtp",
          status: "success",
        });
      } catch (error) {
        results.push({
          provider: process.env.SMTP_HOST?.includes("zoho") ? "zoho" : "smtp",
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Get provider status and configuration
   */
  getProviderStatus() {
    return {
      postmark: {
        configured: !!this.postmarkClient,
        apiKey: !!process.env.POSTMARK_API_KEY,
        serverId: process.env.POSTMARK_SERVER_ID,
      },
      resend: {
        configured: !!this.resendClient,
        apiKey: !!process.env.RESEND_API_KEY,
      },
      smtp: {
        configured: !!this.smtpTransporter,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        isZoho: process.env.SMTP_HOST?.includes("zoho"),
      },
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export convenience functions
export const sendEmail = (
  config: EmailConfig,
  preferredProvider?: EmailProvider
) => emailService.sendEmail(config, preferredProvider);

export const testEmailProviders = () => emailService.testProviders();

export const getEmailProviderStatus = () => emailService.getProviderStatus();
