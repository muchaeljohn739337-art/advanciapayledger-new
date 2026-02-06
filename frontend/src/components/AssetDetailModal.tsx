"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PriceChart from "./PriceChart";

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
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
  } | null;
}

export default function AssetDetailModal({
  isOpen,
  onClose,
  asset,
}: AssetDetailModalProps) {
  if (!isOpen || !asset) return null;

  const isPositive = asset.change >= 0;

  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b p-4 flex justify-between items-start z-10">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {asset.symbol}
              <span className="text-sm font-normal text-gray-500 capitalize">
                ({asset.type})
              </span>
            </h2>
            <p className="text-gray-500">{asset.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price Header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-4xl font-bold">
                $
                {asset.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: asset.price < 1 ? 6 : 2,
                })}
              </p>
              <p
                className={`text-lg font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
              >
                {isPositive ? "+" : ""}
                {asset.change.toFixed(2)} ({isPositive ? "+" : ""}
                {asset.changePercent.toFixed(2)}%)
              </p>
            </div>
          </div>

          {/* Chart */}
          <PriceChart
            symbol={asset.symbol}
            type={asset.type}
            name={asset.name}
            currentPrice={asset.price}
            change={asset.change}
            changePercent={asset.changePercent}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {asset.marketCap && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500">Market Cap</p>
                <p className="text-lg font-semibold">
                  {formatLargeNumber(asset.marketCap)}
                </p>
              </div>
            )}
            {asset.volume && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500">24h Volume</p>
                <p className="text-lg font-semibold">
                  {formatLargeNumber(asset.volume)}
                </p>
              </div>
            )}
            {asset.high52Week && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500">52W High</p>
                <p className="text-lg font-semibold text-green-600">
                  ${asset.high52Week.toFixed(2)}
                </p>
              </div>
            )}
            {asset.low52Week && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500">52W Low</p>
                <p className="text-lg font-semibold text-red-600">
                  ${asset.low52Week.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button className="flex-1" variant="default">
              Add to Watchlist
            </Button>
            <Button className="flex-1" variant="outline">
              Set Alert
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
