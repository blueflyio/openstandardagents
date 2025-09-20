# OSSA Reference Agents

This directory contains the complete reference implementation of all 9 OSSA agent types, providing examples that others can use as templates for building their own OSSA-compliant agents.

## Directory Structure

```
.agents/
├── README.md                    # This documentation
├── registry.yml                 # Complete agent registry
├── orchestrators/               # Workflow coordination agents
│   └── example-orchestrator/
│       ├── agent.yml
│       └── README.md
├── workers/                     # Task execution agents
│   ├── task-heavy/
│   │   ├── agent.yml
│   │   └── README.md
│   ├── security-agent/
│   │   └── agent.yml
│   ├── data-agent/
│   │   └── agent.yml
│   └── analytics-agent/
│       └── agent.yml
├── critics/                     # Quality assessment agents
│   └── code-reviewer/
│       └── agent.yml
├── judges/                      # Decision-making agents
│   └── quality-assessor/
│       └── agent.yml
├── trainers/                    # (Future expansion)
├── governors/                   # (Future expansion)
├── monitors/                    # System monitoring agents
│   └── system-monitor/
│       └── agent.yml
├── integrators/                 # External system integration agents
│   ├── api-connector/
│   │   └── agent.yml
│   ├── communication-multiprotocol/
│   │   └── agent.yml
│   └── mcp-enhanced/
│       └── agent.yml
└── voice/                       # Voice interface agents
    └── voice-assistant.yml
```

## Agent Types Overview

### 1. Orchestrator Agents
- **Purpose**: Coordinate complex multi-agent workflows
- **Example**: `example-orchestrator` - Workflow coordination and resource allocation
- **Key Features**: Hierarchical planning, agent specialization, adaptive execution

### 2. Worker Agents
- **Purpose**: Execute specific tasks and computations
- **Examples**: 
  - `task-heavy-worker` - Heavy computation tasks
  - `security-agent` - Authentication, encryption, auditing
  - `data-agent` - Batch, stream, and realtime data processing
  - `analytics-agent` - Statistical analysis and machine learning
- **Key Features**: Specialized capabilities, resource management, scalability

### 3. Critic Agents
- **Purpose**: Evaluate quality and provide feedback
- **Example**: `code-reviewer-critic` - Code quality analysis and security review
- **Key Features**: Quality assessment, best practices enforcement, issue identification

### 4. Judge Agents
- **Purpose**: Make decisions based on criteria and standards
- **Example**: `quality-assessor-judge` - Quality decisions and compliance validation
- **Key Features**: Multi-criteria decision making, standards compliance, justification

### 5. Monitor Agents
- **Purpose**: Track system performance and health
- **Example**: `system-monitor` - Performance tracking, alerting, metrics collection
- **Key Features**: Real-time monitoring, trend analysis, automated alerting

### 6. Integrator Agents
- **Purpose**: Connect with external systems and services
- **Examples**:
  - `api-connector-integrator` - REST/GraphQL API integration
  - `communication-multiprotocol` - WebSocket, gRPC, REST, GraphQL support
  - `mcp-enhanced` - Enhanced MCP Server with auto-discovery
- **Key Features**: Protocol bridging, data transformation, service orchestration

### 7. Voice Agents
- **Purpose**: Handle voice interactions and speech processing
- **Example**: `voice-assistant` - Speech-to-text, intent analysis, text-to-speech
- **Key Features**: Multi-modal interaction, context awareness, natural language processing

### 8. Trainer Agents (Future)
- **Purpose**: Model training and learning optimization
- **Status**: Not yet implemented in reference

### 9. Governor Agents (Future)
- **Purpose**: Policy enforcement and compliance governance
- **Status**: Not yet implemented in reference

## Docker Service Integration

The reference implementation includes agent manifests for all Docker services defined in `infrastructure/docker/docker-compose.agents.yml`:

| Docker Service | Agent Type | Port | Description |
|---------------|------------|------|-------------|
| `ossa-task-heavy` | worker | 3004 | Heavy computation worker |
| `ossa-comm-multiprotocol` | integrator | 3005 | Multi-protocol communication |
| `ossa-mcp-enhanced` | integrator | 3006 | Enhanced MCP server |
| `ossa-data-agent` | worker | 3007 | Data processing worker |
| `ossa-analytics-agent` | worker | 3008 | Analytics and ML worker |
| `ossa-security-agent` | worker | 3009 | Security operations worker |

## Conformance Levels

The reference agents demonstrate different conformance levels:

- **Gold**: 7 agents with full OSSA compliance including audit logging, feedback loops, and certifications
- **Silver**: 1 agent with essential OSSA features but limited advanced capabilities

## Key Features Demonstrated

### 1. API Version Format
All agents use the correct `apiVersion: "@bluefly/open-standards-scalable-agents/v0.1.9"` format.

### 2. Token Efficiency Strategies
Each agent implements appropriate token efficiency strategies:
- Hierarchical planning (orchestrators)
- Result-only reporting (workers) 
- Focused analysis (critics)
- Criteria-focused evaluation (judges)
- Metric summarization (monitors)
- Response filtering (integrators)

### 3. Protocol Support
Agents demonstrate various protocol implementations:
- OSSA native protocol
- REST APIs
- WebSocket connections
- gRPC services
- GraphQL endpoints
- Prometheus metrics
- MCP (Model Context Protocol)

### 4. Resource Management
Proper resource specification following Kubernetes patterns:
- CPU requests and limits
- Memory requests and limits
- Storage requirements
- Performance characteristics

### 5. Security and Compliance
Multiple compliance frameworks demonstrated:
- ISO-42001 (AI Management Systems)
- ISO-27001 (Information Security)
- SOC-2-Type-II
- PCI-DSS
- FIPS-140-2
- WCAG-2.1-AA

## Usage as Templates

These reference implementations serve as templates for:

1. **Creating New Agents**: Copy and modify agent.yml files
2. **Understanding OSSA Standards**: See proper structure and required fields
3. **Docker Integration**: Learn how to map Docker services to OSSA agents
4. **Conformance Requirements**: Understand different compliance levels
5. **Token Efficiency**: Implement appropriate optimization strategies

## Registry Management

The `registry.yml` file provides:
- Complete catalog of all agents
- Docker service mappings
- Conformance level tracking
- Resource utilization overview
- Protocol coverage analysis
- Domain coverage metrics

## Getting Started

1. **Browse Examples**: Review agent.yml files to understand structure
2. **Check Registry**: Use registry.yml to understand available agents
3. **Copy Templates**: Use as starting points for new agent development
4. **Adapt Configuration**: Modify for your specific use cases
5. **Test Integration**: Validate with OSSA platform components

## Best Practices Demonstrated

- Comprehensive operation definitions with proper schemas
- Appropriate timeout and resource specifications
- Token efficiency optimization strategies
- Protocol flexibility and preference handling
- Proper dependency management
- Status tracking and health monitoring
- Configuration externalization
- Documentation standards

This reference implementation provides a solid foundation for building OSSA-compliant agents across all supported agent types.