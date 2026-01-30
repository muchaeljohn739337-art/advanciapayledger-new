import React from "react";
import { Transaction } from "../lib/types";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Zap,
  Activity,
  Globe,
  Server,
  ShieldCheck,
  BrainCircuit,
  Lightbulb,
  Github,
} from "lucide-react";

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const achievementMRR = 247000;
  const currentGrowth = 42;

  const stats = [
    {
      label: "Monthly Recurring Revenue",
      value: `$${achievementMRR.toLocaleString()}`,
      change: `+${currentGrowth}%`,
      positive: true,
      icon: <TrendingUp className="text-emerald-600" />,
    },
    {
      label: "Network Liquidity",
      value: "$1.42M",
      change: "+12.4%",
      positive: true,
      icon: <Globe className="text-indigo-600" />,
    },
    {
      label: "Facility Completion",
      value: "98%",
      change: "Sonnet 4.5",
      positive: true,
      icon: <Zap className="text-amber-600" />,
    },
    {
      label: "Audit Readiness",
      value: "100%",
      change: "HIPAA Cert",
      positive: true,
      icon: <ShieldCheck className="text-emerald-500" />,
    },
  ];

  const chartData = [
    { name: "Jan", income: 142000, expenses: 88000 },
    { name: "Feb", income: 168000, expenses: 92000 },
    { name: "Mar", income: 195000, expenses: 95000 },
    { name: "Apr", income: 220000, expenses: 98000 },
    { name: "May", income: achievementMRR, expenses: 102000 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="text-left">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
            Intelligence Dashboard
          </h1>
          <p className="text-slate-500 font-bold mt-4 uppercase tracking-widest text-xs">
            Advancia Node.js 20 Cluster • DigitalOcean Production
            (157.245.8.131)
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-[1.5rem] border border-slate-200 shadow-sm">
            <Server size={18} className="text-indigo-600" />
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                Server Load
              </p>
              <p className="text-sm font-black text-slate-900 leading-none">
                12.4% CPU
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-[1.5rem] border border-slate-200 shadow-sm">
            <Activity size={18} className="text-emerald-500" />
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                API Health
              </p>
              <p className="text-sm font-black text-slate-900 leading-none">
                99.98% OK
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all group"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                {stat.icon}
              </div>
              <div
                className={`flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${stat.positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
              >
                {stat.change}
                {stat.positive ? (
                  <ArrowUpRight size={14} className="ml-1" />
                ) : (
                  <ArrowDownRight size={14} className="ml-1" />
                )}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-left">
              {stat.label}
            </p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none text-left">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-12">
              <div className="text-left">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">
                  Scale Projections
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Journey to $3.5M MRR Achievement
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-2 bg-indigo-50 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100 italic">
                  Target: Series A
                </span>
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorIncome"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 900 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 900 }}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "24px",
                      border: "none",
                      boxShadow: "0 30px 60px -12px rgba(0,0,0,0.1)",
                      fontWeight: "black",
                      fontSize: "12px",
                      textTransform: "uppercase",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#4f46e5"
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                    strokeWidth={6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-indigo-600 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
            <BrainCircuit className="absolute -top-10 -right-10 text-white/5 w-64 h-64" />
            <div className="relative z-10 flex items-start gap-8">
              <div className="p-4 bg-white/10 rounded-3xl border border-white/20">
                <Lightbulb size={32} className="text-amber-300" />
              </div>
              <div className="space-y-4 text-left">
                <h4 className="text-xl font-black uppercase tracking-tight italic">
                  Sonnet 4.5 Revenue Intelligence
                </h4>
                <p className="text-indigo-100 text-sm leading-relaxed font-medium">
                  "Advancia AI has identified a 12.4% inefficiency in the
                  current Solana settlement window. By shifting liquidity sweeps
                  to 02:00 UTC, we can reduce slippage by $4,200 monthly. I am
                  also monitoring the 157.245... droplet; resource usage is
                  optimal for Q3 scaling."
                </p>
                <div className="flex gap-4 pt-2">
                  <button className="px-6 py-2.5 bg-white text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl">
                    Execute Optimization
                  </button>
                  <button className="px-6 py-2.5 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-400">
                    View Reasoning Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <Globe className="absolute -top-10 -right-10 text-white/5 w-64 h-64" />
            <h3 className="text-xl font-black text-white mb-10 uppercase tracking-tight relative z-10 italic text-left">
              Network Status
            </h3>
            <div className="space-y-6 relative z-10">
              {[
                {
                  name: "Solana (USDC)",
                  status: "Active",
                  color: "text-emerald-400",
                },
                {
                  name: "Ethereum Mainnet",
                  status: "Syncing",
                  color: "text-amber-400",
                },
                {
                  name: "Base Network",
                  status: "Active",
                  color: "text-emerald-400",
                },
                {
                  name: "Stripe Connect",
                  status: "Active",
                  color: "text-emerald-400",
                },
                {
                  name: "Olympus Webhook",
                  status: "Active",
                  color: "text-indigo-400",
                },
              ].map((net, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
                    {net.name}
                  </p>
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest ${net.color}`}
                  >
                    {net.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <Activity className="text-indigo-600" size={24} />
              </div>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight italic text-left">
                Agent Fleet (25+)
              </h4>
            </div>
            <div className="space-y-6">
              {[
                {
                  agent: "Olympus-AI",
                  task: "Analyzing Issues",
                  icon: <Github size={12} />,
                  time: "LIVE",
                },
                {
                  agent: "Auditor Alpha",
                  task: "Cross-checking Q2",
                  time: "LIVE",
                },
                {
                  agent: "Payroll Bot",
                  task: "Batching June",
                  time: "14m ago",
                },
                {
                  agent: "Security Sentinel",
                  task: "Threat Mapping",
                  time: "LIVE",
                },
              ].map((act, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 border-l-4 border-slate-100 pl-6 py-2 hover:border-indigo-500 transition-all duration-300"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                        {act.agent}
                      </p>
                      {act.icon && (
                        <span className="text-slate-400">{act.icon}</span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                      {act.task}
                    </p>
                  </div>
                  <span
                    className={`text-[8px] font-black px-2 py-1 rounded-md ${act.time === "LIVE" ? "bg-emerald-500 text-white animate-pulse" : "bg-slate-100 text-slate-400"}`}
                  >
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
