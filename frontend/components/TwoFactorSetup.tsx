'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Smartphone, CheckCircle2, AlertTriangle, Loader2, QrCode } from 'lucide-react';

const TwoFactorSetup = () => {
  const [step, setStep] = useState<'initial' | 'setup' | 'verify' | 'completed'>('initial');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check if 2FA is already enabled for the user
    const check2FAStatus = async () => {
      try {
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.user?.twoFactorEnabled) {
          setEnabled(true);
          setStep('completed');
        }
      } catch (err) {
        console.error('Error checking 2FA status:', err);
      }
    };
    check2FAStatus();
  }, []);

  const handleStartSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/security/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to initialize 2FA setup');
      
      const data = await response.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (token.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/security/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ token })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid verification code');
      }
      
      setEnabled(true);
      setStep('completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) return;
    
    // In a real app, you'd ask for one last OTP code to disable
    setStep('verify');
    setError('Enter your current OTP code to confirm disabling 2FA');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
        <div className="flex items-center gap-4 mb-2">
          <Shield className="w-10 h-10" />
          <h2 className="text-3xl font-bold">Security Shield</h2>
        </div>
        <p className="text-indigo-100 opacity-90">
          Protect your account with Two-Factor Authentication (2FA).
        </p>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {step === 'initial' && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Lock className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Enable 2FA Protection</h3>
              <p className="text-slate-600">
                Add an extra layer of security to your account. You'll need a code from an authenticator app (like Google Authenticator or Authy) to perform sensitive operations.
              </p>
            </div>
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Started'}
            </button>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Scan the QR Code</h4>
                <p className="text-sm text-slate-600">Scan this code with your authenticator app.</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              {qrCode ? (
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 mb-4 shadow-sm" />
              ) : (
                <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-lg mb-4" />
              )}
              {secret && (
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Manual Entry Code</p>
                  <code className="bg-white px-3 py-1 rounded border border-slate-200 font-mono text-sm font-bold text-indigo-600">
                    {secret}
                  </code>
                </div>
              )}
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div className="w-full">
                <h4 className="font-bold text-slate-900 mb-4">Enter Verification Code</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-center text-2xl tracking-[0.5em]"
                  />
                  <button
                    onClick={handleVerify}
                    disabled={loading || token.length !== 6}
                    className="px-8 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'completed' && (
          <div className="text-center space-y-6 py-4">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce-short">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">2FA is Enabled!</h3>
              <p className="text-slate-600">
                Your account is now protected with Two-Factor Authentication. Sensitve operations will require an OTP token.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-left">
              <div>
                <p className="font-bold text-slate-900">Status</p>
                <p className="text-sm text-green-600 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                </p>
              </div>
              <button
                onClick={handleDisable}
                className="text-sm font-bold text-red-600 hover:text-red-700 underline underline-offset-4"
              >
                Disable
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
        <Smartphone className="w-5 h-5 text-slate-400" />
        <p className="text-xs text-slate-500">
          Make sure you have an authenticator app installed on your phone.
        </p>
      </div>
    </div>
  );
};

export default TwoFactorSetup;
