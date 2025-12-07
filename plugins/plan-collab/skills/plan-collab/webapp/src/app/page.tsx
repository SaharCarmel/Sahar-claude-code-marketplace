'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlanViewer } from '@/components/plan/PlanViewer';
import { QuestionsPanel } from '@/components/questions/QuestionsPanel';
import { Button } from '@/components/ui/button';
import type { Plan, PlanVersion, Comment, Question } from '@/types';

function PlanCollabApp() {
  const searchParams = useSearchParams();
  const planPath = searchParams.get('plan');

  const [plan, setPlan] = useState<Plan | null>(null);
  const [version, setVersion] = useState<PlanVersion | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Check system preference for dark mode
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);

    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      setDarkMode(stored === 'true');
    }
  }, []);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  // Fetch plan data
  const fetchPlanData = useCallback(async () => {
    if (!planPath) {
      setLoading(false);
      return;
    }

    try {
      // Register/sync the plan
      const syncRes = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planPath })
      });

      if (!syncRes.ok) {
        throw new Error('Failed to sync plan');
      }

      const { plan: syncedPlan } = await syncRes.json();
      setPlan(syncedPlan);

      const planId = syncedPlan.id;

      // Get latest version with content
      const versionRes = await fetch(`/api/plans/${planId}/versions?latest=true`);
      if (versionRes.ok) {
        const { version: latestVersion } = await versionRes.json();
        setVersion(latestVersion);
      }

      // Get comments
      const commentsRes = await fetch(`/api/comments?planId=${planId}`);
      if (commentsRes.ok) {
        const { comments: fetchedComments } = await commentsRes.json();
        setComments(fetchedComments);
      }

      // Get questions
      const questionsRes = await fetch(`/api/questions?planId=${planId}`);
      if (questionsRes.ok) {
        const { questions: fetchedQuestions } = await questionsRes.json();
        setQuestions(fetchedQuestions);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to load plan');
      setLoading(false);
    }
  }, [planPath]);

  useEffect(() => {
    fetchPlanData();
  }, [fetchPlanData]);

  // Poll for updates
  useEffect(() => {
    if (!planPath) return;

    const interval = setInterval(() => {
      fetchPlanData();
    }, 5000);

    return () => clearInterval(interval);
  }, [planPath, fetchPlanData]);

  const handleAddComment = async (data: {
    anchorText: string;
    anchorPrefix: string;
    anchorSuffix: string;
    startOffset: number;
    endOffset: number;
    content: string;
  }) => {
    if (!plan || !version) return;

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plan.id,
        versionId: version.id,
        ...data
      })
    });

    if (res.ok) {
      const { comment } = await res.json();
      setComments((prev) => [...prev, comment]);
    }
  };

  const handleResolveComment = async (commentId: string) => {
    const res = await fetch('/api/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, status: 'RESOLVED' })
    });

    if (res.ok) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, status: 'RESOLVED' as const } : c
        )
      );
    }
  };

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    const res = await fetch('/api/questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, answer })
    });

    if (res.ok) {
      const { question } = await res.json();
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? question : q))
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <svg
            className="w-12 h-12 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-lg font-semibold mb-2">Error Loading Plan</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!planPath) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 text-muted-foreground mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h1 className="text-2xl font-bold mb-2">Plan-Collab</h1>
          <p className="text-muted-foreground mb-6">
            No plan loaded. Use the CLI to open a plan:
          </p>
          <code className="bg-muted px-4 py-2 rounded block text-sm">
            node cli.js open-plan ~/.claude/plans/my-plan.md
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Plan-Collab</h1>
            {plan && <span className="text-muted-foreground">{plan.name}</span>}
          </div>
          <div className="flex items-center gap-2">
            <QuestionsPanel
              questions={questions}
              onAnswer={handleAnswerQuestion}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Plan Viewer or loading state */}
      <main>
        {version ? (
          <PlanViewer
            planId={plan!.id}
            version={version}
            comments={comments}
            onAddComment={handleAddComment}
            onResolveComment={handleResolveComment}
          />
        ) : (
          <div className="container mx-auto p-6 text-center text-muted-foreground">
            Loading plan content...
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PlanCollabApp />
    </Suspense>
  );
}
