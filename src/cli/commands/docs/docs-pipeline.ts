/**
 * Converted from docs-pipeline.sh
 * Auto-generated TypeScript equivalent of shell script
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export async function main() {
  try {
    // !/bin/bash
    // OSSA Complete Documentation Pipeline
    // Organizes, generates, and deploys documentation

    execSync('set -e', { stdio: 'inherit' });

    console.log('═══════════════════════════════════════════════════════');
    console.log('           OSSA Documentation Pipeline v1.0            ');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Color codes
    const GREEN = '\\033[0;32m';
    const YELLOW = '\\033[1;33m';
    const BLUE = '\\033[0;34m';
    const RED = '\\033[0;31m';
    const CYAN = '\\033[0;36m';
    const BOLD = '\\033[1m';
    execSync("NC='\\033[0m' # No Color", { stdio: 'inherit' });

    const SCRIPT_DIR = '/Users/flux423/Sites/LLM/OSSA/scripts';

    // Parse command line arguments
    const COMMAND = '${1:-all}';
    const OPTION = '${2:-}';

    // Function to run with status
    // Function: run_step
    execSync('local step_name=$1', { stdio: 'inherit' });
    execSync('local script=$2', { stdio: 'inherit' });

    console.log('-e ${CYAN}${BOLD}━━━ $step_name ━━━${NC}');

    execSync('if bash "$script"; then', { stdio: 'inherit' });
    console.log('-e ${GREEN}✅ $step_name completed successfully${NC}\\n');
    execSync('return 0', { stdio: 'inherit' });
    execSync('else', { stdio: 'inherit' });
    console.log('-e ${RED}❌ $step_name failed${NC}\\n');
    execSync('return 1', { stdio: 'inherit' });
    execSync('fi', { stdio: 'inherit' });
    execSync('}', { stdio: 'inherit' });

    // Show help
    // Function: show_help
    console.log('Usage: $0 [command] [options]');
    console.log('');
    console.log('Commands:');
    console.log('  all         Run complete documentation pipeline (default)');
    console.log('  organize    Organize and clean documentation structure');
    console.log('  api         Generate API documentation from OpenAPI specs');
    console.log('  deploy      Deploy to GitLab Pages');
    console.log('  status      Show documentation status');
    console.log('  help        Show this help message');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run   Show what would be done without making changes');
    console.log('  --verbose   Show detailed output');
    console.log('');
    console.log('Examples:');
    console.log('  $0                 # Run complete pipeline');
    console.log('  $0 organize        # Only organize docs');
    console.log('  $0 api             # Only generate API docs');
    console.log('  $0 status          # Check current status');
    execSync('}', { stdio: 'inherit' });

    // Show documentation status
    // Function: show_status
    console.log('-e ${BLUE}${BOLD}📊 Documentation Status${NC}');
    console.log('');

    const DOCS_DIR = '/Users/flux423/Sites/LLM/OSSA/docs';

    // Count directories and files
    execSync('TOTAL_DIRS=$(find "$DOCS_DIR" -type d | wc -l)', { stdio: 'inherit' });
    execSync('TOTAL_FILES=$(find "$DOCS_DIR" -type f -name "*.md" | wc -l)', { stdio: 'inherit' });
    execSync('API_SPECS=$(find "$DOCS_DIR" -name "*.yml" -o -name "*.yaml" | wc -l)', { stdio: 'inherit' });

    console.log('-e ${CYAN}Directory Structure:${NC}');
    execSync('tree -L 2 -d "$DOCS_DIR" 2>/dev/null || ls -la "$DOCS_DIR"', { stdio: 'inherit' });

    console.log('');
    console.log('-e ${CYAN}Statistics:${NC}');
    console.log('  • Total directories: $TOTAL_DIRS');
    console.log('  • Markdown files: $TOTAL_FILES');
    console.log('  • API specifications: $API_SPECS');

    execSync('if [ -d "$DOCS_DIR/.archive" ]; then', { stdio: 'inherit' });
    execSync('ARCHIVED=$(find "$DOCS_DIR/.archive" -type f | wc -l)', { stdio: 'inherit' });
    console.log('  • Archived items: $ARCHIVED');
    execSync('fi', { stdio: 'inherit' });

    console.log('');
    console.log('-e ${CYAN}Key Files:${NC}');
    execSync('[ -f "$DOCS_DIR/README.md" ] && echo "  ✅ Main README exists"', { stdio: 'inherit' });
    execSync('[ -f "$DOCS_DIR/DOCUMENTATION_TAXONOMY.md" ] && echo "  ✅ Taxonomy defined"', { stdio: 'inherit' });
    execSync('[ -f "$DOCS_DIR/CLEANUP_REPORT.md" ] && echo "  ✅ Cleanup report available"', { stdio: 'inherit' });

    console.log('');
    execSync('}', { stdio: 'inherit' });

    // Deploy to GitLab Pages
    // Function: deploy_docs
    console.log('-e ${BLUE}${BOLD}🚀 Deploying to GitLab Pages${NC}');
    console.log('');

    const PUBLIC_DIR = '/Users/flux423/Sites/LLM/OSSA/public';

    // Check if public directory exists
    execSync('if [ ! -d "$PUBLIC_DIR" ]; then', { stdio: 'inherit' });
    console.log('-e ${RED}Public directory not found!${NC}');
    execSync('return 1', { stdio: 'inherit' });
    execSync('fi', { stdio: 'inherit' });

    // Copy organized docs to public
    console.log('-e ${YELLOW}Copying documentation to public directory...${NC}');
    execSync('cp -r "$DOCS_DIR"/* "$PUBLIC_DIR/docs/" 2>/dev/null || true', { stdio: 'inherit' });

    // Git operations
    process.chdir('/Users/flux423/Sites/LLM/OSSA');

    console.log('-e ${YELLOW}Preparing git commit...${NC}');
    execSync('git add public/ docs/', { stdio: 'inherit' });

    execSync('if git diff --staged --quiet; then', { stdio: 'inherit' });
    console.log('-e ${YELLOW}No changes to deploy${NC}');
    execSync('else', { stdio: 'inherit' });
    execSync('git commit -m "docs: update documentation structure and API docs', { stdio: 'inherit' });

    execSync('- Reorganized documentation according to new taxonomy', { stdio: 'inherit' });
    execSync('- Generated API documentation from OpenAPI specs', { stdio: 'inherit' });
    execSync('- Updated GitLab Pages content"', { stdio: 'inherit' });

    console.log('-e ${GREEN}✅ Changes committed${NC}');
    console.log('-e ${YELLOW}Run git push to deploy to GitLab${NC}');
    execSync('fi', { stdio: 'inherit' });
    execSync('}', { stdio: 'inherit' });

    // Main execution
    execSync('case $COMMAND in', { stdio: 'inherit' });
    execSync('all)', { stdio: 'inherit' });
    console.log('-e ${BOLD}Running complete documentation pipeline...${NC}\\n');

    // Make scripts executable
    execSync('chmod +x "$SCRIPT_DIR"/*.sh', { stdio: 'inherit' });

    // Step 1: Organize documentation
    execSync('run_step "Documentation Organization" "$SCRIPT_DIR/organize-docs.sh"', { stdio: 'inherit' });

    // Step 2: Generate API documentation
    execSync('run_step "API Documentation Generation" "$SCRIPT_DIR/generate-api-docs.sh"', { stdio: 'inherit' });

    // Step 3: Show final status
    execSync('show_status', { stdio: 'inherit' });

    console.log('-e ${GREEN}${BOLD}✨ Documentation pipeline complete!${NC}');
    console.log('');
    console.log('-e ${BLUE}Next steps:${NC}');
    console.log('  1. Review the organized documentation');
    console.log('  2. Run $0 deploy to prepare for GitLab Pages');
    console.log('  3. Push to GitLab to deploy');
    execSync(';;', { stdio: 'inherit' });

    execSync('organize)', { stdio: 'inherit' });
    execSync('chmod +x "$SCRIPT_DIR/organize-docs.sh"', { stdio: 'inherit' });
    execSync('run_step "Documentation Organization" "$SCRIPT_DIR/organize-docs.sh"', { stdio: 'inherit' });
    execSync(';;', { stdio: 'inherit' });

    execSync('api)', { stdio: 'inherit' });
    execSync('chmod +x "$SCRIPT_DIR/generate-api-docs.sh"', { stdio: 'inherit' });
    execSync('run_step "API Documentation Generation" "$SCRIPT_DIR/generate-api-docs.sh"', { stdio: 'inherit' });
    execSync(';;', { stdio: 'inherit' });

    execSync('deploy)', { stdio: 'inherit' });
    execSync('deploy_docs', { stdio: 'inherit' });
    execSync(';;', { stdio: 'inherit' });

    execSync('status)', { stdio: 'inherit' });
    execSync('show_status', { stdio: 'inherit' });
    execSync(';;', { stdio: 'inherit' });

    execSync('help|--help|-h)', { stdio: 'inherit' });
    execSync('show_help', { stdio: 'inherit' });
    execSync(';;', { stdio: 'inherit' });

    execSync('*)', { stdio: 'inherit' });
    console.log('-e ${RED}Unknown command: $COMMAND${NC}');
    console.log('');
    execSync('show_help', { stdio: 'inherit' });
    execSync('exit 1', { stdio: 'inherit' });
    execSync(';;', { stdio: 'inherit' });
    execSync('esac', { stdio: 'inherit' });
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
