# OpenAPI AI Agents Standard

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](ROADMAP.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-orange.svg)](examples/basic/openapi.yaml)
[![Compliance](https://img.shields.io/badge/Compliance-Enterprise-red.svg)](docs/compliance.md)
[![Security](https://img.shields.io/badge/Security-MAESTRO-yellow.svg)](docs/security.md)

**Enterprise-grade standard for AI agent interoperability across all frameworks**

> Enable any AI agent to communicate with any other AI agent, regardless of framework or implementation, with enterprise-grade compliance, security, and governance.

## 🎯 What This Is

An **enterprise-grade open standard specification** that allows AI agents built with different frameworks (LangChain, CrewAI, AutoGen, custom implementations) to work together seamlessly through:

- **Standard API contracts** - OpenAPI 3.1 specifications with agent extensions
- **Agent configuration format** - Universal agent.yml structure with governance
- **Comprehensive validation** - Multi-framework compliance checking (ISO 42001, NIST AI RMF, EU AI Act)
- **Security framework** - MAESTRO threat modeling and security assessment
- **Protocol bridges** - MCP, A2A, and custom protocol support
- **Enterprise tooling** - CI/CD pipelines, compliance reporting, and quality gates

## 🚫 What This Is NOT

- ❌ An AI agent platform or framework
- ❌ A hosting or deployment solution  
- ❌ A specific implementation
- ❌ Competition with existing frameworks

## 🏗️ Architecture

### Dual-Format Standard with Enterprise Features

Every compliant agent consists of two files with enhanced enterprise capabilities:

```
my-agent/
├── agent.yml      # Agent metadata, capabilities, governance, compliance
└── openapi.yaml   # API endpoints, schemas, security, extensions
```

This separation enables:
- **Rich metadata** without cluttering API specs
- **Framework-specific configurations** alongside standard APIs
- **Independent validation** of both concerns
- **Clear separation** between what the agent *is* and what it *does*
- **Enterprise governance** with compliance tracking
- **Security assessment** with threat modeling

## 🚀 Quick Start

### 1. Validate an Existing Agent

```bash
# Clone the repository
git clone https://gitlab.bluefly.io/llm/openapi-ai-agents-standard.git
cd openapi-ai-agents-standard

# Install dependencies
npm run setup

# Start validation API
npm run dev:validation-api

# Test dual-format validation with example agent
curl -X POST http://localhost:3001/api/v1/validate/dual-format \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key" \
  -d '{
    "agent_config": { /* agent.yml content */ },
    "openapi_spec": { /* openapi.yaml content */ }
  }'
```

### 2. Create Your First Compliant Agent

```bash
# Copy enterprise templates
cp examples/basic/agent.yml my-agent/
cp examples/basic/openapi.yaml my-agent/

# Customize for your agent
vim my-agent/agent.yml     # Edit metadata, capabilities, and governance
vim my-agent/openapi.yaml  # Define your API endpoints and security

# Validate compliance
npm run compliance

# Generate compliance report
npm run report:compliance
```

### 3. Enterprise Integration

**Python**:
```python
from openapi_ai_agents import ValidationClient, ComplianceReporter

client = ValidationClient("http://localhost:3001")
result = client.validate_agent_bundle("./my-agent/")

if result.valid:
    print(f"✅ {result.certification_level} certification")
    print(f"📊 Compliance score: {result.overall_score}%")

# Generate compliance report
reporter = ComplianceReporter()
report = reporter.generate_report("./my-agent/")
```

**Node.js**:
```javascript
import { OpenAPIAgentsClient } from '@openapi-ai-agents/client';

const client = new OpenAPIAgentsClient({ baseURL: 'http://localhost:3001' });
const result = await client.validateAgentBundle('./my-agent/');

console.log(`Valid: ${result.valid}, Level: ${result.certification_level}`);
console.log(`Score: ${result.overall_score}%`);
```

## 📁 Project Structure

**⚠️ IMPORTANT: This project has a strict directory structure. See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete rules.**

```
openapi-ai-agents-standard/
├── README.md                    # This file
├── ROADMAP.md                   # Development roadmap
├── PROJECT_STRUCTURE.md         # Directory structure rules
├── package.json                 # Enhanced package with enterprise scripts
├── .gitlab-ci.yml              # Comprehensive CI/CD pipeline
├── 
├── examples/                    # Templates and examples
│   ├── basic/                   # Enterprise-ready templates
│   │   ├── agent.yml            # Universal agent template with governance
│   │   └── openapi.yaml         # OpenAPI template with extensions
│   └── agents/                  # Example implementations
│       └── crew-ai-agent/       # CrewAI integration example
│
├── services/                    # Validation and toolkit services
│   ├── validation-api/          # REST API for validation with compliance
│   ├── validation-cli/          # Command-line tools
│   ├── universal-agent-toolkit/ # Agent orchestration service
│   ├── agent-registry/          # Agent discovery service
│   └── agent-orchestrator/      # Multi-agent coordination
│
├── scripts/                     # Enterprise automation scripts
│   └── report-compliance.js     # Comprehensive compliance reporting
│
└── docs/                        # Comprehensive documentation
    ├── specification.md         # Detailed standard specification
    ├── integration-guide.md     # Framework integration guide
    ├── compliance.md            # Compliance and certification
    ├── security.md              # Security and MAESTRO framework
    └── governance.md            # Governance and risk management
```

**🚨 AI Bots: NEVER create random directories like `compliance-reports/`, `temp/`, or `ai-generated/`. Follow the structure guide exactly.**

## 🎯 Core Features

### 🔧 Enhanced Validation Services

**REST API** (`services/validation-api/`):
- **Dual-format validation** - Validates agent.yml ↔ openapi.yaml consistency
- **Multi-framework compliance** - ISO 42001, NIST AI RMF, EU AI Act, FISMA, FedRAMP, SOC2
- **Security assessment** - MAESTRO threat modeling and security validation
- **Quality gates** - Automated compliance checking and reporting
- **Token estimation** - Cost optimization with tiktoken integration

**CLI Tools** (`services/validation-cli/`):
- **Command-line validation** - Local compliance checking
- **Batch processing** - Bulk agent validation
- **CI/CD integration** - Automated quality gates
- **Compliance reporting** - Detailed framework analysis

### 📊 Enterprise Certification Levels

**Platinum** - Enterprise excellence (95%+)
- ✅ All Gold requirements
- ✅ Comprehensive governance framework
- ✅ Advanced security controls
- ✅ Full compliance validation
- ✅ Production deployment ready

**Gold** - Production ready (90%+)
- ✅ All Silver requirements
- ✅ Protocol bridge support
- ✅ Token management optimization
- ✅ Multi-framework compliance
- ✅ Security assessment passed

**Silver** - Enhanced features (80%+)
- ✅ All Bronze requirements
- ✅ Standard extensions included
- ✅ 5+ API endpoints defined
- ✅ Proper error handling
- ✅ Basic compliance validation

**Bronze** - Basic compliance (70%+)
- ✅ Valid agent.yml structure
- ✅ Basic OpenAPI 3.1 spec
- ✅ Security scheme defined
- ✅ Governance configuration
- ✅ Risk management processes

### 🌉 Advanced Protocol Bridges

- **MCP (Model Context Protocol)** - Tool and resource sharing
- **A2A (Agent-to-Agent)** - Direct agent communication
- **OpenAPI** - Standard REST API interactions
- **Custom protocols** - Framework-specific extensions

### 🛡️ Enterprise Governance & Compliance

- **ISO 42001:2023** - AI Management Systems
- **NIST AI RMF 1.0** - AI Risk Management Framework  
- **EU AI Act** - European AI regulations
- **FISMA** - Federal Information Security
- **FedRAMP** - Cloud security requirements
- **SOC2** - Trust service criteria
- **MAESTRO** - Security threat modeling

## 💡 Example Agents

### [CrewAI Agent](examples/agents/crew-ai-agent/)
**Framework**: CrewAI | **Level**: Silver  
Demonstrates hierarchical multi-agent coordination with role-based execution and compliance validation.

### [Agent Registry](services/agent-registry/)
**Framework**: Custom | **Level**: Gold  
Service for discovering and managing agents across frameworks with enterprise governance.

### [Agent Orchestrator](services/agent-orchestrator/)
**Framework**: Custom | **Level**: Gold  
Coordinates complex multi-agent workflows with parallel execution and compliance monitoring.

## 🔗 Framework Integration

### Supported Frameworks

| Framework | Status | Integration Guide | Compliance Level |
|-----------|--------|-------------------|------------------|
| **CrewAI** | ✅ Example Available | [View Example](examples/agents/crew-ai-agent/) | Silver |
| **LangChain** | 🔄 In Progress | [Integration Guide](docs/integration-guide.md) | Bronze |
| **AutoGen** | 📋 Planned | [Request Feature](https://github.com/openapi-ai-agents/standard/issues) | - |
| **Custom** | ✅ Template Available | [Basic Template](examples/basic/) | Bronze+ |

### For Framework Developers

Integrate the standard into your framework:

1. **Use our validation API** to check agent compliance
2. **Export agent.yml + openapi.yaml** from your framework
3. **Follow our templates** for consistent structure
4. **Implement protocol bridges** for interoperability
5. **Add governance controls** for enterprise adoption

See [Integration Guide](docs/integration-guide.md) for detailed instructions.

## 🧪 Development & Testing

### Run All Services Locally

```bash
# Start validation API
npm run dev:validation-api  # Port 3001

# Start agent toolkit  
npm run dev:toolkit         # Port 3002

# Run comprehensive tests
npm test

# Test compliance specifically
npm run test:compliance
```

### Enterprise Quality Gates

```bash
# Run all quality checks
npm run quality

# Strict quality gates (for main branch)
npm run quality:strict

# Security assessment
npm run security

# Compliance validation
npm run compliance

# Generate reports
npm run report:compliance
npm run report:security
npm run report:quality
```

### CI/CD Integration

```yaml
# .gitlab-ci.yml example (already included)
validate-agents:
  script:
    - npm install
    - npm test
    - npm run compliance
    - npm run security
    - npm run quality:strict
```

## 📚 Documentation

- **[Specification Guide](docs/specification.md)** - Detailed technical specification
- **[Integration Guide](docs/integration-guide.md)** - Framework integration instructions
- **[Compliance Guide](docs/compliance.md)** - Compliance and certification process
- **[Security Guide](docs/security.md)** - Security and MAESTRO framework
- **[Governance Guide](docs/governance.md)** - Governance and risk management
- **[API Documentation](services/validation-api/)** - REST API reference

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/my-feature`
3. **Follow the standard**: Validate your changes with `npm run compliance`
4. **Submit pull request**: Clear description of changes and compliance impact

### Contribution Areas

- **Framework integrations** - Add support for new frameworks
- **Validation improvements** - Enhance validation logic
- **Compliance frameworks** - Add new regulatory standards
- **Security enhancements** - Improve MAESTRO implementation
- **Documentation** - Improve guides and examples
- **Protocol bridges** - Implement new communication protocols

## 📈 Roadmap & Status

See [ROADMAP.md](ROADMAP.md) for:
- ✅ Completed features
- 🔄 Current priorities  
- 📋 Planned features
- 🎯 Release goals

**Current Status**: v0.2.0 - Enterprise compliance complete, ready for production adoption

## 🆘 Support

- **Issues**: [GitLab Issues](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues)
- **Discussions**: [GitHub Discussions](https://github.com/openapi-ai-agents/standard/discussions)
- **Email**: standards@openapi-ai-agents.org
- **Enterprise Support**: enterprise@openapi-ai-agents.org

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Made with ❤️ by the OpenAPI AI Agents Consortium**  
*Building the future of enterprise AI agent interoperability*