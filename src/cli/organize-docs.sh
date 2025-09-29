#!/bin/bash
# OSSA Documentation Organization Script
# Consolidates and organizes OSSA documentation according to the new taxonomy

set -e

echo "📚 OSSA Documentation Organization Tool"
echo "======================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DOCS_DIR="/Users/flux423/Sites/LLM/OSSA/docs"
ARCHIVE_DIR="$DOCS_DIR/.archive"

# Create archive directory
echo -e "${BLUE}📁 Creating archive directory...${NC}"
mkdir -p "$ARCHIVE_DIR"

# Function to safely move directory
move_to_archive() {
    local dir=$1
    local name=$(basename "$dir")
    
    if [ -d "$dir" ]; then
        echo -e "  ${YELLOW}→ Archiving $name${NC}"
        mv "$dir" "$ARCHIVE_DIR/" 2>/dev/null || echo -e "    ${RED}Failed to move $name${NC}"
    fi
}

# Archive outdated directories
echo -e "${BLUE}📦 Archiving outdated content...${NC}"

# Directories to archive
ARCHIVE_DIRS=(
    "$DOCS_DIR/coordination-plans"
    "$DOCS_DIR/dita"
    "$DOCS_DIR/planning"
    "$DOCS_DIR/status"
    "$DOCS_DIR/ideas"
    "$DOCS_DIR/diagrams"
    "$DOCS_DIR/adr"
)

for dir in "${ARCHIVE_DIRS[@]}"; do
    move_to_archive "$dir"
done

# Consolidate loose documentation files
echo -e "${BLUE}📄 Organizing loose documentation files...${NC}"

# Move numbered docs to appropriate locations
if [ -f "$DOCS_DIR/01-project-overview.md" ]; then
    echo -e "  ${YELLOW}→ Moving overview documents${NC}"
    mv "$DOCS_DIR/01-project-overview.md" "$DOCS_DIR/overview/project-overview.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/02-api.md" ]; then
    echo -e "  ${YELLOW}→ Moving API documentation${NC}"
    mv "$DOCS_DIR/02-api.md" "$DOCS_DIR/api/api-guide.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/03-features.md" ]; then
    echo -e "  ${YELLOW}→ Moving feature documentation${NC}"
    mv "$DOCS_DIR/03-features.md" "$DOCS_DIR/overview/features.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/04-best-practices.md" ]; then
    echo -e "  ${YELLOW}→ Moving best practices${NC}"
    mv "$DOCS_DIR/04-best-practices.md" "$DOCS_DIR/development/best-practices.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/05-architecture.md" ]; then
    echo -e "  ${YELLOW}→ Moving architecture docs${NC}"
    mv "$DOCS_DIR/05-architecture.md" "$DOCS_DIR/overview/architecture.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/06-deployment.md" ]; then
    echo -e "  ${YELLOW}→ Moving deployment guides${NC}"
    mv "$DOCS_DIR/06-deployment.md" "$DOCS_DIR/operations/deployment-guide.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/07-modules-components.md" ]; then
    echo -e "  ${YELLOW}→ Moving component documentation${NC}"
    mv "$DOCS_DIR/07-modules-components.md" "$DOCS_DIR/development/components.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/08-security-compliance.md" ]; then
    echo -e "  ${YELLOW}→ Moving security documentation${NC}"
    mv "$DOCS_DIR/08-security-compliance.md" "$DOCS_DIR/enterprise/security-compliance.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/09-maintenance.md" ]; then
    echo -e "  ${YELLOW}→ Moving maintenance guides${NC}"
    mv "$DOCS_DIR/09-maintenance.md" "$DOCS_DIR/operations/maintenance.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/10-appendices.md" ]; then
    echo -e "  ${YELLOW}→ Moving appendices${NC}"
    mv "$DOCS_DIR/10-appendices.md" "$DOCS_DIR/reference/appendices.md" 2>/dev/null || true
fi

# Move specialized docs
echo -e "${BLUE}📋 Moving specialized documentation...${NC}"

if [ -f "$DOCS_DIR/CI-BRANCHING-STRATEGY.md" ]; then
    echo -e "  ${YELLOW}→ Moving CI/CD documentation${NC}"
    mv "$DOCS_DIR/CI-BRANCHING-STRATEGY.md" "$DOCS_DIR/development/ci-branching.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/COMPLIANCE-ENGINE.md" ]; then
    echo -e "  ${YELLOW}→ Moving compliance documentation${NC}"
    mv "$DOCS_DIR/COMPLIANCE-ENGINE.md" "$DOCS_DIR/enterprise/compliance-engine.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/claude-desktop-integration.md" ]; then
    echo -e "  ${YELLOW}→ Moving integration guides${NC}"
    mv "$DOCS_DIR/claude-desktop-integration.md" "$DOCS_DIR/examples/claude-integration.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/adk-integration.md" ]; then
    mv "$DOCS_DIR/adk-integration.md" "$DOCS_DIR/examples/adk-integration.md" 2>/dev/null || true
fi

if [ -f "$DOCS_DIR/voice-agent-compliance.md" ]; then
    mv "$DOCS_DIR/voice-agent-compliance.md" "$DOCS_DIR/specifications/voice-agent.md" 2>/dev/null || true
fi

# Clean up empty directories
echo -e "${BLUE}🧹 Cleaning up empty directories...${NC}"
find "$DOCS_DIR" -type d -empty -delete 2>/dev/null || true

# Generate documentation statistics
echo -e "${BLUE}📊 Generating documentation statistics...${NC}"

TOTAL_DIRS=$(find "$DOCS_DIR" -type d -not -path "$ARCHIVE_DIR/*" | wc -l)
TOTAL_FILES=$(find "$DOCS_DIR" -type f -name "*.md" -not -path "$ARCHIVE_DIR/*" | wc -l)
ARCHIVED_FILES=$(find "$ARCHIVE_DIR" -type f -name "*.md" 2>/dev/null | wc -l)

# Summary
echo ""
echo "======================================="
echo -e "${GREEN}✅ Documentation Organization Complete${NC}"
echo "======================================="
echo "Active directories: $TOTAL_DIRS"
echo "Active documents: $TOTAL_FILES"
echo "Archived items: $ARCHIVED_FILES"
echo ""
echo -e "${BLUE}📁 Organized structure:${NC}"
echo "  • overview/      - Project introduction"
echo "  • getting-started/ - Quick start guides"
echo "  • api/           - API documentation"
echo "  • specifications/ - Technical specs"
echo "  • development/   - Developer guides"
echo "  • enterprise/    - Enterprise features"
echo "  • examples/      - Code examples"
echo "  • migration/     - Migration guides"
echo "  • operations/    - Operations guides"
echo ""
echo -e "${YELLOW}📦 Archived content in: $ARCHIVE_DIR${NC}"
echo ""
echo -e "${GREEN}✨ Your documentation is now clean and organized!${NC}"