# SDLC Shared Context Management

**This is the mother prompt for all SDLC plugin skills. Include these instructions in every SDLC skill.**

## Context File: sdlc.md

All SDLC skills share context through a single `sdlc.md` file in the project root. This file persists important project information across sessions and skills.

### On Every Invocation

1. **Check for sdlc.md** in the current working directory
2. **If it doesn't exist**, create it with the template below
3. **Read the shared sections** to understand project context
4. **Update your skill's section** with relevant information discovered during your work
5. **Keep shared sections current** if you learn new information (e.g., team members, milestones)

### sdlc.md Template

```markdown
# SDLC Context

## Project Info
- **Name**: [Project name]
- **Repository**: [Git repo URL if known]
- **Issue Tracker**: [Linear/Jira/GitHub - auto-detected from MCP tools]

## Team
| Name | Role | Handle |
|------|------|--------|
| | | |

## Current Milestone
- **Name**: [Milestone name]
- **Target Date**: [Date]
- **Status**: [On track / At risk / Blocked]

## Active Sprint/Cycle
- **Name**: [Sprint/Cycle name]
- **Start**: [Date]
- **End**: [Date]

---

## Project Manager Context
<!-- Managed by project-manager skill -->
- **Last Board Audit**: [Date]
- **Backlog Health**: [Good/Needs attention]
- **Blocked Issues**: [Count and IDs]
- **Ready for Development**: [Issue IDs]

---

## [Future Skill] Context
<!-- Template for additional SDLC skills -->

```

### Section Ownership

| Section | Owner Skill | Update Frequency |
|---------|-------------|------------------|
| Project Info | Any (first to detect) | Once, then as needed |
| Team | Any (from issue tracker) | As discovered |
| Current Milestone | project-manager | Each session |
| Active Sprint/Cycle | project-manager | Each session |
| Project Manager Context | project-manager | Each invocation |

### Guidelines

1. **Don't overwrite others' sections** - Only update sections you own
2. **Keep it concise** - This is context, not documentation
3. **Use consistent formatting** - Follow the template structure
4. **Update timestamps** - Note when sections were last updated
5. **Auto-detect when possible** - Pull team/milestone info from issue tracker APIs

### Reading Context

Before performing any action, read `sdlc.md` to understand:
- What project you're working on
- Who the team members are
- Current milestone and sprint status
- What other skills have discovered

### Writing Context

After completing significant work:
- Update your skill's dedicated section
- Add any newly discovered team members
- Update milestone/sprint status if changed
- Note any blockers or important findings

### Example Context File

```markdown
# SDLC Context

## Project Info
- **Name**: Acme Dashboard
- **Repository**: https://github.com/acme/dashboard
- **Issue Tracker**: Linear (auto-detected)

## Team
| Name | Role | Handle |
|------|------|--------|
| Alice Chen | Tech Lead | @alice |
| Bob Smith | Backend Dev | @bob |
| Carol Jones | Frontend Dev | @carol |

## Current Milestone
- **Name**: v2.0 Launch
- **Target Date**: 2025-02-15
- **Status**: On track

## Active Sprint/Cycle
- **Name**: Sprint 12
- **Start**: 2025-01-06
- **End**: 2025-01-20

---

## Project Manager Context
<!-- Managed by project-manager skill -->
- **Last Board Audit**: 2025-01-10
- **Backlog Health**: Good
- **Blocked Issues**: 2 (ACME-45, ACME-67)
- **Ready for Development**: ACME-89, ACME-90, ACME-91
- **Notes**: ACME-45 blocked on API spec from external team
```
