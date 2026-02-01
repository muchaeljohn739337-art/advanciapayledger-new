import { Router } from 'express';
import { prisma } from '../app';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// List user's wallets
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(wallets);
  } catch (error) {
    logger.error('List wallets error:', error);
    res.status(500).json({ error: 'Failed to list wallets' });
  }
});

// Get wallet details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const wallet = await prisma.wallet.findFirst({
      where: { id, userId }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json(wallet);
  } catch (error) {
    logger.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to get wallet' });
  }
});

// Create wallet
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { blockchain, address, label } = req.body;

    const wallet = await prisma.wallet.create({
      data: {
        userId: userId!,
        blockchain,
        address,
        label,
        balance: '0'
      }
    });

    res.status(201).json(wallet);
  } catch (error) {
    logger.error('Create wallet error:', error);
    res.status(500).json({ error: 'Failed to create wallet' });
  }
});

// Get wallet balance
router.get('/:id/balance', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const wallet = await prisma.wallet.findFirst({
      where: { id, userId }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // TODO: Fetch real-time balance from blockchain
    res.json({ balance: wallet.balance, blockchain: wallet.blockchain });
  } catch (error) {
    logger.error('Get wallet balance error:', error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

// Withdraw from wallet
router.post('/:id/withdraw', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { amount, toAddress } = req.body;

    const wallet = await prisma.wallet.findFirst({
      where: { id, userId }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Create withdrawal record
    const withdrawal = await prisma.cryptoPayment.create({
      data: {
        userId: userId!,
        walletId: id,
        amount,
        currency: wallet.blockchain,
        type: 'withdrawal',
        status: 'pending',
        toAddress
      }
    });

    // TODO: Queue withdrawal for processing in background
    // This should be handled by a background job that signs and broadcasts the transaction

    res.status(201).json(withdrawal);
  } catch (error) {
    logger.error('Withdraw from wallet error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// Get wallet transactions
router.get('/:id/transactions', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const wallet = await prisma.wallet.findFirst({
      where: { id, userId }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(transactions);
  } catch (error) {
    logger.error('Get wallet transactions error:', error);
    res.status(500).json({ error: 'Failed to get wallet transactions' });
  }
});

export default router;
