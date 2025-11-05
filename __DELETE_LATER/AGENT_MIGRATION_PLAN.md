# OSSA v0.2.2 Agent Migration Plan

## Executive Summary

Found **70+ agent files** across the ecosystem, mostly in v1.0 format (`ossaVersion: '1.0'` with `agent: {}` structure). Target migration to OSSA v0.2.2 Kubernetes-style format (`apiVersion: ossa/v1`, `kind: Agent`, `metadata`, `spec`).

## Current State

### Format Distribution

- **v1.0 format**: 90% of agents (ossaVersion: '1.0' with agent: {})
- **v0.1.8/0.1.9**: 5% (mixed old formats)
- **Custom**: 5% (Drupal-specific formats)

### Key Repositories with Agents

1. `common_npm/agent-*` - 15+ npm packages
2. `agent-buildkit` - Buildkit agents
3. `common_npm/workflow-engine` - Workflow agents
4. `models/*` - Model-specific agents
5. `all_drupal_custom/modules` - Drupal integration agents

## Schema Extension Required

### Current Schema Support

- ✅ `extensions` at root level with `additionalProperties: true`
- ✅ `spec` level has `additionalProperties: true` (can add extensions within spec)
- ⚠️ Need proper structure for framework bridges

### Required Extensions Structure

```yaml
spec:
  extensions:
    kagent: # Kubernetes agent config
    buildkit: # Buildkit deployment config
    librachat: # Librechat tool definitions
    drupal: # Drupal module integration
    langchain: # Langchain tool wrapper
    crewai: # CrewAI agent role
    mcp: # MCP server configuration
    a2a: # Agent-to-Agent protocol
```

## Migration Strategy

### Phase 1: Schema Extension (2-3 hours)

Extend OSSA v0.2.2 schema to properly define framework bridge configurations:

1. Add ExtensionsDefinition to schema
2. Define structure for each framework bridge
3. Add validation rules
4. Update examples

### Phase 2: Migration Templates (1-2 hours)

Create conversion templates for v1.0 → v0.2.2:

1. Template for basic agents
2. Template for kagent deployment
3. Template for buildkit agents
4. Template for librachat integration
5. Template for Drupal agents

### Phase 3: Pilot Migration (4-6 hours)

Migrate representative agents first:

1. agent-protocol (simple, MCP-focused)
2. agent-brain (medium complexity)
3. k8s-troubleshooter from examples (kagent)
4. One workflow agent (orchestration)

### Phase 4: Bulk Migration (8-12 hours)

Automate conversion for remaining 65+ agents:

1. Create migration script
2. Batch convert all v1.0 agents
3. Manual review for framework-specific configs
4. Validate each converted agent

### Phase 5: Testing & Integration (6-8 hours)

Test framework integrations:

1. kagent deployment
2. buildkit generation
3. librachat tool exposure
4. Drupal module loading
5. Cross-framework compatibility

## Implementation Command

To implement this migration:

```bash
# 1. Extend schema
cd /Users/flux423/Sites/LLM/OSSA
# Edit spec/v0.2.2/ossa-0.2.2.schema.json

# 2. Create templates
# Create migration templates directory

# 3. Pilot migration
# Migrate 3-4 representative agents

# 4. Validate
npm run test

# 5. Bulk migration
# Create and run migration script

# 6. Testing
# Test with each framework
```

## Estimated Total Time: 20-30 hours

## Risk Assessment

- **Low Risk**: Schema extension, basic migrations
- **Medium Risk**: Framework integration compatibility
- **High Risk**: Breaking changes to existing agent deployments

## Recommended Next Steps

1. **Approve schema extension design** - Review proposed extensions structure
2. **Create 3 pilot agents** - Migrate and test before bulk migration
3. **Validate framework integrations** - Ensure kagent, buildkit, librachat all work
4. **Automate bulk migration** - Create script once pilot proves successful
5. **Gradual rollout** - Migrate by repository, not all at once

## Files Created

- `agent-migration-audit.md` - Detailed audit of case found
- This file - Migration plan and next steps
