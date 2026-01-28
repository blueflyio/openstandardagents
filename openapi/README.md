# OSSA OpenAPI Specifications

OpenAPI 3.1 specifications for OSSA core APIs and reference implementations.

## Structure

### `/core` - Core OSSA APIs
Standard APIs that define the OSSA specification:
- `ossa-core-api.openapi.yaml` - Core OSSA runtime API
- `ossa-registry-api.openapi.yaml` - Agent registry API
- `ossa-registry.openapi.yaml` - Registry service specification
- `unified-agent-gateway.openapi.yaml` - Gateway API for agent orchestration

### `/reference-implementations` - Example Implementations
Reference implementations showing OSSA integration patterns:
- `drupal-agent-api.openapi.yaml` - Drupal CMS integration
- `helm-generator.openapi.yaml` - Kubernetes Helm chart generator
- `self-evolving-ecosystem.openapi.yaml` - Self-evolving agent system

## Internal APIs

Internal project infrastructure APIs are located in `.gitlab/docs/infrastructure/openapi/`

## Version

Current version: **0.2.5-RC**

## Usage

Validate specs:
```bash
npm run validate:openapi
```

Generate types:
```bash
npm run gen:types
```

## Standards

All OpenAPI specs follow:
- OpenAPI 3.1 specification
- JSON Schema Draft 2020-12
- OSSA naming conventions
- Semantic versioning
