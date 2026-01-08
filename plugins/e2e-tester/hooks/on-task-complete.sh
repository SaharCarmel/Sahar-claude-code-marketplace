#!/bin/bash
# E2E Tester Hook - Triggered on TodoWrite
# Checks if all todos are complete and signals readiness for E2E testing

# Create log directory
mkdir -p ~/.e2e-tester

# Read input from stdin
INPUT=$(cat)

# Handle empty input gracefully
if [ -z "$INPUT" ]; then
  exit 0
fi

# Parse TodoWrite output to check if all todos are complete
TODOS=$(echo "$INPUT" | jq -r '.tool_input.todos // empty' 2>/dev/null)

if [ -z "$TODOS" ]; then
  exit 0
fi

# Count total and completed todos
TOTAL=$(echo "$TODOS" | jq 'length')
COMPLETED=$(echo "$TODOS" | jq '[.[] | select(.status == "completed")] | length')

# Check if all todos are complete
if [ "$TOTAL" -gt 0 ] && [ "$TOTAL" -eq "$COMPLETED" ]; then
  # All todos complete - create marker file
  TIMESTAMP=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)

  cat > ~/.e2e-tester/task-complete.json << EOF
{
  "status": "ready_for_e2e",
  "timestamp": "$TIMESTAMP",
  "totalTodos": $TOTAL,
  "completedTodos": $COMPLETED
}
EOF

  # Output context for Claude
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "E2E TESTER: All tasks complete! You should now generate E2E tests for the feature you just implemented.\n\nUse the e2e-tester skill to:\n1. Generate contextual E2E test cases based on what you built\n2. Start the testing webapp for the user to verify\n3. Monitor results and fix any failures\n\nRun: node cli.js generate-tests --feature \"<feature description>\""
  }
}
EOF
fi

exit 0
