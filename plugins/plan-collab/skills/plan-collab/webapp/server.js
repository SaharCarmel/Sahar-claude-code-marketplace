/**
 * Plan Collab API Server
 * Serves API routes for the webapp with queue support for multiple plans
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.API_PORT || 3456;

app.use(cors());
app.use(express.json());

// ============ Queue Storage ============

// Plan queue - Map<planId, PlanEntry>
const planQueue = new Map();

// Session to plans mapping - Map<sessionId, Set<planId>>
const sessionPlans = new Map();

// SSE clients for real-time updates
const sseClients = new Set();

// Persistence path
const QUEUE_PERSISTENCE_PATH = path.join(os.homedir(), '.plan-collab', 'queue.json');

// ============ Helper Functions ============

function getFeedbackPath(planPath) {
  const dir = path.dirname(planPath);
  const base = path.basename(planPath, path.extname(planPath));
  return path.join(dir, `${base}.feedback.json`);
}

async function loadFeedback(planPath) {
  const feedbackPath = getFeedbackPath(planPath);
  try {
    const data = await fs.readFile(feedbackPath, 'utf-8');
    return JSON.parse(data);
  } catch {
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
}

async function saveFeedback(planPath, feedback) {
  const feedbackPath = getFeedbackPath(planPath);
  feedback.updatedAt = new Date().toISOString();
  await fs.writeFile(feedbackPath, JSON.stringify(feedback, null, 2));
}

function generatePlanId(planPath) {
  return crypto.createHash('md5').update(planPath).digest('hex');
}

function generateContentHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

// Broadcast to all SSE clients
function broadcastSSE(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(message);
  }
}

// Persist queue to disk
async function persistQueue() {
  try {
    const plans = Array.from(planQueue.values());
    await fs.mkdir(path.dirname(QUEUE_PERSISTENCE_PATH), { recursive: true });
    await fs.writeFile(QUEUE_PERSISTENCE_PATH, JSON.stringify({ plans }, null, 2));
  } catch (err) {
    console.error('Failed to persist queue:', err.message);
  }
}

// Load queue from disk on startup
async function loadPersistedQueue() {
  try {
    const data = await fs.readFile(QUEUE_PERSISTENCE_PATH, 'utf-8');
    const saved = JSON.parse(data);

    for (const entry of saved.plans || []) {
      // Verify file still exists
      try {
        await fs.access(entry.path);
        planQueue.set(entry.id, entry);

        // Rebuild session -> plans mapping
        if (!sessionPlans.has(entry.sessionId)) {
          sessionPlans.set(entry.sessionId, new Set());
        }
        sessionPlans.get(entry.sessionId).add(entry.id);
      } catch {
        // File no longer exists, skip
      }
    }

    console.log(`Loaded ${planQueue.size} plans from persistence`);
  } catch {
    // No persistence file, start fresh
  }
}

// ============ SSE Endpoint ============

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Add client to set
  sseClients.add(res);

  // Keep alive every 30 seconds
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  // Remove client on close
  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

// ============ Queue API Routes ============

// List all plans in queue
app.get('/api/plans', async (req, res) => {
  const { sessionId } = req.query;

  const plans = [];
  for (const [id, entry] of planQueue) {
    try {
      const feedback = await loadFeedback(entry.path);

      plans.push({
        id: entry.id,
        path: entry.path,
        sessionId: entry.sessionId,
        title: entry.title,
        name: entry.name,
        pushedAt: entry.pushedAt,
        updatedAt: entry.updatedAt,
        isOwn: sessionId ? entry.sessionId === sessionId : false,
        stats: {
          openComments: feedback.comments.filter(c => c.status === 'OPEN').length,
          pendingQuestions: feedback.questions.filter(q => q.status === 'PENDING').length,
          pendingAnswers: feedback.answers.filter(a => !a.acknowledged).length
        }
      });
    } catch (err) {
      // Plan file might have been deleted, remove from queue
      planQueue.delete(id);
      if (sessionPlans.has(entry.sessionId)) {
        sessionPlans.get(entry.sessionId).delete(id);
      }
    }
  }

  // Sort by pushedAt (newest first)
  plans.sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));

  res.json({ plans });
});

// Add or update plan in queue
app.post('/api/plans', async (req, res) => {
  const { planPath, sessionId } = req.body;

  if (!planPath) {
    return res.status(400).json({ error: 'planPath is required' });
  }

  const effectiveSessionId = sessionId || 'anonymous';

  try {
    await fs.access(planPath);
    const content = await fs.readFile(planPath, 'utf-8');
    const feedback = await loadFeedback(planPath);

    const planId = generatePlanId(planPath);
    const contentHash = generateContentHash(content);
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(planPath, '.md');

    const existingEntry = planQueue.get(planId);
    const isUpdate = existingEntry !== undefined;
    const contentChanged = existingEntry && existingEntry.contentHash !== contentHash;

    const entry = {
      id: planId,
      path: planPath,
      sessionId: effectiveSessionId,
      title,
      name: path.basename(planPath, '.md'),
      pushedAt: existingEntry?.pushedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentHash,
      previousContentHash: contentChanged ? existingEntry.contentHash : null
    };

    planQueue.set(planId, entry);

    // Track session -> plans mapping
    if (!sessionPlans.has(effectiveSessionId)) {
      sessionPlans.set(effectiveSessionId, new Set());
    }
    sessionPlans.get(effectiveSessionId).add(planId);

    // Persist queue
    await persistQueue();

    // Broadcast to SSE clients
    broadcastSSE({
      type: isUpdate ? 'plan:updated' : 'plan:added',
      plan: {
        id: planId,
        path: planPath,
        sessionId: effectiveSessionId,
        title,
        name: entry.name,
        contentChanged
      }
    });

    res.json({
      plan: {
        id: planId,
        path: planPath,
        name: entry.name,
        title,
        content,
        comments: feedback.comments,
        questions: feedback.questions,
        answers: feedback.answers
      },
      isUpdate,
      contentChanged
    });
  } catch (err) {
    res.status(404).json({ error: `Plan not found: ${planPath}` });
  }
});

// Get specific plan by ID
app.get('/api/plans/:id', async (req, res) => {
  const { id } = req.params;

  const entry = planQueue.get(id);
  if (!entry) {
    return res.status(404).json({ error: 'Plan not found in queue' });
  }

  try {
    const content = await fs.readFile(entry.path, 'utf-8');
    const feedback = await loadFeedback(entry.path);

    res.json({
      plan: {
        id: entry.id,
        path: entry.path,
        sessionId: entry.sessionId,
        name: entry.name,
        title: entry.title,
        content,
        comments: feedback.comments,
        questions: feedback.questions,
        answers: feedback.answers
      }
    });
  } catch (err) {
    // File deleted, remove from queue
    planQueue.delete(id);
    if (sessionPlans.has(entry.sessionId)) {
      sessionPlans.get(entry.sessionId).delete(id);
    }
    await persistQueue();
    res.status(404).json({ error: 'Plan file no longer exists' });
  }
});

// Remove plan from queue
app.delete('/api/plans/:id', async (req, res) => {
  const { id } = req.params;
  const { sessionId } = req.query;

  const entry = planQueue.get(id);
  if (!entry) {
    return res.status(404).json({ error: 'Plan not found in queue' });
  }

  // Only allow deletion by owner session or if no session specified
  if (sessionId && entry.sessionId !== sessionId && entry.sessionId !== 'anonymous') {
    return res.status(403).json({ error: 'Can only remove your own plans' });
  }

  planQueue.delete(id);

  // Update session tracking
  if (sessionPlans.has(entry.sessionId)) {
    sessionPlans.get(entry.sessionId).delete(id);
  }

  // Persist queue
  await persistQueue();

  broadcastSSE({
    type: 'plan:removed',
    planId: id
  });

  res.json({ success: true });
});

// Add comment to specific plan
app.post('/api/plans/:planId/comments', async (req, res) => {
  const { planId } = req.params;
  const entry = planQueue.get(planId);

  if (!entry) {
    return res.status(404).json({ error: 'Plan not found in queue' });
  }

  const { selectedText, content, anchorPrefix, anchorSuffix } = req.body;

  const feedback = await loadFeedback(entry.path);

  const newComment = {
    id: `c_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    selectedText,
    content,
    anchorPrefix: anchorPrefix || '',
    anchorSuffix: anchorSuffix || '',
    timestamp: new Date().toISOString(),
    status: 'OPEN',
    acknowledged: false
  };

  feedback.comments.push(newComment);
  await saveFeedback(entry.path, feedback);

  // Broadcast comment added
  broadcastSSE({
    type: 'comment:added',
    planId,
    comment: newComment
  });

  res.json({ comment: newComment });
});

// Resolve comment for specific plan
app.patch('/api/plans/:planId/comments/:commentId', async (req, res) => {
  const { planId, commentId } = req.params;
  const entry = planQueue.get(planId);

  if (!entry) {
    return res.status(404).json({ error: 'Plan not found in queue' });
  }

  const { status } = req.body;

  const feedback = await loadFeedback(entry.path);
  const comment = feedback.comments.find(c => c.id === commentId);

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (status) {
    comment.status = status;
    if (status === 'RESOLVED') {
      comment.resolvedAt = new Date().toISOString();
    }
  }

  await saveFeedback(entry.path, feedback);

  // Broadcast comment updated
  broadcastSSE({
    type: 'comment:updated',
    planId,
    comment
  });

  res.json({ comment });
});

// Answer question for specific plan
app.post('/api/plans/:planId/questions/:questionId/answer', async (req, res) => {
  const { planId, questionId } = req.params;
  const entry = planQueue.get(planId);

  if (!entry) {
    return res.status(404).json({ error: 'Plan not found in queue' });
  }

  const { answer } = req.body;

  const feedback = await loadFeedback(entry.path);
  const question = feedback.questions.find(q => q.id === questionId);

  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const newAnswer = {
    id: `a_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    questionId,
    question: question.questionText,
    answer,
    timestamp: new Date().toISOString(),
    acknowledged: false
  };

  feedback.answers.push(newAnswer);
  question.status = 'ANSWERED';
  question.answeredAt = new Date().toISOString();

  await saveFeedback(entry.path, feedback);

  // Broadcast answer added
  broadcastSSE({
    type: 'question:answered',
    planId,
    answer: newAnswer,
    question
  });

  res.json({ answer: newAnswer, question });
});

// ============ Legacy API Routes (Backward Compatibility) ============

// Get active plan (returns most recent)
app.get('/api/plan', async (req, res) => {
  if (planQueue.size === 0) {
    return res.json({ plan: null });
  }

  // Get most recently pushed plan
  const entries = Array.from(planQueue.values());
  entries.sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));
  const latestEntry = entries[0];

  try {
    const content = await fs.readFile(latestEntry.path, 'utf-8');
    const feedback = await loadFeedback(latestEntry.path);

    res.json({
      plan: {
        id: latestEntry.id,
        path: latestEntry.path,
        name: latestEntry.name,
        title: latestEntry.title,
        content,
        comments: feedback.comments,
        questions: feedback.questions,
        answers: feedback.answers
      }
    });
  } catch (err) {
    planQueue.delete(latestEntry.id);
    await persistQueue();
    res.json({ plan: null });
  }
});

// Set active plan (legacy - adds to queue)
app.post('/api/plan', async (req, res) => {
  const { planPath, sessionId } = req.body;

  if (!planPath) {
    return res.status(400).json({ error: 'planPath is required' });
  }

  // Forward to new endpoint
  req.body.sessionId = sessionId || 'legacy';

  try {
    await fs.access(planPath);
    const content = await fs.readFile(planPath, 'utf-8');
    const feedback = await loadFeedback(planPath);

    const planId = generatePlanId(planPath);
    const contentHash = generateContentHash(content);
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(planPath, '.md');

    const effectiveSessionId = sessionId || 'legacy';
    const existingEntry = planQueue.get(planId);

    const entry = {
      id: planId,
      path: planPath,
      sessionId: effectiveSessionId,
      title,
      name: path.basename(planPath, '.md'),
      pushedAt: existingEntry?.pushedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentHash
    };

    planQueue.set(planId, entry);

    if (!sessionPlans.has(effectiveSessionId)) {
      sessionPlans.set(effectiveSessionId, new Set());
    }
    sessionPlans.get(effectiveSessionId).add(planId);

    await persistQueue();

    res.json({
      plan: {
        id: planId,
        path: planPath,
        name: entry.name,
        title,
        content,
        comments: feedback.comments,
        questions: feedback.questions,
        answers: feedback.answers
      }
    });
  } catch (err) {
    res.status(404).json({ error: `Plan not found: ${planPath}` });
  }
});

// Legacy comments routes (operate on most recent plan)
app.get('/api/comments', async (req, res) => {
  if (planQueue.size === 0) {
    return res.json({ comments: [] });
  }

  const entries = Array.from(planQueue.values());
  entries.sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));
  const latestEntry = entries[0];

  const feedback = await loadFeedback(latestEntry.path);
  res.json({ comments: feedback.comments });
});

app.post('/api/comments', async (req, res) => {
  if (planQueue.size === 0) {
    return res.status(400).json({ error: 'No active plan' });
  }

  const entries = Array.from(planQueue.values());
  entries.sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));
  const latestEntry = entries[0];

  const { selectedText, content, anchorPrefix, anchorSuffix } = req.body;

  const feedback = await loadFeedback(latestEntry.path);

  const newComment = {
    id: `c_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    selectedText,
    content,
    anchorPrefix: anchorPrefix || '',
    anchorSuffix: anchorSuffix || '',
    timestamp: new Date().toISOString(),
    status: 'OPEN',
    acknowledged: false
  };

  feedback.comments.push(newComment);
  await saveFeedback(latestEntry.path, feedback);

  broadcastSSE({
    type: 'comment:added',
    planId: latestEntry.id,
    comment: newComment
  });

  res.json({ comment: newComment });
});

app.patch('/api/comments/:id', async (req, res) => {
  if (planQueue.size === 0) {
    return res.status(400).json({ error: 'No active plan' });
  }

  const entries = Array.from(planQueue.values());
  entries.sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));
  const latestEntry = entries[0];

  const { id } = req.params;
  const { status } = req.body;

  const feedback = await loadFeedback(latestEntry.path);
  const comment = feedback.comments.find(c => c.id === id);

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (status) {
    comment.status = status;
    if (status === 'RESOLVED') {
      comment.resolvedAt = new Date().toISOString();
    }
  }

  await saveFeedback(latestEntry.path, feedback);
  res.json({ comment });
});

// Legacy questions routes
app.get('/api/questions', async (req, res) => {
  if (planQueue.size === 0) {
    return res.json({ questions: [] });
  }

  const entries = Array.from(planQueue.values());
  entries.sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));
  const latestEntry = entries[0];

  const feedback = await loadFeedback(latestEntry.path);
  res.json({ questions: feedback.questions });
});

app.post('/api/questions/:id/answer', async (req, res) => {
  if (planQueue.size === 0) {
    return res.status(400).json({ error: 'No active plan' });
  }

  const entries = Array.from(planQueue.values());
  entries.sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));
  const latestEntry = entries[0];

  const { id } = req.params;
  const { answer } = req.body;

  const feedback = await loadFeedback(latestEntry.path);
  const question = feedback.questions.find(q => q.id === id);

  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const newAnswer = {
    id: `a_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    questionId: id,
    question: question.questionText,
    answer,
    timestamp: new Date().toISOString(),
    acknowledged: false
  };

  feedback.answers.push(newAnswer);
  question.status = 'ANSWERED';
  question.answeredAt = new Date().toISOString();

  await saveFeedback(latestEntry.path, feedback);
  res.json({ answer: newAnswer, question });
});

// Health check
app.get('/api/health', (req, res) => {
  const entries = Array.from(planQueue.values());
  entries.sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));
  const latestEntry = entries[0];

  res.json({
    status: 'ok',
    activePlan: latestEntry?.path || null,
    queueSize: planQueue.size,
    sseClients: sseClients.size
  });
});

// ============ Server Startup ============

loadPersistedQueue().then(() => {
  app.listen(PORT, () => {
    console.log(`Plan Collab API server running on http://localhost:${PORT}`);
    console.log(`Queue size: ${planQueue.size} plans`);
  });
});
