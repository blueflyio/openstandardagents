# OSSA API Specifications

This directory contains all OpenAPI specifications and schemas for the OSSA (Open Standards for Scalable Agents) project.

## Directory Structure

### `/core/` - Core OSSA Specifications
- **`ossa-v0.1.9-complete.openapi.yml`** - Complete OSSA v0.1.9 specification (latest)
- **`ossa-complete.openapi.yml`** - Previous complete OSSA specification
- **`specification.openapi.yml`** - Core OSSA specification
- **`openapi.yml`** - Main API specification

### `/mcp/` - Model Context Protocol Specifications
- **`context7-mcp.openapi.yml`** - Context7 MCP implementation
- **`magic-mcp.openapi.yml`** - Magic MCP implementation
- **`mcp-infrastructure.openapi.yml`** - MCP infrastructure specification
- **`web-eval-mcp.openapi.yml`** - Web evaluation MCP implementation

### `/schemas/` - JSON Schemas
- **`agent-manifest.schema.json`** - Agent manifest JSON schema
- **`agent-worktree-schema.json`** - Agent worktree JSON schema
- **`workflow.schema.json`** - Workflow JSON schema

### `/project/` - Project & Architecture Specifications
- **`clean-architecture.openapi.yml`** - Clean architecture patterns
- **`orchestration.openapi.yml`** - Orchestration API specification
- **`project-discovery.openapi.yml`** - Project discovery specification
- **`rebuild-audit.openapi.yml`** - Rebuild audit specification

### `/legacy/` - Legacy & Specialized Specifications
- **`acdl-specification.yml`** - ACDL (Agent Communication Description Language)
- **`voice-agent-specification.yml`** - Voice agent specification
- **`test-api.openapi.yml`** - Test API specification

### `/config/` - Configuration Files
- **`openapi.redoc.config.json`** - ReDoc configuration for documentation

## Usage

### Primary Specification
For new implementations, use:
```
core/ossa-v0.1.9-complete.openapi.yml
```

### Validation
All specifications can be validated using the OSSA CLI:
```bash
ossa validate openapi path/to/spec.yml --ossa-version 0.1.9
```

### Documentation Generation
Generate documentation using ReDoc:
```bash
npx @redocly/cli build-docs core/ossa-v0.1.9-complete.openapi.yml
```

## Standards

- All OpenAPI specifications follow OpenAPI 3.1.0
- OSSA specifications include `x-ossa` extension field
- Conformance levels: bronze, silver, gold
- All specs include proper security schemes