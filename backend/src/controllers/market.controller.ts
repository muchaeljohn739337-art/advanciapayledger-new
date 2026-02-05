import { Request, Response } from "express";
import { logger } from "../utils/logger";
import * as marketService from "../services/market.service";

export const getMarketSummary = async (req: Request, res: Response) => {
  try {
    const summary = await marketService.getMarketSummary();
    res.json(summary);
  } catch (error) {
    logger.error("Error fetching market summary:", error);
    res.status(500).json({ error: "Failed to fetch market summary" });
  }
};

export const getStockQuotes = async (req: Request, res: Response) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols || typeof symbols !== "string") {
      return res.status(400).json({ error: "Symbols parameter is required" });
    }

    const symbolList = symbols.split(",").map((s) => s.trim().toUpperCase());
    const quotes = await marketService.getStockQuotes(symbolList);
    res.json(quotes);
  } catch (error) {
    logger.error("Error fetching stock quotes:", error);
    res.status(500).json({ error: "Failed to fetch stock quotes" });
  }
};

export const getCryptoQuotes = async (req: Request, res: Response) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols || typeof symbols !== "string") {
      return res.status(400).json({ error: "Symbols parameter is required" });
    }

    const symbolList = symbols.split(",").map((s) => s.trim().toUpperCase());
    const quotes = await marketService.getCryptoQuotes(symbolList);
    res.json(quotes);
  } catch (error) {
    logger.error("Error fetching crypto quotes:", error);
    res.status(500).json({ error: "Failed to fetch crypto quotes" });
  }
};

export const getForexRates = async (req: Request, res: Response) => {
  try {
    const { pairs } = req.query;
    
    if (!pairs || typeof pairs !== "string") {
      return res.status(400).json({ error: "Pairs parameter is required" });
    }

    const pairList = pairs.split(",").map((p) => p.trim().toUpperCase());
    const rates = await marketService.getForexRates(pairList);
    res.json(rates);
  } catch (error) {
    logger.error("Error fetching forex rates:", error);
    res.status(500).json({ error: "Failed to fetch forex rates" });
  }
};

export const getHistoricalData = async (req: Request, res: Response) => {
  try {
    const { symbol, type, period } = req.query;
    
    if (!symbol || typeof symbol !== "string") {
      return res.status(400).json({ error: "Symbol parameter is required" });
    }

    if (!type || !["stock", "crypto", "forex"].includes(type as string)) {
      return res.status(400).json({ error: "Valid type parameter is required (stock, crypto, forex)" });
    }

    const validPeriods = ["1D", "1W", "1M", "3M", "1Y", "5Y"];
    const selectedPeriod = validPeriods.includes(period as string) 
      ? (period as "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y") 
      : "1M";

    const data = await marketService.getHistoricalData(
      symbol.toUpperCase(),
      type as "stock" | "crypto" | "forex",
      selectedPeriod
    );
    
    res.json(data);
  } catch (error) {
    logger.error("Error fetching historical data:", error);
    res.status(500).json({ error: "Failed to fetch historical data" });
  }
};

export const getWatchlist = async (req: Request, res: Response) => {
  try {
    // Default watchlist - can be extended to use user preferences from database
    const [stocks, crypto, forex] = await Promise.all([
      marketService.getStockQuotes(["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA"]),
      marketService.getCryptoQuotes(["BTC", "ETH", "SOL", "XRP", "BNB"]),
      marketService.getForexRates(["EUR/USD", "GBP/USD", "USD/JPY"]),
    ]);

    res.json({
      stocks,
      crypto,
      forex,
      lastUpdated: new Date(),
    });
  } catch (error) {
    logger.error("Error fetching watchlist:", error);
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
};

export const searchSymbol = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const searchTerm = query.toUpperCase();
    
    // Mock search results - replace with real API in production
    const allSymbols = [
      { symbol: "AAPL", name: "Apple Inc.", type: "stock" },
      { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock" },
      { symbol: "MSFT", name: "Microsoft Corporation", type: "stock" },
      { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock" },
      { symbol: "TSLA", name: "Tesla Inc.", type: "stock" },
      { symbol: "META", name: "Meta Platforms Inc.", type: "stock" },
      { symbol: "NVDA", name: "NVIDIA Corporation", type: "stock" },
      { symbol: "BTC", name: "Bitcoin", type: "crypto" },
      { symbol: "ETH", name: "Ethereum", type: "crypto" },
      { symbol: "SOL", name: "Solana", type: "crypto" },
      { symbol: "XRP", name: "Ripple", type: "crypto" },
      { symbol: "BNB", name: "BNB", type: "crypto" },
      { symbol: "EUR/USD", name: "Euro / US Dollar", type: "forex" },
      { symbol: "GBP/USD", name: "British Pound / US Dollar", type: "forex" },
      { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", type: "forex" },
    ];

    const results = allSymbols.filter(
      (s) => s.symbol.includes(searchTerm) || s.name.toUpperCase().includes(searchTerm)
    );

    res.json(results);
  } catch (error) {
    logger.error("Error searching symbols:", error);
    res.status(500).json({ error: "Failed to search symbols" });
  }
};
