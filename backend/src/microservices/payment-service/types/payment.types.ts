export enum PaymentType {
  CRYPTO = 'crypto',
  FIAT = 'fiat'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  ACH = 'ach',
  WIRE = 'wire',
  CRYPTO = 'crypto'
}

export enum CryptoCurrency {
  BTC = 'BTC',
  ETH = 'ETH',
  USDC = 'USDC',
  USDT = 'USDT',
  SOL = 'SOL',
  ADA = 'ADA'
}

export interface Payment {
  id: string;
  type: PaymentType;
  status: PaymentStatus;
  amount: number;
  currency: string;
  cryptoCurrency?: CryptoCurrency;
  walletAddress?: string;
  paymentMethod?: PaymentMethod;
  cardDetails?: CardDetails;
  billingAddress?: BillingAddress;
  transactionHash?: string;
  transactionId?: string;
  blockNumber?: number;
  expectedAmount?: number;
  expiryTime?: Date;
  refundId?: string;
  refundReason?: string;
  userId: string;
  metadata: Record<string, any>;
  processorResponse?: any;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
}

export interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
  holderName: string;
  billingAddress?: BillingAddress;
}

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CreateCryptoPaymentRequest {
  amount: number;
  currency: string;
  cryptoCurrency: CryptoCurrency;
  walletAddress: string;
  network?: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface CreateFiatPaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  cardDetails: CardDetails;
  billingAddress?: BillingAddress;
  userId: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  payment?: Payment;
  paymentUrl?: string;
  qrCode?: string;
  redirectUrl?: string;
  error?: string;
}

export interface CryptoPaymentResult {
  paymentId: string;
  transactionHash?: string;
  expectedAmount: number;
  paymentUrl: string;
  qrCode: string;
  expiryTime: Date;
  status: string;
}

export interface FiatPaymentResult {
  paymentId: string;
  transactionId: string;
  status: string;
  redirectUrl?: string;
  processorResponse: any;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  type?: PaymentType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface PaymentStats {
  totalVolume: number;
  totalTransactions: number;
  successRate: number;
  averageTransactionValue: number;
  cryptoVolume: number;
  fiatVolume: number;
  refunds: number;
  chargebacks: number;
}
