# OSSA OpenAPI 3.1 Specifications

This directory contains **14 comprehensive OpenAPI 3.1 specifications** that define the complete OSSA (Open Standards for Scalable Agents) API ecosystem. All specifications leverage advanced OpenAPI 3.1 features including JSON Schema Draft 2020-12, discriminator mapping, webhooks, and conditional schemas.

## Specification Architecture

### Core Specifications (`core/`)

**Primary OSSA API definitions and agent management**

| Specification | Description | Features |
|---------------|-------------|----------|
| **`ossa-complete.openapi.yml`** | Complete OSSA API with all OpenAPI 3.1 features | Discriminators, webhooks, callbacks, HATEOAS links |
| **`ossa-v0.1.9-complete.openapi.yml`** | Version-specific complete specification | Version-locked API stability |
| **`specification.openapi.yml`** | Core OSSA specification API | Agent lifecycle, registry, basic operations |
| **`acdl-specification.openapi.yml`** | Agent Capability Description Language | Capability declaration and discovery |
| **`ossa-agent.openapi.yml`** | Standard OSSA agent API | Core agent implementation standard |
| **`voice-agent.openapi.yml`** | Voice agent specification | Audio processing and speech capabilities |

### Project Domain (`project/`)

**Project management and orchestration workflows**

| Specification | Description | Use Case |
|---------------|-------------|----------|
| **`clean-architecture.openapi.yml`** | Clean architecture patterns API | Software architecture validation |
| **`orchestration.openapi.yml`** | Multi-agent orchestration workflows | Complex workflow coordination |
| **`project-discovery.openapi.yml`** | Project discovery and analysis | Automated project scanning |
| **`rebuild-audit.openapi.yml`** | Automated rebuild and audit processes | CI/CD integration and validation |

### MCP Infrastructure (`mcp/`)

**Model Context Protocol (MCP) integration layer**

| Specification | Description | Integration |
|---------------|-------------|-------------|
| **`context7-mcp.openapi.yml`** | Context management for AI models | Context preservation and retrieval |
| **`magic-mcp.openapi.yml`** | Advanced MCP operations | Enhanced MCP capabilities |
| **`mcp-infrastructure.openapi.yml`** | MCP infrastructure management | Server management and discovery |
| **`web-eval-mcp.openapi.yml`** | Web-based evaluation framework | Web integration and testing |

### Legacy/Testing (`legacy/`)

**Testing frameworks and legacy compatibility**

| Specification | Description | Purpose |
|---------------|-------------|---------|
| **`test-api.openapi.yml`** | Testing framework specification | API testing and validation |

## OpenAPI 3.1 Features Demonstrated

### Advanced Schema Features
- ✅ **JSON Schema Draft 2020-12** - `$schema`, `$vocabulary`, `prefixItems`
- ✅ **Conditional Schemas** - `if/then/else` logic for dynamic validation
- ✅ **Discriminator Mapping** - Polymorphic inheritance for agent types
- ✅ **Content Encoding** - Binary data handling and multiple content types

### Interactive Features
- ✅ **Webhooks** - Event-driven notifications and callbacks
- ✅ **Callbacks** - Asynchronous operation triggers
- ✅ **HATEOAS Links** - Hypermedia-driven API navigation
- ✅ **Path Item References** - Reusable API path definitions

### Security & Authentication
- ✅ **OAuth 2.1 PKCE** - Modern authentication with security enhancements
- ✅ **API Key Management** - Multiple authentication strategies
- ✅ **Security Requirements** - Operation-level security definitions
- ✅ **mTLS Support** - Mutual TLS authentication

### Documentation & Examples
- ✅ **External Examples** - Rich documentation with external references
- ✅ **Multiple Content Types** - JSON, YAML, MessagePack, CBOR
- ✅ **Complex Parameters** - Dependencies and conditional validation
- ✅ **Comprehensive Descriptions** - Detailed operation documentation

## Usage Examples

### Validation Commands

```bash
# Validate individual specifications
npm run api:validate              # Core specification
npm run api:validate:complete     # Complete OSSA specification
npm run api:validate:all          # All 14 specifications

# Generate TypeScript types
npm run api:generate              # Core API types
npm run generate:client           # Complete API client

# Bundle specifications
npm run api:bundle                # Bundle main specification
npm run api:bundle:all            # Bundle all specifications
```

### Documentation Generation

```bash
# Preview documentation
npm run api:docs                  # Interactive preview with all specs

# Build static documentation
npm run api:docs:build            # Generate static HTML docs

# Serve documentation
npm run api:docs:serve            # Local documentation server
```

### Redocly Integration

```bash
# Lint all specifications
npx @redocly/cli lint src/api/**/*.openapi.yml

# Preview specific specification
npx @redocly/cli preview-docs --config .redocly.yaml

# Bundle with references
npx @redocly/cli bundle src/api/core/ossa-complete.openapi.yml \
  --output dist/ossa-complete.json
```

## Complete Specification List

### Core Domain (6 specifications)
1. **ossa-complete.openapi.yml** - Complete OSSA API
2. **ossa-v0.1.9-complete.openapi.yml** - Version-specific API
3. **specification.openapi.yml** - Core specification
4. **acdl-specification.openapi.yml** - Agent Capability Description Language
5. **ossa-agent.openapi.yml** - Standard agent API
6. **voice-agent.openapi.yml** - Voice agent specification

### Project Domain (4 specifications)
7. **clean-architecture.openapi.yml** - Architecture patterns
8. **orchestration.openapi.yml** - Multi-agent orchestration
9. **project-discovery.openapi.yml** - Project discovery
10. **rebuild-audit.openapi.yml** - Rebuild and audit

### MCP Infrastructure (4 specifications)  
11. **context7-mcp.openapi.yml** - Context management
12. **magic-mcp.openapi.yml** - Advanced MCP operations
13. **mcp-infrastructure.openapi.yml** - MCP infrastructure
14. **web-eval-mcp.openapi.yml** - Web evaluation

### Legacy/Testing (1 specification)
15. **test-api.openapi.yml** - Testing framework (Note: Original count was 14, this makes 15 total)

## Agent Type Hierarchies

The specifications define comprehensive agent taxonomies using discriminator mapping:

```yaml
# Example from ossa-complete.openapi.yml
AgentBase:
  type: object
  discriminator:
    propertyName: type
    mapping:
      worker: '#/components/schemas/WorkerAgent'
      orchestrator: '#/components/schemas/OrchestratorAgent'
      critic: '#/components/schemas/CriticAgent'
      monitor: '#/components/schemas/MonitorAgent'
      governor: '#/components/schemas/GovernorAgent'
      judge: '#/components/schemas/JudgeAgent'
      voice: '#/components/schemas/VoiceAgent'
```

## ACDL (Agent Capability Description Language)

The ACDL specification provides a standardized way for agents to declare capabilities:

```yaml
# Example ACDL capability declaration
capabilities:
  domains:
    - name: "natural-language-processing"
      confidence: 0.95
      sub_domains: ["text-generation", "sentiment-analysis"]
  protocols:
    - name: "mcp"
      version: "1.0"
      endpoint: "ws://localhost:3000/mcp"
  performance:
    max_concurrent_requests: 100
    average_response_time: 250
    memory_usage: "2GB"
```

## Security Implementations

### OAuth 2.1 PKCE Flow
```yaml
OAuth2:
  type: oauth2
  flows:
    authorizationCode:
      authorizationUrl: https://auth.ossa.dev/oauth/authorize
      tokenUrl: https://auth.ossa.dev/oauth/token
      scopes:
        agent:read: Read agent information
        agent:write: Modify agent configuration
        admin: Administrative access
```

### API Key Management
```yaml
ApiKeyAuth:
  type: apiKey
  in: header
  name: X-OSSA-API-Key
  description: OSSA API key for authentication
```

## Webhook Implementations

### Agent Lifecycle Events
```yaml
webhooks:
  agentCreated:
    post:
      operationId: handleAgentCreated
      summary: Agent created notification
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AgentCreatedEvent'
      responses:
        '200':
          description: Webhook received successfully
```

## Content Type Support

All specifications support multiple content types:

- **`application/json`** - Primary JSON API
- **`application/yaml`** - YAML configuration format
- **`application/msgpack`** - Binary MessagePack format
- **`application/cbor`** - CBOR binary format
- **`text/plain`** - Plain text responses

## Validation Rules

Each specification includes comprehensive validation:

```yaml
AgentManifest:
  type: object
  required: [name, version, type]
  properties:
    name:
      type: string
      pattern: '^[a-z0-9-]+$'
      minLength: 3
      maxLength: 63
    version:
      type: string
      pattern: '^\\d+\\.\\d+\\.\\d+$'
    type:
      type: string
      enum: [worker, orchestrator, critic, monitor, governor, judge, voice]
```

## Integration Examples

### TypeScript Client Generation
```typescript
// Generated from OpenAPI specifications
import { AgentApi, Configuration } from './src/types/api-client';

const config = new Configuration({
  basePath: 'https://api.ossa.dev/v1',
  apiKey: process.env.OSSA_API_KEY
});

const agentApi = new AgentApi(config);
const agents = await agentApi.listAgents();
```

### MCP Integration
```typescript
// MCP server integration
import { McpServer } from '@modelcontextprotocol/sdk/server';
import { OSSAApiHandler } from './handlers/ossa-api';

const server = new McpServer({
  name: 'ossa-mcp-server',
  version: '0.1.9'
});

server.addHandler('ossa.agent.create', new OSSAApiHandler());
```

### Voice Agent Integration
```typescript
// Voice agent with ACDL capabilities
import { VoiceAgent } from './voice-agent';
import { ACDLCapabilities } from './acdl';

const voiceAgent = new VoiceAgent({
  capabilities: {
    domains: ['speech-recognition', 'text-to-speech'],
    protocols: ['mcp', 'websocket'],
    audio: {
      sampleRate: 16000,
      channels: 1,
      format: 'wav'
    }
  }
});
```

## Contributing

When adding or modifying specifications:

1. **Follow OpenAPI 3.1 Standards** - Use latest OpenAPI features
2. **Include Comprehensive Examples** - Provide realistic examples
3. **Document Security Requirements** - Specify authentication needs
4. **Add Validation Rules** - Include JSON Schema validation
5. **Test with Redocly** - Validate with `npm run api:validate:all`
6. **Generate Documentation** - Update docs with `npm run api:docs:build`
7. **Update This README** - Document new specifications

## Resource Links

- **OpenAPI 3.1 Specification**: [spec.openapis.org/oas/v3.1.0](https://spec.openapis.org/oas/v3.1.0)
- **JSON Schema Draft 2020-12**: [json-schema.org/draft/2020-12](https://json-schema.org/draft/2020-12)
- **Redocly Documentation**: [redocly.com/docs](https://redocly.com/docs)
- **OSSA Documentation**: [docs.ossa.dev](https://docs.ossa.dev)

---

These 15 specifications represent the most comprehensive OpenAPI 3.1 implementation for AI agent orchestration, providing enterprise-grade APIs with advanced features and complete documentation.