/**
 * Converted from organize-docs.sh
 * Auto-generated TypeScript equivalent of shell script
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export async function main() {
  try {
    // !/bin/bash
    // OSSA Documentation Organization Script
    // Consolidates and organizes OSSA documentation according to the new taxonomy

    execSync('set -e', { stdio: 'inherit' });

    console.log('📚 OSSA Documentation Organization Tool');
    console.log('=======================================');
    console.log('');

    // Color codes
    const GREEN = '\\033[0;32m';
    const YELLOW = '\\033[1;33m';
    const BLUE = '\\033[0;34m';
    const RED = '\\033[0;31m';
    execSync("NC='\\033[0m' # No Color", { stdio: 'inherit' });

    const DOCS_DIR = '/Users/flux423/Sites/LLM/OSSA/docs';
    const ARCHIVE_DIR = '$DOCS_DIR/.archive';

    // Create archive directory
    console.log('-e ${BLUE}📁 Creating archive directory...${NC}');
    fs.mkdirSync('$ARCHIVE_DIR', { recursive: true });

    // Function to safely move directory
    // Function: move_to_archive
    execSync('local dir=$1', { stdio: 'inherit' });
    execSync('local name=$(basename "$dir")', { stdio: 'inherit' });

    execSync('if [ -d "$dir" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Archiving $name${NC}');
    execSync('mv "$dir" "$ARCHIVE_DIR/" 2>/dev/null || echo -e "    ${RED}Failed to move $name${NC}"', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });
    execSync('}', { stdio: 'inherit' });

    // Archive outdated directories
    console.log('-e ${BLUE}📦 Archiving outdated content...${NC}');

    // Directories to archive
    const ARCHIVE_DIRS = '(';
    execSync('"$DOCS_DIR/coordination-plans"', { stdio: 'inherit' });
    execSync('"$DOCS_DIR/dita"', { stdio: 'inherit' });
    execSync('"$DOCS_DIR/planning"', { stdio: 'inherit' });
    execSync('"$DOCS_DIR/status"', { stdio: 'inherit' });
    execSync('"$DOCS_DIR/ideas"', { stdio: 'inherit' });
    execSync('"$DOCS_DIR/diagrams"', { stdio: 'inherit' });
    execSync('"$DOCS_DIR/adr"', { stdio: 'inherit' });
    execSync(')', { stdio: 'inherit' });

    execSync('for dir in "${ARCHIVE_DIRS[@]}"; do', { stdio: 'inherit' });
    execSync('move_to_archive "$dir"', { stdio: 'inherit' });
    execSync('done', { stdio: 'inherit' });

    // Consolidate loose documentation files
    console.log('-e ${BLUE}📄 Organizing loose documentation files...${NC}');

    // Move numbered docs to appropriate locations
    execSync('if [ -f "$DOCS_DIR/01-project-overview.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving overview documents${NC}');
    execSync('mv "$DOCS_DIR/01-project-overview.md" "$DOCS_DIR/overview/project-overview.md" 2>/dev/null || true', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/02-api.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving API documentation${NC}');
    execSync('mv "$DOCS_DIR/02-api.md" "$DOCS_DIR/api/api-guide.md" 2>/dev/null || true', { stdio: 'inherit' });
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/03-features.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving feature documentation${NC}');
    execSync('mv "$DOCS_DIR/03-features.md" "$DOCS_DIR/overview/features.md" 2>/dev/null || true', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/04-best-practices.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving best practices${NC}');
    execSync('mv "$DOCS_DIR/04-best-practices.md" "$DOCS_DIR/development/best-practices.md" 2>/dev/null || true', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/05-architecture.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving architecture docs${NC}');
    execSync('mv "$DOCS_DIR/05-architecture.md" "$DOCS_DIR/overview/architecture.md" 2>/dev/null || true', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/06-deployment.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving deployment guides${NC}');
    execSync('mv "$DOCS_DIR/06-deployment.md" "$DOCS_DIR/operations/deployment-guide.md" 2>/dev/null || true', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/07-modules-components.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving component documentation${NC}');
    execSync('mv "$DOCS_DIR/07-modules-components.md" "$DOCS_DIR/development/components.md" 2>/dev/null || true', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/08-security-compliance.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving security documentation${NC}');
    execSync(
      'mv "$DOCS_DIR/08-security-compliance.md" "$DOCS_DIR/enterprise/security-compliance.md" 2>/dev/null || true',
      { stdio: 'inherit' }
    );
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/09-maintenance.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving maintenance guides${NC}');
    execSync('mv "$DOCS_DIR/09-maintenance.md" "$DOCS_DIR/operations/maintenance.md" 2>/dev/null || true', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/10-appendices.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving appendices${NC}');
    execSync('mv "$DOCS_DIR/10-appendices.md" "$DOCS_DIR/reference/appendices.md" 2>/dev/null || true', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });

    // Move specialized docs
    console.log('-e ${BLUE}📋 Moving specialized documentation...${NC}');

    execSync('if [ -f "$DOCS_DIR/CI-BRANCHING-STRATEGY.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving CI/CD documentation${NC}');
    execSync('mv "$DOCS_DIR/CI-BRANCHING-STRATEGY.md" "$DOCS_DIR/development/ci-branching.md" 2>/dev/null || true', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/COMPLIANCE-ENGINE.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving compliance documentation${NC}');
    execSync('mv "$DOCS_DIR/COMPLIANCE-ENGINE.md" "$DOCS_DIR/enterprise/compliance-engine.md" 2>/dev/null || true', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/claude-desktop-integration.md" ]; then', { stdio: 'inherit' });
    console.log('-e   ${YELLOW}→ Moving integration guides${NC}');
    execSync(
      'mv "$DOCS_DIR/claude-desktop-integration.md" "$DOCS_DIR/examples/claude-integration.md" 2>/dev/null || true',
      { stdio: 'inherit' }
    );
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/adk-integration.md" ]; then', { stdio: 'inherit' });
    execSync('mv "$DOCS_DIR/adk-integration.md" "$DOCS_DIR/examples/adk-integration.md" 2>/dev/null || true', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });

    execSync('if [ -f "$DOCS_DIR/voice-agent-compliance.md" ]; then', { stdio: 'inherit' });
    execSync('mv "$DOCS_DIR/voice-agent-compliance.md" "$DOCS_DIR/specifications/voice-agent.md" 2>/dev/null || true', {
      stdio: 'inherit'
    });
    execSync('fi', { stdio: 'inherit' });

    // Clean up empty directories
    console.log('-e ${BLUE}🧹 Cleaning up empty directories...${NC}');
    execSync('find "$DOCS_DIR" -type d -empty -delete 2>/dev/null || true', { stdio: 'inherit' });

    // Generate documentation statistics
    console.log('-e ${BLUE}📊 Generating documentation statistics...${NC}');

    execSync('TOTAL_DIRS=$(find "$DOCS_DIR" -type d -not -path "$ARCHIVE_DIR/*" | wc -l)', { stdio: 'inherit' });
    execSync('TOTAL_FILES=$(find "$DOCS_DIR" -type f -name "*.md" -not -path "$ARCHIVE_DIR/*" | wc -l)', {
      stdio: 'inherit'
    });
    execSync('ARCHIVED_FILES=$(find "$ARCHIVE_DIR" -type f -name "*.md" 2>/dev/null | wc -l)', { stdio: 'inherit' });

    // Summary
    console.log('');
    console.log('=======================================');
    console.log('-e ${GREEN}✅ Documentation Organization Complete${NC}');
    console.log('=======================================');
    console.log('Active directories: $TOTAL_DIRS');
    console.log('Active documents: $TOTAL_FILES');
    console.log('Archived items: $ARCHIVED_FILES');
    console.log('');
    console.log('-e ${BLUE}📁 Organized structure:${NC}');
    console.log('  • overview/      - Project introduction');
    console.log('  • getting-started/ - Quick start guides');
    console.log('  • api/           - API documentation');
    console.log('  • specifications/ - Technical specs');
    console.log('  • development/   - Developer guides');
    console.log('  • enterprise/    - Enterprise features');
    console.log('  • examples/      - Code examples');
    console.log('  • migration/     - Migration guides');
    console.log('  • operations/    - Operations guides');
    console.log('');
    console.log('-e ${YELLOW}📦 Archived content in: $ARCHIVE_DIR${NC}');
    console.log('');
    console.log('-e ${GREEN}✨ Your documentation is now clean and organized!${NC}');
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
