"use client";

import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  GitBranch,
  Package,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Terminal
} from 'lucide-react';

interface Deployment {
  id: string;
  service: string;
  version: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'rolled_back';
  triggeredBy: string;
  metadata?: any;
  createdAt: string;
  completedAt?: string;
}

interface FeatureFlag {
  key: string;
  value: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface LogEntry {
  id: string;
  service: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  metadata?: any;
}

export default function DevOpsConsole() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deployments' | 'flags' | 'logs' | 'config'>('deployments');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [deploymentsRes, flagsRes, logsRes] = await Promise.all([
        fetch('/api/deployment/recent'),
        fetch('/api/deployment/flags'),
        fetch('/api/deployment/logs')
      ]);

      const deploymentsData = await deploymentsRes.json();
      const flagsData = await flagsRes.json();
      const logsData = await logsRes.json();

      setDeployments(deploymentsData.deployments?.slice(0, 10) || []);
      setFeatureFlags(flagsData.flags || []);
      setLogs(logsData.logs?.slice(0, 20) || []);
    } catch (error) {
      console.error('Failed to fetch DevOps data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-emerald-400 bg-emerald-400/20 border-emerald-400/30';
      case 'running':
        return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
      case 'failed':
        return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'rolled_back':
        return 'text-amber-400 bg-amber-400/20 border-amber-400/30';
      case 'pending':
        return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
      default:
        return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'running':
        return <Play className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'rolled_back':
        return <RotateCcw className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-400/20';
      case 'warn':
        return 'text-amber-400 bg-amber-400/20';
      case 'info':
        return 'text-blue-400 bg-blue-400/20';
      case 'debug':
        return 'text-gray-400 bg-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const toggleFeatureFlag = async (key: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/deployment/flags/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: !currentValue }),
      });

      if (response.ok) {
        setFeatureFlags(prev => 
          prev.map(flag => 
            flag.key === key ? { ...flag, value: !currentValue } : flag
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle feature flag:', error);
    }
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
          DevOps Console
        </h2>
        <div className="flex gap-2">
          {(['deployments', 'flags', 'logs', 'config'] as const).map((tab) => (
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

      {/* Deployments */}
      {activeTab === 'deployments' && (
        <div className="space-y-3">
          {deployments.length === 0 ? (
            <div className="text-center py-8">
              <Rocket className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm">No recent deployments</p>
            </div>
          ) : (
            deployments.map((deployment) => (
              <div
                key={deployment.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${getStatusColor(deployment.status)}`}>
                    {getStatusIcon(deployment.status)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{deployment.service}</p>
                    <p className="text-xs text-white/60">v{deployment.version} by {deployment.triggeredBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deployment.status)}
                      <span className={`text-xs font-black uppercase ${getStatusColor(deployment.status).split(' ')[0]}`}>
                        {deployment.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">
                      {formatDuration(deployment.createdAt, deployment.completedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40">
                      {formatTimestamp(deployment.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Feature Flags */}
      {activeTab === 'flags' && (
        <div className="space-y-3">
          {featureFlags.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm">No feature flags configured</p>
            </div>
          ) : (
            featureFlags.map((flag) => (
              <div
                key={flag.key}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-indigo-400" />
                    <div>
                      <p className="text-sm font-black text-white">{flag.key}</p>
                      {flag.description && (
                        <p className="text-xs text-white/60">{flag.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleFeatureFlag(flag.key, flag.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      flag.value ? 'bg-indigo-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        flag.value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-black ${
                    flag.value ? 'text-emerald-400' : 'text-gray-400'
                  }`}>
                    {flag.value ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Terminal className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm">No recent logs</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border-l-4 border-l-indigo-500"
              >
                <span className={`px-2 py-1 rounded text-xs font-black ${getLogLevelColor(log.level)}`}>
                  {log.level.toUpperCase()}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-indigo-400">{log.service}</span>
                    <span className="text-xs text-white/40">{formatTimestamp(log.timestamp)}</span>
                  </div>
                  <p className="text-sm text-white font-mono">{log.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Configuration */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-white/5 rounded-xl p-6">
            <h3 className="text-sm font-black text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center gap-3 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
                <Rocket className="w-4 h-4" />
                <span className="text-sm font-black">Deploy Service</span>
              </button>
              <button className="flex items-center gap-3 p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition">
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm font-black">Rollback</span>
              </button>
              <button className="flex items-center gap-3 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition">
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-black">Restart Service</span>
              </button>
              <button className="flex items-center gap-3 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                <Package className="w-4 h-4" />
                <span className="text-sm font-black">View Config</span>
              </button>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6">
            <h3 className="text-sm font-black text-white mb-4">Environment Status</h3>
            <div className="space-y-3">
              {[
                { name: 'Production', status: 'healthy', url: 'https://api.advancia.com' },
                { name: 'Staging', status: 'healthy', url: 'https://staging.advancia.com' },
                { name: 'Development', status: 'healthy', url: 'http://localhost:3000' },
              ].map((env, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      env.status === 'healthy' ? 'bg-emerald-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-sm text-white font-black">{env.name}</span>
                  </div>
                  <span className="text-xs text-white/60 font-mono">{env.url}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-black text-white">{deployments.length}</p>
            <p className="text-xs text-white/60">Deployments</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{featureFlags.filter(f => f.value).length}</p>
            <p className="text-xs text-white/60">Flags Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{deployments.filter(d => d.status === 'success').length}</p>
            <p className="text-xs text-white/60">Successful</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{logs.filter(l => l.level === 'error').length}</p>
            <p className="text-xs text-white/60">Errors</p>
          </div>
        </div>
      </div>
    </div>
  );
}
