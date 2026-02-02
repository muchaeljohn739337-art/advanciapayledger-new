import axios from 'axios';
import { Redis } from 'ioredis';
import { logger } from "../utils/logger";

interface CryptoPrices {
  [key: string]: {
    usd: number;
    eur: number;
    name: string;
    symbol: string;
    change24h?: number;
  };
}

interface ConversionResult {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rate: number;
  timestamp: Date;
}

class CurrencyConversionService {
  private redis: Redis;
  private priceCache: CryptoPrices = {
    SOL: { usd: 147.50, eur: 135.70, name: 'Solana', symbol: '◎' },
    ETH: { usd: 3250.00, eur: 2990.00, name: 'Ethereum', symbol: 'Ξ' },
    BTC: { usd: 68500.00, eur: 63020.00, name: 'Bitcoin', symbol: '₿' },
    USDC: { usd: 1.00, eur: 0.92, name: 'USD Coin', symbol: '$' },
    USDT: { usd: 1.00, eur: 0.92, name: 'Tether', symbol: '₮' },
  };

  private readonly USD_TO_EUR = 0.92;
  private readonly CACHE_TTL = 60; // 60 seconds

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });

    // Start price update loop
    this.startPriceUpdates();
  }

  /**
   * Start real-time price updates from CoinGecko API
   */
  private async startPriceUpdates() {
    logger.info("Starting real-time crypto price updates");
    
    // Initial fetch
    await this.updatePrices();

    // Update every 30 seconds
    setInterval(async () => {
      await this.updatePrices();
    }, 30000);
  }

  /**
   * Fetch latest prices from CoinGecko API
   */
  private async updatePrices() {
    try {
      const coinIds = 'solana,ethereum,bitcoin,usd-coin,tether';
      const currencies = 'usd,eur';
      
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: coinIds,
            vs_currencies: currencies,
            include_24hr_change: true,
          },
          timeout: 5000,
        }
      );

      if (response.data) {
        this.priceCache = {
          SOL: {
            usd: response.data.solana?.usd || this.priceCache.SOL.usd,
            eur: response.data.solana?.eur || this.priceCache.SOL.eur,
            name: 'Solana',
            symbol: '◎',
            change24h: response.data.solana?.usd_24h_change,
          },
          ETH: {
            usd: response.data.ethereum?.usd || this.priceCache.ETH.usd,
            eur: response.data.ethereum?.eur || this.priceCache.ETH.eur,
            name: 'Ethereum',
            symbol: 'Ξ',
            change24h: response.data.ethereum?.usd_24h_change,
          },
          BTC: {
            usd: response.data.bitcoin?.usd || this.priceCache.BTC.usd,
            eur: response.data.bitcoin?.eur || this.priceCache.BTC.eur,
            name: 'Bitcoin',
            symbol: '₿',
            change24h: response.data.bitcoin?.usd_24h_change,
          },
          USDC: {
            usd: response.data['usd-coin']?.usd || 1.00,
            eur: response.data['usd-coin']?.eur || 0.92,
            name: 'USD Coin',
            symbol: '$',
            change24h: response.data['usd-coin']?.usd_24h_change,
          },
          USDT: {
            usd: response.data.tether?.usd || 1.00,
            eur: response.data.tether?.eur || 0.92,
            name: 'Tether',
            symbol: '₮',
            change24h: response.data.tether?.usd_24h_change,
          },
        };

        // Cache in Redis
        await this.redis.setex(
          'crypto:prices',
          this.CACHE_TTL,
          JSON.stringify(this.priceCache)
        );

        logger.info("Crypto prices updated successfully");
      }
    } catch (error) {
      logger.error("Failed to update crypto prices", { error });
      // Continue using cached prices
    }
  }

  /**
   * Get current crypto prices
   */
  async getPrices(): Promise<CryptoPrices> {
    try {
      const cached = await this.redis.get('crypto:prices');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.error("Redis error while fetching prices", { error });
    }

    return this.priceCache;
  }

  /**
   * Convert fiat to crypto
   */
  async convertFiatToCrypto(
    fiatAmount: number,
    fiatCurrency: 'USD' | 'EUR',
    cryptoSymbol: string
  ): Promise<ConversionResult> {
    const prices = await this.getPrices();
    const crypto = prices[cryptoSymbol];

    if (!crypto) {
      throw new Error(`Unsupported cryptocurrency: ${cryptoSymbol}`);
    }

    const rate = fiatCurrency === 'USD' ? crypto.usd : crypto.eur;
    const cryptoAmount = fiatAmount / rate;

    return {
      fromAmount: fiatAmount,
      fromCurrency: fiatCurrency,
      toAmount: parseFloat(cryptoAmount.toFixed(8)),
      toCurrency: cryptoSymbol,
      rate,
      timestamp: new Date(),
    };
  }

  /**
   * Convert crypto to fiat
   */
  async convertCryptoToFiat(
    cryptoAmount: number,
    cryptoSymbol: string,
    fiatCurrency: 'USD' | 'EUR'
  ): Promise<ConversionResult> {
    const prices = await this.getPrices();
    const crypto = prices[cryptoSymbol];

    if (!crypto) {
      throw new Error(`Unsupported cryptocurrency: ${cryptoSymbol}`);
    }

    const rate = fiatCurrency === 'USD' ? crypto.usd : crypto.eur;
    const fiatAmount = cryptoAmount * rate;

    return {
      fromAmount: cryptoAmount,
      fromCurrency: cryptoSymbol,
      toAmount: parseFloat(fiatAmount.toFixed(2)),
      toCurrency: fiatCurrency,
      rate,
      timestamp: new Date(),
    };
  }

  /**
   * Convert between fiat currencies
   */
  convertFiatToFiat(
    amount: number,
    fromCurrency: 'USD' | 'EUR',
    toCurrency: 'USD' | 'EUR'
  ): ConversionResult {
    if (fromCurrency === toCurrency) {
      return {
        fromAmount: amount,
        fromCurrency,
        toAmount: amount,
        toCurrency,
        rate: 1,
        timestamp: new Date(),
      };
    }

    const rate = fromCurrency === 'USD' ? this.USD_TO_EUR : 1 / this.USD_TO_EUR;
    const convertedAmount = amount * rate;

    return {
      fromAmount: amount,
      fromCurrency,
      toAmount: parseFloat(convertedAmount.toFixed(2)),
      toCurrency,
      rate,
      timestamp: new Date(),
    };
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    const prices = await this.getPrices();

    // Fiat to Fiat
    if (fromCurrency === 'USD' && toCurrency === 'EUR') return this.USD_TO_EUR;
    if (fromCurrency === 'EUR' && toCurrency === 'USD') return 1 / this.USD_TO_EUR;
    if (fromCurrency === toCurrency) return 1;

    // Fiat to Crypto
    if (['USD', 'EUR'].includes(fromCurrency) && prices[toCurrency]) {
      return fromCurrency === 'USD' 
        ? prices[toCurrency].usd 
        : prices[toCurrency].eur;
    }

    // Crypto to Fiat
    if (prices[fromCurrency] && ['USD', 'EUR'].includes(toCurrency)) {
      return toCurrency === 'USD'
        ? prices[fromCurrency].usd
        : prices[fromCurrency].eur;
    }

    throw new Error(`Unsupported currency pair: ${fromCurrency}/${toCurrency}`);
  }

  /**
   * Calculate conversion with fees
   */
  async calculateConversionWithFees(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    feePercentage: number = 0.5 // 0.5% default fee
  ): Promise<{
    inputAmount: number;
    outputAmount: number;
    fee: number;
    rate: number;
    effectiveRate: number;
  }> {
    let result: ConversionResult;

    if (['USD', 'EUR'].includes(fromCurrency) && ['SOL', 'ETH', 'BTC', 'USDC', 'USDT'].includes(toCurrency)) {
      result = await this.convertFiatToCrypto(
        amount,
        fromCurrency as 'USD' | 'EUR',
        toCurrency
      );
    } else if (['SOL', 'ETH', 'BTC', 'USDC', 'USDT'].includes(fromCurrency) && ['USD', 'EUR'].includes(toCurrency)) {
      result = await this.convertCryptoToFiat(
        amount,
        fromCurrency,
        toCurrency as 'USD' | 'EUR'
      );
    } else {
      throw new Error('Unsupported conversion pair');
    }

    const fee = result.toAmount * (feePercentage / 100);
    const outputAmount = result.toAmount - fee;
    const effectiveRate = outputAmount / amount;

    return {
      inputAmount: amount,
      outputAmount: parseFloat(outputAmount.toFixed(8)),
      fee: parseFloat(fee.toFixed(8)),
      rate: result.rate,
      effectiveRate: parseFloat(effectiveRate.toFixed(8)),
    };
  }

  /**
   * Get historical conversion rate (mock for now)
   */
  async getHistoricalRate(
    fromCurrency: string,
    toCurrency: string,
    date: Date
  ): Promise<number> {
    // In production, fetch from historical data API
    return this.getExchangeRate(fromCurrency, toCurrency);
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    await this.redis.quit();
  }
}

export const currencyConversionService = new CurrencyConversionService();
export default CurrencyConversionService;
