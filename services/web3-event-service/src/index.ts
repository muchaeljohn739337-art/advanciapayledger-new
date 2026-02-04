import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';

dotenv.config();

const app = express();
const PORT = process.env.WEB3_SERVICE_PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'web3-event-service',
    timestamp: new Date().toISOString(),
  });
});

// Web3 Event Listener Service
class Web3EventListener {
  private providers: Map<string, any> = new Map();
  private subscriptions: Map<string, any> = new Map();
  private eventQueue: any[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Ethereum Provider
    if (process.env.ETHEREUM_RPC_URL) {
      const ethProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      this.providers.set('ethereum', ethProvider);
    }

    // Polygon Provider
    if (process.env.POLYGON_RPC_URL) {
      const polygonProvider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
      this.providers.set('polygon', polygonProvider);
    }

    // Solana Provider
    if (process.env.SOLANA_RPC_URL) {
      const solanaConnection = new Connection(process.env.SOLANA_RPC_URL);
      this.providers.set('solana', solanaConnection);
    }

    console.log(`Initialized ${this.providers.size} blockchain providers`);
  }

  async listenToContractEvents(chain: string, contractAddress: string, abi: any[]) {
    const provider = this.providers.get(chain);
    if (!provider) {
      throw new Error(`Provider not found for chain: ${chain}`);
    }

    if (chain === 'solana') {
      return this.listenToSolanaEvents(contractAddress);
    }

    // EVM chains
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    // Listen to all events
    contract.on('*', (event: any) => {
      this.handleEvent({
        chain,
        contract: contractAddress,
        eventName: event.event,
        payload: event.args,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: new Date().toISOString(),
      });
    });

    console.log(`Listening to events on ${chain} contract: ${contractAddress}`);
    return contract;
  }

  private async listenToSolanaEvents(programId: string) {
    const connection = this.providers.get('solana');
    const programPublicKey = new PublicKey(programId);

    // Subscribe to account changes
    const subscription = connection.onAccountChange(programPublicKey, (accountInfo) => {
      this.handleEvent({
        chain: 'solana',
        contract: programId,
        eventName: 'account_change',
        payload: {
          lamports: accountInfo.lamports,
          owner: accountInfo.owner.toBase58(),
          executable: accountInfo.executable,
        },
        txHash: '',
        blockNumber: 0,
        timestamp: new Date().toISOString(),
      });
    });

    this.subscriptions.set(`solana-${programId}`, subscription);
    console.log(`Listening to Solana program: ${programId}`);
  }

  private async handleEvent(event: any) {
    // Add event to queue
    this.eventQueue.push(event);

    // Process event (save to database, trigger alerts, etc.)
    await this.processEvent(event);

    // Emit to WebSocket clients if needed
    this.emitEvent(event);
  }

  private async processEvent(event: any) {
    try {
      // Save to database
      await this.saveEventToDatabase(event);

      // Check for fraud patterns
      await this.checkFraudPatterns(event);

      // Update metrics
      await this.updateMetrics(event);

      console.log(`Processed event: ${event.eventName} on ${event.chain}`);
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }

  private async saveEventToDatabase(event: any) {
    // This would save to your database
    // For now, just log it
    console.log('Saving event to database:', event);
  }

  private async checkFraudPatterns(event: any) {
    // Implement fraud detection logic
    const suspiciousPatterns = [
      'high_frequency_transactions',
      'unusual_amounts',
      'blacklisted_addresses',
    ];

    for (const pattern of suspiciousPatterns) {
      if (await this.detectPattern(event, pattern)) {
        await this.triggerFraudAlert(event, pattern);
      }
    }
  }

  private async detectPattern(event: any, pattern: string): Promise<boolean> {
    // Implement pattern detection logic
    switch (pattern) {
      case 'high_frequency_transactions':
        return this.checkHighFrequency(event);
      case 'unusual_amounts':
        return this.checkUnusualAmounts(event);
      case 'blacklisted_addresses':
        return this.checkBlacklistedAddresses(event);
      default:
        return false;
    }
  }

  private async checkHighFrequency(event: any): Promise<boolean> {
    // Check if same address has too many transactions in short time
    // This is a placeholder implementation
    return false;
  }

  private async checkUnusualAmounts(event: any): Promise<boolean> {
    // Check if transaction amount is unusual
    // This is a placeholder implementation
    return false;
  }

  private async checkBlacklistedAddresses(event: any): Promise<boolean> {
    // Check if address is blacklisted
    // This is a placeholder implementation
    return false;
  }

  private async triggerFraudAlert(event: any, pattern: string) {
    // Trigger fraud alert
    console.log(`Fraud alert triggered: ${pattern} for event:`, event);
    
    // This would send notifications, create alerts, etc.
  }

  private async updateMetrics(event: any) {
    // Update monitoring metrics
    console.log(`Updating metrics for event: ${event.eventName}`);
  }

  private emitEvent(event: any) {
    // Emit to WebSocket clients
    console.log('Emitting event to clients:', event);
  }

  getEventQueue(): any[] {
    return this.eventQueue;
  }

  clearEventQueue() {
    this.eventQueue = [];
  }
}

const web3Listener = new Web3EventListener();

// API Routes

// Start listening to contract events
app.post('/events/subscribe', async (req, res) => {
  try {
    const { chain, contractAddress, abi } = req.body;

    if (!chain || !contractAddress) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['chain', 'contractAddress'],
      });
    }

    const contract = await web3Listener.listenToContractEvents(chain, contractAddress, abi || []);

    res.json({
      success: true,
      message: `Started listening to events on ${chain}`,
      contractAddress,
      chain,
    });
  } catch (error) {
    console.error('Error subscribing to events:', error);
    res.status(500).json({
      error: 'Failed to subscribe to events',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get event queue
app.get('/events/queue', (req, res) => {
  const events = web3Listener.getEventQueue();
  res.json({
    events,
    count: events.length,
  });
});

// Clear event queue
app.delete('/events/queue', (req, res) => {
  web3Listener.clearEventQueue();
  res.json({
    success: true,
    message: 'Event queue cleared',
  });
});

// Get wallet activity
app.get('/wallet/:address/activity', async (req, res) => {
  try {
    const { address } = req.params;
    const { chain = 'ethereum' } = req.query;

    const provider = web3Listener['providers'].get(chain as string);
    if (!provider) {
      return res.status(400).json({
        error: 'Invalid chain',
        availableChains: Array.from(web3Listener['providers'].keys()),
      });
    }

    // Get transaction history (placeholder implementation)
    const activity = await getWalletActivity(provider, address as string, chain as string);

    res.json({
      address,
      chain,
      activity,
    });
  } catch (error) {
    console.error('Error getting wallet activity:', error);
    res.status(500).json({
      error: 'Failed to get wallet activity',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Placeholder function for getting wallet activity
async function getWalletActivity(provider: any, address: string, chain: string) {
  // This would implement actual wallet activity fetching
  return {
    transactions: [],
    balance: '0',
    nonce: 0,
  };
}

// Get fraud scores
app.get('/wallet/:address/fraud-score', async (req, res) => {
  try {
    const { address } = req.params;

    // Calculate fraud score (placeholder implementation)
    const fraudScore = await calculateFraudScore(address);

    res.json({
      address,
      fraudScore,
    });
  } catch (error) {
    console.error('Error calculating fraud score:', error);
    res.status(500).json({
      error: 'Failed to calculate fraud score',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Placeholder function for calculating fraud score
async function calculateFraudScore(address: string) {
  // This would implement actual fraud score calculation
  return {
    score: 0.1,
    reason: 'Low risk address',
    factors: [],
  };
}

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Web3 Event Service running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
