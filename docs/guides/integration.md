# 02. Integration Guide

## Framework-First Approach to Agent Development

This guide shows how to integrate OAAS agents with popular AI frameworks. Start with your preferred framework, add OAAS for discovery and interoperability.

## Quick Start (2 Minutes)

### Option 1: CLI Tool

```bash
# Install OAAS CLI
npm install -g @oaas/cli

# Create your first agent
npx create-oaas-agent my-agent

# Start the agent
cd my-agent
npm start
```

### Option 2: Manual Setup

```bash
# Create .agents folder
mkdir .agents

# Create simple agent
cat > .agents/my-agent.yaml << EOF
oaas: 1.0
agent:
  name: my-agent
  version: 1.0.0
discover:
  auto: true
capabilities:
  - text_analysis
api:
  POST /analyze: Analyze text
EOF

# Your agent is now discoverable!
```

**CRITICAL: We don't compete with your framework - we make it enterprise-ready!**

OAAS is designed to ADD compliance and interoperability to existing frameworks:

```javascript
// In your framework's CLI tool
const { exec } = require('child_process');

function validateAgentSpec(specFile) {
  return new Promise((resolve, reject) => {
    exec(`openapi-agents validate ${specFile}`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Validation failed: ${stderr}`));
      } else {
        resolve(JSON.parse(stdout));
      }
    });
  });
}
```

### 3. Add OAAS Extensions for Instant Compliance

```yaml
# Your agent's OpenAPI spec - NOW ENTERPRISE READY!
openapi: 3.1.0
info:
  title: My LangChain Agent
  version: 1.0.0
  x-openapi-ai-agents-standard:
    version: "0.1.0"
    certification_level: "gold"  # $10K enterprise certification
    compliance_frameworks: ["ISO_42001", "NIST_AI_RMF", "EU_AI_Act"]
  x-agent-metadata:
    class: "specialist"
    protocols: ["openapi", "mcp", "a2a"]  # Bridge ALL protocols
    capabilities: ["reasoning", "code_generation"]
    domains: ["coding", "analysis"]
  x-protocol-bridges:
    mcp:
      enabled: true
      latency: "<50ms"  # Performance guaranteed
    a2a:
      enabled: true
      latency: "<35ms"
```

## Dual-Format Validation

The OpenAPI AI Agents Standard supports dual-format validation, allowing you to validate both `agent.yml` configuration files and their corresponding `openapi.yaml` specifications together for consistency and compliance.

### What is Dual-Format Validation?

Dual-format validation ensures that:

- **agent.yml**: Contains agent metadata, capabilities, and configuration
- **openapi.yaml**: Contains the actual API specification with endpoints and schemas
- **Relationship consistency**: Both formats reference the same agent capabilities and maintain consistency

### Basic Usage

```bash
# Validate dual-format via API (Production Server)
curl -X POST http://localhost:3003/api/v1/validate/dual-format \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "agent_config": { /* agent.yml content */ },
    "openapi_spec": { /* openapi.yaml content */ }
  }'
```

### Integration Example

```javascript
const fs = require('fs');
const yaml = require('js-yaml');
const axios = require('axios');

async function validateDualFormat(agentYmlPath, openApiYamlPath) {
  try {
    // Load both files
    const agentConfig = yaml.load(fs.readFileSync(agentYmlPath, 'utf8'));
    const openApiSpec = yaml.load(fs.readFileSync(openApiYamlPath, 'utf8'));
    
    // Validate dual-format
    const response = await axios.post('http://localhost:3003/api/v1/validate/dual-format', {
      agent_config: agentConfig,
      openapi_spec: openApiSpec
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.VALIDATION_API_KEY
      }
    });
    
    return {
      valid: response.data.valid,
      certification_level: response.data.certification_level,
      passed: response.data.passed,
      warnings: response.data.warnings,
      errors: response.data.errors,
      details: response.data.details
    };
  } catch (error) {
    throw new Error(`Dual-format validation failed: ${error.message}`);
  }
}

// Usage
validateDualFormat('./examples/basic/agent.yml', './examples/basic/openapi.yaml')
  .then(result => {
    console.log('Validation result:', result);
    console.log('Certification level:', result.certification_level);
  });
```

### Validation Checks Performed

The dual-format validator performs comprehensive checks:

1. **Individual Format Validation**
   - agent.yml schema compliance with OpenAPI AI Agents Standard v0.1.0
   - openapi.yaml schema compliance with OpenAPI 3.1.0

2. **Cross-Format Relationship Validation**
   - Capability-endpoint mapping consistency
   - Security configuration alignment
   - Protocol support verification
   - Token management consistency
   - Metadata consistency (names, versions)

3. **Certification Level Assessment**
   - **Bronze**: Basic validation passed with some errors
   - **Silver**: Good compliance with minimal warnings (≤3 warnings, ≥10 passed checks)
   - **Gold**: Excellent compliance with no warnings (≥15 passed checks)

### Best Practices for Dual-Format

1. **Keep Configurations Synchronized**

   ```yaml
   # agent.yml
   metadata:
     name: "data-processor-agent"
     version: "1.2.0"
   
   # openapi.yaml  
   info:
     title: "Data Processor Agent API"
     version: "1.2.0"  # Must match agent.yml version
   ```

2. **Map Capabilities to Endpoints**

   ```yaml
   # agent.yml
   spec:
     capabilities:
       - "universal_agent_interface"
       - "token_optimization"
   
   # openapi.yaml should include corresponding endpoints:
   # /agent/orchestrate (for universal_agent_interface)
   # /tokens/preflight (for token_optimization)
   ```

3. **Align Security Configurations**

   ```yaml
   # Both files should reference compatible security schemes
   # agent.yml references OAuth2 -> openapi.yaml must define OAuth2 scheme
   ```

## Framework-Specific Integration Examples

### LangChain Integration

```python
from langchain import Agent
import subprocess
import json

class StandardCompliantAgent(Agent):
    def __init__(self, openapi_spec, **kwargs):
        super().__init__(**kwargs)
        self.openapi_spec = openapi_spec
        self.validate_compliance()
    
    def validate_compliance(self):
        """Validate agent against OpenAPI AI Agents Standard"""
        result = subprocess.run([
            'openapi-agents', 'validate', self.openapi_spec
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            raise ValueError(f"Agent not compliant: {result.stderr}")
        
        validation_result = json.loads(result.stdout)
        self.certification_level = validation_result.get('certification_level', 'bronze')
        
    def get_compliance_status(self):
        return {
            'compliant': True,
            'certification_level': self.certification_level,
            'protocols': self.supported_protocols,
            'last_validated': self.last_validation_date
        }
```

### CrewAI Integration

```python
from crewai import Agent, Crew
from openapi_ai_agents_client import ValidationClient

class CrewAIStandardAgent(Agent):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.validator = ValidationClient(api_key='your-api-key')
        
    def validate_agent_config(self, agent_config):
        """Validate CrewAI agent config against standard"""
        validation_result = self.validator.validate_agent_config(agent_config)
        
        if not validation_result['valid']:
            raise ValueError(f"Agent config invalid: {validation_result['errors']}")
            
        return validation_result
        
    def get_openapi_spec(self):
        """Generate OpenAPI spec from CrewAI agent definition"""
        return {
            'openapi': '3.1.0',
            'info': {
                'title': self.role,
                'version': '1.0.0',
                'description': self.goal,
                'x-openapi-ai-agents-standard': {
                    'version': '0.1.0',
                    'certification_level': 'bronze'
                },
                'x-agent-metadata': {
                    'class': 'specialist',
                    'capabilities': self.tools,
                    'protocols': ['openapi']
                }
            },
            'paths': self._generate_paths()
        }
```

### AutoGen Integration

```python
import autogen
from openapi_ai_agents import StandardValidator

class AutoGenStandardWrapper:
    def __init__(self, autogen_agent, openapi_spec):
        self.agent = autogen_agent
        self.spec = openapi_spec
        self.validator = StandardValidator()
        
    def validate_and_deploy(self):
        """Validate agent against standard before deployment"""
        validation_result = self.validator.validate_spec(self.spec)
        
        if validation_result['valid']:
            print(f" Agent certified at {validation_result['certification_level']} level")
            return self.deploy()
        else:
            print(f"❌ Validation failed: {validation_result['errors']}")
            return None
            
    def deploy(self):
        """Deploy the validated agent"""
        # Standard-compliant deployment logic
        return self.agent
```

### TDDAI Integration

```typescript
// TDDAI uses this standard for agent orchestration
import { UniversalAgent, ValidationClient } from '@openapi-ai-agents/sdk';

class TDDAIOrchestrator {
  private validator: ValidationClient;
  
  constructor() {
    this.validator = new ValidationClient();
  }
  
  async orchestrateAgents(pattern: 'diagnostic_first' | 'parallel_validation', agents: UniversalAgent[]) {
    // Validate all agents against standard
    for (const agent of agents) {
      const validation = await this.validator.validateAgent(agent.spec);
      if (!validation.valid) {
        throw new Error(`Agent ${agent.name} not compliant: ${validation.errors}`);
      }
    }
    
    // Orchestrate using standard-compliant patterns
    return this.executeOrchestrationPattern(pattern, agents);
  }
}
```

## Protocol Bridge Implementation

### MCP Protocol Bridge

```typescript
import { MCPServer } from '@modelcontextprotocol/sdk';
import { OpenAPIAgentsValidator } from '@openapi-ai-agents/validator';

class MCPToStandardBridge {
  private server: MCPServer;
  private validator: OpenAPIAgentsValidator;
  
  constructor() {
    this.validator = new OpenAPIAgentsValidator();
  }
  
  async registerMCPServer(mcpServer: MCPServer) {
    // Convert MCP tools to standard format
    const standardSpec = await this.convertMCPToOpenAPI(mcpServer);
    
    // Validate against standard
    const validation = await this.validator.validate(standardSpec);
    if (!validation.valid) {
      throw new Error(`MCP server not standard-compliant: ${validation.errors}`);
    }
    
    this.server = mcpServer;
    return standardSpec;
  }
  
  private async convertMCPToOpenAPI(mcpServer: MCPServer) {
    const tools = await mcpServer.listTools();
    const resources = await mcpServer.listResources();
    
    return {
      openapi: '3.1.0',
      info: {
        title: mcpServer.name,
        version: '1.0.0',
        'x-openapi-ai-agents-standard': {
          version: '0.1.0'
        },
        'x-protocol-bridges': {
          mcp: {
            enabled: true,
            tools_endpoint: '/mcp/tools',
            resources_endpoint: '/mcp/resources'
          }
        }
      },
      paths: this.generatePathsFromMCPTools(tools)
    };
  }
}
```

## CLI Integration Patterns

### Framework CLI Integration

```bash
# LangChain CLI
langchain agent create my-agent --validate-standard
# Calls: openapi-agents validate my-agent-spec.yaml

# CrewAI CLI  
crewai create crew --standard-compliant
# Calls: openapi-agents validate crew-config.yaml

# TDDAI CLI
tddai orchestrate --validate-with openapi-agents-standard
# Calls: openapi-agents validate agent1.yaml agent2.yaml
```

### Custom Validation Hooks

```javascript
// In your build/deploy pipeline
const { ValidationClient } = require('@openapi-ai-agents/client');

async function validateBeforeDeploy(agentSpec) {
  const client = new ValidationClient({
    apiUrl: process.env.VALIDATION_API_URL,
    apiKey: process.env.API_KEY
  });
  
  const result = await client.validateOpenAPI(agentSpec);
  
  if (!result.valid) {
    console.error('❌ Agent validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  console.log(` Agent validated - Certification: ${result.certification_level}`);
  return result;
}
```

## Testing Integration

### Contract Testing

```javascript
// Ensure your agent is compatible with the standard
const { contractTests } = require('@openapi-ai-agents/testing');

describe('Agent Standard Compliance', () => {
  test('should implement required endpoints', async () => {
    await contractTests.verifyRequiredEndpoints('http://localhost:3000');
  });
  
  test('should handle standard error formats', async () => {
    await contractTests.verifyErrorHandling('http://localhost:3000');
  });
  
  test('should support protocol bridges', async () => {
    await contractTests.verifyProtocolBridges('http://localhost:3000', ['mcp']);
  });
});
```

### Performance Testing

```javascript
// Validate performance requirements
const { performanceTests } = require('@openapi-ai-agents/testing');

describe('Performance Compliance', () => {
  test('health endpoint should respond within 100ms', async () => {
    const result = await performanceTests.measureResponseTime('/health');
    expect(result.averageMs).toBeLessThan(100);
  });
  
  test('should handle concurrent requests', async () => {
    const result = await performanceTests.loadTest('/capabilities', 100);
    expect(result.successRate).toBeGreaterThan(0.99);
  });
});
```

## Best Practices

### 1. Start Simple

- Begin with Bronze certification requirements
- Implement basic health and capabilities endpoints
- Add standard extensions to your OpenAPI spec

### 2. Use Validation Early

```bash
# During development
openapi-agents validate --watch my-agent.yaml

# In CI/CD
openapi-agents validate my-agent.yaml --fail-on-warnings
```

### 3. Implement Protocol Bridges Gradually

- Start with OpenAPI (required)
- Add MCP bridge for tool interoperability
- Consider A2A for agent collaboration

### 4. Plan for Compliance

- Map your use case to relevant frameworks (ISO 42001, NIST AI RMF)
- Implement audit logging early
- Design for explainability from the start

### 5. Community Engagement

- Join the Discord community
- Contribute examples and improvements
- Share your integration experiences

## Certification Process

### Bronze Certification

1. Validate spec: `openapi-agents validate my-agent.yaml`
2. Test endpoints: `openapi-agents test http://localhost:3000`
3. Submit for review: `openapi-agents certify --level bronze`

### Silver Certification

1. Achieve Bronze certification
2. Implement protocol bridges
3. Pass performance tests
4. Security audit
5. Submit enhanced application

### Gold Certification

1. Achieve Silver certification
2. Formal verification
3. Explainability implementation
4. Enterprise compliance
5. Comprehensive review process

## Support and Resources

- **Documentation**: [docs.openapi-ai-agents.org](https://docs.openapi-ai-agents.org)
- **Community**: [Discord](https://discord.gg/openapi-agents)
- **GitHub**: [github.com/openapi-ai-agents/standard](https://github.com/openapi-ai-agents/standard)
- **Issues**: Report integration issues on GitHub
- **Examples**: Check `/examples` directory for complete implementations

---

Need help with integration? Join our community or open an issue on GitHub!
