'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface KYCStatus {
  verified: boolean;
  status: string | null;
  completedAt: string | null;
}

export default function KYCVerification() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<KYCStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    checkStatus();
  }, []);
  
  const startVerification = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/kyc/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to start verification');
      }
      
      const { data } = await response.json();
      
      window.location.href = data.url;
    } catch (err) {
      setError('Failed to start verification. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const checkStatus = async () => {
    try {
      const response = await fetch('/api/kyc/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const { data } = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Status check error:', err);
    }
  };
  
  const getStatusIcon = () => {
    if (!status?.status) return <AlertCircle className="w-12 h-12 text-gray-400" />;
    
    switch (status.status) {
      case 'approved':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-12 h-12 text-red-500" />;
      case 'pending':
        return <Clock className="w-12 h-12 text-yellow-500" />;
      default:
        return <AlertCircle className="w-12 h-12 text-gray-400" />;
    }
  };
  
  const getStatusColor = () => {
    if (!status?.status) return 'bg-gray-100 text-gray-800';
    
    switch (status.status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        {getStatusIcon()}
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-4">Identity Verification</h2>
      
      {status?.status && (
        <div className={`mb-6 p-4 rounded-lg ${getStatusColor()}`}>
          <p className="font-semibold text-center">
            Status: {status.status.toUpperCase()}
          </p>
          {status.completedAt && (
            <p className="text-sm text-center mt-2">
              Completed: {new Date(status.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
      
      {!status?.verified && (
        <>
          <div className="mb-6 space-y-3">
            <p className="text-gray-600">
              To comply with financial regulations, we need to verify your identity.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Cost:</strong> $1.50 per verification (one-time fee)
              </p>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ Government-issued ID required</li>
              <li>✓ Selfie verification included</li>
              <li>✓ Secure & encrypted process</li>
              <li>✓ Usually completes in 2-5 minutes</li>
            </ul>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={startVerification}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Starting Verification...' : 'Start Verification'}
            </button>
            
            <button
              onClick={checkStatus}
              className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </>
      )}
      
      {status?.verified && (
        <div className="text-center">
          <p className="text-green-600 font-semibold mb-4">
            ✓ Your identity has been verified!
          </p>
          <p className="text-sm text-gray-600">
            You now have full access to all platform features.
          </p>
        </div>
      )}
    </div>
  );
}
