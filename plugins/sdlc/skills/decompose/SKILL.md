---
name: decompose
description: |
  Break down the current Claude Code plan into Linear sub-issues with E2E test criteria.
  Each sub-issue is designed to be self-contained (completable in one Claude Code session)
  and testable from the user's perspective.

  Trigger phrases: "/decompose", "decompose plan", "break down plan", "create issues from plan"
---

<!-- SDLC Shared Context: See plugins/sdlc/shared/CONTEXT.md for full documentation -->

## /decompose Command

Break down the current Claude Code plan into Linear sub-issues with E2E test criteria. This helps Claude Code handle complex tasks by splitting them into smaller, testable increments.

## Shared Context Management

**On every invocation, you MUST:**

1. **Check for `sdlc.md`** in the current working directory
2. **If missing**, ask the user for team/project context
3. **Read shared sections** (Project Info, Team, Milestone) for Linear targeting
4. **Update sdlc.md** after creating issues with the new issue IDs

## Flow

```
1. Read sdlc.md for team/project context
2. Analyze the plan from conversation memory
3. Break into testable increments
4. Generate E2E tests for each increment
5. Ask: "Create new parent issue or attach to existing?"
6. Show preview with target team/project
7. Wait for user confirmation
8. Create issues in Linear
9. Update sdlc.md with created issue IDs
```

## Increment Guidelines

Each sub-issue MUST:
- **Deliver a testable artifact** - Something verifiable from user's perspective
- **Be self-contained** - Claude Code can complete it in one session
- **Have E2E test criteria** - Format: "User can [action] and [expected result]"

When breaking down:
- Prefer smaller increments over larger ones (Claude Code handles small tasks better)
- Each increment = one testable deliverable
- Consider dependencies between increments
- Order by dependency chain (what must be done first)

## E2E Test Format

For each increment, include:
- **Happy path**: 1-2 user scenarios
- **Edge cases**: 1-2 boundary conditions
- Format: `- [ ] User can [action] and [expected result]`

## Sub-Issue Description Template

When creating sub-issues, use this structure in the description:

```markdown
## Summary
[What this increment delivers]

## Deliverable
[The testable artifact - what can be demo'd/verified]

## E2E Test Scenarios

### Happy Path
- [ ] User can [action] and [expected result]
- [ ] [Additional scenario if needed]

### Edge Cases
- [ ] [Edge case scenario]

## Implementation Notes
[Relevant context from the original plan]

---
*Created from Claude Code plan via /decompose*
```

## Confirmation Protocol

Before creating any issues:
1. Show the proposed breakdown with titles and E2E tests
2. Display target: Team name, Project name
3. Ask: "Create new parent issue or attach to existing [ID]?"
4. Wait for explicit confirmation
5. Only then create the issues
6. Report created issue IDs back to user

## Tool Usage

Use the Linear MCP tools to create issues:
- `mcp__plugin_linear_linear__create_issue` - Create issues with `parentId` for sub-issues
- `mcp__plugin_linear_linear__get_project` - Get project details
- `mcp__plugin_linear_linear__list_teams` - List available teams

## Examples

<example>
Context: User invokes /decompose after creating a plan.
user: "/decompose"
assistant: "I see we have a plan for [feature name]. Let me break it into testable increments.

Based on the plan, I propose these sub-issues:

**1. [First increment title]**
- Deliverable: [What can be tested]
- E2E: User can [action] and [expected result]

**2. [Second increment title]**
- Deliverable: [What can be tested]
- E2E: User can [action] and [expected result]

**Target:** Team 'Engineering', Project 'My Project'

Would you like to:
- Create a new parent issue for this work, or
- Attach these as sub-issues to an existing issue?

Please confirm and I'll create the issues."
</example>

<example>
Context: User wants to attach to existing issue.
user: "attach to MIX-123"
assistant: "I'll create these as sub-issues under MIX-123.

Creating:
1. MIX-124: [First increment] ✓
2. MIX-125: [Second increment] ✓

All sub-issues created and linked to MIX-123. Updated sdlc.md with the new issue IDs."
</example>
