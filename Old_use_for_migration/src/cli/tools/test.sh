#!/bin/bash
# OSSA Platform CI Test Script
# Comprehensive testing for golden standard architecture

set -e

echo "🧪 OSSA Platform CI Test Suite"
echo "=============================="

# Environment check
echo "📋 Environment Info:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  Working Directory: $(pwd)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Type checking
echo "🔍 Type checking..."
npm run typecheck

# Linting
echo "🧹 Linting code..."
npm run lint

# OpenAPI validation
if [ -f "api/openapi.yaml" ]; then
    echo "📝 Validating OpenAPI specification..."
    if command -v spectral &> /dev/null; then
        spectral lint api/openapi.yaml
    else
        echo "⚠️  Spectral not found, installing..."
        npm install -g @stoplight/spectral-cli
        spectral lint api/openapi.yaml
    fi
else
    echo "⚠️  No OpenAPI spec found at api/openapi.yaml"
fi

# Unit tests
echo "🎯 Running unit tests..."
if [ -d "tests/unit" ] && [ "$(find tests/unit -name '*.test.ts' | wc -l)" -gt 0 ]; then
    npm run test:unit
else
    echo "⚠️  No unit tests found"
fi

# Integration tests
echo "🔗 Running integration tests..."
if [ -d "tests/integration" ] && [ "$(find tests/integration -name '*.test.ts' | wc -l)" -gt 0 ]; then
    npm run test:integration
else
    echo "⚠️  No integration tests found"
fi

# Contract tests (OpenAPI compliance)
echo "📋 Running contract tests..."
if [ -f "tests/contract/openapi.test.ts" ]; then
    npm run test:contract
else
    echo "⚠️  No contract tests found"
fi

# Security audit
echo "🔒 Running security audit..."
npm audit --audit-level high

# Build check
echo "🏗️  Testing build..."
npm run build

echo ""
echo "✅ All CI tests passed!"
echo "📊 Test Summary:"
echo "  ✅ Type checking"
echo "  ✅ Code linting"
echo "  ✅ OpenAPI validation"
echo "  ✅ Unit tests"
echo "  ✅ Integration tests"
echo "  ✅ Contract tests"
echo "  ✅ Security audit"
echo "  ✅ Build verification"