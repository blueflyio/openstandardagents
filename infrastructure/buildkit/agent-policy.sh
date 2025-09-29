#!/bin/bash
# OSSA Agent-First Policy Enforcement
# Prevents token waste by encouraging agent usage

set -e

# Load configuration
CONFIG_FILE="$(dirname "$0")/config.yaml"
TOKEN_THRESHOLD=${TOKEN_THRESHOLD:-500}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if task should use agents
check_agent_first_policy() {
    local task_description="$1"
    local estimated_tokens="${2:-0}"

    echo -e "${BLUE}🔍 Analyzing task:${NC} $task_description"
    echo -e "${BLUE}📊 Estimated tokens:${NC} $estimated_tokens"

    if [ "$estimated_tokens" -gt "$TOKEN_THRESHOLD" ]; then
        echo -e "${YELLOW}⚠️  LARGE TASK DETECTED (>$TOKEN_THRESHOLD tokens)${NC}"
        echo -e "${GREEN}💡 Recommendation: Use agents to prevent token waste${NC}"
        echo ""
        echo "Suggested OSSA commands:"
        echo "  ossa agents list --search '$task_description'"
        echo "  ossa agents spawn --type worker --task '$task_description'"
        echo "  ossa orchestrate --multi-agent --task '$task_description'"
        echo ""
        echo "Agent BuildKit commands:"
        echo "  buildkit agents list --capability '$task_description'"
        echo "  buildkit agents coordinate --multi-agent"
        echo ""
        read -p "Continue with manual implementation? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}✅ Good choice! Use agents for better token efficiency.${NC}"
            exit 1
        fi
        echo -e "${YELLOW}⚠️  Proceeding with manual implementation (token inefficient)${NC}"
    fi

    # Check for repetitive patterns
    if echo "$task_description" | grep -i -E "(multi-file|database|api.*integration|test.*generation|deployment|refactor|documentation|migrate)" >/dev/null; then
        echo -e "${BLUE}🤖 AGENT-RECOMMENDED:${NC} This task type benefits from agent automation"
        local agent_type=""

        # Determine agent type based on task
        if echo "$task_description" | grep -i "test" >/dev/null; then
            agent_type="critic"
        elif echo "$task_description" | grep -i "database\|api" >/dev/null; then
            agent_type="integrator"
        elif echo "$task_description" | grep -i "monitor\|metric" >/dev/null; then
            agent_type="monitor"
        elif echo "$task_description" | grep -i "orchestrat\|workflow" >/dev/null; then
            agent_type="orchestrator"
        else
            agent_type="worker"
        fi

        echo -e "   ${GREEN}Recommended agent type:${NC} $agent_type"
        echo -e "   ${BLUE}Command:${NC} ossa agents spawn --type $agent_type --task '$task_description'"
    fi
}

# Token optimization suggestions
optimize_tokens() {
    echo -e "${GREEN}💰 TOKEN OPTIMIZATION ACTIVE${NC}"
    echo ""
    echo "OSSA Agent Commands:"
    echo "  ossa agents list              - Show available agents"
    echo "  ossa agents spawn             - Create task-specific agent"
    echo "  ossa orchestrate              - Multi-agent workflows"
    echo "  ossa agents status            - Check agent availability"
    echo ""
    echo "BuildKit Integration:"
    echo "  buildkit agents coordinate    - Coordinate multiple agents"
    echo "  buildkit monitor status       - Check system health"
    echo ""
    echo -e "${GREEN}🎯 Remember: Agents prevent token waste on complex tasks!${NC}"
}

# Validate task before execution
validate_task() {
    local task_type="$1"
    local task_description="$2"

    echo -e "${BLUE}📋 Validating task type:${NC} $task_type"

    case "$task_type" in
        orchestrator|worker|monitor|critic|governor|integrator|judge)
            echo -e "${GREEN}✅ Valid agent type${NC}"
            ;;
        *)
            echo -e "${RED}❌ Invalid agent type: $task_type${NC}"
            echo "Valid types: orchestrator, worker, monitor, critic, governor, integrator, judge"
            exit 1
            ;;
    esac
}

# Main execution
case "$1" in
    --check)
        check_agent_first_policy "$2" "${3:-0}"
        ;;
    --optimize)
        optimize_tokens
        ;;
    --validate)
        validate_task "$2" "$3"
        ;;
    --help|-h)
        echo "OSSA Agent-First Policy Enforcement"
        echo ""
        echo "Usage:"
        echo "  $0 --check 'task description' [estimated_tokens]"
        echo "  $0 --optimize                 - Show token optimization tips"
        echo "  $0 --validate type 'task'     - Validate agent type for task"
        echo "  $0 --help                     - Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  TOKEN_THRESHOLD - Token count threshold (default: 500)"
        ;;
    *)
        echo -e "${RED}Error: Invalid option${NC}"
        echo "Use '$0 --help' for usage information"
        exit 1
        ;;
esac