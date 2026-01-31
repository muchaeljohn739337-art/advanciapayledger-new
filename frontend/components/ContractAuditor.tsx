"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Code2, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  Info,
  Bug,
  Lock,
  Zap
} from "lucide-react";

interface AuditVulnerability {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  description: string;
  location?: string;
  recommendation: string;
}

interface SmartContractAuditResult {
  score: number;
  summary: string;
  vulnerabilities: AuditVulnerability[];
  isSafe: boolean;
  auditedAt: string;
}

const ContractAuditor: React.FC = () => {
  const [contractName, setContractName] = useState("");
  const [sourceCode, setSourceCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SmartContractAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async () => {
    if (!contractName || !sourceCode) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/audit/code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ contractName, sourceCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to audit contract");
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "bg-purple-500 text-white";
      case "HIGH": return "bg-rose-500 text-white";
      case "MEDIUM": return "bg-amber-500 text-white";
      case "LOW": return "bg-blue-500 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  return (
    <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-100">
          <ShieldAlert size={24} />
        </div>
        <div className="text-left">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">
            AI Smart Contract Auditor
          </h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            SONNET 3.5 PRO • WEB3 SECURITY ENGINE
          </p>
        </div>
      </div>

      {!result ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">
                Contract Name
              </label>
              <input
                type="text"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="e.g. AdvanciaTreasury.sol"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">
                Solidity Source Code
              </label>
              <textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                placeholder="Paste your smart contract code here..."
                rows={12}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs leading-relaxed"
              />
            </div>
          </div>

          <button
            onClick={handleAudit}
            disabled={!contractName || !sourceCode || loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Deep Scanning Patterns...
              </>
            ) : (
              <>
                <Zap size={18} className="text-amber-400" />
                Initiate Security Audit
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-800">
              <AlertTriangle size={18} />
              <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-10 animate-in zoom-in-95 duration-500">
          {/* Audit Score Card */}
          <div className="flex flex-col md:flex-row items-center gap-10 p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden">
            <div className="relative z-10 text-center md:text-left space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Security Integrity Score</p>
              <p className="text-8xl font-black italic tracking-tighter">
                {result.score}<span className="text-2xl text-slate-500">/100</span>
              </p>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${result.isSafe ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}>
                {result.isSafe ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {result.isSafe ? "Audit Passed" : "Critical Risks Detected"}
              </div>
            </div>
            <div className="relative z-10 flex-1">
              <p className="text-sm font-medium leading-relaxed text-slate-300 italic">
                "{result.summary}"
              </p>
            </div>
            <Code2 size={180} className="absolute -right-10 -bottom-10 text-white/5" />
          </div>

          {/* Vulnerabilities List */}
          <div className="space-y-6">
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3">
              <Bug className="text-rose-500" /> Vulnerability Assessment
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {result.vulnerabilities.map((v, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 hover:border-indigo-200 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getSeverityColor(v.severity)}`}>
                        {v.severity}
                      </span>
                      <h5 className="font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                        {v.title}
                      </h5>
                    </div>
                    {v.location && (
                      <code className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-400 uppercase">
                        {v.location}
                      </code>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
                    {v.description}
                  </p>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-start gap-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recommendation</p>
                      <p className="text-xs font-bold text-slate-900">{v.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setResult(null)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
            >
              New Audit Session
            </button>
            <button
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
            >
              Export PDF Report <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ContractAuditor;
