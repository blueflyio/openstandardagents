#!/bin/bash
# OSSA Platform Development Setup Script
# Sets up development environment for golden standard architecture

set -e

echo "🏆 OSSA Platform Development Setup"
echo "=================================="

# Check Node.js version
echo "📋 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ required. Found version: $(node --version)"
    exit 1
fi
echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install development tools
echo "🔧 Installing development tools..."
npm install -g tsx @stoplight/spectral-cli

# Set up TypeScript
echo "📝 Setting up TypeScript..."
if [ ! -f "tsconfig.json" ]; then
    echo "Creating basic tsconfig.json..."
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "__DELETE_LATER"]
}
EOF
fi

# Set up Git hooks
echo "🔗 Setting up Git hooks..."
mkdir -p .git/hooks
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run linting and type checking before commit
echo "🔍 Running pre-commit checks..."

# Type check
npm run typecheck || exit 1

# Lint OpenAPI spec if it exists
if [ -f "api/openapi.yaml" ]; then
    spectral lint api/openapi.yaml || exit 1
fi

echo "✅ Pre-commit checks passed"
EOF
chmod +x .git/hooks/pre-commit

echo "✅ Development environment setup complete!"
echo ""
echo "🚀 Next steps:"
echo "  1. npm run dev        # Start development server"
echo "  2. npm run test       # Run tests"
echo "  3. npm run lint       # Lint code"
echo "  4. npm run typecheck  # Check types"