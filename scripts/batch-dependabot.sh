#!/bin/bash
set -e

# Batch merge Dependabot PRs from GitHub
# Creates a single GitLab MR with all updates

REPO="blueflyio/openstandardagents"
BRANCH="batch-dependabot-$(date +%Y%m%d)"

echo "🤖 Batching Dependabot PRs..."

# Get all open Dependabot PRs
DEPENDABOT_PRS=$(gh pr list --repo $REPO --author app/dependabot --state open --json number -q '.[].number')

if [ -z "$DEPENDABOT_PRS" ]; then
  echo "No Dependabot PRs found"
  exit 0
fi

echo "Found PRs: $DEPENDABOT_PRS"

# Create new branch
git checkout -b $BRANCH main

# Merge each PR
for PR in $DEPENDABOT_PRS; do
  echo "Merging PR #$PR..."
  gh pr checkout $PR
  git merge --no-ff --no-edit FETCH_HEAD || {
    echo "⚠️  Conflict in PR #$PR, skipping"
    git merge --abort
    continue
  }
done

# Push to GitLab
git push origin $BRANCH

# Create GitLab MR
glab mr create \
  --title "chore(deps): batch Dependabot updates $(date +%Y-%m-%d)" \
  --description "Batched Dependabot PRs from GitHub:

$(echo "$DEPENDABOT_PRS" | while read pr; do
  echo "- https://github.com/$REPO/pull/$pr"
done)

**Changes:**
- Dependency updates from Dependabot
- Tested in CI before merge

**GitHub PRs will auto-close** when this merges and syncs back." \
  --source-branch $BRANCH \
  --target-branch main \
  --label "dependencies"

echo "✅ Created GitLab MR with batched updates"
