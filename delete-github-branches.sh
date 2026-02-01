#!/bin/bash
# Delete GitHub mirror branches from GitLab repository
# These branches are from the broken GitHub mirror and should be removed

set -e

PROJECT_PATH="blueflyio/ossa/openstandardagents"
GITHUB_BRANCHES=(
  "claude/fetch-branches-audit-tests-mf7pY"
  "claude/sync-gitlab-to-github-X1JmL"
  "claude/sync-release-v0.3.x-X1JmL"
  "dependabot/npm_and_yarn/development-dependencies-05f4173d77"
  "dependabot/npm_and_yarn/production-dependencies-0a5da1c28b"
  "development"
  "feat/add-pr-template"
  "feature/v0.2.4-release-prep"
  "main"
)

echo "=== Deleting GitHub Mirror Branches ==="
echo ""
echo "Project: $PROJECT_PATH"
echo "Branches to delete: ${#GITHUB_BRANCHES[@]}"
echo ""

# Check if GITLAB_TOKEN is set
if [ -z "$GITLAB_TOKEN" ]; then
  echo "Error: GITLAB_TOKEN environment variable not set"
  echo "Set it with: export GITLAB_TOKEN=your_token"
  exit 1
fi

ENCODED_PROJECT=$(echo "$PROJECT_PATH" | sed 's/\//%2F/g')

for branch in "${GITHUB_BRANCHES[@]}"; do
  echo "Deleting github/$branch..."
  
  # Delete the branch via GitLab API
  RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
    "https://gitlab.com/api/v4/projects/$ENCODED_PROJECT/repository/branches/github%2F$branch" \
    --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    2>&1)
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ Deleted github/$branch"
  elif echo "$BODY" | grep -q "Branch not found"; then
    echo "  ⚠️  Branch github/$branch not found (may already be deleted)"
  else
    echo "  ❌ Failed to delete github/$branch (HTTP $HTTP_CODE)"
    echo "$BODY" | head -3
  fi
done

echo ""
echo "=== Cleanup Complete ==="
echo ""
echo "Note: The 'github/main' branch may be protected. If deletion fails,"
echo "unprotect it in GitLab UI: Settings > Repository > Protected Branches"
