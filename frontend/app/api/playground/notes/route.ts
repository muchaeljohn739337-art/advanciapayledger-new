import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes (in production, use a database)
let notes: any[] = [];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newNote = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
    };
    notes.push(newNote);
    return NextResponse.json(newNote);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex === -1) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }
    
    notes[noteIndex] = { ...notes[noteIndex], ...updateData };
    return NextResponse.json(notes[noteIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }
    
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex === -1) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }
    
    notes.splice(noteIndex, 1);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
