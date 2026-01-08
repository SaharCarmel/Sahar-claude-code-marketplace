import { NextRequest, NextResponse } from 'next/server';
import { submitSession } from '@/lib/data-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await submitSession(id);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to submit session:', error);
    return NextResponse.json(
      { error: 'Failed to submit session' },
      { status: 500 }
    );
  }
}
