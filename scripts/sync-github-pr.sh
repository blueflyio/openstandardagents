#!/bin/bash
set -e

# Sync GitHub PR to GitLab MR
# Usage: ./sync-github-pr.sh <pr-number>

PR_NUMBER=$1

if [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 <pr-number>"
  exit 1
fi

echo "🔄 Syncing GitHub PR #$PR_NUMBER to GitLab..."

# Get PR details
PR_TITLE=$(gh pr view $PR_NUMBER --json title -q .title)
PR_AUTHOR=$(gh pr view $PR_NUMBER --json author -q .author.login)
PR_URL="https://github.com/blueflyio/openstandardagents/pull/$PR_NUMBER"

# Checkout PR
gh pr checkout $PR_NUMBER

# Create branch for GitLab
BRANCH_NAME="github-pr-$PR_NUMBER"
git checkout -b $BRANCH_NAME

# Push to GitLab
git push origin $BRANCH_NAME

# Create GitLab MR
glab mr create \
  --title "GitHub PR #$PR_NUMBER: $PR_TITLE" \
  --description "**From GitHub PR**: $PR_URL
**Author**: @$PR_AUTHOR

$(gh pr view $PR_NUMBER --json body -q .body)

---

*This MR was created from a GitHub pull request. Once merged, changes will sync back to GitHub.*" \
  --source-branch $BRANCH_NAME \
  --target-branch main \
  --label "github-pr"

echo "✅ Created GitLab MR from GitHub PR #$PR_NUMBER"
echo "   Branch: $BRANCH_NAME"
echo "   Review on GitLab, then merge to sync back to GitHub"
