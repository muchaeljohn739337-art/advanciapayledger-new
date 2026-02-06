import { logger } from "../utils/logger";

// Market data interfaces
export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
  lastUpdated: Date;
}

export interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply?: number;
  lastUpdated: Date;
}

export interface ForexRate {
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  lastUpdated: Date;
}

export interface MarketSummary {
  stocks: {
    gainers: StockQuote[];
    losers: StockQuote[];
    mostActive: StockQuote[];
  };
  crypto: {
    topCoins: CryptoQuote[];
    trending: CryptoQuote[];
  };
  forex: {
    majorPairs: ForexRate[];
  };
  indices: {
    name: string;
    value: number;
    change: number;
    changePercent: number;
  }[];
  lastUpdated: Date;
}

// Cache for market data (5 minute TTL)
const marketCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedData<T>(key: string): T | null {
  const cached = marketCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCachedData(key: string, data: any): void {
  marketCache.set(key, { data, timestamp: Date.now() });
}

// Simulated market data (replace with real API calls in production)
// You can integrate with: Alpha Vantage, Yahoo Finance, CoinGecko, etc.

export async function getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  const cacheKey = `stocks:${symbols.join(",")}`;
  const cached = getCachedData<StockQuote[]>(cacheKey);
  if (cached) return cached;

  try {
    // TODO: Replace with real API call
    // Example: Alpha Vantage, Yahoo Finance, Polygon.io
    const quotes: StockQuote[] = symbols.map((symbol) => ({
      symbol,
      name: getStockName(symbol),
      price: generateRandomPrice(symbol),
      change: generateRandomChange(),
      changePercent: generateRandomChangePercent(),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: Math.floor(Math.random() * 1000000000000) + 10000000000,
      high52Week: generateRandomPrice(symbol) * 1.3,
      low52Week: generateRandomPrice(symbol) * 0.7,
      lastUpdated: new Date(),
    }));

    setCachedData(cacheKey, quotes);
    return quotes;
  } catch (error) {
    logger.error("Error fetching stock quotes:", error);
    throw new Error("Failed to fetch stock quotes");
  }
}

export async function getCryptoQuotes(
  symbols: string[],
): Promise<CryptoQuote[]> {
  const cacheKey = `crypto:${symbols.join(",")}`;
  const cached = getCachedData<CryptoQuote[]>(cacheKey);
  if (cached) return cached;

  try {
    // TODO: Replace with real API call
    // Example: CoinGecko, CoinMarketCap, Binance API
    const quotes: CryptoQuote[] = symbols.map((symbol) => ({
      symbol,
      name: getCryptoName(symbol),
      price: generateCryptoPrice(symbol),
      change24h: generateRandomChange(),
      changePercent24h: generateRandomChangePercent(),
      volume24h: Math.floor(Math.random() * 50000000000) + 1000000000,
      marketCap: Math.floor(Math.random() * 500000000000) + 1000000000,
      circulatingSupply: Math.floor(Math.random() * 100000000) + 1000000,
      lastUpdated: new Date(),
    }));

    setCachedData(cacheKey, quotes);
    return quotes;
  } catch (error) {
    logger.error("Error fetching crypto quotes:", error);
    throw new Error("Failed to fetch crypto quotes");
  }
}

export async function getForexRates(pairs: string[]): Promise<ForexRate[]> {
  const cacheKey = `forex:${pairs.join(",")}`;
  const cached = getCachedData<ForexRate[]>(cacheKey);
  if (cached) return cached;

  try {
    // TODO: Replace with real API call
    // Example: Open Exchange Rates, Fixer.io, XE
    const rates: ForexRate[] = pairs.map((pair) => {
      const [base, quote] = pair.split("/");
      const rate = generateForexRate(pair);
      const spread = rate * 0.0002;
      return {
        pair,
        baseCurrency: base,
        quoteCurrency: quote,
        rate,
        change: generateRandomChange() / 100,
        changePercent: generateRandomChangePercent() / 10,
        bid: rate - spread,
        ask: rate + spread,
        lastUpdated: new Date(),
      };
    });

    setCachedData(cacheKey, rates);
    return rates;
  } catch (error) {
    logger.error("Error fetching forex rates:", error);
    throw new Error("Failed to fetch forex rates");
  }
}

export async function getMarketSummary(): Promise<MarketSummary> {
  const cacheKey = "market:summary";
  const cached = getCachedData<MarketSummary>(cacheKey);
  if (cached) return cached;

  try {
    const [stocks, crypto, forex] = await Promise.all([
      getStockQuotes([
        "AAPL",
        "GOOGL",
        "MSFT",
        "AMZN",
        "TSLA",
        "META",
        "NVDA",
        "JPM",
        "V",
        "JNJ",
      ]),
      getCryptoQuotes([
        "BTC",
        "ETH",
        "BNB",
        "XRP",
        "SOL",
        "ADA",
        "DOGE",
        "DOT",
        "MATIC",
        "AVAX",
      ]),
      getForexRates([
        "EUR/USD",
        "GBP/USD",
        "USD/JPY",
        "USD/CHF",
        "AUD/USD",
        "USD/CAD",
      ]),
    ]);

    const sortedByChange = [...stocks].sort(
      (a, b) => b.changePercent - a.changePercent,
    );
    const sortedByVolume = [...stocks].sort((a, b) => b.volume - a.volume);

    const summary: MarketSummary = {
      stocks: {
        gainers: sortedByChange.slice(0, 5),
        losers: sortedByChange.slice(-5).reverse(),
        mostActive: sortedByVolume.slice(0, 5),
      },
      crypto: {
        topCoins: crypto.slice(0, 5),
        trending: [...crypto]
          .sort((a, b) => b.changePercent24h - a.changePercent24h)
          .slice(0, 5),
      },
      forex: {
        majorPairs: forex,
      },
      indices: [
        {
          name: "S&P 500",
          value: 5234.18 + Math.random() * 50,
          change: generateRandomChange(),
          changePercent: generateRandomChangePercent() / 5,
        },
        {
          name: "Dow Jones",
          value: 42156.97 + Math.random() * 200,
          change: generateRandomChange() * 10,
          changePercent: generateRandomChangePercent() / 5,
        },
        {
          name: "NASDAQ",
          value: 16742.39 + Math.random() * 100,
          change: generateRandomChange() * 5,
          changePercent: generateRandomChangePercent() / 5,
        },
        {
          name: "Russell 2000",
          value: 2089.45 + Math.random() * 20,
          change: generateRandomChange(),
          changePercent: generateRandomChangePercent() / 5,
        },
      ],
      lastUpdated: new Date(),
    };

    setCachedData(cacheKey, summary);
    return summary;
  } catch (error) {
    logger.error("Error fetching market summary:", error);
    throw new Error("Failed to fetch market summary");
  }
}

export async function getHistoricalData(
  symbol: string,
  type: "stock" | "crypto" | "forex",
  period: "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" = "1M",
): Promise<
  {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }[]
> {
  const cacheKey = `historical:${type}:${symbol}:${period}`;
  const cached = getCachedData<any[]>(cacheKey);
  if (cached) return cached;

  try {
    // Generate mock historical data
    const periods: Record<string, number> = {
      "1D": 24,
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "1Y": 365,
      "5Y": 1825,
    };

    const dataPoints = periods[period];
    const basePrice =
      type === "crypto"
        ? generateCryptoPrice(symbol)
        : generateRandomPrice(symbol);
    const data = [];

    for (let i = dataPoints; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const volatility = 0.02;
      const change = (Math.random() - 0.5) * 2 * volatility;
      const open = basePrice * (1 + (change * (dataPoints - i)) / dataPoints);
      const close = open * (1 + (Math.random() - 0.5) * volatility);
      const high =
        Math.max(open, close) * (1 + (Math.random() * volatility) / 2);
      const low =
        Math.min(open, close) * (1 - (Math.random() * volatility) / 2);

      data.push({
        date: date.toISOString().split("T")[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume:
          type !== "forex"
            ? Math.floor(Math.random() * 10000000) + 1000000
            : undefined,
      });
    }

    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    logger.error("Error fetching historical data:", error);
    throw new Error("Failed to fetch historical data");
  }
}

// Helper functions for generating mock data
function getStockName(symbol: string): string {
  const names: Record<string, string> = {
    AAPL: "Apple Inc.",
    GOOGL: "Alphabet Inc.",
    MSFT: "Microsoft Corporation",
    AMZN: "Amazon.com Inc.",
    TSLA: "Tesla Inc.",
    META: "Meta Platforms Inc.",
    NVDA: "NVIDIA Corporation",
    JPM: "JPMorgan Chase & Co.",
    V: "Visa Inc.",
    JNJ: "Johnson & Johnson",
  };
  return names[symbol] || symbol;
}

function getCryptoName(symbol: string): string {
  const names: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    BNB: "BNB",
    XRP: "Ripple",
    SOL: "Solana",
    ADA: "Cardano",
    DOGE: "Dogecoin",
    DOT: "Polkadot",
    MATIC: "Polygon",
    AVAX: "Avalanche",
  };
  return names[symbol] || symbol;
}

function generateRandomPrice(symbol: string): number {
  const basePrices: Record<string, number> = {
    AAPL: 185,
    GOOGL: 175,
    MSFT: 420,
    AMZN: 185,
    TSLA: 175,
    META: 510,
    NVDA: 875,
    JPM: 195,
    V: 285,
    JNJ: 155,
  };
  const base = basePrices[symbol] || 100;
  return parseFloat((base + (Math.random() - 0.5) * base * 0.1).toFixed(2));
}

function generateCryptoPrice(symbol: string): number {
  const basePrices: Record<string, number> = {
    BTC: 98500,
    ETH: 3450,
    BNB: 625,
    XRP: 2.45,
    SOL: 195,
    ADA: 0.98,
    DOGE: 0.32,
    DOT: 7.85,
    MATIC: 0.45,
    AVAX: 38.5,
  };
  const base = basePrices[symbol] || 100;
  return parseFloat(
    (base + (Math.random() - 0.5) * base * 0.05).toFixed(
      symbol === "BTC" ? 2 : symbol === "ETH" ? 2 : 4,
    ),
  );
}

function generateForexRate(pair: string): number {
  const rates: Record<string, number> = {
    "EUR/USD": 1.0825,
    "GBP/USD": 1.265,
    "USD/JPY": 148.75,
    "USD/CHF": 0.8825,
    "AUD/USD": 0.6545,
    "USD/CAD": 1.3575,
  };
  const base = rates[pair] || 1;
  return parseFloat((base + (Math.random() - 0.5) * base * 0.005).toFixed(4));
}

function generateRandomChange(): number {
  return parseFloat(((Math.random() - 0.5) * 10).toFixed(2));
}

function generateRandomChangePercent(): number {
  return parseFloat(((Math.random() - 0.5) * 6).toFixed(2));
}
