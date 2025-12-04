---
name: linear-extended
description: Manage Linear project milestones - list, create, update, delete milestones for projects. Use when user asks about project milestones, wants to track project phases (Alpha, Beta, Launch), or needs to modify milestone details. Triggers: "show milestones", "create milestone", "update milestone", "project phases", "milestone progress", "what are the milestones", "add milestone to project".
---

# Linear Extended

Milestone operations for Linear projects.

## Setup

Install dependencies once:
```bash
cd <skill-dir>/scripts && npm install
```

## Authentication

Two methods supported: OAuth (recommended) or API key.

### Option A: OAuth Login (Recommended)

First, create an OAuth app in Linear:
1. Go to Linear Settings > API > OAuth Applications
2. Create new app with redirect URI: `urn:ietf:wg:oauth:2.0:oob`
3. Save the `client_id` and `client_secret`

Then authenticate:
```bash
# First time: provide credentials (saved for future use)
node <skill-dir>/scripts/auth-login.js --client-id "YOUR_CLIENT_ID" --client-secret "YOUR_CLIENT_SECRET"

# Subsequent logins (credentials remembered)
node <skill-dir>/scripts/auth-login.js
```

Follow the prompts: open the URL in browser, authorize, paste the code back.

### Option B: API Key

Set `LINEAR_API_KEY` environment variable with a personal API key from Linear Settings > API.

### Check Auth Status
```bash
node <skill-dir>/scripts/auth-status.js
```

### Logout
```bash
node <skill-dir>/scripts/auth-logout.js        # Keep client credentials
node <skill-dir>/scripts/auth-logout.js --all  # Clear everything
```

## List Milestones

```bash
node <skill-dir>/scripts/milestones-list.js <project-name-or-id>
```

Example:
```bash
node <skill-dir>/scripts/milestones-list.js Candlekeep
```

## Create Milestone

```bash
node <skill-dir>/scripts/milestones-create.js <project> --name "Name" [--description "..."] [--target-date "YYYY-MM-DD"]
```

Example:
```bash
node <skill-dir>/scripts/milestones-create.js Candlekeep --name "Alpha" --description "Internal testing" --target-date "2025-01-15"
```

## Update Milestone

```bash
node <skill-dir>/scripts/milestones-update.js <milestone-id> [--name "..."] [--description "..."] [--target-date "..."]
```

Example:
```bash
node <skill-dir>/scripts/milestones-update.js abc123 --name "Beta" --target-date "2025-02-01"
```

## Delete Milestone

```bash
node <skill-dir>/scripts/milestones-delete.js <milestone-id>
```

## Get Project with Milestones

```bash
node <skill-dir>/scripts/project-get.js <project-name-or-id> [--with-milestones]
```

Example:
```bash
node <skill-dir>/scripts/project-get.js Candlekeep --with-milestones
```

## Output

All scripts output JSON. Success includes data, errors include `{ "error": "message" }`.
