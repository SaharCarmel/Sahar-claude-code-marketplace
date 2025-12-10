#!/usr/bin/env node
/**
 * Set plan status
 * Usage: node set-status.js <plan-id-or-path> <status>
 *
 * Status can be: pending, working, updated, done
 */

import path from 'path';
import crypto from 'crypto';
import {
  isServerRunning,
  getServerInfo
} from './lib/config-store.js';
import { isPortResponding } from './lib/server-manager.js';

function generatePlanId(planPath) {
  return crypto.createHash('md5').update(planPath).digest('hex');
}

export default async function setStatus(args) {
  const planIdOrPath = args.find((a) => !a.startsWith('--'));
  const status = args.find((a, i) => i > 0 && !a.startsWith('--'));

  if (!planIdOrPath || !status) {
    console.error(
      JSON.stringify({ error: 'Usage: set-status <plan-id-or-path> <status>' })
    );
    process.exit(1);
  }

  const validStatuses = ['pending', 'working', 'updated', 'done'];
  if (!validStatuses.includes(status)) {
    console.error(
      JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
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

  // Determine plan ID - if it looks like a path, convert to ID
  let planId = planIdOrPath;
  if (planIdOrPath.includes('/') || planIdOrPath.includes('.md')) {
    // It's a path, convert to ID
    let absolutePath = planIdOrPath;
    if (planIdOrPath.startsWith('~')) {
      absolutePath = planIdOrPath.replace('~', process.env.HOME || '');
    }
    absolutePath = path.resolve(absolutePath);
    planId = generatePlanId(absolutePath);
  }

  try {
    const response = await fetch(`${serverInfo.url}/api/plans/${planId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(
        JSON.stringify({
          error: error.error || `Failed to set status: ${response.statusText}`
        })
      );
      process.exit(1);
    }

    const result = await response.json();
    console.log(
      JSON.stringify({
        status: 'updated',
        planId,
        newStatus: result.status,
        previousStatus: result.previousStatus
      })
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        error: `Failed to connect to server: ${err.message}`
      })
    );
    process.exit(1);
  }
}
