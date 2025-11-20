#!/bin/sh
# Automated MR Labeler
# Labels MRs based on semantic-release analysis

set -e

echo "🏷️  Auto-labeling Merge Request..."

# Get MR IID from CI environment
MR_IID="${CI_MERGE_REQUEST_IID}"
if [ -z "$MR_IID" ]; then
  echo "⚠️  Not a merge request - skipping labeling"
  exit 0
fi

# Get release type from semantic-preview job artifacts
if [ -f "semantic-preview.env" ]; then
  source semantic-preview.env
  RELEASE_TYPE="${RELEASE_TYPE:-none}"
  MR_LABEL="${MR_LABEL:-}"
else
  echo "⚠️  semantic-preview.env not found - skipping labeling"
  exit 0
fi

# Map release type to label
case "$RELEASE_TYPE" in
  major)
    LABEL="release:major"
    ;;
  minor)
    LABEL="release:minor"
    ;;
  patch)
    LABEL="release:patch"
    ;;
  *)
    echo "ℹ️  No release type detected - skipping labeling"
    exit 0
    ;;
esac

# Add label to MR via GitLab API
if [ -n "$LABEL" ]; then
  echo "Adding label: ${LABEL}"
  curl -sS -X PUT "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${MR_IID}" \
    --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
    --data "add_labels=${LABEL}" || echo "⚠️  Failed to add label (may not have permissions)"
fi

echo "✅ MR labeling completed"

