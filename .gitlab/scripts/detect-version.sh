#!/bin/bash
# detect-version.sh - Detects version for CI/CD pipeline
# Outputs: build.env with VERSION and RELEASE_TAG variables

set -e

echo "=== VERSION DETECTION ==="
echo "Branch: ${CI_COMMIT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
echo "Commit: ${CI_COMMIT_SHA:-$(git rev-parse HEAD)}"
echo ""

# Initialize variables
VERSION=""
RELEASE_TAG=""

# Method 1: Extract from release branch name (release/v0.3.x -> 0.3.0)
if [[ "${CI_COMMIT_BRANCH}" =~ ^release/v([0-9]+\.[0-9]+) ]]; then
    BRANCH_VERSION="${BASH_REMATCH[1]}"
    echo "Detected from branch: ${BRANCH_VERSION}"

    # Get patch version from latest tag or default to 0
    LATEST_TAG=$(git tag -l "v${BRANCH_VERSION}.*" 2>/dev/null | grep -v "\-" | sort -V | tail -1 || echo "")

    if [ -n "$LATEST_TAG" ]; then
        # Increment patch version
        if [[ "$LATEST_TAG" =~ v${BRANCH_VERSION}\.([0-9]+) ]]; then
          CURRENT_PATCH="${BASH_REMATCH[1]}"
        else
          echo "Warning: Could not parse patch version from $LATEST_TAG, using 0"
          CURRENT_PATCH=0
        fi
        NEXT_PATCH=$((CURRENT_PATCH + 1))
        VERSION="${BRANCH_VERSION}.${NEXT_PATCH}"
        echo "Next version after ${LATEST_TAG}: ${VERSION}"
    else
        VERSION="${BRANCH_VERSION}.0"
        echo "First version for this minor: ${VERSION}"
    fi
fi

# Method 2: Extract from package.json if not detected
if [ -z "$VERSION" ] && [ -f "package.json" ]; then
    PKG_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
    if [ -n "$PKG_VERSION" ] && [ "$PKG_VERSION" != "{{VERSION}}" ]; then
        VERSION="$PKG_VERSION"
        echo "Using package.json version: ${VERSION}"
    fi
fi

# Method 3: Fallback to latest tag
if [ -z "$VERSION" ]; then
    LATEST_TAG=$(git tag -l "v*" 2>/dev/null | grep -v "\-" | sort -V | tail -1 || echo "")
    if [ -n "$LATEST_TAG" ]; then
        VERSION="${LATEST_TAG#v}"
        echo "Using latest tag: ${VERSION}"
    fi
fi

# Final fallback
if [ -z "$VERSION" ]; then
    VERSION="0.0.0"
    echo "Warning: Could not detect version, using fallback: ${VERSION}"
fi

# Set release tag
RELEASE_TAG="v${VERSION}"

echo ""
echo "=== DETECTED VERSION ==="
echo "VERSION: ${VERSION}"
echo "RELEASE_TAG: ${RELEASE_TAG}"
echo ""

# Write to build.env for downstream jobs
cat > build.env <<EOF
VERSION=${VERSION}
RELEASE_TAG=${RELEASE_TAG}
EOF

echo "Written to build.env:"
cat build.env
