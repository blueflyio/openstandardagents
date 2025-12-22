#!/bin/bash
# Pre-commit hook to validate .gitlab-ci.yml before committing
# Prevents pushing broken CI that wastes CI minutes

set -e

CI_FILE=".gitlab-ci.yml"

if [ ! -f "$CI_FILE" ]; then
  exit 0
fi

# Check if .gitlab-ci.yml is staged or modified
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")
if ! echo "$STAGED_FILES" | grep -q "^${CI_FILE}$"; then
  # Also check if file was modified (for manual testing)
  if ! git diff --name-only | grep -q "^${CI_FILE}$"; then
    exit 0
  fi
fi

echo "Validating .gitlab-ci.yml..."

ERRORS=0
WARNINGS=0

# 1. Check for common Docker image mistakes (apk vs apt-get)
# Find jobs using node:${NODE_VERSION} (Debian) but running apk (Alpine)
while IFS= read -r line; do
  JOB_NAME=$(echo "$line" | sed -n 's/^\([a-zA-Z0-9_-]*\):.*/\1/p')
  if [ -n "$JOB_NAME" ]; then
    # Check if this job uses node:${NODE_VERSION} and apk
    JOB_SECTION=$(sed -n "/^${JOB_NAME}:/,/^[a-zA-Z0-9_-]*:/p" "$CI_FILE" | head -20)
    if echo "$JOB_SECTION" | grep -q "image: node:\${NODE_VERSION}\$" && echo "$JOB_SECTION" | grep -q "apk add"; then
      echo "ERROR: Job '${JOB_NAME}' uses 'node:\${NODE_VERSION}' (Debian) but runs 'apk' (Alpine)"
      echo "  Fix: Change to 'node:\${NODE_VERSION}-alpine' for jobs using apk"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done < <(grep -n "^[a-zA-Z0-9_-]*:" "$CI_FILE" | head -20)

# 2. Check for duplicate set -euo pipefail within same script block
# Look for script blocks with multiple set commands
IN_SCRIPT=false
SET_COUNT=0
BLOCK_START=0
while IFS= read -r line; do
  if echo "$line" | grep -qE "^      - \|$"; then
    IN_SCRIPT=true
    SET_COUNT=0
    BLOCK_START=$((BLOCK_START + 1))
  elif [ "$IN_SCRIPT" = true ]; then
    if echo "$line" | grep -qE "^[a-zA-Z0-9_-]+:" || echo "$line" | grep -qE "^  [a-zA-Z]"; then
      IN_SCRIPT=false
      if [ "$SET_COUNT" -gt 1 ]; then
        echo "ERROR: Script block starting at line $BLOCK_START has multiple 'set -euo pipefail' commands"
        echo "  Each script block should only have one 'set -euo pipefail'"
        ERRORS=$((ERRORS + 1))
      fi
      SET_COUNT=0
    elif echo "$line" | grep -q "set -euo pipefail"; then
      SET_COUNT=$((SET_COUNT + 1))
    fi
  fi
done < "$CI_FILE"

# 3. Check for unquoted variables in set -euo pipefail contexts
if grep -q "set -euo pipefail" "$CI_FILE"; then
  UNQUOTED=$(grep -nE '\$\{[A-Z_]+\}[^"]' "$CI_FILE" | grep -vE '"\$\{' | grep -vE "'\$\{" | grep -vE '\\\$\{' || true)
  if [ -n "$UNQUOTED" ]; then
    echo "WARNING: Unquoted variables found (may cause issues with set -euo pipefail):"
    echo "$UNQUOTED" | head -3
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# 4. Check for missing error handling in curl commands
CURL_NO_ERROR=$(grep -B2 "curl.*CI_API_V4_URL" "$CI_FILE" | grep -v "set -e" | grep -v "||" | grep "curl" | head -3 || true)
if [ -n "$CURL_NO_ERROR" ]; then
  echo "WARNING: curl commands may need error handling"
  WARNINGS=$((WARNINGS + 1))
fi

# 5. Validate YAML syntax
if command -v python3 >/dev/null 2>&1; then
  if ! python3 -c "import yaml; yaml.safe_load(open('$CI_FILE'))" 2>/dev/null; then
    echo "ERROR: Invalid YAML syntax in $CI_FILE"
    python3 -c "import yaml; yaml.safe_load(open('$CI_FILE'))" 2>&1 | head -5
    ERRORS=$((ERRORS + 1))
  fi
elif command -v yq >/dev/null 2>&1; then
  if ! yq eval '.' "$CI_FILE" >/dev/null 2>&1; then
    echo "ERROR: Invalid YAML syntax in $CI_FILE"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "WARNING: No YAML validator found (install python3 or yq for validation)"
  WARNINGS=$((WARNINGS + 1))
fi

# 6. Validate GitLab CI using API if token available
if [ -n "${GITLAB_TOKEN:-}" ] || [ -f ~/.tokens/gitlab ]; then
  TOKEN="${GITLAB_TOKEN:-$(cat ~/.tokens/gitlab 2>/dev/null | head -1 || echo '')}"
  if [ -n "$TOKEN" ]; then
    echo "Validating CI syntax via GitLab API..."
    VALIDATION=$(curl -s --request POST \
      --header "PRIVATE-TOKEN: ${TOKEN}" \
      --header "Content-Type: application/json" \
      --data "$(jq -Rs '{content: .}' < "$CI_FILE" 2>/dev/null || echo '{"content":""}')" \
      "https://gitlab.com/api/v4/ci/lint" 2>/dev/null || echo '{"valid":false,"errors":["API validation failed"]}')
    
    if echo "$VALIDATION" | jq -e '.valid == false' >/dev/null 2>&1; then
      echo "ERROR: GitLab CI validation failed:"
      echo "$VALIDATION" | jq -r '.errors[]? // .warnings[]? // "Unknown error"' 2>/dev/null | head -10
      ERRORS=$((ERRORS + 1))
    elif echo "$VALIDATION" | jq -e '.warnings' >/dev/null 2>&1; then
      WARN_COUNT=$(echo "$VALIDATION" | jq '.warnings | length' 2>/dev/null || echo "0")
      if [ "$WARN_COUNT" -gt 0 ]; then
        echo "WARNING: GitLab CI validation warnings:"
        echo "$VALIDATION" | jq -r '.warnings[]?' 2>/dev/null | head -5
        WARNINGS=$((WARNINGS + WARN_COUNT))
      fi
    else
      echo "GitLab CI syntax validated successfully"
    fi
  fi
fi

# Summary
if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "BLOCKED: $ERRORS error(s) found in $CI_FILE"
  echo "Fix these errors before committing to avoid wasting CI minutes"
  exit 1
fi

if [ $WARNINGS -gt 0 ]; then
  echo ""
  echo "WARNING: $WARNINGS warning(s) found (commit will proceed)"
fi

exit 0
