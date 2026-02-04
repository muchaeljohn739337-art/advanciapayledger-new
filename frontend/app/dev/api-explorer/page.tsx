"use client";

import { useState } from 'react';
import { Terminal, Send, Copy, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  headers: Record<string, string>;
  body?: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
}

export default function ApiExplorer() {
  const [request, setRequest] = useState<ApiRequest>({
    method: 'GET',
    endpoint: '/api/v1/health',
    headers: {
      'Content-Type': 'application/json',
    },
    body: '',
  });

  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const predefinedEndpoints = [
    { method: 'GET', endpoint: '/api/v1/health', description: 'Health check endpoint' },
    { method: 'POST', endpoint: '/api/v1/auth/login', description: 'User authentication' },
    { method: 'GET', endpoint: '/api/v1/wallets', description: 'List user wallets' },
    { method: 'POST', endpoint: '/api/v1/payments', description: 'Create payment' },
    { method: 'GET', endpoint: '/api/v1/users/me', description: 'Get current user' },
    { method: 'GET', endpoint: '/api/dev/metrics', description: 'System metrics' },
    { method: 'GET', endpoint: '/api/dev/database', description: 'Database status' },
    { method: 'GET', endpoint: '/api/dev/logs', description: 'System logs' },
  ];

  const handleSendRequest = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const options: RequestInit = {
        method: request.method,
        headers: request.headers,
      };

      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        options.body = request.body;
      }

      const res = await fetch(`http://localhost:3001${request.endpoint}`, options);
      const endTime = Date.now();

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseBody = await res.text();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        duration: endTime - startTime,
      });
    } catch (error) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(
        `Status: ${response.status} ${response.statusText}\n` +
        `Duration: ${response.duration}ms\n` +
        `Headers:\n${JSON.stringify(response.headers, null, 2)}\n\n` +
        `Body:\n${response.body}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle className="text-emerald-400" size={20} />;
    if (status >= 400 && status < 500) return <AlertTriangle className="text-amber-400" size={20} />;
    if (status >= 500 || status === 0) return <XCircle className="text-red-400" size={20} />;
    return null;
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-400';
    if (status >= 400 && status < 500) return 'text-amber-400';
    if (status >= 500 || status === 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none italic mb-4">
            API Explorer
          </h1>
          <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs">
            Test and explore API endpoints
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Request Panel */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-8">
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight italic">
                Request Configuration
              </h2>

              {/* Method and Endpoint */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-4">
                  <select
                    value={request.method}
                    onChange={(e) => setRequest({ ...request, method: e.target.value as any })}
                    className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                  <input
                    type="text"
                    value={request.endpoint}
                    onChange={(e) => setRequest({ ...request, endpoint: e.target.value })}
                    placeholder="/api/v1/endpoint"
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg placeholder-white/50 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Headers */}
              <div className="mb-6">
                <h3 className="text-sm font-black text-white/80 uppercase tracking-widest mb-3">Headers</h3>
                <div className="space-y-2">
                  {Object.entries(request.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newHeaders = { ...request.headers };
                          delete newHeaders[key];
                          setRequest({ ...request, headers: newHeaders });
                        }}
                        className="flex-1 px-3 py-1 bg-white/10 border border-white/20 text-white rounded text-sm"
                        readOnly
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setRequest({
                          ...request,
                          headers: { ...request.headers, [key]: e.target.value }
                        })}
                        className="flex-1 px-3 py-1 bg-white/10 border border-white/20 text-white rounded text-sm"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setRequest({
                      ...request,
                      headers: { ...request.headers, '': '' }
                    })}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-black uppercase tracking-widest"
                  >
                    + Add Header
                  </button>
                </div>
              </div>

              {/* Body */}
              {['POST', 'PUT', 'PATCH'].includes(request.method) && (
                <div className="mb-6">
                  <h3 className="text-sm font-black text-white/80 uppercase tracking-widest mb-3">Body (JSON)</h3>
                  <textarea
                    value={request.body}
                    onChange={(e) => setRequest({ ...request, body: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows={6}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-lg placeholder-white/50 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition disabled:opacity-50"
              >
                <Terminal size={16} />
                {loading ? 'Sending...' : 'Send Request'}
                <Send size={16} />
              </button>
            </div>

            {/* Predefined Endpoints */}
            <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-8">
              <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tight italic">
                Quick Endpoints
              </h3>
              <div className="space-y-2">
                {predefinedEndpoints.map((endpoint, index) => (
                  <button
                    key={index}
                    onClick={() => setRequest({
                      method: endpoint.method as any,
                      endpoint: endpoint.endpoint,
                      headers: request.headers,
                      body: '',
                    })}
                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`inline-block px-2 py-1 text-xs font-black rounded ${
                          endpoint.method === 'GET' ? 'bg-emerald-500/20 text-emerald-300' :
                          endpoint.method === 'POST' ? 'bg-blue-500/20 text-blue-300' :
                          endpoint.method === 'PUT' ? 'bg-amber-500/20 text-amber-300' :
                          endpoint.method === 'DELETE' ? 'bg-red-500/20 text-red-300' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>
                          {endpoint.method}
                        </span>
                        <span className="ml-3 text-white font-mono text-sm">{endpoint.endpoint}</span>
                      </div>
                    </div>
                    <p className="text-xs text-white/60 mt-1">{endpoint.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Response Panel */}
          <div className="space-y-6">
            {response && (
              <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight italic">
                    Response
                  </h2>
                  <button
                    onClick={handleCopyResponse}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-black uppercase tracking-widest transition"
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Status */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl">
                  {getStatusIcon(response.status)}
                  <div>
                    <p className={`text-2xl font-black ${getStatusColor(response.status)}`}>
                      {response.status}
                    </p>
                    <p className="text-sm text-white/60">{response.statusText}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-white/60">Duration</p>
                    <p className="text-lg font-black text-white">{response.duration}ms</p>
                  </div>
                </div>

                {/* Headers */}
                <div className="mb-6">
                  <h3 className="text-sm font-black text-white/80 uppercase tracking-widest mb-3">Response Headers</h3>
                  <div className="bg-black/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-green-400 font-mono">
                      {JSON.stringify(response.headers, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Body */}
                <div>
                  <h3 className="text-sm font-black text-white/80 uppercase tracking-widest mb-3">Response Body</h3>
                  <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                      {response.body}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {!response && (
              <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-12 text-center">
                <Terminal className="text-white/20 mx-auto mb-4" size={48} />
                <p className="text-white/60 font-bold uppercase tracking-widest text-sm">
                  Send a request to see the response
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
