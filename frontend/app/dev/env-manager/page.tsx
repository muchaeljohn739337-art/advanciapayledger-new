"use client";

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Copy, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface EnvVariable {
  key: string;
  value: string;
  category: string;
  isSecret: boolean;
  description?: string;
}

const envCategories = {
  Database: { icon: '🗄️', color: 'from-blue-500 to-cyan-400' },
  Authentication: { icon: '🔐', color: 'from-purple-500 to-pink-400' },
  External: { icon: '🌐', color: 'from-green-500 to-emerald-400' },
  Infrastructure: { icon: '🏗️', color: 'from-amber-500 to-orange-400' },
  Monitoring: { icon: '📊', color: 'from-indigo-500 to-blue-400' },
  Development: { icon: '🛠️', color: 'from-gray-500 to-slate-400' },
};

export default function EnvManager() {
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSecrets, setShowSecrets] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEnvVars();
  }, []);

  const fetchEnvVars = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dev/environment');
      if (response.ok) {
        const data = await response.json();
        setEnvVars(data);
      }
    } catch (error) {
      console.error('Failed to fetch environment variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyValue = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const maskValue = (value: string, isSecret: boolean) => {
    if (!isSecret || showSecrets) return value;
    return '•'.repeat(Math.min(value.length, 20));
  };

  const filteredVars = envVars.filter(env => {
    const matchesCategory = selectedCategory === 'All' || env.category === selectedCategory;
    const matchesSearch = env.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         env.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', ...Object.keys(envCategories)];
  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = category === 'All' 
      ? envVars.length 
      : envVars.filter(env => env.category === category).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none italic mb-4">
            Environment Manager
          </h1>
          <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs">
            View and manage environment configuration
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search environment variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-lg placeholder-white/50 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-black uppercase tracking-widest text-sm transition ${
                showSecrets 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
              {showSecrets ? 'Hide Secrets' : 'Show Secrets'}
            </button>
            <button
              onClick={fetchEnvVars}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-black uppercase tracking-widest text-sm transition disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 bg-white/5 backdrop-blur-md p-2 rounded-[2rem] border border-white/10">
          {categories.map((category) => {
            const categoryInfo = envCategories[category as keyof typeof envCategories];
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{categoryInfo?.icon || '📋'}</span>
                <span>{category}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  selectedCategory === category ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                }`}>
                  {categoryCounts[category]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Environment Variables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVars.map((envVar) => (
            <div
              key={envVar.key}
              className="group bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-6 hover:bg-white/10 transition-all hover:scale-[1.02] hover:shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">
                    {envVar.key}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-black bg-gradient-to-r ${
                      envCategories[envVar.category as keyof typeof envCategories]?.color || 'from-gray-500 to-slate-400'
                    } text-white`}>
                      {envVar.category}
                    </span>
                    {envVar.isSecret && (
                      <span className="px-2 py-1 rounded-lg text-xs font-black bg-red-500/20 text-red-300">
                        SECRET
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyValue(envVar.key, envVar.value)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                >
                  {copied === envVar.key ? (
                    <CheckCircle size={16} className="text-emerald-400" />
                  ) : (
                    <Copy size={16} className="text-white/60" />
                  )}
                </button>
              </div>

              <div className="mb-4">
                <div className="bg-black/30 rounded-lg p-3 font-mono text-xs break-all">
                  <span className={envVar.isSecret && !showSecrets ? 'text-red-400' : 'text-green-400'}>
                    {maskValue(envVar.value, envVar.isSecret)}
                  </span>
                </div>
              </div>

              {envVar.description && (
                <div className="text-xs text-white/60">
                  <p>{envVar.description}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Length: {envVar.value.length}</span>
                  <span className="text-white/40">Type: {envVar.isSecret ? 'Secret' : 'Public'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredVars.length === 0 && !loading && (
          <div className="text-center py-12">
            <Settings className="text-white/20 mx-auto mb-4" size={48} />
            <p className="text-white/60 font-bold uppercase tracking-widest text-sm">
              No environment variables found
            </p>
            <p className="text-white/40 text-sm mt-2">
              Try adjusting your search or category filter
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="text-white/20 mx-auto mb-4 animate-spin" size={48} />
            <p className="text-white/60 font-bold uppercase tracking-widest text-sm">
              Loading environment variables...
            </p>
          </div>
        )}

        {/* Security Warning */}
        <div className="mt-12 bg-amber-500/10 border border-amber-500/30 rounded-[2rem] p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-amber-400 mt-1" size={20} />
            <div>
              <h4 className="text-sm font-black text-amber-300 uppercase tracking-widest mb-2">
                Security Notice
              </h4>
              <p className="text-xs text-amber-200 leading-relaxed">
                Environment variables contain sensitive information including API keys, database credentials, 
                and other secrets. Be careful when sharing screenshots or copying values. 
                Secrets are masked by default for your protection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
