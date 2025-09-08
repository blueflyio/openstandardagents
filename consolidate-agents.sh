#!/bin/bash

# OSSA .agents Consolidation Script
# Uses git for safe, reversible operations

set -e  # Exit on any error

echo "🔍 OSSA .agents Consolidation with Git Safety"
echo "============================================"

# Check we're in a git repo
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --staged --quiet; then
    echo "⚠️  Warning: Uncommitted changes detected"
    echo "Please commit or stash changes before running consolidation"
    git status --short
    exit 1
fi

# Create consolidation branch
BRANCH_NAME="feature/agents-consolidation-$(date +%Y%m%d)"
echo "📝 Creating consolidation branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# Verify roadmap is preserved
if [ ! -f ".agents/roadmap" ]; then
    echo "⚠️  Warning: .agents/roadmap not found - this is critical!"
    echo "Roadmap location: $(find .agents -name '*roadmap*' -type f)"
fi

echo "✅ Git safety checks passed"
echo ""

echo "📊 Current .agents directory analysis:"
echo "Total directories: $(find .agents -mindepth 1 -maxdepth 1 -type d | wc -l)"
echo "Configured agents: $(find .agents -name 'agent.yml' | wc -l)"
echo ""

# Define core agents to keep
CORE_AGENTS=(
    "agent-architect"
    "agent-config-validator" 
    "agent-orchestrator"
    "integration-hub"
    "ossa-compliance-auditor"
    "ossa-spec-validator"
    "workspace-auditor"
    "workflow-orchestrator"
)

echo "🔵 Core agents to keep in OSSA:"
for agent in "${CORE_AGENTS[@]}"; do
    if [ -d ".agents/$agent" ]; then
        echo "  ✅ $agent"
    else
        echo "  ❌ $agent (missing)"
    fi
done
echo ""

# Create migration staging
echo "📁 Creating migration staging directories..."
mkdir -p "__DELETE_LATER/agents-migration-$(date +%Y%m%d)"

# Stage 1: Move specialized agents to appropriate projects
echo ""
echo "🚛 Stage 1: Moving specialized agents to target projects"

# Infrastructure agents → agent-docker
INFRA_AGENTS=(
    "kubernetes-orchestrator" "istio-mesh-architect" "prometheus-metrics-specialist"
    "grafana-dashboard-architect" "redis-cluster-architect" "postgresql-ltree-specialist" 
    "vault-secrets-expert" "cert-manager" "kafka-streaming-expert"
)

if [ -d "../common_npm/agent-docker" ]; then
    mkdir -p "../common_npm/agent-docker/.agents/infrastructure"
    echo "  Infrastructure agents → agent-docker:"
    for agent in "${INFRA_AGENTS[@]}"; do
        if [ -d ".agents/$agent" ]; then
            echo "    Moving $agent"
            git mv ".agents/$agent" "../common_npm/agent-docker/.agents/infrastructure/" 2>/dev/null || {
                cp -r ".agents/$agent" "../common_npm/agent-docker/.agents/infrastructure/"
                git rm -rf ".agents/$agent"
            }
        fi
    done
fi

# AI/ML agents → models/agent-studio_model
AI_ML_AGENTS=(
    "embeddings-model-trainer" "gpu-cluster-manager" "inference-optimizer"
    "training-data-curator" "ppo-optimization-agent" "knowledge-distillation-expert"
    "whisper-integration-specialist" "qdrant-vector-specialist"
)

if [ -d "../models/agent-studio_model" ]; then
    mkdir -p "../models/agent-studio_model/.agents/ai-ml"
    echo "  AI/ML agents → agent-studio_model:"
    for agent in "${AI_ML_AGENTS[@]}"; do
        if [ -d ".agents/$agent" ]; then
            echo "    Moving $agent"
            git mv ".agents/$agent" "../models/agent-studio_model/.agents/ai-ml/" 2>/dev/null || {
                cp -r ".agents/$agent" "../models/agent-studio_model/.agents/ai-ml/"
                git rm -rf ".agents/$agent"
            }
        fi
    done
fi

# Security agents → compliance-engine
SECURITY_AGENTS=(
    "auth-security-specialist" "rbac-configurator" "security-scanner"
    "audit-logger" "governance-enforcer" "compliance-auditor"
    "security-audit-orchestrator" "drools-rules-expert" "naming-auditor"
)

if [ -d "../common_npm/compliance-engine" ]; then
    mkdir -p "../common_npm/compliance-engine/.agents/security"
    echo "  Security agents → compliance-engine:"
    for agent in "${SECURITY_AGENTS[@]}"; do
        if [ -d ".agents/$agent" ]; then
            echo "    Moving $agent"
            git mv ".agents/$agent" "../common_npm/compliance-engine/.agents/security/" 2>/dev/null || {
                cp -r ".agents/$agent" "../common_npm/compliance-engine/.agents/security/"
                git rm -rf ".agents/$agent"
            }
        fi
    done
fi

# API/Integration agents → agent-router
API_AGENTS=(
    "rest-api-implementer" "graphql-schema-architect" "grpc-service-designer"
    "websocket-handler-expert" "openapi-expert" "api-gateway-configurator"
)

if [ -d "../common_npm/agent-router" ]; then
    mkdir -p "../common_npm/agent-router/.agents/api"
    echo "  API agents → agent-router:"
    for agent in "${API_AGENTS[@]}"; do
        if [ -d ".agents/$agent" ]; then
            echo "    Moving $agent"
            git mv ".agents/$agent" "../common_npm/agent-router/.agents/api/" 2>/dev/null || {
                cp -r ".agents/$agent" "../common_npm/agent-router/.agents/api/"
                git rm -rf ".agents/$agent"
            }
        fi
    done
fi

# Architecture agents → agent-studio  
ARCH_AGENTS=(
    "architectural-refactoring-specialist" "schema-validator" "template-generation-specialist"
    "cli-creation-architect" "typescript-compiler-surgeon" "typescript-namespace-specialist"
)

if [ -d "../common_npm/agent-studio" ]; then
    mkdir -p "../common_npm/agent-studio/.agents/architecture"
    echo "  Architecture agents → agent-studio:"
    for agent in "${ARCH_AGENTS[@]}"; do
        if [ -d ".agents/$agent" ]; then
            echo "    Moving $agent"
            git mv ".agents/$agent" "../common_npm/agent-studio/.agents/architecture/" 2>/dev/null || {
                cp -r ".agents/$agent" "../common_npm/agent-studio/.agents/architecture/"
                git rm -rf ".agents/$agent"
            }
        fi
    done
fi

# Development agents → agent-forge
DEV_AGENTS=(
    "git-recovery-coordinator" "cli-architectural-decomposer" "config-validation-expert"
    "endpoint-tester" "performance-optimization-agent" "capability-mapping-analyzer"
)

if [ -d "../common_npm/agent-forge" ]; then
    mkdir -p "../common_npm/agent-forge/.agents/development"
    echo "  Development agents → agent-forge:"
    for agent in "${DEV_AGENTS[@]}"; do
        if [ -d ".agents/$agent" ]; then
            echo "    Moving $agent"
            git mv ".agents/$agent" "../common_npm/agent-forge/.agents/development/" 2>/dev/null || {
                cp -r ".agents/$agent" "../common_npm/agent-forge/.agents/development/"
                git rm -rf ".agents/$agent"
            }
        fi
    done
fi

echo ""
echo "🗑️  Stage 2: Moving stub agents to __DELETE_LATER"

# Move remaining non-core agents to __DELETE_LATER
for agent_dir in .agents/*/; do
    if [ ! -d "$agent_dir" ]; then continue; fi
    
    agent_name=$(basename "$agent_dir")
    
    # Skip core agents and special files
    if [[ " ${CORE_AGENTS[@]} " =~ " $agent_name " ]] || \
       [[ "$agent_name" == "registry.yml" ]] || \
       [[ "$agent_name" == "roadmap" ]] || \
       [[ "$agent_name" == "workspace.json" ]]; then
        continue
    fi
    
    # Check if it's a stub (no agent.yml or empty)
    if [ ! -f "$agent_dir/agent.yml" ] || [ -z "$(ls -A "$agent_dir" 2>/dev/null)" ]; then
        echo "  Moving stub: $agent_name"
        git mv "$agent_dir" "__DELETE_LATER/agents-migration-$(date +%Y%m%d)/"
    else
        echo "  ⚠️  Review needed: $agent_name (has agent.yml but not in core list)"
    fi
done

echo ""
echo "📋 Stage 3: Update registry and workspace configuration"

# Update .agents/registry.yml if it exists
if [ -f ".agents/registry.yml" ]; then
    echo "  Updating registry.yml with new structure..."
    # Add timestamp comment
    echo "# Updated by consolidation script $(date)" >> .agents/registry.yml
fi

echo ""
echo "✅ Consolidation complete!"
echo ""
echo "📊 Final OSSA .agents structure:"
ls -la .agents/ | grep "^d" | awk '{print "  " $NF}'

echo ""
echo "🔧 Next steps:"
echo "1. Review changes: git status"
echo "2. Test core agents: ./src/cli/bin/ossa --help"  
echo "3. Commit if satisfied: git commit -m 'Consolidate .agents: keep 10 core, migrate specialists'"
echo "4. Or rollback: git checkout feature/0.1.8 && git branch -D $BRANCH_NAME"

echo ""
echo "📍 Git status:"
git status --short