# 02-agent-integration: Framework Integration Ready

## Overview
Level 2 agent demonstrating framework integration with MCP, LangChain, CrewAI, and AutoGen. Includes a complete OpenAPI specification and enhanced configuration for production use.

## What's Included
- **agent.yml**: 50-line configuration with framework-specific settings
- **openapi.yaml**: Complete API specification (100+ lines)
- Framework compatibility configurations
- Context management settings
- Basic security and monitoring

## Key Features
- ✅ **Multi-Framework Support**: Configured for MCP, LangChain, CrewAI
- ✅ **OpenAPI Specification**: Full REST API documentation
- ✅ **Context Management**: Token optimization and adaptive handling
- ✅ **Security**: API key authentication
- ✅ **Rate Limiting**: Built-in request throttling
- ✅ **Monitoring**: Metrics and logging configuration

## Use Cases
- Framework integration testing
- Multi-tool agent development
- API-first agent design
- Cross-platform compatibility

## Framework Integration

### MCP (Model Context Protocol)
```yaml
frameworks:
  mcp:
    enabled: true
    server_name: "integration-example"
```
Ready for Claude Desktop integration.

### LangChain
```yaml
langchain:
  enabled: true
  tool_type: "structured"
```
Can be used as a LangChain tool immediately.

### CrewAI
```yaml
crewai:
  enabled: true
  role: "analyst"
  backstory: "Expert in code analysis"
```
Ready for CrewAI workflows.

## API Endpoints
- `POST /analyze` - Project analysis
- `POST /generate` - Code generation
- `POST /validate` - Compliance validation

## Quick Start

### 1. Deploy the agent:
```bash
cp -r examples/02-agent-integration ~/.agents/my-integration-agent
cd ~/.agents/my-integration-agent
```

### 2. Start the API server:
```bash
# If you have an implementation
npm start
# Or use the mock server
oaas mock --port=3000 --spec=openapi.yaml
```

### 3. Test with frameworks:

**MCP Bridge:**
```bash
oaas export --format=mcp > mcp-config.json
```

**LangChain Integration:**
```python
from langchain.tools import Tool
tool = Tool.from_oaas("~/.agents/my-integration-agent")
```

**CrewAI Agent:**
```python
from crewai import Agent
agent = Agent.from_oaas("~/.agents/my-integration-agent")
```

## Configuration Details

### Capabilities
Each capability specifies compatible frameworks:
```yaml
capabilities:
  - name: analyze_project
    frameworks: [langchain, crewai]
```

### Context Management
Optimized for 8K token contexts:
```yaml
context_management:
  max_tokens: 8000
  optimization: adaptive
```

### Security
API key authentication configured:
```yaml
integration:
  authentication:
    type: api_key
```

## Upgrade Path
- **To Level 3**: Add production features (data folder, enhanced security, deployment config)
- **To Level 4**: Add enterprise compliance, audit trails, governance

## Validation
```bash
# Validate agent configuration
oaas validate agent.yml

# Validate OpenAPI spec
oaas validate openapi.yaml

# Test with validation API
tddai agents validate-openapi agent.yml --api-url="http://localhost:3003/api/v1"
```

## Next Steps
1. Customize capabilities for your use case
2. Implement the API endpoints
3. Test framework integrations
4. Deploy to production (see Level 3)