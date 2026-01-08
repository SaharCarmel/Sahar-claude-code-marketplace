import { getResults, getLatestSession, listSessions } from './lib/api-client.js';
import { getContainerStatus } from './lib/docker-manager.js';

function parseArgs(args) {
  const result = {
    sessionId: null,
    latest: false,
    list: false,
    format: 'json',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--session' && args[i + 1]) {
      result.sessionId = args[++i];
    } else if (arg === '--latest') {
      result.latest = true;
    } else if (arg === '--list') {
      result.list = true;
    } else if (arg === '--format' && args[i + 1]) {
      result.format = args[++i];
    }
  }

  return result;
}

export default async function main(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
get-results - Fetch E2E test results

Usage:
  node cli.js get-results --session <id>
  node cli.js get-results --latest
  node cli.js get-results --list

Options:
  --session <id>  Get results for a specific session
  --latest        Get results for the most recent session
  --list          List all sessions
  --format <fmt>  Output format: json (default), summary

Examples:
  node cli.js get-results --session sess_123456_abc
  node cli.js get-results --latest
  node cli.js get-results --list
`);
    return;
  }

  const { sessionId, latest, list, format } = parseArgs(args);

  try {
    // Check if container is running
    const status = await getContainerStatus();
    if (!status.running) {
      console.log(
        JSON.stringify({
          success: false,
          error:
            'E2E Tester container is not running. Start it with: node cli.js start-container',
        })
      );
      process.exit(1);
    }

    // List sessions
    if (list) {
      const sessions = await listSessions();
      console.log(
        JSON.stringify({
          success: true,
          sessions: sessions.map((s) => ({
            id: s.id,
            feature: s.feature,
            status: s.status,
            testCount: s.tests?.length || 0,
            createdAt: s.createdAt,
          })),
        })
      );
      return;
    }

    // Get specific or latest session
    let targetSessionId = sessionId;

    if (latest) {
      const latestSession = await getLatestSession();
      if (!latestSession) {
        console.log(
          JSON.stringify({
            success: false,
            error: 'No sessions found',
          })
        );
        process.exit(1);
      }
      targetSessionId = latestSession.id;
    }

    if (!targetSessionId) {
      console.log(
        JSON.stringify({
          success: false,
          error: 'Please specify --session <id>, --latest, or --list',
        })
      );
      process.exit(1);
    }

    // Get results
    const results = await getResults(targetSessionId);

    if (!results) {
      console.log(
        JSON.stringify({
          success: false,
          error: `Session not found: ${targetSessionId}`,
        })
      );
      process.exit(1);
    }

    if (format === 'summary') {
      // Human-readable summary
      const { summary, failures } = results;
      let output = `\nE2E Test Results for "${results.feature}"\n`;
      output += `${'='.repeat(50)}\n`;
      output += `Status: ${results.status}\n`;
      output += `Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed} | Skipped: ${summary.skipped}\n`;

      if (failures.length > 0) {
        output += `\nFailures:\n`;
        failures.forEach((f, i) => {
          output += `\n${i + 1}. ${f.title}\n`;
          output += `   Category: ${f.category} | Priority: ${f.priority}\n`;
          if (f.remarks) {
            output += `   Remarks: ${f.remarks}\n`;
          }
          if (f.images && f.images.length > 0) {
            output += `   Screenshots: ${f.images.length}\n`;
          }
        });
      }

      console.log(output);
    } else {
      // JSON output
      console.log(
        JSON.stringify({
          success: true,
          ...results,
        })
      );
    }
  } catch (err) {
    console.log(
      JSON.stringify({
        success: false,
        error: err.message,
      })
    );
    process.exit(1);
  }
}
