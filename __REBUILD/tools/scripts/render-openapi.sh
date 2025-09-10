#!/usr/bin/env bash
set -euo pipefail
spec_dir="$(cd "$(dirname "$0")/../.." && pwd)"
if [ ! -f "$spec_dir/openapi.yml" ]; then
  echo "openapi.yml not found in $spec_dir" >&2; exit 1
fi
npx redoc-cli bundle "$spec_dir/openapi.yml" --output "$spec_dir/openapi.html"
