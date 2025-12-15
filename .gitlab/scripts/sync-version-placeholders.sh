#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"

if [ -z "$VERSION" ]; then
  echo "ERROR: Version argument required" >&2
  exit 1
fi

if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?$'; then
  echo "ERROR: Invalid version format: $VERSION" >&2
  exit 1
fi

echo "Syncing version ${VERSION} to all files with {{VERSION}} placeholders..."

FILES_UPDATED=0

DIRECT_FILES=(
  "package.json"
  "package-lock.json"
  ".version.json"
  ".wiki-config.json"
  "README.md"
  "CHANGELOG.md"
)

DIRECTORY_PATTERNS=(
  "spec"
  "openapi"
  ".gitlab"
  "bin"
  "scripts"
  "docs"
)

for file in "${DIRECT_FILES[@]}"; do
  if [ -f "$file" ] && grep -q "{{VERSION}}" "$file" 2>/dev/null; then
    echo "  Updating: $file"
    sed -i.bak "s/{{VERSION}}/${VERSION}/g" "$file"
    rm -f "${file}.bak"
    FILES_UPDATED=$((FILES_UPDATED + 1))
  fi
done

for pattern in "${DIRECTORY_PATTERNS[@]}"; do
  if [ -d "$pattern" ]; then
    find "$pattern" -type f \( -name "*.md" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" -o -name "*.ts" -o -name "*.js" -o -name "*.sh" \) \
      ! -path "*/node_modules/*" \
      ! -path "*/.git/*" \
      ! -path "*/dist/*" \
      -exec grep -l "{{VERSION}}" {} \; 2>/dev/null | while read -r file; do
      echo "  Updating: $file"
      sed -i.bak "s/{{VERSION}}/${VERSION}/g" "$file"
      rm -f "${file}.bak"
      FILES_UPDATED=$((FILES_UPDATED + 1))
    done
  fi
done

find . -type f \( -name "*.md" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" -o -name "*.ts" -o -name "*.js" \) \
  ! -path "./node_modules/*" \
  ! -path "./.git/*" \
  ! -path "./dist/*" \
  ! -path "./coverage/*" \
  -exec grep -l "{{VERSION}}" {} \; 2>/dev/null | while read -r file; do
  echo "  Updating: $file"
  sed -i.bak "s/{{VERSION}}/${VERSION}/g" "$file"
  rm -f "${file}.bak"
  FILES_UPDATED=$((FILES_UPDATED + 1))
done

echo ""
echo "Version sync complete: ${FILES_UPDATED} files updated"

if [ -f "package.json" ] && grep -q '"version": "{{VERSION}}"' package.json 2>/dev/null; then
  echo "ERROR: package.json still contains {{VERSION}} placeholder" >&2
  exit 1
fi

