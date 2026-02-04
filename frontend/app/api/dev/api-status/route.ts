import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate API endpoint status checks
    const endpoints = [
      {
        path: '/api/v1/health',
        method: 'GET',
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 100) + 50,
        lastChecked: new Date().toISOString(),
        errorRate: 0,
      },
      {
        path: '/api/v1/auth/login',
        method: 'POST',
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 200) + 100,
        lastChecked: new Date().toISOString(),
        errorRate: Math.random() * 2,
      },
      {
        path: '/api/v1/wallets',
        method: 'GET',
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 150) + 80,
        lastChecked: new Date().toISOString(),
        errorRate: Math.random() * 1,
      },
      {
        path: '/api/v1/payments',
        method: 'POST',
        status: Math.random() > 0.8 ? 'degraded' : 'healthy',
        responseTime: Math.floor(Math.random() * 300) + 150,
        lastChecked: new Date().toISOString(),
        errorRate: Math.random() * 5,
      },
      {
        path: '/api/v1/users/me',
        method: 'GET',
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 120) + 60,
        lastChecked: new Date().toISOString(),
        errorRate: 0.5,
      },
      {
        path: '/api/v1/admin/users',
        method: 'GET',
        status: Math.random() > 0.9 ? 'down' : 'healthy',
        responseTime: Math.random() > 0.9 ? 9999 : Math.floor(Math.random() * 250) + 120,
        lastChecked: new Date().toISOString(),
        errorRate: Math.random() > 0.9 ? 100 : Math.random() * 3,
      },
    ];

    return NextResponse.json(endpoints);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch API status' },
      { status: 500 }
    );
  }
}
