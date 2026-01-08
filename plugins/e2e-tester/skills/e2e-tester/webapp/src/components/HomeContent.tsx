'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TestList } from '@/components/TestList';
import { TestProgress } from '@/components/TestProgress';
import { Dashboard } from '@/components/Dashboard';
import type { TestSession, TestStatus, UserStep } from '@/lib/types';

export function HomeContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip loading if no session ID (dashboard mode)
    if (!sessionId) {
      setLoading(false);
      return;
    }

    async function loadSession() {
      try {
        setLoading(true);

        // Load the specified session
        const response = await fetch(`/api/sessions/${sessionId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('No test session found. Generate tests first using the CLI.');
            return;
          }
          throw new Error('Failed to load session');
        }

        const data = await response.json();
        setSession(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

  // Subscribe to SSE for real-time updates
  useEffect(() => {
    if (!session) return;

    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'session:updated' && data.sessionId === session.id) {
          setSession(data.session);
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
    };

    return () => {
      eventSource.close();
    };
  }, [session?.id]);

  const handleTestUpdate = useCallback(async (testId: string, updates: { userResult?: TestStatus; userRemarks?: string; userSteps?: UserStep[] }) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/sessions/${session.id}/tests/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update test');
      }

      const updatedTest = await response.json();

      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tests: prev.tests.map(t => t.id === testId ? updatedTest : t),
        };
      });
    } catch (err) {
      console.error('Failed to update test:', err);
    }
  }, [session]);

  const handleSubmit = useCallback(async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/sessions/${session.id}/submit`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to submit session');
      }

      const updatedSession = await response.json();
      setSession(updatedSession);
    } catch (err) {
      console.error('Failed to submit session:', err);
    }
  }, [session]);

  // If no session ID, show the dashboard
  if (!sessionId) {
    return <Dashboard />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading test session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">E2E</div>
          <h1 className="text-2xl font-bold mb-2">No Tests Found</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Run <code className="bg-muted px-2 py-1 rounded">node cli.js generate-tests</code> to create tests.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Ensure tests array exists
  const tests = session.tests || [];

  // Use userResult for counting (new field name)
  const completedCount = tests.filter(t => t.userResult !== 'pending').length;
  const passedCount = tests.filter(t => t.userResult === 'passed').length;
  const failedCount = tests.filter(t => t.userResult === 'failed').length;

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header with back link */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-2">E2E Testing</h1>
        <p className="text-muted-foreground">{session.feature}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Session: {session.id}
        </p>
      </div>

      {/* Info box about the workflow */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Your job:</strong> Complete the manual steps below (navigate, click, observe).
          <br />
          <strong>Claude{"'"}s job:</strong> After you submit, Claude will run automated database, API, and log checks.
        </p>
      </div>

      {/* Progress */}
      <TestProgress
        total={tests.length}
        completed={completedCount}
        passed={passedCount}
        failed={failedCount}
      />

      {/* Test List */}
      <TestList
        tests={tests}
        sessionId={session.id}
        onTestUpdate={handleTestUpdate}
      />

      {/* Submit Button */}
      {session.status === 'active' && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={completedCount < tests.length}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {completedCount < tests.length
              ? `Complete all tests to submit (${completedCount}/${tests.length})`
              : 'Submit Results'}
          </button>
        </div>
      )}

      {/* Submitted State */}
      {session.status === 'submitted' && (
        <div className="mt-8 p-6 bg-muted rounded-lg text-center">
          <div className="text-4xl mb-2">Submitted</div>
          <h2 className="text-xl font-bold mb-2">Results Submitted</h2>
          <p className="text-muted-foreground mb-4">
            Claude will now run automated verification checks and analyze the results.
          </p>
          {session.summary && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Manual Testing (your results)</div>
              <div className="flex justify-center gap-4 text-sm">
                <span className="text-green-600">{session.summary.manualPassed} passed</span>
                <span className="text-red-600">{session.summary.manualFailed} failed</span>
                <span className="text-yellow-600">{session.summary.manualSkipped} skipped</span>
              </div>
              {session.summary.autoTotal > 0 && (
                <>
                  <div className="text-sm font-medium mt-4">Automated Checks (Claude{"'"}s results)</div>
                  <div className="flex justify-center gap-4 text-sm">
                    <span className="text-green-600">{session.summary.autoPassed} passed</span>
                    <span className="text-red-600">{session.summary.autoFailed} failed</span>
                    {session.summary.autoErrors > 0 && (
                      <span className="text-orange-600">{session.summary.autoErrors} errors</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
