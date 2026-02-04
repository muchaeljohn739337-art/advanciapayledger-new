"use client";

import { useState } from 'react';
import { Database, Play, Copy, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface QueryResult {
  columns: string[];
  rows: any[][];
  executionTime: number;
  rowCount: number;
  error?: string;
}

const sampleQueries = [
  { sql: 'SELECT COUNT(*) as total_users FROM "User";', description: 'Count total users' },
  { sql: 'SELECT * FROM "User" LIMIT 10;', description: 'List first 10 users' },
  { sql: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';', description: 'List all tables' },
  { sql: 'SELECT schemaname,tablename,attname,n_distinct,correlation FROM pg_stats LIMIT 10;', description: 'Table statistics' },
  { sql: 'SELECT * FROM pg_stat_activity LIMIT 5;', description: 'Active connections' },
];

export default function DatabaseConsole() {
  const [query, setQuery] = useState('SELECT * FROM "User" LIMIT 10;');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const executeQuery = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/dev/database/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const endTime = Date.now();
      const data = await response.json();

      if (response.ok) {
        setResult({
          columns: data.columns || [],
          rows: data.rows || [],
          executionTime: endTime - startTime,
          rowCount: data.rowCount || 0,
        });
        setHistory([query, ...history.slice(0, 9)]);
      } else {
        setResult({
          columns: [],
          rows: [],
          executionTime: endTime - startTime,
          rowCount: 0,
          error: data.error || 'Query execution failed',
        });
      }
    } catch (error) {
      setResult({
        columns: [],
        rows: [],
        executionTime: Date.now() - startTime,
        rowCount: 0,
        error: error instanceof Error ? error.message : 'Network error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSampleQuery = (sql: string) => {
    setQuery(sql);
  };

  const formatSql = (sql: string) => {
    // Simple SQL formatter
    return sql
      .replace(/\s+/g, ' ')
      .replace(/\bSELECT\b/gi, '\nSELECT')
      .replace(/\bFROM\b/gi, '\nFROM')
      .replace(/\bWHERE\b/gi, '\nWHERE')
      .replace(/\bORDER BY\b/gi, '\nORDER BY')
      .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
      .replace(/\bHAVING\b/gi, '\nHAVING')
      .replace(/\bLIMIT\b/gi, '\nLIMIT')
      .trim();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none italic mb-4">
            Database Console
          </h1>
          <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs">
            Execute SQL queries and explore database
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Query Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white uppercase tracking-tight italic">
                  SQL Query Editor
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={handleCopyQuery}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-black uppercase tracking-widest transition"
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={executeQuery}
                    disabled={loading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-black uppercase tracking-widest text-sm transition disabled:opacity-50"
                  >
                    <Database size={16} />
                    {loading ? 'Executing...' : 'Execute'}
                    <Play size={16} />
                  </button>
                </div>
              </div>

              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your SQL query here..."
                rows={8}
                className="w-full px-4 py-3 bg-black/30 border border-white/20 text-green-400 rounded-lg placeholder-green-400/50 focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none"
                spellCheck={false}
              />

              {/* Sample Queries */}
              <div className="mt-6">
                <h3 className="text-sm font-black text-white/80 uppercase tracking-widest mb-3">Sample Queries</h3>
                <div className="space-y-2">
                  {sampleQueries.map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => loadSampleQuery(sample.sql)}
                      className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition group"
                    >
                      <p className="text-white font-mono text-sm mb-1">{sample.sql}</p>
                      <p className="text-xs text-white/60">{sample.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Query Results */}
            {result && (
              <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight italic">
                    Query Results
                  </h2>
                  <div className="flex items-center gap-4">
                    {result.error ? (
                      <div className="flex items-center gap-2 text-red-400">
                        <XCircle size={16} />
                        <span className="text-sm font-black uppercase">Error</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle size={16} />
                        <span className="text-sm font-black uppercase">Success</span>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-white/60">Execution Time</p>
                      <p className="text-sm font-black text-white">{result.executionTime}ms</p>
                    </div>
                  </div>
                </div>

                {result.error ? (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-red-400 font-mono text-sm">{result.error}</p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <p className="text-sm text-white/60">
                        {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} returned
                      </p>
                    </div>

                    {result.rows.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              {result.columns.map((column, index) => (
                                <th key={index} className="text-left p-3 font-black text-white/80 uppercase tracking-widest text-xs">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.rows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/5">
                                {row.map((cell, cellIndex) => (
                                  <td key={cellIndex} className="p-3 text-white/80 font-mono text-xs">
                                    {cell === null ? (
                                      <span className="text-white/40 italic">NULL</span>
                                    ) : cell === '' ? (
                                      <span className="text-white/40 italic">Empty</span>
                                    ) : (
                                      String(cell)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Query History */}
            {history.length > 0 && (
              <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-6">
                <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tight italic">
                  Query History
                </h3>
                <div className="space-y-2">
                  {history.map((historicalQuery, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(historicalQuery)}
                      className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition"
                    >
                      <p className="text-white font-mono text-xs truncate">{historicalQuery}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Database Info */}
            <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-6">
              <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tight italic">
                Database Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-white/60 uppercase tracking-widest">Type</span>
                  <span className="text-xs font-black text-white">PostgreSQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/60 uppercase tracking-widest">Status</span>
                  <span className="text-xs font-black text-emerald-400">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-white/60 uppercase tracking-widest">Environment</span>
                  <span className="text-xs font-black text-white">Development</span>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-6">
              <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tight italic">
                Shortcuts
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/60">Execute Query</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-white">Ctrl + Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Format SQL</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-white">Ctrl + F</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Clear Editor</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-white">Ctrl + K</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
