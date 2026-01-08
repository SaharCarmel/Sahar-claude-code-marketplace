import { getConfig } from './config-store.js';

async function getBaseUrl() {
  const config = await getConfig();
  return `http://localhost:${config.port}`;
}

// Health check
export async function checkHealth() {
  const baseUrl = await getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    if (!response.ok) {
      return { healthy: false, error: `Status ${response.status}` };
    }
    const data = await response.json();
    return { healthy: true, ...data };
  } catch (err) {
    return { healthy: false, error: err.message };
  }
}

// Session operations
export async function createSession(sessionData) {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create session');
  }

  return response.json();
}

export async function getSession(sessionId) {
  const baseUrl = await getBaseUrl();
  // Support 'latest' as a special session ID
  const url = sessionId === 'latest'
    ? `${baseUrl}/api/sessions/latest`
    : `${baseUrl}/api/sessions/${sessionId}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to get session');
  }

  return response.json();
}

export async function getLatestSession() {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/sessions/latest`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to get latest session');
  }

  return response.json();
}

export async function listSessions() {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/sessions`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list sessions');
  }

  return response.json();
}

// Test operations
export async function updateTest(sessionId, testId, updates) {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/sessions/${sessionId}/tests/${testId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update test');
  }

  return response.json();
}

// Submit session
export async function submitSession(sessionId) {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/sessions/${sessionId}/submit`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit session');
  }

  return response.json();
}

// Get results (for submitted sessions)
export async function getResults(sessionId) {
  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }

  // Format results - using new field names (userResult, userRemarks, userEvidence)
  const failures = session.tests
    .filter(t => t.userResult === 'failed')
    .map(t => ({
      testId: t.id,
      title: t.title,
      description: t.description,
      userResult: t.userResult,
      userRemarks: t.userRemarks,
      userEvidence: t.userEvidence,
      autoResults: t.autoResults || [],
      category: t.category,
      priority: t.priority,
    }));

  // Also include tests where auto verification failed
  const autoFailures = session.tests
    .filter(t => t.userResult !== 'failed' && t.autoResults?.some(r => r.status === 'failed'))
    .map(t => ({
      testId: t.id,
      title: t.title,
      description: t.description,
      userResult: t.userResult,
      userRemarks: t.userRemarks,
      userEvidence: t.userEvidence,
      autoResults: t.autoResults || [],
      category: t.category,
      priority: t.priority,
    }));

  return {
    sessionId: session.id,
    feature: session.feature,
    status: session.status,
    summary: session.summary || {
      manualTotal: session.tests.length,
      manualPassed: session.tests.filter(t => t.userResult === 'passed').length,
      manualFailed: session.tests.filter(t => t.userResult === 'failed').length,
      manualSkipped: session.tests.filter(t => t.userResult === 'skipped').length,
      autoTotal: session.tests.reduce((sum, t) => sum + t.autoVerifications.length, 0),
      autoPassed: 0,
      autoFailed: 0,
      autoErrors: 0,
    },
    failures: [...failures, ...autoFailures],
    manualPassed: session.tests.filter(t => t.userResult === 'passed').map(t => t.id),
    manualFailed: session.tests.filter(t => t.userResult === 'failed').map(t => t.id),
    manualSkipped: session.tests.filter(t => t.userResult === 'skipped').map(t => t.id),
    autoPassed: session.tests
      .filter(t => t.autoResults?.every(r => r.status === 'passed'))
      .map(t => t.id),
    autoFailed: session.tests
      .filter(t => t.autoResults?.some(r => r.status === 'failed'))
      .map(t => t.id),
    submittedAt: session.submittedAt,
  };
}

// Save auto verification results for a test
export async function saveAutoResults(sessionId, testId, autoResults) {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/sessions/${sessionId}/tests/${testId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autoResults }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save auto results');
  }

  return response.json();
}

// Update session summary with auto verification totals
export async function updateSessionSummary(sessionId, autoSummary) {
  // Get current session
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // For now, we update via the test endpoint (data-store handles merging)
  // A dedicated endpoint would be cleaner but this works
  const baseUrl = await getBaseUrl();

  // The data-store.updateSessionSummary is called internally when we get results
  // For the CLI, we just return success - the webapp will recalculate
  return {
    success: true,
    summary: {
      ...session.summary,
      autoPassed: autoSummary.passed,
      autoFailed: autoSummary.failed,
      autoErrors: autoSummary.errors,
    },
  };
}
