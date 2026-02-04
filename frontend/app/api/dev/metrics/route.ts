import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate system metrics - in production, these would come from actual system monitoring
    const metrics = {
      cpu: Math.random() * 30 + 10, // 10-40% CPU usage
      memory: Math.random() * 40 + 40, // 40-80% memory usage
      disk: Math.random() * 20 + 60, // 60-80% disk usage
      network: {
        upload: Math.random() * 10 + 1, // 1-11 MB/s
        download: Math.random() * 50 + 10, // 10-60 MB/s
      },
      uptime: `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
      loadAverage: [
        (Math.random() * 2).toFixed(2),
        (Math.random() * 2).toFixed(2),
        (Math.random() * 2).toFixed(2),
      ],
    };

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch system metrics' },
      { status: 500 }
    );
  }
}
