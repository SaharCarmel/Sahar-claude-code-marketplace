#!/usr/bin/env node
/**
 * Create a milestone in a Linear project
 * Usage: node milestones-create.js <project-id> --name "Name" [--description "..."] [--target-date "YYYY-MM-DD"]
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
const projectId = args[0];

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

if (!projectId || !options.name) {
  console.error(JSON.stringify({
    error: 'Usage: node milestones-create.js <project-id> --name "Name" [--description "..."] [--target-date "YYYY-MM-DD"]'
  }));
  process.exit(1);
}

const client = new LinearClient({ apiKey });

async function findProject(query) {
  // Try by ID first
  try {
    const project = await client.project(query);
    if (project) return project;
  } catch {}

  // Search by name
  const projects = await client.projects({ filter: { name: { containsIgnoreCase: query } } });
  const nodes = await projects.nodes;
  if (nodes.length === 0) {
    throw new Error(`Project not found: ${query}`);
  }
  return nodes[0];
}

async function createMilestone() {
  try {
    const project = await findProject(projectId);

    const input = {
      projectId: project.id,
      name: options.name
    };

    if (options.description) {
      input.description = options.description;
    }
    if (options.targetDate) {
      input.targetDate = options.targetDate;
    }

    const result = await client.createProjectMilestone(input);

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
      console.error(JSON.stringify({ error: 'Failed to create milestone' }));
      process.exit(1);
    }
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

createMilestone();
