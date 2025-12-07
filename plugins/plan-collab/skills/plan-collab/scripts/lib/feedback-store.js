/**
 * Feedback file management
 * Stores feedback alongside plan files as <plan-name>.feedback.json
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Get feedback file path for a plan
 */
export function getFeedbackPath(planPath) {
  const dir = path.dirname(planPath);
  const base = path.basename(planPath, path.extname(planPath));
  return path.join(dir, `${base}.feedback.json`);
}

/**
 * Create empty feedback structure
 */
export function createEmptyFeedback(planPath) {
  return {
    planPath,
    planName: path.basename(planPath, '.md'),
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: [],
    questions: [],
    answers: []
  };
}

/**
 * Load feedback from disk
 */
export async function loadFeedback(planPath) {
  const feedbackPath = getFeedbackPath(planPath);
  try {
    const data = await fs.readFile(feedbackPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return createEmptyFeedback(planPath);
  }
}

/**
 * Save feedback to disk
 */
export async function saveFeedback(planPath, feedback) {
  const feedbackPath = getFeedbackPath(planPath);
  feedback.updatedAt = new Date().toISOString();
  await fs.writeFile(feedbackPath, JSON.stringify(feedback, null, 2));
}

/**
 * Add a comment to feedback
 */
export async function addComment(planPath, comment) {
  const feedback = await loadFeedback(planPath);

  const newComment = {
    id: `c_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    selectedText: comment.selectedText,
    content: comment.content,
    anchorPrefix: comment.anchorPrefix || '',
    anchorSuffix: comment.anchorSuffix || '',
    lineNumber: comment.lineNumber || null,
    timestamp: new Date().toISOString(),
    status: 'OPEN',
    acknowledged: false,
    acknowledgedAt: null
  };

  feedback.comments.push(newComment);
  await saveFeedback(planPath, feedback);
  return newComment;
}

/**
 * Add an answer to a question
 */
export async function addAnswer(planPath, questionId, answer) {
  const feedback = await loadFeedback(planPath);

  const question = feedback.questions.find((q) => q.id === questionId);
  if (!question) {
    throw new Error(`Question not found: ${questionId}`);
  }

  const newAnswer = {
    id: `a_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    questionId,
    question: question.questionText,
    answer,
    timestamp: new Date().toISOString(),
    acknowledged: false,
    acknowledgedAt: null
  };

  feedback.answers.push(newAnswer);
  question.status = 'ANSWERED';
  question.answeredAt = new Date().toISOString();

  await saveFeedback(planPath, feedback);
  return newAnswer;
}

/**
 * Resolve a comment
 */
export async function resolveComment(planPath, commentId) {
  const feedback = await loadFeedback(planPath);

  const comment = feedback.comments.find((c) => c.id === commentId);
  if (!comment) {
    throw new Error(`Comment not found: ${commentId}`);
  }

  comment.status = 'RESOLVED';
  comment.resolvedAt = new Date().toISOString();

  await saveFeedback(planPath, feedback);
  return comment;
}

/**
 * Acknowledge a comment (Claude has seen it)
 */
export async function acknowledgeComment(planPath, commentId) {
  const feedback = await loadFeedback(planPath);

  const comment = feedback.comments.find((c) => c.id === commentId);
  if (comment) {
    comment.acknowledged = true;
    comment.acknowledgedAt = new Date().toISOString();
    await saveFeedback(planPath, feedback);
  }
  return comment;
}

/**
 * Acknowledge an answer (Claude has seen it)
 */
export async function acknowledgeAnswer(planPath, answerId) {
  const feedback = await loadFeedback(planPath);

  const answer = feedback.answers.find((a) => a.id === answerId);
  if (answer) {
    answer.acknowledged = true;
    answer.acknowledgedAt = new Date().toISOString();
    await saveFeedback(planPath, feedback);
  }
  return answer;
}

/**
 * Get pending feedback (not yet acknowledged by Claude)
 */
export async function getPendingFeedback(planPath) {
  const feedback = await loadFeedback(planPath);

  return {
    planPath,
    planName: feedback.planName,
    version: feedback.version,
    pending: {
      comments: feedback.comments.filter((c) => !c.acknowledged && c.status === 'OPEN'),
      answers: feedback.answers.filter((a) => !a.acknowledged)
    },
    summary: {
      totalComments: feedback.comments.length,
      openComments: feedback.comments.filter((c) => c.status === 'OPEN').length,
      pendingComments: feedback.comments.filter((c) => !c.acknowledged && c.status === 'OPEN').length,
      totalAnswers: feedback.answers.length,
      pendingAnswers: feedback.answers.filter((a) => !a.acknowledged).length
    }
  };
}

/**
 * Acknowledge all pending feedback
 */
export async function acknowledgeAllPending(planPath) {
  const feedback = await loadFeedback(planPath);
  const now = new Date().toISOString();

  let acknowledged = 0;

  for (const comment of feedback.comments) {
    if (!comment.acknowledged) {
      comment.acknowledged = true;
      comment.acknowledgedAt = now;
      acknowledged++;
    }
  }

  for (const answer of feedback.answers) {
    if (!answer.acknowledged) {
      answer.acknowledged = true;
      answer.acknowledgedAt = now;
      acknowledged++;
    }
  }

  await saveFeedback(planPath, feedback);
  return { acknowledged };
}
