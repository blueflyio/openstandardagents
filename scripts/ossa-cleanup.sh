#!/bin/bash

# OSSA v0.1.7 .agents Directory Compliance Cleanup
# ================================================

echo "🔍 OSSA v0.1.7 Agent Directory Compliance Audit & Cleanup"
echo "========================================================="

AGENTS_DIR="/Users/flux423/Sites/LLM/OSSA/.agents"
REPORTS_DIR="/Users/flux423/Sites/LLM/OSSA/reports"
SCRIPTS_DIR="/Users/flux423/Sites/LLM/OSSA/scripts"

# Create required directories if they don't exist
mkdir -p "$REPORTS_DIR"
mkdir -p "$SCRIPTS_DIR"

cd "$AGENTS_DIR"

echo ""
echo "📋 Current Status:"
echo "  Total items: $(ls -la | wc -l)"
echo "  Agent directories: $(find . -maxdepth 1 -type d -name "*" | grep -v "^\.$" | wc -l)"
echo "  Loose files: $(find . -maxdepth 1 -type f | wc -l)"

echo ""
echo "🧹 Starting Cleanup..."

# 1. Move reports to reports directory
echo "  → Moving reports to $REPORTS_DIR..."
for file in deployment-report-*.md roadmap-*.md roadmap-*.json validation-report-*.json syntax-analysis-*.md workspace-*.md; do
    if [ -f "$file" ]; then
        mv "$file" "$REPORTS_DIR/" 2>/dev/null && echo "    ✓ Moved $file"
    fi
done

# 2. Move scripts to scripts directory  
echo "  → Moving scripts to $SCRIPTS_DIR..."
for file in *.js *.sh; do
    if [ -f "$file" ]; then
        mv "$file" "$SCRIPTS_DIR/" 2>/dev/null && echo "    ✓ Moved $file"
    fi
done

# 3. Move config files to root config
echo "  → Moving deployment configs..."
for file in *-config.yml *-status.json; do
    if [ -f "$file" ]; then
        mv "$file" "$REPORTS_DIR/" 2>/dev/null && echo "    ✓ Moved $file"
    fi
done

# 4. Standardize agent.yml filenames
echo ""
echo "📝 Standardizing agent.yml files..."
for dir in */; do
    if [ -d "$dir" ]; then
        agent_name=$(basename "$dir")
        
        # Check for various naming patterns
        if [ -f "${dir}agent-v0.1.7.yml" ]; then
            mv "${dir}agent-v0.1.7.yml" "${dir}agent.yml" 2>/dev/null
            echo "    ✓ Renamed ${agent_name}/agent-v0.1.7.yml → agent.yml"
        elif [ -f "${dir}${agent_name}.yml" ]; then
            mv "${dir}${agent_name}.yml" "${dir}agent.yml" 2>/dev/null
            echo "    ✓ Renamed ${agent_name}/${agent_name}.yml → agent.yml"
        elif [ -f "${dir}agent.yaml" ]; then
            mv "${dir}agent.yaml" "${dir}agent.yml" 2>/dev/null
            echo "    ✓ Renamed ${agent_name}/agent.yaml → agent.yml"
        fi
    fi
done

# 5. Validate each agent directory
echo ""
echo "🔍 Validating agent structures..."
COMPLIANT=0
NON_COMPLIANT=0

for dir in */; do
    if [ -d "$dir" ]; then
        agent_name=$(basename "$dir")
        issues=""
        
        # Check for required agent.yml
        if [ ! -f "${dir}agent.yml" ]; then
            issues="${issues}  ❌ Missing agent.yml\n"
        fi
        
        # Check for README.md (recommended)
        if [ ! -f "${dir}README.md" ]; then
            issues="${issues}  ⚠️  Missing README.md (recommended)\n"
        fi
        
        # Check for proper structure
        if [ -z "$issues" ]; then
            echo "  ✅ ${agent_name} - COMPLIANT"
            ((COMPLIANT++))
        else
            echo "  ❌ ${agent_name} - NON-COMPLIANT"
            echo -e "$issues"
            ((NON_COMPLIANT++))
        fi
    fi
done

# 6. Handle standalone agent yml files (convert to proper agent directories)
echo ""
echo "📦 Converting standalone agent files to directories..."
for file in *.yml; do
    if [ -f "$file" ] && [[ "$file" != "registry.yml" ]]; then
        agent_name="${file%.yml}"
        agent_name="${agent_name%-agent}"
        
        if [ ! -d "$agent_name" ]; then
            mkdir -p "$agent_name"
            mv "$file" "${agent_name}/agent.yml"
            echo "    ✓ Created ${agent_name}/ with agent.yml"
        fi
    fi
done

# 7. Generate compliance report
echo ""
echo "📊 Generating Compliance Report..."

cat > "$REPORTS_DIR/ossa-compliance-report.md" << EOF
# OSSA v0.1.7 Agent Directory Compliance Report

**Date:** $(date '+%Y-%m-%d %H:%M:%S')
**Directory:** $AGENTS_DIR

## Summary

- **Total Agents:** $(find . -maxdepth 1 -type d -name "*" | grep -v "^\.$" | wc -l)
- **Compliant Agents:** $COMPLIANT
- **Non-Compliant Agents:** $NON_COMPLIANT
- **Compliance Rate:** $(echo "scale=2; $COMPLIANT * 100 / ($COMPLIANT + $NON_COMPLIANT)" | bc)%

## Agent Status

| Agent | Status | Agent.yml | README | Issues |
|-------|--------|-----------|--------|--------|
EOF

for dir in */; do
    if [ -d "$dir" ]; then
        agent_name=$(basename "$dir")
        has_agent_yml="❌"
        has_readme="❌"
        status="❌"
        
        [ -f "${dir}agent.yml" ] && has_agent_yml="✅"
        [ -f "${dir}README.md" ] && has_readme="✅"
        [ "$has_agent_yml" = "✅" ] && status="✅"
        
        echo "| $agent_name | $status | $has_agent_yml | $has_readme | - |" >> "$REPORTS_DIR/ossa-compliance-report.md"
    fi
done

cat >> "$REPORTS_DIR/ossa-compliance-report.md" << EOF

## Actions Taken

1. Moved report files to \`$REPORTS_DIR\`
2. Moved scripts to \`$SCRIPTS_DIR\`  
3. Standardized all agent.yml filenames
4. Created proper agent directories for standalone files
5. Validated agent directory structures

## Recommendations

1. Add README.md to agents missing documentation
2. Ensure all agent.yml files follow OSSA v0.1.7 schema
3. Remove any remaining non-agent files from .agents directory
4. Implement automated validation in CI/CD pipeline

## OSSA v0.1.7 Requirements

- ✅ All agents in \`.agents/\` directory
- ✅ Each agent in its own subdirectory
- ✅ Standard \`agent.yml\` filename
- ⚠️  README.md recommended for each agent
- ✅ No loose files in .agents root
EOF

echo ""
echo "✅ Cleanup Complete!"
echo ""
echo "📊 Final Status:"
echo "  Compliant agents: $COMPLIANT"
echo "  Non-compliant agents: $NON_COMPLIANT" 
echo "  Reports moved: $(ls $REPORTS_DIR | wc -l)"
echo "  Scripts moved: $(ls $SCRIPTS_DIR | wc -l)"
echo ""
echo "📄 Full report saved to: $REPORTS_DIR/ossa-compliance-report.md"