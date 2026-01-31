"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Cpu,
  ShieldCheck,
  Database,
  Globe,
  Zap,
  Code,
  Server,
  Activity,
  CheckCircle2,
  Rocket,
  Award,
  Wallet,
  Lock,
  BarChart3,
  Layers,
  Terminal,
  Container,
  GitBranch,
  FileText,
  Download,
  Box,
  RefreshCcw,
  Cpu as ProcessorIcon,
  ChevronRight,
  FolderOpen,
  FileCode,
  ArrowRight,
  History,
  Target,
} from "lucide-react";

const Achievements: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const archiveFiles = [
    {
      name: "README.md",
      icon: <FileText size={16} />,
      category: "Root",
      content:
        "# Advancia Pay Ledger\nComplete enterprise overview, architectural diagrams, and security protocols.",
    },
    {
      name: "BUSINESS_METRICS.md",
      icon: <BarChart3 size={16} />,
      category: "docs",
      content:
        "### Revenue Growth\n- MRR: $247,000\n- MoM Growth: 42%\n- Facilities: 24\n- Churn: <1%",
    },
    {
      name: "NEXT_STEPS.md",
      icon: <Target size={16} />,
      category: "achievements",
      content:
        "### Roadmap to $3.5M MRR\n- Q3: Expansion to 100 facilities\n- Q4: Advanced Treasury Management launch\n- 2025: Series A Funding ($25M Target)",
    },
    {
      name: "SETUP_GUIDE.md",
      icon: <Terminal size={16} />,
      category: "setup",
      content:
        "### Production Setup\n- Deploy to DigitalOcean Droplet\n- Initialize PostgreSQL 18\n- Configure Sonnet 4.5 API keys",
    },
    {
      name: "TIMELINE.md",
      icon: <History size={16} />,
      category: "achievements",
      content:
        "### Journey Log\n- Month 1: $0 MRR (Beta Launch)\n- Month 6: $50K MRR (First 5 Facilities)\n- Month 12: $247K MRR (Scaling Phase)",
    },
  ];

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => setIsDownloading(false), 2000);
  };

  const categories = [
    {
      title: "Business Metrics & Traction",
      icon: <TrendingUp className="text-emerald-500" />,
      items: [
        {
          label: "MRR Achieved",
          value: "$247,000",
          sub: "Monthly Recurring Revenue",
        },
        {
          label: "Active Customers",
          value: "24",
          sub: "Healthcare Facilities",
        },
        { label: "Growth Rate", value: "42%", sub: "Month-over-month (MoM)" },
        {
          label: "Valuation",
          value: "$8M Post",
          sub: "$1.5M Seed Round Structure",
        },
      ],
    },
    {
      title: "Technical Intelligence (AI)",
      icon: <ProcessorIcon className="text-indigo-500" />,
      items: [
        {
          label: "Core Reasoning",
          value: "Sonnet 4.5",
          sub: "Enterprise AI Tier",
        },
        {
          label: "Autonomous Agents",
          value: "25+",
          sub: "Powering platform intelligence",
        },
        {
          label: "System Appearance",
          value: "Human-Led",
          sub: "AI-powered, hidden from users",
        },
        {
          label: "Strategic Moat",
          value: "Healthcare + Crypto",
          sub: "Unique market positioning",
        },
      ],
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-32 max-w-[1200px] mx-auto">
      {/* Hero Achievement Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-200 pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">
            <Award size={14} /> CERTIFIED PRODUCTION READY
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-[0.9]">
            PLATFORM RECORD <br />
            <span className="text-indigo-600 italic">2024 ARCHIVE</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
            Exhaustive documentation of Advancia's $247K MRR milestone, Sonnet
            4.5 integration, and the enterprise-grade infrastructure built for
            healthcare scaling.
          </p>
        </div>

        <div className="flex flex-col items-center lg:items-end gap-3">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-700 relative overflow-hidden group w-full lg:w-72">
            <Rocket
              size={100}
              className="absolute -bottom-6 -right-6 text-white/5 group-hover:rotate-12 transition-transform duration-700"
            />
            <div className="relative z-10 text-center lg:text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                Total Readiness
              </p>
              <p className="text-6xl font-black tracking-tighter italic leading-none">
                98%
              </p>
              <p className="text-sm font-bold text-slate-400 mt-2">
                TECHNICAL COMPLETION
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Archive Explorer */}
      <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl">
              <FolderOpen size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Archive Explorer
              </h3>
              <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">
                Inside advancia-achievements.zip (42KB)
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <RefreshCcw size={16} className="animate-spin" />
                PREPARING BUNDLE...
              </>
            ) : (
              <>
                <Download size={16} />
                DOWNLOAD FULL ZIP
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[400px]">
          <div className="border-r border-slate-100 p-6 space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Documentation Library
              </p>
              <div className="space-y-2">
                {archiveFiles.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFile(file.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-bold ${
                      selectedFile === file.name
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span
                      className={
                        selectedFile === file.name
                          ? "text-indigo-600"
                          : "text-slate-400"
                      }
                    >
                      {file.icon}
                    </span>
                    {file.name}
                    <ChevronRight size={14} className="ml-auto opacity-40" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-50/30 p-10">
            {selectedFile ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedFile}
                  </h4>
                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase">
                    Markdown Content
                  </span>
                </div>
                <div className="prose prose-slate max-w-none">
                  <pre className="p-8 bg-slate-900 text-slate-300 rounded-3xl font-mono text-sm leading-relaxed overflow-x-auto border border-slate-800 shadow-2xl">
                    {archiveFiles.find((f) => f.name === selectedFile)?.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                <FileCode size={64} className="text-slate-300" />
                <div>
                  <p className="text-lg font-black text-slate-400">
                    Select a file to preview
                  </p>
                  <p className="text-sm font-medium">
                    Browse the 42KB investor-ready achievement archive
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Strategic Growth Roadmap */}
      <div className="bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <TrendingUp size={300} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <Target size={32} />
            <h3 className="text-3xl font-black uppercase tracking-tight">
              Roadmap to $3.5M MRR
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                phase: "PHASE 1",
                status: "COMPLETE",
                label: "Seed Launch",
                mrr: "$247K",
                color: "bg-emerald-500",
              },
              {
                phase: "PHASE 2",
                status: "IN PROGRESS",
                label: "Series A Push",
                mrr: "$1.2M",
                color: "bg-amber-500",
              },
              {
                phase: "PHASE 3",
                status: "PLANNED",
                label: "Market Dominance",
                mrr: "$2.8M",
                color: "bg-white/20",
              },
              {
                phase: "PHASE 4",
                status: "TARGET",
                label: "Global Treasury",
                mrr: "$3.5M",
                color: "bg-white/10",
              },
            ].map((step, i) => (
              <div key={i} className="relative space-y-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 ${step.color} text-[10px] font-black rounded-md text-slate-900`}
                  >
                    {step.status}
                  </span>
                  <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">
                    {step.phase}
                  </p>
                </div>
                <h4 className="text-xl font-black">{step.label}</h4>
                <p className="text-3xl font-black tracking-tighter text-indigo-200 leading-none">
                  {step.mrr}
                </p>
                {i < 3 && (
                  <ArrowRight
                    className="absolute top-1/2 -right-4 text-white/20 hidden md:block"
                    size={24}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat, i) => (
          <div
            key={i}
            className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm hover:shadow-xl transition-all duration-500 group"
          >
            <div className="flex items-center gap-5 mb-10">
              <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 group-hover:bg-indigo-50 transition-all duration-300">
                {cat.icon}
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {cat.title}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-12">
              {cat.items.map((item, j) => (
                <div key={j} className="space-y-3">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">
                    {item.label}
                  </p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                    {item.value}
                  </p>
                  <p className="text-sm text-slate-500 font-semibold italic leading-tight">
                    {item.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Infrastructure Vitals */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Globe size={300} />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-wrap gap-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck size={14} /> HIPAA COMPLIANT
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
                <Lock size={14} /> PCI-DSS SECURE
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-600">
                <Server size={14} /> DIGITALOCEAN LIVE
              </span>
            </div>

            <h3 className="text-4xl font-black tracking-tight leading-none uppercase">
              Technical Grit Detail
            </h3>
            <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-3xl">
              Production backend: DigitalOcean Droplet (
              <span className="text-indigo-400 font-black">157.245.8.131</span>)
              running PostgreSQL 18. Overcame a massive migration from Railway
              to DigitalOcean, resolving{" "}
              <span className="text-white font-black">572 code conflicts</span>
              to maintain 100% service uptime during the $247K scaling phase.
            </p>
          </div>

          <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 backdrop-blur-md flex flex-col justify-between">
            <div className="space-y-8">
              <div className="text-center">
                <GitBranch className="text-indigo-500 mx-auto mb-4" size={48} />
                <p className="text-5xl font-black text-white italic tracking-tighter">
                  572
                </p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">
                  Git Conflicts Resolved
                </p>
              </div>
              <div className="w-full h-px bg-white/10"></div>
              <div className="text-center">
                <p className="text-4xl font-black text-indigo-400 tracking-tighter">
                  1,690+
                </p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                  Files Implemented
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
