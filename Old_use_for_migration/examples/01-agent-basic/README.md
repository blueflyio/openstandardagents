# 01-agent-basic: 5-Minute Quickstart Agent

## Overview
This is the perfect starting point for creating your first OAAS agent. With just 30 lines of YAML, you get a fully functional agent that can be discovered, validated, and integrated with popular AI frameworks.

## What's Included
- **agent.yml**: 30-line configuration demonstrating core features
- Clear capability declarations with descriptions
- Framework compatibility (MCP, LangChain, CrewAI)
- Context paths for file access
- API endpoint declarations

## Key Features
- ✅ **Minimal Configuration**: Only essential fields required
- ✅ **Framework Ready**: Works with MCP, LangChain, and CrewAI out of the box
- ✅ **Clear Capabilities**: Each capability has a description for better discovery
- ✅ **Quick Setup**: Can be created and deployed in under 5 minutes

## Use Cases
- Quick proof of concept
- Learning OAAS basics
- Rapid prototyping
- Simple single-purpose agents

## How to Use

### 1. Copy this example to your project:
```bash
cp -r examples/01-agent-basic ~/.agents/my-agent
```

### 2. Customize the agent.yml:
```yaml
name: my-project-agent
expertise: "What your project does"
capabilities:
  - your_capability: "Description"
```

### 3. Validate your agent:
```bash
oaas validate ~/.agents/my-agent
```

### 4. Test discovery:
```bash
oaas scan
# Your agent should appear in the list
```

## Upgrade Path
When you need more features, upgrade to:
- **Level 2 (02-agent-integration)**: Add OpenAPI spec and enhanced framework support
- **Level 3 (03-agent-production)**: Add security, monitoring, and data folders
- **Level 4 (04-agent-enterprise)**: Full compliance and enterprise features

## Schema Compliance
This example follows the `schemas/agent-basic.yml` specification.

## Quick Tips
1. Keep capabilities focused and well-described
2. Use clear, lowercase names with hyphens
3. Start with 3-5 capabilities, add more as needed
4. Enable only the frameworks you actually use

## Next Steps
- Try the validation API: `tddai agents validate-openapi agent.yml`
- Bridge to MCP: `oaas export --format=mcp`
- Add to your project: Copy to `.agents/` folder