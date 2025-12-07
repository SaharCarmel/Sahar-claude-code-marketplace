#!/usr/bin/env node
/**
 * Plan-Collab CLI
 * Usage: node cli.js <command> [options]
 *
 * Commands:
 *   start-server    Start the Next.js web server
 *   stop-server     Gracefully stop the server
 *   open-plan       Register and open a plan in browser
 *   get-feedback    Fetch pending comments/answers
 *   sync-plan       Sync plan content to server
 *   status          Check server and plan status
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const command = process.argv[2];
const args = process.argv.slice(3);

function printHelp() {
  console.log(`
Plan-Collab CLI - Collaborative plan review system

Usage: node cli.js <command> [options]

Commands:
  start-server              Start the web server (finds available port)
  stop-server [--force]     Stop the server gracefully (or force kill)
  open-plan <path>          Register plan and open in browser
  get-feedback [--all]      Fetch pending feedback (or all feedback)
  sync-plan <path>          Sync plan content to server
  status                    Check server and plan status
  help                      Show this help message

Options:
  --no-browser              Don't auto-open browser (for open-plan)
  --acknowledge             Mark fetched feedback as acknowledged
  --all                     Include all feedback, not just pending
  --force                   Force stop server

Examples:
  node cli.js start-server
  node cli.js open-plan ~/.claude/plans/my-feature.md
  node cli.js get-feedback
  node cli.js status
`);
}

async function main() {
  const commands = {
    'start-server': './start-server.js',
    'stop-server': './stop-server.js',
    'open-plan': './open-plan.js',
    'get-feedback': './get-feedback.js',
    'sync-plan': './sync-plan.js',
    status: './status.js'
  };

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    process.exit(0);
  }

  if (!commands[command]) {
    console.error(JSON.stringify({ error: `Unknown command: ${command}. Use 'help' for usage.` }));
    process.exit(1);
  }

  try {
    // Dynamic import and execute
    const module = await import(commands[command]);
    await module.default(args);
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

main();
