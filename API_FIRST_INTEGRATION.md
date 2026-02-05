# API-First Integration: openstandardagents ↔ compliance-engine

## Current State (Phase 2)

**Manual Type Definitions** in `src/interfaces/governance-provider.interface.ts`
- Types manually written to match planned OpenAPI spec
- Maintained in sync with CEDAR_GOVERNANCE_IMPLEMENTATION_PLAN.md
- ⚠️ Risk: Type drift if compliance-engine API changes

## Target State (After Phase 1)

**Generated Types from OpenAPI Spec** - TRUE API-FIRST

### Option 1: Direct Generation (Recommended)

Once compliance-engine publishes its OpenAPI spec:

```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types from compliance-engine OpenAPI spec
npx openapi-typescript \
  https://compliance-engine.bluefly.svc.cluster.local:3001/openapi.json \
  --output src/generated/compliance-engine-api.ts

# Or from published package
npx openapi-typescript \
  node_modules/@bluefly/compliance-engine/openapi/cedar-provider.openapi.yaml \
  --output src/generated/compliance-engine-api.ts
```

**Update imports**:
```typescript
// BEFORE (manual types)
import type {
  GovernanceConfig,
  ComplianceResult
} from '../interfaces/governance-provider.interface.js';

// AFTER (generated types)
import type { components } from '../generated/compliance-engine-api.js';

type GovernanceConfig = components['schemas']['GovernanceConfig'];
type ComplianceResult = components['schemas']['ComplianceResult'];
type AuthorizationRequest = components['schemas']['AuthorizationRequest'];
```

**Add to package.json**:
```json
{
  "scripts": {
    "generate:types": "openapi-typescript https://compliance-engine:3001/openapi.json -o src/generated/compliance-engine-api.ts",
    "prebuild": "npm run generate:types"
  }
}
```

### Option 2: Shared Types Package

compliance-engine publishes types as separate package:

```bash
# compliance-engine publishes
@bluefly/compliance-engine-types

# openstandardagents consumes
npm install @bluefly/compliance-engine-types
```

```typescript
import type {
  GovernanceConfig,
  ComplianceResult,
  AuthorizationRequest
} from '@bluefly/compliance-engine-types';
```

### Option 3: OpenAPI Schema Registry

Use schema registry pattern:

```yaml
# .ossa.config.yaml
governance:
  provider: cedar
  cedar:
    endpoint: ${COMPLIANCE_ENGINE_URL}
    openapi_spec: ${COMPLIANCE_ENGINE_URL}/openapi.json
    # Auto-generate types on startup
    auto_generate_types: true
```

## Migration Steps

### 1. When compliance-engine is ready

```bash
# Test API is accessible
curl ${COMPLIANCE_ENGINE_URL}/openapi.json

# Generate types
npm run generate:types
```

### 2. Update GovernanceClient

```typescript
// src/services/governance-client.service.ts
import type { components, operations } from '../generated/compliance-engine-api.js';

// Use operation types for requests/responses
type CheckComplianceRequest = operations['checkCompliance']['requestBody']['content']['application/json'];
type CheckComplianceResponse = operations['checkCompliance']['responses']['200']['content']['application/json'];
```

### 3. Replace manual interfaces

```bash
# Delete manual types
rm src/interfaces/governance-provider.interface.ts

# Update imports everywhere
git grep "governance-provider.interface" | awk -F: '{print $1}' | xargs sed -i '' \
  "s|governance-provider.interface|../generated/compliance-engine-api|g"
```

### 4. Add CI validation

```yaml
# .gitlab-ci.yml
validate-types:
  stage: validate
  script:
    - npm run generate:types
    - git diff --exit-code src/generated/
  only:
    - merge_requests
```

## Benefits

✅ **Zero Type Drift** - Types always match API
✅ **Auto Documentation** - OpenAPI spec = source of truth
✅ **Breaking Change Detection** - Build fails if API changes
✅ **DRY** - Single source of truth
✅ **Refactoring Safety** - Type errors catch breaking changes

## Dependencies

**Requires compliance-engine to**:
1. Publish OpenAPI spec at `/openapi.json` endpoint
2. OR publish `@bluefly/compliance-engine-types` package
3. OR include `openapi/cedar-provider.openapi.yaml` in published package

## Validation

```bash
# Verify types match
npm run generate:types
npm run build
npm run test

# Check no manual types remain
! git grep "governance-provider.interface" src/
```

## Timeline

- ✅ **Phase 2 (Now)**: Manual types + documentation
- ⏳ **Phase 1**: compliance-engine implementation with OpenAPI spec
- 🎯 **Phase 2.1**: Replace manual types with generated types
- 🚀 **Phase 3**: CI enforcement of type sync

---

**Status**: Manual types in use. Ready to switch to generated types when compliance-engine publishes OpenAPI spec.
