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

### Build CLI Tools
```bash
npm run build:cli
```

### Global CLI Installation
```bash
npm link
# Now you can use 'ossa' and 'ossa-deploy' commands globally
```

### Quick Start Commands
```bash
# Check system status
ossa status

# Create a new OpenAPI 3.1 specification
ossa spec create my-api --type advanced --description "My OpenAPI 3.1 API"

# Create a new agent
ossa agent create my-worker --type worker --capabilities "data-processing,validation"

# Validate all specifications and agents
ossa validate --all --fix

# Build all specifications
ossa build --all

# Deploy agents
ossa-deploy deploy --all --parallel
```

### Traditional npm Scripts (Still Available)
```bash
npm run build          # Build TypeScript
npm run api:validate   # Validate OpenAPI specs
npm run validate:specs # Validate all schemas
npm test              # Run tests
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

## OSSA CLI Commands

OSSA provides two main CLI tools for comprehensive specification and agent management:

### Specification Management (`ossa`)
```bash
# CRUD Operations for OpenAPI 3.1 Specifications
ossa spec create <name> [options]     # Create new spec with templates
ossa spec list --format table         # List all specifications
ossa spec get <name> --format yaml    # Get specification details
ossa spec update <name> [options]     # Update existing specification
ossa spec delete <name> --force       # Delete specification

# Agent Management
ossa agent create <id> --type worker  # Create new agent
ossa agent list --status active       # List agents with filters
ossa agent update <id> [options]      # Update agent configuration
ossa agent delete <id> --force        # Delete agent

# System Operations
ossa validate --all --fix             # Validate and auto-fix issues
ossa build --all --watch              # Build with file watching
ossa deploy --environment prod        # Deploy to environments
ossa test --coverage                  # Run comprehensive tests
ossa status --detailed                # Show system health
ossa migrate --from 3.0               # Migrate from older OpenAPI versions
```

### Agent Deployment (`ossa-deploy`)
```bash
# Agent Lifecycle Management
ossa-deploy create <agent> [options]  # Create agent with deployment config
ossa-deploy list --filter type        # List agents with filtering
ossa-deploy deploy --phase 1          # Deploy specific phases
ossa-deploy deploy --all --parallel   # Deploy all agents in parallel
ossa-deploy validate <agent> --schema # Validate agent against schema
ossa-deploy status --detailed         # Show deployment status
```

### Template-Based Creation
```bash
# OpenAPI 3.1 Templates
ossa spec create basic-api --template basic      # Simple API
ossa spec create advanced-api --template advanced # Full-featured API  
ossa spec create industrial-api --template industrial # OPC UA/UADP ready

# Agent Templates by Type
ossa agent create data-worker --type worker --specialization data-processing
ossa agent create flow-orchestrator --type orchestrator --capabilities workflow
ossa agent create quality-critic --type critic --capabilities code-review
```

## MCP Server

OSSA includes an MCP (Model Context Protocol) server implementation:

```bash
# Start MCP server using CLI
ossa deploy --service mcp --port 4000

# Or using Docker
docker-compose up ossa-mcp

# Or direct Node.js (development only)
node dist/mcp/simple-server.js
```

**Available on ports:**
- 4000: HTTP/REST API
- 4001: WebSocket transport  
- 4002: SSE transport

## Development

### Modern CLI-First Development
```bash
# Complete validation pipeline
ossa validate --all --fix --verbose

# Build and watch for changes
ossa build --all --watch --output dist

# Development server with hot reload
ossa deploy --environment dev --watch

# Generate TypeScript types from OpenAPI 3.1
ossa build --generate-types --spec my-api
```

### Legacy npm Scripts (Deprecated)
```bash
npm run validate:specs  # Use: ossa validate --all
npm run api:generate   # Use: ossa build --generate-types
npm run lint          # Use: ossa validate --lint
npm run format        # Use: ossa validate --fix --format
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