#!/bin/bash
# Quick Setup Script for Release Automation
# Run this after MR is merged

set -e

echo "🚀 Release Automation Setup"
echo "=============================="
echo ""

# Check if we're on development branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "development" ]; then
    echo "⚠️  Warning: Not on development branch (current: $CURRENT_BRANCH)"
    echo "   Switch to development first: git checkout development"
    exit 1
fi

echo "✅ On development branch"
echo ""

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if ! npm list @gitbeaker/rest &>/dev/null; then
    echo "❌ @gitbeaker/rest not found"
    echo "   Run: npm install"
    exit 1
fi

if ! npm list @octokit/rest &>/dev/null; then
    echo "❌ @octokit/rest not found"
    echo "   Run: npm install"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check CI/CD variables
echo "🔐 Checking CI/CD variables..."
echo ""
echo "Required variables (set in GitLab UI):"
echo "  - GITLAB_TOKEN (Project Access Token)"
echo "  - NPM_TOKEN (npm automation token)"
echo "  - GITHUB_TOKEN (GitHub Personal Access Token)"
echo ""
echo "To set these:"
echo "  1. Go to: Settings → CI/CD → Variables"
echo "  2. Add each variable"
echo "  3. Mark as 'Protected' and 'Masked'"
echo ""

# Check webhooks
echo "🔗 Webhooks to configure:"
echo ""
echo "Webhook 1: Milestone Events"
echo "  URL: https://your-webhook-endpoint.com/milestone"
echo "  Trigger: Milestone events"
echo ""
echo "Webhook 2: Push Events"
echo "  URL: https://your-webhook-endpoint.com/push"
echo "  Trigger: Push events (development branch)"
echo ""
echo "To configure:"
echo "  Go to: Settings → Webhooks"
echo ""

# Run tests
echo "🧪 Running tests..."
if npm test; then
    echo "✅ All tests passing"
else
    echo "❌ Tests failed"
    exit 1
fi

echo ""
echo "=============================="
echo "✅ Setup checks complete!"
echo ""
echo "Next steps:"
echo "  1. Configure webhooks in GitLab UI"
echo "  2. Set CI/CD variables in GitLab UI"
echo "  3. Create test milestone: v0.2.7-test"
echo "  4. Verify automation works"
echo ""
echo "See DEPLOYMENT_CHECKLIST.md for details"
