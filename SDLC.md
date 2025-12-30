# Software Development Lifecycle (SDLC) with Linear

This document describes the workflow for creating and managing development tasks using Linear as the project management tool.

## Linear Organization Structure

### Teams
- **candlekeep** - Main development team for Claude Code plugins

### Projects
- **Claude code plugins** - All plugin development work

### Labels
Labels are used to categorize issues by plugin or type:
- `plan-collab` - Issues related to the plan-collab plugin
- `entrepenuer-plugin` - Issues related to the entrepreneur plugin
- `Feature` - New feature requests
- `Bug` - Bug reports and fixes
- `Improvement` - Enhancements to existing functionality

---

## Workflow: Creating a New Issue

### 1. Identify the Work
Before creating an issue, ensure you have:
- Clear problem statement or feature description
- Understanding of the scope and affected components
- Any relevant research or design decisions

### 2. Create the Issue in Linear
Use the following structure when creating issues:

```
Team: candlekeep
Project: Claude code plugins
Labels: [plugin-name], [type: Feature/Bug/Improvement]
Title: Clear, concise description of the work
```

### 3. Issue Description Template

```markdown
## Problem
[Describe the problem or need]

## Solution
[Describe the proposed solution]

## Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Files to Modify
- `path/to/file1.ts`
- `path/to/file2.tsx`

## Testing Checklist
- [ ] Test case 1
- [ ] Test case 2
```

### 4. Issue States
Issues flow through the following states:
- **Backlog** - Not yet prioritized
- **Todo** - Prioritized and ready to work
- **In Progress** - Currently being worked on
- **In Review** - Code complete, awaiting review
- **Done** - Completed and merged

---

## Workflow: Working on an Issue

### 1. Start Work
- Move issue to "In Progress"
- Create a feature branch from main: `git checkout -b feature/[issue-identifier]-description`

### 2. Development
- Follow the implementation plan in the issue
- Update issue comments with progress and decisions
- Link relevant PRs to the issue

### 3. Code Review
- Create PR linking to the Linear issue
- Move issue to "In Review"
- Address review feedback

### 4. Completion
- Merge PR to main
- Move issue to "Done"
- Update any documentation

---

## Best Practices

### Issue Granularity
- Issues should represent 1-3 days of work
- Large features should be broken into sub-issues
- Each issue should have a clear definition of done

### Documentation
- Keep issue descriptions updated as work progresses
- Document design decisions and trade-offs
- Link to relevant resources (docs, research, dependencies)

### Communication
- Use issue comments for async discussion
- Tag relevant team members when needed
- Update status promptly to reflect actual progress

---

## Integration with Claude Code

When using Claude Code for development:

1. **Research Phase**: Use plan mode to explore the codebase and create implementation plans
2. **Planning**: Reference framework documentation (shadcn/ui, etc.) for best practices
3. **Implementation**: Follow the approved plan and update Linear with progress
4. **Verification**: Use task completion verification before marking issues as done

### Linear Commands in Claude Code
Claude Code integrates with Linear through MCP:
- `list_issues` - View current issues
- `create_issue` - Create new issues with labels and project assignment
- `update_issue` - Update issue status and details
- `list_comments` / `create_comment` - Manage issue discussions
