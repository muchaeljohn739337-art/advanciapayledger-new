"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Calendar,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface InsightData {
  insights: string;
  prediction?: string;
  timestamp: string;
}

const FinancialInsights = ({ userId }: { userId: string }) => {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [cashFlow, setCashFlow] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/insights/financial/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch insights");

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchCashFlow = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/insights/cashflow/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch cash flow prediction");

      const data = await response.json();
      setCashFlow(data.prediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchInsights();
      fetchCashFlow();
    }
  }, [userId]);

  const formatInsights = (text: string) => {
    return text
      .split("\n")
      .filter((line) => line.trim())
      .map((line, index) => (
        <p key={index} className="text-gray-700 mb-2">
          {line}
        </p>
      ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              AI Financial Insights
            </h2>
            <p className="text-gray-600">Powered by Google Gemini AI</p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchInsights();
            fetchCashFlow();
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-gray-600">
            Analyzing your financial data...
          </span>
        </div>
      )}

      {/* Financial Insights Card */}
      {insights && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Transaction Analysis
            </h3>
          </div>
          <div className="prose prose-sm max-w-none">
            {formatInsights(insights.insights)}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Generated: {new Date(insights.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {/* Cash Flow Prediction Card */}
      {cashFlow && !loading && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              30-Day Cash Flow Prediction
            </h3>
          </div>
          <div className="prose prose-sm max-w-none">
            {formatInsights(cashFlow)}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-600 mt-1" />
          <div>
            <h4 className="font-medium text-gray-900 mb-1">How It Works</h4>
            <p className="text-sm text-gray-600">
              Our AI analyzes your transaction history to identify patterns,
              predict cash flow, and provide personalized financial
              recommendations. Insights are updated in real-time as new
              transactions occur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialInsights;
