# BlueFly Agent Ecosystem - Architecture

**Status**: Standardization in Progress
**Date**: 2026-02-03

## Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                    OSSA (openstandardagents)                │
│  @bluefly/openstandardagents                                │
│                                                             │
│  Purpose: Agent Creation & Curation Tool                   │
│  - CLI for creating OSSA-compliant manifests               │
│  - Validation against OSSA spec                             │
│  - Code generation (export to platforms)                    │
│  - Cost estimation                                          │
│  - Migration between versions                               │
│                                                             │
│  NOT responsible for:                                       │
│  ❌ Runtime execution                                       │
│  ❌ Agent registration/discovery                            │
│  ❌ Platform orchestration                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ depends on (types, validation)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              agent-registry (agent-platform)                │
│  @bluefly/agent-platform                                    │
│                                                             │
│  Purpose: Agent Registration & Discovery                    │
│  - Registry API (publish/discover agents)                  │
│  - Agent Router (route to execution platforms)             │
│  - Runtime orchestration                                    │
│  - Webhook server for GitLab integration                   │
│  - Knowledge Graph (Qdrant integration)                    │
│  - Metrics and observability                                │
│                                                             │
│  Depends on OSSA for:                                       │
│  ✅ OSSA types (@bluefly/openstandardagents)               │
│  ✅ Manifest validation                                     │
│  ✅ Schema definitions                                      │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ references
                              │
┌─────────────────────────────────────────────────────────────┐
│                    platform-agents                          │
│  (Templates & Examples Repository)                          │
│                                                             │
│  Purpose: Production Templates & Best Practices             │
│  - Platform-specific templates (Claude, OpenAI, etc.)      │
│  - Token optimization examples                              │
│  - Use-case specific examples                               │
│  - Best practices documentation                             │
│                                                             │
│  NOT a package - just a repository of templates             │
│  Referenced by OSSA wizard for template discovery           │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Agent Creation Flow

```
1. Developer uses OSSA CLI
   ↓
2. ossa init --interactive
   → References platform-agents templates (metadata only)
   → Guides user to appropriate template
   ↓
3. ossa validate agent.ossa.yaml
   → Uses OSSA validation service
   ↓
4. ossa estimate agent.ossa.yaml
   → Cost projection before deployment
   ↓
5. ossa export agent.ossa.yaml --format kubernetes
   → Generate deployment artifacts
```

### Agent Registration Flow

```
1. Agent created with OSSA CLI
   ↓
2. Developer publishes to registry
   → POST /api/v1/registry/agents
   ↓
3. agent-platform validates manifest
   → Uses @bluefly/openstandardagents validation
   ↓
4. Stored in registry
   → Available for discovery
   ↓
5. Other developers discover
   → GET /api/v1/registry/agents?tag=code-review
```

### Agent Execution Flow (NOT OSSA's job)

```
1. Agent discovered in registry
   ↓
2. agent-router selects execution platform
   ↓
3. Platform executes agent
   ↓
4. Results routed back
```

## Package Dependencies

```
@bluefly/openstandardagents (OSSA)
├─ NO external dependencies on our packages
└─ Publishes types, validation, generation

@bluefly/agent-platform (agent-registry)
├─ Depends on: @bluefly/openstandardagents
├─ Depends on: @bluefly/agent-router
└─ Uses OSSA types and validation

@bluefly/sdk-registry (NEW - to be built)
├─ Depends on: @bluefly/openstandardagents (types only)
└─ Client SDK for registry API
```

## What Lives Where

### OSSA (openstandardagents)

✅ **Lives here**:

- CLI commands (init, validate, estimate, export, migrate)
- OSSA specification schemas (v0.2.x - v0.4.x)
- Type definitions (OssaAgent, etc.)
- Validation services
- Code generation (export to platforms)
- Cost estimation
- Migration tools
- **Template metadata** (references to platform-agents)

❌ **Does NOT live here**:

- Full templates (those are in platform-agents)
- Registry API
- Runtime execution
- Agent router
- Webhook handlers

### agent-platform (agent-registry)

✅ **Lives here**:

- Registry API (Express server)
- Agent discovery endpoints
- Webhook server (GitLab integration)
- Knowledge Graph integration
- Agent Router integration
- Metrics and observability
- Runtime orchestration

❌ **Does NOT live here**:

- OSSA CLI commands
- Manifest validation logic (imports from OSSA)
- Schema definitions (imports from OSSA)
- Templates (references platform-agents)

### platform-agents (templates repo)

✅ **Lives here**:

- Platform templates (claude/, openai/, etc.)
- Use-case examples
- Token optimization examples
- Best practices docs

❌ **Does NOT live here**:

- Any executable code
- CLI tools
- APIs

## Standardization Needed

### 1. Template Management

**Current state**: Templates scattered
**Target state**:

- Templates in `platform-agents`
- Metadata catalog in OSSA (references only)
- agent-registry can query OSSA for template info

### 2. SDK Registry Package

**Current state**: Empty stub
**Target state**:

- Client SDK for registry API
- Imports types from OSSA
- Used by other tools to publish/discover agents

### 3. Version Alignment

**Current state**: Multiple version numbers
**Target state**:

- OSSA: v0.4.1 (about to release)
- agent-platform: v0.1.0 (depends on OSSA v0.4.x)
- Templates: No version (just git tags)

## Release Strategy

### v0.4.1 (IMMEDIATE - This Week)

**OSSA Only**:

- ✅ Cost estimation tool (DONE)
- ✅ All tests passing (DONE)
- ✅ No breaking changes (DONE)

Ship it NOW. Don't wait.

### v0.5.0 (Next - 2-4 weeks)

**OSSA**:

- Enhanced wizard with template discovery
- Dev server with hot reload
- Test harness with mocking
- Playground (browser-based)

**agent-platform**:

- Update to use OSSA v0.4.1
- Registry SDK completion
- Better template management

### Post-v0.5.0

- Full standardization across all packages
- Unified documentation
- Integration testing between packages

## Quick Decision Matrix

**Where does X belong?**

| Feature               | OSSA          | agent-platform | platform-agents |
| --------------------- | ------------- | -------------- | --------------- |
| Manifest validation   | ✅            | Uses OSSA      | -               |
| Cost estimation       | ✅            | -              | -               |
| Template creation     | -             | -              | ✅              |
| Template discovery    | Metadata only | -              | ✅              |
| Agent registration    | -             | ✅             | -               |
| Agent execution       | -             | ✅             | -               |
| Router logic          | -             | ✅             | -               |
| Knowledge Graph       | -             | ✅             | -               |
| GitLab webhooks       | -             | ✅             | -               |
| Best practices docs   | -             | -              | ✅              |
| Optimization examples | -             | -              | ✅              |

## Immediate Actions

1. ✅ **DONE**: Cost estimation in OSSA
2. **NOW**: Release OSSA v0.4.1
3. **NEXT**: Update agent-platform to use OSSA v0.4.1
4. **THEN**: Build registry SDK properly
5. **LATER**: Full standardization

---

**Status**: Ready to release v0.4.1
**Blocker**: None
**Action**: Ship it
