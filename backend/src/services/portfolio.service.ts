import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";
import { AssetType, PortfolioTxType, Prisma } from "@prisma/client";
import * as marketService from "./market.service";

export interface PortfolioSummary {
  id: string;
  name: string;
  totalValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: HoldingWithValue[];
  allocation: AllocationItem[];
  lastUpdated: Date;
}

export interface HoldingWithValue {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  allocation: number;
}

export interface AllocationItem {
  assetType: AssetType;
  value: number;
  percentage: number;
  color: string;
}

// Get or create default portfolio for user
export async function getOrCreateDefaultPortfolio(userId: string) {
  let portfolio = await prisma.portfolio.findFirst({
    where: { userId, isDefault: true },
    include: {
      holdings: true,
    },
  });

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {
        userId,
        name: "Main Portfolio",
        isDefault: true,
      },
      include: {
        holdings: true,
      },
    });
  }

  return portfolio;
}

// Get portfolio with current market values
export async function getPortfolioSummary(
  userId: string,
): Promise<PortfolioSummary> {
  const portfolio = await getOrCreateDefaultPortfolio(userId);

  if (portfolio.holdings.length === 0) {
    return {
      id: portfolio.id,
      name: portfolio.name,
      totalValue: 0,
      totalCost: 0,
      profitLoss: 0,
      profitLossPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
      holdings: [],
      allocation: [],
      lastUpdated: new Date(),
    };
  }

  // Group holdings by asset type for market data fetching
  const cryptoSymbols = portfolio.holdings
    .filter((h) => h.assetType === "CRYPTO")
    .map((h) => h.symbol);
  const stockSymbols = portfolio.holdings
    .filter((h) => h.assetType === "STOCK" || h.assetType === "ETF")
    .map((h) => h.symbol);
  const forexPairs = portfolio.holdings
    .filter((h) => h.assetType === "FOREX")
    .map((h) => h.symbol);

  // Fetch current prices
  const [cryptoQuotes, stockQuotes, forexRates] = await Promise.all([
    cryptoSymbols.length > 0
      ? marketService.getCryptoQuotes(cryptoSymbols)
      : [],
    stockSymbols.length > 0 ? marketService.getStockQuotes(stockSymbols) : [],
    forexPairs.length > 0 ? marketService.getForexRates(forexPairs) : [],
  ]);

  // Create price lookup map
  const priceMap = new Map<
    string,
    { price: number; change: number; changePercent: number }
  >();

  cryptoQuotes.forEach((q) => {
    priceMap.set(q.symbol, {
      price: q.price,
      change: q.change24h,
      changePercent: q.changePercent24h,
    });
  });
  stockQuotes.forEach((q) => {
    priceMap.set(q.symbol, {
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
    });
  });
  forexRates.forEach((r) => {
    priceMap.set(r.pair, {
      price: r.rate,
      change: r.change,
      changePercent: r.changePercent,
    });
  });

  // Calculate holdings with current values
  let totalValue = 0;
  let totalCost = 0;
  let totalDayChange = 0;

  const holdingsWithValue: HoldingWithValue[] = portfolio.holdings.map(
    (holding) => {
      const marketData = priceMap.get(holding.symbol);
      const quantity = Number(holding.quantity);
      const avgCost = Number(holding.averageCost);
      const holdingTotalCost = Number(holding.totalCost);

      const currentPrice = marketData?.price || avgCost;
      const currentValue = quantity * currentPrice;
      const profitLoss = currentValue - holdingTotalCost;
      const profitLossPercent =
        holdingTotalCost > 0 ? (profitLoss / holdingTotalCost) * 100 : 0;

      const dayChange = marketData
        ? currentValue * (marketData.changePercent / 100)
        : 0;
      const dayChangePercent = marketData?.changePercent || 0;

      totalValue += currentValue;
      totalCost += holdingTotalCost;
      totalDayChange += dayChange;

      return {
        id: holding.id,
        symbol: holding.symbol,
        name: holding.name,
        assetType: holding.assetType,
        quantity,
        averageCost: avgCost,
        totalCost: holdingTotalCost,
        currentPrice,
        currentValue,
        profitLoss,
        profitLossPercent,
        dayChange,
        dayChangePercent,
        allocation: 0, // Will be calculated after we have totalValue
      };
    },
  );

  // Calculate allocation percentages
  holdingsWithValue.forEach((h) => {
    h.allocation = totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0;
  });

  // Sort by value descending
  holdingsWithValue.sort((a, b) => b.currentValue - a.currentValue);

  // Calculate allocation by asset type
  const allocationByType = new Map<AssetType, number>();
  holdingsWithValue.forEach((h) => {
    const current = allocationByType.get(h.assetType) || 0;
    allocationByType.set(h.assetType, current + h.currentValue);
  });

  const assetColors: Record<AssetType, string> = {
    CRYPTO: "#f7931a",
    STOCK: "#22c55e",
    ETF: "#3b82f6",
    FOREX: "#8b5cf6",
    BOND: "#06b6d4",
    COMMODITY: "#eab308",
    CASH: "#64748b",
  };

  const allocation: AllocationItem[] = Array.from(
    allocationByType.entries(),
  ).map(([type, value]) => ({
    assetType: type,
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    color: assetColors[type],
  }));

  const profitLoss = totalValue - totalCost;
  const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
  const dayChangePercent =
    totalValue > 0 ? (totalDayChange / (totalValue - totalDayChange)) * 100 : 0;

  return {
    id: portfolio.id,
    name: portfolio.name,
    totalValue,
    totalCost,
    profitLoss,
    profitLossPercent,
    dayChange: totalDayChange,
    dayChangePercent,
    holdings: holdingsWithValue,
    allocation,
    lastUpdated: new Date(),
  };
}

// Add a holding or update existing
export async function addHolding(
  userId: string,
  data: {
    symbol: string;
    name: string;
    assetType: AssetType;
    quantity: number;
    price: number;
    fees?: number;
    notes?: string;
  },
) {
  const portfolio = await getOrCreateDefaultPortfolio(userId);
  const totalAmount = data.quantity * data.price;
  const fees = data.fees || 0;

  // Check if holding exists
  const existingHolding = await prisma.holding.findUnique({
    where: {
      portfolioId_symbol: {
        portfolioId: portfolio.id,
        symbol: data.symbol,
      },
    },
  });

  if (existingHolding) {
    // Update existing holding with new average cost
    const oldQuantity = Number(existingHolding.quantity);
    const oldTotalCost = Number(existingHolding.totalCost);
    const newQuantity = oldQuantity + data.quantity;
    const newTotalCost = oldTotalCost + totalAmount + fees;
    const newAvgCost = newTotalCost / newQuantity;

    await prisma.holding.update({
      where: { id: existingHolding.id },
      data: {
        quantity: newQuantity,
        averageCost: newAvgCost,
        totalCost: newTotalCost,
      },
    });
  } else {
    // Create new holding
    await prisma.holding.create({
      data: {
        portfolioId: portfolio.id,
        symbol: data.symbol,
        name: data.name,
        assetType: data.assetType,
        quantity: data.quantity,
        averageCost: data.price,
        totalCost: totalAmount + fees,
      },
    });
  }

  // Record transaction
  await prisma.portfolioTransaction.create({
    data: {
      portfolioId: portfolio.id,
      symbol: data.symbol,
      assetType: data.assetType,
      transactionType: "BUY",
      quantity: data.quantity,
      price: data.price,
      totalAmount: totalAmount + fees,
      fees,
      notes: data.notes,
    },
  });

  return getPortfolioSummary(userId);
}

// Sell a holding
export async function sellHolding(
  userId: string,
  data: {
    symbol: string;
    quantity: number;
    price: number;
    fees?: number;
    notes?: string;
  },
) {
  const portfolio = await getOrCreateDefaultPortfolio(userId);
  const totalAmount = data.quantity * data.price;
  const fees = data.fees || 0;

  const holding = await prisma.holding.findUnique({
    where: {
      portfolioId_symbol: {
        portfolioId: portfolio.id,
        symbol: data.symbol,
      },
    },
  });

  if (!holding) {
    throw new Error(`No holding found for ${data.symbol}`);
  }

  const currentQuantity = Number(holding.quantity);
  if (data.quantity > currentQuantity) {
    throw new Error(
      `Insufficient quantity. You have ${currentQuantity} ${data.symbol}`,
    );
  }

  const newQuantity = currentQuantity - data.quantity;
  const costBasisSold = Number(holding.averageCost) * data.quantity;

  if (newQuantity === 0) {
    // Remove holding entirely
    await prisma.holding.delete({
      where: { id: holding.id },
    });
  } else {
    // Update holding
    const newTotalCost = Number(holding.totalCost) - costBasisSold;
    await prisma.holding.update({
      where: { id: holding.id },
      data: {
        quantity: newQuantity,
        totalCost: newTotalCost,
      },
    });
  }

  // Record transaction
  await prisma.portfolioTransaction.create({
    data: {
      portfolioId: portfolio.id,
      symbol: data.symbol,
      assetType: holding.assetType,
      transactionType: "SELL",
      quantity: data.quantity,
      price: data.price,
      totalAmount: totalAmount - fees,
      fees,
      notes: data.notes,
    },
  });

  return getPortfolioSummary(userId);
}

// Get transaction history
export async function getTransactionHistory(
  userId: string,
  options?: {
    symbol?: string;
    limit?: number;
    offset?: number;
  },
) {
  const portfolio = await getOrCreateDefaultPortfolio(userId);

  const where: Prisma.PortfolioTransactionWhereInput = {
    portfolioId: portfolio.id,
  };

  if (options?.symbol) {
    where.symbol = options.symbol;
  }

  const transactions = await prisma.portfolioTransaction.findMany({
    where,
    orderBy: { executedAt: "desc" },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });

  return transactions;
}

// Get portfolio performance over time
export async function getPortfolioPerformance(
  userId: string,
  period: "1W" | "1M" | "3M" | "1Y" | "ALL" = "1M",
) {
  const portfolio = await getOrCreateDefaultPortfolio(userId);

  const periodDays: Record<string, number> = {
    "1W": 7,
    "1M": 30,
    "3M": 90,
    "1Y": 365,
    ALL: 9999,
  };

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays[period]);

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: {
      portfolioId: portfolio.id,
      snapshotAt: { gte: startDate },
    },
    orderBy: { snapshotAt: "asc" },
  });

  // If no snapshots, generate mock data based on current holdings
  if (snapshots.length === 0) {
    const currentSummary = await getPortfolioSummary(userId);
    const days = Math.min(periodDays[period], 30);
    const mockData = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Simulate some variation
      const variation = (Math.random() - 0.5) * 0.04; // ±2% daily variation
      const factor = 1 + variation * (i / days);

      mockData.push({
        date: date.toISOString().split("T")[0],
        value: currentSummary.totalValue * factor,
        cost: currentSummary.totalCost,
      });
    }

    return mockData;
  }

  return snapshots.map((s) => ({
    date: s.snapshotAt.toISOString().split("T")[0],
    value: Number(s.totalValue),
    cost: Number(s.totalCost),
  }));
}

// Take a snapshot of current portfolio value
export async function takeSnapshot(userId: string) {
  const summary = await getPortfolioSummary(userId);

  const snapshot = await prisma.portfolioSnapshot.create({
    data: {
      portfolioId: summary.id,
      totalValue: summary.totalValue,
      totalCost: summary.totalCost,
      profitLoss: summary.profitLoss,
      profitLossPercent: summary.profitLossPercent,
      holdingsData: summary.holdings as any,
    },
  });

  return snapshot;
}

// Delete a holding
export async function deleteHolding(userId: string, holdingId: string) {
  const portfolio = await getOrCreateDefaultPortfolio(userId);

  const holding = await prisma.holding.findFirst({
    where: {
      id: holdingId,
      portfolioId: portfolio.id,
    },
  });

  if (!holding) {
    throw new Error("Holding not found");
  }

  await prisma.holding.delete({
    where: { id: holdingId },
  });

  return getPortfolioSummary(userId);
}
