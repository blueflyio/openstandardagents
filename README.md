# OpenAPI AI Agents Standard

## Version 0.1.1

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://tools.ietf.org/html/bcp14) [RFC2119](https://tools.ietf.org/html/rfc2119) [RFC8174](https://tools.ietf.org/html/rfc8174) when, and only when, they appear in all capitals, as shown here.

This document is licensed under The Apache License, Version 2.0.

## Introduction

The OpenAPI AI Agents Standard (OAAS) is the "Switzerland of AI Agents" - a neutral, trusted, and necessary bridge between competing AI ecosystems. Unlike MCP (Anthropic) or A2A (Google) which compete for dominance, OAAS embraces all protocols while adding what enterprises actually need: **built-in compliance and governance**.

### Why OAAS Will Become THE Standard

1. **We Don't Compete, We Bridge**: Works WITH MCP, A2A, and other protocols through our bridge architecture
2. **Enterprise Compliance Built-In**: The ONLY standard with ISO 42001, NIST AI RMF, and EU AI Act validation
3. **OpenAPI Foundation**: Leverages 10+ million developers already familiar with OpenAPI
4. **Revenue Model**: Certification program ensures sustainability and enterprise adoption

An OpenAPI AI Agents Standard Description enables enterprises to achieve compliance, developers to ensure interoperability, and platforms to monetize through certification - making it not just the best standard, but the NECESSARY standard.

## Overview

The OpenAPI AI Agents Standard establishes a universal framework for AI agent interoperability across all frameworks and implementations. This specification defines:

- **Dual-format architecture** for agent definition and API specification
- **Compliance frameworks** for enterprise adoption (ISO 42001, NIST AI RMF, EU AI Act)
- **Security assessment** using the MAESTRO threat modeling framework
- **Certification levels** (Platinum, Gold, Silver, Bronze) based on compliance scores
- **Protocol bridges** for MCP, A2A, and custom protocol interoperability
- **Token management** with cost optimization and budget controls

## Architecture

### Dual-Format Standard

Every compliant AI agent MUST consist of two specification files:

```
agent-name/
├── agent.yml      # Agent metadata, capabilities, governance, compliance
└── openapi.yaml   # API endpoints, schemas, security, extensions
```

This separation enables:
- **Rich metadata** without cluttering API specifications
- **Framework-specific configurations** alongside standard APIs
- **Independent validation** of both concerns
- **Clear separation** between agent identity and capabilities
- **Enterprise governance** with compliance tracking
- **Security assessment** with threat modeling

### Agent Configuration (agent.yml)

The agent configuration file defines agent metadata, capabilities, and governance requirements. This file MUST conform to the OpenAPI AI Agents Standard schema and SHOULD include:

- Agent metadata (name, version, namespace)
- Capability definitions and protocols
- Security and compliance frameworks
- Token management configuration
- Governance and risk management settings

### OpenAPI Specification (openapi.yaml)

The OpenAPI specification file defines the agent's API interface. This file MUST conform to OpenAPI 3.1.0 and SHOULD include:

- Standard API endpoints for agent communication
- Request/response schemas and data structures
- Security schemes and authentication methods
- Standard extensions for agent metadata
- Protocol bridge configurations

## Compliance Frameworks

### Supported Standards

The OpenAPI AI Agents Standard provides validation against the following compliance frameworks:

| Framework | Version | Status | Description |
|-----------|---------|--------|-------------|
| **ISO 42001** | 2023 | Implemented | AI Management Systems |
| **NIST AI RMF** | 1.0 | Implemented | AI Risk Management Framework |
| **EU AI Act** | Current | Implemented | European AI regulations |
| **FISMA** | Current | Implemented | Federal Information Security |
| **FedRAMP** | Current | Implemented | Cloud security requirements |
| **SOC2** | Current | Implemented | Trust service criteria |

### Certification Levels

Compliance validation determines agent certification levels:

- **Platinum** (95%+): Enterprise excellence with comprehensive governance
- **Gold** (90%+): Production ready with advanced security controls
- **Silver** (80%+): Enhanced features with standard compliance
- **Bronze** (70%+): Basic compliance with core requirements

## Security Framework

### MAESTRO Threat Modeling

The standard implements the MAESTRO security framework for comprehensive threat assessment:

- **Model extraction** prevention and detection
- **Data poisoning** identification and mitigation
- **Prompt injection** protection and validation
- **Compliance violations** monitoring and reporting
- **Adversarial attacks** detection and response

### Security Requirements

All compliant agents MUST implement:

- Authentication mechanisms (OAuth2, API Key, mTLS)
- Input validation and sanitization
- Rate limiting and abuse prevention
- Audit logging for compliance
- Security scheme definitions in OpenAPI specifications

## Protocol Interoperability

### Supported Protocols

The standard supports multiple communication protocols:

- **OpenAPI** (REQUIRED): Standard REST API interactions
- **MCP** (RECOMMENDED): Model Context Protocol for tool sharing
- **A2A** (RECOMMENDED): Agent-to-Agent direct communication
- **Custom protocols** (OPTIONAL): Framework-specific extensions

### Protocol Bridges

Protocol bridges enable seamless communication between different protocols:

- Automatic protocol negotiation
- Translation between protocol formats
- Fallback mechanisms for compatibility
- Performance optimization for each protocol

## Implementation

### Validation Services

The standard provides comprehensive validation services:

- **REST API** (`/api/v1/validate/*`): Programmatic validation endpoints
- **CLI Tools**: Command-line validation and compliance checking
- **CI/CD Integration**: Automated quality gates and validation
- **Compliance Reporting**: Detailed framework analysis and scoring

### Quick Start

```bash
# Clone the repository
git clone https://gitlab.bluefly.io/llm/openapi-ai-agents-standard.git
cd openapi-ai-agents-standard

# Install dependencies
npm run setup

# Start validation API
npm run dev:validation-api

# Validate agent compliance
npm run compliance

# Generate compliance report
npm run report:compliance
```

### API Usage Examples

#### 1. Basic Agent Validation

```http
POST /api/v1/validate/dual-format
Content-Type: application/json
X-API-Key: your-api-key

{
  "agent_config": {
    "name": "code-review-agent",
    "version": "1.0.0",
    "class": "specialist",
    "capabilities": ["code_analysis", "security_scanning"],
    "protocols": ["openapi", "mcp"]
  },
  "openapi_spec": {
    "openapi": "3.1.0",
    "info": {
      "title": "Code Review Agent",
      "version": "1.0.0"
    },
    "paths": {
      "/analyze": {
        "post": {
          "summary": "Analyze code for issues",
          "operationId": "analyzeCode"
        }
      }
    }
  }
}
```

#### 2. Command-Line Validation

```bash
# Validate a single agent
openapi-agent-validate examples/basic/agent.yml

# Validate with compliance checking
openapi-agent-validate examples/basic/agent.yml --compliance NIST_AI_RMF

# Validate all agents in a directory
openapi-agent-validate examples/agents/ --recursive

# Generate compliance report
openapi-agent-validate examples/basic/agent.yml --report --output report.json
```

#### 3. Integration in CI/CD Pipeline

```yaml
# .gitlab-ci.yml
validate-agents:
  stage: test
  script:
    - npm install -g @openapi-ai-agents/cli
    - openapi-agent-validate agents/ --compliance ISO_42001_2023
    - openapi-agent-report --format junit > test-results.xml
  artifacts:
    reports:
      junit: test-results.xml
```

## Project Structure

**⚠️ IMPORTANT: This project has a strict directory structure. See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete rules.**

```
openapi-ai-agents-standard/
├── README.md                    # This specification document
├── PROJECT_STRUCTURE.md         # Directory structure rules
├── ROADMAP.md                   # Development roadmap
├── package.json                 # Package configuration
├── .gitlab-ci.yml              # CI/CD pipeline configuration
├── 
├── docs/                        # Specification documentation
│   ├── specification.md         # Detailed technical specification
│   ├── integration-guide.md     # Framework integration guide
│   ├── compliance.md            # Compliance and certification
│   ├── security.md              # Security and MAESTRO framework
│   └── governance.md            # Governance and risk management
│
├── examples/                    # Reference implementations
│   ├── basic/                   # Basic templates
│   │   ├── agent.yml            # Universal agent template
│   │   └── openapi.yaml         # OpenAPI template
│   └── agents/                  # Agent examples
│       └── crew-ai-agent/       # CrewAI integration example
│
├── services/                    # Core validation services
│   ├── validation-api/          # REST API for validation
│   ├── validation-cli/          # Command-line tools
│   ├── universal-agent-toolkit/ # Agent orchestration service
│   ├── agent-registry/          # Agent discovery service
│   └── agent-orchestrator/      # Multi-agent coordination
│
└── scripts/                     # Automation scripts
    └── report-compliance.js     # Compliance reporting
```

**🚨 AI Bots: NEVER create random directories like `compliance-reports/`, `temp/`, or `ai-generated/`. Follow the structure guide exactly.**

## Development

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Git for version control

### Local Development

```bash
# Install dependencies
npm install

# Run validation services
npm run dev:validation-api
npm run dev:toolkit

# Execute tests
npm test

# Validate compliance
npm run compliance

# Generate reports
npm run report:compliance
```

### Quality Gates

The standard implements comprehensive quality gates:

```bash
# Run all quality checks
npm run quality

# Strict quality gates (for main branch)
npm run quality:strict

# Security assessment
npm run security

# Compliance validation
npm run compliance
```

## Contributing

### Contribution Process

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/description`
3. **Follow the standard**: Validate changes with `npm run compliance`
4. **Submit pull request**: Clear description of changes and compliance impact

### Contribution Areas

- **Framework integrations**: Add support for new frameworks
- **Validation improvements**: Enhance validation logic
- **Compliance frameworks**: Add new regulatory standards
- **Security enhancements**: Improve MAESTRO implementation
- **Documentation**: Improve guides and examples
- **Protocol bridges**: Implement new communication protocols

### Code Standards

- Follow ESLint configuration
- Maintain 90%+ test coverage
- Use TypeScript for new code
- Follow OpenAPI 3.1 standards
- Include comprehensive documentation

## Support & Partnership Opportunities

### Documentation

- **[Technical Specification](docs/01-technical-specification.md)**: Core standard definition and compliance frameworks
- **[Integration Guide](docs/02-integration-guide.md)**: Framework integration with revenue opportunities
- **[Governance & Compliance](docs/03-governance-compliance.md)**: Enterprise governance and certification program
- **[Enterprise Integrations](docs/04-enterprise-integrations.md)**: Priority integration patterns (Salesforce→OpenAI, etc.)
- **[Project Structure](docs/05-project-structure.md)**: Repository organization and contribution guidelines
- **[Academic Papers](docs/06-academic-papers.md)**: Research publications and peer review strategy

### Partnership Programs

- **Enterprise Certification**: $10,000/year certification program
- **Consulting Partners**: Big 4 firm partnership opportunities
- **Tool Vendor Integration**: Add "Export as OAAS" to your platform
- **Training Partners**: Deliver $5,000 workshop programs

### Community

- **Issues**: [GitLab Issues](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues)
- **Discussions**: [GitHub Discussions](https://github.com/openapi-ai-agents/standard/discussions)
- **Partnership Inquiries**: partners@openapi-ai-agents.org
- **Enterprise Certification**: certification@openapi-ai-agents.org
- **General Support**: standards@openapi-ai-agents.org

## License

Apache License, Version 2.0 - see [LICENSE](LICENSE) for details.

---

**OpenAPI AI Agents Standard v0.1.1**  
*Building the future of enterprise AI agent interoperability*