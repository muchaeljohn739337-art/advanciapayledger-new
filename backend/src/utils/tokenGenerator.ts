import crypto from "crypto";

/**
 * Generate a secure random token for email verification, password reset, etc.
 * Uses crypto.randomBytes instead of JWT for better security
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a token with expiration timestamp
 */
export function generateTokenWithExpiry(expiryHours: number = 24): {
  token: string;
  expiresAt: Date;
} {
  return {
    token: generateSecureToken(),
    expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
  };
}

/**
 * Hash a token for storage (prevents token theft if database is compromised)
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Verify a token against its hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  const tokenHash = hashToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash),
    Buffer.from(hash)
  );
}
