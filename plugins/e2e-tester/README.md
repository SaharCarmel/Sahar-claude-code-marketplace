# E2E Tester Plugin

A Claude Code plugin that generates contextual E2E test checklists with clear separation between what users do (manual UI testing) and what Claude does (automated verifications). Users verify the UI experience through a Dockerized webapp, while Claude validates backend behavior by running database queries, API calls, and log checks.

## Core Principle

**Users do what only humans can do. Claude does everything else.**

| User's Job (Manual) | Claude's Job (Automated) |
|---------------------|--------------------------|
| Navigate to URLs | Run database queries |
| Click buttons | Make API calls (curl) |
| Fill forms | Grep application logs |
| Visual verification | Check file system changes |
| Take screenshots | Validate data integrity |

## Features

- **Multi-Agent Support** - Multiple Claude agents can create test sessions simultaneously
- **Unified Dashboard** - See all pending tests from all agents in one view
- **Per-Test Target URLs** - Each test can specify its own URL to test
- **Real-time Updates** - Dashboard updates automatically when new sessions are created
- **Evidence Collection** - Screenshots and notes for each test

## Prerequisites

- **Docker** must be installed and running
- No other dependencies required - everything runs in Docker

## How It Works

1. **Claude finishes implementing a feature** (all todos marked complete)
2. **Claude generates E2E tests** with:
   - `targetUrl`: The URL where this test should be executed
   - `userSteps`: Manual actions for the user (navigate, click, observe)
   - `autoVerifications`: Commands Claude will run (DB queries, API calls)
3. **Docker webapp launches** at `http://localhost:3458`
4. **Dashboard shows all active sessions** from different agents
5. **User selects a session** and does manual testing
6. **User submits results** when done
7. **Claude runs automated verifications** - executing each command
8. **Claude analyzes combined results** and fixes any issues

## Usage

### Starting the Testing Webapp

```bash
cd plugins/e2e-tester/skills/e2e-tester/scripts
node cli.js start-container
```

### Viewing the Dashboard

Open `http://localhost:3458` to see all active test sessions from all agents.

### Generating Tests

```bash
node cli.js generate-tests \
  --feature "User Registration" \
  --tests '[{
    "title": "User can register",
    "description": "Complete registration flow",
    "targetUrl": "http://localhost:3000/register",
    "category": "integration",
    "priority": "critical",
    "userSteps": [
      {"type": "action", "instruction": "Navigate to /register"},
      {"type": "action", "instruction": "Fill in email: test@example.com"},
      {"type": "action", "instruction": "Click Create Account"},
      {"type": "observe", "instruction": "Verify success message appears"},
      {"type": "screenshot", "instruction": "Screenshot the dashboard"}
    ],
    "autoVerifications": [
      {
        "description": "User created in database",
        "command": "psql -c \"SELECT * FROM users WHERE email='"'"'test@example.com'"'"'\"",
        "expectedPattern": "test@example\\.com",
        "expectedDescription": "Should return 1 row"
      }
    ]
  }]'
```

The output includes:
- `url`: Direct link to the session view
- `dashboardUrl`: Link to the unified dashboard

### Running Auto Verifications (after user submits)

```bash
# Get list of verifications to run
node cli.js run-verifications --session <id> --list

# After running each command, report results
node cli.js run-verifications --session <id> --report '[...]'
```

### Getting Results

```bash
node cli.js get-results --latest
```

### Stopping the Container

```bash
node cli.js stop-container
```

## Test Structure

### Test Case Fields

```json
{
  "title": "Test title",
  "description": "What this test verifies",
  "targetUrl": "http://localhost:3000/page-to-test",
  "category": "ui|api|integration|edge-case|data-verification",
  "priority": "critical|high|medium|low",
  "userSteps": [...],
  "autoVerifications": [...]
}
```

### userSteps (what users do manually)

```json
{
  "type": "action | observe | screenshot",
  "instruction": "Human-readable instruction"
}
```

- `action`: Navigate, click, type - things users do in UI
- `observe`: Visual verification - "Verify error message appears"
- `screenshot`: Capture evidence - "Screenshot the success page"

### autoVerifications (what Claude runs)

```json
{
  "description": "Human-readable description",
  "command": "Command Claude executes",
  "expectedPattern": "Regex to match",
  "expectedDescription": "What to expect"
}
```

## Dashboard & Session Views

### Dashboard View (`http://localhost:3458`)

Shows all active test sessions with:
- Feature name
- Pending/passed/failed test counts
- Progress bar
- Session creation time
- Click to view session details

### Session View (`http://localhost:3458?session=<id>`)

Shows individual session with:
- **Target URL** - Clickable link to open the test page in new tab
- Test steps checklist
- Pass/Fail/Skip buttons
- Notes and screenshot upload
- Back to Dashboard link

## CLI Commands

| Command | Description |
|---------|-------------|
| `start-container [--port N] [--no-open]` | Start Docker webapp |
| `stop-container` | Stop and remove container |
| `container-status [--logs]` | Check container health |
| `generate-tests --feature <desc> --tests <json>` | Create test session |
| `get-results --session <id> \| --latest \| --list` | Fetch results |
| `run-verifications --session <id> --list` | List auto verifications |
| `run-verifications --session <id> --report <json>` | Report auto results |
| `config [get\|set] [key] [value]` | Manage configuration |

## Data Storage

All data is stored in `~/.e2e-tester/`:

| Path | Purpose |
|------|---------|
| `config.json` | Plugin configuration |
| `tests/<session>.json` | Generated test cases |
| `feedback/<session>.json` | User + auto results |
| `images/<session>/` | Uploaded screenshots |

## Architecture

```
Host Machine                          Docker Container
--------------                        ----------------
CLI Scripts  ----HTTP API---->        Next.js App (:3458)
                                      - /api/sessions
                                      - /api/events (SSE)
~/.e2e-tester/ <--Volume Mount-->     /data
- tests/                              - tests/
- feedback/                           - feedback/
- images/                             - images/

Multiple Agents:
Agent 1 ---> Session A ---|
Agent 2 ---> Session B ---+--> Dashboard View
Agent 3 ---> Session C ---|
```

## Multi-Agent Workflow

```
1. Agent 1 completes feature, generates tests
   └─> Session created, appears on dashboard

2. Agent 2 completes different feature, generates tests
   └─> Session created, appears on dashboard

3. User opens dashboard
   └─> Sees both sessions with pending tests

4. User clicks Session A
   └─> Tests show with clickable target URLs
   └─> User completes tests, submits

5. Agent 1 runs auto verifications
   └─> Session A complete, removed from dashboard

6. User clicks Session B, continues testing...
```

## Benefits

1. **Multi-Agent Support** - Multiple agents can create tests simultaneously
2. **Unified Dashboard** - One view for all pending tests
3. **Target URL per Test** - Each test can point to a different page/service
4. **Real-time Updates** - Dashboard refreshes automatically via SSE
5. **Better UX** - Users never copy-paste commands
6. **More Accurate** - Claude runs commands exactly as specified
7. **Full Observability** - Claude sees all verification outputs
8. **Clear Separation** - Users do human things, Claude does computer things
9. **Faster Testing** - Automated checks run in seconds
10. **Better Debugging** - Full context of both manual and automated results

## License

Part of the Sahar Claude Code Marketplace.
