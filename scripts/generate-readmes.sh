#!/bin/bash

# Generate README.md for each agent to achieve full OSSA compliance

echo "📝 Generating README.md files for OSSA compliance..."

for dir in */; do
    if [ -d "$dir" ] && [ ! -f "${dir}README.md" ]; then
        agent_name=$(basename "$dir")
        
        # Extract description from agent.yml if it exists
        if [ -f "${dir}agent.yml" ]; then
            description=$(grep -m 1 "description:" "${dir}agent.yml" | sed 's/.*description: *//')
            role=$(grep -m 1 "role:" "${dir}agent.yml" | sed 's/.*role: *//')
        else
            description="OSSA-compliant agent"
            role="Specialized agent"
        fi
        
        cat > "${dir}README.md" << EOF
# ${agent_name}

## Overview
${description:-OSSA v0.1.7 compliant agent for specialized tasks.}

## Role
${role:-Specialized agent for the OSSA ecosystem.}

## Configuration
See \`agent.yml\` for detailed configuration and capabilities.

## OSSA Compliance
- **Version:** v0.1.7
- **Type:** Agent
- **Status:** Active

## Usage
This agent is automatically discovered and managed by the OSSA orchestration system.

## Dependencies
Defined in \`agent.yml\` under the dependencies section.

## API
Exposes capabilities through the standard OSSA agent interface.
EOF
        
        echo "  ✓ Created README.md for ${agent_name}"
    fi
done

echo "✅ README generation complete!"