# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## OSSA (Open Standards for Scalable Agents) v0.1.8

This is the reference implementation of the OSSA specification - an API-first, production-ready multi-agent orchestration platform focused on enterprise-grade compliance and interoperability.

## Critical Architecture Principles

### API-First Development
- **OpenAPI 3.1 is the single source of truth** - All implementations must derive from OpenAPI specs
- **No stub implementations** - All features must be fully working, not mocked
- **Contract-first approach** - Define API contracts before implementation
- Located at: `src/api/openapi.yaml` (main), `.agents/*/openapi.yaml` (per agent)

### Agent Structure (OSSA v0.1.8 Compliant)
All agents MUST follow this exact structure:
```
.agents/agent-name/
├── agent.yml           # Agent metadata and configuration
├── openapi.yaml        # OpenAPI 3.1 specification (REQUIRED)
├── config/
│   └── agent.json      # Runtime configuration
├── handlers/           # Request handlers
├── schemas/            # JSON Schema definitions
├── behaviors/          # Behavioral modules
├── integrations/       # Framework integrations (MCP, LangChain, etc)
├── data/              # Agent-specific data
├── training-modules/   # Training data and modules
└── _roadmap/          # Agent-specific roadmap
    ├── roadmap.md
    └── roadmap_meta.json
```

### Service Architecture
The platform consists of 5 independent microservices:
- **API Gateway** (port 3001) - Central routing and authentication
- **Validation Service** (port 3003) - OSSA compliance validation  
- **Orchestration Service** (port 3002) - Multi-agent coordination
- **Discovery Service** (port 3004) - Agent discovery and registry
- **Monitoring Service** (port 3005) - Health checks and metrics

## Essential Development Commands

### Building and Running
```bash
# Build the CLI (required before first run)
npm run build

# Run the complete test suite
npm test

# Run specific test categories
npm run test:unit
npm run test:api
npm run test:cli
npm run test:integration
npm run test:e2e

# Run performance tests (long-running)
npm run test:performance

# Development mode (uses tsx for TypeScript execution)
npm run dev
```

### CLI Commands (after building)
```bash
# Validate OSSA compliance
./src/cli/bin/ossa validate [agent-path]

# Start the validation server
./src/cli/bin/ossa serve

# Agent management
npx tsx src/cli/src/index.ts agents list
npx tsx src/cli/src/index.ts agents create -n "agent-name"
npx tsx src/cli/src/index.ts agents validate [path]

# Service management  
npx tsx src/cli/src/index.ts services status
npx tsx src/cli/src/index.ts services health
npx tsx src/cli/src/index.ts services start
npx tsx src/cli/src/index.ts services stop
```

### API Development Workflow
```bash
# Validate OpenAPI specification
npm run api:validate

# Generate TypeScript types from OpenAPI
npm run api:generate

# Generate API documentation
npm run api:docs

# Start services for development
npm run services:start:dev

# Check service logs
npm run services:logs
```

### Testing Specific Components
```bash
# E2E Test Suite
npm run test:e2e:lifecycle      # Eight-phase lifecycle tests
npm run test:e2e:coordination   # Multi-agent coordination tests
npm run test:e2e:compliance     # OSSA compliance validation tests

# Performance Testing
npm run test:performance:orchestration  # Orchestration overhead tests
npm run test:performance:tokens         # Token reduction tests
npm run test:performance:discovery      # Agent discovery tests
npm run performance:validate            # Full performance suite
```

## Project Structure

### Core Directories
- `/src/cli/` - CLI implementation (workspace package)
- `/src/api/` - API specifications and server implementations
- `/src/lib/` - Shared libraries and utilities
- `/tests/` - Comprehensive test suites
- `/.agents/` - OSSA-compliant agent definitions
- `/infrastructure/` - Docker, Kubernetes, and deployment configs
- `/docs/` - Documentation and specifications

### Key Configuration Files
- `package.json` - Root package with workspace configuration
- `src/cli/package.json` - CLI-specific dependencies
- `vitest.config.ts` - Test runner configuration
- `vitest.e2e.config.ts` - E2E test configuration
- `.gitlab-ci.yml` - CI/CD pipeline configuration

## Working with Agents

### Creating New Agents
Always use the CLI to ensure OSSA compliance:
```bash
npx tsx src/cli/src/index.ts agents create -n "agent-name" -t api-first
```

### Validating Agents
```bash
# Single agent
npx tsx src/cli/src/index.ts agents validate .agents/agent-name

# All agents
npx tsx src/cli/src/index.ts agents validate .agents/
```

### Migration from OSSA v0.1.2
```bash
# Migrate legacy agents
npx tsx src/cli/src/index.ts migrate legacy .agents/old-agent

# Validate migration
npx tsx src/cli/src/index.ts migrate validate .agents/migrated-agent
```

## Important Implementation Notes

### TypeScript Configuration
- **ES Modules only** - Use `type: "module"` in package.json
- **Node 18+ required** - Uses native ESM support
- **Strict typing** - All code must pass TypeScript strict mode

### Testing Requirements
- **Minimum 80% coverage** required for all components
- **E2E tests** validate complete workflows
- **Performance benchmarks** ensure <100ms orchestration overhead
- **Retry logic** built into test configuration (2 retries)

### Framework Integrations
Supported frameworks with validated integration patterns:
- **MCP (Model Context Protocol)** - Anthropic's standard
- **LangChain** - Via REST API adapter
- **CrewAI** - Native OSSA support
- **AutoGen** - OpenAI agent framework
- **Llamaindex** - Document processing pipeline

### Compliance Standards
- **OSSA v0.1.8** - Full specification compliance required
- **OpenAPI 3.1** - All APIs must have valid OpenAPI specs
- **JSON Schema Draft 07** - For configuration validation
- **GraphQL** - Alternative API protocol support
- **gRPC** - High-performance service communication

## Critical Warnings

### Never Create Stub Implementations
All code must be fully functional. No placeholders, mocks, or "TODO" implementations in production code.

### Always Validate Before Deployment
```bash
npm run validate
npm run test:e2e:compliance
```

### Maintain Version Consistency
The project uses semantic versioning. Current version is 0.1.8+rev2.
Update versions consistently across all package.json files.

### Service Dependencies
Services must start in order:
1. Redis (if using Docker)
2. API Gateway
3. Validation Service
4. Discovery Service
5. Orchestration Service
6. Monitoring Service

## Common Troubleshooting

### Build Failures
```bash
# Clean and rebuild
npm run clean
npm run build
```

### Service Connection Issues
```bash
# Check service health
npm run services:status
npm run services:health

# Restart services
npm run services:stop
npm run services:start:dev
```

### Test Failures
```bash
# Run with verbose output
npm run test -- --reporter=verbose

# Run specific test file
npx vitest run tests/unit/specific-test.test.ts
```

## Development Philosophy

This codebase follows the "Golden Standard" architecture pattern:
- **API-first** - OpenAPI drives implementation
- **Test-driven** - Tests written before code  
- **Microservices** - Independent, scalable services
- **Type-safe** - Full TypeScript with strict mode
- **Production-ready** - No stubs, all features working
- **Compliant** - Adheres to OSSA v0.1.8 specification