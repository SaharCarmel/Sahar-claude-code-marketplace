# Plan-Collab

A collaborative plan review system for Claude Code. Provides a web interface for reviewing and commenting on Claude's implementation plans.

## Features

- **Beautiful Plan Viewer**: Rendered markdown with syntax highlighting
- **Text Selection Commenting**: Select text and add inline comments (like Google Docs)
- **Questions Panel**: Dedicated sidebar for Claude's questions
- **Version History**: Track changes across plan versions
- **Dark Mode**: System preference detection with manual toggle
- **Auto-sync**: Polls for plan updates automatically

## Installation

1. Clone/copy to your Claude Code skills directory:
   ```bash
   cp -r plugins/plan-collab ~/.claude/skills/
   ```

2. Install webapp dependencies:
   ```bash
   cd ~/.claude/skills/plan-collab/webapp
   npm install
   npm run build
   ```

3. (Optional) Add hook for auto-launch:
   Copy the contents of `settings-template.json` to your `.claude/settings.json`

## Usage

### CLI Commands

```bash
# Start the web server
node ~/.claude/skills/plan-collab/scripts/cli.js start-server

# Open a plan in browser
node ~/.claude/skills/plan-collab/scripts/cli.js open-plan ~/.claude/plans/my-feature.md

# Get user feedback
node ~/.claude/skills/plan-collab/scripts/cli.js get-feedback

# Check status
node ~/.claude/skills/plan-collab/scripts/cli.js status

# Stop server
node ~/.claude/skills/plan-collab/scripts/cli.js stop-server
```

### Question Format

Use GitHub-style admonition blocks for questions in your plans:

```markdown
> [!QUESTION]
> Which database should we use?
> - Option A: PostgreSQL
> - Option B: MySQL
```

## Architecture

```
plan-collab/
├── .claude-plugin/plugin.json    # Plugin metadata
├── skills/plan-collab/
│   ├── SKILL.md                  # Skill definition
│   ├── scripts/                  # CLI tools
│   │   ├── cli.js               # Main CLI entry
│   │   ├── start-server.js      # Start server
│   │   ├── stop-server.js       # Stop server
│   │   ├── open-plan.js         # Open plan in browser
│   │   ├── get-feedback.js      # Get comments/answers
│   │   ├── sync-plan.js         # Sync plan content
│   │   ├── status.js            # Check status
│   │   └── lib/                 # Shared libraries
│   └── webapp/                   # Next.js web app
│       ├── src/app/             # App routes
│       ├── src/components/      # React components
│       └── src/lib/             # Database, utilities
└── settings-template.json        # Hook configuration
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, shadcn/ui
- **Markdown**: react-markdown with remark-gfm
- **Database**: SQLite (better-sqlite3)
- **CLI**: Node.js ES Modules

## Requirements

- Node.js 18+
- Modern browser

## License

MIT
