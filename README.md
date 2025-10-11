# OSSA - Open Standard for Smart & Scalable Agents

**The OpenAPI for AI Agents**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Version](https://img.shields.io/badge/OSSA-0.2.0-green.svg)](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard)

---

## What is OSSA?

OSSA (Open Standard for Smart & Scalable Agents) is a **specification standard** for defining AI agents. Similar to how OpenAPI standardizes REST APIs, OSSA provides:

- **Formal JSON Schema** for agent manifests (`spec/ossa-1.0.schema.json`)
- **OpenAPI Specifications** for agent communication protocols
- **Reference Implementations** demonstrating specification compliance
- **Validation Tools** for schema conformance testing

OSSA is **NOT** a framework or runtime. It's a standard that defines the contract for AI agent systems.

---

## Repository Structure

```
OSSA/
├── spec/
│   └── ossa-1.0.schema.json       # Core OSSA specification (JSON Schema)
├── openapi/
│   └── *.yaml                      # OpenAPI specs for agent protocols
├── .agents/                        # Reference implementations
│   ├── workers/                    # Task execution agents
│   ├── orchestrators/              # Workflow coordination
│   ├── integrators/                # External system integration
│   ├── monitors/                   # System observation
│   ├── critics/                    # Quality assessment
│   ├── judges/                     # Decision-making
│   └── governors/                  # Policy enforcement
├── tests/
│   └── validation-suite/           # Schema validation tests
├── docs/                           # Specification documentation
└── examples/                       # Example agent manifests
```

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Validate Example Agents

```bash
npm test
```

This runs the validation suite against all example agents in `.agents/` and `spec/examples/`.

### 3. Explore the Specification

The core specification is defined in:
- **Schema**: `spec/ossa-1.0.schema.json` - JSON Schema defining agent manifest structure
- **Examples**: `spec/examples/*.yml` - Example OSSA-compliant agent manifests
- **Tests**: `tests/validation-suite/schema-validator.test.ts` - Validation tests

---

## OSSA Specification Overview

### Agent Manifest Structure

All OSSA agents are defined using YAML/JSON manifests conforming to the OSSA 1.0 schema:

```yaml
ossaVersion: "1.0"

agent:
  # Identity
  id: "my-agent"                    # DNS-1123 subdomain format
  name: "My Agent"
  version: "1.0.0"                  # Semantic versioning
  description: "Agent description"

  # Classification
  role: "custom"                    # compliance|chat|orchestration|audit|etc.
  tags: ["security", "automation"]

  # Runtime Configuration
  runtime:
    type: "docker"                  # docker|k8s|local|serverless|edge
    image: "ossa/my-agent:1.0.0"
    resources:
      cpu: "500m"
      memory: "512Mi"
    health_check:
      type: "http"
      endpoint: "/health"

  # Capabilities
  capabilities:
    - name: "process_data"
      description: "Process data using AI"
      input_schema:
        type: object
        properties:
          data: { type: string }
      output_schema:
        type: object
        properties:
          result: { type: string }

  # Policies & Compliance
  policies:
    compliance: ["fedramp-moderate", "soc2-type2"]
    data_residency: ["US"]
    encryption: true
    audit: true

  # Integration
  integration:
    protocol: "http"                # http|grpc|mcp|websocket
    endpoints:
      base_url: "http://localhost:3000"
      health: "/health"
      metrics: "/metrics"
    auth:
      type: "jwt"

  # Monitoring
  monitoring:
    traces: true
    metrics: true
    logs: true
```

### Key Features

#### 1. **Agent Identity & Versioning**
- Unique agent IDs (DNS-1123 format)
- Semantic versioning (semver 2.0.0)
- Role-based classification

#### 2. **Runtime Specifications**
- Multi-runtime support (Docker, Kubernetes, serverless, edge)
- Resource requirements (CPU, memory, GPU)
- Health check definitions

#### 3. **Capability Definitions**
- JSON Schema-based input/output contracts
- OpenAPI reference support
- Timeout and retry policies

#### 4. **Compliance Frameworks**
- FedRAMP (Low, Moderate, High)
- ISO 27001, SOC 2, HIPAA, GDPR, PCI-DSS
- ISO 42001 (AI Management Systems)
- EU AI Act compliance

#### 5. **Protocol Support**
- HTTP/REST
- gRPC
- Model Context Protocol (MCP)
- WebSocket

---

## Reference Implementations

The `.agents/` directory contains **51 reference implementations** organized by OSSA agent types:

| Type | Count | Description |
|------|-------|-------------|
| **Workers** | 30 | Task execution (infrastructure, security, ML/AI, data) |
| **Orchestrators** | 3 | Workflow coordination and multi-agent management |
| **Integrators** | 12 | External system integration (API, protocol translation) |
| **Monitors** | 3 | System observation and performance tracking |
| **Critics** | 1 | Quality assessment and standards compliance |
| **Judges** | 1 | Decision-making based on policies |
| **Governors** | 1 | Policy enforcement and compliance management |

Each reference implementation demonstrates:
- Complete OSSA manifest (`agent.yml`)
- OpenAPI specification (`openapi.yml`)
- Behavior definitions (`behaviors/*.behavior.yml`)
- Handler implementations (`handlers/*.handlers.ts`)
- Schema definitions (`schemas/*.schema.json`)
- Unit tests (`tests/unit/*.test.ts`)

---

## Validation & Testing

### Schema Validation

```bash
# Validate all examples
npm run validate:examples

# Run full test suite
npm test

# Coverage report
npm run test:coverage
```

### Validation Tools

The test suite (`tests/validation-suite/schema-validator.test.ts`) validates:
- Schema structure and required fields
- Agent ID format (DNS-1123 subdomain)
- Version format (semver 2.0.0)
- Role enumeration
- Runtime configurations
- Capability schemas
- Compliance framework adherence

---

## CI/CD Integration

OSSA uses GitLab CI for automated validation:

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - build
  - deploy
  - release

validate:schemas:
  stage: validate
  script:
    - npm install
    - npm run validate:examples

test:unit:
  stage: test
  script:
    - npm run test
  coverage: '/All files[^|]*\\|[^|]*\\s+([\\d\\.]+)/'
```

Pipeline includes:
- OpenAPI specification validation (Redocly)
- JSON schema validation
- Unit test execution
- Documentation generation
- GitLab Pages deployment

---

## Documentation

- **Specification**: [spec/ossa-1.0.schema.json](spec/ossa-1.0.schema.json)
- **API Reference**: [openapi/](openapi/)
- **Examples**: [spec/examples/](spec/examples/)
- **Technical Docs**: [docs/](docs/)
- **Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## Comparison to Other Standards

| Standard | Purpose | Scope |
|----------|---------|-------|
| **OSSA** | AI Agent Definition | Agent manifests, capabilities, deployment |
| **OpenAPI** | REST API Definition | HTTP endpoints, request/response schemas |
| **AsyncAPI** | Event-Driven APIs | Message formats, pub/sub protocols |
| **MCP** | Model Context Protocol | LLM context management, tool definitions |
| **Kubernetes CRDs** | Resource Definition | Kubernetes-native resources |

OSSA complements these standards:
- Uses OpenAPI for agent HTTP endpoints
- Integrates with MCP for tool definitions
- Generates Kubernetes CRDs for deployment
- Supports AsyncAPI for event-driven agents

---

## Contributing

OSSA is an open standard developed collaboratively. Contributions are welcome:

1. **Specification Changes**: Follow OSSA Change Proposal (OCP) process
2. **Reference Implementations**: Add examples in `.agents/`
3. **Documentation**: Improve guides and examples
4. **Testing**: Enhance validation coverage

### Contribution Process

```bash
# 1. Fork and clone
git clone https://gitlab.bluefly.io/llm/openapi-ai-agents-standard.git
cd openapi-ai-agents-standard

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Make changes and validate
npm install
npm test

# 4. Commit and push
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature

# 5. Create merge request
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## Roadmap

### ✅ v0.1.0 - Initial Specification (Released)
- Core JSON Schema
- Basic agent types
- Runtime configurations
- Initial reference implementations

### ✅ v0.2.0 - Enhanced Compliance & Integration (Current)
- Extended compliance frameworks (ISO 42001, EU AI Act)
- MCP integration
- Enhanced reference implementations (51 agents)
- Comprehensive validation suite

### 🔄 v0.3.0 - Ecosystem Tooling (Planned)
- OSSA CLI for manifest generation
- Schema migration tools
- Certification test suite
- Community contribution templates

### 📅 v1.0.0 - Production Ready (Future)
- Stable specification freeze
- Complete reference implementation library
- Official certification program
- Enterprise support channels

---

## License

Apache 2.0 - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- **OpenAPI Initiative** - Standardization methodology and inspiration
- **CNCF** - Kubernetes ecosystem patterns
- **Anthropic** - Model Context Protocol (MCP) integration
- **Solo.io** - kagent Kubernetes-native agent concepts

---

## Links

- **GitLab Repository**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard
- **Documentation**: https://ossa.bluefly.io (GitLab Pages)
- **Issue Tracker**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues

---

**OSSA: The OpenAPI for AI Agents**

*A specification standard for composable, deployable, and compliant AI agent systems.*
