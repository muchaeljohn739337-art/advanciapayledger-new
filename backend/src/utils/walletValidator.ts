import { PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Validate Solana wallet address format
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBuffer());
  } catch {
    return false;
  }
}

/**
 * Validate Ethereum/EVM wallet address format with checksum
 */
export function isValidEthereumAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Validate wallet address based on blockchain
 */
export function validateWalletAddress(address: string, blockchain: string): {
  valid: boolean;
  error?: string;
} {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address is required' };
  }

  switch (blockchain) {
    case 'SOLANA':
      if (!isValidSolanaAddress(address)) {
        return { valid: false, error: 'Invalid Solana address format' };
      }
      break;
    case 'ETHEREUM':
    case 'POLYGON':
    case 'BASE':
      if (!isValidEthereumAddress(address)) {
        return { valid: false, error: 'Invalid Ethereum address format' };
      }
      break;
    default:
      return { valid: false, error: 'Unsupported blockchain' };
  }

  return { valid: true };
}

/**
 * Verify Solana wallet signature
 */
export function verifySolanaSignature(
  address: string,
  message: string,
  signature: string
): boolean {
  try {
    const publicKey = new PublicKey(address);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch (error) {
    return false;
  }
}

/**
 * Verify Ethereum wallet signature (personal_sign)
 */
export function verifyEthereumSignature(
  address: string,
  message: string,
  signature: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Verify wallet ownership through signature
 */
export function verifyWalletOwnership(
  address: string,
  blockchain: string,
  message: string,
  signature: string
): { valid: boolean; error?: string } {
  if (!signature) {
    return { valid: false, error: 'Signature is required' };
  }

  try {
    let isValid = false;

    switch (blockchain) {
      case 'SOLANA':
        isValid = verifySolanaSignature(address, message, signature);
        break;
      case 'ETHEREUM':
      case 'POLYGON':
      case 'BASE':
        isValid = verifyEthereumSignature(address, message, signature);
        break;
      default:
        return { valid: false, error: 'Unsupported blockchain' };
    }

    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Signature verification failed' };
  }
}

/**
 * Generate challenge message for wallet verification
 */
export function generateWalletChallenge(userId: string): string {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(7);
  return `Sign this message to verify your wallet ownership.\n\nUser ID: ${userId}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
}

/**
 * Normalize wallet address (lowercase for Ethereum, as-is for Solana)
 */
export function normalizeAddress(address: string, blockchain: string): string {
  if (['ETHEREUM', 'POLYGON', 'BASE'].includes(blockchain)) {
    return ethers.getAddress(address); // Returns checksummed address
  }
  return address;
}
