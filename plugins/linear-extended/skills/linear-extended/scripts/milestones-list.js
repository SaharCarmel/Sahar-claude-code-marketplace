#!/usr/bin/env node
/**
 * List milestones for a Linear project
 * Usage: node milestones-list.js <project-name-or-id>
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

const projectQuery = process.argv[2];
if (!projectQuery) {
  console.error(JSON.stringify({ error: 'Usage: node milestones-list.js <project-name-or-id>' }));
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

async function listMilestones() {
  try {
    const project = await findProject(projectQuery);
    const milestones = await project.projectMilestones();
    const nodes = await milestones.nodes;

    const result = nodes.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      targetDate: m.targetDate,
      sortOrder: m.sortOrder
    }));

    console.log(JSON.stringify({
      project: { id: project.id, name: project.name },
      milestones: result
    }, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

listMilestones();
