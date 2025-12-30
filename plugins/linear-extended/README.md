# linear-extended

**Everything Linear's MCP doesn't do (yet).**

Linear's official MCP integration is great for basic issue management, but it's missing some key features. linear-extended fills the gaps with milestone management, image downloads, and more programmatic control over your Linear workspace.

## The Problem

- Linear's MCP lacks milestone management for tracking project phases
- Can't extract images and screenshots from issue descriptions
- Missing deeper automation for Linear power users

## Features

| Feature | Description |
|---------|-------------|
| **Milestone CRUD** | Create, read, update, and delete project milestones |
| **Image Downloads** | Extract and download images from issue descriptions and attachments |
| **OAuth + API Key** | Flexible authentication with PKCE OAuth or simple API key |
| **Smart Lookups** | Find projects by name or ID (case-insensitive) |

## Installation

```
/plugin install linear-extended@sahar-marketplace
```

## Usage

### Milestone Management

Track project phases like Alpha, Beta, and Launch:

```
"Create a Beta milestone for Project X with target date January 15"
"List all milestones for the Mobile App project"
"Update the Launch milestone to target March 1st"
"Delete the deprecated Alpha milestone"
```

### Image Downloads

Extract visuals from issues for documentation or reports:

```
"Download all images from issue LIN-123"
"Get screenshots attached to the bug reports in Project Y"
```

## Authentication

### Option 1: OAuth (Recommended)

1. Create an OAuth app in Linear Settings > API > OAuth Applications
2. Run the auth command - it will guide you through the flow
3. Tokens are stored securely in `~/.linear-extended/config.json`

### Option 2: API Key

Set the `LINEAR_API_KEY` environment variable:

```bash
export LINEAR_API_KEY="lin_api_xxxxx"
```

Get your API key from Linear Settings > API > Personal API Keys.

## Available Operations

### Milestones

| Operation | Description |
|-----------|-------------|
| `milestones-list` | List all milestones for a project |
| `milestones-create` | Create a new milestone with name, description, target date |
| `milestones-update` | Update an existing milestone |
| `milestones-delete` | Delete a milestone |

### Projects

| Operation | Description |
|-----------|-------------|
| `project-get` | Get project details with optional milestone info |

### Issues

| Operation | Description |
|-----------|-------------|
| `issue-images` | Download or list images from an issue |

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Code    │────▶│  linear-extended│────▶│   Linear API    │
│  (your request) │     │  (scripts)      │     │   (GraphQL)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  ~/.linear-ext  │
                        │  (credentials)  │
                        └─────────────────┘
```

All scripts output JSON for easy parsing and integration with Claude Code.

## Requirements

- Node.js 18+
- Linear account with API access
- `@linear/sdk` (installed automatically)

## Security

- OAuth uses PKCE flow for secure authentication
- Config files are stored with restricted permissions (0600)
- Tokens refresh automatically before expiration

---

*Part of [Sahar's Claude Code Marketplace](https://github.com/SaharCarmel/Sahar-claude-code-marketplace)*
