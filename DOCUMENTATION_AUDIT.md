# OSSA Documentation Audit & Restructuring Plan

**Date**: 2025-11-26  
**Goal**: Transform OSSA into a showcase for project documentation and automation

## Current State Analysis

### Documentation Locations (Fragmented)
1. **GitLab Wiki** (`.gitlab/docs/`) - 30+ files, infrastructure-focused
2. **Website** (`website/content/docs/`) - 80+ files, user-facing
3. **Root README.md** - Overview and quick start
4. **Spec Documentation** (`spec/v*/`) - Version-specific schema docs
5. **OpenAPI Specs** (`openapi/`) - API definitions (no generated docs)
6. **CLI Source** (`src/cli/commands/`) - 11 commands (no reference docs)

### Critical Gaps Identified

#### 1. **No CLI Reference Documentation**
- ❌ No comprehensive CLI command reference
- ❌ No examples for each command
- ❌ No connection between CLI commands and API endpoints
- **Commands without docs**: validate, generate, migrate, run, init, setup, export, import, schema, gitlab-agent, agents

#### 2. **No API Documentation**
- ❌ OpenAPI specs exist but no rendered documentation
- ❌ No endpoint reference guide
- ❌ No request/response examples
- ❌ No authentication guide
- **4 Core APIs undocumented**: ossa-core-api, ossa-registry-api, unified-agent-gateway, ossa-registry

#### 3. **Schema Documentation Incomplete**
- ⚠️ Basic schema reference exists
- ❌ Missing: detailed parameter explanations
- ❌ Missing: validation rules and constraints
- ❌ Missing: real-world examples for each field
- ❌ Missing: cross-references between related fields

#### 4. **No Architecture Diagrams**
- ❌ No visual representation of CLI → API → Agent flow
- ❌ No sequence diagrams for common operations
- ❌ No deployment architecture diagrams

#### 5. **Fragmented Content**
- Duplicate content across GitLab wiki and website
- No single source of truth
- Inconsistent formatting and structure

---

## Proposed Documentation Structure

### 1. **GitLab Wiki** (Technical/Internal)
```
wiki/
├── Home.md                           # Wiki landing page
├── Development/
│   ├── Setup.md                      # Dev environment setup
│   ├── Contributing.md               # Contribution guidelines
│   ├── Release-Process.md            # Release workflow
│   └── Testing.md                    # Testing guidelines
├── Infrastructure/
│   ├── GitLab-Agents.md             # GitLab agent setup
│   ├── Kubernetes-Deployment.md     # K8s deployment
│   ├── CI-CD-Pipeline.md            # Pipeline configuration
│   └── Monitoring.md                # Observability setup
├── Operations/
│   ├── Service-Accounts.md          # Service account management
│   ├── Merge-Train-Automation.md    # Merge train setup
│   └── Version-Management.md        # Version automation
└── Architecture/
    ├── System-Design.md             # Overall architecture
    ├── Data-Flow.md                 # Data flow diagrams
    └── Security-Model.md            # Security architecture
```

### 2. **Website Documentation** (User-Facing)
```
website/content/docs/
├── getting-started/
│   ├── index.md                     # Overview
│   ├── installation.md              # Install guide
│   ├── quick-start.md               # 5-min tutorial
│   └── first-agent.md               # Create first agent
├── cli-reference/
│   ├── index.md                     # CLI overview
│   ├── ossa-validate.md             # Validate command
│   ├── ossa-generate.md             # Generate command
│   ├── ossa-migrate.md              # Migrate command
│   ├── ossa-run.md                  # Run command
│   ├── ossa-init.md                 # Init command
│   ├── ossa-setup.md                # Setup command
│   ├── ossa-export.md               # Export command
│   ├── ossa-import.md               # Import command
│   ├── ossa-schema.md               # Schema command
│   ├── ossa-gitlab-agent.md         # GitLab agent command
│   └── ossa-agents.md               # Agents command
├── api-reference/
│   ├── index.md                     # API overview
│   ├── core-api/
│   │   ├── index.md                 # Core API overview
│   │   ├── agents.md                # /agents endpoints
│   │   ├── capabilities.md          # /capabilities endpoints
│   │   ├── executions.md            # /executions endpoints
│   │   └── health.md                # /health endpoints
│   ├── registry-api/
│   │   ├── index.md                 # Registry overview
│   │   ├── search.md                # Search agents
│   │   ├── publish.md               # Publish agents
│   │   └── versions.md              # Version management
│   ├── gateway-api/
│   │   ├── index.md                 # Gateway overview
│   │   ├── routing.md               # Request routing
│   │   └── authentication.md        # Auth methods
│   └── authentication.md            # Auth guide
├── schema-reference/
│   ├── index.md                     # Schema overview
│   ├── agent-manifest.md            # Complete manifest spec
│   ├── agent-spec/
│   │   ├── id.md                    # agent.id field
│   │   ├── name.md                  # agent.name field
│   │   ├── version.md               # agent.version field
│   │   ├── role.md                  # agent.role field
│   │   └── runtime.md               # agent.runtime field
│   ├── capabilities/
│   │   ├── index.md                 # Capabilities overview
│   │   ├── input-schema.md          # Input schema definition
│   │   ├── output-schema.md         # Output schema definition
│   │   └── examples.md              # Capability examples
│   ├── tools/
│   │   ├── index.md                 # Tools overview
│   │   ├── tool-definition.md       # Tool structure
│   │   └── examples.md              # Tool examples
│   ├── llm-config/
│   │   ├── index.md                 # LLM config overview
│   │   ├── provider.md              # Provider configuration
│   │   ├── model.md                 # Model selection
│   │   └── parameters.md            # LLM parameters
│   ├── autonomy.md                  # Autonomy configuration
│   ├── constraints.md               # Constraints definition
│   ├── observability.md             # Observability setup
│   └── taxonomy.md                  # Taxonomy metadata
├── architecture/
│   ├── overview.md                  # Architecture overview
│   ├── cli-to-api-flow.md          # CLI → API flow diagram
│   ├── agent-lifecycle.md           # Agent lifecycle
│   ├── execution-flow.md            # Execution flow
│   └── multi-agent-systems.md       # Multi-agent patterns
├── guides/
│   ├── creating-agents.md           # Agent creation guide
│   ├── deploying-agents.md          # Deployment guide
│   ├── testing-agents.md            # Testing guide
│   ├── monitoring-agents.md         # Monitoring guide
│   └── security-best-practices.md   # Security guide
├── migration-guides/
│   ├── index.md                     # Migration overview
│   ├── langchain-to-ossa.md         # LangChain migration
│   ├── crewai-to-ossa.md            # CrewAI migration
│   ├── openai-to-ossa.md            # OpenAI migration
│   ├── anthropic-mcp-to-ossa.md     # Anthropic MCP migration
│   ├── langflow-to-ossa.md          # Langflow migration
│   └── drupal-eca-to-ossa.md        # Drupal ECA migration
├── ecosystem/
│   ├── overview.md                  # Ecosystem overview
│   └── framework-support.md         # Framework integrations
└── examples/
    ├── index.md                     # Examples overview
    ├── hello-world.md               # Hello World agent
    ├── chat-agent.md                # Chat agent
    ├── workflow-agent.md            # Workflow agent
    └── compliance-agent.md          # Compliance agent
```

### 3. **Issue Comments** (Contextual Documentation)
- Link to relevant docs in issue templates
- Add "Documentation" label for doc-related issues
- Use issue comments for:
  - Feature documentation requirements
  - API change documentation
  - Breaking change migration guides

---

## Documentation Standards

### Technical Writing Guidelines

#### 1. **Structure Every Page**
```markdown
# Page Title

**Purpose**: One-sentence description of what this page covers

## Overview
Brief introduction (2-3 paragraphs)

## Prerequisites
- Required knowledge
- Required tools
- Required setup

## Main Content
Detailed technical content with examples

## Examples
Real-world examples with code

## Related Topics
- [Link to related doc 1](#)
- [Link to related doc 2](#)

## Troubleshooting
Common issues and solutions
```

#### 2. **Explain Why, How, Where**
- **Why**: Purpose and use cases
- **How**: Step-by-step instructions
- **Where**: Context and placement in architecture

#### 3. **Code Examples**
- Every command must have examples
- Every API endpoint must have curl examples
- Every schema field must have YAML examples

#### 4. **Cross-Linking**
- Link related concepts
- Link CLI commands to API endpoints
- Link schema fields to examples

---

## CLI Reference Documentation Template

### Example: `ossa validate` Command

```markdown
# ossa validate

**Purpose**: Validate OSSA agent manifests against the schema

## Synopsis
```bash
ossa validate <path> [options]
```

## Description
The `validate` command checks OSSA agent manifests for:
- Schema compliance
- Required field presence
- Type correctness
- Constraint violations

## Arguments
- `<path>` - Path to agent manifest file or directory

## Options
- `--version <version>` - Specify OSSA version (default: latest)
- `--strict` - Enable strict validation mode
- `--format <format>` - Output format: json, yaml, table (default: table)
- `--verbose` - Show detailed validation errors

## Examples

### Validate Single File
```bash
ossa validate agent.ossa.yaml
```

### Validate Directory
```bash
ossa validate ./agents/
```

### Strict Validation
```bash
ossa validate agent.ossa.yaml --strict
```

### JSON Output
```bash
ossa validate agent.ossa.yaml --format json
```

## API Endpoint Connection
This command uses the following API endpoint:
- `POST /api/v1/validate` - [API Reference](../api-reference/core-api/validate.md)

## Exit Codes
- `0` - Validation successful
- `1` - Validation failed
- `2` - File not found
- `3` - Invalid arguments

## Related Commands
- [ossa generate](./ossa-generate.md) - Generate agent manifests
- [ossa schema](./ossa-schema.md) - View schema documentation

## Troubleshooting

### Error: "Invalid OSSA version"
**Solution**: Specify a valid version with `--version`

### Error: "Schema validation failed"
**Solution**: Run with `--verbose` to see detailed errors
```

---

## API Reference Documentation Template

### Example: Core API - Agents Endpoint

```markdown
# Agents API

**Base URL**: `/api/v1/agents`

## Overview
The Agents API provides endpoints for managing OSSA-compliant agents.

## Authentication
All endpoints require authentication via:
- Bearer token
- API key

See [Authentication Guide](../authentication.md) for details.

## Endpoints

### List Agents
```http
GET /api/v1/agents
```

**Description**: Retrieve a list of registered agents

**Query Parameters**:
- `page` (integer) - Page number (default: 1)
- `limit` (integer) - Items per page (default: 20, max: 100)
- `role` (string) - Filter by agent role
- `status` (string) - Filter by status: active, inactive

**Response**:
```json
{
  "agents": [
    {
      "id": "my-agent",
      "name": "My Agent",
      "version": "1.0.0",
      "role": "worker",
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

**Example**:
```bash
curl -X GET "https://api.ossa.dev/api/v1/agents?role=worker" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**CLI Equivalent**:
```bash
ossa agents list --role worker
```

### Get Agent
```http
GET /api/v1/agents/{id}
```

**Description**: Retrieve a specific agent by ID

**Path Parameters**:
- `id` (string, required) - Agent ID

**Response**:
```json
{
  "id": "my-agent",
  "name": "My Agent",
  "version": "1.0.0",
  "role": "worker",
  "capabilities": [...],
  "status": "active"
}
```

**Example**:
```bash
curl -X GET "https://api.ossa.dev/api/v1/agents/my-agent" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**CLI Equivalent**:
```bash
ossa agents get my-agent
```

### Create Agent
```http
POST /api/v1/agents
```

**Description**: Register a new agent

**Request Body**:
```json
{
  "manifest": {
    "ossaVersion": "0.2.5-RC",
    "agent": {
      "id": "my-agent",
      "name": "My Agent",
      "version": "1.0.0",
      "role": "worker",
      "runtime": {
        "type": "k8s"
      },
      "capabilities": [...]
    }
  }
}
```

**Response**:
```json
{
  "id": "my-agent",
  "status": "registered",
  "url": "/api/v1/agents/my-agent"
}
```

**Example**:
```bash
curl -X POST "https://api.ossa.dev/api/v1/agents" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @agent-manifest.json
```

**CLI Equivalent**:
```bash
ossa agents create agent.ossa.yaml
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "validation_error",
  "message": "Invalid agent manifest",
  "details": [
    {
      "field": "agent.id",
      "error": "must match DNS-1123 format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Agent not found"
}
```

## Rate Limiting
- 100 requests per minute per API key
- 1000 requests per hour per API key

## Related Documentation
- [CLI Reference: ossa agents](../cli-reference/ossa-agents.md)
- [Schema Reference: Agent Manifest](../schema-reference/agent-manifest.md)
- [Guide: Creating Agents](../guides/creating-agents.md)
```

---

## Schema Reference Documentation Template

### Example: `agent.id` Field

```markdown
# agent.id

**Type**: `string`  
**Required**: Yes  
**Format**: DNS-1123 subdomain

## Description
Unique identifier for the agent. Must be globally unique within the OSSA ecosystem.

## Why This Field Exists
The `agent.id` serves as the primary identifier for:
- Agent registration in the registry
- API endpoint routing
- Inter-agent communication
- Deployment naming

## Format Requirements
Must follow DNS-1123 subdomain format:
- Lowercase alphanumeric characters
- Hyphens allowed (not at start/end)
- Maximum 63 characters
- No underscores or special characters

**Valid Examples**:
- `my-agent`
- `data-processor-v2`
- `compliance-checker-prod`

**Invalid Examples**:
- `My-Agent` (uppercase)
- `my_agent` (underscore)
- `agent-` (trailing hyphen)
- `-agent` (leading hyphen)

## How to Choose an ID

### For Development
```yaml
agent:
  id: my-agent-dev
```

### For Production
```yaml
agent:
  id: my-agent-prod
```

### For Multi-Environment
```yaml
agent:
  id: my-agent-${ENVIRONMENT}
```

## Where It's Used

### 1. API Endpoints
```
GET /api/v1/agents/{agent.id}
POST /api/v1/agents/{agent.id}/execute
```

### 2. Kubernetes Resources
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-agent  # Uses agent.id
```

### 3. Registry URLs
```
https://registry.ossa.dev/agents/my-agent
```

## Examples

### Minimal Agent
```yaml
ossaVersion: "0.2.5-RC"
agent:
  id: hello-world
  name: Hello World Agent
  version: "1.0.0"
  role: worker
  runtime:
    type: docker
  capabilities:
    - name: greet
      description: Say hello
```

### Production Agent
```yaml
ossaVersion: "0.2.5-RC"
agent:
  id: compliance-checker-prod
  name: Compliance Checker (Production)
  version: "2.1.0"
  role: compliance
  runtime:
    type: k8s
    namespace: compliance
  capabilities: [...]
```

## Validation Rules

### CLI Validation
```bash
ossa validate agent.ossa.yaml
```

### API Validation
```bash
curl -X POST "https://api.ossa.dev/api/v1/validate" \
  -H "Content-Type: application/json" \
  -d @agent.json
```

## Common Errors

### Error: "agent.id must match DNS-1123 format"
**Cause**: ID contains invalid characters  
**Solution**: Use only lowercase letters, numbers, and hyphens

### Error: "agent.id already exists"
**Cause**: ID is not unique  
**Solution**: Choose a different ID or version the existing agent

## Related Fields
- [agent.name](./name.md) - Human-readable name
- [agent.version](./version.md) - Semantic version
- [agent.role](./role.md) - Agent role classification

## Related Documentation
- [CLI Reference: ossa validate](../cli-reference/ossa-validate.md)
- [API Reference: Create Agent](../api-reference/core-api/agents.md#create-agent)
- [Guide: Creating Agents](../guides/creating-agents.md)
```

---

## Automation Strategy

### 1. **Auto-Generate API Documentation**
```bash
# Generate API docs from OpenAPI specs
npm run docs:api:generate

# Uses: @redocly/cli or swagger-codegen
# Output: website/content/docs/api-reference/
```

### 2. **Auto-Generate CLI Documentation**
```bash
# Generate CLI docs from command definitions
npm run docs:cli:generate

# Parses: src/cli/commands/*.ts
# Output: website/content/docs/cli-reference/
```

### 3. **Auto-Generate Schema Documentation**
```bash
# Generate schema docs from JSON Schema
npm run docs:schema:generate

# Parses: spec/v*/ossa-*.schema.json
# Output: website/content/docs/schema-reference/
```

### 4. **GitLab Agent for Documentation**
Create `.gitlab/agents/doc-agent/manifest.ossa.yaml`:
```yaml
ossaVersion: "0.2.5-RC"
agent:
  id: doc-agent
  name: Documentation Agent
  version: "1.0.0"
  role: worker
  runtime:
    type: gitlab-ci
  capabilities:
    - name: generate_api_docs
      description: Generate API documentation from OpenAPI specs
      input_schema:
        type: object
        properties:
          spec_path:
            type: string
      output_schema:
        type: object
        properties:
          docs_path:
            type: string
    - name: generate_cli_docs
      description: Generate CLI documentation from source
      input_schema:
        type: object
        properties:
          commands_path:
            type: string
      output_schema:
        type: object
        properties:
          docs_path:
            type: string
    - name: validate_docs
      description: Validate documentation completeness
      input_schema:
        type: object
      output_schema:
        type: object
        properties:
          missing_docs:
            type: array
            items:
              type: string
```

### 5. **CI/CD Pipeline for Documentation**
```yaml
# .gitlab-ci.yml
docs:generate:
  stage: docs
  script:
    - npm run docs:api:generate
    - npm run docs:cli:generate
    - npm run docs:schema:generate
  artifacts:
    paths:
      - website/content/docs/
  only:
    changes:
      - openapi/**/*
      - src/cli/**/*
      - spec/**/*

docs:validate:
  stage: test
  script:
    - npm run docs:validate
    - npm run docs:lint
  only:
    changes:
      - website/content/docs/**/*

docs:deploy:
  stage: deploy
  script:
    - npm run build
    - npm run deploy
  only:
    - main
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create documentation structure
- [ ] Set up automation scripts
- [ ] Create documentation templates
- [ ] Establish writing guidelines

### Phase 2: CLI Documentation (Week 2)
- [ ] Document all 11 CLI commands
- [ ] Add examples for each command
- [ ] Create CLI → API mapping
- [ ] Generate CLI reference from source

### Phase 3: API Documentation (Week 3)
- [ ] Generate API docs from OpenAPI specs
- [ ] Add authentication guide
- [ ] Create endpoint examples
- [ ] Add error response documentation

### Phase 4: Schema Documentation (Week 4)
- [ ] Document all schema fields
- [ ] Add validation rules
- [ ] Create field examples
- [ ] Add cross-references

### Phase 5: Architecture & Guides (Week 5)
- [ ] Create architecture diagrams
- [ ] Write deployment guides
- [ ] Write testing guides
- [ ] Write security guides

### Phase 6: Automation (Week 6)
- [ ] Implement doc generation scripts
- [ ] Create GitLab doc agent
- [ ] Set up CI/CD pipeline
- [ ] Enable auto-healing docs

---

## Success Metrics

### Completeness
- [ ] 100% CLI commands documented
- [ ] 100% API endpoints documented
- [ ] 100% schema fields documented
- [ ] All examples tested and working

### Quality
- [ ] Every page follows template
- [ ] Every command has examples
- [ ] Every field explains why/how/where
- [ ] All cross-links working

### Automation
- [ ] API docs auto-generated from OpenAPI
- [ ] CLI docs auto-generated from source
- [ ] Schema docs auto-generated from JSON Schema
- [ ] Docs validated in CI/CD

### Usability
- [ ] Clear navigation structure
- [ ] Search functionality working
- [ ] Mobile-responsive design
- [ ] Fast page load times

---

## Next Steps

1. **Review this audit** with the team
2. **Prioritize sections** based on user needs
3. **Create GitHub/GitLab issues** for each documentation task
4. **Assign owners** for each documentation section
5. **Set up automation** for doc generation
6. **Implement CI/CD** for documentation validation
7. **Launch documentation portal** with new structure

---

## Questions to Answer

1. Should we use Redocly, Swagger UI, or custom solution for API docs?
2. Should we use Docusaurus, VitePress, or Next.js for documentation site?
3. Should we host docs on GitLab Pages, Vercel, or separate domain?
4. Should we version documentation per OSSA version?
5. Should we support multiple languages (i18n)?
