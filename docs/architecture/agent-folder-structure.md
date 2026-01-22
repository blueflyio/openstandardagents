# Agent Folder Structure Standard

## Overview

This document defines the complete, standardized folder structure for OSSA agents following OpenAPI-first, API-first, Zod/Pydantic, CRUD, SOLID, and DRY principles.

## Complete Structure

```
.agents/
└── {agent-name}/
    ├── manifest.ossa.yaml          # SINGLE SOURCE OF TRUTH (OSSA manifest)
    ├── openapi.yaml                # OpenAPI 3.1 spec (generated from manifest)
    ├── zod-schemas.ts              # Zod schemas (TypeScript, generated from OpenAPI)
    ├── pydantic_models.py          # Pydantic models (Python, generated from OpenAPI)
    ├── api-client.ts               # TypeScript API client (generated from OpenAPI)
    ├── client.py                   # Python API client (generated from OpenAPI)
    │
    ├── prompts/                    # Prompt templates
    │   ├── system.txt              # System prompt
    │   ├── user-template.jinja2    # User prompt template
    │   └── examples/               # Example prompts
    │
    ├── tools/                      # Tool definitions (MCP-first)
    │   ├── tools.yaml              # Tool registry
    │   ├── mcp-servers.yaml        # MCP server configs
    │   ├── functions/              # Custom function implementations
    │   └── schemas/                # Tool input/output schemas
    │
    ├── skills/                     # Claude Skills (optional)
    │   └── {skill-name}/
    │       ├── SKILL.md
    │       └── resources/
    │
    ├── config/                     # Environment-specific configs
    │   ├── development.yaml
    │   ├── staging.yaml
    │   ├── production.yaml
    │   └── local.yaml
    │
    ├── api/                        # REST API implementation (CRUD)
    │   ├── routes.ts / routes.py   # API routes
    │   ├── controllers.ts / controllers.py  # Controllers (SOLID)
    │   ├── services.ts / services.py        # Business logic (SOLID)
    │   ├── repositories.ts / repositories.py # Data access (SOLID)
    │   └── middleware.ts / middleware.py    # Validation, auth, etc.
    │
    ├── src/                        # Source code
    │   ├── index.ts / __init__.py  # Entry point
    │   ├── adapters/                # LLM adapters (SOLID)
    │   │   ├── base.adapter.ts / base.py  # Base interface (SOLID)
    │   │   ├── anthropic.adapter.ts / anthropic.py
    │   │   ├── openai.adapter.ts / openai.py
    │   │   └── ...
    │   ├── runtime/                 # Runtime logic
    │   │   └── agent-runtime.ts / agent_runtime.py
    │   └── mcp/                    # MCP integration
    │       └── mcp-client.ts / mcp_client.py
    │
    ├── tests/                      # Tests (TDD)
    │   ├── unit/
    │   ├── integration/
    │   └── fixtures/
    │
    ├── docs/                       # Documentation
    │   ├── architecture.md
    │   ├── api.md                  # API documentation (from OpenAPI)
    │   └── ...
    │
    ├── docker/                     # Docker configs
    │   └── Dockerfile
    │
    ├── k8s/                        # Kubernetes manifests
    │   └── deployment.yaml
    │
    ├── package.json / pyproject.toml  # Dependencies
    ├── tsconfig.json               # TypeScript config (if TypeScript)
    ├── AGENTS.md                   # AAIF standard (code agent instructions)
    └── README.md                   # Human documentation
```

## File Purposes & Connections

### Core Files (Single Source of Truth)

1. **manifest.ossa.yaml** → **SINGLE SOURCE OF TRUTH**
   - Defines the agent completely
   - Used to generate all other files
   - Never manually edit generated files

2. **openapi.yaml** → Generated from manifest
   - OpenAPI 3.1 specification
   - Defines API contract
   - Used to generate clients and schemas

3. **zod-schemas.ts** (TypeScript) / **pydantic_models.py** (Python) → Generated from OpenAPI
   - Runtime validation schemas
   - Type-safe models
   - Used by API routes and controllers

4. **api-client.ts** (TypeScript) / **client.py** (Python) → Generated from OpenAPI
   - Type-safe API client
   - Auto-generated from OpenAPI spec
   - Never manually edit

### Generation Pipeline

```
manifest.ossa.yaml
    ↓ (ossa generate openapi)
openapi.yaml
    ↓ (ossa generate zod / ossa generate pydantic)
zod-schemas.ts / pydantic_models.py
    ↓ (ossa generate client)
api-client.ts / client.py
    ↓ (used by)
api/routes.ts / api/routes.py
api/controllers.ts / api/controllers.py
```

## Principles

### OpenAPI-First
- Define OpenAPI spec BEFORE implementation
- Generate code from OpenAPI (not hand-write)
- OpenAPI is single source of truth for APIs

### API-First
- RESTful APIs for all operations
- CRUD operations for agents
- Type-safe clients generated

### Zod/Pydantic Validation
- All inputs validated with Zod (TypeScript) or Pydantic (Python)
- Schemas generated from OpenAPI
- Runtime type safety

### CRUD Operations
- Complete Create, Read, Update, Delete
- Consistent API patterns
- Proper HTTP status codes

### SOLID Principles
- **Single Responsibility**: Each file has one purpose
- **Dependency Injection**: Controllers → Services → Repositories
- **Interface Segregation**: Base adapter interface, tool interfaces
- **Open/Closed**: Extend via adapters, not modify core
- **DRY**: Single source of truth (manifest), generated code

### DRY Architecture
- Manifest is single source of truth
- All code generated from manifest/OpenAPI
- Zero duplication
- Reusable components

## Usage

### TypeScript

```bash
# Create folder structure
ossa scaffold my-agent --with-structure

# Or use wizard
ossa wizard
# Select "Create complete folder structure" when prompted

# Generate OpenAPI (Phase 2)
ossa generate openapi manifest.ossa.yaml

# Generate Zod schemas (Phase 2)
ossa generate zod openapi.yaml

# Generate API client (Phase 2)
ossa generate client openapi.yaml
```

### Python

```bash
# Create folder structure
ossa scaffold my-agent --base-path .agents

# Or use wizard (Phase 4)
ossa wizard

# Generate OpenAPI (Phase 2)
ossa generate openapi manifest.ossa.yaml

# Generate Pydantic models (Phase 2)
ossa generate pydantic openapi.yaml

# Generate API client (Phase 2)
ossa generate client openapi.yaml
```

## Validation

```bash
# Validate folder structure
ossa validate --structure .agents/my-agent

# Check for missing files/directories
ossa structure validate .agents/my-agent
```

## Next Steps

- Phase 2: OpenAPI generation pipeline
- Phase 3: CRUD API implementation
- Phase 4: Enhanced wizard with all steps
- Phase 5: Python SDK & buildkit
