import { NextRequest, NextResponse } from 'next/server';
import {
  getQuestionsByPlan,
  getPendingQuestions,
  createQuestion,
  answerQuestion
} from '@/lib/db';

// GET /api/questions - Get questions for a plan
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const pendingOnly = searchParams.get('pending') === 'true';

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      );
    }

    let questions;
    if (pendingOnly) {
      questions = getPendingQuestions(planId);
    } else {
      questions = getQuestionsByPlan(planId);
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST /api/questions - Add new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, questionText, context, lineNumber, sectionPath } = body;

    if (!planId || !questionText) {
      return NextResponse.json(
        { error: 'planId and questionText are required' },
        { status: 400 }
      );
    }

    const question = createQuestion({
      planId,
      questionText,
      context,
      lineNumber,
      sectionPath
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

// PATCH /api/questions - Answer a question
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, answer } = body;

    if (!questionId || !answer) {
      return NextResponse.json(
        { error: 'questionId and answer are required' },
        { status: 400 }
      );
    }

    const question = answerQuestion(questionId, answer);

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error answering question:', error);
    return NextResponse.json(
      { error: 'Failed to answer question' },
      { status: 500 }
    );
  }
}
