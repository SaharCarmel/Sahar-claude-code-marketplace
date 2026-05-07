---
name: pr
description: >-
  This skill should be used when the user asks to "create a PR",
  "open a pull request", "submit my changes", "push and create PR",
  "finalize my work", "/pr", or wants to commit, validate, and push
  their current branch as a pull request. Handles the full workflow:
  commit all changes, run quality gates with best-effort fixes,
  create PR with curated QA checklist, launch code-simplifier, and
  run a CandleKeep code review that consults your library's code
  review books to apply their guidelines to the PR diff.
  Works from both main repo and worktrees.
---

## Full PR Workflow

Execute all steps sequentially. Stop and report on failure unless noted otherwise.

### Step 1: Branch Confirmation

1. Run `git branch --show-current` to identify the current branch.
2. Ask the user which branch to target as base (default: `main`).
3. If on `main`, prompt to create/switch to a feature branch — never PR main→main.

### Step 2: Pre-flight Check

1. Run `git status` (never `-uall`) to assess working tree state.
2. If zero changes AND no unpushed commits (`git log <base>..HEAD` is empty) → abort, inform user "nothing to submit".
3. If only unpushed commits exist (no uncommitted changes) → skip to Step 4.

### Step 3: Commit All Changes

1. Run `git status` to enumerate modified, deleted, and untracked files.
2. Exclude sensitive files (`.env*`, `credentials*`, `*.key`, `*.pem`, secrets). Warn user if any are found.
3. Stage files explicitly by name: `git add file1 file2 ...` — **never** `git add .` or `-A`.
4. Check `git log --oneline -5` for commit message style.
5. Create a conventional commit (`feat:`, `fix:`, `chore:`) using HEREDOC format.
6. Include `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`.

### Step 4: Quality Gates (best-effort fixes)

Run sequentially. For each gate: run check → on failure, analyze errors and attempt fix → re-run → if fixed, stage and commit (`fix: resolve <gate> errors`) → after max attempts, stop and report.

| Gate | Command | Max Fix Attempts | Condition |
|------|---------|-----------------|-----------|
| Typecheck | `bun run typecheck` | 2 | Always |
| Build | `bun run build` | 2 | Always |
| Lint | `bun run lint` | 2 | Always |
| Cargo check | `cd apps/cli && cargo check` | 1 | Only if `apps/cli/` has changes |

After all gates, if any still failing:
- Report remaining failures clearly with error output.
- Ask user: "Proceed despite failures, or abort?"

> **Note on worktrees**: Quality gates may fail in worktrees due to missing `node_modules` or generated files (Prisma client). If all errors are in files unrelated to the diff and trace back to missing dependencies, report this clearly and proceed — these are environment gaps, not regressions introduced by the PR.

### Step 5: Push & Create PR

1. Push: `git push -u origin <branch-name>`.
2. Analyze all commits since base: `git log <base>..HEAD` and `git diff <base>...HEAD`.
3. Generate PR title: under 70 chars, conventional commit prefix.
4. Create PR with `gh pr create` using HEREDOC body containing all sections below.
5. Share the PR URL with user.

**PR body template** (populate from actual diff analysis):

```markdown
## Summary
- (2-4 bullets: what changed and why)

## Root Cause / Motivation
(Why this work was needed)

## What Changed
| File | Change |
|------|--------|
| `path/file` | Brief explanation |

## Design Decisions
(Non-obvious choices and rejected alternatives — omit section if none)

## Testing
- [ ] Typecheck: PASS/FAIL
- [ ] Build: PASS/FAIL
- [ ] Lint: PASS/FAIL
- [ ] Cargo check: PASS/FAIL/N/A

## QA Checklist
(Generated in Step 6)

<details>
<summary>Implementation Plan</summary>
(Attach if a plan exists in current session, otherwise omit)
</details>
```

### Step 6: Manual QA Checklist

Generate QA items based on the **actual diff**, not a generic template. Use markdown checkboxes. Include in the PR body under `## QA Checklist`.

| Changed area | QA items to generate |
|-------------|---------------------|
| Webapp pages/components | "Navigate to [page], verify [behavior], check responsive layout" |
| API routes | "Call [endpoint] with [payload], verify response shape" |
| CLI (`apps/cli/`) | "Run `ck [command]`, verify output" + note: **CLI release needed after merge** |
| DB migrations | "Run `bun run db:migrate` locally, verify schema in Prisma Studio" |
| Extension | "Load unpacked extension, test on [specific site]" |
| UI/styling | "Visual check Chrome + Safari, dark/light mode" |
| Cross-component | Add integration verification steps between affected components |

### Step 7: PR Environment Seeding

After PR creation, check if the repo has Railway PR deploy environments configured.

1. Check for `[environments.pr.deploy]` in `railway.toml`. If absent → skip this step.
2. Review the diff to determine what seed data would help a QA tester verify the changes. Consider:
   - New DB models/fields → seed rows that exercise them
   - New UI pages/features → seed data that makes the page non-empty
   - New API endpoints → seed entities the endpoints will operate on
3. Check existing seed scripts in `apps/webapp/prisma/seed*.ts` and `package.json` (`db:seed*` scripts).
4. If an existing seed script covers the need → add a note in the PR body under `## PR Environment` with the command to run (e.g., `bun run db:seed-gifting`).
5. If no existing script fits and the changes warrant test data:
   - Create or update a seed script in `apps/webapp/prisma/` targeting the changed models.
   - Add a `db:seed-<name>` script to `apps/webapp/package.json` if new.
   - Stage, commit (`chore: add seed data for PR environment`), and push.
6. Add a `## PR Environment` section to the PR body:

```markdown
## PR Environment
Once the PR environment deploys, run:
\`\`\`bash
DATABASE_URL=<pr-env-db-url> bun run db:seed-<name>
\`\`\`
Test data created: (describe what entities/records are seeded and why)
```

7. If the changes are purely cosmetic, config-only, or don't touch data models → skip seeding and note "No seed data needed" in the PR body.

### Step 8: Launch Code Simplifier

After PR creation succeeds, launch in background:

```
Agent tool (run_in_background: true):
  subagent_type: "code-simplifier:code-simplifier"
  prompt: "Review and simplify the code changes on the current branch.
    Run git diff <base-branch>...HEAD to identify changed files.
    Apply simplifications that improve clarity and maintainability
    without changing behavior. If improvements are made, commit with
    message 'refactor: code simplification pass' including
    Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>,
    then git push."
```

Inform user: "Code-simplifier is running in background — any improvements will appear as additional commits on the PR."

### Step 9: CandleKeep Code Review + Fix All Findings

After the code-simplifier is launched, run a structured code review using CandleKeep's specialized review agents, then **fix ALL findings**.

#### Phase 1: Scan Library (synchronous)

1. Run `ck items list --json` to list all books in the CandleKeep library.
2. Filter results for books whose title or subject matches any of these keywords (case-insensitive): "code review", "coding standards", "best practices", "clean code", "style guide", "refactoring", "security", "web application security", "UI", "UX", "design principles", "accessibility".
3. If **zero** relevant books are found → skip this step and inform the user:
   > "No code review books found in your CandleKeep library. To enable this step, add books on code review, clean code, security, or design principles to your library."
4. If relevant books are found → proceed to Phase 2.

#### Phase 2: Prepare Diff & Select Agents

1. Run `git diff <base-branch>...HEAD > /tmp/pr-review-diff.txt` and `git diff <base-branch>...HEAD --name-only > /tmp/pr-review-files.txt`.
2. Read `/tmp/pr-review-files.txt` and select which agents to launch:
   - **Always**: `code-reviewer` — covers 186 rules across 16 chapters
   - **If** files match `api/*, route.*, middleware/*, auth/*, webhook*, *.env*` → also launch `security-reviewer`
   - **If** files match `*.tsx, *.jsx, *.css, *.html, components/*, pages/*, app/*` → also launch `uiux-reviewer`
   - **If only** `*.md, docs/*, *.yml` → skip agents, do a quick manual review and proceed

#### Phase 3: Launch Review Agents (foreground, parallel)

Launch all selected agents in a **single message** (foreground — do NOT use `run_in_background`). Each agent writes structured findings to its own output file.

```
Agent tool call 1 (always):
  subagent_type: "code-reviewer"
  prompt: |
    Review the code diff at /tmp/pr-review-diff.txt using the Code Review
    for AI Agents book (cmmwi3mo700vlta0zlbfqjtcb).
    PR context: [branch name, PR title/description from Step 5]
    File list: [contents of /tmp/pr-review-files.txt]
    Write your complete review to /tmp/pr-review-quality.md

Agent tool call 2 (if security-relevant files detected):
  subagent_type: "security-reviewer"
  prompt: |
    Review the code diff at /tmp/pr-review-diff.txt for security issues
    using the Web Application Security book (cmmj33tuj00pumw01eqmthzdh).
    PR context: [branch name, PR title/description]
    Write your complete review to /tmp/pr-review-security.md

Agent tool call 3 (if UI-relevant files detected):
  subagent_type: "uiux-reviewer"
  prompt: |
    Review the code diff at /tmp/pr-review-diff.txt for UI/UX issues
    using the UI/UX Design Principles book (cmmfdl2z503qep10zhi9dp1m4).
    PR context: [branch name, PR title/description]
    Write your complete review to /tmp/pr-review-uiux.md
```

Wait for all agents to complete. Read all output files.

#### Phase 4: Consolidate Findings

1. Read `/tmp/pr-review-quality.md`, `/tmp/pr-review-security.md` (if exists), and `/tmp/pr-review-uiux.md` (if exists).
2. Build a **master findings list** ordered by severity (CRITICAL → HIGH → MEDIUM → LOW).
3. Deduplicate: if the same file:line appears in multiple reviews, merge into one finding with the higher severity.
4. Display the consolidated review to the user:

```
## CandleKeep Code Review — [N] Findings

| # | Severity | File | Issue | Rule |
|---|----------|------|-------|------|
| 1 | HIGH | path:line | Description | Rule X.Y |
| 2 | MEDIUM | path:line | Description | Category |
...

Fixing all [N] findings now.
```

5. If zero findings → inform user "Code review passed — no findings" and skip to Step 10.

#### Phase 5: Fix ALL Findings

For each finding in the master list:

1. **Read the file** at the location specified in the finding.
2. **Apply the fix** described in the finding's suggestion. Use the Edit tool to make targeted changes.
3. **Verify the fix** does not break the surrounding code by reading context around the change.
4. If multiple findings affect the same file, batch all fixes for that file together.

**Rules — no exceptions:**
- Fix ALL findings regardless of severity (HIGH, MEDIUM, LOW). There is no "out of scope" or "deferred" category.
- If a finding touches code outside the PR diff, fix it anyway.
- If a finding's suggested fix is unclear, use best judgment to implement the spirit of the rule.
- If two findings conflict, prefer the higher-severity finding.
- Preserve existing functionality — fixes must be behavior-preserving.
- **Tests**: When a finding flags missing tests (e.g. rule 10.14), write **e2e or integration tests only** — never unit tests. If no e2e test infrastructure exists for the affected area, note this in the report.

#### Phase 6: Validate & Commit

1. Re-run quality gates to verify fixes didn't break anything:
   - `bun run typecheck` — if it fails, fix the type errors.
   - `bun run build` — if it fails, fix the build errors.
   - `bun run lint` — if it fails, fix the lint errors.
   - Max 2 fix attempts per gate (same pattern as Step 4).
2. Stage all changed files explicitly: `git add <file1> <file2> ...`
3. Commit with HEREDOC:
   ```
   git commit -m "$(cat <<'EOF'
   fix: address code review findings

   Applied fixes for [N] findings from CandleKeep code review:
   - [Brief summary of fixes by severity]

   Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
   EOF
   )"
   ```
4. Push: `git push`
5. Report to user:

```
## Code Review Findings — All Fixed

| # | Severity | File | Issue | Status |
|---|----------|------|-------|--------|
| 1 | HIGH | path:line | Description | FIXED |
| 2 | MEDIUM | path:line | Description | FIXED |
...

All [N] findings resolved and pushed.
```

> **Ethos**: Every PR leaves the code measurably better than it found it. When review agents surface findings at ANY severity, the only action is to fix them. There are no deferrals, no "out of scope" exceptions. The PR workflow is not done until every finding is resolved, validated, and pushed. This compounds: over time, each PR improves not just the feature it touches but the surrounding code health.

### Step 10: Update PR with Code Review Results

After all code review findings are fixed and pushed:

1. Update the PR body to append code review results using `gh pr edit <number> --body "..."`:

```markdown
## CandleKeep Code Review
**Status:** All findings resolved

| Domain | Findings | All Fixed |
|--------|----------|-----------|
| Code Quality | X | Yes |
| Security | X | Yes |
| UI/UX | X | Yes |

<details>
<summary>Review details</summary>

[Paste the consolidated findings table with FIXED status]

</details>
```

2. Inform the user: "PR updated with code review results. All [N] findings have been fixed and pushed."
