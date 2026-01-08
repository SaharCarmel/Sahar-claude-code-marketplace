import { promises as fs } from 'fs';
import path from 'path';
import type { TestSession, Test, UserStep, Evidence, TestSummary } from './types';

// Data directory from environment or default
const DATA_DIR = process.env.DATA_DIR || '/data';

const DIRS = {
  tests: path.join(DATA_DIR, 'tests'),
  feedback: path.join(DATA_DIR, 'feedback'),
  images: path.join(DATA_DIR, 'images'),
};

// Ensure directories exist
async function ensureDirs() {
  for (const dir of Object.values(DIRS)) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Initialize on module load
ensureDirs().catch(console.error);

// Session operations
export async function getSession(sessionId: string): Promise<TestSession | null> {
  try {
    const testPath = path.join(DIRS.tests, `${sessionId}.json`);
    const feedbackPath = path.join(DIRS.feedback, `${sessionId}.json`);

    // Read base test data
    const testData = await fs.readFile(testPath, 'utf-8');
    const session: TestSession = JSON.parse(testData);

    // Merge with feedback if exists
    try {
      const feedbackData = await fs.readFile(feedbackPath, 'utf-8');
      const feedback = JSON.parse(feedbackData);

      // Apply feedback to tests
      if (feedback.tests) {
        session.tests = session.tests.map(test => {
          const testFeedback = feedback.tests[test.id];
          if (testFeedback) {
            return { ...test, ...testFeedback };
          }
          return test;
        });
      }

      // Apply session-level feedback
      if (feedback.status) session.status = feedback.status;
      if (feedback.summary) session.summary = feedback.summary;
      if (feedback.submittedAt) session.submittedAt = feedback.submittedAt;
    } catch {
      // No feedback file yet, that's ok
    }

    return session;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

export async function getLatestSession(): Promise<TestSession | null> {
  try {
    const files = await fs.readdir(DIRS.tests);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    if (jsonFiles.length === 0) {
      return null;
    }

    // Sort by modification time, newest first
    const filesWithStats = await Promise.all(
      jsonFiles.map(async f => {
        const stat = await fs.stat(path.join(DIRS.tests, f));
        return { file: f, mtime: stat.mtime };
      })
    );

    filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    const latestFile = filesWithStats[0].file;
    const sessionId = latestFile.replace('.json', '');

    return getSession(sessionId);
  } catch {
    return null;
  }
}

export async function listSessions(): Promise<TestSession[]> {
  try {
    const files = await fs.readdir(DIRS.tests);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const sessions = await Promise.all(
      jsonFiles.map(async f => {
        const sessionId = f.replace('.json', '');
        return getSession(sessionId);
      })
    );

    return sessions.filter((s): s is TestSession => s !== null);
  } catch {
    return [];
  }
}

export async function createSession(session: TestSession): Promise<TestSession> {
  await ensureDirs();

  const testPath = path.join(DIRS.tests, `${session.id}.json`);
  await fs.writeFile(testPath, JSON.stringify(session, null, 2));

  return session;
}

// Update a test's user result (pass/fail/skip and remarks) or auto results
export async function updateTest(
  sessionId: string,
  testId: string,
  updates: {
    userResult?: Test['userResult'];
    userRemarks?: string;
    userSteps?: UserStep[];
    autoResults?: Test['autoResults'];
  }
): Promise<Test | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  const testIndex = session.tests.findIndex(t => t.id === testId);
  if (testIndex === -1) return null;

  // Update the test
  const updatedTest = {
    ...session.tests[testIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Save to feedback file
  await saveFeedback(sessionId, {
    tests: { [testId]: updatedTest },
  });

  return updatedTest;
}

// Mark a user step as completed
export async function updateUserStep(
  sessionId: string,
  testId: string,
  stepId: string,
  completed: boolean
): Promise<UserStep | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  const test = session.tests.find(t => t.id === testId);
  if (!test) return null;

  const stepIndex = test.userSteps.findIndex(s => s.id === stepId);
  if (stepIndex === -1) return null;

  // Update the step
  const updatedSteps = [...test.userSteps];
  updatedSteps[stepIndex] = {
    ...updatedSteps[stepIndex],
    completed,
  };

  // Save to feedback file
  await saveFeedback(sessionId, {
    tests: {
      [testId]: {
        userSteps: updatedSteps,
        updatedAt: new Date().toISOString(),
      },
    },
  });

  return updatedSteps[stepIndex];
}

// Add evidence (screenshot, observation) to a test
export async function addEvidence(
  sessionId: string,
  testId: string,
  evidence: Evidence
): Promise<Evidence> {
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const test = session.tests.find(t => t.id === testId);
  if (!test) throw new Error('Test not found');

  const updatedEvidence = [...test.userEvidence, evidence];

  // Save to feedback file
  await saveFeedback(sessionId, {
    tests: {
      [testId]: {
        userEvidence: updatedEvidence,
        updatedAt: new Date().toISOString(),
      },
    },
  });

  return evidence;
}

// Submit session - calculates manual test summary
// Note: Auto verification results are added separately by Claude
export async function submitSession(sessionId: string): Promise<TestSession | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  // Calculate manual testing summary
  const summary: TestSummary = {
    // Manual testing by user
    manualTotal: session.tests.length,
    manualPassed: session.tests.filter(t => t.userResult === 'passed').length,
    manualFailed: session.tests.filter(t => t.userResult === 'failed').length,
    manualSkipped: session.tests.filter(t => t.userResult === 'skipped').length,

    // Auto verification - to be filled in by Claude after running verifications
    autoTotal: session.tests.reduce((sum, t) => sum + t.autoVerifications.length, 0),
    autoPassed: 0,
    autoFailed: 0,
    autoErrors: 0,
  };

  const submittedAt = new Date().toISOString();

  // Save to feedback file
  await saveFeedback(sessionId, {
    status: 'submitted',
    summary,
    submittedAt,
  });

  return {
    ...session,
    status: 'submitted',
    summary,
    submittedAt,
  };
}

// Save auto verification results (called by Claude after running verifications)
export async function saveAutoResults(
  sessionId: string,
  testId: string,
  autoResults: Test['autoResults']
): Promise<void> {
  await saveFeedback(sessionId, {
    tests: {
      [testId]: {
        autoResults,
        updatedAt: new Date().toISOString(),
      },
    },
  });
}

// Update session summary with auto verification results
export async function updateSessionSummary(
  sessionId: string,
  autoSummary: { passed: number; failed: number; errors: number }
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session || !session.summary) return;

  const updatedSummary: TestSummary = {
    ...session.summary,
    autoPassed: autoSummary.passed,
    autoFailed: autoSummary.failed,
    autoErrors: autoSummary.errors,
  };

  await saveFeedback(sessionId, {
    summary: updatedSummary,
  });
}

async function saveFeedback(sessionId: string, updates: Record<string, unknown>): Promise<void> {
  await ensureDirs();

  const feedbackPath = path.join(DIRS.feedback, `${sessionId}.json`);

  // Load existing feedback
  let feedback: Record<string, unknown> = {};
  try {
    const data = await fs.readFile(feedbackPath, 'utf-8');
    feedback = JSON.parse(data);
  } catch {
    // No existing feedback
  }

  // Deep merge tests
  if (updates.tests && feedback.tests) {
    updates.tests = {
      ...(feedback.tests as Record<string, unknown>),
      ...(updates.tests as Record<string, unknown>),
    };
  }

  // Merge and save
  feedback = { ...feedback, ...updates, updatedAt: new Date().toISOString() };
  await fs.writeFile(feedbackPath, JSON.stringify(feedback, null, 2));
}

// Image storage
export async function saveImage(
  sessionId: string,
  filename: string,
  data: Buffer
): Promise<string> {
  await ensureDirs();

  const sessionDir = path.join(DIRS.images, sessionId);
  await fs.mkdir(sessionDir, { recursive: true });

  const imagePath = path.join(sessionDir, filename);
  await fs.writeFile(imagePath, data);

  return imagePath;
}

export async function getImagePath(sessionId: string, filename: string): Promise<string> {
  return path.join(DIRS.images, sessionId, filename);
}
