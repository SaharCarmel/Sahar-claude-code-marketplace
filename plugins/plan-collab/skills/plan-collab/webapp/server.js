/**
 * Plan Collab API Server
 * Serves API routes for the webapp
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.API_PORT || 3456;

app.use(cors());
app.use(express.json());

// Store active plan path
let activePlanPath = null;

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

// ============ API Routes ============

// Get active plan
app.get('/api/plan', async (req, res) => {
  if (!activePlanPath) {
    return res.json({ plan: null });
  }

  try {
    const content = await fs.readFile(activePlanPath, 'utf-8');
    const feedback = await loadFeedback(activePlanPath);

    // Extract title from first H1
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(activePlanPath, '.md');

    res.json({
      plan: {
        id: crypto.createHash('md5').update(activePlanPath).digest('hex'),
        path: activePlanPath,
        name: path.basename(activePlanPath, '.md'),
        title,
        content,
        comments: feedback.comments,
        questions: feedback.questions,
        answers: feedback.answers
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set active plan
app.post('/api/plan', async (req, res) => {
  const { planPath } = req.body;

  if (!planPath) {
    return res.status(400).json({ error: 'planPath is required' });
  }

  try {
    // Verify file exists
    await fs.access(planPath);
    activePlanPath = planPath;

    const content = await fs.readFile(planPath, 'utf-8');
    const feedback = await loadFeedback(planPath);

    // Extract title from first H1
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(planPath, '.md');

    res.json({
      plan: {
        id: crypto.createHash('md5').update(planPath).digest('hex'),
        path: planPath,
        name: path.basename(planPath, '.md'),
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

// Get comments
app.get('/api/comments', async (req, res) => {
  if (!activePlanPath) {
    return res.json({ comments: [] });
  }

  const feedback = await loadFeedback(activePlanPath);
  res.json({ comments: feedback.comments });
});

// Add comment
app.post('/api/comments', async (req, res) => {
  if (!activePlanPath) {
    return res.status(400).json({ error: 'No active plan' });
  }

  const { selectedText, content, anchorPrefix, anchorSuffix } = req.body;

  const feedback = await loadFeedback(activePlanPath);

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
  await saveFeedback(activePlanPath, feedback);

  res.json({ comment: newComment });
});

// Resolve comment
app.patch('/api/comments/:id', async (req, res) => {
  if (!activePlanPath) {
    return res.status(400).json({ error: 'No active plan' });
  }

  const { id } = req.params;
  const { status } = req.body;

  const feedback = await loadFeedback(activePlanPath);
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

  await saveFeedback(activePlanPath, feedback);
  res.json({ comment });
});

// Get questions
app.get('/api/questions', async (req, res) => {
  if (!activePlanPath) {
    return res.json({ questions: [] });
  }

  const feedback = await loadFeedback(activePlanPath);
  res.json({ questions: feedback.questions });
});

// Answer question
app.post('/api/questions/:id/answer', async (req, res) => {
  if (!activePlanPath) {
    return res.status(400).json({ error: 'No active plan' });
  }

  const { id } = req.params;
  const { answer } = req.body;

  const feedback = await loadFeedback(activePlanPath);
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

  await saveFeedback(activePlanPath, feedback);
  res.json({ answer: newAnswer, question });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activePlan: activePlanPath });
});

app.listen(PORT, () => {
  console.log(`Plan Collab API server running on http://localhost:${PORT}`);
});
