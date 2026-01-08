import { createSession } from './lib/api-client.js';
import { getContainerStatus } from './lib/docker-manager.js';

function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `sess_${timestamp}_${random}`;
}

function parseArgs(args) {
  const result = {
    feature: null,
    tests: [],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--feature' && args[i + 1]) {
      result.feature = args[++i];
    } else if (arg === '--tests' && args[i + 1]) {
      // Tests can be passed as JSON string
      try {
        result.tests = JSON.parse(args[++i]);
      } catch {
        console.error('Invalid JSON for --tests argument');
        process.exit(1);
      }
    } else if (arg === '--tests-file' && args[i + 1]) {
      // Or as a file path (read from stdin in practice)
      result.testsFile = args[++i];
    }
  }

  return result;
}

export default async function main(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
generate-tests - Generate E2E test cases for a feature

Usage:
  node cli.js generate-tests --feature "Feature name" --tests '[...]'

Options:
  --feature <name>    Name/description of the feature being tested
  --tests <json>      JSON array of test cases
  --tests-file <path> Path to JSON file containing test cases

Test Case Format (NEW - User/Claude separation):
{
  "title": "Test title",
  "description": "What this test verifies",
  "category": "ui|api|integration|edge-case|data-verification",
  "priority": "critical|high|medium|low",
  "userSteps": [
    {
      "type": "action|observe|screenshot",
      "instruction": "Human-readable instruction for the user"
    }
  ],
  "autoVerifications": [
    {
      "description": "Human-readable description",
      "command": "Command Claude runs after submit",
      "expectedPattern": "Regex to match in output",
      "expectedDescription": "What output to expect"
    }
  ]
}

Key Principle:
- userSteps: Things only humans can do (navigate, click, observe UI)
- autoVerifications: Things Claude runs automatically (DB queries, API calls, log checks)

Example:
  node cli.js generate-tests \\
    --feature "User Authentication" \\
    --tests '[{
      "title": "User can log in",
      "description": "Verify login flow works",
      "category": "ui",
      "priority": "critical",
      "userSteps": [
        {"type": "action", "instruction": "Navigate to /login"},
        {"type": "action", "instruction": "Enter email: test@example.com"},
        {"type": "action", "instruction": "Click Login button"},
        {"type": "observe", "instruction": "Verify redirect to dashboard"}
      ],
      "autoVerifications": [
        {
          "description": "Session created in database",
          "command": "psql -c \\"SELECT * FROM sessions WHERE user_email='"'"'test@example.com'"'"'\\"",
          "expectedPattern": "test@example\\\\.com",
          "expectedDescription": "Should show active session"
        }
      ]
    }]'
`);
    return;
  }

  const { feature, tests } = parseArgs(args);

  if (!feature) {
    console.log(
      JSON.stringify({
        success: false,
        error: 'Missing required --feature argument',
      })
    );
    process.exit(1);
  }

  if (!tests || tests.length === 0) {
    console.log(
      JSON.stringify({
        success: false,
        error: 'Missing required --tests argument with at least one test case',
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

    // Generate session ID
    const sessionId = generateSessionId();

    // Format tests with new structure (userSteps and autoVerifications)
    const formattedTests = tests.map((test, index) => ({
      id: `t_${String(index + 1).padStart(3, '0')}`,
      title: test.title,
      description: test.description || '',
      category: test.category || 'ui',
      priority: test.priority || 'medium',

      // User steps - things the user does manually
      userSteps: (test.userSteps || []).map((step, stepIndex) => ({
        id: `u${stepIndex + 1}`,
        type: step.type || 'action',
        instruction: step.instruction,
        completed: false,
      })),

      // Auto verifications - things Claude runs after submit
      autoVerifications: (test.autoVerifications || []).map((v, vIndex) => ({
        id: `a${vIndex + 1}`,
        description: v.description,
        command: v.command,
        expectedPattern: v.expectedPattern,
        expectedDescription: v.expectedDescription || '',
      })),

      // User's manual test result
      userResult: 'pending',
      userRemarks: '',
      userEvidence: [],

      // Auto results populated later by Claude
      autoResults: [],
    }));

    // Create session via API
    const session = await createSession({
      id: sessionId,
      feature,
      mode: 'webapp',
      tests: formattedTests,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const totalUserSteps = formattedTests.reduce((sum, t) => sum + t.userSteps.length, 0);
    const totalAutoVerifications = formattedTests.reduce((sum, t) => sum + t.autoVerifications.length, 0);

    console.log(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        feature,
        testCount: formattedTests.length,
        userStepsCount: totalUserSteps,
        autoVerificationsCount: totalAutoVerifications,
        url: `http://localhost:${status.port}?session=${session.id}`,
        message: `Created ${formattedTests.length} tests with ${totalUserSteps} manual steps and ${totalAutoVerifications} auto verifications for "${feature}"`,
      })
    );
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
