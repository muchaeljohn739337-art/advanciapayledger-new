"use client";

import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Globe,
  ShieldCheck,
  BrainCircuit,
  Lightbulb,
  Github,
  Terminal,
  Database,
  Code,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
  Package,
  GitBranch,
  Users,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    upload: number;
    download: number;
  };
  uptime: string;
  loadAverage: number[];
}

interface APIEndpoint {
  path: string;
  method: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: string;
  errorRate: number;
}

interface DatabaseInfo {
  status: 'connected' | 'disconnected' | 'maintenance';
  connections: number;
  maxConnections: number;
  queryTime: number;
  size: string;
  lastBackup: string;
}

interface BuildInfo {
  version: string;
  commit: string;
  branch: string;
  buildTime: string;
  environment: string;
  nodeVersion: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  metadata?: any;
}

const DevDashboard: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: { upload: 0, download: 0 },
    uptime: '0d 0h 0m',
    loadAverage: [0, 0, 0],
  });

  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([]);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo>({
    status: 'disconnected',
    connections: 0,
    maxConnections: 0,
    queryTime: 0,
    size: '0 GB',
    lastBackup: 'Never',
  });

  const [buildInfo, setBuildInfo] = useState<BuildInfo>({
    version: '1.0.0',
    commit: 'unknown',
    branch: 'main',
    buildTime: new Date().toISOString(),
    environment: 'development',
    nodeVersion: '20.x',
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'database' | 'logs' | 'tools'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  // Simulate real-time data updates
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch system metrics
        const metricsResponse = await fetch('/api/dev/metrics');
        if (metricsResponse.ok) {
          const metrics = await metricsResponse.json();
          setSystemMetrics(metrics);
        }

        // Fetch API status
        const apiResponse = await fetch('/api/dev/api-status');
        if (apiResponse.ok) {
          const endpoints = await apiResponse.json();
          setApiEndpoints(endpoints);
        }

        // Fetch database info
        const dbResponse = await fetch('/api/dev/database');
        if (dbResponse.ok) {
          const dbInfo = await dbResponse.json();
          setDatabaseInfo(dbInfo);
        }

        // Fetch build info
        const buildResponse = await fetch('/api/dev/build-info');
        if (buildResponse.ok) {
          const build = await buildResponse.json();
          setBuildInfo(build);
        }

        // Fetch recent logs
        const logsResponse = await fetch('/api/dev/logs');
        if (logsResponse.ok) {
          const logData = await logsResponse.json();
          setLogs(logData.slice(0, 50)); // Show last 50 logs
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force refresh all data
      const responses = await Promise.all([
        fetch('/api/dev/metrics'),
        fetch('/api/dev/api-status'),
        fetch('/api/dev/database'),
        fetch('/api/dev/build-info'),
        fetch('/api/dev/logs'),
      ]);

      if (responses[0].ok) {
        const metrics = await responses[0].json();
        setSystemMetrics(metrics);
      }
      if (responses[1].ok) {
        const endpoints = await responses[1].json();
        setApiEndpoints(endpoints);
      }
      if (responses[2].ok) {
        const dbInfo = await responses[2].json();
        setDatabaseInfo(dbInfo);
      }
      if (responses[3].ok) {
        const build = await responses[3].json();
        setBuildInfo(build);
      }
      if (responses[4].ok) {
        const logData = await responses[4].json();
        setLogs(logData.slice(0, 50));
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-emerald-400 bg-emerald-400/20';
      case 'degraded':
      case 'maintenance':
        return 'text-amber-400 bg-amber-400/20';
      case 'down':
      case 'disconnected':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
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

  return (
    <div className="space-y-8">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-[1.5rem] border border-white/20">
            <Server size={18} className="text-indigo-400" />
            <div className="text-left">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">
                Environment
              </p>
              <p className="text-sm font-black text-white leading-none">
                {buildInfo.environment}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-[1.5rem] border border-white/20">
            <GitBranch size={18} className="text-purple-400" />
            <div className="text-left">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">
                Branch
              </p>
              <p className="text-sm font-black text-white leading-none">
                {buildInfo.branch}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 bg-white/5 backdrop-blur-md p-2 rounded-[2rem] border border-white/10">
        {[
          { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
          { id: 'api', label: 'API Status', icon: <Terminal size={16} /> },
          { id: 'database', label: 'Database', icon: <Database size={16} /> },
          { id: 'logs', label: 'Logs', icon: <Code size={16} /> },
          { id: 'tools', label: 'Tools', icon: <Settings size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* System Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="CPU Usage"
              value={`${systemMetrics.cpu}%`}
              icon={<Cpu className="text-blue-400" />}
              trend={systemMetrics.cpu > 80 ? 'up' : 'stable'}
              color={systemMetrics.cpu > 80 ? 'red' : systemMetrics.cpu > 60 ? 'amber' : 'green'}
            />
            <MetricCard
              title="Memory Usage"
              value={`${systemMetrics.memory}%`}
              icon={<HardDrive className="text-purple-400" />}
              trend={systemMetrics.memory > 80 ? 'up' : 'stable'}
              color={systemMetrics.memory > 80 ? 'red' : systemMetrics.memory > 60 ? 'amber' : 'green'}
            />
            <MetricCard
              title="Disk Usage"
              value={`${systemMetrics.disk}%`}
              icon={<HardDrive className="text-emerald-400" />}
              trend={systemMetrics.disk > 90 ? 'up' : 'stable'}
              color={systemMetrics.disk > 90 ? 'red' : systemMetrics.disk > 70 ? 'amber' : 'green'}
            />
            <MetricCard
              title="Uptime"
              value={systemMetrics.uptime}
              icon={<Clock className="text-indigo-400" />}
              trend="stable"
              color="green"
            />
          </div>

          {/* Network Activity */}
          <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-8">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight italic">
              Network Activity
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-2xl">
                  <Download className="text-emerald-400" size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-white/60 uppercase tracking-widest">Download</p>
                  <p className="text-2xl font-black text-white">{systemMetrics.network.download} MB/s</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-2xl">
                  <Upload className="text-blue-400" size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-white/60 uppercase tracking-widest">Upload</p>
                  <p className="text-2xl font-black text-white">{systemMetrics.network.upload} MB/s</p>
                </div>
              </div>
            </div>
          </div>

          {/* Build Information */}
          <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-8">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight italic">
              Build Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">Version</p>
                <p className="text-sm font-black text-white">{buildInfo.version}</p>
              </div>
              <div>
                <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">Commit</p>
                <p className="text-sm font-black text-white font-mono">{buildInfo.commit.substring(0, 7)}</p>
              </div>
              <div>
                <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">Node Version</p>
                <p className="text-sm font-black text-white">{buildInfo.nodeVersion}</p>
              </div>
              <div>
                <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">Build Time</p>
                <p className="text-sm font-black text-white">{new Date(buildInfo.buildTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">Environment</p>
                <p className="text-sm font-black text-white">{buildInfo.environment}</p>
              </div>
              <div>
                <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">Load Average</p>
                <p className="text-sm font-black text-white">{systemMetrics.loadAverage.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Status Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-8">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight italic">
              API Endpoints Status
            </h3>
            <div className="space-y-4">
              {apiEndpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${getStatusColor(endpoint.status)}`}>
                      {endpoint.status === 'healthy' ? <CheckCircle size={16} /> :
                       endpoint.status === 'degraded' ? <AlertTriangle size={16} /> :
                       <XCircle size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{endpoint.method} {endpoint.path}</p>
                      <p className="text-xs text-white/60">Response: {endpoint.responseTime}ms | Error Rate: {endpoint.errorRate}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black ${getStatusColor(endpoint.status)}`}>
                      {endpoint.status}
                    </span>
                    <p className="text-xs text-white/40 mt-1">{endpoint.lastChecked}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-8">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight italic">
              Database Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Database className="text-indigo-400" size={20} />
                    <div>
                      <p className="text-sm font-black text-white">Status</p>
                      <p className="text-xs text-white/60">Connection Health</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-black ${getStatusColor(databaseInfo.status)}`}>
                    {databaseInfo.status}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Users className="text-purple-400" size={20} />
                    <div>
                      <p className="text-sm font-black text-white">Connections</p>
                      <p className="text-xs text-white/60">Active / Max</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-white">
                    {databaseInfo.connections} / {databaseInfo.maxConnections}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Zap className="text-amber-400" size={20} />
                    <div>
                      <p className="text-sm font-black text-white">Query Time</p>
                      <p className="text-xs text-white/60">Average Response</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-white">{databaseInfo.queryTime}ms</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <HardDrive className="text-emerald-400" size={20} />
                    <div>
                      <p className="text-sm font-black text-white">Database Size</p>
                      <p className="text-xs text-white/60">Total Storage</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-white">{databaseInfo.size}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
              <div className="flex items-center gap-3">
                <Clock className="text-amber-400" size={20} />
                <div>
                  <p className="text-sm font-black text-white">Last Backup</p>
                  <p className="text-xs text-amber-300">{databaseInfo.lastBackup}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white uppercase tracking-tight italic">
                System Logs
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                >
                  {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
                  <Download size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border-l-4 border-l-indigo-500">
                  <span className={`px-2 py-1 rounded text-xs font-black ${getLogLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs text-white/60">{log.timestamp}</span>
                      <span className="text-xs text-indigo-400">{log.source}</span>
                    </div>
                    <p className="text-sm text-white font-mono">{log.message}</p>
                    {log.metadata && (
                      <details className="mt-2">
                        <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60">Metadata</summary>
                        <pre className="text-xs text-white/30 mt-1 font-mono">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ToolCard
              title="API Explorer"
              description="Test and explore API endpoints"
              icon={<Terminal className="text-blue-400" />}
              href="/api-explorer"
            />
            <ToolCard
              title="Database Console"
              description="Execute SQL queries"
              icon={<Database className="text-purple-400" />}
              href="/db-console"
            />
            <ToolCard
              title="Environment Variables"
              description="View and manage environment config"
              icon={<Settings className="text-indigo-400" />}
              href="/env-manager"
            />
            <ToolCard
              title="Cache Manager"
              description="Clear and monitor cache"
              icon={<Zap className="text-amber-400" />}
              href="/cache-manager"
            />
            <ToolCard
              title="Security Audit"
              description="Run security checks"
              icon={<ShieldCheck className="text-emerald-400" />}
              href="/security-audit"
            />
            <ToolCard
              title="Performance Monitor"
              description="Detailed performance metrics"
              icon={<Activity className="text-red-400" />}
              href="/performance"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
  color: 'green' | 'amber' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, color }) => {
  const colors = {
    green: 'from-emerald-500 to-green-400',
    amber: 'from-amber-500 to-orange-400',
    red: 'from-red-500 to-pink-400',
  };

  return (
    <div className="group relative">
      <div className={`absolute inset-0 bg-gradient-to-r ${colors[color]} opacity-20 rounded-2xl blur-xl group-hover:opacity-30 transition`}></div>
      <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors">
            {icon}
          </div>
          <div className={`text-xs font-black px-2 py-1 rounded-lg ${
            trend === 'up' ? 'bg-red-500/20 text-red-300' :
            trend === 'down' ? 'bg-emerald-500/20 text-emerald-300' :
            'bg-blue-500/20 text-blue-300'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </div>
        </div>
        <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-2">{title}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </div>
  );
};

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon, href }) => {
  return (
    <a
      href={href}
      className="group block bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:scale-[1.02] hover:shadow-2xl"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors">
          {icon}
        </div>
        <ExternalLink className="text-white/40 group-hover:text-white/60 transition-colors" size={16} />
      </div>
      <h4 className="text-lg font-black text-white mb-2">{title}</h4>
      <p className="text-sm text-white/60">{description}</p>
    </a>
  );
};

export default DevDashboard;
