#!/bin/bash
# OSSA Complete Documentation Pipeline
# Organizes, generates, and deploys documentation

set -e

echo "═══════════════════════════════════════════════════════"
echo "           OSSA Documentation Pipeline v1.0            "
echo "═══════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

SCRIPT_DIR="/Users/flux423/Sites/LLM/OSSA/scripts"

# Parse command line arguments
COMMAND=${1:-all}
OPTION=${2:-}

# Function to run with status
run_step() {
    local step_name=$1
    local script=$2
    
    echo -e "${CYAN}${BOLD}━━━ $step_name ━━━${NC}"
    
    if bash "$script"; then
        echo -e "${GREEN}✅ $step_name completed successfully${NC}\n"
        return 0
    else
        echo -e "${RED}❌ $step_name failed${NC}\n"
        return 1
    fi
}

# Show help
show_help() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  all         Run complete documentation pipeline (default)"
    echo "  organize    Organize and clean documentation structure"
    echo "  api         Generate API documentation from OpenAPI specs"
    echo "  deploy      Deploy to GitLab Pages"
    echo "  status      Show documentation status"
    echo "  help        Show this help message"
    echo ""
    echo "Options:"
    echo "  --dry-run   Show what would be done without making changes"
    echo "  --verbose   Show detailed output"
    echo ""
    echo "Examples:"
    echo "  $0                 # Run complete pipeline"
    echo "  $0 organize        # Only organize docs"
    echo "  $0 api             # Only generate API docs"
    echo "  $0 status          # Check current status"
}

# Show documentation status
show_status() {
    echo -e "${BLUE}${BOLD}📊 Documentation Status${NC}"
    echo ""
    
    DOCS_DIR="/Users/flux423/Sites/LLM/OSSA/docs"
    
    # Count directories and files
    TOTAL_DIRS=$(find "$DOCS_DIR" -type d | wc -l)
    TOTAL_FILES=$(find "$DOCS_DIR" -type f -name "*.md" | wc -l)
    API_SPECS=$(find "$DOCS_DIR" -name "*.yml" -o -name "*.yaml" | wc -l)
    
    echo -e "${CYAN}Directory Structure:${NC}"
    tree -L 2 -d "$DOCS_DIR" 2>/dev/null || ls -la "$DOCS_DIR"
    
    echo ""
    echo -e "${CYAN}Statistics:${NC}"
    echo "  • Total directories: $TOTAL_DIRS"
    echo "  • Markdown files: $TOTAL_FILES"
    echo "  • API specifications: $API_SPECS"
    
    if [ -d "$DOCS_DIR/.archive" ]; then
        ARCHIVED=$(find "$DOCS_DIR/.archive" -type f | wc -l)
        echo "  • Archived items: $ARCHIVED"
    fi
    
    echo ""
    echo -e "${CYAN}Key Files:${NC}"
    [ -f "$DOCS_DIR/README.md" ] && echo "  ✅ Main README exists"
    [ -f "$DOCS_DIR/DOCUMENTATION_TAXONOMY.md" ] && echo "  ✅ Taxonomy defined"
    [ -f "$DOCS_DIR/CLEANUP_REPORT.md" ] && echo "  ✅ Cleanup report available"
    
    echo ""
}

# Deploy to GitLab Pages
deploy_docs() {
    echo -e "${BLUE}${BOLD}🚀 Deploying to GitLab Pages${NC}"
    echo ""
    
    PUBLIC_DIR="/Users/flux423/Sites/LLM/OSSA/public"
    
    # Check if public directory exists
    if [ ! -d "$PUBLIC_DIR" ]; then
        echo -e "${RED}Public directory not found!${NC}"
        return 1
    fi
    
    # Copy organized docs to public
    echo -e "${YELLOW}Copying documentation to public directory...${NC}"
    cp -r "$DOCS_DIR"/* "$PUBLIC_DIR/docs/" 2>/dev/null || true
    
    # Git operations
    cd /Users/flux423/Sites/LLM/OSSA
    
    echo -e "${YELLOW}Preparing git commit...${NC}"
    git add public/ docs/
    
    if git diff --staged --quiet; then
        echo -e "${YELLOW}No changes to deploy${NC}"
    else
        git commit -m "docs: update documentation structure and API docs

- Reorganized documentation according to new taxonomy
- Generated API documentation from OpenAPI specs
- Updated GitLab Pages content"
        
        echo -e "${GREEN}✅ Changes committed${NC}"
        echo -e "${YELLOW}Run 'git push' to deploy to GitLab${NC}"
    fi
}

# Main execution
case $COMMAND in
    all)
        echo -e "${BOLD}Running complete documentation pipeline...${NC}\n"
        
        # Make scripts executable
        chmod +x "$SCRIPT_DIR"/*.sh
        
        # Step 1: Organize documentation
        run_step "Documentation Organization" "$SCRIPT_DIR/organize-docs.sh"
        
        # Step 2: Generate API documentation
        run_step "API Documentation Generation" "$SCRIPT_DIR/generate-api-docs.sh"
        
        # Step 3: Show final status
        show_status
        
        echo -e "${GREEN}${BOLD}✨ Documentation pipeline complete!${NC}"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "  1. Review the organized documentation"
        echo "  2. Run '$0 deploy' to prepare for GitLab Pages"
        echo "  3. Push to GitLab to deploy"
        ;;
        
    organize)
        chmod +x "$SCRIPT_DIR/organize-docs.sh"
        run_step "Documentation Organization" "$SCRIPT_DIR/organize-docs.sh"
        ;;
        
    api)
        chmod +x "$SCRIPT_DIR/generate-api-docs.sh"
        run_step "API Documentation Generation" "$SCRIPT_DIR/generate-api-docs.sh"
        ;;
        
    deploy)
        deploy_docs
        ;;
        
    status)
        show_status
        ;;
        
    help|--help|-h)
        show_help
        ;;
        
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac