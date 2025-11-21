#!/bin/sh
# Prepare spec directory structure based on GitLab milestone
# Creates spec/v0.2.X/ from spec/v0.2.X-dev/ when milestone is ready for release

set -e

GITLAB_URL="${CI_SERVER_URL:-https://gitlab.bluefly.io}"
PROJECT_ID="${CI_PROJECT_ID}"
PROJECT_PATH="${CI_PROJECT_PATH}"
TOKEN="${GITLAB_PUSH_TOKEN:-${CI_JOB_TOKEN}}"

if [ -z "$TOKEN" ]; then
  echo "❌ GitLab token not found. Set GITLAB_PUSH_TOKEN or CI_JOB_TOKEN"
  exit 1
fi

echo "🔍 Checking GitLab milestones for spec directory preparation..."
echo ""

# Get all milestones
ALL_MILESTONES=$(curl -sS -G "${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/milestones" \
  --header "PRIVATE-TOKEN: ${TOKEN}" \
  --data-urlencode "per_page=100" \
  --data-urlencode "state=all")

# Find milestones with version pattern (v0.2.X or 0.2.X)
MILESTONES_WITH_VERSION=$(echo "$ALL_MILESTONES" | jq -r '.[] | select(.title | test("v?[0-9]+\\.[0-9]+\\.[0-9]+")) | "\(.id)|\(.title)|\(.state)"')

if [ -z "$MILESTONES_WITH_VERSION" ]; then
  echo "⚠️  No milestones found with version pattern (v0.2.X or 0.2.X)"
  exit 0
fi

echo "Found milestones with versions:"
echo "$MILESTONES_WITH_VERSION" | while IFS='|' read -r id title state; do
  VERSION=$(echo "$title" | grep -oE 'v?[0-9]+\.[0-9]+\.[0-9]+' | head -1 | sed 's/^v//')
  echo "  - $title (ID: $id, State: $state, Version: $VERSION)"
done
echo ""

# Process each milestone
echo "$MILESTONES_WITH_VERSION" | while IFS='|' read -r id title state; do
  VERSION=$(echo "$title" | grep -oE 'v?[0-9]+\.[0-9]+\.[0-9]+' | head -1 | sed 's/^v//')
  MAJOR_MINOR=$(echo "$VERSION" | cut -d. -f1,2)
  DEV_DIR="spec/v${MAJOR_MINOR}-dev"
  STABLE_DIR="spec/v${MAJOR_MINOR}"
  
  echo "Processing: $title (v$VERSION)"
  echo "  Dev directory: $DEV_DIR"
  echo "  Stable directory: $STABLE_DIR"
  
  # Check if dev directory exists
  if [ ! -d "$DEV_DIR" ]; then
    echo "  ⚠️  Dev directory $DEV_DIR does not exist - skipping"
    continue
  fi
  
  # If milestone is closed and stable dir doesn't exist, prepare for release
  if [ "$state" = "closed" ] && [ ! -d "$STABLE_DIR" ]; then
    echo "  ✅ Milestone is closed - preparing stable directory..."
    
    # Create stable directory
    mkdir -p "$STABLE_DIR"
    
    # Copy all files from dev
    cp -r "${DEV_DIR}"/* "$STABLE_DIR/"
    
    # Rename schema files (remove -dev suffix)
    if [ -f "${STABLE_DIR}/ossa-${MAJOR_MINOR}-dev.schema.json" ]; then
      mv "${STABLE_DIR}/ossa-${MAJOR_MINOR}-dev.schema.json" "${STABLE_DIR}/ossa-${MAJOR_MINOR}.schema.json"
      echo "  ✅ Renamed schema file"
    fi
    
    if [ -f "${STABLE_DIR}/ossa-${MAJOR_MINOR}-dev.yaml" ]; then
      mv "${STABLE_DIR}/ossa-${MAJOR_MINOR}-dev.yaml" "${STABLE_DIR}/ossa-${MAJOR_MINOR}.yaml"
      echo "  ✅ Renamed YAML file"
    fi
    
    # Update schema file contents to remove -dev from apiVersion pattern
    if [ -f "${STABLE_DIR}/ossa-${MAJOR_MINOR}.schema.json" ]; then
      sed -i.bak "s/0\\.2\\.[2-4](-dev)?/0\\.2\\.[2-4]/g" "${STABLE_DIR}/ossa-${MAJOR_MINOR}.schema.json"
      sed -i.bak "s/ossa-0\\.2\\.[2-4]-dev/ossa-0\\.2\\.[2-4]/g" "${STABLE_DIR}/ossa-${MAJOR_MINOR}.schema.json"
      sed -i.bak "s/v0\\.2\\.[2-4]-dev/v0\\.2\\.[2-4]/g" "${STABLE_DIR}/ossa-${MAJOR_MINOR}.schema.json"
      rm -f "${STABLE_DIR}/ossa-${MAJOR_MINOR}.schema.json.bak"
      echo "  ✅ Updated schema file to remove -dev references"
    fi
    
    # Update README to mark as stable
    if [ -f "${STABLE_DIR}/README.md" ]; then
      sed -i.bak "s/Development/Stable Release/g" "${STABLE_DIR}/README.md"
      sed -i.bak "s/v0\\.2\\.[0-9]-dev/v${MAJOR_MINOR}/g" "${STABLE_DIR}/README.md"
      rm -f "${STABLE_DIR}/README.md.bak"
      echo "  ✅ Updated README.md"
    fi
    
    echo "  ✅ Stable directory prepared: $STABLE_DIR"
    echo ""
  elif [ "$state" = "closed" ] && [ -d "$STABLE_DIR" ]; then
    echo "  ℹ️  Stable directory already exists: $STABLE_DIR"
    echo ""
  elif [ "$state" = "active" ]; then
    echo "  ℹ️  Milestone is active - keeping dev directory only"
    echo ""
  fi
done

echo "✅ Spec directory preparation complete"

