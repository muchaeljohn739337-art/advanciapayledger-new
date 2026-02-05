"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface PriceChartProps {
  symbol: string;
  type: "stock" | "crypto" | "forex";
  name?: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

type Period = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

export default function PriceChart({
  symbol,
  type,
  name,
  currentPrice,
  change,
  changePercent,
}: PriceChartProps) {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("1M");
  const [chartType, setChartType] = useState<"line" | "area" | "candle">(
    "area",
  );
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/market/history?symbol=${symbol}&type=${type}&period=${period}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch historical data");

      const historicalData = await response.json();
      setData(historicalData);
    } catch (err) {
      setError("Failed to load chart data");
      console.error("Chart data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, [symbol, type, period]);

  const isPositive =
    change !== undefined
      ? change >= 0
      : data.length > 0 && data[data.length - 1].close >= data[0].close;
  const chartColor = isPositive ? "#22c55e" : "#ef4444";
  const gradientId = `gradient-${symbol}`;

  const formatXAxis = (date: string) => {
    const d = new Date(date);
    if (period === "1D")
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (period === "1W" || period === "1M")
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    return d.toLocaleDateString([], { month: "short", year: "2-digit" });
  };

  const formatPrice = (value: number) => {
    if (value >= 10000) return `$${(value / 1000).toFixed(1)}K`;
    if (value >= 1000) return `$${value.toFixed(0)}`;
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(4)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="text-sm text-gray-500">
            {new Date(label).toLocaleDateString()}
          </p>
          <div className="mt-1 space-y-1">
            {chartType === "candle" ? (
              <>
                <p className="text-sm">
                  Open:{" "}
                  <span className="font-medium">${data.open.toFixed(2)}</span>
                </p>
                <p className="text-sm">
                  High:{" "}
                  <span className="font-medium text-green-600">
                    ${data.high.toFixed(2)}
                  </span>
                </p>
                <p className="text-sm">
                  Low:{" "}
                  <span className="font-medium text-red-600">
                    ${data.low.toFixed(2)}
                  </span>
                </p>
                <p className="text-sm">
                  Close:{" "}
                  <span className="font-medium">${data.close.toFixed(2)}</span>
                </p>
              </>
            ) : (
              <p className="text-lg font-bold">${data.close.toFixed(2)}</p>
            )}
            {data.volume && (
              <p className="text-xs text-gray-500">
                Vol: {(data.volume / 1e6).toFixed(2)}M
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const periods: Period[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center h-80 gap-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchHistoricalData} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{symbol}</CardTitle>
            {name && <p className="text-sm text-gray-500">{name}</p>}
          </div>
          <div className="text-right">
            {currentPrice !== undefined && (
              <p className="text-2xl font-bold">
                $
                {currentPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            )}
            {change !== undefined && changePercent !== undefined && (
              <p
                className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
              >
                {isPositive ? "+" : ""}
                {change.toFixed(2)} ({isPositive ? "+" : ""}
                {changePercent.toFixed(2)}%)
              </p>
            )}
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-1 mt-4">
          {periods.map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="px-3"
            >
              {p}
            </Button>
          ))}
          <div className="flex-1" />
          <div className="flex gap-1">
            {(["line", "area", "candle"] as const).map((t) => (
              <Button
                key={t}
                variant={chartType === t ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType(t)}
                className="px-3 capitalize"
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={formatPrice}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke={chartColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: chartColor }}
                />
              </LineChart>
            ) : chartType === "area" ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={chartColor}
                      stopOpacity={0.3}
                    />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={formatPrice}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={chartColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            ) : (
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="price"
                  domain={["auto", "auto"]}
                  tickFormatter={formatPrice}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <YAxis
                  yAxisId="volume"
                  orientation="right"
                  tick={false}
                  axisLine={false}
                  width={0}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill="#94a3b8"
                  opacity={0.3}
                />
                {/* Candlestick-like visualization using high/low range */}
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="high"
                  stroke="#22c55e"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="low"
                  stroke="#ef4444"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke={chartColor}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Volume indicator */}
        {data[0]?.volume && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm text-gray-500">
              <span>24h Volume</span>
              <span className="font-medium">
                {(data[data.length - 1]?.volume || 0) >= 1e9
                  ? `${((data[data.length - 1]?.volume || 0) / 1e9).toFixed(2)}B`
                  : `${((data[data.length - 1]?.volume || 0) / 1e6).toFixed(2)}M`}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
