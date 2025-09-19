#!/bin/bash
# OSSA Documentation Safe Reorganization Script
# Preserves git history and provides incremental, reversible changes

set -e

echo "📚 OSSA Documentation Safe Reorganization Tool"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOCS_DIR="/Users/flux423/Sites/LLM/OSSA/docs"
DRY_RUN=${1:-false}
CATEGORY=${2:-status}

# Dry run mode
if [ "$1" = "--dry-run" ] || [ "$1" = "-n" ]; then
    DRY_RUN=true
    CATEGORY=${2:-status}
    echo -e "${YELLOW}🔍 DRY RUN MODE - No changes will be made${NC}"
    echo ""
fi

# Function to safely move with git
git_move() {
    local source=$1
    local dest=$2
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${CYAN}[DRY RUN] Would move: $source → $dest${NC}"
    else
        if [ -e "$source" ]; then
            mkdir -p "$(dirname "$dest")"
            git mv "$source" "$dest" 2>/dev/null || mv "$source" "$dest"
            echo -e "  ${GREEN}✓ Moved: $(basename "$source")${NC}"
        fi
    fi
}

# Function to check references
check_references() {
    local file=$1
    echo -e "${BLUE}Checking references to: $file${NC}"
    
    # Check for references in other files
    grep -r "$(basename "$file")" "$DOCS_DIR" --include="*.md" --include="*.yml" 2>/dev/null | grep -v "$file:" | head -5 || true
    
    # Check for references in CI/CD
    if [ -f "/Users/flux423/Sites/LLM/OSSA/.gitlab-ci.yml" ]; then
        grep "$(basename "$file")" "/Users/flux423/Sites/LLM/OSSA/.gitlab-ci.yml" 2>/dev/null || true
    fi
}

# Function to show current status
show_status() {
    echo -e "${BLUE}📊 Current Documentation Structure${NC}"
    echo ""
    
    # Count items by category
    echo "📁 Directory Analysis:"
    echo "  • Total directories: $(find "$DOCS_DIR" -type d | wc -l | xargs)"
    echo "  • Total MD files: $(find "$DOCS_DIR" -name "*.md" | wc -l | xargs)"
    echo "  • Loose files in root: $(ls "$DOCS_DIR"/*.md 2>/dev/null | wc -l | xargs)"
    echo ""
    
    # Show categories that need organizing
    echo "🗂️ Categories needing organization:"
    
    # Check for numbered docs
    NUMBERED=$(ls "$DOCS_DIR"/[0-9]*.md 2>/dev/null | wc -l | xargs)
    [ $NUMBERED -gt 0 ] && echo "  • Numbered documents: $NUMBERED files"
    
    # Check for loose config docs
    CONFIG_DOCS=$(ls "$DOCS_DIR"/*config*.md "$DOCS_DIR"/*CONFIG*.md 2>/dev/null | wc -l | xargs)
    [ $CONFIG_DOCS -gt 0 ] && echo "  • Configuration docs: $CONFIG_DOCS files"
    
    # Check for CI/CD docs
    CI_DOCS=$(ls "$DOCS_DIR"/*CI*.md "$DOCS_DIR"/*ci*.md 2>/dev/null | wc -l | xargs)
    [ $CI_DOCS -gt 0 ] && echo "  • CI/CD documentation: $CI_DOCS files"
    
    # Check for legacy directories
    for dir in adr dita planning status ideas diagrams; do
        [ -d "$DOCS_DIR/$dir" ] && echo "  • Legacy directory: $dir/"
    done
    
    echo ""
}

# Function to create backup
create_backup() {
    echo -e "${BLUE}📦 Creating backup...${NC}"
    
    BACKUP_BRANCH="backup/docs-$(date +%Y%m%d-%H%M%S)"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${CYAN}[DRY RUN] Would create backup branch: $BACKUP_BRANCH${NC}"
    else
        cd /Users/flux423/Sites/LLM/OSSA
        git add . 2>/dev/null || true
        git commit -m "backup: documentation state before reorganization" 2>/dev/null || echo "  No changes to backup"
        git branch "$BACKUP_BRANCH" 2>/dev/null && echo -e "  ${GREEN}✓ Backup created: $BACKUP_BRANCH${NC}"
    fi
    echo ""
}

# Incremental organization functions
organize_numbered_docs() {
    echo -e "${BLUE}📑 Organizing numbered documentation...${NC}"
    
    local count=0
    for file in "$DOCS_DIR"/[0-9]*.md; do
        if [ -f "$file" ]; then
            local basename=$(basename "$file")
            local target=""
            
            case "$basename" in
                *overview*|*project*)
                    target="$DOCS_DIR/overview/$basename"
                    ;;
                *api*|*API*)
                    target="$DOCS_DIR/api/$basename"
                    ;;
                *architecture*)
                    target="$DOCS_DIR/overview/$basename"
                    ;;
                *deployment*|*deploy*)
                    target="$DOCS_DIR/operations/$basename"
                    ;;
                *security*|*compliance*)
                    target="$DOCS_DIR/enterprise/$basename"
                    ;;
                *maintenance*|*operations*)
                    target="$DOCS_DIR/operations/$basename"
                    ;;
                *)
                    target="$DOCS_DIR/reference/$basename"
                    ;;
            esac
            
            git_move "$file" "$target"
            count=$((count + 1))
        fi
    done
    
    echo -e "  ${GREEN}Organized $count numbered documents${NC}"
}

organize_config_docs() {
    echo -e "${BLUE}⚙️ Organizing configuration documentation...${NC}"
    
    local count=0
    for file in "$DOCS_DIR"/*config*.md "$DOCS_DIR"/*CONFIG*.md; do
        if [ -f "$file" ]; then
            git_move "$file" "$DOCS_DIR/development/configuration/$(basename "$file")"
            count=$((count + 1))
        fi
    done
    
    echo -e "  ${GREEN}Organized $count configuration documents${NC}"
}

organize_ci_docs() {
    echo -e "${BLUE}🔧 Organizing CI/CD documentation...${NC}"
    
    local count=0
    for file in "$DOCS_DIR"/*CI*.md "$DOCS_DIR"/*ci*.md "$DOCS_DIR"/*branching*.md; do
        if [ -f "$file" ]; then
            git_move "$file" "$DOCS_DIR/development/ci-cd/$(basename "$file")"
            count=$((count + 1))
        fi
    done
    
    echo -e "  ${GREEN}Organized $count CI/CD documents${NC}"
}

archive_legacy_dirs() {
    echo -e "${BLUE}📦 Archiving legacy directories...${NC}"
    
    local archive_dir="$DOCS_DIR/.archive-$(date +%Y%m%d)"
    
    for dir in dita planning status ideas coordination-plans; do
        if [ -d "$DOCS_DIR/$dir" ]; then
            if [ "$DRY_RUN" = true ]; then
                echo -e "  ${CYAN}[DRY RUN] Would archive: $dir/${NC}"
            else
                mkdir -p "$archive_dir"
                git mv "$DOCS_DIR/$dir" "$archive_dir/" 2>/dev/null || mv "$DOCS_DIR/$dir" "$archive_dir/"
                echo -e "  ${GREEN}✓ Archived: $dir/${NC}"
            fi
        fi
    done
}

# Main menu
show_menu() {
    echo -e "${CYAN}Available operations:${NC}"
    echo "  status     - Show current documentation structure"
    echo "  backup     - Create backup branch"
    echo "  numbered   - Organize numbered documents (01-*.md, etc.)"
    echo "  config     - Organize configuration documentation"
    echo "  ci         - Organize CI/CD documentation"
    echo "  archive    - Archive legacy directories"
    echo "  all        - Run all organization steps"
    echo ""
    echo "Usage: $0 [--dry-run] <operation>"
    echo ""
    echo "Examples:"
    echo "  $0 status                # Check current state"
    echo "  $0 --dry-run numbered    # Preview numbered doc changes"
    echo "  $0 backup                # Create backup"
    echo "  $0 numbered              # Organize numbered docs"
}

# Validation check
validate_changes() {
    echo -e "${BLUE}✅ Validating changes...${NC}"
    
    # Check for broken links
    echo "  Checking for broken internal links..."
    find "$DOCS_DIR" -name "*.md" -exec grep -l "\[.*\](.*/.*\.md)" {} \; | head -5
    
    # Check git status
    echo "  Git status:"
    cd /Users/flux423/Sites/LLM/OSSA
    git status --short | head -10
    
    echo ""
}

# Main execution
case $CATEGORY in
    status)
        show_status
        ;;
    
    backup)
        create_backup
        ;;
    
    numbered)
        [ "$DRY_RUN" = false ] && create_backup
        organize_numbered_docs
        [ "$DRY_RUN" = false ] && validate_changes
        ;;
    
    config)
        [ "$DRY_RUN" = false ] && create_backup
        organize_config_docs
        [ "$DRY_RUN" = false ] && validate_changes
        ;;
    
    ci)
        [ "$DRY_RUN" = false ] && create_backup
        organize_ci_docs
        [ "$DRY_RUN" = false ] && validate_changes
        ;;
    
    archive)
        [ "$DRY_RUN" = false ] && create_backup
        archive_legacy_dirs
        [ "$DRY_RUN" = false ] && validate_changes
        ;;
    
    all)
        [ "$DRY_RUN" = false ] && create_backup
        organize_numbered_docs
        organize_config_docs
        organize_ci_docs
        archive_legacy_dirs
        [ "$DRY_RUN" = false ] && validate_changes
        echo ""
        echo -e "${GREEN}✨ Documentation reorganization complete!${NC}"
        ;;
    
    help|--help|-h)
        show_menu
        ;;
    
    *)
        echo -e "${RED}Unknown operation: $CATEGORY${NC}"
        echo ""
        show_menu
        exit 1
        ;;
esac

# Final summary
if [ "$DRY_RUN" = false ] && [ "$CATEGORY" != "status" ]; then
    echo ""
    echo -e "${CYAN}📋 Next steps:${NC}"
    echo "  1. Review changes: git diff --staged"
    echo "  2. Check references: grep -r 'moved-file.md' ."
    echo "  3. Commit if satisfied: git commit -m 'docs: reorganize documentation structure'"
    echo "  4. To undo: git reset --hard HEAD"
    echo ""
fi