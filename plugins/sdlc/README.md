# SDLC Plugin

Software Development Lifecycle tools for Claude Code.

## Overview

The SDLC plugin provides skills for managing the software development lifecycle, including project management, issue tracking, and backlog organization.

## Skills

### project-manager

An expert project manager assistant that helps you:

- **Board Organization** - Update issue statuses, organize boards, identify stale items
- **Issue Enrichment** - Evaluate and improve issue quality with acceptance criteria, descriptions, and technical notes
- **Development Prep** - Fetch and review issues ready for coding
- **Backlog Audit** - Review backlog quality and identify poorly-defined issues

The skill works with any issue tracking system available via MCP (Linear, Jira, GitHub Issues, etc.).

## Usage

The project-manager skill is automatically invoked when you ask about:

- Updating issue statuses
- Organizing your project board
- Finding issues ready for development
- Enriching or planning issues
- Auditing backlog quality

**Examples:**

```
"Mark the authentication issue as done"
"What issues can I work on today?"
"Help me organize my board"
"Is my backlog well-defined?"
```

## Configuration

The skill uses the `haiku` model for fast, efficient responses.

## Shared Context: sdlc.md

All SDLC skills share context through a single `sdlc.md` file in your project root. This file persists important project information across sessions and skills.

**What's stored:**
- Project info (name, repo, issue tracker)
- Team members and roles
- Current milestone and sprint/cycle
- Skill-specific context (each skill maintains its own section)

**How it works:**
1. On first run, any SDLC skill creates `sdlc.md` if missing
2. Skills read shared sections for project context
3. Each skill updates its dedicated section with findings
4. Information persists across sessions

See `shared/CONTEXT.md` for the full specification and template.

## Future Skills

This plugin is structured to accommodate additional SDLC skills such as:

- Code review assistance
- Release management
- CI/CD pipeline helpers
- Sprint planning
