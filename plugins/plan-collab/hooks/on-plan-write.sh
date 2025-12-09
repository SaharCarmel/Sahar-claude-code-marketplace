#!/bin/bash
# Plan write hook - triggered when Claude writes to ~/.claude/plans/
# Auto-starts server and opens plan in browser

set -e

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Handle ~ expansion
FILE_PATH="${FILE_PATH/#\~/$HOME}"

# Only trigger for plan files
if [[ "$FILE_PATH" == "$HOME/.claude/plans/"* ]]; then
  PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
  SCRIPTS_DIR="$PLUGIN_ROOT/skills/plan-collab/scripts"

  # Start server if not running
  node "$SCRIPTS_DIR/cli.js" start-server --no-browser >/dev/null 2>&1 || true
  sleep 1

  # Open plan in browser
  node "$SCRIPTS_DIR/cli.js" open-plan "$FILE_PATH" >/dev/null 2>&1 &
fi

exit 0
