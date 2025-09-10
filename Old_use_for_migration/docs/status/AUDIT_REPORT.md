# OSSA Folder Structure Audit Report

## Current State Analysis

### ✅ What's Good
1. **Core directories exist**: api/, cli/, docs/, examples/, tests/
2. **OSSA compliance**: .agents/ and .agents-workspace/ directories present
3. **Extensions support**: OpenMP extension properly structured
4. **Services architecture**: Microservices approach in services/
5. **Documentation**: Comprehensive docs/ structure

### ❌ Issues Found

#### 1. **Inconsistent with Proposed Structure**
- Missing `v0.1.8/` versioned directory for schemas
- Schemas scattered (api/schemas/, cli/schemas/) instead of centralized
- No dedicated `compliance/` directory for FedRAMP, NIST, ISO standards
- Missing `registry/` for agent and capability registries
- No `validators/` directory at root level

#### 2. **Organizational Problems**
- Services directory seems overly complex for OSSA spec project
- Examples folder has inconsistent numbering (00-13)
- Multiple legacy folders (orchestration-legacy)
- Config scattered between root config/ and cli/schemas/

#### 3. **Missing Critical Components**
- No GraphQL schema at spec level
- Missing compliance framework mappings
- No capability registry
- Validators embedded in code rather than standalone

## Proposed Restructuring Plan

### Phase 1: Create Proper OSSA Specification Structure

```bash
OSSA/
├── v0.1.8/                        # Version-specific specifications
│   ├── schemas/                   # All JSON schemas
│   │   ├── agent.schema.json     
│   │   ├── api.schema.json       
│   │   ├── capability.schema.json
│   │   ├── compliance.schema.json
│   │   └── workspace.schema.json
│   ├── openapi/                   # OpenAPI specifications
│   │   └── ossa-api.yaml         
│   ├── graphql/                   # GraphQL schemas
│   │   └── schema.graphql        
│   └── examples/                  # Specification examples
│       ├── agent-manifest.yaml
│       └── workspace-config.yaml
```

### Phase 2: Add Compliance & Registry

```bash
OSSA/
├── compliance/                    # Compliance frameworks
│   ├── fedramp/
│   │   ├── mapping.yaml
│   │   └── controls.json
│   ├── nist-800-53/
│   │   ├── mapping.yaml
│   │   └── controls.json
│   ├── iso-42001/
│   │   ├── mapping.yaml
│   │   └── requirements.json
│   └── eu-ai-act/
│       ├── mapping.yaml
│       └── requirements.json
├── registry/                      # Central registries
│   ├── agents.registry.json
│   ├── capabilities.registry.json
│   └── frameworks.registry.json
├── validators/                    # Standalone validators
│   ├── agent-validator.ts
│   ├── api-validator.ts
│   ├── compliance-validator.ts
│   └── workspace-validator.ts
```

### Phase 3: Reorganize Existing Content

#### Move Operations:
1. `api/schemas/*` → `v0.1.8/schemas/`
2. `cli/schemas/v0.1.8/*` → `v0.1.8/schemas/`
3. `lib/validation/*` → `validators/`
4. `config/ossa/*` → `v0.1.8/config/`

#### Archive/Remove:
1. `services/orchestration-legacy/` → Archive
2. Consolidate duplicate validation code
3. Clean up numbered examples to logical names

### Phase 4: Enhance CLI Integration

```bash
OSSA/
├── cli/                          # Enhanced CLI
│   ├── src/
│   │   ├── commands/
│   │   │   ├── agent-management.ts
│   │   │   ├── workspace-management.ts
│   │   │   ├── validate.ts
│   │   │   └── registry.ts
│   │   └── index.ts
│   ├── bin/
│   │   └── ossa
│   └── package.json
```

## Implementation Steps

### Step 1: Backup Current Structure
```bash
tar -czf ossa-backup-$(date +%Y%m%d).tar.gz .
```

### Step 2: Create New Structure
```bash
# Create versioned spec directory
mkdir -p v0.1.8/{schemas,openapi,graphql,examples}

# Create compliance structure
mkdir -p compliance/{fedramp,nist-800-53,iso-42001,eu-ai-act}

# Create registry
mkdir -p registry

# Create validators
mkdir -p validators
```

### Step 3: Migrate Schemas
```bash
# Consolidate all schemas
cp api/schemas/*.json v0.1.8/schemas/
cp cli/schemas/v0.1.8/*.json v0.1.8/schemas/

# Move OpenAPI spec
cp api/openapi.yaml v0.1.8/openapi/ossa-api.yaml
```

### Step 4: Create Missing Components

#### 4.1 GraphQL Schema
Create `v0.1.8/graphql/schema.graphql` with complete OSSA GraphQL spec

#### 4.2 Compliance Mappings
Create mapping files for each compliance framework

#### 4.3 Central Registries
- Agent registry with all registered agents
- Capability registry with standardized capabilities
- Framework registry with supported frameworks

### Step 5: Update Documentation
- Update README.md with new structure
- Update FOLDER_STRUCTURE.md
- Create migration guide for existing users

## Benefits of Restructuring

1. **Clear Versioning**: Explicit v0.1.8 directory for current spec
2. **Centralized Schemas**: All schemas in one location
3. **Compliance Ready**: Direct mapping to compliance frameworks
4. **Registry Management**: Central source of truth for agents/capabilities
5. **Standalone Validators**: Reusable validation components
6. **Clean Separation**: Spec vs implementation vs examples

## Risk Mitigation

1. **Backward Compatibility**: Maintain symlinks during transition
2. **Gradual Migration**: Phase approach to minimize disruption
3. **Documentation**: Clear migration guide
4. **Testing**: Comprehensive tests before/after migration
5. **Rollback Plan**: Backup allows quick restoration

## Timeline

- **Phase 1**: 2 hours - Create spec structure
- **Phase 2**: 3 hours - Add compliance & registry
- **Phase 3**: 4 hours - Reorganize content
- **Phase 4**: 2 hours - CLI enhancement
- **Testing**: 2 hours - Validate all changes
- **Documentation**: 1 hour - Update docs

**Total Estimated Time**: 14 hours

## Success Criteria

1. All schemas consolidated in v0.1.8/schemas/
2. Compliance frameworks properly mapped
3. Central registries operational
4. CLI commands functional
5. All tests passing
6. Documentation updated

## Next Actions

1. Review and approve restructuring plan
2. Schedule maintenance window
3. Create backup
4. Execute Phase 1
5. Validate and proceed with subsequent phases