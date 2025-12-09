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

export default async function openPlan(args) {
  const planPath = args.find((a) => !a.startsWith('--'));
  const noBrowser = args.includes('--no-browser');

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

  try {
    const response = await fetch(`${serverInfo.url}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planPath: absolutePath, sessionId })
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
  } catch (err) {
    console.error(
      JSON.stringify({
        error: `Failed to connect to server: ${err.message}`
      })
    );
    process.exit(1);
  }

  // Open browser
  if (!noBrowser) {
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
