#!/bin/bash
# Enhanced version detection with automatic patch version calculation
# Extracts MAJOR.MINOR from milestone/branch, auto-detects latest patch from tags

set -e

# Determine which branch to use for version detection
if [ -n "$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME" ]; then
  if [[ "$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME" =~ ^release/v([0-9]+)\.([0-9]+)\.x$ ]]; then
    BRANCH_TO_CHECK="$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME"
    IS_MR_TO_MAIN=true
  elif [[ "$CI_MERGE_REQUEST_TARGET_BRANCH_NAME" =~ ^release/v([0-9]+)\.([0-9]+)\.x$ ]]; then
    BRANCH_TO_CHECK="$CI_MERGE_REQUEST_TARGET_BRANCH_NAME"
    IS_MR_TO_MAIN=false
  else
    echo "Not a release branch MR: $CI_MERGE_REQUEST_SOURCE_BRANCH_NAME → $CI_MERGE_REQUEST_TARGET_BRANCH_NAME"
    exit 0
  fi
else
  BRANCH_TO_CHECK="$CI_COMMIT_BRANCH"
  IS_MR_TO_MAIN=false
fi

# Extract version from release branch name
if [[ "$BRANCH_TO_CHECK" =~ ^release/v([0-9]+)\.([0-9]+)\.x$ ]]; then
  MAJOR="${BASH_REMATCH[1]}"
  MINOR="${BASH_REMATCH[2]}"
  
  # Fetch all tags to ensure we have latest
  git fetch --tags --quiet 2>/dev/null || true
  
  # Detect latest patch version from existing tags (including dev/rc tags)
  # First, try to find final release tags (v0.3.0, v0.3.1, etc. - examples only)
  LATEST_PATCH_TAG=$(git tag -l "v${MAJOR}.${MINOR}.*" 2>/dev/null | grep -E "^v${MAJOR}\.${MINOR}\.[0-9]+$" | sort -V | tail -1)
  
  # If no final release tags, check dev/rc tags to extract base version
  if [ -z "$LATEST_PATCH_TAG" ]; then
    # Find latest dev or rc tag (e.g., v0.3.0-dev1, v0.3.0-rc2)
    LATEST_PRE_TAG=$(git tag -l "v${MAJOR}.${MINOR}.*" 2>/dev/null | grep -E "^v${MAJOR}\.${MINOR}\.[0-9]+(-dev|-rc)" | sort -V | tail -1)
    
    if [ -n "$LATEST_PRE_TAG" ]; then
      # Extract base version from pre-release tag (e.g., v0.3.0-dev1 → 0.3.0)
      if [[ "$LATEST_PRE_TAG" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)(-dev|-rc) ]]; then
        LATEST_PATCH="${BASH_REMATCH[3]}"
        # Use the same patch version (don't increment for dev tags)
        PATCH=$LATEST_PATCH
      else
        PATCH=0
      fi
    else
      # No existing tags for this MAJOR.MINOR, start at 0
      PATCH=0
    fi
  else
    # Extract patch version from latest final release tag (e.g., v0.3.2 → 2)
    if [[ "$LATEST_PATCH_TAG" =~ ^v[0-9]+\.[0-9]+\.([0-9]+)$ ]]; then
      LATEST_PATCH="${BASH_REMATCH[1]}"
      # Increment patch version for new release
      PATCH=$((LATEST_PATCH + 1))
    else
      PATCH=0
    fi
  fi
  
  BASE_VERSION="${MAJOR}.${MINOR}.${PATCH}"
  
  # Determine if this is a final release (main) or pre-release (release branch)
  if [ "$CI_COMMIT_BRANCH" == "main" ] || [ "$IS_MR_TO_MAIN" == "true" ]; then
    # On main or MR to main: v0.3.0 (final release)
    RELEASE_TAG="v${BASE_VERSION}"
    IS_RELEASE="true"
  else
    # On release branch: create dev or rc pre-release tags
    EXISTING_RC_TAGS=$(git tag -l "v${BASE_VERSION}-rc*" 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$EXISTING_RC_TAGS" -gt 0 ]; then
      RELEASE_TAG="v${BASE_VERSION}-rc$((EXISTING_RC_TAGS + 1))"
    else
      EXISTING_DEV_TAGS=$(git tag -l "v${BASE_VERSION}-dev*" 2>/dev/null | wc -l | tr -d ' ')
      
      if [ "$EXISTING_DEV_TAGS" -eq 0 ]; then
        RELEASE_TAG="v${BASE_VERSION}-dev"
      else
        RELEASE_TAG="v${BASE_VERSION}-dev$((EXISTING_DEV_TAGS + 1))"
      fi
    fi
    IS_RELEASE="false"
  fi
  
  echo "VERSION=${BASE_VERSION}" >> build.env
  echo "RELEASE_TAG=${RELEASE_TAG}" >> build.env
  echo "IS_RELEASE=${IS_RELEASE}" >> build.env
  echo "MAJOR=${MAJOR}" >> build.env
  echo "MINOR=${MINOR}" >> build.env
  echo "PATCH=${PATCH}" >> build.env
  
  # Export for use in other jobs
  export VERSION="${BASE_VERSION}"
  export RELEASE_TAG="${RELEASE_TAG}"
  export IS_RELEASE="${IS_RELEASE}"
  
  echo "Detected version: ${BASE_VERSION}"
  echo "Release tag: ${RELEASE_TAG}"
  echo "Is release: ${IS_RELEASE}"
  echo "Branch context: ${BRANCH_TO_CHECK}"
  echo ""
  echo "Version variables exported:"
  echo "  VERSION=${VERSION}"
  echo "  RELEASE_TAG=${RELEASE_TAG}"
  
  cat build.env
else
  echo "Not a release branch: $BRANCH_TO_CHECK"
  exit 0
fi
