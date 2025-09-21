#!/bin/bash

# OSSA Structure Cleanup Script
# Ensures all projects have ONLY the 9 official OSSA taxonomy categories

echo "🧹 OSSA STRUCTURE CLEANUP SCRIPT"
echo "================================"
echo "Cleaning all projects to match OSSA taxonomy standard"
echo ""

# List of all projects to clean
PROJECTS=(
    "/Users/flux423/Sites/LLM/.gitlab"
    "/Users/flux423/Sites/LLM/agent_buildkit"
    "/Users/flux423/Sites/LLM/models/agent-studio_model"
    "/Users/flux423/Sites/LLM/models/gov-policy_model"
    "/Users/flux423/Sites/LLM/models/gov-rfp_model"
    "/Users/flux423/Sites/LLM/models/llm-platform_model"
    "/Users/flux423/Sites/LLM/common_npm/agent-brain"
    "/Users/flux423/Sites/LLM/common_npm/agent-chat"
    "/Users/flux423/Sites/LLM/common_npm/agent-docker"
    "/Users/flux423/Sites/LLM/common_npm/agent-mesh"
    "/Users/flux423/Sites/LLM/common_npm/agent-ops"
    "/Users/flux423/Sites/LLM/common_npm/agent-protocol"
    "/Users/flux423/Sites/LLM/common_npm/agent-router"
    "/Users/flux423/Sites/LLM/common_npm/agent-studio"
    "/Users/flux423/Sites/LLM/common_npm/agent-tracer"
    "/Users/flux423/Sites/LLM/common_npm/agentic-flows"
    "/Users/flux423/Sites/LLM/common_npm/compliance-engine"
    "/Users/flux423/Sites/LLM/common_npm/doc-engine"
    "/Users/flux423/Sites/LLM/common_npm/foundation-bridge"
    "/Users/flux423/Sites/LLM/common_npm/rfp-automation"
    "/Users/flux423/Sites/LLM/common_npm/studio-ui"
    "/Users/flux423/Sites/LLM/common_npm/workflow-engine"
)

# Official OSSA categories (ONLY THESE 9!)
OSSA_CATEGORIES=(
    "critics"
    "governors"
    "integrators"
    "judges"
    "monitors"
    "orchestrators"
    "trainers"
    "voice"
    "workers"
)

# Function to clean a single project
clean_project() {
    local project_path="$1"
    local agents_dir="${project_path}/.agents"

    echo "🔍 Processing: $(basename $project_path)"

    # Check if .agents directory exists
    if [ ! -d "$agents_dir" ]; then
        echo "  ⏭️  No .agents directory, creating clean structure..."
        mkdir -p "$agents_dir"

        # Create all OSSA categories
        for category in "${OSSA_CATEGORIES[@]}"; do
            mkdir -p "${agents_dir}/${category}"
        done

        # Copy README and registry if they exist in OSSA
        if [ -f "/Users/flux423/Sites/LLM/OSSA/.agents/README.md" ]; then
            cp "/Users/flux423/Sites/LLM/OSSA/.agents/README.md" "${agents_dir}/"
        fi
        if [ -f "/Users/flux423/Sites/LLM/OSSA/.agents/registry.yml" ]; then
            cp "/Users/flux423/Sites/LLM/OSSA/.agents/registry.yml" "${agents_dir}/"
        fi

        echo "  ✅ Created clean OSSA structure"
        return
    fi

    # Backup before cleaning
    local backup_dir="/tmp/agents-backup-$(date +%Y%m%d-%H%M%S)/$(basename $project_path)"
    mkdir -p "$backup_dir"
    cp -r "$agents_dir" "$backup_dir/"
    echo "  💾 Backed up to: $backup_dir"

    # Find all directories in .agents
    local dirs_found=()
    for dir in "$agents_dir"/*/; do
        if [ -d "$dir" ]; then
            local dirname=$(basename "$dir")
            dirs_found+=("$dirname")
        fi
    done

    # Move agents from non-OSSA directories to appropriate categories
    for dir in "${dirs_found[@]}"; do
        local is_ossa=false

        # Check if it's an official OSSA category
        for category in "${OSSA_CATEGORIES[@]}"; do
            if [ "$dir" == "$category" ]; then
                is_ossa=true
                break
            fi
        done

        if [ "$is_ossa" = false ]; then
            echo "  ⚠️  Non-OSSA directory found: $dir"

            # Check if it contains agents (has subdirectories with agent.yml)
            if ls "${agents_dir}/${dir}"/*/agent.yml >/dev/null 2>&1 || ls "${agents_dir}/${dir}"/*/agent.yaml >/dev/null 2>&1; then
                echo "    📦 Contains agents, moving to workers/"

                # Move all agent subdirectories to workers
                for agent_dir in "${agents_dir}/${dir}"/*/; do
                    if [ -d "$agent_dir" ]; then
                        local agent_name=$(basename "$agent_dir")
                        if [ -f "${agent_dir}/agent.yml" ] || [ -f "${agent_dir}/agent.yaml" ]; then
                            mkdir -p "${agents_dir}/workers"
                            mv "$agent_dir" "${agents_dir}/workers/${agent_name}"
                            echo "    ➜ Moved $agent_name to workers/"
                        fi
                    fi
                done
            fi

            # Remove the non-OSSA directory
            rm -rf "${agents_dir}/${dir}"
            echo "    🗑️  Removed non-OSSA directory: $dir"
        fi
    done

    # Ensure all OSSA categories exist
    for category in "${OSSA_CATEGORIES[@]}"; do
        if [ ! -d "${agents_dir}/${category}" ]; then
            mkdir -p "${agents_dir}/${category}"
            echo "  ✨ Created missing category: $category"
        fi
    done

    # Copy standard files if missing
    if [ ! -f "${agents_dir}/README.md" ] && [ -f "/Users/flux423/Sites/LLM/OSSA/.agents/README.md" ]; then
        cp "/Users/flux423/Sites/LLM/OSSA/.agents/README.md" "${agents_dir}/"
        echo "  📄 Added README.md"
    fi

    if [ ! -f "${agents_dir}/registry.yml" ] && [ -f "/Users/flux423/Sites/LLM/OSSA/.agents/registry.yml" ]; then
        cp "/Users/flux423/Sites/LLM/OSSA/.agents/registry.yml" "${agents_dir}/"
        echo "  📄 Added registry.yml"
    fi

    echo "  ✅ Cleaned to OSSA standard"
    echo ""
}

# Main execution
echo "Starting cleanup of ${#PROJECTS[@]} projects..."
echo ""

for project in "${PROJECTS[@]}"; do
    if [ -d "$project" ]; then
        clean_project "$project"
    else
        echo "⏭️  Skipping non-existent: $project"
        echo ""
    fi
done

echo "🎉 CLEANUP COMPLETE!"
echo ""
echo "Summary:"
echo "--------"
echo "✅ All projects now have clean OSSA structure"
echo "✅ Only 9 official categories: critics, governors, integrators, judges, monitors, orchestrators, trainers, voice, workers"
echo "💾 Backups saved to: /tmp/agents-backup-*"
echo ""
echo "Next steps:"
echo "1. Review moved agents in workers/ category"
echo "2. Re-categorize agents to proper OSSA categories as needed"
echo "3. Fix any YAML validation errors"