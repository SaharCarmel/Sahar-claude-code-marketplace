#!/usr/bin/env node
/**
 * Get a Linear project with optional milestones
 * Usage: node project-get.js <project-name-or-id> [--with-milestones]
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
const withMilestones = process.argv.includes('--with-milestones');

if (!projectQuery) {
  console.error(JSON.stringify({ error: 'Usage: node project-get.js <project-name-or-id> [--with-milestones]' }));
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

async function getProject() {
  try {
    const project = await findProject(projectQuery);
    const lead = await project.lead;
    const status = await project.status;

    const result = {
      id: project.id,
      name: project.name,
      description: project.description,
      summary: project.summary,
      url: project.url,
      state: project.state,
      startDate: project.startDate,
      targetDate: project.targetDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lead: lead ? { id: lead.id, name: lead.name } : null,
      status: status ? { id: status.id, name: status.name } : null
    };

    if (withMilestones) {
      const milestones = await project.projectMilestones();
      const nodes = await milestones.nodes;
      result.milestones = nodes.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        targetDate: m.targetDate,
        sortOrder: m.sortOrder
      }));
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

getProject();
