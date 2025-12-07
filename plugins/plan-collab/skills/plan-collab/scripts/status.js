#!/usr/bin/env node
/**
 * Check plan-collab server and plan status
 * Usage: node status.js
 */

import { isServerRunning, getServerInfo, loadConfig } from './lib/config-store.js';
import { isPortResponding } from './lib/server-manager.js';
import { getPendingFeedback } from './lib/feedback-store.js';
import fs from 'fs/promises';

export default async function status(args) {
  const running = await isServerRunning();
  const config = await loadConfig();

  const result = {
    server: {
      running: false,
      pid: null,
      port: null,
      url: null,
      startedAt: null,
      healthy: false
    },
    plan: {
      active: false,
      path: null,
      exists: false,
      feedback: null
    }
  };

  // Server status
  if (running) {
    const info = await getServerInfo();
    result.server = {
      running: true,
      pid: info.pid,
      port: info.port,
      url: info.url,
      startedAt: info.startedAt,
      healthy: await isPortResponding(info.port)
    };
  }

  // Plan status
  if (config.activePlan) {
    result.plan.active = true;
    result.plan.path = config.activePlan;

    try {
      await fs.access(config.activePlan);
      result.plan.exists = true;

      // Get feedback summary
      const feedback = await getPendingFeedback(config.activePlan);
      result.plan.feedback = feedback.summary;
    } catch {
      result.plan.exists = false;
    }
  }

  console.log(JSON.stringify(result, null, 2));
}
