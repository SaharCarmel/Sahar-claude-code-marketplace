import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

const DB_DIR = path.join(os.homedir(), '.plan-collab');
const DB_PATH = path.join(DB_DIR, 'plan-collab.db');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true, mode: 0o700 });
}

// Create database connection
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    file_path TEXT UNIQUE NOT NULL,
    title TEXT,
    current_version INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS plan_versions (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    title TEXT,
    snapshot_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    UNIQUE(plan_id, version)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    anchor_prefix TEXT DEFAULT '',
    anchor_suffix TEXT DEFAULT '',
    anchor_path TEXT,
    start_offset INTEGER,
    end_offset INTEGER,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    FOREIGN KEY (version_id) REFERENCES plan_versions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    context TEXT,
    line_number INTEGER,
    section_path TEXT,
    answer TEXT,
    answered_at TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_plans_name ON plans(name);
  CREATE INDEX IF NOT EXISTS idx_versions_plan ON plan_versions(plan_id);
  CREATE INDEX IF NOT EXISTS idx_comments_plan ON comments(plan_id);
  CREATE INDEX IF NOT EXISTS idx_comments_version ON comments(version_id);
  CREATE INDEX IF NOT EXISTS idx_questions_plan ON questions(plan_id);
`);

export { db };

// Helper functions
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function hashContent(content: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Plan operations
export function getPlan(filePath: string) {
  return db.prepare('SELECT * FROM plans WHERE file_path = ?').get(filePath);
}

export function getPlanById(id: string) {
  return db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
}

export function getAllPlans() {
  return db.prepare('SELECT * FROM plans ORDER BY updated_at DESC').all();
}

export function createPlan(filePath: string, name: string, title?: string) {
  const id = generateId();
  db.prepare(
    'INSERT INTO plans (id, name, file_path, title) VALUES (?, ?, ?, ?)'
  ).run(id, name, filePath, title || null);
  return getPlanById(id);
}

export function updatePlanVersion(planId: string, newVersion: number) {
  db.prepare(
    'UPDATE plans SET current_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(newVersion, planId);
}

// Version operations
export function getLatestVersion(planId: string) {
  return db
    .prepare(
      'SELECT * FROM plan_versions WHERE plan_id = ? ORDER BY version DESC LIMIT 1'
    )
    .get(planId);
}

export function getVersion(planId: string, version: number) {
  return db
    .prepare('SELECT * FROM plan_versions WHERE plan_id = ? AND version = ?')
    .get(planId, version);
}

export function getVersionById(id: string) {
  return db.prepare('SELECT * FROM plan_versions WHERE id = ?').get(id);
}

export function getAllVersions(planId: string) {
  return db
    .prepare('SELECT * FROM plan_versions WHERE plan_id = ? ORDER BY version DESC')
    .all(planId);
}

export function createVersion(
  planId: string,
  version: number,
  content: string,
  contentHash: string,
  title?: string
) {
  const id = generateId();
  db.prepare(
    'INSERT INTO plan_versions (id, plan_id, version, content, content_hash, title) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, planId, version, content, contentHash, title || null);
  return getVersionById(id);
}

// Comment operations
export function getCommentsByPlan(planId: string) {
  return db
    .prepare('SELECT * FROM comments WHERE plan_id = ? ORDER BY start_offset ASC')
    .all(planId);
}

export function getCommentsByVersion(versionId: string) {
  return db
    .prepare('SELECT * FROM comments WHERE version_id = ? ORDER BY start_offset ASC')
    .all(versionId);
}

export function createComment(data: {
  planId: string;
  versionId: string;
  anchorText: string;
  anchorPrefix?: string;
  anchorSuffix?: string;
  anchorPath?: string;
  startOffset?: number;
  endOffset?: number;
  content: string;
}) {
  const id = generateId();
  db.prepare(`
    INSERT INTO comments (id, plan_id, version_id, anchor_text, anchor_prefix, anchor_suffix, anchor_path, start_offset, end_offset, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.planId,
    data.versionId,
    data.anchorText,
    data.anchorPrefix || '',
    data.anchorSuffix || '',
    data.anchorPath || null,
    data.startOffset || null,
    data.endOffset || null,
    data.content
  );
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
}

export function updateCommentStatus(commentId: string, status: string) {
  db.prepare(
    'UPDATE comments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(status, commentId);
}

// Question operations
export function getQuestionsByPlan(planId: string) {
  return db
    .prepare('SELECT * FROM questions WHERE plan_id = ? ORDER BY created_at ASC')
    .all(planId);
}

export function getPendingQuestions(planId: string) {
  return db
    .prepare(
      "SELECT * FROM questions WHERE plan_id = ? AND status = 'PENDING' ORDER BY created_at ASC"
    )
    .all(planId);
}

export function createQuestion(data: {
  planId: string;
  questionText: string;
  context?: string;
  lineNumber?: number;
  sectionPath?: string;
}) {
  const id = generateId();
  db.prepare(`
    INSERT INTO questions (id, plan_id, question_text, context, line_number, section_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.planId,
    data.questionText,
    data.context || null,
    data.lineNumber || null,
    data.sectionPath || null
  );
  return db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
}

export function answerQuestion(questionId: string, answer: string) {
  db.prepare(`
    UPDATE questions
    SET answer = ?, answered_at = CURRENT_TIMESTAMP, status = 'ANSWERED'
    WHERE id = ?
  `).run(answer, questionId);
  return db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
}
