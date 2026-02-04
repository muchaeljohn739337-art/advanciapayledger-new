"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Globe,
  Shield,
  Eye,
  Clock,
  Hash
} from 'lucide-react';

interface Web3Event {
  id: string;
  chain: string;
  contract: string;
  eventName: string;
  payload: any;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  value?: string;
}

interface WalletActivity {
  id: string;
  wallet: string;
  chain: string;
  action: string;
  amount?: string;
  timestamp: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface FraudScore {
  wallet: string;
  score: number;
  reason: string;
  timestamp: string;
}

export default function Web3Events() {
  const [events, setEvents] = useState<Web3Event[]>([]);
  const [walletActivity, setWalletActivity] = useState<WalletActivity[]>([]);
  const [fraudScores, setFraudScores] = useState<FraudScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'activity' | 'fraud'>('events');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, activityRes, fraudRes] = await Promise.all([
        fetch('/api/web3/events/queue'),
        fetch('/api/web3/activity/recent'),
        fetch('/api/web3/fraud/recent')
      ]);

      const eventsData = await eventsRes.json();
      const activityData = await activityRes.json();
      const fraudData = await fraudRes.json();

      setEvents(eventsData.events?.slice(0, 10) || []);
      setWalletActivity(activityData.activity?.slice(0, 10) || []);
      setFraudScores(fraudData.scores?.slice(0, 10) || []);
    } catch (error) {
      console.error('Failed to fetch Web3 data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChainIcon = (chain: string) => {
    const icons: Record<string, string> = {
      ethereum: '🔷',
      polygon: '🟣',
      solana: '🟣',
      arbitrum: '🔵',
      base: '🔵'
    };
    return icons[chain.toLowerCase()] || '🌐';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-emerald-400 bg-emerald-400/20';
      case 'medium':
        return 'text-amber-400 bg-amber-400/20';
      case 'high':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4 w-32"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">
          Web3 Events
        </h2>
        <div className="flex gap-2">
          {(['events', 'activity', 'fraud'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Contract Events */}
      {activeTab === 'events' && (
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm">No recent events</p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getChainIcon(event.chain)}</span>
                    <div>
                      <p className="text-sm font-black text-white">{event.eventName}</p>
                      <p className="text-xs text-white/60">{event.contract}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/60">Block {event.blockNumber}</p>
                    <p className="text-xs text-white/40">{formatTimestamp(event.timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {event.value && (
                    <span className="text-xs text-emerald-400 font-mono">
                      {event.value}
                    </span>
                  )}
                  <button className="p-1 hover:bg-white/10 rounded transition">
                    <Eye className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Wallet Activity */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          {walletActivity.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm">No recent activity</p>
            </div>
          ) : (
            walletActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getChainIcon(activity.chain)}</span>
                    <div>
                      <p className="text-sm font-black text-white">{activity.action}</p>
                      <p className="text-xs text-white/60 font-mono">{formatAddress(activity.wallet)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/60">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-black ${getRiskColor(activity.riskLevel)}`}>
                    {activity.riskLevel}
                  </span>
                  {activity.amount && (
                    <span className="text-xs text-emerald-400 font-mono">
                      {activity.amount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Fraud Scores */}
      {activeTab === 'fraud' && (
        <div className="space-y-3">
          {fraudScores.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm">No fraud alerts</p>
            </div>
          ) : (
            fraudScores.map((score) => (
              <div
                key={score.wallet}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    score.score > 0.7 ? 'bg-red-500/20' :
                    score.score > 0.4 ? 'bg-amber-500/20' :
                    'bg-emerald-500/20'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      score.score > 0.7 ? 'text-red-400' :
                      score.score > 0.4 ? 'text-amber-400' :
                      'text-emerald-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white font-mono">{formatAddress(score.wallet)}</p>
                    <p className="text-xs text-white/60">{score.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-black text-white">{Math.round(score.score * 100)}%</p>
                    <p className="text-xs text-white/60">Risk Score</p>
                  </div>
                  <span className="text-xs text-white/40">{formatTimestamp(score.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-black text-white">{events.length}</p>
            <p className="text-xs text-white/60">Events</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{walletActivity.length}</p>
            <p className="text-xs text-white/60">Activities</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{fraudScores.filter(f => f.score > 0.5).length}</p>
            <p className="text-xs text-white/60">High Risk</p>
          </div>
        </div>
      </div>
    </div>
  );
}
