import { getSession, saveAutoResults, updateSessionSummary } from './lib/api-client.js';
import { getContainerStatus } from './lib/docker-manager.js';

/**
 * run-verifications - Get auto verifications to run for a submitted session
 *
 * This script is called by Claude after user submits test results.
 * It retrieves all autoVerifications and outputs them for Claude to execute.
 * Claude then runs each command and reports results back.
 *
 * Two modes:
 * 1. --session <id> --list: List all verifications to run (Claude reads this)
 * 2. --session <id> --report <json>: Report results after running (Claude sends this)
 */

function parseArgs(args) {
  const result = {
    session: null,
    list: false,
    report: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--session' && args[i + 1]) {
      result.session = args[++i];
    } else if (arg === '--list') {
      result.list = true;
    } else if (arg === '--report' && args[i + 1]) {
      try {
        result.report = JSON.parse(args[++i]);
      } catch {
        console.error('Invalid JSON for --report argument');
        process.exit(1);
      }
    } else if (arg === '--latest') {
      result.latest = true;
    }
  }

  return result;
}

export default async function main(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
run-verifications - Run automated verifications after user submits

Usage:
  node cli.js run-verifications --session <id> --list
  node cli.js run-verifications --session <id> --report '<json>'
  node cli.js run-verifications --latest --list

Modes:
  --list              List all verifications that need to be run
  --report <json>     Report results after running verifications

Options:
  --session <id>      Session ID to process
  --latest            Use the most recent session

Workflow:
1. User submits tests in webapp
2. Claude runs: node cli.js run-verifications --session <id> --list
3. Claude executes each command using Bash tool
4. Claude reports results: node cli.js run-verifications --session <id> --report '[...]'

Report Format:
[
  {
    "testId": "t_001",
    "verificationId": "a1",
    "status": "passed|failed|error",
    "output": "actual command output",
    "matchResult": "match|mismatch",
    "error": "error message if status is error"
  }
]
`);
    return;
  }

  const { session: sessionId, list, report, latest } = parseArgs(args);

  if (!sessionId && !latest) {
    console.log(
      JSON.stringify({
        success: false,
        error: 'Missing required --session <id> or --latest argument',
      })
    );
    process.exit(1);
  }

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

    // Get session
    const session = await getSession(sessionId || 'latest');

    if (!session) {
      console.log(
        JSON.stringify({
          success: false,
          error: 'Session not found',
        })
      );
      process.exit(1);
    }

    // Check session is submitted
    if (session.status !== 'submitted') {
      console.log(
        JSON.stringify({
          success: false,
          error: `Session status is '${session.status}', expected 'submitted'. User must submit first.`,
        })
      );
      process.exit(1);
    }

    // MODE 1: List verifications
    if (list) {
      const verifications = [];

      for (const test of session.tests) {
        for (const v of test.autoVerifications) {
          verifications.push({
            testId: test.id,
            testTitle: test.title,
            verificationId: v.id,
            description: v.description,
            command: v.command,
            expectedPattern: v.expectedPattern,
            expectedDescription: v.expectedDescription,
          });
        }
      }

      console.log(
        JSON.stringify({
          success: true,
          sessionId: session.id,
          feature: session.feature,
          verificationCount: verifications.length,
          verifications,
          instructions: `Run each command and capture output. Then call: node cli.js run-verifications --session ${session.id} --report '[results]'`,
        })
      );
      return;
    }

    // MODE 2: Report results
    if (report) {
      if (!Array.isArray(report)) {
        console.log(
          JSON.stringify({
            success: false,
            error: 'Report must be an array of verification results',
          })
        );
        process.exit(1);
      }

      // Group results by test
      const resultsByTest = {};
      for (const r of report) {
        if (!resultsByTest[r.testId]) {
          resultsByTest[r.testId] = [];
        }
        resultsByTest[r.testId].push({
          verificationId: r.verificationId,
          status: r.status,
          output: r.output,
          matchResult: r.matchResult,
          error: r.error,
          executedAt: new Date().toISOString(),
        });
      }

      // Save results for each test
      for (const [testId, results] of Object.entries(resultsByTest)) {
        await saveAutoResults(session.id, testId, results);
      }

      // Calculate summary
      const passed = report.filter(r => r.status === 'passed').length;
      const failed = report.filter(r => r.status === 'failed').length;
      const errors = report.filter(r => r.status === 'error').length;

      await updateSessionSummary(session.id, { passed, failed, errors });

      console.log(
        JSON.stringify({
          success: true,
          sessionId: session.id,
          summary: {
            total: report.length,
            passed,
            failed,
            errors,
          },
          message: `Recorded ${report.length} verification results`,
        })
      );
      return;
    }

    // No mode specified
    console.log(
      JSON.stringify({
        success: false,
        error: 'Specify --list to get verifications or --report to submit results',
      })
    );
    process.exit(1);
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
