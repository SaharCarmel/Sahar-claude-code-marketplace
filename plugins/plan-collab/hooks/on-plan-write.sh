#!/bin/bash
# Plan write hook - triggered when Claude writes to ~/.claude/plans/
# Auto-starts server and opens plan in browser

# Don't use set -e - we want graceful handling of errors

# DEBUG LOGGING
mkdir -p ~/.plan-collab
echo "[$(date)] ===== on-plan-write.sh triggered =====" >> ~/.plan-collab/hook-debug.log

INPUT=$(cat)

# Validate stdin - exit gracefully if empty (race condition workaround)
if [ -z "$INPUT" ]; then
  echo "[$(date)] ERROR: Empty input received, exiting gracefully" >> ~/.plan-collab/hook-debug.log
  exit 0
fi

echo "[$(date)] Input: $INPUT" >> ~/.plan-collab/hook-debug.log

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
echo "[$(date)] FILE_PATH: $FILE_PATH" >> ~/.plan-collab/hook-debug.log

# Handle ~ expansion
FILE_PATH="${FILE_PATH/#\~/$HOME}"

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

# Only trigger for plan files
if [[ "$FILE_PATH" == "$HOME/.claude/plans/"* ]]; then
  PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
  SCRIPTS_DIR="$PLUGIN_ROOT/skills/plan-collab/scripts"

  # Run server start and plan open in background subshell
  # This allows the hook to exit quickly and avoid timeout issues
  (
    node "$SCRIPTS_DIR/cli.js" start-server --no-browser >/dev/null 2>&1 || true
    sleep 1
    node "$SCRIPTS_DIR/cli.js" open-plan "$FILE_PATH" --project-name "$PROJECT_NAME" --project-url "$PROJECT_URL" >/dev/null 2>&1 || true
  ) &
  disown
fi

exit 0
