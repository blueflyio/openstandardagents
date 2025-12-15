#!/bin/sh
# Auto-sync example apiVersions to package.json version

VERSION=$(jq -r '.version' package.json)
OSSA_VERSION="ossa/v${VERSION}"

echo "Syncing examples to ${OSSA_VERSION}..."

find examples -name "*.ossa.yaml" -type f | while read file; do
  if grep -q "apiVersion:" "$file"; then
    sed -i.bak "s|apiVersion: ossa/v[0-9]*\.[0-9]*\.[0-9]*|apiVersion: ${OSSA_VERSION}|g" "$file"
    rm -f "${file}.bak"
    echo "Updated: $file"
  fi
done

echo "✅ All examples synced to ${OSSA_VERSION}"
