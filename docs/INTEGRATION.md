# OpenAPI AI Agents Standard - Integration Guide

## For AI Framework Developers

The OpenAPI AI Agents Standard is designed to be framework-agnostic. Your framework should integrate with this standard, not the other way around.

### How to Integrate Your Framework

#### 1. Install the Standard

```bash
npm install @openapi-ai-agents/standard
```

#### 2. Use the CLI as a Dependency

```javascript
// In your framework's CLI
const { spawn } = require('child_process');

// Validate agent specifications
function validateAgent(specFile) {
  return spawn('npx', ['openapi-agents', 'validate', specFile]);
}

// Check compliance
function checkCompliance(frameworks) {
  return spawn('npx', ['openapi-agents', 'frameworks']);
}
```

#### 3. Call the Validation API

```javascript
const axios = require('axios');

async function validateAgentSpec(specification, apiKey) {
  const response = await axios.post('http://localhost:3000/api/v1/validate/openapi', {
    specification: specification
  }, {
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data;
}
```

#### 4. Implement Agent Standard Extensions

Add these extensions to your agent's OpenAPI specification:

```yaml
openapi: 3.1.0
info:
  title: Your Agent
  version: 1.0.0
  x-openapi-ai-agents-standard:
    version: "0.1.0"
    certification_level: "gold"
    protocols: ["openapi", "mcp"]
  x-agent-metadata:
    class: "specialist"
    protocols: ["openapi", "mcp", "a2a"]
    capabilities: ["reasoning", "code_generation"]
    domains: ["general", "coding"]
```

## Examples by Framework

### LangChain Integration

```python
from openapi_ai_agents import validate_specification

class LangChainAgentValidator:
    def __init__(self):
        self.api_key = os.getenv('OPENAPI_AGENTS_API_KEY')
    
    def validate_agent(self, agent_spec):
        return validate_specification(agent_spec, self.api_key)
```

### CrewAI Integration

```python
from crewai import Agent
import subprocess

class StandardCompliantAgent(Agent):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.validate_compliance()
    
    def validate_compliance(self):
        result = subprocess.run([
            'npx', 'openapi-agents', 'validate', 
            self.specification_file
        ], capture_output=True)
        
        if result.returncode != 0:
            raise ValueError(f"Agent not compliant: {result.stderr}")
```

### AutoGen Integration

```python
import autogen
from openapi_ai_agents_client import Client

class AutoGenStandardAgent(autogen.AssistantAgent):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.standard_client = Client(api_key=os.getenv('OPENAPI_AGENTS_API_KEY'))
        
    def validate_against_standard(self):
        return self.standard_client.validate_openapi(self.openapi_spec)
```

## Protocol Bridge Implementation

### MCP Protocol Bridge

```javascript
// In your MCP server
const { MCPBridge } = require('@openapi-ai-agents/bridges');

const bridge = new MCPBridge({
  server_name: "your-mcp-server",
  validation_api: "http://localhost:3000/api/v1"
});

await bridge.register_tools(your_tools);
await bridge.register_resources(your_resources);
```

### A2A Protocol Bridge

```javascript
// In your agent-to-agent implementation
const { A2ABridge } = require('@openapi-ai-agents/bridges');

const bridge = new A2ABridge({
  agent_endpoint: "https://your-agent.com/api/v1",
  capabilities: ["reasoning", "analysis"],
  validation_api: "http://localhost:3000/api/v1"
});

await bridge.negotiate_protocol();
```

## Best Practices

### 1. Validation First
Always validate your agent specifications before deployment:

```bash
openapi-agents validate my-agent.yaml
```

### 2. Use Standard Extensions
Include the required OpenAPI AI Agents Standard extensions:

- `x-openapi-ai-agents-standard`
- `x-agent-metadata`
- `x-token-management`
- `x-protocol-bridges`

### 3. Implement Health Checks
Provide health endpoints that work with the standard:

```yaml
paths:
  /health:
    get:
      summary: Agent health check
      responses:
        '200':
          description: Agent is healthy
```

### 4. Support Multiple Protocols
Implement bridges for multiple protocols:

- OpenAPI (required)
- MCP (recommended)
- A2A (recommended)
- AITP (experimental)

## Framework-Specific Examples

### TDDAI Integration Example

TDDAI integrates with the standard by:

```bash
# TDDAI calls the standard for validation
tddai agents orchestrate --validate-with openapi-agents-standard

# TDDAI uses the standard CLI
npx openapi-agents validate agent-spec.yaml

# TDDAI calls the validation API
curl -X POST http://localhost:3000/api/v1/validate/openapi \
  -H "X-API-Key: $API_KEY" \
  -d @agent-spec.json
```

This way, TDDAI depends on the standard, not vice versa.

## Certification Process

1. **Bronze**: Basic OpenAPI 3.1 compliance
2. **Silver**: Protocol bridges + token optimization  
3. **Gold**: Full governance + enterprise features

Use the CLI to check your certification level:

```bash
openapi-agents validate your-agent.yaml
# Output: 🏆 Certification Level: GOLD
```

## Contributing

To contribute protocol bridges or framework integrations:

1. Fork this repository
2. Add your integration in `integrations/`
3. Follow the integration patterns above
4. Submit a pull request

The standard is designed to be extended by the community while maintaining core interoperability.