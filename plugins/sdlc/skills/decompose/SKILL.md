---
name: decompose
description: |
  Break down a Claude Code plan into Linear sub-issues with E2E test criteria. Use when: user says "decompose", "break down plan", "create issues from plan", or after completing a plan that needs to be tracked in Linear. Each sub-issue is self-contained (completable in one Claude Code session) and testable from the user's perspective.
---

## Flow

1. Check `sdlc.md` for team/project context (ask user if missing or ambiguous)
2. Analyze plan from conversation memory
3. Break into testable increments
4. Generate E2E tests for each increment
5. Show preview and ask: "Create new parent or attach to existing?"
6. Confirm target (team/project) before creating
7. Create issues in Linear with `parentId` for sub-issues
8. Update `sdlc.md` with created issue IDs

## Increment Rules

Each sub-issue MUST:
- Deliver one testable artifact (something demo-able)
- Be completable by Claude Code in one session
- Include E2E test criteria

Prefer smaller over larger. Order by dependency chain.

## E2E Test Format

```
### Happy Path
- [ ] User can [action] and [expected result]

### Edge Cases
- [ ] [boundary condition scenario]
```

## Sub-Issue Template

```markdown
## Summary
[What this delivers]

## Deliverable
[The testable artifact]

## E2E Test Scenarios
### Happy Path
- [ ] User can [action] and [expected result]

### Edge Cases
- [ ] [Edge case]

## Implementation Notes
[Context from plan]
```

## Examples

<example>
user: "/decompose"
assistant: "I see a plan for [feature]. Breaking into testable increments:

**1. [Title]**
- Deliverable: [artifact]
- E2E: User can [action] and [result]

**2. [Title]**
- Deliverable: [artifact]
- E2E: User can [action] and [result]

**Target:** Team 'Engineering', Project 'My Project'

Create new parent issue or attach to existing?"
</example>

<example>
user: "attach to MIX-123"
assistant: "Creating sub-issues under MIX-123:
1. MIX-124: [Title] ✓
2. MIX-125: [Title] ✓

Done. Updated sdlc.md."
</example>
