"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  Wallet,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Bitcoin,
  Trash2,
  History,
  X,
} from "lucide-react";

interface Holding {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
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

interface AllocationItem {
  assetType: string;
  value: number;
  percentage: number;
  color: string;
}

interface PortfolioSummary {
  id: string;
  name: string;
  totalValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: Holding[];
  allocation: AllocationItem[];
  lastUpdated: string;
}

interface PerformanceData {
  date: string;
  value: number;
  cost: number;
}

interface Transaction {
  id: string;
  symbol: string;
  assetType: string;
  transactionType: string;
  quantity: number;
  price: number;
  totalAmount: number;
  fees: number;
  executedAt: string;
}

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [performancePeriod, setPerformancePeriod] = useState<string>("1M");

  const fetchPortfolio = async () => {
    try {
      const response = await fetch("/api/portfolio", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch portfolio");
      const data = await response.json();
      setPortfolio(data);
    } catch (err) {
      setError("Failed to load portfolio");
      console.error(err);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await fetch(`/api/portfolio/performance?period=${performancePeriod}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch performance");
      const data = await response.json();
      setPerformance(data);
    } catch (err) {
      console.error("Performance fetch error:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/portfolio/transactions?limit=20", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.error("Transactions fetch error:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPortfolio(), fetchPerformance(), fetchTransactions()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    fetchPerformance();
  }, [performancePeriod]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const PriceChange = ({ value, percent }: { value: number; percent: number }) => {
    const isPositive = value >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        <span className="font-medium">
          {formatCurrency(Math.abs(value))} ({formatPercent(percent)})
        </span>
      </div>
    );
  };

  const deleteHolding = async (holdingId: string) => {
    if (!confirm("Are you sure you want to remove this holding?")) return;
    
    try {
      const response = await fetch(`/api/portfolio/holdings/${holdingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete holding");
      const data = await response.json();
      setPortfolio(data);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete holding");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !portfolio) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchPortfolio}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            Portfolio
          </h1>
          <p className="text-gray-500">
            Last updated: {portfolio?.lastUpdated ? new Date(portfolio.lastUpdated).toLocaleString() : "N/A"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTransactions(true)}>
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(portfolio?.totalValue || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(portfolio?.totalCost || 0)}</p>
          </CardContent>
        </Card>

        <Card className={portfolio?.profitLoss && portfolio.profitLoss >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total P&L</p>
            <div className="mt-1">
              <PriceChange 
                value={portfolio?.profitLoss || 0} 
                percent={portfolio?.profitLossPercent || 0} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Today&apos;s Change</p>
            <div className="mt-1">
              <PriceChange 
                value={portfolio?.dayChange || 0} 
                percent={portfolio?.dayChangePercent || 0} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance
              </CardTitle>
              <div className="flex gap-1">
                {["1W", "1M", "3M", "1Y", "ALL"].map((p) => (
                  <Button
                    key={p}
                    variant={performancePeriod === p ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPerformancePeriod(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performance}>
                  <defs>
                    <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis 
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Value"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#valueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Allocation Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              {portfolio?.allocation && portfolio.allocation.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolio.allocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="percentage"
                      nameKey="assetType"
                    >
                      {portfolio.allocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  No holdings yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolio?.holdings && portfolio.holdings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Asset</th>
                    <th className="pb-3 font-medium text-right">Quantity</th>
                    <th className="pb-3 font-medium text-right">Avg Cost</th>
                    <th className="pb-3 font-medium text-right">Current Price</th>
                    <th className="pb-3 font-medium text-right">Value</th>
                    <th className="pb-3 font-medium text-right">P&L</th>
                    <th className="pb-3 font-medium text-right">Allocation</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((holding) => (
                    <tr key={holding.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {holding.assetType === "CRYPTO" ? (
                            <Bitcoin className="h-5 w-5 text-orange-500" />
                          ) : (
                            <DollarSign className="h-5 w-5 text-green-500" />
                          )}
                          <div>
                            <p className="font-bold">{holding.symbol}</p>
                            <p className="text-sm text-gray-500">{holding.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right font-mono">
                        {holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </td>
                      <td className="py-4 text-right">{formatCurrency(holding.averageCost)}</td>
                      <td className="py-4 text-right">
                        <div>
                          <p>{formatCurrency(holding.currentPrice)}</p>
                          <p className={`text-xs ${holding.dayChangePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatPercent(holding.dayChangePercent)}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 text-right font-medium">{formatCurrency(holding.currentValue)}</td>
                      <td className="py-4 text-right">
                        <div className={holding.profitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                          <p>{formatCurrency(holding.profitLoss)}</p>
                          <p className="text-xs">{formatPercent(holding.profitLossPercent)}</p>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <Badge variant="outline">{holding.allocation.toFixed(1)}%</Badge>
                      </td>
                      <td className="py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHolding(holding.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No holdings yet. Add your first asset to get started!</p>
              <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Asset Modal */}
      {showAddModal && (
        <AddAssetModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(data) => {
            setPortfolio(data);
            setShowAddModal(false);
            fetchTransactions();
          }}
        />
      )}

      {/* Transactions Modal */}
      {showTransactions && (
        <TransactionsModal
          transactions={transactions}
          onClose={() => setShowTransactions(false)}
        />
      )}
    </div>
  );
}

// Add Asset Modal Component
function AddAssetModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (data: PortfolioSummary) => void;
}) {
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    assetType: "CRYPTO",
    quantity: "",
    price: "",
    fees: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/portfolio/holdings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to add holding");
      const data = await response.json();
      onSuccess(data);
    } catch (err) {
      console.error(err);
      alert("Failed to add asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Asset</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Symbol</label>
              <Input
                placeholder="BTC, AAPL..."
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Asset Type</label>
              <select
                className="w-full h-10 px-3 rounded-md border bg-transparent"
                value={formData.assetType}
                onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
              >
                <option value="CRYPTO">Crypto</option>
                <option value="STOCK">Stock</option>
                <option value="ETF">ETF</option>
                <option value="FOREX">Forex</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="Bitcoin, Apple Inc..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                step="any"
                placeholder="0.5"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price per Unit</label>
              <Input
                type="number"
                step="any"
                placeholder="50000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Fees (optional)</label>
            <Input
              type="number"
              step="any"
              placeholder="0"
              value={formData.fees}
              onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Add Asset"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Transactions Modal Component
function TransactionsModal({
  transactions,
  onClose,
}: {
  transactions: Transaction[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Transaction History</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-4">
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.transactionType === "BUY" ? "bg-green-100" : "bg-red-100"}`}>
                      {tx.transactionType === "BUY" ? (
                        <ArrowDownRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.transactionType} {tx.symbol}
                      </p>
                      <p className="text-sm text-gray-500">
                        {tx.quantity} @ ${tx.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${tx.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.executedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No transactions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
