import { Router, Request, Response } from 'express';
import { getWalletService } from '../config/services';

const router = Router();

router.post('/debit', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    
    if (!idempotencyKey) {
      return res.status(400).json({ 
        error: 'Idempotency-Key header is required' 
      });
    }

    const { amount, currency, description } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }

    const walletService = getWalletService();
    
    const result = await walletService.executeTransaction({
      userId,
      amount: parseFloat(amount),
      currency,
      type: 'DEBIT',
      description: description || 'Wallet debit',
      idempotencyKey,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Wallet debit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/credit', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    
    if (!idempotencyKey) {
      return res.status(400).json({ 
        error: 'Idempotency-Key header is required' 
      });
    }

    const { amount, currency, description } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }

    const walletService = getWalletService();
    
    const result = await walletService.executeTransaction({
      userId,
      amount: parseFloat(amount),
      currency,
      type: 'CREDIT',
      description: description || 'Wallet credit',
      idempotencyKey,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Wallet credit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/transfer', async (req: Request, res: Response) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    
    if (!idempotencyKey) {
      return res.status(400).json({ 
        error: 'Idempotency-Key header is required' 
      });
    }

    const { toUserId, amount, currency } = req.body;
    const fromUserId = (req as any).user?.id;

    if (!fromUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!toUserId) {
      return res.status(400).json({ error: 'Recipient user ID is required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }

    const walletService = getWalletService();
    
    const result = await walletService.transfer(
      fromUserId,
      toUserId,
      parseFloat(amount),
      currency,
      idempotencyKey
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Wallet transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/balance/:currency', async (req: Request, res: Response) => {
  try {
    const { currency } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const walletService = getWalletService();
    const balance = await walletService.getBalance(userId, currency);

    res.json({ balance, currency });
  } catch (error: any) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
