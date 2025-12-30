#!/usr/bin/env node
/**
 * Register a plan file and open in browser
 * Usage: node open-plan.js <plan-path> [--no-browser]
 */

import fs from 'fs/promises';
import path from 'path';
import {
  loadConfig,
  updateConfig,
  isServerRunning,
  getServerInfo,
  getSessionId
} from './lib/config-store.js';
import { loadFeedback, saveFeedback, createEmptyFeedback } from './lib/feedback-store.js';
import { openBrowser, isPortResponding } from './lib/server-manager.js';

/**
 * Extract questions from markdown content
 * Supports formats:
 *   [!QUESTION] Question text here
 *   [!QUESTION:MULTI] Question text (allows multiple selections)
 *   > [!QUESTION] Question text here
 *
 * Multiple choice options (on lines following the question):
 *   - Option A
 *   - Option B - With description
 *   - Option C (Recommended)
 */
function extractQuestionsFromMarkdown(content) {
  const questions = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match [!QUESTION] or [!QUESTION:MULTI] pattern (with or without > prefix)
    const match = line.match(/^>?\s*\[!QUESTION(?::MULTI)?\]\s*(.*)$/i);
    const isMulti = line.toUpperCase().includes(':MULTI]');

    if (match) {
      let questionText = match[1].trim();
      const options = [];

      // Look at following lines for options (- Option text) or continuation
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        const trimmed = nextLine.trim();

        // Empty line signals end of options
        if (trimmed === '') {
          break;
        }

        // Check for option line: starts with - or *
        const optionMatch = trimmed.match(/^[-*]\s+(.+)$/);
        if (optionMatch) {
          const optionContent = optionMatch[1].trim();
          // Parse "Label - Description" or just "Label"
          const dashSplit = optionContent.match(/^([^-]+)\s+-\s+(.+)$/);
          if (dashSplit) {
            options.push({
              label: dashSplit[1].trim(),
              description: dashSplit[2].trim()
            });
          } else {
            options.push({
              label: optionContent,
              description: ''
            });
          }
          j++;
          continue;
        }

        // Check for continuation line (starts with > or is indented, but not an option)
        if (!questionText && (nextLine.match(/^>\s+(.+)$/) || nextLine.match(/^\s{2,}(.+)$/))) {
          const contentMatch = nextLine.match(/^>\s*(.+)$/) || nextLine.match(/^\s{2,}(.+)$/);
          if (contentMatch && !contentMatch[1].trim().match(/^[-*]\s/)) {
            questionText = contentMatch[1].trim();
            j++;
            continue;
          }
        }

        // If it's another [!QUESTION], stop
        if (trimmed.match(/^\[!QUESTION/i)) {
          break;
        }

        // Any other content, stop
        break;
      }

      if (questionText) {
        const question = {
          questionText,
          context: `Extracted from markdown at line ${i + 1}`
        };

        // Add options if found
        if (options.length > 0) {
          question.options = options;
          question.multiSelect = isMulti;
        }

        questions.push(question);
      }
    }
  }

  return questions;
}

export default async function openPlan(args) {
  const planPath = args.find((a) => !a.startsWith('--'));
  const noBrowser = args.includes('--no-browser');

  // Parse project context arguments
  const projectNameIdx = args.indexOf('--project-name');
  const projectUrlIdx = args.indexOf('--project-url');
  const projectName = projectNameIdx !== -1 ? args[projectNameIdx + 1] : null;
  const projectUrl = projectUrlIdx !== -1 ? args[projectUrlIdx + 1] : null;

  if (!planPath) {
    console.error(
      JSON.stringify({ error: 'Usage: open-plan <plan-path> [--no-browser]' })
    );
    process.exit(1);
  }

  // Resolve to absolute path, handling ~
  let absolutePath = planPath;
  if (planPath.startsWith('~')) {
    absolutePath = planPath.replace('~', process.env.HOME || '');
  }
  absolutePath = path.resolve(absolutePath);

  // Verify file exists
  try {
    await fs.access(absolutePath);
  } catch {
    console.error(
      JSON.stringify({ error: `Plan file not found: ${absolutePath}` })
    );
    process.exit(1);
  }

  // Check server
  if (!(await isServerRunning())) {
    console.error(
      JSON.stringify({
        error: 'Server not running. Start with: node cli.js start-server'
      })
    );
    process.exit(1);
  }

  const serverInfo = await getServerInfo();

  // Verify server is healthy
  if (!(await isPortResponding(serverInfo.port))) {
    console.error(
      JSON.stringify({
        error: 'Server is not responding. Try restarting: node cli.js stop-server && node cli.js start-server'
      })
    );
    process.exit(1);
  }

  // Update config with active plan
  await updateConfig({
    activePlan: absolutePath,
    lastSync: new Date().toISOString()
  });

  // Initialize feedback file if doesn't exist
  try {
    const existing = await loadFeedback(absolutePath);
    if (!existing.planPath) {
      await saveFeedback(absolutePath, createEmptyFeedback(absolutePath));
    }
  } catch {
    await saveFeedback(absolutePath, createEmptyFeedback(absolutePath));
  }

  // Get session ID for this terminal
  const sessionId = await getSessionId();

  // Notify server of new plan via API
  const planUrl = `${serverInfo.url}?plan=${encodeURIComponent(absolutePath)}&sessionId=${encodeURIComponent(sessionId)}`;

  let planId;
  try {
    const response = await fetch(`${serverInfo.url}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planPath: absolutePath,
        sessionId,
        project: projectName ? { name: projectName, url: projectUrl || null } : null
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(
        JSON.stringify({
          error: `Failed to register plan with server: ${error}`
        })
      );
      process.exit(1);
    }

    const result = await response.json();
    planId = result.plan?.id;
    const isUpdate = result.isUpdate;

    // Set status to 'working' since we're actively working on this plan
    if (planId) {
      await fetch(`${serverInfo.url}/api/plans/${planId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'working' })
      });
    }

    // Extract and add questions from markdown content
    if (planId) {
      try {
        const content = await fs.readFile(absolutePath, 'utf-8');
        const extractedQuestions = extractQuestionsFromMarkdown(content);

        // Check existing questions to avoid duplicates
        const feedback = await loadFeedback(absolutePath);
        const existingTexts = new Set(feedback.questions.map((q) => q.questionText.toLowerCase()));

        for (const q of extractedQuestions) {
          if (!existingTexts.has(q.questionText.toLowerCase())) {
            await fetch(`${serverInfo.url}/api/plans/${planId}/questions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(q)
            });
          }
        }
      } catch (extractErr) {
        // Non-fatal - just log and continue
        console.error(
          JSON.stringify({
            warning: `Could not extract questions: ${extractErr.message}`
          })
        );
      }
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        error: `Failed to connect to server: ${err.message}`
      })
    );
    process.exit(1);
  }

  // Open browser only for new plans, not updates
  if (!noBrowser && !isUpdate) {
    await openBrowser(planUrl);
  }

  console.log(
    JSON.stringify({
      status: 'opened',
      planPath: absolutePath,
      url: planUrl,
      port: serverInfo.port,
      sessionId
    })
  );
}
