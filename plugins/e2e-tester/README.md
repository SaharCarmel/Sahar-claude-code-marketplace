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

## Prerequisites

- **Docker** must be installed and running
- No other dependencies required - everything runs in Docker

## How It Works

1. **Claude finishes implementing a feature** (all todos marked complete)
2. **Claude generates E2E tests** with two parts:
   - `userSteps`: Manual actions for the user (navigate, click, observe)
   - `autoVerifications`: Commands Claude will run (DB queries, API calls)
3. **Docker webapp launches** at `http://localhost:3458`
4. **User does manual testing** - checking off steps, uploading screenshots
5. **User submits results** when done
6. **Claude runs automated verifications** - executing each command
7. **Claude analyzes combined results** and fixes any issues

## Usage

### Starting the Testing Webapp

```bash
cd plugins/e2e-tester/skills/e2e-tester/scripts
node cli.js start-container
```

### Generating Tests

```bash
node cli.js generate-tests \
  --feature "User Registration" \
  --tests '[{
    "title": "User can register",
    "description": "Complete registration flow",
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
~/.e2e-tester/ <--Volume Mount-->     /data
- tests/                              - tests/
- feedback/                           - feedback/
- images/                             - images/
```

## Benefits

1. **Better UX** - Users never copy-paste commands
2. **More Accurate** - Claude runs commands exactly as specified
3. **Full Observability** - Claude sees all verification outputs
4. **Clear Separation** - Users do human things, Claude does computer things
5. **Faster Testing** - Automated checks run in seconds
6. **Better Debugging** - Full context of both manual and automated results

## License

Part of the Sahar Claude Code Marketplace.
