#!/bin/bash
# Plan-Collab Hook Script
# Triggered by PostToolUse hook when Claude writes to ~/.claude/plans/
# Auto-starts server and opens plan in browser

set -e

# Read hook input from stdin
INPUT=$(cat)

# Extract file path from the tool input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Handle ~ expansion
FILE_PATH="${FILE_PATH/#\~/$HOME}"

# Check if this is a plan file
if [[ "$FILE_PATH" == "$HOME/.claude/plans/"* ]]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

  # Start server if not running (in background, silently)
  node "$SCRIPT_DIR/cli.js" start-server --no-browser >/dev/null 2>&1 || true

  # Small delay to ensure server is ready
  sleep 1

  # Open the plan in browser
  node "$SCRIPT_DIR/cli.js" open-plan "$FILE_PATH" >/dev/null 2>&1 &
fi

exit 0
