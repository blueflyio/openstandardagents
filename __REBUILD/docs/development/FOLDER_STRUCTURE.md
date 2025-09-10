# OSSA Platform Folder Structure v0.1.8

## Overview

The Open Semantic Service Architecture (OSSA) platform provides a comprehensive, standards-based framework for building, deploying, and managing AI agents and semantic services. This document details the complete directory structure, configuration requirements, and operational guidelines for OSSA-compliant implementations.

**⚠️ UPDATED STRUCTURE**: This structure has been reorganized to follow the clean specification pattern with versioned schemas, centralized compliance mappings, and standalone validators.

## Directory Structure

```
OSSA/
├── v0.1.8/                         # Version-specific specifications (NEW)
│   ├── schemas/                    # Consolidated JSON schemas
│   │   ├── agent-core.json         # Core agent schema
│   │   ├── graphql-schema.json     # GraphQL schema definition
│   │   ├── openapi-extensions.json # OpenAPI extensions
│   │   └── x-ossa-observability.json # Observability schema
│   ├── openapi/                    # OpenAPI specifications
│   │   └── ossa-api.yaml           # Main API specification
│   ├── graphql/                    # GraphQL schemas
│   │   └── schema.graphql          # Complete GraphQL schema
│   ├── examples/                   # Specification examples
│   │   ├── agent-manifest.yaml     # Example agent manifest
│   │   └── workspace-config.yaml   # Example workspace config
│   └── config/                     # Version-specific configuration
│       └── defaults.yaml           # Default configuration values
│
├── compliance/                     # Compliance frameworks (NEW)
│   ├── fedramp/                    # FedRAMP compliance
│   │   ├── mapping.yaml            # Control mappings
│   │   └── controls.json           # Control definitions
│   ├── nist-800-53/                # NIST 800-53 compliance
│   │   ├── mapping.yaml            # Control mappings
│   │   └── controls.json           # Control definitions
│   ├── iso-42001/                  # ISO 42001 compliance
│   │   ├── mapping.yaml            # Requirement mappings
│   │   └── requirements.json       # Requirements definition
│   └── eu-ai-act/                  # EU AI Act compliance
│       ├── mapping.yaml            # Article mappings
│       └── requirements.json       # Requirements definition
│
├── registry/                       # Central registries (NEW)
│   ├── agents.registry.json        # Agent registry
│   ├── capabilities.registry.json  # Capability registry
│   └── frameworks.registry.json    # Framework registry
│
├── validators/                     # Standalone validators (NEW)
│   ├── agent-validator.ts          # Agent manifest validator
│   ├── api-validator.ts            # API specification validator
│   ├── compliance-validator.ts     # Compliance validator
│   └── workspace-validator.ts      # Workspace configuration validator
│
├── .agents-workspace/              # Multi-agent orchestration workspace
│   ├── README.md                   # Workspace documentation
│   ├── config/                     # Workspace-level configurations
│   │   ├── workspace.yaml          # Primary workspace configuration
│   │   ├── discovery.yaml          # UADP discovery settings
│   │   ├── security.yaml           # Security policies and RBAC
│   │   └── resources.yaml          # Resource allocation limits
│   ├── agents/                     # Agent registry and definitions
│   │   ├── registry.json           # Agent registry index
│   │   ├── capabilities/           # Capability definitions
│   │   └── templates/              # Agent templates
│   ├── workflows/                  # Workflow orchestration
│   │   ├── templates/              # Reusable workflow templates
│   │   ├── active/                 # Currently executing workflows
│   │   └── completed/              # Archived workflow instances
│   ├── data/                       # Shared data repository
│   │   ├── vectors/                # Vector embeddings storage
│   │   ├── documents/              # Document store
│   │   ├── models/                 # Shared model artifacts
│   │   └── cache/                  # Workspace-level cache
│   ├── logs/                       # Centralized logging
│   │   ├── agents/                 # Agent-specific logs
│   │   ├── workflows/              # Workflow execution logs
│   │   └── audit/                  # Security audit logs
│   └── metrics/                    # Performance metrics
│       ├── prometheus/             # Prometheus metrics
│       └── opentelemetry/          # OpenTelemetry traces
│
├── .agents/                        # Individual agent runtime environments
│   ├── README.md                   # Agent runtime documentation
│   ├── manifests/                  # Agent manifests and definitions
│   │   ├── agent.yaml              # OSSA-compliant agent manifest
│   │   ├── capabilities.yaml       # Declared capabilities
│   │   └── requirements.yaml       # Resource requirements
│   ├── runtime/                    # Runtime configuration
│   │   ├── environment.yaml        # Environment variables
│   │   ├── context.yaml            # Execution context
│   │   └── hooks/                  # Lifecycle hooks
│   ├── cache/                      # Agent-specific cache
│   │   ├── models/                 # Cached model files
│   │   ├── embeddings/             # Cached embeddings
│   │   └── responses/              # Response cache
│   ├── credentials/                # Secure credential storage
│   │   ├── vault/                  # HashiCorp Vault integration
│   │   └── encrypted/              # Encrypted credentials
│   └── state/                      # Agent state management
│       ├── checkpoints/            # State checkpoints
│       └── recovery/               # Recovery data
│
├── api/                            # API specifications and schemas
│   ├── openapi.yaml                # OpenAPI 3.1 specification
│   ├── graphql/                    # GraphQL schemas
│   │   ├── schema.graphql          # Main GraphQL schema
│   │   └── resolvers/              # GraphQL resolvers
│   ├── schemas/                    # JSON Schema definitions
│   │   ├── agent.schema.json       # Agent configuration schema
│   │   ├── workflow.schema.json    # Workflow definition schema
│   │   └── message.schema.json     # Message format schema
│   ├── proto/                      # Protocol Buffers (if using gRPC)
│   │   └── ossa.proto              # OSSA service definitions
│   └── README.md                   # API documentation
│
├── extensions/                     # OSSA specification extensions
│   ├── openmp/                     # OpenMP parallel computing
│   │   ├── README.md               # Extension documentation
│   │   ├── ossa-openmp-extension.yaml
│   │   ├── api/
│   │   │   └── openapi-parallel.yaml
│   │   ├── examples/
│   │   │   ├── parallel-document-processor.yaml
│   │   │   └── distributed-training.yaml
│   │   ├── lib/
│   │   │   ├── parallel-execution-engine.ts
│   │   │   └── thread-pool-manager.ts
│   │   └── security/
│   │       └── parallel-security-manager.ts
│   ├── drupal/                     # Drupal integration extension
│   │   ├── README.md
│   │   ├── mcp-bridge/             # MCP module integration
│   │   └── experience-builder/     # Experience Builder support
│   └── gitlab/                     # GitLab CI/CD extension
│       ├── components/             # Reusable CI components
│       ├── pipelines/              # Pipeline templates
│       └── ml/                     # ML ops integration
│
├── cli/                            # Command-line interface
│   ├── src/                        # TypeScript source code
│   │   ├── commands/               # CLI commands
│   │   ├── utils/                  # Utility functions
│   │   └── index.ts                # Main entry point
│   ├── bin/                        # Executable scripts
│   │   └── ossa                    # Main CLI executable
│   ├── tests/                      # CLI tests
│   └── package.json                # CLI package configuration
│
├── sdk/                            # Software Development Kits
│   ├── typescript/                 # TypeScript SDK
│   │   ├── src/
│   │   ├── dist/
│   │   └── package.json
│   ├── python/                     # Python SDK
│   │   ├── ossa/
│   │   ├── tests/
│   │   └── setup.py
│   └── go/                         # Go SDK
│       ├── pkg/
│       └── go.mod
│
├── examples/                       # Example implementations
│   ├── basic/                      # Basic examples
│   │   ├── hello-world/
│   │   └── simple-agent/
│   ├── advanced/                   # Advanced examples
│   │   ├── multi-agent-workflow/
│   │   ├── rag-pipeline/
│   │   └── parallel-processing/
│   └── integrations/               # Integration examples
│       ├── langchain/
│       ├── crewai/
│       └── autogen/
│
├── tests/                          # Test suites
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   ├── e2e/                        # End-to-end tests
│   ├── performance/                # Performance benchmarks
│   └── security/                   # Security tests
│
├── docs/                           # Documentation
│   ├── getting-started/            # Quick start guides
│   ├── architecture/               # Architecture documentation
│   ├── api-reference/              # API reference docs
│   ├── tutorials/                  # Step-by-step tutorials
│   └── best-practices/             # Best practices guide
│
├── .gitlab/                        # GitLab-specific configurations
│   ├── ci/                         # CI/CD configurations
│   │   ├── .gitlab-ci.yml          # Main CI pipeline
│   │   └── templates/              # CI templates
│   ├── agents/                     # GitLab agent configurations
│   └── ml/                         # ML experiment tracking
│
├── .github/                        # GitHub-specific (if mirroring)
│   ├── workflows/                  # GitHub Actions
│   └── ISSUE_TEMPLATE/             # Issue templates
│
├── config/                         # Global configuration
│   ├── default.yaml                # Default configuration
│   ├── development.yaml            # Development settings
│   ├── staging.yaml                # Staging settings
│   └── production.yaml             # Production settings
│
├── scripts/                        # Utility scripts
│   ├── setup/                      # Setup scripts
│   ├── deploy/                     # Deployment scripts
│   └── maintenance/                # Maintenance scripts
│
├── docker/                         # Docker configurations
│   ├── Dockerfile                  # Main Dockerfile
│   ├── docker-compose.yml          # Docker Compose config
│   └── images/                     # Additional Docker images
│
├── kubernetes/                     # Kubernetes manifests
│   ├── base/                       # Base configurations
│   ├── overlays/                   # Environment overlays
│   └── helm/                       # Helm charts
│
├── terraform/                      # Infrastructure as Code
│   ├── modules/                    # Terraform modules
│   ├── environments/               # Environment configs
│   └── variables.tf                # Variable definitions
│
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore patterns
├── .dockerignore                   # Docker ignore patterns
├── CHANGELOG.md                    # Version changelog
├── CONTRIBUTING.md                 # Contribution guidelines
├── LICENSE                         # License file
├── Makefile                        # Build automation
├── package.json                    # Node.js dependencies
├── ROADMAP.md                      # Project roadmap
├── SECURITY.md                     # Security policies
└── README.md                       # Project documentation
```

## Directory Details

### Core Directories

#### `.agents-workspace/`
**Purpose**: Centralized multi-agent orchestration and coordination

**Key Components**:
- **config/**: YAML-based workspace configurations
  - `workspace.yaml`: Primary configuration including OSSA version, discovery settings, resource limits
  - `discovery.yaml`: UADP protocol settings for agent discovery
  - `security.yaml`: RBAC policies, encryption settings, compliance frameworks
  - `resources.yaml`: CPU, memory, GPU allocation limits per agent

- **agents/**: Agent lifecycle management
  - `registry.json`: Central registry of all available agents with metadata
  - `capabilities/`: Standardized capability definitions (NLP, vision, reasoning, etc.)
  - `templates/`: Reusable agent templates for common patterns

- **workflows/**: Workflow orchestration engine
  - `templates/`: YAML-based workflow templates (sequential, parallel, conditional)
  - `active/`: Currently executing workflow instances with state tracking
  - `completed/`: Archived workflows with execution history

- **data/**: Shared data layer
  - `vectors/`: Vector database storage (Pinecone, Weaviate, Chroma compatible)
  - `documents/`: Document store with versioning
  - `models/`: Shared model artifacts (ONNX, TensorFlow, PyTorch)
  - `cache/`: LRU cache for frequently accessed data

- **logs/**: Comprehensive logging infrastructure
  - Structured JSON logging
  - Log aggregation support (ELK stack compatible)
  - Retention policies and rotation

- **metrics/**: Observability and monitoring
  - Prometheus metrics endpoint
  - OpenTelemetry trace collection
  - Custom business metrics

#### `.agents/`
**Purpose**: Isolated runtime environments for individual agents

**Key Components**:
- **manifests/**: OSSA-compliant agent definitions
  - `agent.yaml`: Complete agent specification including:
    ```yaml
    apiVersion: ossa.io/v0.1.8
    kind: Agent
    metadata:
      name: document-processor
      version: 1.0.0
    spec:
      capabilities:
        - nlp.text-extraction
        - nlp.summarization
      resources:
        memory: 2Gi
        cpu: 1000m
      security:
        runAsUser: 1000
        readOnlyRootFilesystem: true
    ```

- **runtime/**: Execution environment configuration
  - Environment isolation
  - Resource constraints enforcement
  - Lifecycle hook management

- **cache/**: Agent-specific caching layer
  - Model caching with TTL
  - Embedding cache for vector operations
  - Response memoization

- **credentials/**: Secure credential management
  - HashiCorp Vault integration
  - Encrypted credential storage (AES-256-GCM)
  - Automatic rotation support

- **state/**: State persistence and recovery
  - Checkpoint creation for long-running operations
  - Automatic recovery on failure
  - State synchronization across instances

#### `api/`
**Purpose**: Comprehensive API specifications and contracts

**OpenAPI Specification** (`openapi.yaml`):
```yaml
openapi: 3.1.0
info:
  title: OSSA Platform API
  version: 0.1.8
  x-ossa:
    version: 0.1.8
    conformance_tier: advanced
    certification_level: platinum
    compliance_frameworks:
      - ISO_42001
      - NIST_AI_RMF
      - EU_AI_ACT

servers:
  - url: https://api.ossa.io/v1
    description: Production API
  - url: https://staging-api.ossa.io/v1
    description: Staging API

paths:
  /agents:
    get:
      summary: List all agents
      operationId: listAgents
      tags: [Agents]
      parameters:
        - name: capability
          in: query
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [active, inactive, maintenance]
      responses:
        '200':
          description: List of agents
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AgentList'

  /agents/{agentId}/execute:
    post:
      summary: Execute agent task
      operationId: executeAgent
      tags: [Agents]
      parameters:
        - name: agentId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExecutionRequest'
      responses:
        '202':
          description: Execution started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExecutionResponse'

  /workflows:
    post:
      summary: Create workflow
      operationId: createWorkflow
      tags: [Workflows]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/WorkflowDefinition'
      responses:
        '201':
          description: Workflow created

  /discover:
    get:
      summary: UADP-compatible discovery endpoint
      operationId: discover
      tags: [Discovery]
      responses:
        '200':
          description: Discovery information
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DiscoveryResponse'

  /metrics:
    get:
      summary: Platform metrics
      operationId: getMetrics
      tags: [Monitoring]
      responses:
        '200':
          description: Metrics data
          content:
            text/plain:
              schema:
                type: string

  /health:
    get:
      summary: Health check
      operationId: healthCheck
      tags: [Monitoring]
      responses:
        '200':
          description: Service healthy
```

#### `extensions/`
**Purpose**: Modular extensions to core OSSA functionality

**OpenMP Extension** (`openmp/`):
- Parallel document processing
- Distributed model training
- Multi-threaded vector operations
- Thread pool management with security constraints

**Drupal Extension** (`drupal/`):
- MCP module bridge for agent communication
- Experience Builder integration
- ECA (Event-Condition-Action) workflow support
- Entity API integration for content operations

**GitLab Extension** (`gitlab/`):
- CI/CD pipeline integration
- ML experiment tracking
- Model registry synchronization
- Automated deployment workflows

### Supporting Directories

#### `sdk/`
**Purpose**: Multi-language SDKs for OSSA integration

- **TypeScript SDK**: Full type safety, async/await support
- **Python SDK**: Jupyter notebook compatible, pandas integration
- **Go SDK**: High-performance, concurrent operations

#### `examples/`
**Purpose**: Reference implementations and patterns

- **Basic Examples**: Hello world, simple agents
- **Advanced Examples**: Multi-agent coordination, RAG pipelines
- **Integration Examples**: LangChain, CrewAI, AutoGen patterns

#### `tests/`
**Purpose**: Comprehensive testing infrastructure

- **Unit Tests**: Component-level testing
- **Integration Tests**: API contract testing
- **E2E Tests**: Full workflow validation
- **Performance Tests**: Benchmarking and load testing
- **Security Tests**: Penetration testing, vulnerability scanning

## Configuration Standards

### Workspace Configuration
```yaml
# .agents-workspace/config/workspace.yaml
apiVersion: ossa.io/v0.1.8
kind: WorkspaceConfig
metadata:
  name: production-workspace
  environment: production
  
spec:
  discovery:
    protocol: UADP
    version: 1.0.0
    broadcast: true
    interval: 30s
    
  resources:
    global:
      maxAgents: 100
      maxMemory: 64Gi
      maxCPU: 32
    perAgent:
      defaultMemory: 1Gi
      defaultCPU: 500m
      maxMemory: 4Gi
      maxCPU: 2
      
  security:
    encryption:
      algorithm: AES-256-GCM
      keyRotation: 30d
    authentication:
      provider: oauth2
      issuer: https://auth.ossa.io
    authorization:
      model: RBAC
      policies:
        - resource: agents
          actions: [read, write, execute]
          roles: [admin, developer]
          
  monitoring:
    metrics:
      enabled: true
      provider: prometheus
      interval: 15s
    tracing:
      enabled: true
      provider: opentelemetry
      sampling: 0.1
    logging:
      level: info
      format: json
      retention: 30d
```

### Agent Manifest
```yaml
# .agents/manifests/agent.yaml
apiVersion: ossa.io/v0.1.8
kind: Agent
metadata:
  name: document-processor
  version: 1.0.0
  labels:
    tier: premium
    category: nlp
  annotations:
    documentation: https://docs.ossa.io/agents/document-processor
    
spec:
  description: Advanced document processing with NLP capabilities
  
  capabilities:
    - id: nlp.text-extraction
      version: 2.0
    - id: nlp.summarization
      version: 1.5
    - id: nlp.entity-recognition
      version: 1.2
      
  requirements:
    runtime: node:18-alpine
    dependencies:
      - langchain: ^0.1.0
      - openai: ^4.0.0
      
  resources:
    requests:
      memory: 1Gi
      cpu: 500m
    limits:
      memory: 2Gi
      cpu: 1000m
      
  security:
    runAsUser: 1000
    runAsGroup: 1000
    readOnlyRootFilesystem: true
    allowPrivilegeEscalation: false
    capabilities:
      drop: [ALL]
      
  health:
    liveness:
      httpGet:
        path: /health/live
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    readiness:
      httpGet:
        path: /health/ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
      
  telemetry:
    metrics:
      enabled: true
      port: 9090
    tracing:
      enabled: true
      endpoint: http://jaeger:14268
```

## Security & Compliance

### Security Framework
- **Encryption**: AES-256-GCM for data at rest, TLS 1.3 for data in transit
- **Authentication**: OAuth 2.0, SAML 2.0, mTLS support
- **Authorization**: Fine-grained RBAC with attribute-based access control
- **Audit Logging**: Complete audit trail with tamper-proof storage
- **Secret Management**: HashiCorp Vault integration, automatic rotation

### Compliance Frameworks
- **ISO 42001**: AI management system compliance
- **NIST AI RMF**: Risk management framework alignment
- **EU AI Act**: European AI regulation compliance
- **SOC 2 Type II**: Security and availability controls
- **GDPR**: Data privacy and protection

### Security Scanning
- **SAST**: Static application security testing in CI/CD
- **DAST**: Dynamic application security testing
- **Container Scanning**: Vulnerability scanning for Docker images
- **Dependency Scanning**: Automated dependency vulnerability checks
- **Secret Detection**: Prevent credential leaks in code

## Integration Ecosystem

### Supported Frameworks
- **LangChain**: Native integration with chains and agents
- **CrewAI**: Multi-agent collaboration support
- **AutoGen**: Microsoft AutoGen framework compatibility
- **OpenAI**: GPT models and assistants API
- **Anthropic**: Claude integration via MCP
- **Hugging Face**: Model hub and inference endpoints

### Protocol Support
- **REST**: OpenAPI 3.1 compliant APIs
- **GraphQL**: Flexible query language support
- **gRPC**: High-performance RPC with Protocol Buffers
- **WebSocket**: Real-time bidirectional communication
- **UADP**: Universal Agent Discovery Protocol
- **MCP**: Model Context Protocol for AI systems

### Monitoring & Observability
- **Metrics**: Prometheus, Grafana dashboards
- **Tracing**: OpenTelemetry, Jaeger, Zipkin
- **Logging**: ELK stack, Fluentd, CloudWatch
- **APM**: Application Performance Monitoring
- **Error Tracking**: Sentry integration

## Development Workflow

### Local Development
```bash
# Initialize workspace
ossa init workspace --name dev-workspace

# Create new agent
ossa agent create --template nlp-basic --name my-agent

# Run agent locally
ossa agent run --name my-agent --debug

# Test agent
ossa agent test --name my-agent --coverage
```

### CI/CD Pipeline
```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - build
  - security
  - deploy

validate:
  stage: validate
  script:
    - ossa validate manifests
    - ossa validate workflows

test:
  stage: test
  script:
    - ossa test unit
    - ossa test integration
    - ossa test e2e

security:
  stage: security
  script:
    - ossa scan vulnerabilities
    - ossa scan secrets
    - ossa audit compliance

deploy:
  stage: deploy
  script:
    - ossa deploy --environment $CI_ENVIRONMENT_NAME
  only:
    - main
```

## Best Practices

### Directory Organization
1. Keep agent manifests versioned and immutable
2. Use semantic versioning for all components
3. Separate configuration by environment
4. Implement proper secret management
5. Maintain comprehensive documentation

### Performance Optimization
1. Implement caching at multiple levels
2. Use connection pooling for databases
3. Optimize vector operations with batch processing
4. Implement circuit breakers for resilience
5. Monitor resource usage continuously

### Security Guidelines
1. Never store credentials in code
2. Implement least privilege access
3. Regular security audits and updates
4. Encrypt sensitive data at rest and in transit
5. Implement comprehensive logging and monitoring

## Migration Guide

### From v0.1.7 to v0.1.8
1. Update manifest schema version
2. Migrate to new security context format
3. Update API endpoints to v0.1.8 specification
4. Implement new telemetry requirements
5. Update SDK dependencies

## Support & Resources

### Documentation
- [Getting Started Guide](/docs/getting-started.md)
- [API Reference](/docs/api.md)
- [Security Best Practices](/docs/security.md)
- [Troubleshooting Guide](/docs/troubleshooting.md)

### Community
- GitLab: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard
- npm: https://www.npmjs.com/package/ossa-platform

### Professional Support
- Enterprise Support: thomas.scola@bluefly.io
- Training & Consulting: https://bluefly.io

## License

OSSA Platform is released under the Apache License 2.0. See LICENSE file for details.

---

*Last Updated: September 2025*
*Version: 0.1.8*
*Maintainer: OSSA Platform Team*