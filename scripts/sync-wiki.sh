#!/bin/bash
set -e

# Sync public wiki pages from GitLab to GitHub
# Usage: ./sync-wiki.sh

GITLAB_WIKI="https://gitlab.com/blueflyio/openstandardagents.wiki.git"
GITHUB_WIKI="https://github.com/blueflyio/openstandardagents.wiki.git"

# Public pages to sync
PUBLIC_PAGES=(
  "home.md"
  "Getting-Started.md"
  "CLI-Utilities.md"
  "V0.2.6-Release-Notes.md"
  "Upgrading-to-v0.2.6.md"
  "README.md"
)

echo "📚 Syncing wiki pages..."

# Clone wikis
rm -rf /tmp/gitlab-wiki /tmp/github-wiki
git clone $GITLAB_WIKI /tmp/gitlab-wiki
git clone $GITHUB_WIKI /tmp/github-wiki

# Sync public pages
cd /tmp/gitlab-wiki
for page in "${PUBLIC_PAGES[@]}"; do
  if [ -f "$page" ]; then
    echo "  ✓ $page"
    cp "$page" "/tmp/github-wiki/$page"
  else
    echo "  ⚠ $page not found"
  fi
done

# Commit and push to GitHub
cd /tmp/github-wiki
git add .
if git diff --staged --quiet; then
  echo "No changes to sync"
else
  git commit -m "Sync from GitLab wiki $(date +%Y-%m-%d)"
  git push
  echo "✅ Wiki synced to GitHub"
fi

# Cleanup
rm -rf /tmp/gitlab-wiki /tmp/github-wiki
