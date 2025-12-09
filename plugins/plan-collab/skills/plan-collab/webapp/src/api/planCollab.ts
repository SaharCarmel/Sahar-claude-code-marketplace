/**
 * Plan Collab API Client
 */

export interface Plan {
  id: string;
  path: string;
  sessionId?: string;
  name: string;
  title: string;
  content: string;
  comments: PlanComment[];
  questions: PlanQuestion[];
  answers: PlanAnswer[];
}

export interface PlanComment {
  id: string;
  selectedText: string;
  content: string;
  anchorPrefix: string;
  anchorSuffix: string;
  timestamp: string;
  status: 'OPEN' | 'RESOLVED';
  acknowledged: boolean;
  resolvedAt?: string;
}

export interface PlanQuestion {
  id: string;
  questionText: string;
  context?: string;
  timestamp: string;
  status: 'PENDING' | 'ANSWERED';
  answeredAt?: string;
}

export interface PlanAnswer {
  id: string;
  questionId: string;
  question: string;
  answer: string;
  timestamp: string;
  acknowledged: boolean;
}

// New types for queue system
export interface PlanSummary {
  id: string;
  path: string;
  sessionId: string;
  title: string;
  name: string;
  pushedAt: string;
  updatedAt: string;
  isOwn: boolean;
  stats: {
    openComments: number;
    pendingQuestions: number;
    pendingAnswers: number;
  };
}

export interface SSEEvent {
  type: 'connected' | 'plan:added' | 'plan:updated' | 'plan:removed' | 'comment:added' | 'comment:updated' | 'question:answered';
  plan?: Partial<Plan> & { contentChanged?: boolean };
  planId?: string;
  comment?: PlanComment;
  answer?: PlanAnswer;
  question?: PlanQuestion;
}

const API_BASE = '/api';

// ============ Queue API Functions ============

export async function getPlans(sessionId?: string): Promise<PlanSummary[]> {
  const url = sessionId
    ? `${API_BASE}/plans?sessionId=${encodeURIComponent(sessionId)}`
    : `${API_BASE}/plans`;
  const res = await fetch(url);
  const data = await res.json();
  return data.plans;
}

export async function getPlanById(id: string): Promise<Plan> {
  const res = await fetch(`${API_BASE}/plans/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to get plan');
  }
  return data.plan;
}

export async function removePlan(id: string, sessionId?: string): Promise<void> {
  const url = sessionId
    ? `${API_BASE}/plans/${id}?sessionId=${encodeURIComponent(sessionId)}`
    : `${API_BASE}/plans/${id}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to remove plan');
  }
}

export async function addCommentToPlan(planId: string, data: {
  selectedText: string;
  content: string;
  anchorPrefix?: string;
  anchorSuffix?: string;
}): Promise<PlanComment> {
  const res = await fetch(`${API_BASE}/plans/${planId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || 'Failed to add comment');
  }
  return result.comment;
}

export async function resolveCommentForPlan(planId: string, commentId: string): Promise<PlanComment> {
  const res = await fetch(`${API_BASE}/plans/${planId}/comments/${commentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'RESOLVED' }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to resolve comment');
  }
  return data.comment;
}

export async function answerQuestionForPlan(
  planId: string,
  questionId: string,
  answer: string
): Promise<{ answer: PlanAnswer; question: PlanQuestion }> {
  const res = await fetch(`${API_BASE}/plans/${planId}/questions/${questionId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to answer question');
  }
  return data;
}

// SSE subscription helper
export function subscribeToEvents(onEvent: (event: SSEEvent) => void): () => void {
  const eventSource = new EventSource(`${API_BASE}/events`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);
    } catch (err) {
      console.error('Failed to parse SSE event:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.error('SSE connection error:', err);
    // EventSource will auto-reconnect
  };

  return () => eventSource.close();
}

// ============ Legacy API Functions (Backward Compatibility) ============

export async function getPlan(): Promise<Plan | null> {
  const res = await fetch(`${API_BASE}/plan`);
  const data = await res.json();
  return data.plan;
}

export async function setPlan(planPath: string): Promise<Plan> {
  const res = await fetch(`${API_BASE}/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planPath }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to set plan');
  }
  return data.plan;
}

export async function getComments(): Promise<PlanComment[]> {
  const res = await fetch(`${API_BASE}/comments`);
  const data = await res.json();
  return data.comments;
}

export async function addComment(data: {
  selectedText: string;
  content: string;
  anchorPrefix?: string;
  anchorSuffix?: string;
}): Promise<PlanComment> {
  const res = await fetch(`${API_BASE}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  return result.comment;
}

export async function resolveComment(id: string): Promise<PlanComment> {
  const res = await fetch(`${API_BASE}/comments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'RESOLVED' }),
  });
  const data = await res.json();
  return data.comment;
}

export async function getQuestions(): Promise<PlanQuestion[]> {
  const res = await fetch(`${API_BASE}/questions`);
  const data = await res.json();
  return data.questions;
}

export async function answerQuestion(id: string, answer: string): Promise<{ answer: PlanAnswer; question: PlanQuestion }> {
  const res = await fetch(`${API_BASE}/questions/${id}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  return res.json();
}

export async function checkHealth(): Promise<{ status: string; activePlan: string | null; queueSize: number; sseClients: number }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
