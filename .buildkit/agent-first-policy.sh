#!/bin/bash
# Agent-First Policy Enforcement
# Prevents token waste by encouraging agent usage

set -e

BUILDKIT_CONFIG=".buildkit/branching-workflow.json"
TOKEN_THRESHOLD=500

# Check if task should use agents
check_agent_first_policy() {
    local task_description="$1"
    local estimated_tokens="$2"
    
    echo "🔍 Analyzing task: $task_description"
    echo "📊 Estimated tokens: $estimated_tokens"
    
    if [ "$estimated_tokens" -gt "$TOKEN_THRESHOLD" ]; then
        echo "⚠️  LARGE TASK DETECTED (>$TOKEN_THRESHOLD tokens)"
        echo "💡 Recommendation: Use agents to prevent token waste"
        echo ""
        echo "Suggested commands:"
        echo "  buildkit agents list --search '$task_description'"
        echo "  buildkit agents spawn --type worker --task '$task_description'"
        echo "  buildkit agents coordinate --multi-agent"
        echo ""
        read -p "Continue with manual implementation? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "✅ Good choice! Use agents for better token efficiency."
            exit 1
        fi
        echo "⚠️  Proceeding with manual implementation (token inefficient)"
    fi
    
    # Check for repetitive patterns
    if echo "$task_description" | grep -i -E "(multi-file|database|api.*integration|test.*generation|deployment|refactor)" >/dev/null; then
        echo "🤖 AGENT-RECOMMENDED: This task type benefits from agent automation"
        echo "   Consider: buildkit agents spawn --type $(echo "$task_description" | head -c 20)"
    fi
}

# Token optimization suggestions
optimize_tokens() {
    echo "💰 TOKEN OPTIMIZATION ACTIVE"
    echo ""
    echo "Available agent commands:"
    echo "  buildkit agents list              - Show available agents"
    echo "  buildkit agents spawn             - Create task-specific agent"
    echo "  buildkit agents coordinate        - Multi-agent workflows"
    echo "  buildkit agents status            - Check agent availability"
    echo ""
    echo "🎯 Remember: Agents prevent token waste on complex tasks!"
}

# Main execution
if [ "$1" = "--check" ]; then
    check_agent_first_policy "$2" "$3"
elif [ "$1" = "--optimize" ]; then
    optimize_tokens
else
    echo "Agent-First Policy Enforcement"
    echo "Usage: $0 --check 'task description' estimated_tokens"
    echo "       $0 --optimize"
fi
