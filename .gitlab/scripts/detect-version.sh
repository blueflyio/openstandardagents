#!/bin/bash
# Dynamic version detection from branch name
# Works for: release/v0.3.x, release/v0.4.x, release/v1.0.x, etc.

set -e

# Determine which branch to use for version detection
# For MRs: use source branch if it's a release branch, otherwise use target
# For direct pushes: use current branch
if [ -n "$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME" ]; then
  # In MR context
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
  # Direct push context
  BRANCH_TO_CHECK="$CI_COMMIT_BRANCH"
  IS_MR_TO_MAIN=false
fi

# Extract version from release branch name
# release/v0.3.x → MAJOR=0 MINOR=3
# release/v1.0.x → MAJOR=1 MINOR=0
if [[ "$BRANCH_TO_CHECK" =~ ^release/v([0-9]+)\.([0-9]+)\.x$ ]]; then
  MAJOR="${BASH_REMATCH[1]}"
  MINOR="${BASH_REMATCH[2]}"
  
  # Detect latest patch version from existing tags
  # Look for tags matching v{MAJOR}.{MINOR}.{PATCH} pattern
  LATEST_PATCH_TAG=$(git tag -l "v${MAJOR}.${MINOR}.*" 2>/dev/null | grep -E "^v${MAJOR}\.${MINOR}\.[0-9]+$" | sort -V | tail -1)
  
  if [ -n "$LATEST_PATCH_TAG" ]; then
    # Extract patch version from latest tag (e.g., v0.3.2 → 2)
    if [[ "$LATEST_PATCH_TAG" =~ ^v[0-9]+\.[0-9]+\.([0-9]+)$ ]]; then
      LATEST_PATCH="${BASH_REMATCH[1]}"
      # Increment patch version for new release
      PATCH=$((LATEST_PATCH + 1))
    else
      PATCH=0
    fi
  else
    # No existing tags for this MAJOR.MINOR, start at 0
    PATCH=0
  fi
  
  BASE_VERSION="${MAJOR}.${MINOR}.${PATCH}"
  
  # Determine tag type based on branch
  if [ "$CI_COMMIT_BRANCH" == "main" ]; then
    # On main: create RC tag (v0.3.0-rc.N), NOT final
    # Final release is done via manual promote-rc-to-final job
    EXISTING_RC_TAGS=$(git tag -l "v${BASE_VERSION}-rc.*" 2>/dev/null | wc -l | tr -d ' ')

    if [ "$EXISTING_RC_TAGS" -eq 0 ]; then
      RELEASE_TAG="v${BASE_VERSION}-rc.1"
    else
      RELEASE_TAG="v${BASE_VERSION}-rc.$((EXISTING_RC_TAGS + 1))"
    fi
    IS_RELEASE="false"  # RC is not final release
    IS_RC="true"
  elif [ "$IS_MR_TO_MAIN" == "true" ]; then
    # MR to main: just detect version, don't tag yet
    RELEASE_TAG="v${BASE_VERSION}-rc.1"
    IS_RELEASE="false"
    IS_RC="true"
  else
    # On release branch: create dev or rc pre-release tags
    # Check if this should be an RC (release candidate) or dev
    # RC tags: v0.3.0-rc1, v0.3.0-rc2, etc.
    # Dev tags: v0.3.0-dev, v0.3.0-dev1, v0.3.0-dev2, etc.
    
    # Check for RC tags first (higher priority)
    EXISTING_RC_TAGS=$(git tag -l "v${BASE_VERSION}-rc*" 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$EXISTING_RC_TAGS" -gt 0 ]; then
      # Use RC tag format, increment the count
      RELEASE_TAG="v${BASE_VERSION}-rc$((EXISTING_RC_TAGS + 1))"
    else
      # Use dev tag format
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
  echo "IS_RC=${IS_RC:-false}" >> build.env
  echo "MAJOR=${MAJOR}" >> build.env
  echo "MINOR=${MINOR}" >> build.env
  echo "PATCH=${PATCH}" >> build.env
  
  echo "Detected version: ${BASE_VERSION}"
  echo "Release tag: ${RELEASE_TAG}"
  echo "Is release: ${IS_RELEASE}"
  echo "Branch context: ${BRANCH_TO_CHECK}"
  
  cat build.env
else
  echo "Not a release branch: $BRANCH_TO_CHECK"
  exit 0
fi

