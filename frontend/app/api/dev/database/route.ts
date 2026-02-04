import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate database information
    const databaseInfo = {
      status: 'connected',
      connections: Math.floor(Math.random() * 50) + 10,
      maxConnections: 100,
      queryTime: Math.floor(Math.random() * 50) + 10,
      size: `${(Math.random() * 10 + 5).toFixed(2)} GB`,
      lastBackup: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString(),
    };

    return NextResponse.json(databaseInfo);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch database information' },
      { status: 500 }
    );
  }
}
