"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Brain,
  Code,
  BarChart,
  Shield,
  Play,
  Pause
} from 'lucide-react';

interface AgentTask {
  id: string;
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: any;
  output?: any;
  tokensUsed?: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface AgentStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
  successRate: number;
}

export default function AIAgentActivity() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'logs' | 'stats'>('active');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        fetch('/api/ai/tasks/active'),
        fetch('/api/ai/tasks/stats')
      ]);

      const tasksData = await tasksRes.json();
      const statsData = await statsRes.json();

      setTasks(tasksData.activeTasks || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAgentIcon = (agentName: string) => {
    if (agentName.includes('code')) return <Code className="w-4 h-4" />;
    if (agentName.includes('analysis')) return <BarChart className="w-4 h-4" />;
    if (agentName.includes('security')) return <Shield className="w-4 h-4" />;
    return <Brain className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-400/20 border-emerald-400/30';
      case 'running':
        return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
      case 'failed':
        return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'pending':
        return 'text-amber-400 bg-amber-400/20 border-amber-400/30';
      default:
        return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'running':
        return <Play className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Pause className="w-4 h-4" />;
    }
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
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
          AI Agent Activity
        </h2>
        <div className="flex gap-2">
          {(['active', 'logs', 'stats'] as const).map((tab) => (
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

      {/* Active Tasks */}
      {activeTab === 'active' && (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm">No active tasks</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${getStatusColor(task.status)}`}>
                    {getAgentIcon(task.agentName)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{task.agentName}</p>
                    <p className="text-xs text-white/60">Task ID: {task.id.slice(-8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className={`text-xs font-black uppercase ${getStatusColor(task.status).split(' ')[0]}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">
                      {task.startedAt && formatDuration(task.startedAt, task.completedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    {task.tokensUsed && (
                      <p className="text-xs text-emerald-400">
                        {task.tokensUsed} tokens
                      </p>
                    )}
                    <p className="text-xs text-white/40">
                      {formatTimestamp(task.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-sm">Agent logs will appear here</p>
            <p className="text-xs text-white/40 mt-2">Real-time agent execution logs</p>
          </div>
        </div>
      )}

      {/* Statistics */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <p className="text-2xl font-black text-white">{stats.total}</p>
              <p className="text-xs text-white/60">Total</p>
            </div>
            <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
              <p className="text-2xl font-black text-emerald-400">{stats.completed}</p>
              <p className="text-xs text-emerald-300">Completed</p>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <p className="text-2xl font-black text-blue-400">{stats.running}</p>
              <p className="text-xs text-blue-300">Running</p>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/30">
              <p className="text-2xl font-black text-red-400">{stats.failed}</p>
              <p className="text-xs text-red-300">Failed</p>
            </div>
            <div className="text-center p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <p className="text-2xl font-black text-amber-400">{stats.pending}</p>
              <p className="text-xs text-amber-300">Pending</p>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white/5 rounded-xl p-6">
            <h3 className="text-sm font-black text-white mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Success Rate</span>
                  <span className="text-white font-black">{stats.successRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.successRate}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/60">Avg Tokens/Task</p>
                  <p className="text-white font-black">1,247</p>
                </div>
                <div>
                  <p className="text-white/60">Avg Duration</p>
                  <p className="text-white font-black">2.3s</p>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Distribution */}
          <div className="bg-white/5 rounded-xl p-6">
            <h3 className="text-sm font-black text-white mb-4">Agent Distribution</h3>
            <div className="space-y-3">
              {[
                { name: 'Code Generator', count: 45, color: 'from-blue-500 to-cyan-400' },
                { name: 'Data Analyst', count: 32, color: 'from-purple-500 to-pink-400' },
                { name: 'Security Scanner', count: 28, color: 'from-emerald-500 to-green-400' },
                { name: 'Optimizer', count: 15, color: 'from-amber-500 to-orange-400' },
              ].map((agent, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">{agent.name}</span>
                    <span className="text-white/60">{agent.count} tasks</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${agent.color}`}
                      style={{ width: `${(agent.count / stats.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-white/60">AI Processing Active</span>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black uppercase tracking-widest transition">
            Trigger Task
          </button>
        </div>
      </div>
    </div>
  );
}
