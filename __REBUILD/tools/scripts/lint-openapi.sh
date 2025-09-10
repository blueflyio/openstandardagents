#!/usr/bin/env bash
set -euo pipefail
spec_dir="$(cd "$(dirname "$0")/../.." && pwd)"
if [ ! -f "$spec_dir/openapi.yml" ]; then
  echo "openapi.yml not found in $spec_dir" >&2; exit 1
fi
npx @redocly/openapi-cli lint "$spec_dir/openapi.yml" | cat
