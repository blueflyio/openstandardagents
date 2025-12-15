#!/usr/bin/env bash
set -euo pipefail

# Treat unset vars as empty for checks
OSSA_VERSION=""

# Priority 1: VERSION from build.env (detect:version)
if [[ -f "build.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "build.env"
  set +a

  if [[ -n "${VERSION:-}" ]]; then
    OSSA_VERSION="v${VERSION}"
  fi
fi

# Priority 2: package.json (post placeholder sync)
if [[ -z "$OSSA_VERSION" && -f "package.json" ]]; then
  PACKAGE_VERSION="$(node -p "require('./package.json').version" 2>/dev/null || true)"
  if [[ -n "$PACKAGE_VERSION" && "$PACKAGE_VERSION" != "{{VERSION}}" ]]; then
    OSSA_VERSION="v${PACKAGE_VERSION}"
  fi
fi

# Priority 3: Git tag
if [[ -z "$OSSA_VERSION" && -n "${CI_COMMIT_TAG:-}" ]]; then
  OSSA_VERSION="${CI_COMMIT_TAG}"
fi

# Priority 4: Latest spec dir
if [[ -z "$OSSA_VERSION" && -d "spec" ]]; then
  LATEST_SPEC="$(find spec -maxdepth 1 -type d -name "v*" -print | sort -V | tail -1 || true)"
  if [[ -n "$LATEST_SPEC" ]]; then
    OSSA_VERSION="$(basename "$LATEST_SPEC")"
  fi
fi

# Priority 5: Milestone -> ensure X.Y.Z
if [[ -z "$OSSA_VERSION" && -n "${CI_MERGE_REQUEST_MILESTONE:-}" ]]; then
  MILESTONE_VERSION="$(echo "$CI_MERGE_REQUEST_MILESTONE" \
    | sed 's/\.x$/.0/' \
    | sed -E 's/^v([0-9]+\.[0-9]+)$/v\1.0/')"
  if echo "$MILESTONE_VERSION" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$'; then
    OSSA_VERSION="$MILESTONE_VERSION"
  fi
fi

# Priority 6: release/vX.Y.x -> vX.Y.0
if [[ -z "$OSSA_VERSION" && "${CI_COMMIT_BRANCH:-}" =~ ^release/v[0-9]+\.[0-9]+\.x$ ]]; then
  BRANCH_VERSION="$(echo "$CI_COMMIT_BRANCH" | sed -E 's|^release/v?([0-9]+\.[0-9]+)\.x$|v\1.0|')"
  if echo "$BRANCH_VERSION" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$'; then
    OSSA_VERSION="$BRANCH_VERSION"
  fi
fi

if [[ -z "$OSSA_VERSION" ]]; then
  echo "ERROR: Could not determine OSSA version." >&2
  echo "Expected one of: build.env VERSION, package.json version, CI_COMMIT_TAG, spec/v*, MR milestone, release/vX.Y.x" >&2
  exit 1
fi

if ! echo "$OSSA_VERSION" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "ERROR: Invalid version format: $OSSA_VERSION (expected vX.Y.Z)" >&2
  exit 1
fi

OSSA_VERSION_CLEAN="${OSSA_VERSION#v}"

printf "OSSA_VERSION=%s\n" "$OSSA_VERSION_CLEAN" > ossa-version.env
printf "DETECTED_VERSION=%s\n" "$OSSA_VERSION_CLEAN" >> ossa-version.env
