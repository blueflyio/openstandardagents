# OSSA Golden Standard Project Structure

This document defines the golden standard for project organization, naming conventions, and best practices as implemented in the OSSA (Open Standards for Scalable Agents) platform.

## 🏗️ Core Architecture Principles

### 1. API-First Design
- **Single Source of Truth**: `/api/openapi.yaml` defines all contracts
- **Generated Clients**: Never hand-write API clients
- **Contract-Driven Development**: API spec drives implementation
- **Backward Compatibility**: Semantic versioning with deprecation policies

### 2. Microservices Architecture
- **Independent Services**: Each service has its own package.json and dependencies
- **Port Standardization**: Consistent port allocation (Gateway: 3000, Discovery: 3011, etc.)
- **Health Checks**: Every service implements `/health` endpoint
- **Service Discovery**: UADP-compatible discovery mechanisms

### 3. Test-Driven Development
- **API Tests First**: Test endpoints before implementation
- **CLI Tests**: Mock API calls, test command logic
- **Integration Tests**: End-to-end workflow validation
- **Contract Testing**: Validate API compliance

## 📁 Directory Structure Standards

```
project/
├── api/                       # API Specification (Root Level)
│   ├── openapi.yaml          # Single source of truth
│   └── README.md             # API documentation and usage
│
├── cli/                       # Command Line Interface
│   ├── src/
│   │   ├── commands/         # Feature-based command organization
│   │   ├── api/              # Generated API client
│   │   ├── utils/            # Shared utilities
│   │   └── index.ts          # CLI entry point
│   ├── tests/                # CLI-specific tests
│   ├── bin/                  # Executable scripts
│   ├── package.json          # CLI dependencies
│   └── README.md             # CLI usage and examples
│
├── services/                  # Microservices Implementation
│   ├── gateway/              # API Gateway (Port 3000)
│   ├── discovery/            # Agent Discovery (Port 3011)
│   ├── coordination/         # Agent Coordination (Port 3010)
│   ├── orchestration/        # Workflow Management (Port 3012)
│   ├── monitoring/           # Observability (Port 3013)
│   └── README.md             # Services overview
│
├── infrastructure/           # Deployment and Infrastructure
│   ├── docker/               # Container configurations
│   │   ├── docker-compose.yml
│   │   └── Dockerfile.*
│   ├── kubernetes/           # K8s manifests
│   ├── terraform/            # Infrastructure as Code
│   └── scripts/              # Deployment automation
│
├── examples/                 # Numbered Examples (00-13)
│   ├── 00-basic-agent/       # Introductory example
│   ├── 01-langchain-agent/   # Framework-specific examples
│   ├── 02-crewai-agent/
│   └── 13-enterprise-setup/  # Advanced examples
│
├── templates/                # Project Templates
│   ├── agent/                # Agent templates
│   ├── service/              # Service templates
│   └── workflow/             # Workflow templates
│
├── config/                   # Configuration Files
│   ├── ci/                   # CI/CD configurations
│   ├── ossa/                 # OSSA-specific configs
│   └── environments/         # Environment-specific configs
│
├── lib/                      # Shared Libraries
│   ├── schemas/              # JSON schemas
│   ├── types/                # TypeScript definitions
│   └── validators/           # Validation utilities
│
├── docs/                     # Project Documentation
│   ├── API_FIRST_CLI_DEVELOPMENT.md
│   ├── GOLDEN_STANDARD.md
│   └── architecture/         # Technical documentation
│
└── tests/                    # Integration Tests
    ├── integration/          # End-to-end tests
    ├── fixtures/             # Test data
    └── utils/                # Test utilities
```

## 🏷️ Naming Conventions

### File Names
- **kebab-case**: `user-management.ts`, `api-client.ts`
- **PascalCase for Classes**: `UserManager.ts`, `ApiClient.ts`
- **Descriptive**: Names should clearly indicate purpose
- **Consistent Extensions**: `.ts` for TypeScript, `.yaml` for configs

### Directory Names
- **lowercase**: `services`, `examples`, `templates`
- **kebab-case for multi-word**: `user-management`, `api-gateway`
- **Plural for Collections**: `services`, `examples`, `schemas`
- **Singular for Containers**: `config`, `infrastructure`

### API Operations
- **operationId**: camelCase (`listUsers`, `createAgent`)
- **Paths**: kebab-case (`/agent-configs`, `/health-checks`)
- **Parameters**: snake_case in YAML, camelCase in generated clients
- **Schemas**: PascalCase (`AgentSpec`, `UserProfile`)

### Environment Variables
- **UPPER_SNAKE_CASE**: `NODE_ENV`, `SERVICE_PORT`
- **Service Prefixes**: `GATEWAY_PORT`, `DISCOVERY_URL`
- **Consistent Naming**: `{SERVICE}_{PROPERTY}`

## 🧪 Testing Standards

### Test Organization
```
tests/
├── unit/                     # Isolated component tests
├── integration/              # Multi-component tests
├── api/                      # API contract tests
├── cli/                      # Command-line tests
└── fixtures/                 # Test data and mocks
```

### Test Naming
- **Descriptive**: `should_create_agent_with_valid_spec`
- **Behavior-focused**: What the system should do
- **Consistent Structure**: Given/When/Then pattern

### Test Implementation
- **Mock External Dependencies**: API calls, file system, network
- **Test Contracts**: Validate API compliance
- **Integration Coverage**: Critical user journeys
- **Performance Testing**: Load and stress tests for services

## 📦 Package Management

### Workspace Structure
```json
{
  "name": "@org/project-root",
  "workspaces": [
    "cli",
    "services/*"
  ]
}
```

### Version Management
- **Semantic Versioning**: Major.Minor.Patch
- **Synchronized Versions**: All packages bump together
- **Change Management**: CHANGELOG.md for each package
- **Release Automation**: Automated version bumps and publishing

### Dependency Management
- **Shared Dependencies**: Defined at root level
- **Service-Specific**: Only what each service needs
- **Version Pinning**: Exact versions for production
- **Security Scanning**: Regular dependency audits

## 🔧 Development Workflow

### Feature Development
1. **Branch Strategy**: `feature/feature-name` from main
2. **API First**: Update OpenAPI spec
3. **Generate Clients**: Update generated code
4. **Write Tests**: API and CLI tests
5. **Implement**: Services and CLI commands
6. **Integration Test**: End-to-end validation
7. **Documentation**: Update relevant docs

### Code Quality
- **Linting**: ESLint with strict TypeScript rules
- **Formatting**: Prettier for consistent style
- **Type Checking**: Strict TypeScript configuration
- **Pre-commit Hooks**: Automated quality checks

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
stages:
  - validate-api-spec
  - generate-clients
  - run-tests
  - build-services
  - security-scan
  - deploy-staging
```

## 🏗️ Infrastructure Standards

### Container Strategy
- **Multi-stage Builds**: Optimize for size and security
- **Health Checks**: Every container has health endpoints
- **Resource Limits**: CPU and memory constraints
- **Security**: Non-root users, minimal base images

### Service Communication
- **Internal APIs**: Service-to-service communication
- **Message Queues**: Async processing with Redis
- **Load Balancing**: Gateway handles traffic distribution
- **Circuit Breakers**: Fail-fast and recovery patterns

### Monitoring
- **Metrics**: Prometheus-compatible endpoints
- **Logging**: Structured JSON logs
- **Tracing**: OpenTelemetry for distributed tracing
- **Alerting**: Critical path monitoring

## 🔒 Security Standards

### API Security
- **Authentication**: JWT tokens and API keys
- **Authorization**: Role-based access control
- **Rate Limiting**: Prevent abuse and DoS
- **Input Validation**: OpenAPI schema validation

### Infrastructure Security
- **TLS Everywhere**: Encrypted communication
- **Secrets Management**: External secret stores
- **Network Policies**: Zero-trust networking
- **Vulnerability Scanning**: Container and dependency scans

## 📋 Documentation Standards

### Code Documentation
- **README per Package**: Usage, setup, examples
- **API Documentation**: Generated from OpenAPI
- **Inline Comments**: Why, not what
- **Architecture Decisions**: ADR format

### User Documentation
- **Getting Started**: Quick setup guide
- **Examples**: Working code samples
- **Troubleshooting**: Common issues and solutions
- **Migration Guides**: Version upgrade paths

## ✅ Quality Gates

### Before Merge
- [ ] API tests pass
- [ ] CLI tests pass
- [ ] Integration tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Security scan passes
- [ ] Documentation updated

### Before Release
- [ ] Performance benchmarks pass
- [ ] Load tests pass
- [ ] Security audit complete
- [ ] Backward compatibility verified
- [ ] Migration guide available
- [ ] Monitoring alerts configured

---

This golden standard ensures consistency, maintainability, and scalability across the entire OSSA platform. Every decision should align with these principles, and any deviations should be documented and justified.