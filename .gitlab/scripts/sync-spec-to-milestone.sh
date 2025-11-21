#!/bin/sh
# Sync spec directory structure with GitLab milestones
# Creates spec/v0.2.X-dev/ directories for active milestones
# Updates spec structure based on milestone status

set -e

GITLAB_URL="${CI_SERVER_URL:-https://gitlab.bluefly.io}"
PROJECT_ID="${CI_PROJECT_ID}"
TOKEN="${GITLAB_PUSH_TOKEN:-${CI_JOB_TOKEN}}"

if [ -z "$TOKEN" ]; then
  echo "❌ GitLab token not found"
  exit 1
fi

echo "🔄 Syncing spec directories with GitLab milestones..."
echo ""

# Get active milestones
ACTIVE_MILESTONES=$(curl -sS -G "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/milestones" \
  --header "PRIVATE-TOKEN: ${TOKEN}" \
  --data-urlencode "state=active" \
  --data-urlencode "per_page=100")

# Extract versions from milestone titles
echo "$ACTIVE_MILESTONES" | jq -r '.[] | select(.title | test("v?[0-9]+\\.[0-9]+\\.[0-9]+")) | .title' | while read -r title; do
  VERSION=$(echo "$title" | grep -oE 'v?[0-9]+\.[0-9]+\.[0-9]+' | head -1 | sed 's/^v//')
  MAJOR_MINOR=$(echo "$VERSION" | cut -d. -f1,2)
  DEV_DIR="spec/v${MAJOR_MINOR}-dev"
  
  echo "Processing milestone: $title (v$VERSION)"
  
  # Create dev directory if it doesn't exist
  if [ ! -d "$DEV_DIR" ]; then
    echo "  📁 Creating dev directory: $DEV_DIR"
    mkdir -p "$DEV_DIR"
    mkdir -p "${DEV_DIR}/migrations"
    mkdir -p "${DEV_DIR}/openapi"
    
    # Create basic README
    cat > "${DEV_DIR}/README.md" <<EOF
# OSSA v${MAJOR_MINOR}-dev Specification

**Status:** Development  
**Milestone:** $title

## Overview

This is the development version of OSSA v${MAJOR_MINOR}. The specification may change during development.

## Schema Files

- **JSON Schema:** \`ossa-${MAJOR_MINOR}-dev.schema.json\`
- **YAML Schema:** \`ossa-${MAJOR_MINOR}-dev.yaml\`

## Development Notes

This directory is automatically created based on GitLab milestone: $title

See [RELEASE-PROCESS.md](./RELEASE-PROCESS.md) for release workflow.
EOF
    
    # Create basic CHANGELOG
    cat > "${DEV_DIR}/CHANGELOG.md" <<EOF
# Changelog - v${MAJOR_MINOR}-dev

## [Unreleased]

### Added
- Development version for milestone: $title

EOF
    
    echo "  ✅ Created dev directory structure"
  else
    echo "  ℹ️  Dev directory already exists: $DEV_DIR"
  fi
done

echo ""
echo "✅ Spec directory sync complete"

