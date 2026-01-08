---
name: e2e-tester
description: Generate and track E2E test checklists with clear user/Claude separation. Users do manual UI actions, Claude runs automated verifications (DB, API, logs). Launches a Docker webapp for testing with screenshot uploads. Use when completing features, requesting manual verification, or before merging.
---

# E2E Tester: Human + AI Testing Workflow

A testing system that separates what users do (UI actions) from what Claude does (automated verifications). After implementing a feature, generate contextual tests where users verify the UI experience and Claude validates the backend.

## Core Principle

**Users do what only humans can do. Claude does everything else.**

| User's Job (Manual) | Claude's Job (Automated) |
|---------------------|--------------------------|
| Navigate to URLs | Run database queries |
| Click buttons | Make API calls (curl) |
| Fill forms | Grep application logs |
| Visual verification | Check file system changes |
| Subjective feedback | Validate data integrity |
| Take screenshots | Pattern match outputs |
| Report observations | Execute any CLI command |

## When to Use

Use this skill when:
- Completing a feature implementation (all todos marked complete)
- User explicitly requests E2E testing or manual verification
- Before merging significant changes
- User says "test this", "verify the feature", "run e2e tests"

## Prerequisites

- **Docker** must be installed and running
- First run will build the Docker image (~30-60 seconds)

## Complete Workflow

### 1. Generate Tests (Claude does this)

After implementing a feature, generate tests with clear separation:

```bash
node cli.js generate-tests --feature "User registration" --tests '[
  {
    "title": "User can register and account is created",
    "description": "Complete registration flow with backend validation",
    "category": "integration",
    "priority": "critical",
    "userSteps": [
      {"type": "action", "instruction": "Navigate to /register"},
      {"type": "action", "instruction": "Enter email: test@example.com"},
      {"type": "action", "instruction": "Enter password: SecurePass123!"},
      {"type": "action", "instruction": "Click Create Account button"},
      {"type": "observe", "instruction": "Verify success message appears"},
      {"type": "observe", "instruction": "Verify redirected to dashboard"},
      {"type": "screenshot", "instruction": "Screenshot the dashboard"}
    ],
    "autoVerifications": [
      {
        "description": "User record created in database",
        "command": "psql -c \"SELECT id, email FROM users WHERE email='"'"'test@example.com'"'"'\"",
        "expectedPattern": "test@example\\.com",
        "expectedDescription": "Should return 1 row with the email"
      },
      {
        "description": "Password is properly hashed",
        "command": "psql -c \"SELECT password FROM users WHERE email='"'"'test@example.com'"'"'\"",
        "expectedPattern": "\\$2[aby]\\$",
        "expectedDescription": "Password should be bcrypt hashed"
      },
      {
        "description": "Welcome email queued",
        "command": "grep '"'"'Sending welcome email to test@example.com'"'"' /var/log/app.log | tail -1",
        "expectedPattern": "Sending welcome email",
        "expectedDescription": "Log should show email was queued"
      }
    ]
  }
]'
```

### 2. Start Testing Container

```bash
node cli.js start-container
```

This opens the webapp at `http://localhost:3458`.

### 3. User Completes Manual Testing

In the webapp, the user:
- Goes through each **user step** (action, observe, screenshot)
- Checks off completed steps
- Uploads screenshots as evidence
- Marks each test as Pass/Fail/Skip
- Adds remarks if needed
- Submits when complete

**Important:** The user NEVER runs commands. They only do UI actions.

### 4. Claude Runs Automated Verifications

After user submits, Claude:

```bash
# Get list of verifications to run
node cli.js run-verifications --session <session-id> --list

# Claude executes each command using Bash tool
# Then reports results:
node cli.js run-verifications --session <session-id> --report '[
  {
    "testId": "t_001",
    "verificationId": "a1",
    "status": "passed",
    "output": "id | email\\n1 | test@example.com",
    "matchResult": "match"
  }
]'
```

### 5. Analyze Combined Results

```bash
node cli.js get-results --session <session-id>
```

Returns both manual and automated results:

```json
{
  "summary": {
    "manualTotal": 5,
    "manualPassed": 4,
    "manualFailed": 1,
    "manualSkipped": 0,
    "autoTotal": 8,
    "autoPassed": 7,
    "autoFailed": 1,
    "autoErrors": 0
  },
  "failures": [...]
}
```

### 6. Fix Failures

If there are failures, enter plan mode to analyze and fix.

## Test Format

### userSteps (what the USER does)

```json
{
  "type": "action | observe | screenshot",
  "instruction": "Human-readable instruction"
}
```

Step types:
- `action`: User performs an action (navigate, click, type)
- `observe`: User visually verifies something ("Verify success message appears")
- `screenshot`: User captures visual evidence

### autoVerifications (what CLAUDE runs)

```json
{
  "description": "Human-readable description",
  "command": "Command Claude executes",
  "expectedPattern": "Regex to match in output",
  "expectedDescription": "What output to expect"
}
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `start-container [--port N] [--no-open]` | Start Docker webapp |
| `stop-container` | Stop and remove container |
| `container-status [--logs]` | Check container health |
| `generate-tests --feature <desc> --tests <json>` | Create test session |
| `get-results --session <id> \| --latest \| --list` | Fetch results |
| `run-verifications --session <id> --list` | List verifications to run |
| `run-verifications --session <id> --report <json>` | Report verification results |
| `config [get\|set] [key] [value]` | Manage configuration |

## Data Storage

| Path | Purpose |
|------|---------|
| `~/.e2e-tester/config.json` | Configuration |
| `~/.e2e-tester/tests/<session>.json` | Test definitions |
| `~/.e2e-tester/feedback/<session>.json` | User + auto results |
| `~/.e2e-tester/images/<session>/` | Uploaded screenshots |

## Example Session

```
User: "Add user registration feature"

Claude: [Implements feature, marks todos complete]

Claude: I've implemented user registration. Let me generate E2E tests.

[Generates tests with userSteps (UI actions) and autoVerifications (DB/API checks)]

Claude: Opening the testing webapp. Please:
        1. Go through each manual step (navigate, fill form, click buttons)
        2. Check off what you observe
        3. Upload screenshots of the results
        4. Mark each test Pass/Fail
        5. Submit when done

[User completes manual testing and submits]

User: Done testing

Claude: Thanks! Now running automated verification checks...

[Executes each autoVerification command]

        Database: Found user record (id=42, email=test@example.com)
        Password: Properly hashed with bcrypt
        API: POST /register returns 201
        Logs: "User created" event logged
        Email: Welcome email not found in queue

Results:
- Manual: 5/5 passed (you verified all UI flows work)
- Automated: 4/5 passed (email service issue detected)

I found an issue with the email service. Let me investigate...

[Claude enters plan mode to fix the email issue]
```

## Benefits of This Approach

1. **Better UX**: Users don't copy-paste commands
2. **More Accurate**: Claude runs commands exactly as specified
3. **Full Observability**: Claude sees all verification outputs
4. **Clear Separation**: Users do human things, Claude does computer things
5. **Faster Testing**: Automated checks run in seconds after submit
6. **Better Debugging**: Full context of both manual and automated results
