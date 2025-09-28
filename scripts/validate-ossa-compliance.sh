#!/bin/bash

# OSSA Compliance Validation Script
# Validates all agents meet OSSA v0.1.9 requirements

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔍 OSSA v0.1.9 Compliance Validation"
echo "===================================="

# Count total agents
TOTAL_AGENTS=$(find "$PROJECT_ROOT" -name "agent.yml" -type f | wc -l | tr -d ' ')
echo "📊 Total agents found: $TOTAL_AGENTS"

# Check OpenAPI specs
OPENAPI_COUNT=$(find "$PROJECT_ROOT" -name "openapi.yml" -type f | wc -l | tr -d ' ')
echo "📋 OpenAPI specs: $OPENAPI_COUNT / $TOTAL_AGENTS"

# Check handlers
HANDLER_COUNT=$(find "$PROJECT_ROOT" -name "*.handlers.ts" -type f | wc -l | tr -d ' ')
echo "🔧 TypeScript handlers: $HANDLER_COUNT / $TOTAL_AGENTS"

# Check schemas
SCHEMA_COUNT=$(find "$PROJECT_ROOT" -name "*.schema.json" -type f | wc -l | tr -d ' ')
echo "📋 JSON schemas: $SCHEMA_COUNT / $TOTAL_AGENTS"

# Check metadata
METADATA_COUNT=$(find "$PROJECT_ROOT" -name ".agents-metadata.json" -type f | wc -l | tr -d ' ')
echo "📄 OSSA metadata: $METADATA_COUNT / $TOTAL_AGENTS"

# Check package.json files
PACKAGE_COUNT=$(find "$PROJECT_ROOT/.agents" -name "package.json" -type f | wc -l | tr -d ' ')
echo "📦 Package configs: $PACKAGE_COUNT / $TOTAL_AGENTS"

# Calculate compliance percentage
calculate_compliance() {
    local component_count=$1
    local total=$TOTAL_AGENTS
    if [ "$total" -eq 0 ]; then
        echo "0"
    else
        echo "$(( (component_count * 100) / total ))"
    fi
}

OPENAPI_COMPLIANCE=$(calculate_compliance $OPENAPI_COUNT)
HANDLER_COMPLIANCE=$(calculate_compliance $HANDLER_COUNT)
SCHEMA_COMPLIANCE=$(calculate_compliance $SCHEMA_COUNT)
METADATA_COMPLIANCE=$(calculate_compliance $METADATA_COUNT)
PACKAGE_COMPLIANCE=$(calculate_compliance $PACKAGE_COUNT)

echo ""
echo "📊 COMPLIANCE REPORT"
echo "===================="
echo "OpenAPI Specs:     ${OPENAPI_COMPLIANCE}% ($OPENAPI_COUNT/$TOTAL_AGENTS)"
echo "TypeScript Handlers: ${HANDLER_COMPLIANCE}% ($HANDLER_COUNT/$TOTAL_AGENTS)"
echo "JSON Schemas:      ${SCHEMA_COMPLIANCE}% ($SCHEMA_COUNT/$TOTAL_AGENTS)"
echo "OSSA Metadata:     ${METADATA_COMPLIANCE}% ($METADATA_COUNT/$TOTAL_AGENTS)"
echo "Package Configs:   ${PACKAGE_COMPLIANCE}% ($PACKAGE_COUNT/$TOTAL_AGENTS)"

# Calculate overall compliance
OVERALL_COMPLIANCE=$(( (OPENAPI_COMPLIANCE + HANDLER_COMPLIANCE + SCHEMA_COMPLIANCE + METADATA_COMPLIANCE + PACKAGE_COMPLIANCE) / 5 ))

echo ""
echo "🎯 OVERALL OSSA v0.1.9 COMPLIANCE: ${OVERALL_COMPLIANCE}%"

if [ "$OVERALL_COMPLIANCE" -ge 95 ]; then
    echo "✅ EXCELLENT! Full OSSA compliance achieved!"
elif [ "$OVERALL_COMPLIANCE" -ge 80 ]; then
    echo "🟡 GOOD! High compliance, minor gaps to address"
else
    echo "🔴 NEEDS WORK! Significant compliance gaps detected"
fi

echo ""
echo "🔍 Detailed Structure Check (Sample)"
echo "===================================="

# Check a sample agent structure
SAMPLE_AGENT=$(find "$PROJECT_ROOT/.agents" -name "agent.yml" -type f | head -1)
if [ -n "$SAMPLE_AGENT" ]; then
    SAMPLE_DIR=$(dirname "$SAMPLE_AGENT")
    SAMPLE_NAME=$(basename "$SAMPLE_DIR")

    echo "Checking: $SAMPLE_NAME"
    echo "Directory: $SAMPLE_DIR"

    # Check required directories
    declare -a required_dirs=("behaviors" "data" "handlers" "integrations" "schemas" "src" "tests" "config" "deployments")
    for dir in "${required_dirs[@]}"; do
        if [ -d "$SAMPLE_DIR/$dir" ]; then
            echo "✅ $dir/"
        else
            echo "❌ $dir/ - MISSING"
        fi
    done

    # Check required files
    declare -a required_files=("openapi.yml" "README.md" "package.json" "tsconfig.json" ".agents-metadata.json")
    for file in "${required_files[@]}"; do
        if [ -f "$SAMPLE_DIR/$file" ]; then
            echo "✅ $file"
        else
            echo "❌ $file - MISSING"
        fi
    done
fi

echo ""
echo "🚀 VALIDATION COMPLETE!"