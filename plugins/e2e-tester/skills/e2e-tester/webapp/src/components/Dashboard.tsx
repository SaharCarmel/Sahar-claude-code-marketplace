'use client';

import { useEffect, useState } from 'react';
import { DashboardSessionCard } from './DashboardSessionCard';
import type { TestSession } from '@/lib/types';

export function Dashboard() {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const data = await response.json();

      // Filter to only show active sessions with pending tests
      const activeSessions = data.filter((s: TestSession) =>
        s.status === 'active' &&
        s.tests.some(t => t.userResult === 'pending')
      );

      // Sort by creation date (newest first)
      activeSessions.sort((a: TestSession, b: TestSession) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setSessions(activeSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Subscribe to SSE for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'session:updated' || data.type === 'session:created') {
          // Reload sessions when any session changes
          loadSessions();
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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading test sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">E2E</div>
          <h1 className="text-2xl font-bold mb-2">Error Loading Sessions</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate total pending tests across all sessions
  const totalPending = sessions.reduce(
    (sum, s) => sum + s.tests.filter(t => t.userResult === 'pending').length,
    0
  );

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">E2E Testing Dashboard</h1>
        <p className="text-muted-foreground">
          {sessions.length === 0
            ? 'No active test sessions'
            : `${sessions.length} active session${sessions.length !== 1 ? 's' : ''} with ${totalPending} pending test${totalPending !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Info box */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Multi-agent testing:</strong> All active test sessions from different agents are shown here.
          Click a session to view and complete its tests.
        </p>
      </div>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-50">E2E</div>
          <h2 className="text-xl font-bold mb-2">No Pending Tests</h2>
          <p className="text-muted-foreground mb-4">
            All test sessions have been completed or no sessions exist yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Run <code className="bg-muted px-2 py-1 rounded">node cli.js generate-tests</code> to create tests.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <DashboardSessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </main>
  );
}
