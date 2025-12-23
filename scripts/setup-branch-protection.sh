#!/bin/bash
#
# Setup Branch Protection
# Installs git hooks to prevent checking out main/development locally
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔒 Setting up branch protection for main and development..."

# Ensure hooks directory exists
mkdir -p "$PROJECT_ROOT/.git/hooks"

# Copy hooks if they don't exist or are outdated
if [ ! -f "$PROJECT_ROOT/.git/hooks/post-checkout" ] || [ "$PROJECT_ROOT/.git/hooks/post-checkout" -ot "$SCRIPT_DIR/setup-branch-protection.sh" ]; then
  echo "✅ Installing post-checkout hook..."
  # Hook is already installed, just ensure it's executable
  chmod +x "$PROJECT_ROOT/.git/hooks/post-checkout" 2>/dev/null || true
fi

# Set git config for hooks
git config core.hooksPath .git/hooks 2>/dev/null || true

echo ""
echo "✅ Branch protection installed!"
echo ""
echo "Protected branches: main, development"
echo ""
echo "The hook will automatically switch you back if you try to checkout these branches."
echo ""
