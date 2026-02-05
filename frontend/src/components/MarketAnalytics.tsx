"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Bitcoin,
  Globe,
  BarChart3,
  LineChart as LineChartIcon,
} from "lucide-react";
import PriceChart from "./PriceChart";
import AssetDetailModal from "./AssetDetailModal";

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
}

interface ForexRate {
  pair: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  change: number;
  changePercent: number;
}

interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

interface MarketSummary {
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
  indices: MarketIndex[];
  lastUpdated: string;
}

type TabType = "overview" | "stocks" | "crypto" | "forex";

interface SelectedAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: "stock" | "crypto" | "forex";
  volume?: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
}

export default function MarketAnalytics() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [marketData, setMarketData] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMarketData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/market/summary", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch market data");

      const data = await response.json();
      setMarketData(data);
    } catch (err) {
      setError("Failed to load market data. Please try again.");
      console.error("Market data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openAssetDetail = (asset: SelectedAsset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };

  const closeAssetDetail = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  const formatCurrency = (value: number, decimals = 2) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toString();
  };

  const PriceChange = ({
    change,
    percent,
  }: {
    change: number;
    percent: number;
  }) => {
    const isPositive = change >= 0;
    return (
      <div
        className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}
      >
        {isPositive ? (
          <ArrowUpRight className="h-4 w-4" />
        ) : (
          <ArrowDownRight className="h-4 w-4" />
        )}
        <span className="font-medium">
          {isPositive ? "+" : ""}
          {change.toFixed(2)} ({isPositive ? "+" : ""}
          {percent.toFixed(2)}%)
        </span>
      </div>
    );
  };

  const QuoteCard = ({
    symbol,
    name,
    price,
    change,
    changePercent,
    icon: Icon,
    assetType,
    volume,
    marketCap,
  }: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    icon: React.ElementType;
    assetType: "stock" | "crypto" | "forex";
    volume?: number;
    marketCap?: number;
  }) => (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={() =>
        openAssetDetail({
          symbol,
          name,
          price,
          change,
          changePercent,
          type: assetType,
          volume,
          marketCap,
        })
      }
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-gray-500" />
            <div>
              <span className="font-bold text-lg">{symbol}</span>
              <p className="text-xs text-gray-500 truncate max-w-[120px]">
                {name}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                openAssetDetail({
                  symbol,
                  name,
                  price,
                  change,
                  changePercent,
                  type: assetType,
                  volume,
                  marketCap,
                });
              }}
            >
              <LineChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Star className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">
            {formatCurrency(price, price < 1 ? 4 : 2)}
          </p>
          <PriceChange change={change} percent={changePercent} />
        </div>
      </CardContent>
    </Card>
  );

  const IndexCard = ({ index }: { index: MarketIndex }) => (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <CardContent className="p-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {index.name}
        </p>
        <p className="text-xl font-bold mt-1">
          {index.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <PriceChange change={index.change} percent={index.changePercent} />
      </CardContent>
    </Card>
  );

  if (loading && !marketData) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !marketData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchMarketData}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Market Analytics</h1>
          <p className="text-gray-500">
            Last updated:{" "}
            {marketData?.lastUpdated
              ? new Date(marketData.lastUpdated).toLocaleString()
              : "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            onClick={fetchMarketData}
            variant="outline"
            size="icon"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {[
          { id: "overview" as TabType, label: "Overview", icon: BarChart3 },
          { id: "stocks" as TabType, label: "Stocks", icon: DollarSign },
          { id: "crypto" as TabType, label: "Crypto", icon: Bitcoin },
          { id: "forex" as TabType, label: "Forex", icon: Globe },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Market Indices */}
      {activeTab === "overview" && marketData && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {marketData.indices.map((index) => (
              <IndexCard key={index.name} index={index} />
            ))}
          </div>

          {/* Featured Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <PriceChart
              symbol="BTC"
              type="crypto"
              name="Bitcoin"
              currentPrice={
                marketData.crypto.topCoins.find((c) => c.symbol === "BTC")
                  ?.price
              }
              change={
                marketData.crypto.topCoins.find((c) => c.symbol === "BTC")
                  ?.change24h
              }
              changePercent={
                marketData.crypto.topCoins.find((c) => c.symbol === "BTC")
                  ?.changePercent24h
              }
            />
            <PriceChart
              symbol="AAPL"
              type="stock"
              name="Apple Inc."
              currentPrice={
                marketData.stocks.gainers.find((s) => s.symbol === "AAPL")
                  ?.price ||
                marketData.stocks.losers.find((s) => s.symbol === "AAPL")?.price
              }
              change={
                marketData.stocks.gainers.find((s) => s.symbol === "AAPL")
                  ?.change ||
                marketData.stocks.losers.find((s) => s.symbol === "AAPL")
                  ?.change
              }
              changePercent={
                marketData.stocks.gainers.find((s) => s.symbol === "AAPL")
                  ?.changePercent ||
                marketData.stocks.losers.find((s) => s.symbol === "AAPL")
                  ?.changePercent
              }
            />
          </div>

          {/* Top Gainers & Losers */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  Top Gainers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketData.stocks.gainers.slice(0, 5).map((stock) => (
                    <div
                      key={stock.symbol}
                      className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
                    >
                      <div>
                        <span className="font-bold">{stock.symbol}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {stock.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(stock.price)}
                        </p>
                        <Badge className="bg-green-100 text-green-700">
                          +{stock.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Top Losers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketData.stocks.losers.slice(0, 5).map((stock) => (
                    <div
                      key={stock.symbol}
                      className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
                    >
                      <div>
                        <span className="font-bold">{stock.symbol}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {stock.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(stock.price)}
                        </p>
                        <Badge className="bg-red-100 text-red-700">
                          {stock.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Crypto Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bitcoin className="h-5 w-5 text-orange-500" />
                Trending Crypto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {marketData.crypto.topCoins.map((coin) => (
                  <QuoteCard
                    key={coin.symbol}
                    symbol={coin.symbol}
                    name={coin.name}
                    price={coin.price}
                    change={coin.change24h}
                    changePercent={coin.changePercent24h}
                    icon={Bitcoin}
                    assetType="crypto"
                    volume={coin.volume24h}
                    marketCap={coin.marketCap}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Forex Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Major Currency Pairs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {marketData.forex.majorPairs.map((pair) => (
                  <Card
                    key={pair.pair}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">{pair.pair}</span>
                        <PriceChange
                          change={pair.change}
                          percent={pair.changePercent}
                        />
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        {pair.rate.toFixed(4)}
                      </p>
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Bid: {pair.bid?.toFixed(4) || "-"}</span>
                        <span>Ask: {pair.ask?.toFixed(4) || "-"}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Stocks Tab */}
      {activeTab === "stocks" && marketData && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...marketData.stocks.gainers, ...marketData.stocks.losers].map(
            (stock) => (
              <QuoteCard
                key={stock.symbol}
                symbol={stock.symbol}
                name={stock.name}
                price={stock.price}
                change={stock.change}
                changePercent={stock.changePercent}
                icon={DollarSign}
                assetType="stock"
                volume={stock.volume}
                marketCap={stock.marketCap}
              />
            ),
          )}
        </div>
      )}

      {/* Crypto Tab */}
      {activeTab === "crypto" && marketData && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {marketData.crypto.topCoins.map((coin) => (
            <QuoteCard
              key={coin.symbol}
              symbol={coin.symbol}
              name={coin.name}
              price={coin.price}
              change={coin.change24h}
              changePercent={coin.changePercent24h}
              icon={Bitcoin}
              assetType="crypto"
              volume={coin.volume24h}
              marketCap={coin.marketCap}
            />
          ))}
        </div>
      )}

      {/* Forex Tab */}
      {activeTab === "forex" && marketData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketData.forex.majorPairs.map((pair) => (
            <Card key={pair.pair} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{pair.pair}</h3>
                    <p className="text-sm text-gray-500">
                      {pair.baseCurrency} / {pair.quoteCurrency}
                    </p>
                  </div>
                  <Globe className="h-6 w-6 text-blue-500" />
                </div>
                <p className="text-3xl font-bold">{pair.rate.toFixed(4)}</p>
                <PriceChange
                  change={pair.change}
                  percent={pair.changePercent}
                />
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Bid</p>
                    <p className="font-medium">{pair.bid?.toFixed(4) || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ask</p>
                    <p className="font-medium">{pair.ask?.toFixed(4) || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Asset Detail Modal */}
      <AssetDetailModal
        isOpen={isModalOpen}
        onClose={closeAssetDetail}
        asset={selectedAsset}
      />
    </div>
  );
}
