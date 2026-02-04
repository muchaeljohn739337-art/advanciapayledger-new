export interface Web3Provider {
  name: string;
  chainId: number;
  rpcUrl: string;
  wsUrl?: string;
  blockTime: number;
  gasPrice: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface Web3Transaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  blockNumber?: number;
  timestamp: Date;
  gasUsed?: number;
  gasPrice?: number;
  confirmations?: number;
  status: 'pending' | 'confirmed' | 'failed';
  nonce?: number;
  data?: string;
}

export interface SmartContract {
  address: string;
  name: string;
  abi: string[];
  bytecode?: string;
  deployedAt: number;
  network: string;
  verified: boolean;
}

export interface ContractEvent {
  eventName: string;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  logIndex: number;
  transactionIndex: number;
  network: string;
  timestamp: Date;
  values: Record<string, unknown>;
  signature: string;
  topics: string[];
  data: string;
}

export interface EventMapping {
  eventName: string;
  signature: string;
  processor: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  conditions: {
    minValue?: number;
    maxValue?: number;
    allowedSenders: string[];
    excludedSenders: string[];
    timeWindow?: {
      start: string;
      end: string;
    };
  };
}

export interface EventProcessor {
  name: string;
  handler: (event: ContractEvent) => Promise<void>;
  retryCount: number;
  timeout: number;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  type: 'ERC20' | 'ERC721' | 'ERC1155';
  network: string;
}

export interface WalletBalance {
  address: string;
  network: string;
  balances: {
    [tokenAddress: string]: {
      symbol: string;
      balance: string;
      valueUsd: number;
    };
  };
  totalValueUsd: number;
  lastUpdated: Date;
}

export interface BlockInfo {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: Date;
  gasLimit: number;
  gasUsed: number;
  miner: string;
  difficulty?: number;
  baseFeePerGas?: number;
  transactions: string[];
}

export interface GasEstimate {
  gasLimit: number;
  gasPrice: number;
  maxFeePerGas?: number;
  maxPriorityFeePerGas?: number;
  estimatedCost: number;
  estimatedTime: number;
}

export interface NetworkStatus {
  network: string;
  chainId: number;
  blockNumber: number;
  gasPrice: number;
  networkUtilization: number;
  tps: number;
  connectedPeers: number;
  syncStatus: 'synced' | 'syncing' | 'not_synced';
  lastBlockTime: Date;
}

export interface DeFiPosition {
  protocol: string;
  pool: string;
  tokens: string[];
  amounts: string[];
  valueUsd: number;
  apy: number;
  rewards: {
    token: string;
    amount: string;
    valueUsd: number;
  }[];
  healthFactor?: number;
  leverage?: number;
}

export interface NFTMetadata {
  contract: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  owner: string;
  network: string;
}

export interface WebhookEvent {
  id: string;
  type: 'transaction' | 'contract_event' | 'block' | 'balance_change';
  network: string;
  data: any;
  timestamp: Date;
  processed: boolean;
  retryCount: number;
  error?: string;
}

export interface SubscriptionFilter {
  address?: string;
  topics?: string[];
  fromBlock?: number;
  toBlock?: number;
  eventNames?: string[];
}

export interface EventSubscription {
  id: string;
  network: string;
  contractAddress: string;
  eventName: string;
  filter: SubscriptionFilter;
  webhookUrl: string;
  active: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface BatchTransaction {
  id: string;
  transactions: Array<{
    to: string;
    value: number;
    data?: string;
  }>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  network: string;
  gasEstimate: GasEstimate;
  results?: Array<{
    hash: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
  createdAt: Date;
  completedAt?: Date;
}

export interface MultisigWallet {
  address: string;
  network: string;
  owners: string[];
  threshold: number;
  nonce: number;
  balance: string;
  transactions: MultisigTransaction[];
}

export interface MultisigTransaction {
  id: string;
  wallet: string;
  to: string;
  value: number;
  data: string;
  nonce: number;
  signatures: string[];
  executed: boolean;
  createdAt: Date;
  executedAt?: Date;
}

export interface CrossChainTransfer {
  id: string;
  fromNetwork: string;
  toNetwork: string;
  token: string;
  amount: string;
  sender: string;
  recipient: string;
  bridge: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sourceTxHash?: string;
  targetTxHash?: string;
  estimatedTime: number;
  fee: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface LiquidityPool {
  address: string;
  network: string;
  protocol: string;
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  fee: number;
  apr: number;
  volume24h: string;
  liquidity: string;
}

export interface SwapQuote {
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  routes: Array<{
    protocol: string;
    pools: string[];
    percent: number;
  }>;
  gasEstimate: GasEstimate;
  validUntil: Date;
}

export interface YieldFarmingPosition {
  protocol: string;
  pool: string;
  stakedToken: string;
  stakedAmount: string;
  rewardTokens: Array<{
    token: string;
    apr: number;
    earned: string;
  }>;
  totalValueUsd: number;
  entryTime: Date;
  lastHarvest: Date;
}

export interface FlashLoan {
  id: string;
  token: string;
  amount: string;
  borrower: string;
  protocol: string;
  purpose: string;
  fee: string;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ArbitrageOpportunity {
  id: string;
  token0: string;
  token1: string;
  exchange0: string;
  exchange1: string;
  price0: number;
  price1: number;
  profit: number;
  profitPercent: number;
  gasEstimate: GasEstimate;
  validUntil: Date;
  executed: boolean;
  executedAt?: Date;
}

export interface MEVProtection {
  enabled: boolean;
  strategies: ['private_mempool' | 'flashbots' | 'commit_reveal'];
  maxGasPrice: number;
  maxSlippage: number;
  deadline: number;
}

export interface Web3Analytics {
  network: string;
  timeframe: '1h' | '24h' | '7d' | '30d';
  metrics: {
    totalTransactions: number;
    totalValue: number;
    averageGasPrice: number;
    networkUtilization: number;
    activeAddresses: number;
    tps: number;
  };
  topTokens: Array<{
    symbol: string;
    volume: number;
    transactions: number;
    priceChange: number;
  }>;
  topContracts: Array<{
    address: string;
    name: string;
    transactions: number;
    volume: number;
  }>;
}
