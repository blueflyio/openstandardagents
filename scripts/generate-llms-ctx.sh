#!/bin/bash
# Generate llms-ctx.txt files from llms.txt

set -e

echo "Installing llms-txt..."
pip install llms-txt --quiet

echo "Generating llms-ctx.txt (without Optional)..."
llms_txt2ctx llms.txt > llms-ctx.txt

echo "Generating llms-ctx-full.txt (with Optional)..."
llms_txt2ctx llms.txt --optional True > llms-ctx-full.txt

echo "✅ Generated:"
echo "  - llms-ctx.txt ($(wc -l < llms-ctx.txt) lines)"
echo "  - llms-ctx-full.txt ($(wc -l < llms-ctx-full.txt) lines)"
