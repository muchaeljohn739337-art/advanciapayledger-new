// TODO: Install otplib package: npm install otplib
import QRCode from "qrcode";
import { logger } from "../utils/logger";

export class SecurityService {
  /**
   * Generate a new TOTP secret for a user
   */
  static generateSecret(email: string): string {
    // TODO: Uncomment when otplib is installed
    // return authenticator.generateSecret();
    return "TEMP_SECRET_" + Math.random().toString(36);
  }

  /**
   * Generate a QR code URI for the TOTP secret
   */
  static getQRCodeURI(email: string, secret: string): string {
    // TODO: Uncomment when otplib is installed
    // return authenticator.keyuri(email, 'Advancia PayLedger', secret);
    return `otpauth://totp/Advancia:${email}?secret=${secret}&issuer=Advancia`;
  }

  /**
   * Generate a base64 QR code image
   */
  static async generateQRCodeImage(otpauthURI: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthURI);
    } catch (error) {
      logger.error("Error generating QR code image:", error);
      throw new Error("Failed to generate QR code image");
    }
  }

  /**
   * Verify a TOTP token against a secret
   */
  static verifyToken(token: string, secret: string): boolean {
    try {
      // TODO: Uncomment when otplib is installed
      // return authenticator.verify({ token, secret });
      return true; // Temporary bypass
    } catch (error) {
      logger.error("Error verifying TOTP token:", error);
      return false;
    }
  }

  /**
   * Check if an IP address is in the whitelist
   * This is a simplified version; in production, you might fetch from DB or config
   */
  static isIpWhitelisted(ip: string, whitelist: string[]): boolean {
    if (!whitelist || whitelist.length === 0) return true; // No whitelist means all allowed
    return whitelist.includes(ip);
  }
}
