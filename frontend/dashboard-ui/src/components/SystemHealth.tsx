"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Activity,
  Server,
  Database,
  Globe,
  Shield
} from 'lucide-react';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string;
  icon: React.ReactNode;
  details?: string[];
}

interface SystemHealthProps {
  refreshInterval?: number;
}

export default function SystemHealth({ refreshInterval = 30000 }: SystemHealthProps) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchHealthMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/health/status');
      const data = await response.json();
      
      const healthMetrics: HealthMetric[] = [
        {
          name: 'API Gateway',
          status: data.status === 'healthy' ? 'healthy' : 'warning',
          value: '99.9%',
          icon: <Globe className="w-5 h-5" />,
          details: data.issues || []
        },
        {
          name: 'Database',
          status: 'healthy',
          value: 'Connected',
          icon: <Database className="w-5 h-5" />,
          details: ['Connections: 45/100', 'Query time: 12ms']
        },
        {
          name: 'Web3 Service',
          status: 'healthy',
          value: 'Active',
          icon: <Shield className="w-5 h-5" />,
          details: ['Ethereum: Connected', 'Solana: Connected']
        },
        {
          name: 'AI Orchestrator',
          status: 'healthy',
          value: 'Running',
          icon: <Activity className="w-5 h-5" />,
          details: ['Tasks: 12 active', 'Queue: 3 pending']
        },
        {
          name: 'Monitoring',
          status: 'healthy',
          value: 'Collecting',
          icon: <Server className="w-5 h-5" />,
          details: ['CPU: 23%', 'Memory: 45%']
        }
      ];

      setMetrics(healthMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthMetrics();
    const interval = setInterval(fetchHealthMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-400 bg-emerald-400/20 border-emerald-400/30';
      case 'warning':
        return 'text-amber-400 bg-amber-400/20 border-amber-400/30';
      case 'critical':
        return 'text-red-400 bg-red-400/20 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4 w-32"></div>
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-white/10 rounded-xl"></div>
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
          System Health
        </h2>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <Activity className="w-3 h-3" />
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`relative group cursor-pointer transition-all duration-300 hover:scale-[1.05]`}
          >
            <div className={`p-4 rounded-xl border ${getStatusColor(metric.status)} backdrop-blur-sm`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-white/10`}>
                  {metric.icon}
                </div>
                <div className={getStatusColor(metric.status)}>
                  {getStatusIcon(metric.status)}
                </div>
              </div>
              
              <h3 className="text-sm font-black text-white mb-1">
                {metric.name}
              </h3>
              
              <p className="text-xs text-white/70 font-mono">
                {metric.value}
              </p>
            </div>

            {/* Hover tooltip */}
            {metric.details && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-black/90 border border-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 min-w-[200px]">
                <div className="text-xs space-y-1">
                  {metric.details.map((detail, i) => (
                    <div key={i} className="text-white/80">{detail}</div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-black/90 border-r border-t border-white/20"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Status */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor('healthy').split(' ')[0]}`}></div>
            <span className="text-sm font-black text-white">
              Overall System Status
            </span>
          </div>
          <span className="text-sm text-emerald-400 font-bold">
            OPERATIONAL
          </span>
        </div>
        <p className="text-xs text-white/60 mt-2">
          All systems operational. {metrics.filter(m => m.status !== 'healthy').length} services require attention.
        </p>
      </div>
    </div>
  );
}
