"use client";

import React, { useState } from "react";
import {
  Terminal,
  Github,
  Cpu,
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
  Code2,
  GitMerge,
  ExternalLink,
} from "lucide-react";

const Engineering: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mockIssues = [
    {
      id: "#1402",
      title: "Login button lag on Safari iOS",
      priority: "High",
      effort: "Medium",
      status: "AI Analyzed",
      team: "Frontend",
    },
    {
      id: "#1401",
      title: "Solana RPC node timeout in VPC",
      priority: "Critical",
      effort: "Large",
      status: "Flagged",
      team: "DevOps",
    },
    {
      id: "#1399",
      title: "Update HIPAA logging headers",
      priority: "Medium",
      effort: "Small",
      status: "AI Analyzed",
      team: "Security",
    },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="text-left">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
            Engineering Hub
          </h1>
          <p className="text-slate-500 font-bold mt-4 uppercase tracking-widest text-xs">
            Node: Olympus-AI (147.182.193.11) • GitHub Webhook Active
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-3 bg-white border border-slate-200 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCcw
            size={16}
            className={isRefreshing ? "animate-spin" : ""}
          />
          {isRefreshing ? "Syncing Repo..." : "Sync Olympus Node"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Code2 size={200} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-indigo-600 rounded-xl">
                  <Github size={24} />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-black uppercase tracking-tight italic">
                    Olympus AI Analysis Queue
                  </h3>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">
                    Real-time issue triage via Claude AI
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {mockIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-xs font-black text-indigo-400 font-mono">
                        {issue.id}
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-black text-slate-200 tracking-tight">
                          {issue.title}
                        </p>
                        <div className="flex gap-3 mt-1.5">
                          <span
                            className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                              issue.priority === "Critical"
                                ? "bg-rose-500 text-white"
                                : "bg-slate-700 text-slate-300"
                            }`}
                          >
                            Priority: {issue.priority}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                            Effort: {issue.effort}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                        {issue.status}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Team: {issue.team}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <GitMerge size={20} />
                </div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight italic text-left">
                  Repo Vitals
                </h4>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Open PRs
                  </p>
                  <p className="text-2xl font-black italic text-slate-900 leading-none">
                    12
                  </p>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full w-[40%]"></div>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Test Coverage
                  </p>
                  <p className="text-2xl font-black italic text-slate-900 leading-none">
                    94.2%
                  </p>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[94.2%]"></div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-10 flex flex-col justify-between">
              <div className="text-left">
                <Cpu className="text-indigo-600 mb-6" size={32} />
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">
                  AI Infrastructure
                </h4>
                <p className="text-xs text-slate-500 font-bold mt-3 leading-relaxed">
                  Olympus Node is communicating with Anthropic API (Claude 3.5
                  Sonnet) to categorize incoming issues.
                </p>
              </div>
              <div className="pt-6 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Webhooks Healthy
                  </span>
                </div>
                <button className="w-full py-3 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">
                  Configure Webhooks
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10">
            <Activity className="text-indigo-600 mb-6" size={32} />
            <h4 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight italic text-left">
              Olympus Logs
            </h4>
            <div className="bg-slate-900 p-6 rounded-2xl font-mono text-[10px] text-emerald-400 space-y-2 overflow-x-auto border border-slate-800 shadow-xl text-left">
              <p className="opacity-50 text-[8px]">
                [2024-05-18 16:42:11] POST /webhook/github
              </p>
              <p>STATUS: 200 OK</p>
              <p className="text-indigo-400">
                ANALYSIS: High Priority Bug detected.
              </p>
              <div className="w-full h-px bg-white/5 my-2"></div>
              <p className="opacity-50 text-[8px]">
                [2024-05-18 16:45:02] GET /health
              </p>
              <p>STATUS: 200 OK</p>
              <p className="text-slate-500">Node Connectivity: 15ms</p>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-widest text-center">
              Server: 147.182.193.11
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm relative overflow-hidden group">
            <Terminal
              className="absolute -bottom-6 -right-6 text-slate-50 group-hover:scale-110 transition-transform"
              size={120}
            />
            <div className="relative z-10 text-left">
              <h4 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight italic">
                Documentation
              </h4>
              <p className="text-xs text-slate-500 font-bold mb-6">
                Access the engineering deployment guides.
              </p>
              <div className="space-y-3">
                {[
                  "DEPLOY_GUIDE.md",
                  "README-SCRIPTS.md",
                  "API_REFERENCE.md",
                ].map((doc, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest border border-slate-100 hover:border-indigo-500 hover:text-indigo-600 transition-all"
                  >
                    {doc} <ExternalLink size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Engineering;
