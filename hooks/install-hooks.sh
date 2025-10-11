#!/bin/bash
#
# OSSA Git Hooks Installer
# Installs pre-push hook for automatic knowledge graph regeneration
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_HOOKS_DIR=".git/hooks"

echo "🔧 OSSA Git Hooks Installer"
echo "════════════════════════════════════════════════════════════"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "❌ Not in a git repository root"
  echo "   Run this from the repository root directory"
  exit 1
fi

# Check if hooks directory exists
if [ ! -d "$GIT_HOOKS_DIR" ]; then
  echo "❌ Git hooks directory not found: $GIT_HOOKS_DIR"
  exit 1
fi

echo ""
echo "📋 Available Hooks:"
echo "  1. pre-push  - Auto-rebuild knowledge graph before push"
echo ""

# Install pre-push hook
if [ -f "$GIT_HOOKS_DIR/pre-push" ]; then
  echo "⚠️  Existing pre-push hook found"
  read -p "   Backup and replace? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    mv "$GIT_HOOKS_DIR/pre-push" "$GIT_HOOKS_DIR/pre-push.backup.$(date +%s)"
    echo "   ✓ Backed up to pre-push.backup.*"
  else
    echo "   Skipping pre-push installation"
    exit 0
  fi
fi

# Copy and make executable
cp "$SCRIPT_DIR/pre-push.sample" "$GIT_HOOKS_DIR/pre-push"
chmod +x "$GIT_HOOKS_DIR/pre-push"

echo "✅ Installed pre-push hook"
echo ""
echo "🎯 Hook Configuration:"
echo "  The hook will:"
echo "    • Detect agent file changes (.agents/*.yml)"
echo "    • Rebuild knowledge graph automatically"
echo "    • Auto-commit graph updates (configurable)"
echo ""
echo "  Environment Variables:"
echo "    OSSA_AUTO_COMMIT_GRAPH=true|false  (default: true)"
echo "      Set to false to skip auto-committing graph changes"
echo ""
echo "  To disable temporarily:"
echo "    git push --no-verify"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Installation complete!"
echo ""
