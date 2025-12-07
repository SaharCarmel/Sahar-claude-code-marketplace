import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import {
  getPlan,
  getLatestVersion,
  getCommentsByPlan,
  getQuestionsByPlan
} from '@/lib/db';
import type { Comment, Question } from '@/types';

// GET /api/feedback - Get feedback for Claude to consume
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planPath = searchParams.get('plan');

    if (!planPath) {
      return NextResponse.json(
        { error: 'plan parameter is required' },
        { status: 400 }
      );
    }

    // Resolve path
    let absolutePath = planPath;
    if (planPath.startsWith('~')) {
      absolutePath = planPath.replace('~', process.env.HOME || '');
    }
    absolutePath = path.resolve(absolutePath);

    const plan = getPlan(absolutePath) as { id: string; current_version: number; name: string } | undefined;

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const latestVersion = getLatestVersion(plan.id);
    const comments = getCommentsByPlan(plan.id) as Comment[];
    const questions = getQuestionsByPlan(plan.id) as Question[];

    // Format feedback for Claude consumption
    const feedback = {
      planName: plan.name,
      planPath: absolutePath,
      version: plan.current_version,
      timestamp: new Date().toISOString(),
      comments: comments
        .filter((c) => c.status === 'OPEN')
        .map((c) => ({
          id: c.id,
          selectedText: c.anchor_text,
          context: {
            before: c.anchor_prefix,
            after: c.anchor_suffix,
            section: c.anchor_path
          },
          comment: c.content,
          status: c.status,
          createdAt: c.created_at
        })),
      answeredQuestions: questions
        .filter((q) => q.status === 'ANSWERED')
        .map((q) => ({
          id: q.id,
          question: q.question_text,
          answer: q.answer,
          context: q.context,
          section: q.section_path,
          answeredAt: q.answered_at
        })),
      pendingQuestions: questions
        .filter((q) => q.status === 'PENDING')
        .map((q) => ({
          id: q.id,
          question: q.question_text,
          context: q.context,
          section: q.section_path
        })),
      summary: {
        totalComments: comments.length,
        openComments: comments.filter((c) => c.status === 'OPEN').length,
        resolvedComments: comments.filter((c) => c.status === 'RESOLVED').length,
        totalQuestions: questions.length,
        answeredQuestions: questions.filter((q) => q.status === 'ANSWERED').length,
        pendingQuestions: questions.filter((q) => q.status === 'PENDING').length
      }
    };

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
