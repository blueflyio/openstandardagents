# OSSA Ecosystem: Architecture Statement & Execution Plan

> **Date:** March 3, 2026
> **Author:** Thomas Scola / Bluefly.io
> **Version:** v0.4.6 release cycle
> **Status:** Active

---

## Part 1: Architecture Statement

### What OSSA Is

OSSA (Open Standard for Software Agents) is the **contract layer** for AI agents. MCP connects agents to tools. A2A connects agents to agents. OSSA defines **what an agent is** — its identity, capabilities, compliance posture, lifecycle, security boundaries, and trust chain — in a single, portable YAML manifest.

Define once. Export to Docker, Kubernetes, CrewAI, LangChain, GitLab, npm, Drupal, kAgent CRD, and Agent Skills. Nine production targets from one manifest.

### The Five Projects

All five projects live in `WORKING_DEMOs/` and form a pipeline — not a monolith. Each has exactly one job:

```
openstandardagents          CLI + spec + schema + SDK
        │
        │  (schema, types, validation, templates)
        ▼
openstandard-ui             API + wizard UI (thin shell)
        │                   consumes: openstandardagents (npm)
        │                   consumes: studio-ui (components)
        │
        │  (build request → agent manifest)
        ▼
openstandard-generated-agents   Build engine + output store
        │                       templates, curation, rating
        │                       artifact registry
        │
        │  (built artifacts served back)
        ▼
openstandard-ui             Serves artifacts to consumers
        │
        ├──────────────────────────────────────────────┐
        ▼                                              ▼
openstandardagents.org      ai_agents_ossa (Drupal)
  GitLab Pages site           Orchestration submodule
  consumes: openstandard-ui   consumes: openstandard-ui
  consumes: studio-ui         (REST → service catalog)
  public-facing spec site     Next.js marketplace frontend
                              saves agents to Drupal entities
```

### Project Responsibilities

**openstandardagents** (`@bluefly/openstandardagents` on npm) — CLI + spec + schema + SDK. Source of truth for schema and validation. Branch: `release/v0.4.x`

**openstandard-ui** — Next.js agent builder. Thin shell over studio-ui components. Wizard steps from `/api/constants`. Branch: `release/v0.4.x`

**openstandard-generated-agents** — Build engine. Templates, curation, rating, artifact registry. Branch: `release/v0.4.x`

**studio-ui** (`@bluefly/studio-ui`) — Shared React component library. No business logic, no API surface. Branch: `release/v0.4.x`

**openstandardagents.org** — GitLab Pages. Public face of the OSSA spec. Branch: `main`

### The Drupal Path (ai_agents_ossa)

Bridges OSSA into Drupal's AI ecosystem via the Orchestration module. OSSA manifests import as config entities, deriver auto-generates AiAgent plugins, Tool API Bridge maps capabilities. Next.js frontend renders the marketplace, Drupal JSON:API handles persistence.

---

## Part 2: Execution Plan — Phases 0–5

### Phase 0: Repo Sync & Branch Alignment (Plan 10)

- [ ] Clone `openstandardagents` from `__BARE_REPOS` → checkout `release/v0.4.x`
- [ ] Clone `openstandard-ui` from `__BARE_REPOS` → checkout `release/v0.4.x`
- [ ] Clone `openstandard-generated-agents` from `__BARE_REPOS` → checkout `release/v0.4.x`
- [ ] Clone `studio-ui` from `__BARE_REPOS` → checkout `release/v0.4.x`
- [ ] Clone `openstandardagents.org` from `__BARE_REPOS` → checkout `main`
- [ ] Fix `openstandard-ui` worktree `.git` (if broken)
- [ ] Verify `setup-projects.json` targets
- [ ] Document branch state in runbook

### Phase 1: Release v0.4.6 to npm (Plan 9)

- [ ] **1a.** Verify dependency chain across all projects (`npm install` & `build`)
- [ ] **1b.** Validate `.gitlab-ci.yml` build pipeline
- [ ] **1c.** Create `release/v0.4.x` tracking branches for UI layers if needed
- [ ] **1d.** Audit `openstandardagents.org` site load and `/agent-builder` API linkage
- [ ] **1e.** Trigger `npm publish` for `openstandardagents@0.4.6`

### Phase 2: Wizard & UI Enhancements (Plan 11)

- [ ] **2a.** Map wizard presets to OSSA `spec.tools` (`openstandard-ui`)
- [ ] **2a.** Translate custom components to `@bluefly/studio-ui` blocks
- [ ] **2b.** Implement real Tools step & `/api/constants` validation

### Phase 3: Drupal Module Releases

- [ ] **3a.** Audit and release `ai_agents_ossa` on Drupal.org
- [ ] **3b.** Audit and release `api_normalization`

### Phase 4: Platform Validation

- [ ] **4.** Audit `.agents/@ossa` manifests in `platform-agents`

### Phase 5: Advanced Cognitive Architectures (Sequential Thinking)

- [ ] Define normative OSSA schema blocks for `cognitive.sequential_thinking` capabilities
- [ ] Provide standardized MCP tool templates wrapping sequential inference algorithms
- [ ] Inject validation rules tracking hypothesis generation limits and self-correcting branches
- [ ] Update `.org` documentation declaring "Cognition" as a first-class standard block

---

## Dependency Graph

```
Phase 0 (repo sync)
  └─→ Phase 1 (npm release v0.4.6)
       ├─→ Phase 2 (wizard/UI)
       ├─→ Phase 3 (Drupal releases)
       └─→ Phase 5 (cognitive architectures — v0.5.0)
Phase 4 runs in parallel (separate worktree)
```

---

## Part 3: Sequential Thinking — What OSSA Makes Possible

### The Gap

Today, sequential thinking in the agent ecosystem is a dumb tool. The MCP `sequential-thinking` server accepts a thought string, a number, and a boolean. No schema for thought structure. No persistence. No graph. No cross-agent reasoning traces. No way to compare how two agents think about the same problem. No way to replay, fork, or audit a reasoning chain. No way to define thinking patterns in a manifest and enforce them at the spec level.

Everyone bolts reasoning onto agents after the fact. Nobody has made reasoning a first-class, spec-level, portable, auditable primitive that travels with the agent manifest.

### What OSSA Introduces

**`spec.cognition` as a manifest block** — reasoning pattern, thought schema, trace configuration, analysis rules, and governance triggers declared in YAML alongside identity, capabilities, and compliance.

**Thought Graphs as First-Class Data** — every reasoning step is a node in a directed graph. Edges represent continuation, revision, branching, merging. Queryable, traversable, diffable. Stored in Neo4j + Qdrant.

**Cognitive Fingerprinting** — each agent develops a measurable reasoning signature: average depth, revision frequency, branch utilization, confidence distribution. Searchable metadata in the manifest.

**Cross-Agent Reasoning Diffing** — when multiple agents reason about the same problem, OSSA captures each thought graph and produces a semantic diff. Where they agreed, where they diverged, which path won.

**Thought-Chain Embeddings** — embed entire reasoning trajectories as vectors. Cluster similar patterns. Detect reasoning drift. Anomaly detection across the agent fleet.

**Compliance Reasoning Audit** — for FedRAMP/NIST: traversable decision trees with confidence scores, revision history, and governance trigger points. Auditors get a graph, not a log.

### Implementation Map (No New Projects)

| Capability | Existing Repo |
|---|---|
| `spec.cognition` schema + validation | `openstandardagents` |
| Thought graph storage + embeddings | `@bluefly/agent-brain` |
| Reasoning analytics + fingerprinting | `@bluefly/agent-tracer` |
| Cross-agent diffing | `@bluefly/agentic-flows` |
| MCP sequential thinking adapter | `@bluefly/agent-protocol` |
| Wizard reasoning step | `openstandard-ui` |
| Reasoning pattern templates | `openstandardagents` (templates/) |
| Compliance audit views | `@bluefly/compliance-engine` |
| Drupal reasoning surface | `ai_agents_ossa` |

### The Pitch

**OSSA is the first agent standard where the reasoning contract is as portable as the agent contract — define how your agent thinks in YAML, export it anywhere, audit it everywhere.**

---

## Rules (Enforced)

- No shell scripts / makefiles / bash — TypeScript CLI or BuildKit only
- No markdown files in repos — docs go in GitLab Wiki
- No stashing — proper merge/rebase/cherry-pick workflows
- No force push — ever
- No direct commits to protected branches — issues → MRs → review
- No new projects — extend existing repos
- No fake timelines — dependency-based sequencing only
- Separation of duties — each project has exactly one responsibility
- OpenAPI-first, TypeScript-first — Zod validation, SOLID, TDD
