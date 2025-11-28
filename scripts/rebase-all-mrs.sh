#!/bin/bash
#
# Rebase all open MRs onto their target branches
# This script fetches and rebases each source branch
#

set -e

TOKEN="${GITLAB_TOKEN:-${SERVICE_ACCOUNT_OSSA_TOKEN:-${GITLAB_PUSH_TOKEN}}}"
PROJECT="blueflyio/openstandardagents"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: GITLAB_TOKEN or SERVICE_ACCOUNT_OSSA_TOKEN required"
  exit 1
fi

echo "🔄 Fetching open merge requests..."
MRs=$(curl -sS --header "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/${PROJECT//\//%2F}/merge_requests?state=opened&per_page=20" | \
  jq -r '.[] | "\(.iid)|\(.source_branch)|\(.target_branch)"')

echo ""
echo "Found MRs to rebase:"
echo "$MRs" | while IFS='|' read -r iid source target; do
  echo "  MR !$iid: $source -> $target"
done

echo ""
read -p "Continue with rebasing? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo "$MRs" | while IFS='|' read -r iid source target; do
  echo ""
  echo "=== Rebasing MR !$iid: $source -> $target ==="
  
  # Fetch both branches
  git fetch origin "$source" "$target" 2>&1 | grep -v "^From" || true
  
  # Check if source branch exists locally
  if git show-ref --verify --quiet "refs/heads/$source"; then
    echo "  Branch $source exists locally, using worktree..."
    git worktree add "../rebase-$source" "$source" 2>/dev/null || {
      echo "  Worktree exists, removing..."
      git worktree remove "../rebase-$source" 2>/dev/null || true
      git worktree add "../rebase-$source" "$source"
    }
    cd "../rebase-$source"
  else
    echo "  Creating worktree for $source..."
    git worktree add "../rebase-$source" "origin/$source"
    cd "../rebase-$source"
  fi
  
  # Rebase onto target
  echo "  Rebasing onto origin/$target..."
  if git rebase "origin/$target" 2>&1 | tee /tmp/rebase-output.log; then
    echo "  ✅ Rebase successful"
    echo "  Pushing..."
    git push origin "$source" --force-with-lease 2>&1 | grep -v "^To " || true
    echo "  ✅ MR !$iid rebased and pushed"
  else
    echo "  ❌ Rebase failed - check conflicts"
    echo "  Worktree: $(pwd)"
    echo "  Fix conflicts and run: git rebase --continue && git push origin $source --force-with-lease"
  fi
  
  cd - > /dev/null
done

echo ""
echo "✅ Rebase process complete!"
