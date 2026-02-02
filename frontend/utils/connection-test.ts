// utils/connection-test.ts
// Frontend-Backend Connection Testing Utilities

import { testConnection, api } from '@/lib/api/client';

// ===========================================
// CONNECTION DIAGNOSTICS
// ===========================================

export interface ConnectionDiagnostics {
  backendReachable: boolean;
  responseTime: number;
  apiVersion: string | null;
  environment: string | null;
  corsEnabled: boolean;
  authenticationWorking: boolean;
  errors: string[];
}

export async function runConnectionDiagnostics(): Promise<ConnectionDiagnostics> {
  const diagnostics: ConnectionDiagnostics = {
    backendReachable: false,
    responseTime: 0,
    apiVersion: null,
    environment: null,
    corsEnabled: false,
    authenticationWorking: false,
    errors: [],
  };
  
  try {
    // Test 1: Basic connectivity
    console.log('🔍 Testing backend connectivity...');
    const startTime = performance.now();
    
    const healthResponse = await api.get('/health');
    const endTime = performance.now();
    
    diagnostics.backendReachable = true;
    diagnostics.responseTime = Math.round(endTime - startTime);
    diagnostics.apiVersion = healthResponse.data.version;
    diagnostics.environment = healthResponse.data.environment;
    
    console.log('✅ Backend is reachable');
    console.log(`⚡ Response time: ${diagnostics.responseTime}ms`);
    
  } catch (error: any) {
    diagnostics.errors.push(`Backend connectivity failed: ${error.message}`);
    console.error('❌ Backend is not reachable:', error.message);
  }
  
  try {
    // Test 2: CORS check
    console.log('🔍 Testing CORS configuration...');
    const pingResponse = await api.get('/ping');
    
    diagnostics.corsEnabled = true;
    console.log('✅ CORS is properly configured');
    
  } catch (error: any) {
    if (error.message.includes('CORS')) {
      diagnostics.errors.push('CORS configuration issue detected');
      console.error('❌ CORS error:', error.message);
    }
  }
  
  try {
    // Test 3: Authentication flow (if token exists)
    const token = localStorage.getItem('auth_token');
    if (token) {
      console.log('🔍 Testing authentication...');
      await api.get('/users/me');
      diagnostics.authenticationWorking = true;
      console.log('✅ Authentication working');
    } else {
      console.log('⚠️ No auth token found (not logged in)');
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      diagnostics.errors.push('Authentication token invalid or expired');
    }
  }
  
  return diagnostics;
}

// ===========================================
// CONNECTION STATUS COMPONENT
// ===========================================

export function formatDiagnostics(diagnostics: ConnectionDiagnostics): string {
  const lines = [
    '═══════════════════════════════════════',
    '  Frontend-Backend Connection Status',
    '═══════════════════════════════════════',
    '',
    `Backend Reachable: ${diagnostics.backendReachable ? '✅ Yes' : '❌ No'}`,
    `Response Time: ${diagnostics.responseTime}ms`,
    `API Version: ${diagnostics.apiVersion || 'Unknown'}`,
    `Environment: ${diagnostics.environment || 'Unknown'}`,
    `CORS Enabled: ${diagnostics.corsEnabled ? '✅ Yes' : '❌ No'}`,
    `Authentication: ${diagnostics.authenticationWorking ? '✅ Working' : '⚠️ Not tested'}`, 
    '',
  ];
  
  if (diagnostics.errors.length > 0) {
    lines.push('Errors:');
    diagnostics.errors.forEach(error => {
      lines.push(`  ❌ ${error}`);
    });
    lines.push('');
  }
  
  lines.push('═══════════════════════════════════════');
  
  return lines.join('\n');
}

// ===========================================
// REACT HOOK FOR CONNECTION STATUS
// ===========================================

import { useState, useEffect } from 'react';

export function useConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [diagnostics, setDiagnostics] = useState<ConnectionDiagnostics | null>(null);
  
  useEffect(() => {
    checkConnection();
    
    // Recheck every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  async function checkConnection() {
    try {
      const result = await runConnectionDiagnostics();
      setDiagnostics(result);
      setStatus(result.backendReachable ? 'connected' : 'disconnected');
    } catch (error) {
      setStatus('disconnected');
    }
  }
  
  return { status, diagnostics, recheckConnection: checkConnection };
}

// ===========================================
// CLI TEST SCRIPT (for Node.js)
// ===========================================

export async function runCLIConnectionTest() {
  console.log('\n🚀 Starting Frontend-Backend Connection Test...\n');
  
  const diagnostics = await runConnectionDiagnostics();
  console.log('\n' + formatDiagnostics(diagnostics));
  
  if (diagnostics.backendReachable && diagnostics.corsEnabled) {
    console.log('✅ All connection tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some connection tests failed. Please check configuration.');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runCLIConnectionTest();
} 
