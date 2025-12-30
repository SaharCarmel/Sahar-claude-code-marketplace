#!/bin/bash
# Plan review hook - triggered by AskUserQuestion or ExitPlanMode
# Auto-opens plan-collab for collaborative review

# Don't use set -e - we want graceful handling of errors

# DEBUG LOGGING
mkdir -p ~/.plan-collab
echo "[$(date)] ===== on-plan-review.sh triggered =====" >> ~/.plan-collab/hook-debug.log

# Read hook input from stdin (JSON format per Claude Code docs)
INPUT=$(cat)

# Validate stdin - exit gracefully if empty (race condition workaround)
if [ -z "$INPUT" ]; then
  echo "[$(date)] ERROR: Empty input received, exiting gracefully" >> ~/.plan-collab/hook-debug.log
  exit 0
fi

echo "[$(date)] Input: $INPUT" >> ~/.plan-collab/hook-debug.log

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
echo "[$(date)] TOOL_NAME: $TOOL_NAME" >> ~/.plan-collab/hook-debug.log

# Only proceed if we have a tool name
[[ -z "$TOOL_NAME" ]] && exit 0

# Use CLAUDE_PLUGIN_ROOT for portable paths
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
SCRIPTS_DIR="$PLUGIN_ROOT/skills/plan-collab/scripts"

# Capture project context from current working directory
PROJECT_NAME=""
PROJECT_URL=""

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  # Get remote URL
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
  if [[ -n "$REMOTE_URL" ]]; then
    # Parse SSH: git@github.com:org/repo.git -> org/repo
    if [[ "$REMOTE_URL" =~ ^git@[^:]+:(.+)\.git$ ]]; then
      PROJECT_NAME="${BASH_REMATCH[1]}"
    # Parse HTTPS: https://github.com/org/repo.git -> org/repo
    elif [[ "$REMOTE_URL" =~ ^https?://[^/]+/(.+)(\.git)?$ ]]; then
      PROJECT_NAME="${BASH_REMATCH[1]%.git}"
    fi
    PROJECT_URL="$REMOTE_URL"
  fi
  # Fallback to repo root folder name
  if [[ -z "$PROJECT_NAME" ]]; then
    GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
    PROJECT_NAME=$(basename "$GIT_ROOT")
  fi
else
  # Not git - use current directory name
  PROJECT_NAME=$(basename "$(pwd)")
fi

echo "[$(date)] PROJECT_NAME: $PROJECT_NAME" >> ~/.plan-collab/hook-debug.log

# Get active plan from config or find most recent
get_active_plan() {
  local config_file="$HOME/.plan-collab/config.json"
  if [[ -f "$config_file" ]]; then
    local plan=$(jq -r '.activePlan // empty' "$config_file" 2>/dev/null)
    if [[ -n "$plan" && -f "$plan" ]]; then
      echo "$plan"
      return
    fi
  fi

  # Fall back to most recent plan file
  ls -t "$HOME/.claude/plans/"*.md 2>/dev/null | head -1
}

PLAN_PATH=$(get_active_plan)

# Exit silently if no plan found
[[ -z "$PLAN_PATH" || ! -f "$PLAN_PATH" ]] && exit 0

# Browser flag to prevent duplicate opens (per-plan hash)
FLAG_DIR="$HOME/.plan-collab"
PLAN_HASH=$(echo -n "$PLAN_PATH" | md5 -q 2>/dev/null || echo -n "$PLAN_PATH" | md5sum | cut -d' ' -f1)
FLAG_FILE="$FLAG_DIR/browser_opened_$PLAN_HASH"

# Run server start and plan open in background subshell
# This allows the hook to exit quickly and avoid timeout issues
(
  # Start server if not running (idempotent)
  node "$SCRIPTS_DIR/cli.js" start-server --no-browser >/dev/null 2>&1 || true
  sleep 1

  # Open browser only once per plan
  if [[ ! -f "$FLAG_FILE" ]]; then
    node "$SCRIPTS_DIR/cli.js" open-plan "$PLAN_PATH" --project-name "$PROJECT_NAME" --project-url "$PROJECT_URL" >/dev/null 2>&1 || true
    mkdir -p "$FLAG_DIR"
    touch "$FLAG_FILE"
  fi
) &
disown

# Output JSON with additionalContext for Mermaid guidance
# Exit code 0 + JSON output = structured hook response
cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "PLAN COLLABORATION: The plan has been opened in your browser for review.\n\nTIP: Enhance your plan with Mermaid diagrams:\n- flowchart TD: System architecture, decision trees\n- sequenceDiagram: API interactions, component communication\n- stateDiagram-v2: State transitions, workflows\n- erDiagram: Database schema, entity relationships\n\nExample:\n```mermaid\nflowchart TD\n    A[Input] --> B{Process}\n    B -->|Success| C[Output]\n    B -->|Error| D[Handle]\n```"
  }
}
EOF
