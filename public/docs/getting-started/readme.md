# OSSA - Open Standards for Scalable Agents

[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-orange.svg)](src/api/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18-green.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Production Ready](https://img.shields.io/badge/Production-Ready-brightgreen.svg)](docs/)

## 🚀 Complete OpenAPI 3.1 Implementation

OSSA (Open Standards for Scalable Agents) is now a **complete, production-ready OpenAPI 3.1 specification** with full TypeScript implementation, including:

- ✅ **Complete OpenAPI 3.1 API** with advanced features (webhooks, discriminators, JSON Schema Draft 2020-12)
- ✅ **Production Express Server** with comprehensive middleware, validation, and monitoring  
- ✅ **TypeScript CLI Tools** with full CRUD operations replacing all shell scripts
- ✅ **Auto-generated API Client** from OpenAPI 3.1 specification
- ✅ **Interactive Swagger Documentation** with OAuth 2.1 authentication
- ✅ **Real-time Agent Execution** with WebSocket support and SSE
- ✅ **Comprehensive Validation** using Zod schemas and express-validator

**Current Version:** 0.1.9  
**Status:** Production Ready  
**Full Stack:** TypeScript + Express + OpenAPI 3.1 + Swagger UI

## 🎯 What OSSA Provides

### ✅ Complete OpenAPI 3.1 API Server
- **Production Express Server**: Full REST API with advanced middleware
- **OpenAPI 3.1 Compliance**: Webhooks, discriminators, JSON Schema Draft 2020-12
- **Interactive Documentation**: Swagger UI with OAuth 2.1 authentication
- **Real-time Features**: WebSocket support, Server-Sent Events
- **Comprehensive Validation**: Request/response validation with detailed error messages
- **Security**: Helmet, CORS, rate limiting, JWT authentication
- **Monitoring**: Health checks, metrics collection, audit logging

### ✅ Advanced OpenAPI 3.1 Features Demonstrated
- **Polymorphic Schemas**: Discriminator mapping for agent type inheritance
- **Webhooks**: Event-driven notifications for agent lifecycle events  
- **JSON Patch**: RFC 6902 compliant partial updates
- **Content Encoding**: Binary data support with multipart/form-data
- **OAuth 2.1 with PKCE**: Modern security with authorization code flow
- **Server-Sent Events**: Real-time execution progress streaming
- **Complex Validation**: Conditional schemas with if/then/else logic
- **Examples with External References**: Rich documentation with real examples

### ✅ TypeScript CLI Tools (Zero Shell Scripts)
- **OSSA CLI (`ossa`)**: Complete CRUD operations for specifications and agents
- **Agent Deployment CLI (`ossa-deploy`)**: Advanced agent lifecycle management  
- **Template-Based Creation**: Industrial, Advanced, and Basic API templates
- **Validation Pipeline**: Schema validation with auto-fix capabilities
- **Build System**: TypeScript compilation with type generation
- **Migration Tools**: Seamless OpenAPI version migration

### ✅ Agent Registry & Discovery
The `.agents/` directory contains 50+ pre-defined agent specifications including:
- **Workers**: Data processing, API integration, security scanning
- **Orchestrators**: Workflow management, resource allocation  
- **Critics**: Code review, quality assessment, compliance checking
- **Judges**: Decision-making agents with consensus algorithms
- **Monitors**: System monitoring, performance tracking, alerting
- **Governors**: Policy enforcement, compliance automation

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

### 🚀 Quick Start

#### 1. Install Dependencies & Build
```bash
npm install
npm run build:all
npm link  # Install CLI tools globally
```

#### 2. Start the Production Server
```bash
# Development with hot reload
npm run start:dev

# Production mode
npm run start:prod

# Health check
npm run server:health
```

#### 3. Explore the API
```bash
# Open interactive documentation
npm run server:docs
# Or visit: http://localhost:3000/docs

# View OpenAPI 3.1 specification
curl http://localhost:3000/api/openapi.yaml
```

#### 4. Use the CLI Tools
```bash
# Check system status
ossa status --detailed

# Create OpenAPI 3.1 specifications with templates
ossa spec create my-api --template industrial --description "Industrial IoT API"
ossa spec create advanced-api --template advanced --description "Advanced API with webhooks"

# Create and manage agents
ossa agent create data-worker --type worker --specialization data-processing
ossa agent create workflow-master --type orchestrator --capabilities "orchestration,monitoring"

# Validate everything
ossa validate --all --fix --verbose

# Deploy agents with parallel execution
ossa-deploy deploy --all --parallel --environment production
```

#### 5. API Client Usage
```typescript
// Auto-generated TypeScript client
import { paths } from './src/types/api-client';

// Type-safe API calls
const response = await fetch('/api/v1/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'worker',
    name: 'My Agent',
    capabilities: ['data-processing']
  })
});
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

- **GitLab**: [app-4001.cloud.bluefly.io/llm/openapi-ai-agents-standard](https://app-4001.cloud.bluefly.io/llm/openapi-ai-agents-standard)
- **Implementation**: [app-4001.cloud.bluefly.io/llm/agent_buildkit](https://app-4001.cloud.bluefly.io/llm/agent_buildkit)

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