#!/bin/bash
# Quick installation and testing script for OSSA VS Code Extension

set -e

echo "========================================"
echo "OSSA VS Code Extension - Setup & Test"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this script from the vscode-ossa directory"
  echo "   cd /Users/flux423/Sites/LLM/openstandardagents/tools/vscode-ossa"
  exit 1
fi

# Check Node.js version
echo "1️⃣  Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
  echo "❌ Error: Node.js 18+ required (found: $(node -v))"
  exit 1
fi
echo "   ✅ Node.js $(node -v)"
echo ""

# Install dependencies
echo "2️⃣  Installing dependencies..."
npm install
echo "   ✅ Dependencies installed"
echo ""

# Compile TypeScript
echo "3️⃣  Compiling TypeScript..."
npm run compile
echo "   ✅ Compilation successful"
echo ""

# Run linter
echo "4️⃣  Running linter..."
npm run lint || echo "   ⚠️  Linting warnings (non-fatal)"
echo ""

# Check if icon exists
echo "5️⃣  Checking for extension icon..."
if [ -f "images/icon.png" ]; then
  echo "   ✅ Icon found at images/icon.png"
else
  echo "   ⚠️  No icon found (recommended for publishing)"
  echo "      Create 128x128px PNG at: images/icon.png"
fi
echo ""

# Package extension (optional)
echo "6️⃣  Packaging extension (optional)..."
if command -v vsce &> /dev/null; then
  npm run package || echo "   ⚠️  Packaging skipped (vsce errors)"
  if [ -f *.vsix ]; then
    echo "   ✅ Extension packaged: $(ls *.vsix)"
  fi
else
  echo "   ℹ️  vsce not installed (optional for testing)"
  echo "      Install with: npm install -g @vscode/vsce"
fi
echo ""

echo "========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Test in VS Code:"
echo "   code ."
echo "   # Then press F5 to launch Extension Development Host"
echo ""
echo "2. Create a test file:"
echo "   echo 'apiVersion: ossa/v0.3.0' > test.ossa.yaml"
echo "   # Type 'ossa-agent' and press Tab"
echo ""
echo "3. Test validation:"
echo "   # Open test.ossa.yaml in Extension Development Host"
echo "   # Make intentional errors to see red squiggles"
echo ""
echo "4. Test commands:"
echo "   # In Extension Development Host:"
echo "   # Cmd+Shift+P → 'OSSA: New Agent'"
echo ""
echo "5. When ready to publish:"
echo "   npm run package      # Creates .vsix file"
echo "   vsce publish         # Publishes to marketplace"
echo ""
echo "Documentation:"
echo "   README.md       - User guide"
echo "   QUICKSTART.md   - 5-minute start"
echo "   DEVELOPMENT.md  - Developer guide"
echo "   PUBLISHING.md   - Publishing guide"
echo ""
echo "Happy OSSA development! 🚀"
