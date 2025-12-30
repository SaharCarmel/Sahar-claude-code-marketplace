#!/usr/bin/env node
/**
 * Add a question to a plan for user to answer
 * Usage: node add-question.js <plan-path> <question-text> [options]
 *
 * Options:
 *   --context <text>     Context for the question
 *   --options <json>     JSON array of options for multiple choice
 *                        e.g. --options '[{"label":"Option A","description":"Desc A"},{"label":"Option B"}]'
 *                        or simple: --options '["Option A","Option B","Option C"]'
 *   --multi              Allow multiple selections (checkbox style)
 *
 * The question will appear in the Questions panel in the web UI.
 * Users can answer questions and Claude can fetch the answers via get-feedback.
 */

import { resolve } from 'path';
import { getServerInfo } from './lib/config-store.js';

function parseArgs(args) {
  const result = {
    planPath: null,
    questionText: null,
    context: '',
    options: null,
    multiSelect: false
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--context' && i + 1 < args.length) {
      result.context = args[i + 1];
      i += 2;
    } else if (arg === '--options' && i + 1 < args.length) {
      try {
        result.options = JSON.parse(args[i + 1]);
      } catch (e) {
        throw new Error(`Invalid JSON for --options: ${e.message}`);
      }
      i += 2;
    } else if (arg === '--multi') {
      result.multiSelect = true;
      i += 1;
    } else if (!arg.startsWith('--')) {
      // Positional arguments
      if (!result.planPath) {
        result.planPath = arg;
      } else if (!result.questionText) {
        result.questionText = arg;
      } else if (!result.context) {
        // Legacy: third positional arg is context
        result.context = arg;
      }
      i += 1;
    } else {
      i += 1;
    }
  }

  return result;
}

export default async function addQuestion(args) {
  let parsed;
  try {
    parsed = parseArgs(args);
  } catch (e) {
    console.error(JSON.stringify({ error: e.message }));
    process.exit(1);
  }

  const { planPath, questionText, context, options, multiSelect } = parsed;

  if (!planPath || !questionText) {
    console.error(
      JSON.stringify({
        error: 'Usage: add-question <plan-path> <question-text> [--context <text>] [--options <json>] [--multi]'
      })
    );
    process.exit(1);
  }

  // Expand ~ and resolve to absolute path
  const absolutePath = planPath.startsWith('~')
    ? planPath.replace(/^~/, process.env.HOME)
    : resolve(planPath);

  const serverInfo = await getServerInfo();

  if (!serverInfo) {
    console.error(
      JSON.stringify({ error: 'Server not running. Start with: node cli.js start-server' })
    );
    process.exit(1);
  }

  try {
    // First, find the plan ID from the queue
    const plansResponse = await fetch(`${serverInfo.url}/api/plans`);
    if (!plansResponse.ok) {
      throw new Error(`Failed to fetch plans: HTTP ${plansResponse.status}`);
    }

    const { plans } = await plansResponse.json();
    const plan = plans.find((p) => p.path === absolutePath);

    if (!plan) {
      console.error(
        JSON.stringify({
          error: 'Plan not found in queue. Open the plan first with: node cli.js open-plan <path>'
        })
      );
      process.exit(1);
    }

    // Build request body
    const body = { questionText, context };
    if (options) {
      body.options = options;
      body.multiSelect = multiSelect;
    }

    // Add the question via API
    const response = await fetch(`${serverInfo.url}/api/plans/${plan.id}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const { question } = await response.json();

    console.log(
      JSON.stringify({
        status: 'added',
        planPath: absolutePath,
        planId: plan.id,
        question
      })
    );
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}
