import { NextRequest, NextResponse } from 'next/server';
import { listSessions, createSession } from '@/lib/data-store';
import { broadcastEvent } from '@/lib/sse-manager';
import type { TestSession } from '@/lib/types';

export async function GET() {
  try {
    const sessions = await listSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to list sessions:', error);
    return NextResponse.json(
      { error: 'Failed to list sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TestSession;

    // Validate required fields
    if (!body.id || !body.feature || !body.tests) {
      return NextResponse.json(
        { error: 'Missing required fields: id, feature, tests' },
        { status: 400 }
      );
    }

    const session = await createSession({
      ...body,
      status: 'active',
      mode: body.mode || 'webapp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Broadcast session creation for dashboard real-time updates
    broadcastEvent({
      type: 'session:created',
      sessionId: session.id,
      session,
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
