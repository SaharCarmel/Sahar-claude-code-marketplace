#!/bin/bash
# Plan review hook - triggered by AskUserQuestion or ExitPlanMode
# Auto-opens plan-collab for collaborative review

set -e

# Read hook input from stdin (JSON format per Claude Code docs)
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only proceed if we have a tool name
[[ -z "$TOOL_NAME" ]] && exit 0

# Use CLAUDE_PLUGIN_ROOT for portable paths
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
SCRIPTS_DIR="$PLUGIN_ROOT/skills/plan-collab/scripts"

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

# Start server if not running (idempotent, background)
node "$SCRIPTS_DIR/cli.js" start-server --no-browser >/dev/null 2>&1 || true
sleep 1

# Open browser only once per plan
if [[ ! -f "$FLAG_FILE" ]]; then
  node "$SCRIPTS_DIR/cli.js" open-plan "$PLAN_PATH" >/dev/null 2>&1 &
  mkdir -p "$FLAG_DIR"
  touch "$FLAG_FILE"
fi

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
