# OSSA - Open Standards for Scalable Agents

[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-orange.svg)](src/api/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Overview

OSSA (Open Standards for Scalable Agents) is a comprehensive specification standard for building interoperable, scalable AI agent systems. It provides standardized protocols, schemas, and patterns that enable agents to discover, communicate, and orchestrate seamlessly across different frameworks and platforms.

**Current Version:** 0.1.9  
**Status:** Specification Standard  
**Implementation:** Available in [agent-buildkit](https://gitlab.bluefly.io/llm/agent_buildkit)

## What OSSA Provides

### ✅ Core Specifications
- **OpenAPI 3.1 Schemas**: Complete API specifications in `src/api/`
- **Agent Manifest Schema**: JSON Schema for agent definitions
- **Registry Protocol**: Standardized agent discovery and registration
- **Orchestration Patterns**: Workflow and coordination specifications
- **Compliance Framework**: Governance and security standards

### ✅ Agent Registry
The `.agents/` directory contains 50+ pre-defined agent specifications including:
- **Workers**: Data processing, API integration, security scanning
- **Orchestrators**: Workflow management, resource allocation  
- **Critics**: Code review, quality assessment, compliance checking
- **Monitors**: System monitoring, performance tracking
- **Specialists**: Domain-specific agents (ML, DevOps, Security)

### ✅ Development Tools
- **TypeScript Types**: Generated from OpenAPI specifications
- **CLI Commands**: Agent management and validation tools
- **Docker Support**: MCP server containerization
- **Validation Tools**: Schema and compliance checking

## Project Structure

```
ossa/
├── .agents/                    # 50+ Agent Specifications
│   ├── workers/               # Task execution agents
│   ├── orchestrators/         # Coordination agents  
│   ├── critics/               # Quality control agents
│   ├── monitors/              # Observability agents
│   └── registry.yml           # Agent registry
├── src/
│   ├── api/                   # OpenAPI 3.1 Specifications
│   │   ├── specification.openapi.yml
│   │   ├── agent-manifest.schema.json
│   │   └── orchestration.openapi.yml
│   ├── mcp/                   # MCP Server Implementation
│   ├── cli/                   # Command Line Tools
│   ├── core/                  # Core orchestration logic
│   └── types/                 # TypeScript definitions
├── docs/                      # Comprehensive documentation
└── examples/                  # Integration examples
```

## Installation & Usage

### Prerequisites
- Node.js >= 18.0.0
- TypeScript >= 5.3.0

### Install Dependencies
```bash
npm install
```

### Build Project
```bash
npm run build
```

### Validate Specifications
```bash
npm run api:validate
```

### Run Tests
```bash
npm test
```

## API Specifications

OSSA provides comprehensive OpenAPI 3.1 specifications:

### Core APIs
- `specification.openapi.yml` - Main OSSA API
- `orchestration.openapi.yml` - Workflow orchestration
- `agent-manifest.schema.json` - Agent definition schema

### Specialized APIs
- `acdl-specification.yml` - Agent Communication Definition Language
- `voice-agent-specification.yml` - Voice agent protocols
- `mcp-infrastructure.openapi.yml` - MCP server specifications

## Agent Types

| Type | Purpose | Examples in `.agents/` |
|------|---------|------------------------|
| **Worker** | Task Execution | `rest-api-implementer`, `security-scanner`, `audit-logger` |
| **Orchestrator** | Coordination | `kubernetes-orchestrator`, `mlops-pipeline-architect` |
| **Critic** | Quality Control | `code-reviewer`, `compliance-auditor` |
| **Monitor** | Observability | `system-monitor`, `prometheus-metrics-specialist` |

## MCP Server

OSSA includes an MCP (Model Context Protocol) server implementation:

```bash
# Start MCP server
node src/mcp/simple-server.ts

# Or using Docker
docker-compose up ossa-mcp
```

**Available on ports:**
- 4000: HTTP/REST API
- 4001: WebSocket transport  
- 4002: SSE transport

## Development

### Validate All Schemas
```bash
npm run validate:specs
```

### Generate TypeScript Types
```bash
npm run api:generate
```

### Lint Code
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **Architecture**: `docs/05-architecture.md`
- **API Reference**: `docs/02-api.md`
- **Best Practices**: `docs/04-best-practices.md`
- **Deployment**: `docs/06-deployment.md`
- **Security**: `docs/08-security-compliance.md`

## Repository

- **GitLab**: [gitlab.bluefly.io/llm/openapi-ai-agents-standard](https://gitlab.bluefly.io/llm/openapi-ai-agents-standard)
- **Implementation**: [gitlab.bluefly.io/llm/agent_buildkit](https://gitlab.bluefly.io/llm/agent_buildkit)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a merge request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## What We Don't Provide

❌ Running services on ports 4021-4040  
❌ Production agent deployments  
❌ Live API endpoints  
❌ Mock implementations presented as working services  

OSSA is a **specification standard** - implementation is available in the agent-buildkit project.

---

**OSSA** - Enabling seamless AI agent interoperability through open standards.