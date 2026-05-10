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

## Agent & Tool Reference

| Agent | Subagent Type | When Used |
|-------|--------------|-----------|
| Code Review Dispatcher | `pr:code-review-dispatcher` | Phase 2.5 — plans fan-out |
| Code Reviewer | `pr:code-reviewer` | Phase 3 — parallel quality review |
| Security Reviewer | `pr:security-reviewer` | Phase 3 — if security-relevant files |
| UI/UX Reviewer | `pr:uiux-reviewer` | Phase 3 — if frontend files |
| Code Simplifier | `code-simplifier:code-simplifier` | Step 8 — simplification pass |

**Important:** Always use the exact `subagent_type` values from this table. If an agent type is unavailable at runtime, report the error to the user — do not substitute alternative names or skills.

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

#### Phase 1: Verify CandleKeep Availability (synchronous)

1. Check that CandleKeep CLI is installed and authenticated:
   ```bash
   ck auth whoami
   ```
2. If the command fails (not found, not authenticated, or errors) → skip the code review (Phases 2–6) and inform the user:
   > "CandleKeep CLI is not available or not authenticated. Skipping book-guided code review. Run `ck auth login` to enable it."
3. If successful → proceed to Phase 2. The review agents reference specific book IDs and will access them directly.

#### Phase 2: Prepare Diff & Select Adjunct Agents

1. Run `git diff <base-branch>...HEAD > /tmp/pr-review-diff.txt` and `git diff <base-branch>...HEAD --name-only > /tmp/pr-review-files.txt`.
2. Read `/tmp/pr-review-files.txt` and decide which adjunct (non-code-quality) agents to launch:
   - **If** files match `api/*, route.*, middleware/*, auth/*, webhook*, *.env*` → launch `security-reviewer` in Phase 3
   - **If** files match `*.tsx, *.jsx, *.css, *.html, components/*, pages/*, app/*` → launch `uiux-reviewer` in Phase 3
   - **If only** `*.md, docs/*, *.yml` → skip ALL review agents (including code-review fan-out) and proceed to Step 10

The code-review fan-out itself is decided dynamically in Phase 2.5, not here.

#### Phase 2.5: Plan Code Review Fan-Out (dispatcher)

Launch the dispatcher to decide how many parallel `code-reviewer` agents to spawn and which chapters of the Code Review book each owns. **Foreground, single agent.**

```
Agent tool call:
  subagent_type: "pr:code-review-dispatcher"
  prompt: |
    Plan the code review fan-out for this PR.
    diff_path:   /tmp/pr-review-diff.txt
    files_path:  /tmp/pr-review-files.txt
    book_id:     cmmwi3mo700vlta0zlbfqjtcb
    output_path: /tmp/pr-review-plan.json
    PR context:  [branch name, PR title/description from Step 5]
    Decide how many code-reviewer agents to spawn (1-6) and which chapters
    each owns so the whole Code Review book is covered exhaustively.
```

After the dispatcher completes, read `/tmp/pr-review-plan.json`. The `reviewers` array tells you exactly how many `code-reviewer` agents to launch in Phase 3 and what to put in each prompt.

#### Phase 3: Launch Review Agents (foreground, parallel)

Launch all agents in a **single message** (foreground — do NOT use `run_in_background`). Each writes structured findings to its own output file.

For each entry in the dispatcher plan's `reviewers` array, spawn one `code-reviewer` agent. Plus the security/uiux reviewers selected in Phase 2.

```
For each reviewer in plan.reviewers — Agent tool call:
  subagent_type: "pr:code-reviewer"
  prompt: |
    reviewer_id:  {reviewer.id}
    focus:        {reviewer.focus}
    chapters:     {reviewer.chapters}
    diff_path:    /tmp/pr-review-diff.txt
    output_path:  {reviewer.output_path}
    PR context:   [branch name, PR title/description from Step 5]

Agent tool call (if security-relevant files detected in Phase 2):
  subagent_type: "pr:security-reviewer"
  prompt: |
    Review the code diff at /tmp/pr-review-diff.txt for security issues
    using the Web Application Security book (cmmj33tuj00pumw01eqmthzdh).
    PR context: [branch name, PR title/description]
    Write your complete review to /tmp/pr-review-security.md

Agent tool call (if UI-relevant files detected in Phase 2):
  subagent_type: "pr:uiux-reviewer"
  prompt: |
    Review the code diff at /tmp/pr-review-diff.txt for UI/UX issues
    using the UI/UX Design Principles book (cmmfdl2z503qep10zhi9dp1m4).
    PR context: [branch name, PR title/description]
    Write your complete review to /tmp/pr-review-uiux.md
```

Wait for all agents to complete. Read all output files.

#### Phase 4: Consolidate Findings

1. Read every `/tmp/pr-review-quality-*.md` file (one per code-reviewer in the dispatcher plan), plus `/tmp/pr-review-security.md` (if exists) and `/tmp/pr-review-uiux.md` (if exists).
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
