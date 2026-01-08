import { NextRequest, NextResponse } from 'next/server';
import { updateTest, getSession } from '@/lib/data-store';
import type { Test, UserStep, AutoResult } from '@/lib/types';

// Update request body type
// - User can update: userResult, userRemarks, userSteps
// - Claude can update: autoResults (after running verifications)
interface TestUpdateRequest {
  userResult?: Test['userResult'];
  userRemarks?: string;
  userSteps?: UserStep[];
  autoResults?: AutoResult[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params;
    const session = await getSession(id);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const test = session.tests.find(t => t.id === testId);

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(test);
  } catch (error) {
    console.error('Failed to get test:', error);
    return NextResponse.json(
      { error: 'Failed to get test' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params;
    const body = await request.json() as TestUpdateRequest;

    // Allow updating user-editable fields and autoResults (for Claude)
    const updates: TestUpdateRequest = {};
    if (body.userResult !== undefined) updates.userResult = body.userResult;
    if (body.userRemarks !== undefined) updates.userRemarks = body.userRemarks;
    if (body.userSteps !== undefined) updates.userSteps = body.userSteps;
    if (body.autoResults !== undefined) updates.autoResults = body.autoResults;

    const test = await updateTest(id, testId, updates);

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(test);
  } catch (error) {
    console.error('Failed to update test:', error);
    return NextResponse.json(
      { error: 'Failed to update test' },
      { status: 500 }
    );
  }
}
