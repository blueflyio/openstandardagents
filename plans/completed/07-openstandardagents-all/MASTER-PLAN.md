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

### Phase 0: Repo Sync & Branch Alignment

**Goal:** All 5 repos cloned, on correct branches, building clean.

- [ ] Clone `openstandardagents` from `__BARE_REPOS` → checkout `release/v0.4.x`
- [ ] Clone `openstandard-ui` from `__BARE_REPOS` → checkout `release/v0.4.x`
- [ ] Clone `openstandard-generated-agents` from `__BARE_REPOS` → checkout `release/v0.4.x`
- [ ] Clone `studio-ui` from `__BARE_REPOS` → checkout `release/v0.4.x`
- [ ] Clone `openstandardagents.org` from `__BARE_REPOS` → checkout `main`
- [ ] Fix `openstandard-ui` worktree `.git` pointer (should point at `__BARE_REPOS/ossa/lab/openstandard-ui.git`)
- [ ] Commit uncommitted changes in `openstandardagents` (schema, init command, workspace service, types, identity service)
- [ ] Commit uncommitted changes in `openstandardagents.org` (website/ directory)
- [ ] Create `release/v0.4.x` branch for `studio-ui` from `main`, push to origin
- [ ] Create `release/v0.4.x` branch for `openstandard-generated-agents` from `main`, push to origin
- [ ] Verify `setup-projects.json` targets match AGENTS.md
- [ ] Run `npm install && npm run build` across all 5 projects — verify clean
- [ ] Document branch state in runbook/wiki

### Phase 1: Release v0.4.6 to npm

**Goal:** `openstandardagents@0.4.6` published. CI auto-patches on merge to main.

- [ ] Validate `.gitlab-ci.yml` build pipeline across all 5 repos
- [ ] Trigger `npm publish` for `openstandardagents@0.4.6`
- [ ] **openstandardagents** CI: Make semantic-release job on `main` non-manual, ensure `GL_TOKEN`/`GITLAB_TOKEN` available
- [ ] **openstandardagents.org** CI: Add job on `main` that bumps patch version, tags, creates GitLab Release
- [ ] **openstandard-ui** CI: Add job on `main` that creates next patch tag + GitLab Release
- [ ] **studio-ui** CI: Add job on `main` that creates next patch tag + GitLab Release
- [ ] **openstandard-generated-agents** CI: Add job on `main` that creates next patch tag (no npm publish)
- [ ] Audit `openstandardagents.org` site load and `/agent-builder` API linkage

### Phase 2: Wizard & UI Enhancements

**Goal:** Real wizard with studio-ui components, real Tools step, all steps wired to manifest.

**2a. API contract for tools:**
- [ ] Define manifest mapping: selected tool presets + skills → OSSA `spec.tools` array
- [ ] Confirm `/api/constants` returns `toolPresets` and `/api/skills` returns skills
- [ ] Ensure run/save pipeline accepts and emits `spec.tools` in generated manifest

**2b. studio-ui wizard components:**
- [ ] Add `wizard/` directory in studio-ui package
- [ ] Create `AgentWizardShell` (steps list, navigation, run/save)
- [ ] Create step components: `Basics`, `Domain`, `LLM`, `Autonomy`, `Governance`, `Deployment`, `Tools`, `Review`
- [ ] Add `PlatformChipGrid` (multi-select chips) and `ModeToggle` (Quick vs Wizard)
- [ ] Fix React/Next.js duplicate instance issue (`"use client"` boundaries)

**2c. Thin agent-builder page (openstandard-ui):**
- [ ] Refactor `website/app/agent-builder/page.tsx` to thin shell: fetch config, hold state, render studio-ui components, POST run/save
- [ ] Remove ALL inline Tailwind step content and placeholder Tools div

**2d. Real Tools step:**
- [ ] Replace placeholder with multi-select showing preset groups (Web Search, Code Execution, MCP Filesystem, etc.)
- [ ] Add optional "Attach skills" section
- [ ] Wire selected IDs to parent state → maps to `spec.tools` entries

**2e. Real data in remaining steps:**
- [ ] Replace stub content in Domain, Autonomy, Governance, Deployment with real options from `/api/constants`
- [ ] Implement Review step showing manifest preview from wizard state

### Phase 3: Architecture — .org Proxy & openstandard-ui API

**Goal:** .org is a thin proxy. openstandard-ui owns all execution logic.

- [ ] Port manifest generation logic to `openstandard-ui/app/api/manifest/generate/route.ts`
- [ ] Refactor `openstandard-ui` to use OSSA CLI programmatically (not `child_process.execFile`)
- [ ] Implement Zod validation on incoming manifest payloads
- [ ] Gut local execution in `openstandardagents.org/app/api/agent-builder/route.ts` → proxy to `https://ossa-ui.blueflyagents.com/api/manifest/generate`
- [ ] Add decentralized discovery — query `.agents` mesh or UADP endpoints for Playground dropdowns
- [ ] Update frontend links ("Try now" / "Get started") to point to `ossa-ui.blueflyagents.com`

**Oracle migration (.org deploy):**
- [ ] Add `OSSA_UI_EXTERNAL_URI=https://ossa-ui.blueflyagents.com` to CI secrets and runtime env
- [ ] Remove `OSSA_WORKTREE`/`OSSA_CLI_PATH` dependencies
- [ ] Remove `@bluefly/openstandardagents` CLI as server dependency in `website/package.json`
- [ ] Simplify Dockerfile to `node:20-alpine`
- [ ] Verify `.gitlab-ci.yml` deploy pushes lightweight image to Oracle Container Registry
- [ ] Test `/api/agent-builder` hits ossa-ui without CORS/timeout issues
- [ ] Test Agent Mesh Discovery from interactive playground
- [ ] Test "Clone Design" button fills the customizer

### Phase 4: Hardcoded URL Remediation

**Goal:** Zero hardcoded platform URLs. All configurable via env vars.

**openstandard-ui (2 fixes):**
- [ ] Replace hardcoded `PROD_AGENT_MESH_URL` in `website/app/api/discovery/route.ts` with `process.env.MESH_URL`
- [ ] Replace hardcoded `EventSource` URL in `components/mesh/A2AFirehose.tsx` with env variable

**openstandardagents (2 fixes):**
- [ ] Replace hardcoded mesh webhook URL in `src/adapters/gitlab/agent-generator.ts` with configurable
- [ ] Replace hardcoded `https://agentdash.bluefly.io/jsonrpc` in `src/adapters/openai-agents/adapter.ts`

**openstandardagents.org (1 fix):**
- [ ] Replace hardcoded iframe `src` in `website/app/page.tsx` with `process.env.NEXT_PUBLIC_OSSA_UI_URL`

**studio-ui (2 fixes):**
- [ ] Replace mock URLs in `InfrastructureDashboard.tsx` with env/config
- [ ] Fix default GitLab URL in `use-gitlab-pipelines.ts`

**Document env template for customer installs:**
- [ ] MESH_URL, NEXT_PUBLIC_REGISTRY_API_URL, NEXT_PUBLIC_A2A_STREAM_URL, NEXT_PUBLIC_OSSA_UI_URL, NEXT_PUBLIC_MARKETPLACE_URL, OSSA_REGISTRY_URL, NEXT_PUBLIC_GITLAB_URL

### Phase 5: Drupal Module Releases

**Goal:** `ai_agents_ossa` and `api_normalization` released on Drupal.org.

- [ ] Audit and release `ai_agents_ossa` on Drupal.org
- [ ] Audit and release `api_normalization` on Drupal.org
- [ ] Audit `.agents/@ossa` manifests in `platform-agents` for correctness

---

## Part 3: NIST Alignment & Compliance

### NIST CAISI RFI Response (Deadline: March 9, 2026)

- [ ] Expand draft to answer priority questions: 1a, 1d, 2a, 2e, 3a, 3b, 4a, 4b, 4d
- [ ] Attach exhibits: schema excerpt, UADP table, trust tier table, threat matrix
- [ ] Submit at https://www.regulations.gov/commenton/NIST-2025-0035-0001
- [ ] Add "NIST Alignment" route to `openstandardagents.org` with CAISI matrix and links

### NIST ITL Concept Paper Response (Deadline: April 2, 2026)

- [ ] Finalize draft (6 sections complete)
- [ ] Submit

### Cryptographic Identity (x-signature)

- [ ] Add `@noble/ed25519` + `jose` + `did-resolver` + `json-canonicalize` to openstandardagents deps
- [ ] Wire `POST /trust/verify` to use real Ed25519 verification
- [ ] Add `x-signature` block to `ossa.yaml` schema
- [ ] Replace mock `TrustBadge` verification with real `@noble/ed25519` verify
- [ ] Decide: public key distribution mechanism (DNS TXT, federated ledger, or centralized registry)

### SBOM Generation

- [ ] Add `cdxgen` to GitLab CI pipeline for openstandardagents
- [ ] Publish SBOM as CI artifact, store URL in `metadata.sbom_pointer`

### Spec Linting

- [ ] Run `spectral-cli lint` on UADP OpenAPI spec, fix violations
- [ ] Run `asyncapi validate` on async spec
- [ ] Add both as `validate:specs` CI job

### OSCAL Compliance Mapping

- [ ] Write `docs/security/ossa-oscal-component.json` mapping to NIST SP 800-53 controls (AC-3, AC-6, IA-3, SC-17, AU-2, SC-7)

### DEI Badge

- [ ] Review CHAOSS DEI badging template
- [ ] Apply for badge
- [ ] Add to README + website footer

---

## Part 4: Human-Centric Spec Extensions (v0.5/v0.6)

> **Source:** wiki `openstandardagents.wiki/research/human-centric-agent-design-analysis.md`

**P0 — Must have:**
- [ ] `spec.user_controls` — pause, stop, undo, emergency_stop, rate_limiting
- [ ] `spec.consent` — data_collected, opt_out mechanism, privacy_policy_url

**P1 — Should have:**
- [ ] `spec.impact` — reversible, blast_radius, confirmation_required per action
- [ ] `spec.transparency` — self_disclosure, provenance, user_audit endpoint

**P2 — Could have:**
- [ ] `spec.safeguards` — prohibited_behaviors, vulnerable_populations, crisis_resources
- [ ] `spec.feedback` — channels (inline/webhook/email), categories, retention

**P3 — Nice to have:**
- [ ] `spec.accessibility` — modalities, languages, wcag_level, cognitive_load

**Per extension implementation:**
- [ ] Add Zod schema to `src/types/` (one file per section)
- [ ] Add to `ossa.schema.json` as optional properties
- [ ] Update `ossa manifest explain` to render new sections
- [ ] Add reference agent examples
- [ ] Update `ossa init` wizard
- [ ] Add validation rules in `ossa validate`

---

## Part 5: Sequential Thinking — What OSSA Makes Possible

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

### Execution (v0.5.0)

- [ ] Define normative OSSA schema blocks for `cognitive.sequential_thinking` capabilities
- [ ] Provide standardized MCP tool templates wrapping sequential inference algorithms
- [ ] Inject validation rules tracking hypothesis generation limits and self-correcting branches
- [ ] Update `.org` documentation declaring "Cognition" as a first-class standard block

### The Pitch

**OSSA is the first agent standard where the reasoning contract is as portable as the agent contract — define how your agent thinks in YAML, export it anywhere, audit it everywhere.**

---

## Part 6: MCP Bridge Service

**Goal:** OSSA-aware MCP proxy that auto-discovers IDE tool configs and applies policy.

- [ ] Create `src/services/mcp/bridge.service.ts` in openstandardagents — proxy controller mapping tools to MCP servers, auto-detect IDE configs (Cursor, Claude Desktop), `executeTool()` with policy checking
- [ ] Create `src/api/routes/mcp.router.ts` — `POST /mcp/bridge/import-config` and `POST /mcp/bridge/execute`
- [ ] Create `src/cli/commands/mcp.command.ts` — `ossa mcp bridge sync <claude|cursor>`
- [ ] Update `src/di-container.ts` to export `McpBridgeService`
- [ ] Test with mock `claude_desktop_config.json`

---

## Part 7: Tech Debt — Replace Custom Code with OSS

**Priority 1 — Dragonfly:**
- [ ] Replace `mcp.service.ts` (342 lines) with `@modelcontextprotocol/sdk` Client
- [ ] Replace hand-rolled Qdrant calls with `@qdrant/js-client-rest` SDK
- [ ] Replace `websocket.service.ts` reconnect logic with direct `ws` or `socket.io`
- [ ] Delete `docker.service.ts` wrapper; use `dockerode` directly
- [ ] Replace `metrics.service.ts` custom counters with `@opentelemetry/sdk-metrics`

**Priority 2 — openstandard-ui / NODE-AgentMarketplace:**
- [ ] Replace hand-rolled `axios` wrappers with `axios-retry`
- [ ] Replace custom form state with `react-hook-form` + `@hookform/resolvers` + `zod`

**Priority 3 — dragonfly-saas:**
- [ ] Replace hand-rolled tenant management with `express-jwt` + `jwks-rsa`

**Priority 4 — Drupal (PHP):**
- [ ] Replace custom GitLab webhook parser with Symfony HttpClient + `http_client_manager`
- [ ] Replace raw `file_get_contents()`/curl with `\Drupal::httpClient()`

**Priority 5 — All projects:**
- [ ] Replace `Math.random().toString(36)` IDs with `uuid` v4
- [ ] Standardize on `js-yaml` only; remove duplicate `yaml` package
- [ ] Standardize HTTP client: native `fetch` + TanStack Query (browser), `axios` + `axios-retry` (Node)

---

## Dependency Graph

```
Phase 0 (repo sync)
  └─→ Phase 1 (npm release v0.4.6)
       ├─→ Phase 2 (wizard/UI)
       ├─→ Phase 3 (.org proxy + openstandard-ui API)
       ├─→ Phase 4 (URL remediation)
       ├─→ Phase 5 (Drupal releases)
       └─→ NIST (parallel — deadline driven)

Phase 6 (MCP bridge) — after Phase 1
Phase 7 (tech debt) — parallel, any time

v0.5.0 (future):
  ├─→ Part 4 (human-centric extensions)
  ├─→ Part 5 (sequential thinking / cognition)
  └─→ NIST identity (x-signature, SBOM, OSCAL)
```

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
