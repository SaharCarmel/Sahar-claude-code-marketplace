import { NextRequest, NextResponse } from 'next/server';
import { updateUserStep } from '@/lib/data-store';

// User steps only have one updatable field: completed
interface UserStepUpdateRequest {
  completed: boolean;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string; stepId: string }> }
) {
  try {
    const { id, testId, stepId } = await params;
    const body = await request.json() as UserStepUpdateRequest;

    if (typeof body.completed !== 'boolean') {
      return NextResponse.json(
        { error: 'completed field must be a boolean' },
        { status: 400 }
      );
    }

    const step = await updateUserStep(id, testId, stepId, body.completed);

    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(step);
  } catch (error) {
    console.error('Failed to update step:', error);
    return NextResponse.json(
      { error: 'Failed to update step' },
      { status: 500 }
    );
  }
}
