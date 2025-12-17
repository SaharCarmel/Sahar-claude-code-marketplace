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

# Only trigger for plan files
if [[ "$FILE_PATH" == "$HOME/.claude/plans/"* ]]; then
  PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
  SCRIPTS_DIR="$PLUGIN_ROOT/skills/plan-collab/scripts"

  # Run server start and plan open in background subshell
  # This allows the hook to exit quickly and avoid timeout issues
  (
    node "$SCRIPTS_DIR/cli.js" start-server --no-browser >/dev/null 2>&1 || true
    sleep 1
    node "$SCRIPTS_DIR/cli.js" open-plan "$FILE_PATH" >/dev/null 2>&1 || true
  ) &
  disown
fi

exit 0
