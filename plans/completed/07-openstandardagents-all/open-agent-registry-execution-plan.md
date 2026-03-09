# Open Agent Registry Execution Plan

**Status**: Active  
**Alignment**: UADP + OSSA  
**Canonical manifests**: agent-buildkit `.gitlab/agent-sprint/spawn-*.yaml`

---

## Overview

The Open Agent Registry plan delivers a decentralized, mesh-backed agent discovery and distribution system aligned with OSSA and UADP conventions. Four parallel tracks run concurrently; spawn manifests drive agent execution.

---

## Track 1: Mesh Discovery Integration

**Goal**: Replace local storage with agent-mesh as the canonical discovery source.

| Task ID | Title | Project | Priority |
|---------|-------|---------|----------|
| mesh-node-api-refactor | Refactor Node API to remove SQLite | NODE-AgentMarketplace | high |
| mesh-node-proxy-rebuild | Rebuild Node API as Caching Proxy | NODE-AgentMarketplace | high |
| mesh-buildkit-discovery | Configure agent-buildkit discovery output | agent-buildkit | medium |

**Deliverables**:
- Node API stripped of SQLite; stateless proxy operation
- Node API proxies GET from agent-mesh `/api/v1/discovery` with in-memory or Redis cache
- agent-buildkit writes discovery to `.agents-workspace/discovery/output/discovered-projects.yml`

---

## Track 2: Core Domain and Governance Metadata

**Goal**: Extend OSSA spec for Drupal integration, supply chain trust, and lifecycle management.

| Task ID | Title | Project | Priority |
|---------|-------|---------|----------|
| registry-metadata-schemas | Update .agents/ YAML schemas for Drupal identifiers | openstandardagents | high |
| registry-metadata-checksums | Add signature and checksum fields to OSSA spec | openstandardagents | high |
| registry-metadata-revocation | Add revocation semantics to OSSA | openstandardagents | medium |
| registry-metadata-validators | Implement schema validators and CLI hooks | openstandardagents | high |
| registry-metadata-governance | Publish Governance Docs | technical-docs | medium |

**Deliverables**:
- `uuid` and `machine_name` in OSSA metadata for Drupal
- `signature`, `checksum` (sha256), `sbom_pointer` for supply chain trust
- `revoked` and `deprecated` states for lifecycle
- `ossa validate`, `ossa lint` enforce compliance
- Governance docs in GitLab Wiki

---

## Track 3: Drupal 11 Consumer Module

**Goal**: Native Drupal integration with the Open Agent Registry via `agent_registry_consumer`.

| Task ID | Title | Project | Priority |
|---------|-------|---------|----------|
| drupal-consumer-scaffold | Scaffold agent_registry_consumer module | Drupal_AgentMarketplace | high |
| drupal-consumer-config | Build global Config form for registry settings | Drupal_AgentMarketplace | high |
| drupal-consumer-catalog-ui | Build native Drupal Catalog UI | Drupal_AgentMarketplace | high |
| drupal-consumer-install-action | Implement Install Action for artifacts | Drupal_AgentMarketplace | high |

**Deliverables**:
- `agent_registry_consumer` module (catalog, policy gates, allowlists)
- Config form for registry settings
- Catalog UI consuming Node Proxy/Mesh with pagination and search
- Install action: download, checksum validation, provenance logging

---

## Track 4: Frontend UX

**Goal**: Rewire frontends to mesh-backed proxy and add trust/accessibility.

| Task ID | Title | Project | Priority |
|---------|-------|---------|----------|
| frontend-ux-rewire | Rewire Next.js frontend to Node proxy | openstandardagents.org | high |
| frontend-ux-facets | Add compatibility facets | openstandardagents.org | medium |
| frontend-ux-trust-badges | Implement UI Trust Badges | openstandardagents.org | high |
| frontend-ux-seo | Refine SEO and Accessibility | openstandardagents.org | medium |

**Deliverables**:
- Next.js (openstandardagents.org / openstandard-ui) consumes Mesh-backed Node proxy
- Compatibility facets (Drupal version, PHP version)
- Trust badges (conformance, signed artifact, revocation warnings)
- SEO and accessibility (aria-labels, contrast)

---

## Spawn Commands

```bash
# Track 1
buildkit agent spawn-team --manifest .gitlab/agent-sprint/spawn-mesh-integration

# Track 2
buildkit agent spawn-team --manifest .gitlab/agent-sprint/spawn-registry-metadata

# Track 3
buildkit agent spawn-team --manifest .gitlab/agent-sprint/spawn-drupal-consumer

# Track 4
buildkit agent spawn-team --manifest .gitlab/agent-sprint/spawn-frontend-ux
```

---

## SOD and Ownership

- **Discovery**: agent-mesh (`GET /api/v1/discovery`); buildkit owns validate/discover
- **Registry metadata**: openstandardagents (OSSA spec, CLI)
- **Drupal consumer**: agent_registry_consumer (Drupal_AgentMarketplace)
- **Frontend**: openstandardagents.org, openstandard-ui
- **CI**: gitlab_components; orchestration: agentic-flows
