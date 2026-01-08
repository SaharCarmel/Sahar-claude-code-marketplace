import { NextResponse } from 'next/server';
import { getLatestSession } from '@/lib/data-store';

// Force dynamic - needs to read from filesystem
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getLatestSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No sessions found' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to get latest session:', error);
    return NextResponse.json(
      { error: 'Failed to get latest session' },
      { status: 500 }
    );
  }
}
