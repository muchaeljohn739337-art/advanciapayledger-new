import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes (in production, use a database)
let notes: any[] = [];

export async function POST(request: NextRequest) {
  try {
    notes = [];
    return NextResponse.json({ success: true, message: 'All notes cleared' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear notes' },
      { status: 500 }
    );
  }
}
