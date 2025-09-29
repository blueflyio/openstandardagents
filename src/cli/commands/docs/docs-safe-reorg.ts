/**
 * Converted from docs-safe-reorg.sh
 * Auto-generated TypeScript equivalent of shell script
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export async function main() {
  try {
    // !/bin/bash
    // OSSA Documentation Safe Reorganization Script
    // Preserves git history and provides incremental, reversible changes

    execSync("set -e", { stdio: 'inherit' });

    console.log("📚 OSSA Documentation Safe Reorganization Tool");
    console.log("==============================================");
    console.log("");

    // Color codes
    const GREEN = "\\033[0;32m";
    const YELLOW = "\\033[1;33m";
    const BLUE = "\\033[0;34m";
    const RED = "\\033[0;31m";
    const CYAN = "\\033[0;36m";
    execSync("NC='\\033[0m' # No Color", { stdio: 'inherit' });

    // Configuration
    const DOCS_DIR = "/Users/flux423/Sites/LLM/OSSA/docs";
    const DRY_RUN = "${1:-false}";
    const CATEGORY = "${2:-status}";

    // Dry run mode
    execSync("if [ \"$1\" = \"--dry-run\" ] || [ \"$1\" = \"-n\" ]; then", { stdio: 'inherit' });
    const DRY_RUN = "true";
    const CATEGORY = "${2:-status}";
    console.log("-e ${YELLOW}🔍 DRY RUN MODE - No changes will be made${NC}");
    console.log("");
    execSync("fi", { stdio: 'inherit' });

    // Function to safely move with git
    // Function: git_move
    execSync("local source=$1", { stdio: 'inherit' });
    execSync("local dest=$2", { stdio: 'inherit' });

    execSync("if [ \"$DRY_RUN\" = true ]; then", { stdio: 'inherit' });
    console.log("-e   ${CYAN}[DRY RUN] Would move: $source → $dest${NC}");
    execSync("else", { stdio: 'inherit' });
    execSync("if [ -e \"$source\" ]; then", { stdio: 'inherit' });
    fs.mkdirSync("$(dirname $dest)", { recursive: true });
    execSync("git mv \"$source\" \"$dest\" 2>/dev/null || mv \"$source\" \"$dest\"", { stdio: 'inherit' });
    console.log("-e   ${GREEN}✓ Moved: $(basename $source)${NC}");
    execSync("fi", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    // Function to check references
    // Function: check_references
    execSync("local file=$1", { stdio: 'inherit' });
    console.log("-e ${BLUE}Checking references to: $file${NC}");

    // Check for references in other files
    execSync("grep -r \"$(basename \"$file\")\" \"$DOCS_DIR\" --include=\"*.md\" --include=\"*.yml\" 2>/dev/null | grep -v \"$file:\" | head -5 || true", { stdio: 'inherit' });

    // Check for references in CI/CD
    execSync("if [ -f \"/Users/flux423/Sites/LLM/OSSA/.gitlab-ci.yml\" ]; then", { stdio: 'inherit' });
    execSync("grep \"$(basename \"$file\")\" \"/Users/flux423/Sites/LLM/OSSA/.gitlab-ci.yml\" 2>/dev/null || true", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    // Function to show current status
    // Function: show_status
    console.log("-e ${BLUE}📊 Current Documentation Structure${NC}");
    console.log("");

    // Count items by category
    console.log("📁 Directory Analysis:");
    console.log("  • Total directories: $(find $DOCS_DIR -type d | wc -l | xargs)");
    console.log("  • Total MD files: $(find $DOCS_DIR -name *.md | wc -l | xargs)");
    console.log("  • Loose files in root: $(ls $DOCS_DIR/*.md 2>/dev/null | wc -l | xargs)");
    console.log("");

    // Show categories that need organizing
    console.log("🗂️ Categories needing organization:");

    // Check for numbered docs
    execSync("NUMBERED=$(ls \"$DOCS_DIR\"/[0-9]*.md 2>/dev/null | wc -l | xargs)", { stdio: 'inherit' });
    execSync("[ $NUMBERED -gt 0 ] && echo \"  • Numbered documents: $NUMBERED files\"", { stdio: 'inherit' });

    // Check for loose config docs
    execSync("CONFIG_DOCS=$(ls \"$DOCS_DIR\"/*config*.md \"$DOCS_DIR\"/*CONFIG*.md 2>/dev/null | wc -l | xargs)", { stdio: 'inherit' });
    execSync("[ $CONFIG_DOCS -gt 0 ] && echo \"  • Configuration docs: $CONFIG_DOCS files\"", { stdio: 'inherit' });

    // Check for CI/CD docs
    execSync("CI_DOCS=$(ls \"$DOCS_DIR\"/*CI*.md \"$DOCS_DIR\"/*ci*.md 2>/dev/null | wc -l | xargs)", { stdio: 'inherit' });
    execSync("[ $CI_DOCS -gt 0 ] && echo \"  • CI/CD documentation: $CI_DOCS files\"", { stdio: 'inherit' });

    // Check for legacy directories
    execSync("for dir in adr dita planning status ideas diagrams; do", { stdio: 'inherit' });
    execSync("[ -d \"$DOCS_DIR/$dir\" ] && echo \"  • Legacy directory: $dir/\"", { stdio: 'inherit' });
    execSync("done", { stdio: 'inherit' });

    console.log("");
    execSync("}", { stdio: 'inherit' });

    // Function to create backup
    // Function: create_backup
    console.log("-e ${BLUE}📦 Creating backup...${NC}");

    execSync("BACKUP_BRANCH=\"backup/docs-$(date +%Y%m%d-%H%M%S)\"", { stdio: 'inherit' });

    execSync("if [ \"$DRY_RUN\" = true ]; then", { stdio: 'inherit' });
    console.log("-e ${CYAN}[DRY RUN] Would create backup branch: $BACKUP_BRANCH${NC}");
    execSync("else", { stdio: 'inherit' });
    process.chdir("/Users/flux423/Sites/LLM/OSSA");
    execSync("git add . 2>/dev/null || true", { stdio: 'inherit' });
    execSync("git commit -m \"backup: documentation state before reorganization\" 2>/dev/null || echo \"  No changes to backup\"", { stdio: 'inherit' });
    execSync("git branch \"$BACKUP_BRANCH\" 2>/dev/null && echo -e \"  ${GREEN}✓ Backup created: $BACKUP_BRANCH${NC}\"", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    console.log("");
    execSync("}", { stdio: 'inherit' });

    // Incremental organization functions
    // Function: organize_numbered_docs
    console.log("-e ${BLUE}📑 Organizing numbered documentation...${NC}");

    execSync("local count=0", { stdio: 'inherit' });
    execSync("for file in \"$DOCS_DIR\"/[0-9]*.md; do", { stdio: 'inherit' });
    execSync("if [ -f \"$file\" ]; then", { stdio: 'inherit' });
    execSync("local basename=$(basename \"$file\")", { stdio: 'inherit' });
    execSync("local target=\"\"", { stdio: 'inherit' });

    execSync("case \"$basename\" in", { stdio: 'inherit' });
    execSync("*overview*|*project*)", { stdio: 'inherit' });
    const target = "$DOCS_DIR/overview/$basename";
    execSync(";;", { stdio: 'inherit' });
    execSync("*api*|*API*)", { stdio: 'inherit' });
    const target = "$DOCS_DIR/api/$basename";
    execSync(";;", { stdio: 'inherit' });
    execSync("*architecture*)", { stdio: 'inherit' });
    const target = "$DOCS_DIR/overview/$basename";
    execSync(";;", { stdio: 'inherit' });
    execSync("*deployment*|*deploy*)", { stdio: 'inherit' });
    const target = "$DOCS_DIR/operations/$basename";
    execSync(";;", { stdio: 'inherit' });
    execSync("*security*|*compliance*)", { stdio: 'inherit' });
    const target = "$DOCS_DIR/enterprise/$basename";
    execSync(";;", { stdio: 'inherit' });
    execSync("*maintenance*|*operations*)", { stdio: 'inherit' });
    const target = "$DOCS_DIR/operations/$basename";
    execSync(";;", { stdio: 'inherit' });
    execSync("*)", { stdio: 'inherit' });
    const target = "$DOCS_DIR/reference/$basename";
    execSync(";;", { stdio: 'inherit' });
    execSync("esac", { stdio: 'inherit' });

    execSync("git_move \"$file\" \"$target\"", { stdio: 'inherit' });
    execSync("count=$((count + 1))", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    execSync("done", { stdio: 'inherit' });

    console.log("-e   ${GREEN}Organized $count numbered documents${NC}");
    execSync("}", { stdio: 'inherit' });

    // Function: organize_config_docs
    console.log("-e ${BLUE}⚙️ Organizing configuration documentation...${NC}");

    execSync("local count=0", { stdio: 'inherit' });
    execSync("for file in \"$DOCS_DIR\"/*config*.md \"$DOCS_DIR\"/*CONFIG*.md; do", { stdio: 'inherit' });
    execSync("if [ -f \"$file\" ]; then", { stdio: 'inherit' });
    execSync("git_move \"$file\" \"$DOCS_DIR/development/configuration/$(basename \"$file\")\"", { stdio: 'inherit' });
    execSync("count=$((count + 1))", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    execSync("done", { stdio: 'inherit' });

    console.log("-e   ${GREEN}Organized $count configuration documents${NC}");
    execSync("}", { stdio: 'inherit' });

    // Function: organize_ci_docs
    console.log("-e ${BLUE}🔧 Organizing CI/CD documentation...${NC}");

    execSync("local count=0", { stdio: 'inherit' });
    execSync("for file in \"$DOCS_DIR\"/*CI*.md \"$DOCS_DIR\"/*ci*.md \"$DOCS_DIR\"/*branching*.md; do", { stdio: 'inherit' });
    execSync("if [ -f \"$file\" ]; then", { stdio: 'inherit' });
    execSync("git_move \"$file\" \"$DOCS_DIR/development/ci-cd/$(basename \"$file\")\"", { stdio: 'inherit' });
    execSync("count=$((count + 1))", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    execSync("done", { stdio: 'inherit' });

    console.log("-e   ${GREEN}Organized $count CI/CD documents${NC}");
    execSync("}", { stdio: 'inherit' });

    // Function: archive_legacy_dirs
    console.log("-e ${BLUE}📦 Archiving legacy directories...${NC}");

    execSync("local archive_dir=\"$DOCS_DIR/.archive-$(date +%Y%m%d)\"", { stdio: 'inherit' });

    execSync("for dir in dita planning status ideas coordination-plans; do", { stdio: 'inherit' });
    execSync("if [ -d \"$DOCS_DIR/$dir\" ]; then", { stdio: 'inherit' });
    execSync("if [ \"$DRY_RUN\" = true ]; then", { stdio: 'inherit' });
    console.log("-e   ${CYAN}[DRY RUN] Would archive: $dir/${NC}");
    execSync("else", { stdio: 'inherit' });
    fs.mkdirSync("$archive_dir", { recursive: true });
    execSync("git mv \"$DOCS_DIR/$dir\" \"$archive_dir/\" 2>/dev/null || mv \"$DOCS_DIR/$dir\" \"$archive_dir/\"", { stdio: 'inherit' });
    console.log("-e   ${GREEN}✓ Archived: $dir/${NC}");
    execSync("fi", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    execSync("done", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    // Main menu
    // Function: show_menu
    console.log("-e ${CYAN}Available operations:${NC}");
    console.log("  status     - Show current documentation structure");
    console.log("  backup     - Create backup branch");
    console.log("  numbered   - Organize numbered documents (01-*.md, etc.)");
    console.log("  config     - Organize configuration documentation");
    console.log("  ci         - Organize CI/CD documentation");
    console.log("  archive    - Archive legacy directories");
    console.log("  all        - Run all organization steps");
    console.log("");
    console.log("Usage: $0 [--dry-run] <operation>");
    console.log("");
    console.log("Examples:");
    console.log("  $0 status                # Check current state");
    console.log("  $0 --dry-run numbered    # Preview numbered doc changes");
    console.log("  $0 backup                # Create backup");
    console.log("  $0 numbered              # Organize numbered docs");
    execSync("}", { stdio: 'inherit' });

    // Validation check
    // Function: validate_changes
    console.log("-e ${BLUE}✅ Validating changes...${NC}");

    // Check for broken links
    console.log("  Checking for broken internal links...");
    execSync("find \"$DOCS_DIR\" -name \"*.md\" -exec grep -l \"\\[.*\\](.*/.*\\.md)\" {} \\; | head -5", { stdio: 'inherit' });

    // Check git status
    console.log("  Git status:");
    process.chdir("/Users/flux423/Sites/LLM/OSSA");
    execSync("git status --short | head -10", { stdio: 'inherit' });

    console.log("");
    execSync("}", { stdio: 'inherit' });

    // Main execution
    execSync("case $CATEGORY in", { stdio: 'inherit' });
    execSync("status)", { stdio: 'inherit' });
    execSync("show_status", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });

    execSync("backup)", { stdio: 'inherit' });
    execSync("create_backup", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });

    execSync("numbered)", { stdio: 'inherit' });
    execSync("[ \"$DRY_RUN\" = false ] && create_backup", { stdio: 'inherit' });
    execSync("organize_numbered_docs", { stdio: 'inherit' });
    execSync("[ \"$DRY_RUN\" = false ] && validate_changes", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });

    execSync("config)", { stdio: 'inherit' });
    execSync("[ \"$DRY_RUN\" = false ] && create_backup", { stdio: 'inherit' });
    execSync("organize_config_docs", { stdio: 'inherit' });
    execSync("[ \"$DRY_RUN\" = false ] && validate_changes", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });

    execSync("ci)", { stdio: 'inherit' });
    execSync("[ \"$DRY_RUN\" = false ] && create_backup", { stdio: 'inherit' });
    execSync("organize_ci_docs", { stdio: 'inherit' });
    execSync("[ \"$DRY_RUN\" = false ] && validate_changes", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });

    execSync("archive)", { stdio: 'inherit' });
    execSync("[ \"$DRY_RUN\" = false ] && create_backup", { stdio: 'inherit' });
    execSync("archive_legacy_dirs", { stdio: 'inherit' });
    execSync("[ \"$DRY_RUN\" = false ] && validate_changes", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });

    execSync("all)", { stdio: 'inherit' });
    execSync("[ \"$DRY_RUN\" = false ] && create_backup", { stdio: 'inherit' });
    execSync("organize_numbered_docs", { stdio: 'inherit' });
    execSync("organize_config_docs", { stdio: 'inherit' });
    execSync("organize_ci_docs", { stdio: 'inherit' });
    execSync("archive_legacy_dirs", { stdio: 'inherit' });
    execSync("[ \"$DRY_RUN\" = false ] && validate_changes", { stdio: 'inherit' });
    console.log("");
    console.log("-e ${GREEN}✨ Documentation reorganization complete!${NC}");
    execSync(";;", { stdio: 'inherit' });

    execSync("help|--help|-h)", { stdio: 'inherit' });
    execSync("show_menu", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });

    execSync("*)", { stdio: 'inherit' });
    console.log("-e ${RED}Unknown operation: $CATEGORY${NC}");
    console.log("");
    execSync("show_menu", { stdio: 'inherit' });
    execSync("exit 1", { stdio: 'inherit' });
    execSync(";;", { stdio: 'inherit' });
    execSync("esac", { stdio: 'inherit' });

    // Final summary
    execSync("if [ \"$DRY_RUN\" = false ] && [ \"$CATEGORY\" != \"status\" ]; then", { stdio: 'inherit' });
    console.log("");
    console.log("-e ${CYAN}📋 Next steps:${NC}");
    console.log("  1. Review changes: git diff --staged");
    console.log("  2. Check references: grep -r moved-file.md .");
    console.log("  3. Commit if satisfied: git commit -m docs: reorganize documentation structure");
    console.log("  4. To undo: git reset --hard HEAD");
    console.log("");
    execSync("fi", { stdio: 'inherit' });
    console.log(chalk.green("✅ Script completed successfully"));
  } catch (error) {
    console.error(chalk.red("❌ Script failed:"), error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}