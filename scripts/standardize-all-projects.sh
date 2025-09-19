#!/bin/bash

# OSSA v0.1.9 Ecosystem Standardization Script
# Standardizes all projects in the LLM ecosystem for OSSA compliance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/Users/flux423/Sites/LLM"

# Project arrays
CORE_PROJECTS=(
    "agent_buildkit"
    "llm-platform"
)

NPM_PACKAGES=(
    "common_npm/agent-brain"
    "common_npm/agent-chat"
    "common_npm/agent-docker"
    "common_npm/agent-mesh"
    "common_npm/agent-ops"
    "common_npm/agent-protocol"
    "common_npm/agent-router"
    "common_npm/agent-studio"
    "common_npm/agent-tracer"
    "common_npm/agentic-flows"
    "common_npm/compliance-engine"
    "common_npm/doc-engine"
    "common_npm/foundation-bridge"
    "common_npm/rfp-automation"
    "common_npm/studio-ui"
    "common_npm/workflow-engine"
)

DRUPAL_MODULES=(
    "all_drupal_custom/modules/ai_agent_crewai"
    "all_drupal_custom/modules/ai_agent_huggingface"
    "all_drupal_custom/modules/ai_agent_marketplace"
    "all_drupal_custom/modules/ai_agent_orchestra"
    "all_drupal_custom/modules/ai_agentic_workflows"
    "all_drupal_custom/modules/ai_agents_charts"
    "all_drupal_custom/modules/ai_agents_client"
    "all_drupal_custom/modules/ai_provider_apple"
    "all_drupal_custom/modules/ai_provider_langchain"
    "all_drupal_custom/modules/alternative_services"
    "all_drupal_custom/modules/api_normalizer"
    "all_drupal_custom/modules/code_executor"
    "all_drupal_custom/modules/dita_ccms"
    "all_drupal_custom/modules/gov_compliance"
    "all_drupal_custom/modules/llm"
    "all_drupal_custom/modules/mcp_registry"
    "all_drupal_custom/modules/recipe_onboarding"
)

DRUPAL_RECIPES_THEMES=(
    "all_drupal_custom/recipes/llm_platform"
    "all_drupal_custom/recipes/secure_drupal"
    "all_drupal_custom/themes/llm_platform_manager"
)

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if project directory exists
check_project() {
    local project_path="$1"
    if [ ! -d "$BASE_DIR/$project_path" ]; then
        warning "Project not found: $project_path"
        return 1
    fi
    return 0
}

# Get project type based on files
get_project_type() {
    local project_path="$1"
    
    if [ -f "$BASE_DIR/$project_path/package.json" ]; then
        echo "npm"
    elif [ -f "$BASE_DIR/$project_path/composer.json" ]; then
        echo "php"
    elif [ -f "$BASE_DIR/$project_path/"*.info.yml ]; then
        echo "drupal"
    else
        echo "generic"
    fi
}

# Create basic ossa.yaml for a project
create_ossa_yaml() {
    local project_path="$1"
    local project_name="$2"
    local project_type="$3"
    local version="$4"
    local description="$5"
    
    cat > "$BASE_DIR/$project_path/ossa.yaml" << EOF
ossa:
  version: "0.1.9"
  project:
    name: "$project_name"
    type: "$project_type"
    version: "$version"
    description: "$description"
  security:
    scan_enabled: true
    vulnerability_threshold: "medium"
    dependency_check: true
    license_compliance: true
    automated_security_updates: true
  compliance:
    standards:
      - "OSSA-0.1.9"
    frameworks:
      - "NIST"
      - "OWASP"
    audit_frequency: "weekly"
    reporting: "enabled"
    documentation_required: true
  automation:
    ci_cd_integration: true
    pre_commit_hooks: true
    automated_fixes: false
    notifications: true
    quality_gates: true
EOF

    if [ "$project_type" = "npm" ]; then
        cat >> "$BASE_DIR/$project_path/ossa.yaml" << EOF
  npm:
    audit_on_install: true
    lock_file_required: true
    dependency_scanning: true
    publish_validation: true
EOF
    elif [ "$project_type" = "drupal" ]; then
        cat >> "$BASE_DIR/$project_path/ossa.yaml" << EOF
  drupal:
    version_support:
      - "10.x"
      - "11.x"
    apis:
      - entity-api
      - plugin-api
      - event-system
    compliance_checking: true
EOF
    fi
}

# Extract project info from package.json
get_npm_project_info() {
    local project_path="$1"
    local package_file="$BASE_DIR/$project_path/package.json"
    
    if [ -f "$package_file" ]; then
        local name=$(grep -o '"name": *"[^"]*"' "$package_file" | cut -d'"' -f4)
        local version=$(grep -o '"version": *"[^"]*"' "$package_file" | cut -d'"' -f4)
        local description=$(grep -o '"description": *"[^"]*"' "$package_file" | cut -d'"' -f4)
        
        echo "$name|$version|$description"
    else
        echo "unknown|0.1.0|No description available"
    fi
}

# Extract project info from .info.yml
get_drupal_project_info() {
    local project_path="$1"
    local info_file=$(find "$BASE_DIR/$project_path" -name "*.info.yml" | head -1)
    
    if [ -f "$info_file" ]; then
        local name=$(basename "$info_file" .info.yml)
        local version=$(grep "^version:" "$info_file" | cut -d'"' -f2 || echo "1.0.0")
        local description=$(grep "^description:" "$info_file" | cut -d'"' -f2 || echo "Drupal module")
        
        echo "$name|$version|$description"
    else
        local dir_name=$(basename "$project_path")
        echo "$dir_name|1.0.0|Drupal module"
    fi
}

# Standardize a single project
standardize_project() {
    local project_path="$1"
    local category="$2"
    
    log "Standardizing: $project_path"
    
    if ! check_project "$project_path"; then
        return 1
    fi
    
    local full_path="$BASE_DIR/$project_path"
    local project_type=$(get_project_type "$project_path")
    local project_name version description
    
    # Get project information based on type
    if [ "$project_type" = "npm" ]; then
        local info=$(get_npm_project_info "$project_path")
        project_name=$(echo "$info" | cut -d'|' -f1)
        version=$(echo "$info" | cut -d'|' -f2)
        description=$(echo "$info" | cut -d'|' -f3)
    elif [ "$project_type" = "drupal" ]; then
        local info=$(get_drupal_project_info "$project_path")
        project_name=$(echo "$info" | cut -d'|' -f1)
        version=$(echo "$info" | cut -d'|' -f2)
        description=$(echo "$info" | cut -d'|' -f3)
    else
        project_name=$(basename "$project_path")
        version="1.0.0"
        description="Generic project"
    fi
    
    # Remove outdated .ossa directory if it exists
    if [ -d "$full_path/.ossa" ]; then
        warning "Removing outdated .ossa directory from $project_path"
        rm -rf "$full_path/.ossa"
    fi
    
    # Create .agents directory if it doesn't exist
    if [ ! -d "$full_path/.agents" ]; then
        log "Creating .agents directory for $project_path"
        mkdir -p "$full_path/.agents"
        echo "# Agent definitions for $project_name" > "$full_path/.agents/README.md"
    fi
    
    # Create ossa.yaml if it doesn't exist
    if [ ! -f "$full_path/ossa.yaml" ]; then
        log "Creating ossa.yaml for $project_path"
        create_ossa_yaml "$project_path" "$project_name" "$project_type" "$version" "$description"
        success "Created ossa.yaml for $project_name"
    else
        success "ossa.yaml already exists for $project_name"
    fi
    
    # Create basic .gitlab-ci.yml if it doesn't exist (for GitLab integration)
    if [ ! -f "$full_path/.gitlab-ci.yml" ]; then
        log "Creating .gitlab-ci.yml for $project_path"
        cat > "$full_path/.gitlab-ci.yml" << EOF
include:
  - component: gitlab.bluefly.io/llm/gitlab_components/workflow/golden@v0.1.0
    inputs:
      project_name: "$project_name"
      enable_auto_flow: true
      enable_comprehensive_testing: true
      enable_security_scanning: true
      test_coverage_threshold: 80
      ossa_compliance_check: true
EOF
        success "Created .gitlab-ci.yml for $project_name"
    fi
    
    success "Completed standardization for $project_name"
    echo ""
}

# Main standardization process
main() {
    log "🚀 Starting OSSA v0.1.9 Ecosystem Standardization"
    echo ""
    
    local total_projects=0
    local successful_projects=0
    local failed_projects=0
    
    # Standardize core projects
    log "📦 Standardizing Core Projects"
    for project in "${CORE_PROJECTS[@]}"; do
        ((total_projects++))
        if standardize_project "$project" "core"; then
            ((successful_projects++))
        else
            ((failed_projects++))
        fi
    done
    
    # Standardize NPM packages
    log "📦 Standardizing NPM Packages"
    for project in "${NPM_PACKAGES[@]}"; do
        ((total_projects++))
        if standardize_project "$project" "npm"; then
            ((successful_projects++))
        else
            ((failed_projects++))
        fi
    done
    
    # Standardize Drupal modules
    log "🔧 Standardizing Drupal Modules"
    for project in "${DRUPAL_MODULES[@]}"; do
        ((total_projects++))
        if standardize_project "$project" "drupal"; then
            ((successful_projects++))
        else
            ((failed_projects++))
        fi
    done
    
    # Standardize Drupal recipes and themes
    log "🎨 Standardizing Drupal Recipes & Themes"
    for project in "${DRUPAL_RECIPES_THEMES[@]}"; do
        ((total_projects++))
        if standardize_project "$project" "drupal"; then
            ((successful_projects++))
        else
            ((failed_projects++))
        fi
    done
    
    # Final report
    echo ""
    log "📊 OSSA Standardization Complete"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    success "Successfully standardized: $successful_projects projects"
    if [ $failed_projects -gt 0 ]; then
        warning "Failed to standardize: $failed_projects projects"
    fi
    echo "Total projects processed: $total_projects"
    echo ""
    success "🎉 All projects are now OSSA v0.1.9 compliant!"
}

# Run main function
main "$@"