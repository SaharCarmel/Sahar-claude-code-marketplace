#!/usr/bin/env node
/**
 * Delete a Linear milestone
 * Usage: node milestones-delete.js <milestone-id>
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

const milestoneId = process.argv[2];

if (!milestoneId) {
  console.error(JSON.stringify({ error: 'Usage: node milestones-delete.js <milestone-id>' }));
  process.exit(1);
}

const client = new LinearClient({ apiKey });

async function deleteMilestone() {
  try {
    const result = await client.deleteProjectMilestone(milestoneId);

    if (result.success) {
      console.log(JSON.stringify({ success: true, deleted: milestoneId }, null, 2));
    } else {
      console.error(JSON.stringify({ error: 'Failed to delete milestone' }));
      process.exit(1);
    }
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

deleteMilestone();
