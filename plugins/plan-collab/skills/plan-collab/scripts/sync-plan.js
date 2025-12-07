#!/usr/bin/env node
/**
 * Sync plan content to server
 * Usage: node sync-plan.js [plan-path]
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  loadConfig,
  updateConfig,
  isServerRunning,
  getServerInfo
} from './lib/config-store.js';

export default async function syncPlan(args) {
  let planPath = args.find((a) => !a.startsWith('--'));
  const config = await loadConfig();

  // Use active plan if not specified
  if (!planPath) {
    if (!config.activePlan) {
      console.error(
        JSON.stringify({
          error: 'No plan specified and no active plan. Provide a path or run open-plan first.'
        })
      );
      process.exit(1);
    }
    planPath = config.activePlan;
  }

  // Resolve path
  let absolutePath = planPath;
  if (planPath.startsWith('~')) {
    absolutePath = planPath.replace('~', process.env.HOME || '');
  }
  absolutePath = path.resolve(absolutePath);

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

  try {
    // Read plan content
    const content = await fs.readFile(absolutePath, 'utf-8');
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    // Sync to server
    const response = await fetch(`${serverInfo.url}/api/plans/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planPath: absolutePath,
        content,
        contentHash
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(
        JSON.stringify({ error: `Sync failed: ${error}` })
      );
      process.exit(1);
    }

    const result = await response.json();

    // Update last sync time
    await updateConfig({ lastSync: new Date().toISOString() });

    console.log(
      JSON.stringify({
        status: 'synced',
        planPath: absolutePath,
        version: result.version,
        contentHash: contentHash.slice(0, 12)
      })
    );
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}
