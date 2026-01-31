"use client";

import React, { useState } from "react";
import {
  X,
  Upload,
  Plus,
  Camera,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Transaction, TransactionType, TransactionStatus } from "../lib/types";
import { parseReceipt } from "../services/geminiService";

interface NewTransactionModalProps {
  onClose: () => void;
  onAdd: (transaction: Transaction) => void;
}

const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  onClose,
  onAdd,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Operations",
    type: TransactionType.VENDOR_PAYMENT,
    date: new Date().toISOString().split("T")[0],
    network: "Stripe" as any,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const result = await parseReceipt(base64);
      if (result) {
        setFormData({
          ...formData,
          description: result.description,
          amount: Math.abs(result.amount).toString(),
          date: result.date,
          category: result.category,
        });
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      description: formData.description,
      amount:
        formData.type === TransactionType.INVOICE ||
        formData.type === TransactionType.CRYPTO_SETTLEMENT
          ? parseFloat(formData.amount)
          : -parseFloat(formData.amount),
      date: formData.date,
      category: formData.category,
      type: formData.type,
      status: TransactionStatus.COMPLETED,
      network: formData.network,
    };
    onAdd(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">
              New Ledger Entry
            </h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
              Manual or AI-Assisted Entry
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="relative group">
              <input
                type="file"
                id="receipt-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="receipt-upload"
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer group"
              >
                {isScanning ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2
                      size={32}
                      className="text-indigo-600 animate-spin"
                    />
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest animate-pulse">
                      Advancia AI Scanning...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <Camera size={24} />
                    </div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      Drop Receipt for AI Auto-Fill
                    </p>
                  </div>
                )}
              </label>
            </div>

            <div className="space-y-4">
              <div className="text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                  Description
                </label>
                <input
                  required
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. Amazon Web Services"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                    Amount ($)
                  </label>
                  <input
                    required
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="0.00"
                  />
                </div>
                <div className="text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                    Date
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                  >
                    {Object.values(TransactionType).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                    Network
                  </label>
                  <select
                    value={formData.network}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        network: e.target.value as any,
                      })
                    }
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                  >
                    <option value="Stripe">Stripe</option>
                    <option value="Solana">Solana</option>
                    <option value="Ethereum">Ethereum</option>
                    <option value="Base">Base</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="submit"
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
            >
              Commit to Ledger
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTransactionModal;
