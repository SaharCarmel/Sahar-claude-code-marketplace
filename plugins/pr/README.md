# pr

**One command from "I'm done" to "PR is up and the code is better than when I started."**

Stop running `git status`, `bun run typecheck`, `bun run build`, `bun run lint`, `git push`, `gh pr create`, then babysitting a code review. The `pr` skill chains all of it into a single, opinionated workflow that ends with a pushed PR, a curated QA checklist, and an automatic code review whose findings have already been fixed.

## The Problem

- Creating a PR is 8+ tedious steps every time
- Quality gates (typecheck, build, lint) are easy to skip when you're tired
- PR descriptions either get rushed or skipped entirely
- Code reviews surface findings *after* the PR is up — and most of them never get fixed
- Your QA checklist is the same generic boilerplate, not tied to what actually changed

## What It Does

`/pr` runs a 10-step workflow:

| Step | What happens |
|------|--------------|
| 1. **Branch confirmation** | Detects current branch, confirms base, refuses `main → main` |
| 2. **Pre-flight** | Checks for changes vs. unpushed commits |
| 3. **Commit** | Stages files explicitly (never `-A`/`.`), conventional commit message |
| 4. **Quality gates** | Runs typecheck/build/lint with best-effort auto-fix (max 2 attempts each) |
| 5. **Push & create PR** | Pushes branch, generates PR title + body from the actual diff |
| 6. **QA checklist** | Generates QA items tailored to the diff (UI, API, CLI, migrations, etc.) |
| 7. **Seed data** | If repo has Railway PR environments, creates/uses seed scripts |
| 8. **Code simplifier** | Launches `code-simplifier` agent in background to refine the diff |
| 9. **CandleKeep code review** | Runs parallel review agents (quality + security + UI/UX), then **fixes ALL findings** automatically and pushes |
| 10. **Update PR** | Appends review results to the PR description |

## Installation

```
/plugin install pr@sahar-marketplace
```

## Usage

```
/pr
```

Or trigger by intent:

- "create a PR"
- "open a pull request"
- "submit my changes"
- "push and create PR"
- "finalize my work"

Works from both the main repo and git worktrees.

## Dependencies

This skill is opinionated and assumes a specific stack. Some steps degrade gracefully when tools aren't present, others will fail or skip.

| Tool | Used in step | Required? |
|------|-------------|-----------|
| `git` | All | Required |
| `gh` (GitHub CLI) | 5, 10 | Required |
| `bun` | 4 (quality gates) | Skipped if not a JS project |
| `cargo` | 4 (only if `apps/cli/` exists) | Skipped otherwise |
| `code-simplifier` agent | 8 | Skipped if not installed |
| **CandleKeep** (`ck` CLI + library books) | 9 | **Skipped with notice if not installed** |
| `code-reviewer` / `security-reviewer` / `uiux-reviewer` agents | 9 | Required for Step 9 |

### About Step 9 (CandleKeep code review)

Step 9 reads books from your [CandleKeep](https://getcandlekeep.com) library — specifically books on code review, security, and UI/UX design — and uses them as the source of truth for the review. If you don't have CandleKeep installed or don't have any review-related books in your library, the skill detects this and skips the step with a message telling you what to add.

To enable Step 9:

1. Install the CandleKeep CLI: see [getcandlekeep.com](https://getcandlekeep.com)
2. Add at least one book matching keywords: *"code review", "clean code", "security", "design principles", "accessibility"*
3. Make sure the `code-reviewer`, `security-reviewer`, and `uiux-reviewer` agents are available

Without CandleKeep, you still get Steps 1–8 and 10 — a fully automated "commit → quality gates → PR → simplify" pipeline.

## Philosophy

> Every PR leaves the code measurably better than it found it.

When review agents surface findings at any severity, the skill fixes them before the PR is considered done. No "out of scope," no deferrals. Over time, every PR improves the surrounding code health, not just the feature it touches.
