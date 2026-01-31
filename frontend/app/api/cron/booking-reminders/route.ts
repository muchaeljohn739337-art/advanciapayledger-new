import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Call backend to send booking reminders for upcoming appointments
    const response = await fetch(`${backendUrl}/api/bookings/send-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-job': 'true',
      },
    });

    const data = await response.json();

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      job: 'booking-reminders',
      result: data,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      timestamp: new Date().toISOString(),
      job: 'booking-reminders',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
