#!/bin/bash
set -euo pipefail

# GitHub Mirror Script with Branch/Tag Filtering
# Only mirrors: main, release/* branches, and -rc/-prod tags

GITLAB_REPO="https://oauth2:${CI_JOB_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git"
GITHUB_REPO="git@github.com:blueflyio/openstandardagents.git"

# Use GH_TOKEN (group variable) or GITHUB_MIRROR_TOKEN (legacy)
MIRROR_TOKEN="${GH_TOKEN:-${GITHUB_MIRROR_TOKEN:-}}"

if [ -z "$MIRROR_TOKEN" ]; then
  echo "INFO: No GitHub token set (GH_TOKEN or GITHUB_MIRROR_TOKEN) - skipping"
  exit 0
fi

echo "Starting GitHub mirror with filtering..."
echo "Branch: ${CI_COMMIT_BRANCH:-none}"
echo "Tag: ${CI_COMMIT_TAG:-none}"

# Setup SSH for GitHub (if deploy key provided)
if [ -n "${GITHUB_DEPLOY_KEY:-}" ]; then
  mkdir -p ~/.ssh
  echo "$GITHUB_DEPLOY_KEY" > ~/.ssh/id_rsa
  chmod 600 ~/.ssh/id_rsa
  ssh-keyscan -H github.com >> ~/.ssh/known_hosts 2>/dev/null || true
  GITHUB_REPO="git@github.com:blueflyio/openstandardagents.git"
else
  GITHUB_REPO="https://${MIRROR_TOKEN}@github.com/blueflyio/openstandardagents.git"
fi

# Clone GitLab repo
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"
git clone --mirror "$GITLAB_REPO" ossa-mirror.git
cd ossa-mirror.git

# Configure git
git config user.email "ci@bluefly.io"
git config user.name "GitLab CI"

# Add GitHub as remote
git remote add github "$GITHUB_REPO" || git remote set-url github "$GITHUB_REPO"

# Push only specific branches
echo "Pushing branches..."
git push github refs/heads/main:refs/heads/main --force || echo "WARNING: Failed to push main"
git push github 'refs/heads/release/*:refs/heads/release/*' --force || echo "WARNING: Failed to push release branches"

# Push only -rc and -prod tags (skip -dev tags)
echo "Pushing tags..."
for tag in $(git tag -l | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+(-rc|-prod)$'); do
  echo "  Pushing tag: $tag"
  git push github "refs/tags/${tag}:refs/tags/${tag}" --force || echo "WARNING: Failed to push tag $tag"
done

# Also push production tags (vX.Y.Z without suffix)
for tag in $(git tag -l | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$'); do
  echo "  Pushing production tag: $tag"
  git push github "refs/tags/${tag}:refs/tags/${tag}" --force || echo "WARNING: Failed to push tag $tag"
done

# Verify mirror
echo "Verifying mirror..."
git ls-remote --heads github | grep -E "(main|release/)" || echo "WARNING: Could not verify branches"
git ls-remote --tags github | grep -E "v[0-9]+\.[0-9]+\.[0-9]+" | head -10 || echo "WARNING: Could not verify tags"

# Cleanup
cd /
rm -rf "$TEMP_DIR"
if [ -n "${GITHUB_DEPLOY_KEY:-}" ]; then
  rm -rf ~/.ssh
fi

echo "GitHub mirror complete"
echo "  Branches: main, release/*"
echo "  Tags: v*.*.*(-rc|-prod) and v*.*.* (production)"
