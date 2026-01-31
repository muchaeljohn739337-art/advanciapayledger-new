/**
 * Crypto Payment Routes
 * API endpoints for cryptocurrency payment processing
 */

import express from 'express';
import {
  createPaymentRequest,
  verifyPayment,
  getTransactionStatus,
  getWalletBalance,
  authenticateWallet,
  getSupportedTokens,
  getGasPrices,
  getConnectionStatus
} from '../controllers/cryptoPaymentController';

const router = express.Router();

// Payment Management
router.post('/payment/create', createPaymentRequest);
router.post('/payment/verify', verifyPayment);
router.get('/transaction/:txHash/status', getTransactionStatus);

// Wallet Operations
router.get('/wallet/balance', getWalletBalance);
router.post('/wallet/authenticate', authenticateWallet);

// Utility Endpoints
router.get('/tokens', getSupportedTokens);
router.get('/gas-prices', getGasPrices);
router.get('/status', getConnectionStatus);

export default router;
