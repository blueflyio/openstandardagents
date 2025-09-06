# OSSA Platform API v0.1.8

**Single Source of Truth** - OpenAPI 3.1.0 specification for all OSSA platform operations.

## 🎯 API-First Architecture

This API specification serves as the **contract** between all platform components:

```
api/openapi.yaml → Consumed by:
├── cli/              # CLI client operations
├── services/         # Microservices implementation  
├── web/              # Web dashboard (future)
├── mobile/           # Mobile apps (future)
└── integrations/     # Third-party integrations
```

## 🏷️ Tag-Based Organization

Operations are organized by audience and use case:

### **Public Operations** (`public`)
- `/health` - System health check
- `/docs` - API documentation
- `/version` - Version information

### **CLI Operations** (`cli`)
- `/cli/agents/generate` - Generate agent configurations
- `/cli/agents/validate` - Validate agent specs
- `/cli/services/start` - Service management

### **Agent Operations** (`agents`)
- `/agents` - Agent CRUD operations
- `/agents/{id}/discover` - UADP discovery
- `/agents/{id}/health` - Agent health checks

### **Orchestration Operations** (`orchestration`)
- `/workflows` - Workflow management
- `/workflows/{id}/execute` - Execute workflows
- `/coordination` - Multi-agent coordination

### **Admin Operations** (`admin`)
- `/admin/users` - User management
- `/admin/compliance` - Compliance reporting
- `/admin/metrics` - System metrics

### **Internal Operations** (`internal`)
- `/internal/sync` - Service-to-service sync
- `/internal/events` - Event publishing
- `/internal/discovery` - Service discovery

## 🔐 Access Control

Different consumers get different access levels:

```yaml
# CLI gets admin scope for management operations
security:
  - oauth2: [cli, admin]

# Public endpoints require no auth
security: []

# Internal endpoints require service tokens
security:
  - serviceToken: []
```

## 🛠️ Code Generation

Generate targeted clients for each consumer:

```bash
# Generate CLI client (cli + admin operations)
npm run api:generate:cli

# Generate service client (internal operations)  
npm run api:generate:services

# Generate public client (public operations only)
npm run api:generate:public
```

## 📊 OSSA v0.1.8 Compliance

The API implements full OSSA v0.1.8 specifications:

- **Universal Agent Discovery Protocol (UADP)**
- **Agent Capability Discovery Language (ACDL)**  
- **Multi-framework Integration** (LangChain, CrewAI, OpenAI, MCP)
- **Enterprise Compliance** (ISO 42001, NIST AI RMF, EU AI Act)
- **GraphQL + REST** dual API support
- **Real-time Subscriptions** for agent monitoring

## 🚀 Development

```bash
# Validate API specification
npm run api:validate

# Generate documentation  
npm run api:docs

# Start mock server for testing
npm run api:mock

# Deploy API specification
npm run api:deploy
```

## 🔄 Versioning

- **Semantic Versioning**: Major.Minor.Patch
- **Backward Compatibility**: Maintained within major versions
- **Deprecation Policy**: 6-month notice for breaking changes
- **API Evolution**: New operations added via tags

The API specification is the single source of truth that defines all capabilities of the OSSA platform. All components must implement and consume this specification consistently.