"use client";

import React, { useState } from "react";
import { Transaction, TransactionStatus } from "../lib/types";
import {
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
  Calendar,
  Tag,
  CreditCard,
  Hash,
  Activity,
  ShieldCheck,
  AlertCircle,
  BrainCircuit,
} from "lucide-react";

interface LedgerProps {
  transactions: Transaction[];
}

const Ledger: React.FC<LedgerProps> = ({ transactions }) => {
  const [filter, setFilter] = useState<TransactionStatus | "All">("All");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter(
    (t) => filter === "All" || t.status === filter,
  );

  const closeModal = () => setSelectedTransaction(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">
            Pay Ledger
          </h1>
          <p className="text-slate-500 font-medium">
            Review and manage all corporate financial movements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={16} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Transaction
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Type
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Amount
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Date
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTransaction(t)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black italic border border-indigo-100 group-hover:scale-110 transition-transform">
                        {t.description.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-slate-900 tracking-tight">
                          {t.description}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {t.category}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      {t.type}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p
                      className={`text-sm font-black italic tracking-tight ${t.amount > 0 ? "text-emerald-600" : "text-slate-900"}`}
                    >
                      {t.amount > 0 ? "+" : ""}$
                      {Math.abs(t.amount).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {t.date}
                  </td>
                  <td className="px-8 py-5">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        t.status === TransactionStatus.COMPLETED
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : t.status === TransactionStatus.PENDING
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          t.status === TransactionStatus.COMPLETED
                            ? "bg-emerald-500"
                            : t.status === TransactionStatus.PENDING
                              ? "bg-amber-500"
                              : "bg-slate-400"
                        }`}
                      ></span>
                      {t.status}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing 1-{filteredTransactions.length} of{" "}
            {filteredTransactions.length} results
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all disabled:opacity-50">
              <ChevronLeft size={16} />
            </button>
            <button className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={closeModal}
          ></div>

          <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            {/* Modal Header */}
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
                  <Activity size={24} />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">
                    Transaction Details
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                    Audit ID: {selectedTransaction.id}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-3 hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto">
              {/* Primary Amount */}
              <div className="text-center space-y-2 py-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  Total Amount
                </p>
                <p
                  className={`text-6xl font-black italic tracking-tighter ${selectedTransaction.amount > 0 ? "text-emerald-500" : "text-slate-900"}`}
                >
                  {selectedTransaction.amount > 0 ? "+" : ""}$
                  {Math.abs(selectedTransaction.amount).toLocaleString()}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {selectedTransaction.status}
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Hash size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Description
                      </p>
                      <p className="text-sm font-black text-slate-900">
                        {selectedTransaction.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Calendar size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Execution Date
                      </p>
                      <p className="text-sm font-black text-slate-900">
                        {selectedTransaction.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Tag size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Category & Type
                      </p>
                      <p className="text-sm font-black text-slate-900">
                        {selectedTransaction.category} •{" "}
                        {selectedTransaction.type}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <CreditCard size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Network / Processor
                      </p>
                      <p className="text-sm font-black text-slate-900">
                        {selectedTransaction.network || "Internal Ledger"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Integrity Score
                      </p>
                      <p className="text-sm font-black text-emerald-600">
                        VERIFIED (100%)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights Section */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                <BrainCircuit className="absolute -bottom-10 -right-10 text-white/5 w-48 h-48 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 flex items-start gap-5">
                  <div className="p-3 bg-white/10 border border-white/20 rounded-xl">
                    <ShieldCheck size={20} className="text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-black uppercase tracking-tight italic mb-2">
                      Advancia AI Integrity Insight
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      This {selectedTransaction.type} aligns with historical{" "}
                      {selectedTransaction.category} velocity. No anomalous
                      behavior detected on{" "}
                      {selectedTransaction.network || "the internal chain"}.
                      SONNET 4.5 suggests marking as "Low Audit Priority".
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all">
                Download Full Receipt
              </button>
              <button
                onClick={closeModal}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledger;
