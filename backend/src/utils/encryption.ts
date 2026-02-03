import * as crypto from "crypto";
import * as dotenv from "dotenv";
import * as bcrypt from "bcryptjs";
import { logger } from "./logger";

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}

const key = Buffer.from(ENCRYPTION_KEY, "hex");

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export const encrypt = (text: string): EncryptedData => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from("advancia-payledger", "utf8"));

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
    };
  } catch (error) {
    logger.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
};

export const decrypt = (encryptedData: EncryptedData): string => {
  try {
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAAD(Buffer.from("advancia-payledger", "utf8"));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"));

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const hash = async (data: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(data, saltRounds);
};
