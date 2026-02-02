# OSSA Platform - Consolidated Action Items

**Status**: Active Development
**Last Updated**: 2026-01-26
**Source Files**: OSSA-BAT.md, RECOVERY-PLAN.md, runtime-map.md

---

## Executive Summary

This document consolidates three critical planning documents into a unified action plan for the OSSA (Open Standard for Software Agents) platform. It merges specification details, recovery tasks, and runtime implementation strategies into a cohesive roadmap.

### Core Vision

> "OSSA is to AI Agents what OpenAPI is to REST APIs"
>
> Define your agent ONCE in OSSA. Run it on ANY platform.

---

## 1. OSSA Specification v0.3.6 Implementation

### 1.1 Core Specification Components

**Goal**: Maintain OSSA as a pure specification standard (like OpenAPI for REST APIs)

#### What OSSA IS
- ✅ Manifest schema standard (Agent, Task, Workflow)
- ✅ Capability taxonomy and access model
- ✅ 7-phase lifecycle specification
- ✅ Compliance framework (FedRAMP, HIPAA, GDPR, SOC2)
- ✅ Safety guardrails schema
- ✅ Observability requirements (OpenTelemetry)

#### What OSSA IS NOT
- ❌ Runtime implementation
- ❌ CLI tool
- ❌ Framework or SDK
- ❌ Deployment infrastructure

### 1.2 Repository Architecture (3-Tier Separation)

**CRITICAL**: Enforce strict separation of concerns

#### Tier 1: SPECIFICATION
- **Repository**: `gitlab.com/blueflyio/ossa/openstandardagents`
- **Purpose**: Defines the standard
- **Contains**:
  ```
  spec/
  ├── v0.3.6/
  │   ├── agent.schema.json
  │   ├── task.schema.json
  │   ├── workflow.schema.json
  │   └── capability.schema.json
  ├── examples/reference-agents/  # 6 reference implementations
  └── taxonomy.yaml
  ```
- **Does NOT contain**: Runtime code, production agents, website/, scripts/

#### Tier 2: MANIFESTS
- **Repository**: `gitlab.com/blueflyio/platform-agents`
- **Purpose**: Production agent manifests
- **Contains**:
  ```
  agents/
  ├── code-reviewer/manifest.ossa.yaml
  ├── ci-fixer/manifest.ossa.yaml
  ├── security-scanner/manifest.ossa.yaml
  └── ... (16 total agents)
  workflows/
  └── release-workflow.yaml
  ```
- **Does NOT contain**: Spec definitions, runtime code

#### Tier 3: RUNTIME
- **Repository**: `gitlab.com/blueflyio/ossa/lab/gitlab-agent_ossa`
- **Purpose**: Reference runtime implementation
- **Contains**:
  ```
  internal/ossa/
  ├── lifecycle/      # 7-phase implementation
  ├── capabilities/   # Capability handlers
  └── adapters/       # Platform adapters
  ossa/schemas/       # Tool schemas (17 tools)
  ```
- **Does NOT contain**: Spec definitions, agent manifests

### Action Items: Specification

- [ ] **CRITICAL**: Remove `website/` from openstandardagents repo (belongs in .org)
- [ ] **CRITICAL**: Migrate all `scripts/` folders to `src/` (violates no-shell-scripts rule)
- [ ] Publish `@ossa/spec` npm package (TypeScript types + validators)
- [ ] Publish `@ossa/conformance` test suite
- [ ] Document 6 reference agents in `spec/examples/reference-agents/`
- [ ] Create OpenAPI extensions for OSSA schemas
- [ ] Establish governance model (follows OpenAPI Foundation pattern)

---

## 2. Critical Recovery Tasks

### 2.1 Repository Cleanup

**ISSUE**: Previous session mixed files between two repositories and violated shell script prohibition

#### Problems Found

1. **Wrong Remote**: openstandardagents pointed to .org.git (FIXED)
2. **Mixed Content**: website/ exists in spec repo (WRONG)
3. **Rule Violations**: scripts/ folders in BOTH repos (45 files in openstandardagents, 23 in .org)
4. **Lost Work**: DRY migration work exists in commit `86ddf7f5ea` and needs recovery

### 2.2 Recovery Actions

#### Phase 1: Recover DRY Work (IMMEDIATE)
```bash
cd /Users/flux423/Sites/blueflyio/OssA/openstandardagents
git format-patch -1 86ddf7f5ea -o /tmp/dry-recovery/

cd /Users/flux423/Sites/blueflyio/OssA/openstandardagents.org
git checkout -b feature/dry-migration
git apply /tmp/dry-recovery/*.patch --3way
```

**Contains**:
- DRY reference generator with Zod validation
- scripts/ → src/ migration
- CI gates for no-symlinks, wrapper drift
- Agent wrapper manifests

#### Phase 2: Clean openstandardagents (FRAMEWORK)

1. **Remove website/ folder**:
   ```bash
   cd openstandardagents
   rm -rf website/
   git add -A
   git commit -m "fix: remove website/ - belongs in openstandardagents.org"
   ```

2. **Migrate scripts/ to src/**:
   | Current Location | New Location | Type |
   |------------------|--------------|------|
   | scripts/validate-schema.ts | src/cli/commands/validate/schema.ts | Validation |
   | scripts/gen-types.ts | src/cli/commands/generate/types.ts | Generation |
   | scripts/gen-zod.ts | src/cli/commands/generate/zod.ts | Generation |
   | scripts/version-sync.ts | src/cli/commands/sync/version.ts | Sync |
   | (remaining 38 files) | Categorize and migrate | Various |

#### Phase 3: Clean openstandardagents.org (WEBSITE)

1. **Apply recovered DRY work** from commit 86ddf7f5ea
2. **Migrate scripts/ to src/**:
   - Move TypeScript/JavaScript → `src/tools/` or `src/cli/`
   - **DELETE** shell scripts (.sh files)
   - Use BuildKit CLI patterns instead

3. **Verify agents intact**:
   ```bash
   find .gitlab/agents -name "*.ossa.yaml" | wc -l  # Should be 11+
   find .agents -name "*.ossa.yaml" | wc -l  # Should be 1+
   ```

### Action Items: Recovery

- [ ] **URGENT**: Recover DRY work from commit 86ddf7f5ea
- [ ] Remove website/ from openstandardagents
- [ ] Migrate openstandardagents/scripts/ (45 files) → src/
- [ ] Migrate openstandardagents.org/scripts/ (23 files) → src/
- [ ] Delete ALL .sh files (deploy-local.sh, expose-local-dev.sh)
- [ ] Verify all 12 agents in .gitlab/agents/ validate
- [ ] Run CI pipelines on both repos
- [ ] Update package.json to use new src/ paths

---

## 3. 7-Phase Lifecycle Implementation

### 3.1 Mandatory Lifecycle Specification

All OSSA-compliant runtimes MUST implement these phases in order:

```
INIT → NORM → RESOL → INFER → EXEC → PERSIST → EMIT
```

### 3.2 Phase Requirements

| Phase | Name | Must Implement | Purpose |
|-------|------|----------------|---------|
| 1 | **INIT** | Yes | Load manifest, validate schema, initialize context |
| 2 | **NORM** | Yes | Normalize input message format |
| 3 | **RESOL** | Yes | Resolve capabilities, verify permissions |
| 4 | **INFER** | Yes | Execute LLM inference |
| 5 | **EXEC** | Yes | Execute tool calls with guardrails |
| 6 | **PERSIST** | Yes | Persist state changes |
| 7 | **EMIT** | Yes | Emit traces, metrics, audit logs |

### 3.3 Required Telemetry

**Spans** (OpenTelemetry):
- `ossa.lifecycle` (attributes: phase, agent.name)
- `ossa.tool.execution` (attributes: tool.name, duration_ms)
- `ossa.llm.inference` (attributes: model, tokens.input, tokens.output)
- `ossa.a2a.message` (if A2A enabled)

**Metrics**:
- `ossa.agent.invocations` (Counter)
- `ossa.agent.latency` (Histogram, ms)
- `ossa.tool.errors` (Counter)
- `ossa.llm.tokens` (Counter)

### Action Items: Lifecycle

- [ ] Implement all 7 phases in gitlab-agent_ossa runtime
- [ ] Create TypeScript interfaces for each phase in `@ossa/adapter-core`
- [ ] Add phase validation to conformance test suite
- [ ] Document phase contracts with input/output schemas
- [ ] Implement OpenTelemetry span emissions
- [ ] Create metrics dashboards for phase monitoring

---

## 4. Platform Adapter Strategy

### 4.1 Universal Runtime Map

**Vision**: Write agent once in OSSA, deploy to ANY platform

### 4.2 Priority 0: Native Integrations

| Platform | Type | Status | Target |
|----------|------|--------|--------|
| **GitLab Duo Agent Platform** | AI Agents | Reference Implementation | Q1 2026 |
| **GitLab Kubernetes Agent** | Infrastructure | Reference Implementation | Q1 2026 |
| **kagent** | Kubernetes-native | Community Target | Q2 2026 |

### 4.3 Priority 1: Major Vendor SDKs

| Platform | Vendor | Status | Target |
|----------|--------|--------|--------|
| **OpenAI Agents SDK** | OpenAI | Planned | Q2 2026 |
| **Claude Agent SDK** | Anthropic | Planned | Q2 2026 |
| **Google ADK** | Google | Planned | Q3 2026 |
| **Microsoft Agent Framework** | Microsoft | Research | Q3 2026 |
| **AWS Strands** | AWS | Research | Q3 2026 |

### 4.4 Priority 2: Open Source Frameworks

| Platform | GitHub Stars | Status | Target |
|----------|--------------|--------|--------|
| **LangGraph** | Mature | Planned | Q2 2026 |
| **LangChain** | 100K+ | Planned | Q2 2026 |
| **CrewAI** | 40K+ | Community | Q3 2026 |
| **AutoGen/AG2** | 40K+ | Community | Q3 2026 |
| **Pydantic AI** | Growing | Community | Q4 2026 |

### 4.5 NPM Package Structure

```
@ossa/                          # CORE TEAM MAINTAINS
├── @ossa/spec                  # TypeScript types, JSON Schema, validators
├── @ossa/adapter-core          # Base adapter class, interfaces
├── @ossa/adapter-gitlab-duo    # Reference: GitLab Duo export
├── @ossa/adapter-gitlab-k8s    # Reference: GitLab K8s Agent
└── @ossa/conformance           # Conformance test suite

@ossa-community/                # COMMUNITY MAINTAINS
├── @ossa-community/adapter-openai
├── @ossa-community/adapter-anthropic
├── @ossa-community/adapter-langgraph
├── @ossa-community/adapter-langchain
├── @ossa-community/adapter-crewai
└── ... (anyone can contribute)
```

### Action Items: Adapters

- [ ] Create `@ossa/spec` package structure
- [ ] Create `@ossa/adapter-core` base class
- [ ] Implement `@ossa/adapter-gitlab-duo` reference adapter
- [ ] Implement `@ossa/adapter-gitlab-k8s` reference adapter
- [ ] Create adapter documentation and examples
- [ ] Establish community contribution guidelines
- [ ] Create adapter template repository
- [ ] Document export command: `ossa export --to <platform>`

---

## 5. Export Matrix Implementation

### 5.1 Export Command Strategy

```bash
# GitLab Duo External Agent
ossa export --to gitlab-duo --input manifest.ossa.yaml --output duo-config.yaml

# OpenAI Agents SDK
ossa export --to openai --input manifest.ossa.yaml --output agent.py

# Claude Agent SDK
ossa export --to anthropic --input manifest.ossa.yaml --output agent.ts

# LangGraph
ossa export --to langgraph --input manifest.ossa.yaml --output graph.py
```

### 5.2 Export Targets

| Target | Output Format | Maturity | Priority |
|--------|---------------|----------|----------|
| **gitlab-duo** | External Agent YAML | Reference | P0 |
| **gitlab-k8s** | K8s Agent Config | Reference | P0 |
| **openai** | Python/JS SDK | Planned | P1 |
| **anthropic** | TypeScript SDK | Planned | P1 |
| **langgraph** | Python StateGraph | Planned | P1 |
| **langchain** | Python Chain | Planned | P2 |
| **crewai** | Python Crew | Planned | P2 |

### Action Items: Export

- [ ] Design export plugin architecture
- [ ] Implement gitlab-duo exporter
- [ ] Implement gitlab-k8s exporter
- [ ] Create export template system
- [ ] Add validation for exported manifests
- [ ] Document export format specifications
- [ ] Create export unit tests

---

## 6. Safety & Compliance Framework

### 6.1 Deny-by-Default Capability Model

**MANDATORY**: All OSSA agents MUST use explicit allow-lists

```yaml
spec:
  capabilities:
    model: deny_by_default    # REQUIRED
    grants:
      - capability: filesystem-read
        scope: workspace
      - capability: gitlab-api
        scope: project
        constraints:
          project_id: "12345"
```

### 6.2 Safety Guardrails

**MANDATORY**: All agents must configure:

```yaml
spec:
  safety:
    guardrails:
      pii_detection:
        enabled: true
        action: redact        # redact | block | warn
      secrets_detection:
        enabled: true
        action: block
      prompt_injection:
        enabled: true
        action: block
    kill_switch:
      enabled: true
      trigger: manual         # manual | error_threshold | anomaly
```

### 6.3 Compliance Profiles

| Profile | Requirements | Implementation |
|---------|--------------|----------------|
| **FedRAMP** | Data residency, audit logging, access controls | Q2 2026 |
| **HIPAA** | PHI detection, encryption, BAA | Q3 2026 |
| **GDPR** | Data minimization, right to deletion | Q2 2026 |
| **SOC2** | Access logging, change management | Q2 2026 |

### Action Items: Safety

- [ ] Implement PII detection service
- [ ] Implement secrets detection (integrate with gitleaks)
- [ ] Implement prompt injection detection
- [ ] Create kill switch mechanism
- [ ] Define compliance profile schemas
- [ ] Implement audit logging system
- [ ] Create compliance validation tests

---

## 7. Protocol Integration

### 7.1 Supported Protocols

| Protocol | Status | Specification | Integration |
|----------|--------|---------------|-------------|
| **MCP** (Model Context Protocol) | Native | v0.3.6 | ✅ Complete |
| **A2A** (Agent-to-Agent) | Native | v0.3.6 | ✅ Complete |
| **AGENTS.md** | Context Source | v0.3.6 | ✅ Complete |
| **Agent Skills** (SKILL.md) | Portable Skills | v0.3.6 | 🔄 In Progress |

### 7.2 MCP Integration

```yaml
spec:
  tools:
    - type: mcp
      server: "@modelcontextprotocol/server-filesystem"
      transport: stdio
      config:
        allowedPaths:
          - /workspace
```

### 7.3 A2A Messaging

```yaml
spec:
  communication:
    protocol: a2a
    subscribes:
      - channel: "tasks.assigned"
        filter:
          agent_type: reviewer
    publishes:
      - channel: "review.complete"
```

### Action Items: Protocols

- [ ] Finalize MCP tool integration
- [ ] Implement A2A message broker
- [ ] Add AGENTS.md parser
- [ ] Add SKILL.md parser
- [ ] Create protocol integration tests
- [ ] Document protocol usage examples

---

## 8. Conformance & Certification

### 8.1 Conformance Requirements

| Requirement | Test Coverage | Status |
|-------------|---------------|--------|
| **7-Phase Lifecycle** | Phase execution tests | 🔄 In Progress |
| **Schema Validation** | JSON Schema tests | ✅ Complete |
| **Deny-by-Default** | Security test cases | 🔄 In Progress |
| **Observability** | Trace verification | 📝 Planned |
| **Error Handling** | Error contract tests | 📝 Planned |

### 8.2 Certification Levels

| Level | Requirements | Status |
|-------|--------------|--------|
| **Bronze** | 80% of required tests | Target: Q1 2026 |
| **Silver** | 100% of required tests | Target: Q2 2026 |
| **Gold** | Silver + security audit | Target: Q3 2026 |

### 8.3 Conformance Test Suite

```bash
npx @ossa/conformance test ./my-adapter

# Test categories:
# ✓ manifest-parsing     (10 fixtures)
# ✓ validation-errors    (15 cases)
# ✓ lifecycle-phases     (7 phase tests)
# ✓ capability-resolution (8 cases)
# ✓ guardrail-enforcement (12 cases)
# ✓ observability-emit   (5 cases)
# ○ streaming            (optional, 4 cases)
# ○ mcp-tools            (optional, 6 cases)
```

### Action Items: Conformance

- [ ] Create @ossa/conformance package
- [ ] Write lifecycle phase tests (7 tests)
- [ ] Write validation tests (15 cases)
- [ ] Write capability resolution tests (8 cases)
- [ ] Write guardrail enforcement tests (12 cases)
- [ ] Write observability tests (5 cases)
- [ ] Create conformance badge generator
- [ ] Document certification process

---

## 9. Reference Implementations

### 9.1 Six Perfect Examples

Located in `openstandardagents/spec/examples/reference-agents/`:

| Agent | Purpose | Demonstrates |
|-------|---------|--------------|
| **minimal** | Bare minimum valid agent | Basic schema compliance |
| **code-reviewer** | GitLab MR review | MCP tools, A2A messaging |
| **mcp-enabled** | Agent with MCP tools | MCP integration |
| **multi-capability** | Multiple capabilities | Capability management |
| **workflow-agent** | Workflow participation | Multi-agent orchestration |
| **a2a-enabled** | A2A communication | Agent-to-agent messaging |

### 9.2 Distinction from Production Agents

| Type | Location | Purpose |
|------|----------|---------|
| **Reference Agents** | `openstandardagents/spec/examples/` | Spec validation, learning |
| **Production Agents** | `platform-agents/agents/` | Real production deployments |

Reference agents are:
- ✅ Minimal but complete
- ✅ Fully schema-compliant
- ✅ Used by conformance tests
- ❌ NOT production-ready (lack credentials, integrations)

### Action Items: Reference Agents

- [ ] Complete all 6 reference agents
- [ ] Add inline documentation to each
- [ ] Create README for each reference agent
- [ ] Add to conformance test fixtures
- [ ] Validate against OSSA v0.3.6 schema
- [ ] Add to specification documentation

---

## 10. Governance & Community

### 10.1 Governance Model

**Pattern**: Follows OpenAPI Foundation governance

### 10.2 Core Team Responsibilities

- Maintain OSSA specification versions
- Publish `@ossa/spec` and `@ossa/conformance` packages
- Review and approve specification changes
- Maintain reference implementations

### 10.3 Community Responsibilities

- Build platform adapters (`@ossa-community/*`)
- Contribute specification improvements via RFC
- Report issues and edge cases
- Share implementations and patterns

### 10.4 Change Process

| Change Type | Process | Approval |
|-------------|---------|----------|
| Patch (bug fixes) | PR to spec repo | 1 Core Team member |
| Minor (new features) | RFC discussion | 2 Core Team members |
| Major (breaking) | RFC + 6-month deprecation | Core Team unanimous |

### Action Items: Governance

- [ ] Create RFC template
- [ ] Establish core team structure
- [ ] Create community contribution guide
- [ ] Set up specification versioning process
- [ ] Create deprecation policy
- [ ] Establish release cadence

---

## 11. Immediate Priorities (Next 30 Days)

### Week 1: Critical Recovery
- [ ] Recover DRY work from commit 86ddf7f5ea
- [ ] Remove website/ from openstandardagents
- [ ] Migrate scripts/ in both repos to src/
- [ ] Delete all .sh files

### Week 2: Specification Cleanup
- [ ] Validate all 6 reference agents
- [ ] Publish @ossa/spec v0.3.6
- [ ] Update separation of duties documentation
- [ ] Run CI pipelines on all repos

### Week 3: Runtime Foundation
- [ ] Complete 7-phase lifecycle in gitlab-agent_ossa
- [ ] Implement OpenTelemetry span emissions
- [ ] Add capability resolution logic
- [ ] Add guardrail enforcement

### Week 4: Adapter Framework
- [ ] Create @ossa/adapter-core package
- [ ] Implement gitlab-duo adapter
- [ ] Create adapter documentation
- [ ] Start conformance test suite

---

## 12. Success Criteria

### Repository Cleanliness
- [ ] openstandardagents has NO website/ folder
- [ ] openstandardagents has NO scripts/ folder
- [ ] openstandardagents.org has NO spec/ folder
- [ ] openstandardagents.org has NO scripts/ folder
- [ ] Both repos have all code in src/
- [ ] Zero shell scripts (.sh) in either repo

### Specification Completeness
- [ ] All 6 reference agents validate
- [ ] @ossa/spec published to npm
- [ ] @ossa/conformance published to npm
- [ ] Documentation complete and accurate
- [ ] CI pipelines pass on all repos

### Runtime Implementation
- [ ] 7-phase lifecycle fully implemented
- [ ] OpenTelemetry telemetry emitting
- [ ] Capability model enforcing deny-by-default
- [ ] Guardrails blocking unsafe operations
- [ ] gitlab-duo adapter exporting correctly

### Community Readiness
- [ ] RFC process documented
- [ ] Contribution guide published
- [ ] Community adapter template available
- [ ] Conformance test suite ready
- [ ] At least 1 community adapter started

---

## 13. Estimated Effort

| Category | Tasks | Estimated Time |
|----------|-------|----------------|
| **Recovery** | Recover DRY work, clean repos | 5 hours |
| **scripts/ Migration** | Migrate 68 files to src/ | 3 hours |
| **Specification** | Reference agents, docs | 2 days |
| **Runtime** | 7-phase lifecycle | 1 week |
| **Adapters** | Core + 2 reference | 1 week |
| **Conformance** | Test suite | 3 days |
| **Documentation** | Complete docs | 1 week |
| **TOTAL** | | **4-5 weeks** |

---

## Appendix A: Critical Rules

From CLAUDE.md:

1. ❌ **NEVER** create shell scripts - use BuildKit CLI
2. ❌ **NEVER** edit Composer-managed paths
3. ❌ **NEVER** create local .md files - use GitLab Wiki
4. ✅ **ALWAYS** use GitLab Wiki for ALL documentation
5. ✅ **ALWAYS** use GitLab Issues for ALL TODOs
6. ✅ **ALWAYS** spawn agents for tasks > 500 tokens

## Appendix B: Repository URLs

| Repository | URL |
|------------|-----|
| **openstandardagents** | https://gitlab.com/blueflyio/ossa/openstandardagents |
| **openstandardagents.org** | https://gitlab.com/blueflyio/ossa/openstandardagents.org |
| **platform-agents** | https://gitlab.com/blueflyio/platform-agents |
| **gitlab-agent_ossa** | https://gitlab.com/blueflyio/ossa/lab/gitlab-agent_ossa |
| **agent-buildkit** | https://gitlab.com/blueflyio/agent-platform/agent-buildkit |

---

**Status**: Ready for Implementation
**Next Review**: 2026-02-02
**Owner**: OSSA Core Team
