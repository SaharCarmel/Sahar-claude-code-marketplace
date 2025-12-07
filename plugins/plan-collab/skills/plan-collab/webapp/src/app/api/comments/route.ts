import { NextRequest, NextResponse } from 'next/server';
import {
  getCommentsByPlan,
  getCommentsByVersion,
  createComment,
  updateCommentStatus
} from '@/lib/db';

// GET /api/comments - Get comments for a plan/version
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const versionId = searchParams.get('versionId');

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      );
    }

    let comments;
    if (versionId) {
      comments = getCommentsByVersion(versionId);
    } else {
      comments = getCommentsByPlan(planId);
    }

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/comments - Add new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      planId,
      versionId,
      anchorText,
      anchorPrefix,
      anchorSuffix,
      anchorPath,
      startOffset,
      endOffset,
      content
    } = body;

    if (!planId || !versionId || !anchorText || !content) {
      return NextResponse.json(
        { error: 'planId, versionId, anchorText, and content are required' },
        { status: 400 }
      );
    }

    const comment = createComment({
      planId,
      versionId,
      anchorText,
      anchorPrefix,
      anchorSuffix,
      anchorPath,
      startOffset,
      endOffset,
      content
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// PATCH /api/comments - Update comment status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, status } = body;

    if (!commentId || !status) {
      return NextResponse.json(
        { error: 'commentId and status are required' },
        { status: 400 }
      );
    }

    if (!['OPEN', 'RESOLVED'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be OPEN or RESOLVED' },
        { status: 400 }
      );
    }

    updateCommentStatus(commentId, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}
