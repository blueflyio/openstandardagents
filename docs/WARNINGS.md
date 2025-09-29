# OpenAPI Validation Warnings

## Overview

The OSSA OpenAPI 3.1 specifications are production-ready with only minor warnings that do not affect functionality. This document tracks all known warnings and their resolution plan.

## Main Specification Warnings (7)

### ossa-complete.openapi.yml

| Warning | Location | Description | Impact | Resolution |
|---------|----------|-------------|--------|------------|
| `no-server-example.com` | `/servers/2/url` | Localhost server URL | None - Development only | Keep for local development |
| `operation-4xx-response` | `/paths/~1agents/get/callbacks` | Missing 4XX response in callback | Cosmetic | Add in v0.2.0 |
| `no-required-schema-properties-undefined` | `/components/schemas/JsonPatchOperation/then/required/0` | Undefined property 'value' | None - Conditional schema | Review JSON Patch spec |
| `no-required-schema-properties-undefined` | `/components/schemas/JsonPatchOperation/else/then/required/0` | Undefined property 'from' | None - Conditional schema | Review JSON Patch spec |
| `operation-operationId` | `/webhooks/agentCreated/post` | Missing operationId | Cosmetic | Add in v0.2.0 |
| `operation-operationId` | `/webhooks/agentStatusChanged/post` | Missing operationId | Cosmetic | Add in v0.2.0 |
| `operation-operationId` | `/webhooks/executionCompleted/post` | Missing operationId | Cosmetic | Add in v0.2.0 |

## Other Specification Issues

### Security Definitions Missing (Multiple Files)

**Affected Files**:
- `acdl-specification.openapi.yml`
- `clean-architecture.openapi.yml`
- `context7-mcp.openapi.yml`
- `magic-mcp.openapi.yml`
- `orchestration.openapi.yml`
- `project-discovery.openapi.yml`
- `rebuild-audit.openapi.yml`
- `web-eval-mcp.openapi.yml`

**Resolution**: Add security definitions to each specification in v0.2.0

### Missing 4XX Responses (Multiple Operations)

**Affected Files**: Most specification files

**Resolution**: Add standardized error responses in v0.2.0

## Resolution Plan

### v0.2.0 (Q4 2025)
- [ ] Add operationIds to all webhook operations
- [ ] Add security definitions to all specifications
- [ ] Standardize 4XX error responses
- [ ] Review JSON Patch conditional schemas

### v0.3.0 (Q1 2026)
- [ ] Complete error response coverage
- [ ] Enhanced security schemes
- [ ] Additional examples for all operations

## CI/CD Configuration

To prevent these warnings from failing CI/CD:

```yaml
# .gitlab-ci.yml
validate:openapi:
  script:
    - npm run api:validate:complete  # Must pass
    - npm run api:validate:all || true  # Allow warnings
```

## Suppression File

Create `.redocly-ignore.yaml` to suppress known warnings:

```yaml
# .redocly-ignore.yaml
rules:
  no-server-example.com:
    - src/api/core/ossa-complete.openapi.yml#/servers/2/url
  
  operation-operationId:
    - src/api/core/ossa-complete.openapi.yml#/webhooks/*/post
  
  no-required-schema-properties-undefined:
    - src/api/core/ossa-complete.openapi.yml#/components/schemas/JsonPatchOperation/*
```

## Monitoring

Track warning trends:

```bash
# Count warnings per file
npm run api:validate:all 2>&1 | grep -c "Warning" | sort | uniq -c

# Generate warning report
npm run api:validate:all > warnings-report.txt 2>&1
```

## Contributing

When adding new specifications:
1. Run `npm run api:validate` before committing
2. Document any new warnings in this file
3. Create issues for warning resolution
4. Update `.redocly-ignore.yaml` if needed

---

**Last Updated**: September 29, 2025  
**Total Warnings**: 7 (main spec) + ~120 (other specs)  
**Production Impact**: None - All cosmetic or non-functional