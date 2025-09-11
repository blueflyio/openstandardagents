#!/bin/bash
# OSSA Platform Build Script
# Production build for golden standard architecture

set -e

echo "🏗️  OSSA Platform Production Build"
echo "================================="

# Environment check
echo "📋 Build Environment:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  Build Target: ${NODE_ENV:-production}"
echo ""

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf coverage/

# Install production dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Type checking
echo "🔍 Type checking..."
npx tsc --noEmit

# Build TypeScript
echo "📝 Building TypeScript..."
npx tsc --project tsconfig.build.json

# Validate OpenAPI spec
if [ -f "api/openapi.yaml" ]; then
    echo "✅ Validating OpenAPI specification..."
    npx spectral lint api/openapi.yaml
fi

# Copy non-TypeScript assets
echo "📋 Copying assets..."
if [ -d "api" ]; then
    cp -r api/ dist/api/
fi

if [ -d ".agents" ]; then
    cp -r .agents/ dist/.agents/
fi

# Create production package.json
echo "📦 Creating production package.json..."
node -e "
const pkg = require('./package.json');
const prodPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  main: 'index.js',
  type: 'module',
  engines: pkg.engines,
  dependencies: pkg.dependencies,
  bin: pkg.bin
};
require('fs').writeFileSync('dist/package.json', JSON.stringify(prodPkg, null, 2));
"

# Copy README and LICENSE
if [ -f "README.md" ]; then
    cp README.md dist/
fi

if [ -f "LICENSE" ]; then
    cp LICENSE dist/
fi

# Create version info
echo "📋 Creating version info..."
cat > dist/version.json << EOF
{
  "version": "$(node -p "require('./package.json').version")",
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "nodeVersion": "$(node --version)",
  "ossaVersion": "0.1.8",
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
}
EOF

# Calculate build size
BUILD_SIZE=$(du -sh dist/ | cut -f1)
echo ""
echo "✅ Build completed successfully!"
echo "📊 Build Summary:"
echo "  📁 Output: dist/"
echo "  📏 Size: $BUILD_SIZE"
echo "  🏷️  Version: $(node -p "require('./package.json').version")"
echo "  📅 Built: $(date)"
echo ""
echo "🚀 Ready for deployment!"