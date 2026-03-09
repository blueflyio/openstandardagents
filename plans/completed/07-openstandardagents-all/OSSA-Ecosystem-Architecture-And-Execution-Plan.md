# OSSA Ecosystem Architecture & Execution Plan

Single source of truth for OSSA v0.5.0 development and ecosystem. v0.4.6 is published on npmjs and locked.

---

## Scope

- **Repos (WORKING_DEMOs only for this effort):**
  - openstandardagents (spec, CLI, npm @bluefly/openstandardagents on npmjs)
  - openstandard-ui (creator, API, save/export)
  - openstandard-generated-agents (artifact store; CI validate + export)
  - openstandardagents.org (marketing, docs, NIST CAISI)
- **Rules:** No .md in repos (docs in Wiki). No scripts; TypeScript/BuildKit only. No force push; no direct commits to protected branches. No new projects.

## Branch policy

| Repo | Branch | Status |
|------|--------|--------|
| openstandardagents | release/v0.5.x | Active development (v0.5.0) |
| openstandardagents | release/v0.4.x | Locked — patches only, v0.4.6 on npmjs |
| openstandard-ui | release/v0.4.x | Needs v0.5.x branch + bump |
| openstandard-generated-agents | release/v0.4.x | Needs v0.5.x branch |
| openstandardagents.org | release/v0.4.x | Needs v0.5.x branch |

## Completed (v0.4.6)

- [x] openstandardagents v0.4.6 published to npmjs
- [x] Tests passing, hooks passing, typecheck passing
- [x] .npmignore cleaned (dist/tools/, dist/dev-cli/, source maps excluded)
- [x] Internal URLs replaced with env vars
- [x] Experimental daemon committed
- [x] CHANGELOG has [0.4.6] section
- [x] release/v0.5.x branch created from v0.4.x, spec/v0.5 initialized
- [x] nist-compliance and migration/test branches merged into v0.5.x
- [x] release/v0.5.x pushed to GitLab

## Phase 1 — v0.5.0 Schema & Spec

v0.5 schema adds top-level sections (already in spec/v0.5/agent.schema.json):
- `security` (SecurityPosture: tier, capabilities, sandboxing, network_access, data_classification, audit, threat_model)
- `governance` (authorization, compliance, quality_requirements)
- `protocols` (mcp, a2a, anp declarations)
- `cognition` (pattern, constraints, governance, trace)
- `token_efficiency` (budget, compression, consolidation, routing, custom_metrics)
- `metadata.identity` (AgentIdentity: agent_id, namespace, publisher, checksum, created_at)

**TODO:**
1. Validate all existing examples against v0.5 schema — update apiVersion where valid
2. Add gov-document-processor reference manifest (from NIST research) updated to v0.5 structure
3. Update CLI validators to handle v0.5 top-level sections
4. Migration path: `ossa migrate --from v0.4 --to v0.5` support
5. Update Python SDK examples (currently hardcoded to ossa/v0.4.6)

## Phase 2 — Ecosystem Consumers

**Dependency order:** openstandardagents (build) → openstandard-ui → openstandardagents.org

1. **openstandard-ui:** Currently v0.3.5, builder depends on `@bluefly/openstandardagents: ^0.4.0`. Create release/v0.5.x branch, bump to 0.5.0, update builder to support v0.5 schema fields (security, governance, protocols, cognition, token_efficiency sections in agent creator UI).
2. **openstandardagents.org:** Currently v0.4.0, depends on `@bluefly/openstandardagents: ^0.4.0`. Create release/v0.5.x branch. Surface contract-layer value prop (identity, security posture, governance) prominently. NIST CAISI content at /docs/government/.
3. **openstandard-generated-agents:** Create release/v0.5.x branch. CI validates with npx @bluefly/openstandardagents. Add v0.5 reference agents.

## Phase 3 — Strategic Positioning

- Framework narrative: OSSA as the contract layer between orchestration (LangChain, CrewAI, AutoGen) and protocols (MCP, A2A, ANP)
- Reference manifests demonstrating: identity attestation, security posture, governance authorization, protocol declarations, token efficiency
- Case studies: government document processing, enterprise compliance scanning
- NIST CAISI alignment (subtle — framework strengths, not branding)

## Phase 4 — Hardening

- Observability: OpenTelemetry integration testing
- Cedar policy engine: authorization enforcement
- Trust tiers: signature verification (Ed25519/Sigstore)
- UADP: agent discovery protocol endpoints
- Conformance test suite for v0.5

## Runbook (current state as of 2026-03-05)

| Repo | Branch | Version | OSSA Dep | Status |
|------|--------|---------|----------|--------|
| openstandardagents | release/v0.5.x | 0.5.0 | — | Clean, pushed |
| openstandard-ui | release/v0.4.x | 0.3.5 | ^0.4.0 (builder/) | Needs v0.5.x branch |
| openstandard-generated-agents | release/v0.4.x | — | CI uses npx | Needs v0.5.x branch |
| openstandardagents.org | release/v0.4.x | 0.4.0 | ^0.4.0 | Dirty (next.config.ts modified) |

Build order: `cd openstandardagents && npm ci && npm run build` then openstandard-ui (pnpm), then openstandardagents.org (next build).
