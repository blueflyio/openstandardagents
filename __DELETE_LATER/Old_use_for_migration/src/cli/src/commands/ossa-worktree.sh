#!/bin/bash
# OSSA Agent Orchestration – Branch & Worktree Management (Safe + Self-Cleaning)
# Usage: ./ossa-worktree.sh <REPO_NAME> <AGENT> <TASK>

set -euo pipefail

# Configuration
INTEGRATION_BRANCH="feature/0.1.0-agents-merge-$(date +%Y%m%d)"
WORKTREE_ROOT="LLM/.worktrees"
BACKUP_PREFIX="backup/auto-save"

# Input validation
if [ $# -ne 3 ]; then
    echo "Usage: $0 <REPO_NAME> <AGENT> <TASK>"
    echo "Example: $0 agent-router coder validation-function"
    exit 1
fi

REPO_NAME="$1"
AGENT="$2"
TASK="$3"
WT_NAME="${WORKTREE_ROOT}/${REPO_NAME}__${AGENT}__${TASK}"

echo "🚀 OSSA Agent Orchestration - Worktree Setup"
echo "Repository: ${REPO_NAME}"
echo "Agent: ${AGENT}"
echo "Task: ${TASK}"
echo "Worktree: ${WT_NAME}"
echo "Integration Branch: ${INTEGRATION_BRANCH}"
echo ""

# 0) SAFE BACKUP OF UNCOMMITTED CHANGES
echo "📋 Step 0: Backing up uncommitted changes..."
if ! git diff --quiet || ! git diff --cached --quiet; then
    TS=$(date +"%Y%m%d-%H%M%S")
    BACKUP_BRANCH="${BACKUP_PREFIX}-${TS}"
    echo "⚠️  Found uncommitted changes, creating backup branch: ${BACKUP_BRANCH}"
    
    git add -A
    git commit -m "WIP: autosave before creating worktree (${TS})" || true
    git branch "${BACKUP_BRANCH}"
    git push -u origin "${BACKUP_BRANCH}" || echo "⚠️  Warning: Could not push backup branch"
    echo "✅ Backup created: ${BACKUP_BRANCH}"
else
    echo "✅ No uncommitted changes found"
fi

# 1) SYNC BASE & INTEGRATION BRANCHES
echo ""
echo "🔄 Step 1: Syncing branches..."
git fetch --all --prune
git checkout feature/0.1.0
git pull --ff-only

if git rev-parse --verify "${INTEGRATION_BRANCH}" >/dev/null 2>&1; then
    echo "📝 Integration branch exists, rebasing on feature/0.1.0..."
    git checkout "${INTEGRATION_BRANCH}"
    git rebase feature/0.1.0
else
    echo "🆕 Creating new integration branch: ${INTEGRATION_BRANCH}"
    git checkout -b "${INTEGRATION_BRANCH}" feature/0.1.0
fi
git push -u origin "${INTEGRATION_BRANCH}"
echo "✅ Branches synchronized"

# 2) CREATE PER-AGENT WORKTREE
echo ""
echo "🏗️  Step 2: Creating agent worktree..."
mkdir -p "${WORKTREE_ROOT}"

# Remove existing worktree if it exists
if [ -d "${WT_NAME}" ]; then
    echo "⚠️  Existing worktree found, removing: ${WT_NAME}"
    git worktree remove -f "${WT_NAME}" || true
fi

git worktree add "${WT_NAME}" "${INTEGRATION_BRANCH}"
echo "✅ Worktree created: ${WT_NAME}"

# 3) CREATE OSSA AGENT ENVIRONMENT
echo ""
echo "🤖 Step 3: Setting up OSSA agent environment..."
cd "${WT_NAME}"

# Create .env file for agent configuration
cat > .env << EOF
# OSSA Agent Configuration
OSSA_REPO_NAME=${REPO_NAME}
OSSA_AGENT_TYPE=${AGENT}
OSSA_TASK_NAME=${TASK}
OSSA_WORKTREE_PATH=${WT_NAME}
OSSA_INTEGRATION_BRANCH=${INTEGRATION_BRANCH}
OSSA_TIMESTAMP=$(date -Iseconds)

# Agent Framework Configuration
LANGCHAIN_TRACING_V2=true
OPENAI_API_BASE=http://localhost:4000/v1
ANTHROPIC_API_BASE=http://localhost:4000/v1

# Token Budget Configuration
OSSA_TOKEN_BUDGET_TASK=12000
OSSA_TOKEN_BUDGET_SUBTASK=4000
OSSA_TOKEN_BUDGET_PLANNING=2000
EOF

# Create OSSA workspace structure
mkdir -p .agents-workspace/{config,agents,workflows,data,logs,metrics}

# Agent configuration template
cat > .agents-workspace/config/agent-config.yaml << EOF
# OSSA Agent Configuration for ${AGENT}
agentId: "${AGENT}-${TASK}-$(date +%Y%m%d-%H%M%S)"
agentType: "${AGENT}"
agentSubType: "${AGENT}.${TASK}"
supportedDomains: ["${REPO_NAME}", "${TASK}"]
protocols:
  rest: "http://localhost:4000/v1"
  websocket: "ws://localhost:4000/ws"
capabilities:
  ${TASK}:
    timeout: 30000
    maxRetries: 3
performance:
  throughput: 10
  latency_p99: 1000
budget:
  tokens: 12000
  escalationPolicy: "delegate"
EOF

echo "✅ OSSA agent environment configured"

# 4) DISPLAY NEXT STEPS
echo ""
echo "🎯 Next Steps:"
echo "1. Change to worktree directory:"
echo "   cd ${WT_NAME}"
echo ""
echo "2. Spawn OSSA agents:"
echo "   ossa agents spawn coder --type code --instructions 'TypeScript expert for ${REPO_NAME}'"
echo "   ossa agents spawn researcher --type research --instructions 'Technical research for ${TASK}'"
echo ""
echo "3. Execute task:"
echo "   ossa agents run <agent-id> --message '${TASK}'"
echo ""
echo "4. When done, commit and merge:"
echo "   git add -A && git commit -m 'feat: ${TASK}'"
echo "   git push"
echo ""
echo "5. Clean up (after MR approval):"
echo "   ./ossa-cleanup.sh ${REPO_NAME} ${AGENT} ${TASK}"
echo ""
echo "✅ OSSA Agent Worktree Setup Complete!"
echo "📍 Current location: $(pwd)"