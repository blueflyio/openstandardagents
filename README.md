# OSSA - Open Standards for Scalable Agents

[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-orange.svg)](src/api/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-0.1.2-blue.svg)](package.json)
[![Pipeline](https://img.shields.io/badge/Pipeline-Testing-yellow.svg)](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/pipelines)

## Overview

## 🌟 What is OSSA?

**OSSA (Open Standards for Scalable Agents)** is an open specification framework designed to standardize how AI agents communicate, collaborate, and operate in distributed systems. It provides the building blocks for creating interoperable, production-ready AI agent systems at scale.

### 🎯 Core Purpose

OSSA addresses the growing need for standardization in the AI agent ecosystem by:

- **Eliminating Vendor Lock-in**: Create agents that work across different platforms and frameworks
- **Enabling Interoperability**: Allow agents from different vendors to communicate seamlessly
- **Simplifying Development**: Provide well-defined interfaces and tools for agent development
- **Ensuring Scalability**: Architect solutions that grow from prototype to enterprise scale

### 🧩 Key Components

1. **OpenAPI 3.1 Specifications**
   - Comprehensive API definitions for agent communication
   - Standardized data models and protocols
   - Versioned and backward-compatible interfaces

2. **TypeScript Implementation**
   - Production-ready reference implementation
   - Type-safe development experience
   - Extensible core framework

3. **Development Tools**
   - CLI for agent lifecycle management
   - Validation and testing utilities
   - Code generation and scaffolding

### 🌍 Use Cases

OSSA is ideal for building:

- **Enterprise Automation**: Complex workflow automation across departments
- **AI Orchestration**: Coordinating multiple AI models and services
- **Data Processing Pipelines**: Scalable data transformation and analysis
- **Intelligent Assistants**: Sophisticated, multi-capability AI assistants
- **IoT Ecosystems**: Managing distributed device networks

### 🚀 Why Choose OSSA?

- **Open Standard**: Vendor-neutral and community-driven
- **Enterprise-Grade**: Built for production deployments
- **Extensible**: Add custom capabilities and integrations
- **Well-Documented**: Comprehensive guides and references
- **Active Community**: Growing ecosystem of contributors and users
## Current Implementation

- **15 OpenAPI 3.1 Specifications** - Core OSSA, MCP infrastructure, and project APIs
- **TypeScript Implementation** - CLI, server, and validation tools
- **Agent Definitions** - Specification for 9 agent types
- **Validation Framework** - OpenAPI specification validation
- **CLI Tools** - Agent lifecycle management commands
- **Express Server** - Basic API server implementation

## Technology Stack

- **Runtime**: Node.js 20 LTS + TypeScript 5.3
- **API Framework**: Express 4.18 with OpenAPI 3.1 middleware
- **Validation**: Custom OSSA validator with Ajv + JSON Schema Draft 2020-12
- **CLI**: Commander.js with comprehensive agent lifecycle management
- **Security**: Passport.js with OAuth 2.1, mTLS, and OPA integration
- **Message Bus**: Kafka/RabbitMQ/NATS with Schema Registry
- **Monitoring**: OpenTelemetry with Prometheus and Grafana
- **Container**: Docker with multi-stage builds
- **Orchestration**: Kubernetes 1.28+ with custom CRDs

## Quick Start

```bash
# Clone and install
git clone https://gitlab.bluefly.io/llm/ossa.git
cd ossa
npm install

# Build the project
npm run build

# Validate OpenAPI specifications
npm run api:validate:complete

# Start development server
npm run start:dev

# Run comprehensive tests
npm test

# View API documentation
npm run api:docs
```

## OpenAPI 3.1 Specifications

OSSA provides **12 comprehensive OpenAPI 3.1 specifications** across three domains:

### Core Specifications
- **`ossa-complete.openapi.yml`** - Complete OSSA API with all OpenAPI 3.1 features
- **`ossa-v0.1.9-complete.openapi.yml`** - Version-specific complete specification
- **`specification.openapi.yml`** - Core OSSA specification API

### Project Domain
- **`clean-architecture.openapi.yml`** - Clean architecture patterns API
- **`orchestration.openapi.yml`** - Multi-agent orchestration workflows
- **`project-discovery.openapi.yml`** - Project discovery and analysis
- **`rebuild-audit.openapi.yml`** - Automated rebuild and audit processes

### MCP (Model Context Protocol) Domain  
- **`context7-mcp.openapi.yml`** - Context management for AI models
- **`magic-mcp.openapi.yml`** - Advanced MCP operations
- **`mcp-infrastructure.openapi.yml`** - MCP infrastructure management
- **`web-eval-mcp.openapi.yml`** - Web-based evaluation framework

### Legacy/Testing
- **`test-api.openapi.yml`** - Testing framework specification

## MCP-per-Agent Architecture

🔗 **Revolutionary Design**: Each OSSA agent can expose its own **Model Context Protocol (MCP) server**, enabling unprecedented modularity and interoperability in AI agent ecosystems.

### Key Benefits

- **🧩 Modularity**: Agents become self-contained, reusable building blocks
- **🔄 Interoperability**: Any MCP-compatible client can utilize any agent's capabilities
- **📈 Scalability**: Independent deployment and scaling of agent services
- **🌐 Federation**: Agents can discover and orchestrate with each other automatically
- **🛠️ Composability**: Mix and match agents from different vendors/teams seamlessly

### Architecture Components

```yaml
Agent MCP Server:
  - Tools: Agent-specific capabilities (functions, APIs)
  - Resources: Data sources, knowledge bases, file systems
  - Prompts: Agent-optimized prompt templates
  - Sampling: Custom inference parameters
```

### MCP Registry & Discovery

- **Central Registry**: `/mcp-infra/registry/servers` - tracks all agent MCP servers
- **Service Categories**: `core`, `tier1`, `tier2`, `custom`, `experimental`
- **Health Monitoring**: Real-time status and performance metrics
- **Version Management**: Semantic versioning and compatibility tracking

### Example: Web Evaluation Agent MCP

```typescript
// Agent exposes web evaluation tools via MCP
const webEvalMCP = {
  tools: [
    "web_scrape", "html_analyze", "accessibility_audit",
    "performance_test", "seo_analysis"
  ],
  resources: ["web_results", "audit_reports", "metrics"],
  prompts: ["evaluation_expert", "accessibility_specialist"]
};
```

### ADK Integration

OSSA's Agent Development Kit (ADK) seamlessly converts agents into MCP tools:

```typescript
// Convert any OSSA agent to MCP tool
createMCPTool(agentName: string) {
  return {
    name: `ossa_agent_${agentName}`,
    description: agent.capabilities,
    execute: agent.invoke
  };
}
```

### 📚 Learn More

- **[Complete Architecture Guide](docs/ARCHITECTURE.md)** - Deep dive into MCP-per-Agent design
- **[MCP Examples](examples/mcp-agent-examples.md)** - Concrete implementation examples
- **[API Documentation](src/api/)** - Full OpenAPI 3.1 specifications

## Model Context Switching & Multi-Provider Support

🧠 **Revolutionary Flexibility**: OSSA enables dynamic model selection and per-agent model configuration, allowing each agent to use the optimal model for its specific tasks.

### Key Capabilities

- **🔄 Runtime Model Switching**: Change models dynamically via environment variables or API calls
- **🎯 Per-Agent Models**: Each agent can specify its preferred model and provider
- **🌐 Multi-Provider Support**: Ollama, OpenAI, Anthropic, Gemini, Azure OpenAI, and custom providers
- **⚡ Performance Optimization**: Match models to workloads (coding, data analysis, creative tasks)
- **💰 Cost Optimization**: Use cost-effective models for simple tasks, premium models for complex ones

### Model Selection Examples

```typescript
// Per-agent model configuration
const dataAgent = new OSSALlmAgent({
  name: 'data-processor',
  model: 'gpt-4o',              // Best for data processing
  provider: 'openai'
});

const codeAgent = new OSSALlmAgent({
  name: 'code-reviewer',
  model: 'claude-3-5-sonnet',   // Best for code analysis
  provider: 'anthropic'
});

const creativeAgent = new OSSALlmAgent({
  name: 'content-creator',
  model: 'gemini-2.0-flash',    // Best for creative tasks
  provider: 'google'
});
```

### Agent Manifest Configuration

```yaml
# Agent-specific model configuration
spec:
  configuration:
    model: "claude-3-5-sonnet"
    provider: "anthropic"
    parameters:
      temperature: 0.7
      max_tokens: 4000
      reasoning_mode: "explicit"
```

### Environment-Based Switching

```bash
# Global model switching
export OLLAMA_MODEL="llama3.2:70b"
export OPENAI_MODEL="gpt-4o"
export ANTHROPIC_MODEL="claude-3-5-sonnet"

# Per-agent environment variables
export AGENT_MODEL_DATA_PROCESSOR="gpt-4o"
export AGENT_MODEL_CODE_REVIEWER="claude-3-5-sonnet"
export AGENT_MODEL_CREATIVE_WRITER="gemini-2.0-flash"
```

### Supported Providers

| Provider | Models | Use Cases |
|----------|--------|-----------|
| **🦙 Ollama** | llama3.2, codellama, deepseek-coder | Local deployment, privacy |
| **🤖 OpenAI** | gpt-4o, gpt-4o-mini, o1-preview | General purpose, reasoning |
| **🧠 Anthropic** | claude-3-5-sonnet, claude-3-5-haiku | Code analysis, creative tasks |
| **✨ Google** | gemini-2.0-flash, gemini-1.5-pro | Multimodal, fast inference |
| **☁️ Azure OpenAI** | Enterprise GPT models | Enterprise security |
| **🔧 Custom** | Hugging Face, local models | Specialized deployments |

### 📚 Model Configuration Resources

- **[Model Configuration Examples](examples/model-configuration-examples.md)** - Comprehensive implementation examples
- **[Cost Optimization Guide](docs/ARCHITECTURE.md#cost-aware-model-selection)** - Smart model selection strategies
- **[Provider Integration](docs/ARCHITECTURE.md#model-provider-integration)** - Multi-provider setup

## Advanced OpenAPI 3.1 Features Demonstrated

✅ **JSON Schema Draft 2020-12** - `$schema`, `$vocabulary`, conditional schemas  
✅ **Discriminator Mapping** - Polymorphic agent type inheritance  
✅ **Webhooks** - Event-driven notifications and callbacks  
✅ **Content Encoding** - Binary payloads and multiple content types  
✅ **OAuth 2.1 PKCE** - Advanced security with modern authentication  
✅ **Path Item References** - Reusable API components  
✅ **External Examples** - Rich documentation with external references  
✅ **Callbacks** - Asynchronous workflow triggers  
✅ **HATEOAS Links** - Hypermedia-driven API navigation  
✅ **Complex Parameters** - Dependencies and conditional validation  

## Agent Architecture

### Agent Taxonomy

OSSA defines six primary agent archetypes with distinct responsibilities:

```
Agent (base)
├── ExecutionAgent
│   ├── WorkerAgent (task execution)
│   ├── OrchestratorAgent (coordination)
│   └── ProcessorAgent (data transformation)
├── GovernanceAgent
│   ├── CriticAgent (quality control)
│   ├── JudgeAgent (decision making)
│   └── GovernorAgent (policy enforcement)
└── ObservabilityAgent
    ├── MonitorAgent (system observation)
    ├── TracerAgent (execution tracking)
    └── AuditorAgent (compliance logging)
```

### Universal Agent Protocol (UAP)

UAP provides unified communication across heterogeneous agent ecosystems:

- **RASP** (Resource Allocation & Scheduling Protocol) - Resource management
- **ACAP** (Agent Capability Advertisement Protocol) - Service discovery  
- **UADP** (Universal Agent Discovery Protocol) - Zero-config discovery
- **CPC** (Cross-Platform Communication) - Transport abstraction

## CLI Commands

The OSSA CLI provides comprehensive agent lifecycle management:

```bash
# Agent Discovery & Management
ossa discover --protocol UADP --filter "type=worker"
ossa register --capability "data-processing" --endpoint "/api/v1/process"
ossa query --service "machine-learning" --version ">= 2.0"

# Resource Management  
ossa resources --protocol RASP --view cluster
ossa reserve --cpu "4 cores" --memory "8GB" --duration "2h"
ossa scale --agent-type worker --replicas 10 --zone us-west-2

# Communication & Testing
ossa comm config --protocol CPC --transport grpc --encryption tls1.3
ossa comm test --source agent-001 --target agent-002 --protocol all
ossa benchmark uap --duration 5m --agents 100 --concurrent-requests 1000

# Validation & Compliance
ossa validate uap --spec-version 1.0 --agent-manifest ./agent.yaml
ossa compliance audit --tier governed --output report.json
ossa sbom generate --format spdx --sign
```

## OpenAPI Validation & Tooling

OSSA includes a **custom 400+ line TypeScript validator** for OpenAPI 3.1 compliance:

```bash
# Validate specifications
npm run api:validate          # Core specification  
npm run api:validate:complete # Complete specification
npm run validate:specs        # All specifications + schemas

# Generate documentation
npm run api:docs              # Preview documentation
npm run api:docs:build        # Build static docs
npm run api:bundle            # Bundle specification

# Generate TypeScript types
npm run generate:client       # Generate API client types
npm run api:generate          # Generate core API types
```

## Development Tools

### Redocly Integration

OSSA uses **Redocly CLI 2.1.5** for advanced OpenAPI tooling:

```yaml
# .redocly.yaml configuration
apiDefinitions:
  main: src/api/core/ossa-complete.openapi.yml
  specification: src/api/core/specification.openapi.yml
  # ... 12 total specifications

lint:
  extends: [recommended]
  rules:
    operation-operationId: error
    no-server-example.com: error
    
features.openapi:
  showConsole: true
  expandResponses: '200,201'
  jsonSampleExpandLevel: 3
```

### Custom OSSA Validator

The built-in validator provides comprehensive compliance checking:

```typescript
import { OSSAOpenAPIValidator } from './src/core/validation/openapi-validator.js';

const validator = new OSSAOpenAPIValidator({
  enableOSSACompliance: true,
  requireAgentMetadata: true,
  enforceSecuritySchemes: true,
  validateExamples: true,
  ossaVersion: '0.1.9'
});

const result = await validator.validateSpec('./spec.yml');
console.log(validator.generateReport(result));
```

## Project Structure

```
/Users/flux423/Sites/LLM/OSSA/
├── src/
│   ├── api/                    # 12 OpenAPI 3.1 specifications
│   │   ├── core/              # Core OSSA specifications
│   │   ├── project/           # Project domain APIs
│   │   ├── mcp/               # MCP infrastructure
│   │   └── schemas/           # JSON schemas
│   ├── cli/                   # OSSA CLI implementation
│   ├── core/                  # Core libraries and validation
│   ├── server/                # Express server implementation
│   └── types/                 # TypeScript type definitions
├── docs/                      # Generated documentation
├── examples/                  # Example implementations
├── infrastructure/            # Kubernetes manifests
├── tests/                     # Test suites
├── .redocly.yaml             # Redocly configuration
├── package.json              # Node.js dependencies
└── tsconfig.json            # TypeScript configuration
```

## Enterprise Features

### Security & Compliance

- **Multi-tier Compliance**: Core, Governed, Advanced, Enterprise
- **Security Frameworks**: OAuth 2.1, mTLS, X.509 certificates
- **Policy Enforcement**: OPA-based policy decision points
- **Audit Logging**: Immutable audit trails with tamper detection
- **Encryption**: At-rest and in-transit with key rotation

### Observability & Monitoring

- **OpenTelemetry**: Complete metrics, traces, and logs
- **Performance Targets**: <100ms p99 latency, >10,000 req/s throughput
- **Health Checks**: Kubernetes-compatible liveness/readiness probes
- **SLA Enforcement**: 99.95% availability targets
- **Real-time Metrics**: Comprehensive dashboards and alerting

### Deployment Patterns

- **Kubernetes-Native**: Custom CRDs and operators
- **Multi-Region**: Global load balancing with regional clusters
- **Auto-scaling**: Horizontal scaling to 1000+ nodes
- **GitLab CI/CD**: Golden component integration
- **Container-First**: Docker with multi-stage builds

## Performance Benchmarks

Reference implementation performance on AWS m5.large:

| Metric | Requirement | Measurement |
|--------|------------|-------------|
| Latency (p99) | < 100ms | End-to-end request processing |
| Throughput | > 10,000 req/s | Per agent instance |
| Availability | > 99.95% | Monthly uptime |
| MTTR | < 5 minutes | Automatic recovery time |
| Scalability | Linear to 1000 nodes | Horizontal scaling efficiency |
| Memory | < 256 MB | Idle footprint |
| CPU | < 5% | Idle usage |
| Startup | < 3 seconds | Cold start time |

## Contributing

OSSA follows a formal RFC process for specification changes:

1. **Proposal**: Submit RFC with rationale and specification changes
2. **Review**: Community review period (minimum 30 days)  
3. **Implementation**: Proof-of-concept in reference implementation
4. **Testing**: Comprehensive test suite additions
5. **Approval**: Technical steering committee review
6. **Merge**: Integration into specification

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

OSSA is licensed under the [MIT License](LICENSE). Implementations may use any license compatible with the specification requirements.

## Repository & Resources

- **Specification**: [gitlab.bluefly.io/llm/ossa](https://gitlab.bluefly.io/llm/ossa)
- **Reference Implementation**: [gitlab.bluefly.io/llm/agent_buildkit](https://gitlab.bluefly.io/llm/agent_buildkit)
- **Documentation**: [docs.ossa.dev](https://docs.ossa.dev)
- **OpenAPI Specs**: [api.ossa.dev](https://api.ossa.dev)
- **Community**: [Discord](https://discord.gg/ossa) | [GitHub Discussions](https://github.com/ossa-ai/discussions)

---

**OSSA v0.1.9** - The definitive standard for enterprise-grade AI agent interoperability through comprehensive OpenAPI 3.1 specifications and production-ready tooling.