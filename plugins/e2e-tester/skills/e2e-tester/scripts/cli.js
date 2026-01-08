#!/usr/bin/env node

/**
 * E2E Tester CLI
 *
 * Usage: node cli.js <command> [options]
 *
 * Commands:
 *   start-container     Start the Docker container
 *   stop-container      Stop the Docker container
 *   container-status    Check container status
 *   generate-tests      Generate test cases
 *   get-results         Get test results
 *   config              View/set configuration
 */

const commands = {
  'start-container': './start-container.js',
  'stop-container': './stop-container.js',
  'container-status': './container-status.js',
  'generate-tests': './generate-tests.js',
  'get-results': './get-results.js',
  'run-verifications': './run-verifications.js',
  'config': './config.js',
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);

  if (!command || command === '--help' || command === '-h') {
    console.log(`
E2E Tester CLI

Usage: node cli.js <command> [options]

Commands:
  start-container     Start the Docker webapp container
  stop-container      Stop and remove the container
  container-status    Check if container is running and healthy
  generate-tests      Generate test cases from feature context
  get-results         Fetch test results from a session
  run-verifications   Run automated verifications after user submits
  config              View or set configuration

Examples:
  node cli.js start-container
  node cli.js generate-tests --feature "User authentication"
  node cli.js get-results --session sess_abc123
  node cli.js stop-container
`);
    process.exit(0);
  }

  if (!commands[command]) {
    console.error(JSON.stringify({ error: `Unknown command: ${command}` }));
    process.exit(1);
  }

  try {
    const module = await import(commands[command]);
    await module.default(commandArgs);
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

main();
