/**
 * Plan Collab API Client
 */

export interface Plan {
  id: string;
  path: string;
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

const API_BASE = '/api';

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

export async function checkHealth(): Promise<{ status: string; activePlan: string | null }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
