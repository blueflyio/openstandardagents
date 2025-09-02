# OSSA CLI v0.1.3 - Enhanced with UADP Discovery Protocol

The OSSA CLI is a lightweight command-line tool for managing OSSA v0.1.3 (Open Standards Scalable Agents) compliant agents with integrated UADP (Universal Agent Discovery Protocol) support.

## Features

- 🚀 **OSSA v0.1.3 Compliance** - Full support for latest agent standards
- 🔍 **UADP Discovery Protocol** - Advanced agent discovery and registration
- 🎯 **Multi-Tier Support** - Core, Governed, and Advanced conformance tiers
- 🔗 **Framework Integration** - LangChain, CrewAI, OpenAI, MCP support
- 🛡️ **Enterprise Compliance** - ISO 42001, NIST AI RMF, EU AI Act
- 📊 **Performance Monitoring** - Health checks and metrics
- 🔐 **Security Controls** - Authentication, encryption, audit trails

## Installation

```bash
npm install -g ossa-cli
# or
npm install ossa-cli
```

## Quick Start

```bash
# Create a new OSSA v0.1.3 agent
ossa create my-agent --domain finance --tier advanced

# Validate the agent
ossa validate my-agent

# List all agents in workspace
ossa list

# Initialize UADP discovery
ossa discovery init

# Register agent with discovery protocol
ossa discovery register my-agent --endpoint http://localhost:3000

# Discover agents by capabilities
ossa discovery find --capabilities finance_analysis --tier advanced
```

## Commands

### Agent Management

#### `ossa create <name> [options]`

Create a new OSSA v0.1.3 compliant agent with full specifications.

**Options:**
- `-d, --domain <domain>` - Agent domain (default: general)
- `-p, --priority <priority>` - Priority level (default: medium) 
- `-t, --tier <tier>` - Conformance tier: core|governed|advanced (default: advanced)

**Example:**
```bash
ossa create security-agent --domain security --tier advanced
```

**Generated Files:**
- `agent.yml` - Full OSSA v0.1.3 specification
- `openapi.yaml` - OpenAPI 3.1 spec with OSSA extensions
- `README.md` - Documentation and quick start guide
- Directory structure for data, config, schemas

#### `ossa validate [path] [options]`

Validate OSSA agent specification against v0.1.3 standards.

**Options:**
- `-v, --verbose` - Show detailed validation output

**Validation Checks:**
- OSSA version compliance
- Required metadata fields
- Conformance tier validation
- Protocol requirements (OpenAPI mandatory)
- Compliance framework requirements
- OpenAPI specification extensions

**Example:**
```bash
ossa validate ./my-agent --verbose
```

#### `ossa list [options]`

List all OSSA v0.1.3 agents in current workspace.

**Options:**
- `-f, --format <format>` - Output format: table|json (default: table)

**Features:**
- Recursive directory scanning
- OSSA v0.1.3 detection
- Protocol and feature indicators
- UADP capability detection

**Example:**
```bash
ossa list --format json
```

#### `ossa upgrade [path] [options]`

Upgrade legacy agents to OSSA v0.1.3 (planned feature).

**Options:**
- `--dry-run` - Show upgrade plan without applying changes

### UADP Discovery Protocol

#### `ossa discovery`

Access UADP (Universal Agent Discovery Protocol) commands.

#### `ossa discovery init [options]`

Initialize UADP discovery registry for agent management.

**Options:**
- `-u, --url <url>` - External registry URL
- `-i, --interval <interval>` - Health check interval in seconds (default: 10)

**Features:**
- Local discovery registry
- Configurable health monitoring
- Performance caching (LRU)
- Event-driven architecture

**Example:**
```bash
ossa discovery init --interval 30
```

#### `ossa discovery register <path> [options]`

Register an agent with the UADP discovery protocol.

**Options:**
- `-e, --endpoint <endpoint>` - Agent API endpoint
- `-h, --health <health>` - Health check endpoint
- `-c, --capabilities <caps>` - Capabilities endpoint

**Auto-Detection:**
- Reads agent.yml specification
- Extracts capabilities and protocols
- Infers compliance frameworks
- Sets performance baselines

**Example:**
```bash
ossa discovery register ./security-agent \
  --endpoint http://localhost:3000/security \
  --health http://localhost:3000/health
```

#### `ossa discovery find [options]`

Discover agents using advanced UADP filtering and ranking.

**Options:**
- `-c, --capabilities <caps>` - Filter by capabilities (comma-separated)
- `-p, --protocols <protocols>` - Filter by protocols (comma-separated)  
- `-t, --tier <tier>` - Filter by conformance tier
- `-f, --frameworks <frameworks>` - Filter by compliance frameworks
- `-l, --limit <limit>` - Maximum results (default: 10)
- `--include-inactive` - Include unhealthy agents

**Advanced Features:**
- Performance-based ranking
- Multi-criteria filtering
- Hierarchical discovery
- Predictive matching

**Examples:**
```bash
# Find security agents
ossa discovery find --capabilities security_analysis,threat_detection

# Find advanced tier agents with specific protocols
ossa discovery find --tier advanced --protocols openapi,mcp

# Find compliant agents
ossa discovery find --frameworks ISO_42001,NIST_AI_RMF --limit 5
```

#### `ossa discovery health [agent-id]`

Check agent health status with comprehensive monitoring.

**Features:**
- Individual agent health checks
- Registry-wide health summary
- Performance metrics
- Status change tracking

**Examples:**
```bash
# Check specific agent
ossa discovery health ossa-abc12345

# Check all agents
ossa discovery health
```

#### `ossa discovery stats`

Show comprehensive UADP registry statistics and performance metrics.

**Metrics Include:**
- Agent counts and health percentages
- Discovery performance (time, requests)
- Protocol distribution
- Registry configuration
- Cache statistics

**Example:**
```bash
ossa discovery stats
```

#### `ossa discovery export [file] [options]`

Export UADP registry for backup, sharing, or analysis.

**Options:**
- `-f, --format <format>` - Export format: json|yaml (default: json)

**Example:**
```bash
ossa discovery export registry-backup.yaml --format yaml
```

## Agent Specification

### OSSA v0.1.3 Agent Structure

```yaml
ossa: 0.1.3
metadata:
  name: "agent-name"
  version: "1.0.0"
  description: "Agent description"
  author: "Author"
  license: "Apache-2.0"
  created: "2025-09-02"
  updated: "2025-09-02"
  tags: ["domain", "tier", "priority"]

spec:
  conformance_tier: "advanced"  # core|governed|advanced
  class: "domain"
  category: "assistant"
  
  capabilities:
    primary:
      - "domain_analysis"
      - "multi_framework_integration"
      - "compliance_monitoring"
    secondary:
      - "automated_reporting"
      - "performance_optimization"
  
  protocols:
    - name: "openapi"
      version: "3.1.0"
      required: true
      extensions: ["x-ossa-advanced"]
    - name: "mcp"
      version: "2024-11-05"
      required: true
      advanced_features: ["resource_streaming"]
    - name: "uadp"
      version: "0.1.3"
      required: true
      discovery_modes: ["active", "passive"]
  
  framework_support:
    langchain:
      enabled: true
      integration_type: "structured_tool"
      async_execution: true
    crewai:
      enabled: true
      integration_type: "specialist"
      role: "domain_expert"
    openai:
      enabled: true
      integration_type: "assistant"
      function_calling: true
    mcp:
      enabled: true
      integration_type: "protocol_bridge"
      server_mode: true
  
  compliance_frameworks:
    - name: "ISO_42001"
      level: "implemented"
      audit_ready: true
    - name: "NIST_AI_RMF"
      level: "implemented"
      maturity_level: 3
  
  discovery:
    uadp_enabled: true
    hierarchical_discovery: true
    capability_inference: true
  
  performance:
    latency:
      health_check: "<50ms"
      capabilities: "<100ms"
    throughput:
      requests_per_second: 100
    availability:
      uptime_target: 99.5
  
  security:
    authentication: ["api_key", "oauth2"]
    authorization: "rbac"
    encryption:
      at_rest: "aes_256"
      in_transit: "tls_1_3"
  
  endpoints:
    health: "/health"
    capabilities: "/capabilities"
    discover: "/discover"
```

### OpenAPI 3.1 Extensions

```yaml
info:
  x-openapi-ai-agents-standard:
    version: "0.1.3"
    conformance_tier: "advanced"
    certification_level: "gold"
    compliance_frameworks: ["ISO_42001", "NIST_AI_RMF"]
    enterprise_features: true
  
  x-agent-metadata:
    class: "domain"
    category: "assistant"
    protocols: ["openapi", "mcp", "uadp"]
    capabilities: ["domain_analysis", "compliance_monitoring"]
    domains: ["domain"]
```

## Conformance Tiers

### Core Tier
- Basic OSSA compliance
- OpenAPI protocol required
- Minimal capabilities
- Standard security

### Governed Tier
- Enhanced governance
- Compliance frameworks required
- Audit capabilities
- Advanced security controls

### Advanced Tier
- Full enterprise features
- Multiple compliance frameworks
- Performance guarantees
- Zero-trust security
- UADP discovery integration

## Integration Examples

### LangChain Integration

```python
from langchain.tools import StructuredTool
from ossa_agent import SecurityAgent

agent = SecurityAgent.from_spec("security-agent/agent.yml")
tool = StructuredTool.from_function(
    func=agent.analyze_threat,
    name="security_analysis",
    description="Analyze security threats"
)
```

### CrewAI Integration

```python
from crewai import Agent, Crew
from ossa_agent import SecurityAgent

security_specialist = Agent(
    role="Security Specialist",
    goal="Analyze and mitigate security threats",
    backstory="Expert in cybersecurity with OSSA compliance",
    tools=[SecurityAgent.from_spec("security-agent/agent.yml")]
)
```

### MCP Integration

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SecurityAgent } from './ossa-agents/security-agent';

const server = new Server(
  { name: "security-agent", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

const agent = SecurityAgent.fromSpec('security-agent/agent.yml');
server.setRequestHandler(ListToolsRequestSchema, agent.getTools);
```

## Best Practices

### Agent Design
1. **Start with requirements** - Define capabilities and domains first
2. **Choose appropriate tier** - Match complexity to conformance needs
3. **Plan integrations** - Consider which frameworks you'll support
4. **Design for discovery** - Enable UADP for agent coordination

### Development Workflow
1. **Create** - `ossa create my-agent --domain <domain> --tier <tier>`
2. **Validate** - `ossa validate my-agent` before implementation
3. **Implement** - Build agent logic following specification
4. **Register** - `ossa discovery register my-agent` for coordination
5. **Monitor** - `ossa discovery health` for operational status

### Production Deployment
1. **Compliance validation** - Ensure all frameworks are implemented
2. **Security hardening** - Enable all recommended security controls
3. **Performance monitoring** - Set up health checks and metrics
4. **Discovery registration** - Register with production UADP registry

## Troubleshooting

### Common Issues

**Agent validation fails**
```bash
# Check OSSA version
ossa validate my-agent --verbose

# Ensure OpenAPI protocol is present
# Check conformance tier requirements
```

**Discovery registration fails**
```bash
# Initialize discovery first
ossa discovery init

# Verify agent specification
ossa validate my-agent

# Check endpoint accessibility
curl http://localhost:3000/health
```

**Performance issues**
```bash
# Check registry stats
ossa discovery stats

# Monitor health status
ossa discovery health

# Review agent endpoints configuration
```

## Contributing

The OSSA CLI is part of the Open Standards Scalable Agents initiative. Contributions are welcome:

1. **Bug reports** - Use GitHub issues
2. **Feature requests** - Propose via discussions
3. **Pull requests** - Follow contribution guidelines
4. **Documentation** - Help improve guides and examples

## License

Apache 2.0 - see LICENSE file for details.

## Support

- **Documentation**: [OSSA Standards](https://ossa.agents)
- **Community**: [GitHub Discussions](https://github.com/ossa-agents/standards/discussions)
- **Issues**: [GitHub Issues](https://github.com/ossa-agents/cli/issues)