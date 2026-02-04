import { 
  CryptoCurrency, 
  CryptoPaymentResult, 
  CreateCryptoPaymentRequest 
} from '../types/payment.types';
import { Web3Service } from './web3.service';
import { logger } from '../utils/logger';

export class CryptoPaymentProvider {
  constructor(
    private web3Service: Web3Service
  ) {}

  async createPayment(request: {
    paymentId: string;
    amount: number;
    cryptoCurrency: CryptoCurrency;
    walletAddress: string;
    network?: string;
  }): Promise<CryptoPaymentResult> {
    try {
      const network = request.network || 'ethereum';
      
      // Get current exchange rate
      const exchangeRate = await this.getExchangeRate(request.currency, request.cryptoCurrency);
      const cryptoAmount = request.amount * exchangeRate;

      // Generate payment address
      const paymentAddress = await this.generatePaymentAddress(network, request.cryptoCurrency);
      
      // Calculate expected amount with buffer for gas fees
      const expectedAmount = cryptoAmount * 1.01; // 1% buffer
      
      // Set expiry time (15 minutes)
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000);

      // Create payment monitoring
      await this.setupPaymentMonitoring(request.paymentId, paymentAddress, expectedAmount, network);

      const result: CryptoPaymentResult = {
        paymentId: request.paymentId,
        expectedAmount,
        paymentUrl: this.buildPaymentUrl(paymentAddress, request.cryptoCurrency, network),
        qrCode: await this.generateQRCode(paymentAddress, request.cryptoCurrency, expectedAmount),
        expiryTime,
        status: 'pending'
      };

      logger.info('Crypto payment created', { 
        paymentId: request.paymentId, 
        cryptoCurrency: request.cryptoCurrency,
        amount: cryptoAmount 
      });

      return result;
    } catch (error) {
      logger.error('Failed to create crypto payment', { error, request });
      throw new Error('Failed to create crypto payment');
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{
    status: string;
    transactionHash?: string;
    blockNumber?: number;
    confirmations?: number;
  }> {
    try {
      const monitoring = await this.getPaymentMonitoring(paymentId);
      if (!monitoring) {
        throw new Error('Payment monitoring not found');
      }

      const transactions = await this.web3Service.getTransactionsToAddress(
        monitoring.paymentAddress,
        monitoring.network
      );

      const matchingTransaction = transactions.find(tx => 
        tx.value >= monitoring.expectedAmount * 0.99 && // Allow 1% variance
        tx.timestamp >= monitoring.createdAt
      );

      if (!matchingTransaction) {
        return { status: 'pending' };
      }

      const confirmations = await this.web3Service.getConfirmations(
        matchingTransaction.hash,
        monitoring.network
      );

      const status = confirmations >= this.getRequiredConfirmations(monitoring.cryptoCurrency) 
        ? 'completed' 
        : 'processing';

      return {
        status,
        transactionHash: matchingTransaction.hash,
        blockNumber: matchingTransaction.blockNumber,
        confirmations
      };
    } catch (error) {
      logger.error('Failed to get crypto payment status', { error, paymentId });
      throw new Error('Failed to get payment status');
    }
  }

  async refundPayment(request: {
    paymentId: string;
    transactionHash: string;
    amount: number;
    cryptoCurrency: CryptoCurrency;
  }): Promise<{ refundId: string; status: string }> {
    try {
      // Get original transaction details
      const transaction = await this.web3Service.getTransaction(request.transactionHash);
      if (!transaction) {
        throw new Error('Original transaction not found');
      }

      // Create refund transaction
      const refundTx = await this.web3Service.createRefundTransaction({
        to: transaction.from,
        amount: request.amount,
        cryptoCurrency: request.cryptoCurrency,
        originalTxHash: request.transactionHash
      });

      const refundId = `refund_${request.paymentId}_${Date.now()}`;

      logger.info('Crypto refund created', { 
        refundId, 
        paymentId: request.paymentId,
        amount: request.amount 
      });

      return {
        refundId,
        status: 'processing'
      };
    } catch (error) {
      logger.error('Failed to refund crypto payment', { error, request });
      throw new Error('Failed to refund crypto payment');
    }
  }

  private async getExchangeRate(fromCurrency: string, toCryptoCurrency: CryptoCurrency): Promise<number> {
    // In production, integrate with real exchange rate APIs
    const mockRates: Record<string, number> = {
      'USD-BTC': 0.000025,
      'USD-ETH': 0.00033,
      'USD-USDC': 1.0,
      'USD-USDT': 1.0,
      'USD-SOL': 0.0075,
      'USD-ADA': 1.5
    };

    const rate = mockRates[`${fromCurrency}-${toCryptoCurrency}`];
    if (!rate) {
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCryptoCurrency}`);
    }

    return rate;
  }

  private async generatePaymentAddress(network: string, cryptoCurrency: CryptoCurrency): Promise<string> {
    // Generate unique payment address for each transaction
    return await this.web3Service.generateAddress(network, cryptoCurrency);
  }

  private buildPaymentUrl(address: string, cryptoCurrency: CryptoCurrency, network: string): string {
    const baseUrl = this.getNetworkBaseUrl(network, cryptoCurrency);
    return `${baseUrl}/send?to=${address}`;
  }

  private async generateQRCode(address: string, cryptoCurrency: CryptoCurrency, amount: number): Promise<string> {
    // Generate QR code data URI
    const qrData = `${cryptoCurrency}:${address}?amount=${amount}`;
    return `data:image/png;base64,mock_qr_code_${Buffer.from(qrData).toString('base64')}`;
  }

  private async setupPaymentMonitoring(
    paymentId: string, 
    address: string, 
    expectedAmount: number, 
    network: string
  ): Promise<void> {
    // Store payment monitoring data
    await this.savePaymentMonitoring({
      paymentId,
      paymentAddress: address,
      expectedAmount,
      network,
      createdAt: new Date(),
      status: 'active'
    });
  }

  private async getPaymentMonitoring(paymentId: string): Promise<any> {
    // Retrieve payment monitoring data
    return {
      paymentId,
      paymentAddress: '0x123...',
      expectedAmount: 0.001,
      network: 'ethereum',
      createdAt: new Date(),
      status: 'active'
    };
  }

  private async savePaymentMonitoring(data: any): Promise<void> {
    // Save to database or cache
    logger.info('Payment monitoring setup', data);
  }

  private getRequiredConfirmations(cryptoCurrency: CryptoCurrency): number {
    const confirmations: Record<CryptoCurrency, number> = {
      [CryptoCurrency.BTC]: 6,
      [CryptoCurrency.ETH]: 12,
      [CryptoCurrency.USDC]: 12,
      [CryptoCurrency.USDT]: 12,
      [CryptoCurrency.SOL]: 32,
      [CryptoCurrency.ADA]: 15
    };

    return confirmations[cryptoCurrency] || 12;
  }

  private getNetworkBaseUrl(network: string, cryptoCurrency: CryptoCurrency): string {
    const baseUrls: Record<string, string> = {
      'ethereum-BTC': 'bitcoin:',
      'ethereum-ETH': 'ethereum:',
      'ethereum-USDC': 'ethereum:',
      'ethereum-USDT': 'ethereum:',
      'polygon-ETH': 'polygon:',
      'polygon-USDC': 'polygon:',
      'solana-SOL': 'solana:'
    };

    return baseUrls[`${network}-${cryptoCurrency}`] || 'ethereum:';
  }
}
