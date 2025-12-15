#!/bin/bash
# Pre-commit hook to prevent hardcoded versions ANYWHERE
# Versions MUST use {{VERSION}} placeholder for dynamic CI replacement

set -e

# Files to check for hardcoded versions
FILES_TO_CHECK=(
  "package.json"
  ".version.json"
  "README.md"
  "CHANGELOG.md"
  "spec/**/*.md"
  "spec/**/*.yaml"
  "spec/**/*.json"
  "openapi/**/*.yaml"
  "openapi/**/*.json"
  ".gitlab/**/*.md"
  ".gitlab/**/*.yml"
  ".gitlab/**/*.yaml"
  "bin/**"
  "scripts/**/*.ts"
  "scripts/**/*.js"
)

ERRORS=0

# Check package.json specifically
if [ -f "package.json" ]; then
  # Check if package.json contains hardcoded version (not {{VERSION}})
  if grep -q '"version": "[0-9]' "package.json"; then
    echo "ERROR: Hardcoded version detected in package.json"
    echo ""
    echo "package.json MUST use {{VERSION}} placeholder for dynamic versioning."
    echo "The version-sync CI job will replace {{VERSION}} with the actual version."
    echo ""
    echo "Current version line:"
    grep '"version"' "package.json" | head -1
    echo ""
    echo "Change it to:"
    echo '  "version": "{{VERSION}},'
    echo ""
    ERRORS=$((ERRORS + 1))
  fi

  # Check if schema path uses hardcoded version
  if grep -q '"./schema": "./spec/v[0-9]' "package.json"; then
    echo "ERROR: Hardcoded version in schema path detected"
    echo ""
    echo "Schema path MUST use {{VERSION}} placeholder."
    echo ""
    echo "Current schema line:"
    grep '"./schema"' "package.json" | head -1
    echo ""
    echo "Change it to:"
    echo '    "./schema": "./spec/v{{VERSION}}/ossa-{{VERSION}}.schema.json",'
    echo ""
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check .version.json
if [ -f ".version.json" ]; then
  if grep -q '"current": "[0-9]' ".version.json" || grep -q '"spec_version": "[0-9]' ".version.json"; then
    echo "ERROR: Hardcoded version detected in .version.json"
    echo ""
    echo ".version.json MUST use {{VERSION}} placeholder."
    echo ""
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check for hardcoded versions in other files (but allow examples/docs that reference versions)
for file in "${FILES_TO_CHECK[@]}"; do
  # Skip if file doesn't exist or is a pattern
  if [[ "$file" == *"*"* ]]; then
    continue
  fi
  
  if [ -f "$file" ]; then
    # Check for hardcoded version patterns but exclude:
    # - Example files that show version usage
    # - Documentation that references versions
    # - Comments
    if grep -qE '(version|VERSION).*[0-9]+\.[0-9]+\.[0-9]+' "$file" && ! grep -q "{{VERSION}}" "$file"; then
      # Allow if it's in a comment or example context
      if ! grep -qE '(example|Example|EXAMPLE|comment|Comment|#|//)' "$file"; then
        echo "WARNING: Possible hardcoded version in $file"
        echo "  Consider using {{VERSION}} placeholder if this is a version reference"
        echo ""
      fi
    fi
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ BLOCKED: $ERRORS hardcoded version(s) detected"
  echo ""
  echo "All versions MUST use {{VERSION}} placeholder for dynamic CI replacement."
  echo "The version-sync CI job will replace {{VERSION}} with the actual version during build."
  exit 1
fi

exit 0
