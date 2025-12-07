#!/usr/bin/env node
/**
 * Fetch pending feedback for active plan
 * Usage: node get-feedback.js [--all]
 *
 * Fetches feedback from the running web server's SQLite database
 * via the /api/feedback endpoint.
 */

import { loadConfig } from './lib/config-store.js';

export default async function getFeedback(args) {
  const all = args.includes('--all');

  const config = await loadConfig();

  if (!config.activePlan) {
    console.error(
      JSON.stringify({ error: 'No active plan. Run open-plan first.' })
    );
    process.exit(1);
  }

  if (!config.port) {
    console.error(
      JSON.stringify({ error: 'Server not running. Run start-server first.' })
    );
    process.exit(1);
  }

  try {
    // Fetch feedback from the web server's API
    const url = `http://localhost:${config.port}/api/feedback?plan=${encodeURIComponent(config.activePlan)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const feedback = await response.json();

    // Format output based on --all flag
    let result;
    if (all) {
      result = feedback;
    } else {
      // Return only pending (open) feedback
      result = {
        planPath: feedback.planPath,
        planName: feedback.planName,
        version: feedback.version,
        pending: {
          comments: feedback.comments || [],
          answers: feedback.answeredQuestions || []
        },
        summary: feedback.summary
      };
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}
