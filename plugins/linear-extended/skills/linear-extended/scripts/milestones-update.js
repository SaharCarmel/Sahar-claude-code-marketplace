#!/usr/bin/env node
/**
 * Update a Linear milestone
 * Usage: node milestones-update.js <milestone-id> [--name "..."] [--description "..."] [--target-date "YYYY-MM-DD"]
 *
 * Requires OAuth authentication (run auth-login.js) or LINEAR_API_KEY environment variable
 */

import { LinearClient } from '@linear/sdk';
import { getAccessToken } from './lib/token-store.js';

let apiKey;
try {
  apiKey = await getAccessToken();
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}

// Parse arguments
const args = process.argv.slice(2);
const milestoneId = args[0];

function parseArgs(args) {
  const result = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      result.name = args[++i];
    } else if (args[i] === '--description' && args[i + 1]) {
      result.description = args[++i];
    } else if (args[i] === '--target-date' && args[i + 1]) {
      result.targetDate = args[++i];
    }
  }
  return result;
}

const options = parseArgs(args);

if (!milestoneId) {
  console.error(JSON.stringify({
    error: 'Usage: node milestones-update.js <milestone-id> [--name "..."] [--description "..."] [--target-date "YYYY-MM-DD"]'
  }));
  process.exit(1);
}

if (Object.keys(options).length === 0) {
  console.error(JSON.stringify({ error: 'At least one option (--name, --description, --target-date) required' }));
  process.exit(1);
}

const client = new LinearClient({ apiKey });

async function updateMilestone() {
  try {
    const input = {};
    if (options.name) input.name = options.name;
    if (options.description) input.description = options.description;
    if (options.targetDate) input.targetDate = options.targetDate;

    const result = await client.updateProjectMilestone(milestoneId, input);

    if (result.success) {
      const milestone = await result.projectMilestone;
      console.log(JSON.stringify({
        success: true,
        milestone: {
          id: milestone.id,
          name: milestone.name,
          description: milestone.description,
          targetDate: milestone.targetDate
        }
      }, null, 2));
    } else {
      console.error(JSON.stringify({ error: 'Failed to update milestone' }));
      process.exit(1);
    }
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

updateMilestone();
