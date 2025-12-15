#!/usr/bin/env node
/**
 * OSSA to GitLab Duo Agent Config Generator
 *
 * This script converts an OSSA v0.3.0 manifest into a GitLab Duo agent config.
 * It's the bridge between OSSA and GitLab's native agent system.
 *
 * DOGFOODING: Proving OSSA can drive GitLab's agent ecosystem!
 *
 * Usage:
 *   node generate-duo-config.js manifest.ossa.yaml > duo-config.yaml
 *
 * The generated config can be copied to:
 *   https://gitlab.com/blueflyio/openstandardagents/-/automate/agents/1261/edit
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Read OSSA manifest
const manifestPath = process.argv[2] || path.join(__dirname, 'manifest.ossa.yaml');
const manifest = yaml.parse(fs.readFileSync(manifestPath, 'utf8'));

// Extract key information from OSSA manifest
const {
  metadata,
  spec
} = manifest;

// Generate GitLab Duo config from OSSA manifest
function generateDuoConfig(manifest) {
  const { metadata, spec } = manifest;

  // Build comprehensive command list from OSSA capabilities
  const commands = [];

  // Phase 1: Environment Setup
  commands.push(`
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 ${metadata.name} v${metadata.version} - POWERED BY OSSA v0.3.0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "DOGFOODING OSSA INSIDE GITLAB! 🎯"
echo ""
  `.trim());

  // Install dependencies
  commands.push(`
apt-get update && apt-get install -y --no-install-recommends \\
  git jq curl python3 python3-pip shellcheck ripgrep \\
  && rm -rf /var/lib/apt/lists/*
  `.trim());

  commands.push('npm ci --prefer-offline --no-audit');
  commands.push('npm run build 2>/dev/null || echo "No build script"');
  commands.push('pip3 install --break-system-packages yamllint jsonschema 2>/dev/null || true');

  // Phase 2: OSSA Validation (from capabilities)
  if (spec.capabilities?.some(c => c.name === 'ossa_validation')) {
    commands.push(`
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 PHASE: OSSA v0.3.0 Deep Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

VALIDATION_PASSED=0
VALIDATION_FAILED=0
VALIDATION_WARNINGS=0

for manifest in $(find . -type f \\( -name "*.ossa.yaml" -o -name "*.ossa.yml" \\) ! -path "./node_modules/*"); do
  echo ""
  echo "📄 Validating: $manifest"

  # Get version
  VERSION=$(grep -E "^apiVersion:" "$manifest" | head -1 | sed 's/apiVersion: *//' | tr -d '"'"'"' || echo "unknown")
  echo "   Version: $VERSION"

  # Run OSSA CLI validation
  if npx ossa validate "$manifest" 2>&1; then
    echo "   ✅ Schema: VALID"
    VALIDATION_PASSED=$((VALIDATION_PASSED + 1))
  else
    echo "   ❌ Schema: INVALID"
    VALIDATION_FAILED=$((VALIDATION_FAILED + 1))
  fi

  # v0.3.0 deep checks
  if echo "$VERSION" | grep -q "v0.3"; then
    echo "   🔬 v0.3.0 compliance checks..."

    # Check for env var models
    if grep -qE "model:\\s*(claude-|gpt-|gemini-)" "$manifest" 2>/dev/null; then
      if ! grep -qE 'model:\\s*\$\{' "$manifest" 2>/dev/null; then
        echo "   ⚠️  Hardcoded model - use \\\${LLM_MODEL:-default}"
        VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
      fi
    fi

    # Check required sections
    for section in observability safety cost_tracking; do
      if ! grep -q "$section:" "$manifest" 2>/dev/null; then
        echo "   ⚠️  Missing: $section"
        VALIDATION_WARNINGS=$((VALIDATION_WARNINGS + 1))
      fi
    done
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 OSSA Validation: ✅ $VALIDATION_PASSED | ❌ $VALIDATION_FAILED | ⚠️ $VALIDATION_WARNINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    `.trim());
  }

  // Phase 3: Code Quality (from capabilities)
  if (spec.capabilities?.some(c => c.name === 'code_review')) {
    commands.push(`
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 PHASE: Code Quality Analysis"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# TypeScript/ESLint
if [ -f "package.json" ] && grep -q "eslint" package.json 2>/dev/null; then
  echo "📋 ESLint..."
  npx eslint . --ext .ts,.js --format stylish --max-warnings 100 2>/dev/null || true
fi

# YAML lint
echo "📋 YAML lint..."
yamllint -d "{extends: default, rules: {line-length: disable, document-start: disable}}" \\
  .gitlab/agents/ .agents/ spec/ 2>/dev/null || true

# ShellCheck
echo "📋 ShellCheck..."
find . -name "*.sh" -type f ! -path "./node_modules/*" -exec shellcheck {} \\; 2>/dev/null || true

echo "✅ Code quality analysis complete"
    `.trim());
  }

  // Phase 4: Security Scanning (from capabilities)
  if (spec.capabilities?.some(c => c.name === 'security_scan')) {
    commands.push(`
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 PHASE: Security Scanning"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SECURITY_ISSUES=0

# Secrets scan
echo "🔍 Scanning for secrets..."
PATTERNS="(api[_-]?key|apikey|secret|password|token|auth|private[_-]?key)"
if rg -i "$PATTERNS" --glob "!node_modules/**" --glob "!*.md" --glob "!*.lock" . 2>/dev/null | grep -v "env:" | grep -v '\$\{' | head -10; then
  echo "⚠️  Potential secrets found"
  SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
  echo "✅ No secrets detected"
fi

# Hardcoded credentials
echo "🔍 Checking for credentials..."
if rg -i "(glpat-|ghp_|sk-|xoxb-|AKIA)" --glob "!node_modules/**" . 2>/dev/null | head -5; then
  echo "❌ HARDCODED CREDENTIALS!"
  SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
else
  echo "✅ No hardcoded credentials"
fi

# npm audit
echo "🔍 npm audit..."
npm audit --audit-level=high 2>/dev/null || true

echo ""
echo "🔒 Security: $SECURITY_ISSUES issue(s)"
    `.trim());
  }

  // Phase 5: Documentation Check
  if (spec.capabilities?.some(c => c.name === 'documentation_check')) {
    commands.push(`
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 PHASE: Documentation Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ -f "README.md" ] && echo "✅ README.md" || echo "⚠️ No README.md"
[ -f "CHANGELOG.md" ] && echo "✅ CHANGELOG.md" || echo "⚠️ No CHANGELOG.md"

for dir in .gitlab/agents/* .agents/*/; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  if [ -f "$dir/README.md" ] || [ -f "$dir/system-prompt.md" ]; then
    echo "✅ $name: documented"
  else
    echo "⚠️ $name: needs docs"
  fi
done
    `.trim());
  }

  // Phase 6: Auto-Fix Suggestions
  if (spec.capabilities?.some(c => c.name === 'auto_fix')) {
    commands.push(`
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 PHASE: Self-Healing Suggestions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FIXES=0

for manifest in $(find . -name "*.ossa.yaml" ! -path "./node_modules/*"); do
  # Missing apiVersion
  if ! grep -q "^apiVersion:" "$manifest"; then
    echo "🔧 $manifest: Add 'apiVersion: ossa/v0.3.0'"
    FIXES=$((FIXES + 1))
  fi

  # Missing kind
  if ! grep -q "^kind:" "$manifest"; then
    echo "🔧 $manifest: Add 'kind: Agent'"
    FIXES=$((FIXES + 1))
  fi

  # Hardcoded models
  if grep -qE "model:\\s*(claude-|gpt-)" "$manifest" 2>/dev/null; then
    if ! grep -qE 'model:\\s*\$\{' "$manifest" 2>/dev/null; then
      echo "🔧 $manifest: Use \\\${LLM_MODEL:-claude-sonnet-4}"
      FIXES=$((FIXES + 1))
    fi
  fi
done

echo ""
echo "📊 Suggested fixes: $FIXES"
    `.trim());
  }

  // Final Summary
  const capList = spec.capabilities?.map(c => c.name).join(', ') || 'all';
  commands.push(`
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 ${metadata.name} - COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "OSSA v0.3.0 DOGFOODING SUCCESS! 🚀"
echo ""
echo "This agent was defined by: .gitlab/agents/gitlab-duo-ossa/manifest.ossa.yaml"
echo "Schema version: ${manifest.apiVersion}"
echo "Capabilities: ${capList}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  `.trim());

  // Build final config
  const duoConfig = {
    image: spec.runtime?.image || 'node:20-bookworm',
    commands: commands
  };

  return duoConfig;
}

// Generate and output
const duoConfig = generateDuoConfig(manifest);

// Output as YAML (simplified for GitLab Duo)
console.log(`# =============================================================================
# GITLAB DUO AGENT CONFIG - AUTO-GENERATED FROM OSSA v0.3.0 MANIFEST
# =============================================================================
#
# Source: .gitlab/agents/gitlab-duo-ossa/manifest.ossa.yaml
# Generated: ${new Date().toISOString()}
#
# COPY THIS TO: https://gitlab.com/blueflyio/openstandardagents/-/automate/agents/1261/edit
#
# DOGFOODING OSSA INSIDE GITLAB! 🚀
# =============================================================================

image: ${duoConfig.image}

commands:`);

duoConfig.commands.forEach((cmd, i) => {
  // Multi-line commands use |
  if (cmd.includes('\n')) {
    console.log(`  - |`);
    cmd.split('\n').forEach(line => {
      console.log(`    ${line}`);
    });
  } else {
    console.log(`  - ${cmd}`);
  }
});

console.log(`
# =============================================================================
# END OF GENERATED CONFIG
#
# This agent is PROOF that OSSA works.
# Every validation it runs demonstrates the power of standardized schemas.
#
# OSSA v0.3.0 - The OpenAPI for AI Agents
# =============================================================================`);
