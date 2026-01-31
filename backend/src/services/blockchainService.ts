import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { redis } from '../utils/redis';

// Blockchain provider configuration with fallbacks
const SOLANA_RPCS = [
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana',
];

const ETH_RPCS = [
  process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
  'https://rpc.ankr.com/eth',
  'https://ethereum.publicnode.com',
];

const POLYGON_RPCS = [
  process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  'https://rpc.ankr.com/polygon',
  'https://polygon.llamarpc.com',
];

// Connection pools
let solanaConnection: Connection | null = null;
let ethProvider: ethers.JsonRpcProvider | null = null;
let polygonProvider: ethers.JsonRpcProvider | null = null;

// Circuit breaker state
const circuitBreaker = {
  solana: { failures: 0, lastFailure: 0, isOpen: false },
  ethereum: { failures: 0, lastFailure: 0, isOpen: false },
  polygon: { failures: 0, lastFailure: 0, isOpen: false },
};

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

/**
 * Initialize Solana connection with fallback
 */
function getSolanaConnection(): Connection {
  if (!solanaConnection) {
    solanaConnection = new Connection(SOLANA_RPCS[0], {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }
  return solanaConnection;
}

/**
 * Initialize Ethereum provider with fallback
 */
function getEthProvider(): ethers.JsonRpcProvider {
  if (!ethProvider) {
    ethProvider = new ethers.JsonRpcProvider(ETH_RPCS[0], undefined, {
      staticNetwork: true,
    });
  }
  return ethProvider;
}

/**
 * Initialize Polygon provider with fallback
 */
function getPolygonProvider(): ethers.JsonRpcProvider {
  if (!polygonProvider) {
    polygonProvider = new ethers.JsonRpcProvider(POLYGON_RPCS[0], undefined, {
      staticNetwork: true,
    });
  }
  return polygonProvider;
}

/**
 * Check if circuit breaker is open
 */
function isCircuitOpen(blockchain: string): boolean {
  const breaker = circuitBreaker[blockchain.toLowerCase() as keyof typeof circuitBreaker];
  if (!breaker) return false;

  if (breaker.isOpen) {
    const timeSinceLastFailure = Date.now() - breaker.lastFailure;
    if (timeSinceLastFailure > CIRCUIT_BREAKER_TIMEOUT) {
      breaker.isOpen = false;
      breaker.failures = 0;
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Record circuit breaker failure
 */
function recordFailure(blockchain: string): void {
  const breaker = circuitBreaker[blockchain.toLowerCase() as keyof typeof circuitBreaker];
  if (!breaker) return;

  breaker.failures++;
  breaker.lastFailure = Date.now();

  if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    breaker.isOpen = true;
    logger.error(`Circuit breaker opened for ${blockchain}`, {
      failures: breaker.failures,
    });
  }
}

/**
 * Reset circuit breaker on success
 */
function recordSuccess(blockchain: string): void {
  const breaker = circuitBreaker[blockchain.toLowerCase() as keyof typeof circuitBreaker];
  if (!breaker) return;

  breaker.failures = 0;
  breaker.isOpen = false;
}

/**
 * Fetch Solana balance with retry and caching
 */
export async function getSolanaBalance(
  address: string,
  useCache: boolean = true
): Promise<number> {
  if (isCircuitOpen('solana')) {
    throw new Error('Solana service temporarily unavailable');
  }

  const cacheKey = `balance:solana:${address}`;
  
  if (useCache) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return parseFloat(cached);
    }
  }

  try {
    const connection = getSolanaConnection();
    const pubkey = new PublicKey(address);
    
    const balance = await Promise.race([
      connection.getBalance(pubkey),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000)
      ),
    ]);

    const balanceSOL = balance / LAMPORTS_PER_SOL;
    
    await redis.setEx(cacheKey, 60, balanceSOL.toString());
    recordSuccess('solana');
    
    return balanceSOL;
  } catch (error) {
    recordFailure('solana');
    logger.error('Solana balance fetch failed', { address, error });
    throw new Error('Failed to fetch Solana balance');
  }
}

/**
 * Fetch Ethereum/EVM balance with retry and caching
 */
export async function getEVMBalance(
  address: string,
  blockchain: 'ETHEREUM' | 'POLYGON' | 'BASE',
  useCache: boolean = true
): Promise<number> {
  const chain = blockchain.toLowerCase();
  
  if (isCircuitOpen(chain)) {
    throw new Error(`${blockchain} service temporarily unavailable`);
  }

  const cacheKey = `balance:${chain}:${address}`;
  
  if (useCache) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return parseFloat(cached);
    }
  }

  try {
    let provider: ethers.JsonRpcProvider;
    
    switch (blockchain) {
      case 'ETHEREUM':
        provider = getEthProvider();
        break;
      case 'POLYGON':
        provider = getPolygonProvider();
        break;
      case 'BASE':
        provider = getEthProvider();
        break;
      default:
        throw new Error('Unsupported blockchain');
    }

    const balance = await Promise.race([
      provider.getBalance(address),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000)
      ),
    ]);

    const balanceETH = parseFloat(ethers.formatEther(balance));
    
    await redis.setEx(cacheKey, 60, balanceETH.toString());
    recordSuccess(chain);
    
    return balanceETH;
  } catch (error) {
    recordFailure(chain);
    logger.error(`${blockchain} balance fetch failed`, { address, error });
    throw new Error(`Failed to fetch ${blockchain} balance`);
  }
}

/**
 * Fetch balance for any supported blockchain
 */
export async function getBalance(
  address: string,
  blockchain: string,
  useCache: boolean = true
): Promise<number> {
  switch (blockchain) {
    case 'SOLANA':
      return getSolanaBalance(address, useCache);
    case 'ETHEREUM':
    case 'POLYGON':
    case 'BASE':
      return getEVMBalance(address, blockchain as any, useCache);
    default:
      throw new Error('Unsupported blockchain');
  }
}

/**
 * Fetch USD price for a token (with caching)
 */
export async function getTokenPrice(symbol: string): Promise<number> {
  const cacheKey = `price:${symbol.toLowerCase()}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return parseFloat(cached);
  }

  try {
    // TODO: Integrate with real price oracle (CoinGecko, CoinMarketCap, etc.)
    // For now, return mock prices
    const mockPrices: Record<string, number> = {
      sol: 100,
      eth: 2000,
      matic: 0.8,
      usdc: 1,
      usdt: 1,
    };

    const price = mockPrices[symbol.toLowerCase()] || 0;
    
    await redis.setEx(cacheKey, 300, price.toString());
    
    return price;
  } catch (error) {
    logger.error('Price fetch failed', { symbol, error });
    return 0;
  }
}

/**
 * Calculate USD value for a balance
 */
export async function calculateUSDValue(
  balance: number,
  blockchain: string
): Promise<number> {
  try {
    let symbol: string;
    
    switch (blockchain) {
      case 'SOLANA':
        symbol = 'sol';
        break;
      case 'ETHEREUM':
      case 'BASE':
        symbol = 'eth';
        break;
      case 'POLYGON':
        symbol = 'matic';
        break;
      default:
        return 0;
    }

    const price = await getTokenPrice(symbol);
    return balance * price;
  } catch (error) {
    logger.error('USD calculation failed', { blockchain, balance, error });
    return 0;
  }
}

/**
 * Batch fetch balances for multiple wallets
 */
export async function batchGetBalances(
  wallets: Array<{ address: string; blockchain: string }>
): Promise<Array<{ address: string; balance: number; balanceUSD: number; error?: string }>> {
  const results = await Promise.allSettled(
    wallets.map(async (wallet) => {
      try {
        const balance = await getBalance(wallet.address, wallet.blockchain);
        const balanceUSD = await calculateUSDValue(balance, wallet.blockchain);
        
        return {
          address: wallet.address,
          balance,
          balanceUSD,
        };
      } catch (error) {
        return {
          address: wallet.address,
          balance: 0,
          balanceUSD: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        address: '',
        balance: 0,
        balanceUSD: 0,
        error: result.reason?.message || 'Failed to fetch balance',
      };
    }
  });
}

/**
 * Health check for blockchain services
 */
export async function healthCheck(): Promise<{
  solana: boolean;
  ethereum: boolean;
  polygon: boolean;
}> {
  const checks = await Promise.allSettled([
    getSolanaConnection().getSlot().then(() => true).catch(() => false),
    getEthProvider().getBlockNumber().then(() => true).catch(() => false),
    getPolygonProvider().getBlockNumber().then(() => true).catch(() => false),
  ]);

  return {
    solana: checks[0].status === 'fulfilled' && checks[0].value,
    ethereum: checks[1].status === 'fulfilled' && checks[1].value,
    polygon: checks[2].status === 'fulfilled' && checks[2].value,
  };
}
