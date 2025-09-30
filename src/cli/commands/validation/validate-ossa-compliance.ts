/**
 * Converted from validate-ossa-compliance.sh
 * Auto-generated TypeScript equivalent of shell script
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export async function main() {
  try {
    // !/bin/bash

    // OSSA Compliance Validation Script
    // Validates all agents meet OSSA v0.1.9 requirements

    execSync('set -e', { stdio: 'inherit' });

    process.chdir('$(dirname ${BASH_SOURCE[0]}) && pwd)');
    process.chdir('$SCRIPT_DIR/.. && pwd)');

    console.log('🔍 OSSA v0.1.9 Compliance Validation');
    console.log('====================================');

    // Count total agents
    execSync('TOTAL_AGENTS=$(find "$PROJECT_ROOT" -name "agent.yml" -type f | wc -l | tr -d \' \')', {
      stdio: 'inherit'
    });
    console.log('📊 Total agents found: $TOTAL_AGENTS');

    // Check OpenAPI specs
    execSync('OPENAPI_COUNT=$(find "$PROJECT_ROOT" -name "openapi.yml" -type f | wc -l | tr -d \' \')', {
      stdio: 'inherit'
    });
    console.log('📋 OpenAPI specs: $OPENAPI_COUNT / $TOTAL_AGENTS');

    // Check handlers
    execSync('HANDLER_COUNT=$(find "$PROJECT_ROOT" -name "*.handlers.ts" -type f | wc -l | tr -d \' \')', {
      stdio: 'inherit'
    });
    console.log('🔧 TypeScript handlers: $HANDLER_COUNT / $TOTAL_AGENTS');

    // Check schemas
    execSync('SCHEMA_COUNT=$(find "$PROJECT_ROOT" -name "*.schema.json" -type f | wc -l | tr -d \' \')', {
      stdio: 'inherit'
    });
    console.log('📋 JSON schemas: $SCHEMA_COUNT / $TOTAL_AGENTS');

    // Check metadata
    execSync('METADATA_COUNT=$(find "$PROJECT_ROOT" -name ".agents-metadata.json" -type f | wc -l | tr -d \' \')', {
      stdio: 'inherit'
    });
    console.log('📄 OSSA metadata: $METADATA_COUNT / $TOTAL_AGENTS');

    // Check package.json files
    execSync('PACKAGE_COUNT=$(find "$PROJECT_ROOT/.agents" -name "package.json" -type f | wc -l | tr -d \' \')', {
      stdio: 'inherit'
    });
    console.log('📦 Package configs: $PACKAGE_COUNT / $TOTAL_AGENTS');

    // Calculate compliance percentage
    // Function: calculate_compliance
    execSync('local component_count=$1', { stdio: 'inherit' });
    execSync('local total=$TOTAL_AGENTS', { stdio: 'inherit' });
    execSync('if [ "$total" -eq 0 ]; then', { stdio: 'inherit' });
    console.log('0');
    execSync('else', { stdio: 'inherit' });
    console.log('$(( (component_count * 100) / total ))');
    execSync('fi', { stdio: 'inherit' });
    execSync('}', { stdio: 'inherit' });

    execSync('OPENAPI_COMPLIANCE=$(calculate_compliance $OPENAPI_COUNT)', { stdio: 'inherit' });
    execSync('HANDLER_COMPLIANCE=$(calculate_compliance $HANDLER_COUNT)', { stdio: 'inherit' });
    execSync('SCHEMA_COMPLIANCE=$(calculate_compliance $SCHEMA_COUNT)', { stdio: 'inherit' });
    execSync('METADATA_COMPLIANCE=$(calculate_compliance $METADATA_COUNT)', { stdio: 'inherit' });
    execSync('PACKAGE_COMPLIANCE=$(calculate_compliance $PACKAGE_COUNT)', { stdio: 'inherit' });

    console.log('');
    console.log('📊 COMPLIANCE REPORT');
    console.log('====================');
    console.log('OpenAPI Specs:     ${OPENAPI_COMPLIANCE}% ($OPENAPI_COUNT/$TOTAL_AGENTS)');
    console.log('TypeScript Handlers: ${HANDLER_COMPLIANCE}% ($HANDLER_COUNT/$TOTAL_AGENTS)');
    console.log('JSON Schemas:      ${SCHEMA_COMPLIANCE}% ($SCHEMA_COUNT/$TOTAL_AGENTS)');
    console.log('OSSA Metadata:     ${METADATA_COMPLIANCE}% ($METADATA_COUNT/$TOTAL_AGENTS)');
    console.log('Package Configs:   ${PACKAGE_COMPLIANCE}% ($PACKAGE_COUNT/$TOTAL_AGENTS)');

    // Calculate overall compliance
    execSync(
      'OVERALL_COMPLIANCE=$(( (OPENAPI_COMPLIANCE + HANDLER_COMPLIANCE + SCHEMA_COMPLIANCE + METADATA_COMPLIANCE + PACKAGE_COMPLIANCE) / 5 ))',
      { stdio: 'inherit' }
    );

    console.log('');
    console.log('🎯 OVERALL OSSA v0.1.9 COMPLIANCE: ${OVERALL_COMPLIANCE}%');

    execSync('if [ "$OVERALL_COMPLIANCE" -ge 95 ]; then', { stdio: 'inherit' });
    console.log('✅ EXCELLENT! Full OSSA compliance achieved!');
    execSync('elif [ "$OVERALL_COMPLIANCE" -ge 80 ]; then', { stdio: 'inherit' });
    console.log('🟡 GOOD! High compliance, minor gaps to address');
    execSync('else', { stdio: 'inherit' });
    console.log('🔴 NEEDS WORK! Significant compliance gaps detected');
    execSync('fi', { stdio: 'inherit' });

    console.log('');
    console.log('🔍 Detailed Structure Check (Sample)');
    console.log('====================================');

    // Check a sample agent structure
    execSync('SAMPLE_AGENT=$(find "$PROJECT_ROOT/.agents" -name "agent.yml" -type f | head -1)', { stdio: 'inherit' });
    execSync('if [ -n "$SAMPLE_AGENT" ]; then', { stdio: 'inherit' });
    execSync('SAMPLE_DIR=$(dirname "$SAMPLE_AGENT")', { stdio: 'inherit' });
    execSync('SAMPLE_NAME=$(basename "$SAMPLE_DIR")', { stdio: 'inherit' });

    console.log('Checking: $SAMPLE_NAME');
    console.log('Directory: $SAMPLE_DIR');

    // Check required directories
    execSync(
      'declare -a required_dirs=("behaviors" "data" "handlers" "integrations" "schemas" "src" "tests" "config" "deployments")',
      { stdio: 'inherit' }
    );
    execSync('for dir in "${required_dirs[@]}"; do', { stdio: 'inherit' });
    execSync('if [ -d "$SAMPLE_DIR/$dir" ]; then', { stdio: 'inherit' });
    console.log('✅ $dir/');
    execSync('else', { stdio: 'inherit' });
    console.log('❌ $dir/ - MISSING');
    execSync('fi', { stdio: 'inherit' });
    execSync('done', { stdio: 'inherit' });

    // Check required files
    execSync(
      'declare -a required_files=("openapi.yml" "README.md" "package.json" "tsconfig.json" ".agents-metadata.json")',
      { stdio: 'inherit' }
    );
    execSync('for file in "${required_files[@]}"; do', { stdio: 'inherit' });
    execSync('if [ -f "$SAMPLE_DIR/$file" ]; then', { stdio: 'inherit' });
    console.log('✅ $file');
    execSync('else', { stdio: 'inherit' });
    console.log('❌ $file - MISSING');
    execSync('fi', { stdio: 'inherit' });
    execSync('done', { stdio: 'inherit' });
    execSync('fi', { stdio: 'inherit' });

    console.log('');
    console.log('🚀 VALIDATION COMPLETE!');
    console.log(chalk.green('✅ Script completed successfully'));
  } catch (error) {
    console.error(chalk.red('❌ Script failed:'), error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
