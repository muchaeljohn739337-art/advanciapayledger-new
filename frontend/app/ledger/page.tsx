"use client";

import { useState, useEffect } from "react";
import Ledger from "@/components/Ledger";
import { Transaction } from "@/lib/types";
import { apiClient } from "@/lib/api/client";

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await apiClient.get("/api/transactions");
        setTransactions(response.data || []);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <Ledger transactions={transactions} />;
}
