# plan-collab

**Review Claude's plans visually, not in your terminal.**

When Claude Code creates implementation plans, they can get long and complex. Reading them in the terminal is painful, and giving feedback through chat means your comments get lost in the conversation. plan-collab gives you a beautiful web interface to review plans, add inline comments, and answer Claude's questions - all in one place.

## The Problem

- Plans are hard to read and analyze in the CLI
- No easy way to comment on specific parts of a plan
- Feedback gets buried in chat history
- Claude's clarifying questions get mixed with other messages

## Features

| Feature | Description |
|---------|-------------|
| **Visual Plan Viewer** | Clean web UI with syntax highlighting and Mermaid diagram support |
| **Inline Commenting** | Select any text and add comments - just like Google Docs |
| **Questions Panel** | Dedicated sidebar for answering Claude's clarifying questions |
| **Plan Queue** | Manage multiple plans with status badges (pending, working, updated, done) |
| **Real-time Sync** | Changes appear instantly via Server-Sent Events |
| **Dark Mode** | Follows your system preference with manual toggle |

## Installation

```
/plugin install plan-collab@sahar-marketplace
```

## Usage

Once installed, plan-collab integrates automatically with Claude Code's planning workflow:

1. **Ask Claude to plan**: "Plan how to add user authentication"
2. **Plan opens in browser**: The web UI launches automatically
3. **Review and comment**: Select text to add comments, answer questions in the sidebar
4. **Claude sees your feedback**: Your comments and answers flow back to Claude

### Example Prompts

```
"Plan the implementation for a new payment system"
"Create a detailed plan for refactoring the API layer"
"Design the architecture for real-time notifications"
```

### Adding Questions to Plans

Use GitHub-style admonition blocks in your plans:

```markdown
> [!QUESTION]
> Which database should we use?
> - Option A: PostgreSQL
> - Option B: MySQL
```

These appear in the dedicated Questions Panel for easy answering.

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Code    │────▶│  Express API    │────▶│   Web UI        │
│  (writes plan)  │     │  (serves data)  │     │  (you review)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Feedback JSON  │
                        │  (your comments)│
                        └─────────────────┘
```

1. Claude writes a plan to `~/.claude/plans/`
2. The plugin's hook detects this and opens the web UI
3. You review the plan and add comments/answers
4. Feedback is stored as `.feedback.json` alongside the plan
5. Claude reads your feedback and proceeds accordingly

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with SSE for real-time updates
- **Diagrams**: Mermaid for architecture and flowcharts
- **Storage**: File-based JSON (no database required)

## Requirements

- Node.js 18+
- Modern browser (Chrome, Firefox, Safari, Edge)

## Development

```bash
cd skills/plan-collab/webapp
npm install
npm run dev
```

The webapp runs on `http://localhost:3456` by default.

---

*Part of [Sahar's Claude Code Marketplace](https://github.com/SaharCarmel/Sahar-claude-code-marketplace)*
