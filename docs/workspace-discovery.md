# Workspace Discovery System

## Overview

The OpenAPI AI Agents Standard (OAAS) includes a comprehensive workspace discovery system that automatically scans the LLM ecosystem for agents and creates a centralized registry.

## Discovery Script

**Location**: `scripts/workspace-discovery.js`

**Usage**:
```bash
node scripts/workspace-discovery.js
```

## What It Discovers

The discovery system scans for `.agents/` directories across the workspace and identifies:

### Agent Types
- **TDDAI Agents**: Located in `/common_npm/tddai/.agents/agents/`
- **Drupal LLM Expert**: Located in `/llm-platform/.agents/drupal_llm_expert/`
- **RFP Generator**: Located in `/common_npm/bfrfp/.agents/rfp_generator/`
- **OAAS Standard Agents**: Located in `/openapi-ai-agents-standard/.agents/`

### Agent Information
For each discovered agent, the system extracts:
- **Name**: Agent identifier
- **Version**: Agent version number
- **Description**: Agent purpose and capabilities
- **Capabilities**: List of agent capabilities
- **Frameworks**: Supported frameworks (Drupal, LLM Gateway, MCP, etc.)
- **Compliance**: Compliance level and certifications

## Output

### Console Report
The discovery script generates a comprehensive console report showing:

```
🔍 Discovering OpenAPI AI Agents Standard agents...
📁 Scanning workspace: /Users/flux423/Sites

📊 OpenAPI AI Agents Standard - Workspace Discovery Report
============================================================

🎯 Found 8 agents across 4 projects:

📁 bfrfp:
  🤖 rfp_generator (v1.0.0)
     📍 LLM/common_npm/bfrfp/.agents/rfp_generator
     🎯 Capabilities: 1
     🔧 Frameworks: government, audit, metrics, compliance_tracking
     📝 Documentation and compliance guides

📁 llm-platform:
  🤖 drupal_llm_expert (v1.0.0)
     📍 LLM/llm-platform/.agents/drupal_llm_expert
     🎯 Capabilities: 1
     🔧 Frameworks: drupal, llm_gateway, mcp, tddai, audit, metrics
     📝 Drupal recipes for automated setup

🎯 Capability Matrix:
  • rfp_analysis: rfp_generator
  • drupal_module_development: drupal_llm_expert

🔧 Framework Usage:
  • government: 1 agents
  • drupal: 1 agents
  • llm_gateway: 1 agents
  • mcp: 1 agents
  • tddai: 1 agents
```

### Registry File
The discovery system generates a comprehensive JSON registry at:
- **Location**: `registry/workspace-registry.json`
- **Format**: JSON with complete agent metadata
- **Updates**: Regenerated on each discovery run

**Registry Structure**:
```json
{
  "timestamp": "2025-08-26T06:00:00Z",
  "workspace": "/Users/flux423/Sites",
  "agents": [
    {
      "path": "/Users/flux423/Sites/LLM/common_npm/bfrfp/.agents/rfp_generator",
      "project": "bfrfp",
      "projectPath": "/Users/flux423/Sites/LLM/common_npm/bfrfp",
      "name": "rfp_generator",
      "version": "1.0.0",
      "description": "Government RFP processing and analysis with compliance validation",
      "capabilities": ["rfp_analysis"],
      "frameworks": ["government", "audit", "metrics", "compliance_tracking"]
    }
  ],
  "summary": {
    "total_agents": 8,
    "total_projects": 4,
    "total_capabilities": 2,
    "total_frameworks": 8
  },
  "errors": []
}
```

## Agent Directory Structure

### Standard Structure
```
project/.agents/
├── agent-name/
│   ├── agent.yml          # Agent specification
│   ├── openapi.yaml       # API specification (optional)
│   └── data/              # Training data (optional)
│       ├── training-data.json
│       └── examples.json
```

### TDDAI Structure
```
project/.agents/
├── agents/                # Nested agents directory
│   ├── agent-name/
│   │   ├── agent.yml      # TDDAI agent specification
│   │   └── openapi.yaml   # API specification
│   └── another-agent/
│       ├── agent.yml
│       └── openapi.yaml
```

## Agent Specification Format

### Standard OAAS Format
```yaml
apiVersion: openapi-ai-agents/v0.2.0
kind: Agent
metadata:
  name: agent-name
  version: 1.0.0
  description: Agent description
spec:
  capabilities:
    - id: capability_name
      description: "What it does"
  frameworks:
    framework_name: enabled
  api_endpoints:
    - /api/endpoint
```

### TDDAI Format
```yaml
agent:
  id: "agent-name"
  name: "Agent Display Name"
  version: "1.0.0"
  description: "Agent description"
  capabilities:
    primary:
      - id: "capability_name"
        name: "Capability Display Name"
        description: "What it does"
        confidence: 0.95
```

## Integration with TDDAI

The workspace discovery system integrates with TDDAI for:

### Agent Validation
```bash
# Validate discovered agents
tddai agents validate-compliance --frameworks=iso-42001,nist-ai-rmf
```

### API Gateway Management
```bash
# Create API gateway for discovered agents
tddai integration api-gateway --create oaas-validation-api
```

### Workflow Orchestration
```bash
# Orchestrate workflows across discovered agents
tddai orchestration orchestrate --workflow oaas-implementation --parallel
```

## Customization

### Adding New Agent Types
To add support for new agent types, modify the discovery script:

1. **Update Directory Scanning**: Add new directory patterns to scan
2. **Update Parsing Logic**: Add support for new YAML formats
3. **Update Reporting**: Include new agent types in reports

### Filtering Agents
The discovery system can be customized to:
- **Skip Directories**: Exclude certain directories from scanning
- **Filter by Framework**: Only discover agents supporting specific frameworks
- **Filter by Compliance**: Only discover agents with certain compliance levels

## Error Handling

The discovery system handles various error conditions:

### Common Errors
- **Permission Denied**: Skip directories without read access
- **Invalid YAML**: Log parsing errors and continue
- **Missing Files**: Handle missing agent.yml files gracefully

### Error Reporting
Errors are collected and reported in:
- **Console Output**: Warnings during discovery
- **Registry File**: Error list in JSON output
- **Log Files**: Detailed error logging (if enabled)

## Performance

### Optimization Features
- **Depth Limiting**: Prevents infinite recursion (max depth: 10)
- **Directory Skipping**: Skips common non-agent directories
- **Parallel Processing**: Concurrent directory scanning
- **Caching**: Registry caching for repeated runs

### Performance Metrics
- **Scan Time**: Typically < 5 seconds for 100+ projects
- **Memory Usage**: Minimal memory footprint
- **Error Recovery**: Graceful handling of scan failures

## Usage Examples

### Basic Discovery
```bash
# Run discovery
node scripts/workspace-discovery.js

# Check registry
cat registry/workspace-registry.json | jq '.summary'
```

### Integration with CI/CD
```bash
# Run discovery in CI pipeline
node scripts/workspace-discovery.js

# Validate registry
if [ -f "registry/workspace-registry.json" ]; then
  echo "Discovery completed successfully"
  jq '.agents | length' registry/workspace-registry.json
fi
```

### TDDAI Integration
```bash
# Discover agents and validate with TDDAI
node scripts/workspace-discovery.js
tddai agents validate-compliance --frameworks=iso-42001,nist-ai-rmf
tddai orchestration orchestrate --workflow oaas-implementation --parallel
```

## Troubleshooting

### Common Issues
1. **No Agents Found**: Check directory structure and permissions
2. **Parse Errors**: Verify YAML syntax in agent.yml files
3. **Permission Errors**: Ensure read access to project directories

### Debug Mode
Enable debug mode for detailed logging:
```bash
DEBUG=1 node scripts/workspace-discovery.js
```

## Future Enhancements

### Planned Features
- **Real-time Discovery**: Watch for agent changes
- **Agent Dependencies**: Map agent dependencies
- **Performance Metrics**: Agent performance tracking
- **Compliance Scoring**: Automated compliance scoring
- **Integration Testing**: Cross-agent integration testing

### API Integration
- **REST API**: HTTP API for discovery results
- **WebSocket**: Real-time agent updates
- **GraphQL**: Flexible agent querying
- **Webhook**: Agent change notifications
