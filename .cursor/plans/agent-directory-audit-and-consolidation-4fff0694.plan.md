<!-- 4fff0694-1c83-4f3b-8f32-401fb2ce4c1d 617b2814-85c0-4cf2-8013-ce0750e76c67 -->
# Agent Directory Audit and Consolidation Plan

## Overview

Comprehensive refactoring to unify agent definitions across all platforms (GitLab, Claude, Cursor, GitHub) with consistent validation, OpenAPI specs, and CRUD operations using spec/v0.2.6.

## Current State Analysis

### Directory Structure

- **`.agents/`** - Empty (target location for unified agent definitions)
- **`.gitlab/agents/`** - 10 agent manifests (version-manager, security-scanner, config-validator, compliance-auditor, cost-analyzer, performance-optimizer, db-migrator, monitoring-agent, rollback-coordinator, pipeline-fixer)
- **`.claude/`** - Minimal config (swarm-config.json, settings.json, agents/README.md)
- **`.cursor/`** - Extensive config (commands, rules, hooks, plans, scripts, settings)
- **`.github/`** - CI/CD workflows (ci.yml, codeql.yml, dependabot, release.yml)
- **`.gitlab/`** - Comprehensive structure (agents, components, docs, release-automation, ci, templates)

### Issues Identified

1. Agent definitions scattered across platforms
2. No unified validation with Zod (only Ajv/JSON Schema)
3. Missing OpenAPI specs for some agents
4. Duplicate configuration patterns
5. No CRUD API for agent lifecycle management
6. Inconsistent agent metadata and structure

## Implementation Plan

### Phase 1: Schema and Validation Foundation

#### 1.1 Create Zod Schemas from OSSA v0.2.6

- **File**: `src/schemas/agent.zod.ts`
- Generate Zod schemas from `spec/v0.2.6/ossa-0.2.6.schema.json`
- Create reusable validation functions
- Ensure type safety with TypeScript inference

#### 1.2 Update Validation Service

- **File**: `src/services/validation.service.ts`
- Add Zod validation alongside Ajv
- Create `validateWithZod()` method
- Maintain backward compatibility with existing Ajv validation

#### 1.3 Create Agent Config Zod Schemas

- **File**: `src/schemas/agent-config.zod.ts`
- Define Zod schemas for:
  - GitLab agent configs
  - Claude swarm configs
  - Cursor agent configs
  - GitHub workflow configs
- Ensure all configs validate against OSSA v0.2.6

### Phase 2: Unified Agent Structure

#### 2.1 Populate `.agents/` Directory

- **Structure**: `.agents/{agent-name}/manifest.ossa.yaml`
- Migrate all 10 agents from `.gitlab/agents/` to `.agents/`
- Ensure all use `apiVersion: ossa/v0.2.6`
- Standardize metadata, labels, and annotations
- Add OpenAPI spec references

#### 2.2 Create Agent Registry

- **File**: `.agents/registry.yaml`
- Central registry of all agents with metadata
- Links to manifests, OpenAPI specs, and platform configs
- Enables agent discovery and CRUD operations

#### 2.3 Platform-Specific Configs

- **Structure**: `.agents/{agent-name}/platforms/{platform}.yaml`
- Separate platform configs (gitlab, claude, cursor, github)
- Reference main manifest in `.agents/{agent-name}/manifest.ossa.yaml`
- Follow DRY principle - single source of truth

### Phase 3: OpenAPI Integration

#### 3.1 Create/Update OpenAPI Specs

- **Location**: `openapi/agents/{agent-name}.openapi.yaml`
- Create OpenAPI 3.1 specs for all 10 agents
- Use OSSA extensions (`x-ossa`, `x-agent`)
- Link capabilities to OpenAPI operations
- Reference tools and LLM configs

#### 3.2 OpenAPI Spec Generator

- **File**: `src/services/openapi-generator.service.ts`
- Generate OpenAPI specs from OSSA manifests
- Ensure bidirectional sync (manifest ↔ OpenAPI)
- Validate OpenAPI specs against OSSA extensions schema

#### 3.3 Update Existing OpenAPI Specs

- **Files**: 
  - `.gitlab/docs/infrastructure/openapi/gitlab-agent.openapi.yaml`
  - `.gitlab/docs/infrastructure/openapi/gitlab-orchestrator.openapi.yaml`
  - `.gitlab/docs/infrastructure/openapi/release-automation.openapi.yaml`
- Ensure they reference OSSA v0.2.6
- Add missing OSSA extensions
- Validate against OSSA OpenAPI extensions schema

### Phase 4: CRUD Operations

#### 4.1 Agent CRUD Service

- **File**: `src/services/agent-crud.service.ts`
- Extend `BaseCrudService` pattern
- Implement full CRUD for agents:
  - Create: Register new agent
  - Read: Get agent by ID
  - Update: Update agent config
  - Delete: Remove agent
  - List: Query agents with filters
- Use Zod for input validation

#### 4.2 Agent Repository

- **File**: `src/repositories/agent.repository.ts`
- Load agents from `.agents/` directory
- Support multiple formats (YAML, JSON)
- Cache agent definitions
- Support agent discovery and filtering

#### 4.3 Agent Registry API

- **File**: `openapi/core/agent-registry.openapi.yaml`
- Define REST API for agent CRUD operations
- Use existing `ossa-registry.openapi.yaml` as base
- Add agent-specific endpoints
- Ensure OpenAPI-first approach

### Phase 5: Consolidation and Refinement

#### 5.1 Consolidate Platform Configs

- **`.claude/`**: Keep minimal config, reference `.agents/` manifests
- **`.cursor/`**: Update commands to use `.agents/` directory
- **`.github/`**: Add agent validation to CI workflows
- **`.gitlab/`**: Update agent references to point to `.agents/`

#### 5.2 Remove Duplicates

- Consolidate duplicate agent definitions
- Remove redundant configs
- Keep platform-specific configs minimal (reference main manifest)

#### 5.3 Update Documentation

- **File**: `.gitlab/docs/agents/README.md`
- Document new unified structure
- Update agent discovery process
- Add migration guide from old structure

### Phase 6: Native Integration

#### 6.1 GitLab Agent Integration

- Update `.gitlab/agents/` to reference `.agents/` manifests
- Ensure GitLab Kubernetes agents use unified manifests
- Update mesh-config.yaml to reference new structure

#### 6.2 Claude Integration

- Update `.claude/swarm-config.json` to reference `.agents/`
- Ensure Claude agents can discover agents from unified location

#### 6.3 Cursor Integration

- Update `.cursor/commands/` to use `.agents/` directory
- Add validation commands that use Zod schemas
- Update hooks to validate agents on edit

#### 6.4 GitHub Integration

- Add agent validation to GitHub Actions
- Ensure workflows can discover agents from `.agents/`

### Phase 7: Validation and Testing

#### 7.1 Validation Scripts

- **File**: `scripts/validate-all-agents.ts`
- Validate all agents in `.agents/` against OSSA v0.2.6
- Use both Ajv and Zod validation
- Report all errors and warnings

#### 7.2 Integration Tests

- **File**: `tests/integration/agents/agent-crud.test.ts`
- Test CRUD operations
- Test agent discovery
- Test validation with Zod

#### 7.3 OpenAPI Validation

- Validate all OpenAPI specs
- Ensure OSSA extensions are correct
- Test OpenAPI ↔ Manifest sync

## File Structure After Refactoring

```
.agents/
├── registry.yaml                    # Central agent registry
├── version-manager/
│   ├── manifest.ossa.yaml          # OSSA v0.2.6 manifest
│   ├── platforms/
│   │   ├── gitlab.yaml            # GitLab-specific config
│   │   └── claude.yaml             # Claude-specific config
│   └── README.md
├── security-scanner/
│   ├── manifest.ossa.yaml
│   └── platforms/
├── ... (all 10 agents)

.gitlab/agents/                      # Symlinks or references to .agents/
.claude/agents/                      # References to .agents/
.cursor/agents/                      # References to .agents/

openapi/agents/                      # OpenAPI specs for all agents
src/
├── schemas/
│   ├── agent.zod.ts                # Zod schemas from OSSA v0.2.6
│   └── agent-config.zod.ts         # Platform config schemas
├── services/
│   ├── agent-crud.service.ts       # CRUD operations
│   └── openapi-generator.service.ts # OpenAPI generation
└── repositories/
    └── agent.repository.ts          # Agent discovery and loading
```

## Success Criteria

1. All agents in `.agents/` directory with unified structure
2. All agents validate against OSSA v0.2.6 using Zod
3. All agents have OpenAPI 3.1 specs with OSSA extensions
4. CRUD API implemented and tested
5. No duplicate agent definitions
6. Platform configs reference unified manifests (DRY)
7. All validation passes (Ajv + Zod)
8. Documentation updated

## Dependencies

- OSSA Schema: `spec/v0.2.6/ossa-0.2.6.schema.json`
- Existing: `src/services/release-automation/base-crud.service.ts`
- Existing: `src/services/validation.service.ts`
- Existing: `openapi/core/ossa-registry.openapi.yaml`