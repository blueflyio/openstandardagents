#!/bin/bash
# OSSA Agent Orchestration – Worktree Cleanup (Safe Merge & Remove)
# Usage: ./ossa-cleanup.sh <REPO_NAME> <AGENT> <TASK>

set -euo pipefail

# Configuration
INTEGRATION_BRANCH="feature/0.1.0-agents-merge-$(date +%Y%m%d)"
WORKTREE_ROOT="LLM/.worktrees"

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

echo "🧹 OSSA Agent Orchestration - Worktree Cleanup"
echo "Repository: ${REPO_NAME}"
echo "Agent: ${AGENT}"
echo "Task: ${TASK}"
echo "Worktree: ${WT_NAME}"
echo ""

# Navigate to main repo (not worktree)
if [[ $(pwd) == *"/.worktrees/"* ]]; then
    echo "🔄 Navigating to main repository..."
    cd ../../../
fi

# 1) FETCH LATEST CHANGES
echo "📥 Step 1: Fetching latest changes..."
git fetch --all --prune

# 2) SYNC INTEGRATION BRANCH
echo ""
echo "🔄 Step 2: Syncing integration branch..."
if git rev-parse --verify "${INTEGRATION_BRANCH}" >/dev/null 2>&1; then
    git checkout "${INTEGRATION_BRANCH}"
    git pull --ff-only
    echo "✅ Integration branch updated"
else
    echo "⚠️  Integration branch ${INTEGRATION_BRANCH} not found, skipping..."
    exit 1
fi

# 3) MERGE TO FEATURE/0.1.0
echo ""
echo "🔀 Step 3: Merging to feature/0.1.0..."
git checkout feature/0.1.0

# Check if we can fast-forward merge
if git merge-base --is-ancestor feature/0.1.0 "${INTEGRATION_BRANCH}"; then
    echo "✅ Fast-forward merge possible"
    git merge --ff-only "${INTEGRATION_BRANCH}"
else
    echo "⚠️  Fast-forward not possible, creating merge commit..."
    git merge --no-ff "${INTEGRATION_BRANCH}" -m "merge: ${TASK} implementation for ${REPO_NAME}

🤖 Generated with OSSA Agent Orchestration
Agent: ${AGENT}
Task: ${TASK}
Integration Branch: ${INTEGRATION_BRANCH}"
fi

git push
echo "✅ Changes merged to feature/0.1.0"

# 4) REMOVE WORKTREE
echo ""
echo "🗑️  Step 4: Removing worktree..."
if [ -d "${WT_NAME}" ]; then
    git worktree remove -f "${WT_NAME}"
    echo "✅ Worktree removed: ${WT_NAME}"
else
    echo "ℹ️  Worktree not found: ${WT_NAME}"
fi

git worktree prune

# 5) CLEANUP INTEGRATION BRANCH (OPTIONAL)
echo ""
echo "🧽 Step 5: Integration branch cleanup..."
read -p "Delete integration branch ${INTEGRATION_BRANCH}? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git branch -d "${INTEGRATION_BRANCH}" || git branch -D "${INTEGRATION_BRANCH}"
    git push origin --delete "${INTEGRATION_BRANCH}" || echo "⚠️  Could not delete remote branch"
    echo "✅ Integration branch deleted"
else
    echo "ℹ️  Integration branch preserved: ${INTEGRATION_BRANCH}"
fi

# 6) CLEANUP BACKUP BRANCHES
echo ""
echo "🗂️  Step 6: Backup branch cleanup..."
BACKUP_BRANCHES=$(git branch --list "backup/auto-save-*" | head -5)
if [ -n "$BACKUP_BRANCHES" ]; then
    echo "Found backup branches:"
    echo "$BACKUP_BRANCHES"
    read -p "Delete old backup branches? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$BACKUP_BRANCHES" | xargs -r git branch -D
        echo "✅ Old backup branches deleted"
    else
        echo "ℹ️  Backup branches preserved"
    fi
else
    echo "ℹ️  No backup branches found"
fi

# 7) FINAL STATUS
echo ""
echo "📊 Final Status:"
git status --short
echo ""
echo "✅ OSSA Agent Worktree Cleanup Complete!"
echo "📍 Current branch: $(git branch --show-current)"
echo "🔧 Worktree list:"
git worktree list