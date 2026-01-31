"use client";

import React, { useState } from "react";
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  DollarSign,
  Calendar,
  Store,
  Tag
} from "lucide-react";

interface ParsedReceipt {
  merchantName: string;
  date: string;
  totalAmount: number;
  currency: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  category: string;
  confidence: number;
}

const ReceiptAnalysis: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/receipts/parse", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse receipt");
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
          <FileText size={24} />
        </div>
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">
            AI Receipt Analyzer
          </h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            SONNET 4.5 VISION • AUTOMATED EXPENSING
          </p>
        </div>
      </div>

      {!result ? (
        <div className="space-y-8">
          <div 
            className={`relative border-2 border-dashed rounded-[2rem] p-12 transition-all text-center ${
              file ? "border-indigo-400 bg-indigo-50/30" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <Upload size={32} className={file ? "text-indigo-600" : "text-slate-400"} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  {file ? file.name : "Drop receipt image here"}
                </p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  JPG, PNG or WEBP up to 10MB
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Analyzing Intelligence...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Process Receipt
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-800 animate-in shake duration-500">
              <AlertCircle size={18} />
              <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <Store size={18} className="text-indigo-600" />
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Merchant</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{result.merchantName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-indigo-600" />
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Date</p>
                  <p className="text-sm font-black text-slate-900">{result.date}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <Tag size={18} className="text-indigo-600" />
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Category</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{result.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign size={18} className="text-emerald-600" />
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Amount</p>
                  <p className="text-xl font-black text-slate-900 italic">
                    {result.currency} {result.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Item Breakdown</p>
            </div>
            <div className="divide-y divide-slate-50">
              {result.items.map((item, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <p className="text-xs font-bold text-slate-600 uppercase">{item.description}</p>
                  <p className="text-xs font-black text-slate-900">{result.currency} {item.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setResult(null)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
            >
              Analyze Another
            </button>
            <button
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              Save to Ledger <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReceiptAnalysis;
