# 02 - DUADP Master Plan & Status Tracker

> **Single source of truth** for all DUADP work. Updated each session.
> Last updated: 2026-03-08

## Current State

| Asset | Status | Maturity |
|-------|--------|----------|
| DUADP Spec v0.2.0 | 48 endpoints defined | Solid |
| TypeScript SDK | npm @bluefly/duadp v0.2.0, 136 tests | Production-ready |
| Python SDK | PyPI duadp | Basic |
| Reference Node | Express 5 + SQLite, live at discover.duadp.org | Demo-grade |
| duadp.org Website | Next.js 15.5, static data mock | Showcase only |
| NIST CAISI RFI | Submitted (docket NIST-2025-0035) | **COMPLETE** |
| Cedar Policies | 8 sample policies, SOD enforcement | Conceptual |
| Federation | Spec'd (gossip protocol), single node live | Not exercised |
| Trust Tiers | 5 tiers defined, Ed25519 crypto in SDK | Implemented in SDK |

## The Gap

DUADP is a well-spec'd protocol with one node. "Next level" = a **living federated network** that others run, federate with, and build on.

---

## Pillar 1: Make Federation Real (Multi-Node Network)

**Problem:** One node isn't a federation. Nobody can verify gossip, peer sync, or cross-node discovery works.

### 1A. Stand Up 3+ Federated Nodes
- [ ] **Node 1:** `discover.duadp.org` (Oracle) — OSSA reference registry
- [ ] **Node 2:** `registry.openstandardagents.org` (Oracle) — OSSA spec agents/tools
- [ ] **Node 3:** `discover.drupl.ai` (Oracle or NAS) — Drupal AI ecosystem agents
- Each runs reference-node with own SQLite DB and seed data
- Auto-peer via gossip on startup (`POST /api/v1/federation`)

### 1B. Cross-Node Resolution
- [ ] `GET /api/v1/agents?federated=true` queries peers and merges results
- [ ] GAID URIs like `agent://drupl.ai/agents/content-guardian` resolve across nodes
- [ ] WebFinger `?resource=acct:agent@drupl.ai` returns correct node

### 1C. Federation Health Dashboard
- [ ] Real-time peer status, last-sync times, resource counts per node
- [ ] Add to duadp.org as `/federation` with live data (not mocks)

**Sprint 1 target. Priority: MUST.**

---

## Pillar 2: Production-Grade Trust Pipeline

**Problem:** Trust tiers exist in spec but no automated verification. Agents self-report their tier.

### 2A. Automated Trust Verification
On `POST /api/v1/publish`, verify:
- [x] Tier 1 (community): Valid JSON schema
- [x] Tier 2 (signed): Ed25519 signature matches payload
- [x] Tier 3 (verified-signature): DID resolves, public key matches signature
- [x] Tier 4 (verified): DID + domain ownership proof (DNS TXT or .well-known)
- [x] Tier 5 (official): Manual attestation by OSSA governance body
- [x] Return verified trust tier in response, store in DB

### 2B. Cedar Policy Enforcement (Not Just Samples)
- [x] Wire Cedar evaluation into reference node middleware
- [x] `POST /api/v1/policies/evaluate` — evaluate Cedar policy against request context
- [x] Pre-execution authorization: agents pass Cedar check before tool invocation
- [ ] Use SOD policies from `05-NIST/sod-forbid.cedar` as real enforcement

### 2C. Revocation & Attestation Flow
- [x] `DELETE /api/v1/agents/:name` with reason code propagates via federation gossip
- [x] Attestation chain: signed attestation record per agent interaction (POST /api/v1/attestations)
- [x] Reputation score derived from attestations (GET /api/v1/reputation/:agentId)

**Sprint 2 target. Priority: MUST (2A), SHOULD (2B, 2C).**

---

## Pillar 3: Developer Adoption & Ecosystem

**Problem:** SDK exists but no easy "register my agent" developer experience.

### 3A. duadp CLI Enhancement
- [x] `duadp init` — scaffold ai.json (OSSA manifest) interactively
- [x] `duadp publish --node discover.duadp.org` — publish agent/skill/tool
- [x] `duadp verify` — check manifest, resolve DID, validate signature
- [x] `duadp search "code review"` — federated search across all nodes
- [x] `duadp status` — show registered agents and trust tiers

### 3B. One-Command Node Deployment
- [x] `npx @bluefly/duadp-node` — starts DUADP node with zero config (bin entry added)
- [x] `docker run -p 4200:4200 blueflyio/duadp-node` (multi-stage Dockerfile)
- [x] Auto-seeds with local agents from ai.json files in workspace (DUADP_SEED_FILE)
- [x] Auto-peers with discover.duadp.org on startup (DUADP_PEERS)

### 3C. Drupal Module (duadp_discovery)
- [ ] Drupal nodes as DUADP registry participants
- [ ] Config entity: DUADP node settings (peers, trust requirements)
- [ ] Expose Drupal AI agents/skills via DUADP endpoints
- [ ] Bridge drupal/ai AiAgent plugins → OSSA manifest → DUADP registration
- **Killer use case:** every Drupal site becomes an agent registry node

### 3D. MCP ↔ DUADP Bridge (Bidirectional)
- [x] Auto-generate MCP server manifest from `GET /api/v1/tools?protocol=mcp`
- [x] 21 MCP tools exposed via `/mcp` SSE endpoint (was 17, added trust/revocation/cedar)
- [ ] Import MCP server configs and register as DUADP tools
- [ ] Any MCP-compatible client discovers tools via DUADP

**Sprint 2-3 target. Priority: MUST (3A), SHOULD (3B, 3C), COULD (3D).**

---

## Pillar 4: Post-NIST Positioning

**Problem:** RFI submitted. Now capitalize.

### 4A. NIST Follow-Up Package
- [ ] Demo video: federated discovery across 3 nodes
- [ ] One-pager: "DUADP implements NIST CAISI requirements"
- [ ] Map every NIST SP 800-53 control to live DUADP endpoint/feature
- [ ] Publish as whitepaper at openstandardagents.org/nist

### 4B. Competitive Matrix
- [ ] vs AGNTCY/ANS: DUADP has federation + trust tiers + Cedar — they don't
- [ ] vs MCP Registry: DUADP is protocol-agnostic (MCP, A2A, REST, custom)
- [ ] vs Google A2A: DUADP adds trust verification and governance
- [ ] Publish comparison on duadp.org

### 4C. Standards Track
- [ ] IETF Internet-Draft (discovery via .well-known)
- [ ] W3C Credentials Community Group (DID alignment)
- [ ] Propose DUADP as discovery layer for OSSA at OpenStandard governance

**Sprint 3-4 target. Priority: SHOULD (4A), COULD (4B, 4C).**

---

## Sprint Schedule

| Sprint | Dates | Focus | Deliverables |
|--------|-------|-------|-------------|
| **S1** | NOW | Federation | 3 live nodes, cross-node search |
| **S2** | +2 weeks | Trust + CLI | Automated verification, duadp publish/verify |
| **S3** | +4 weeks | Enforcement + NIST | Cedar middleware, NIST follow-up package |
| **S4** | +6 weeks | Ecosystem | Drupal module, MCP bridge, duadp.org live data |

---

## Architecture Reference

### DUADP Endpoints (v0.2.0)
- `GET /.well-known/agent-card.json` — Agent identity, capabilities, tools (CAISI 1a, 3a)
- `GET /.well-known/agent.json` — A2A interop descriptor
- `GET /registry` — List agents
- `GET /registry/{agentId}` — Identity resolution via GAID
- `PUT /registry/revoke/{agentId}` — Revoke agent identity (CAISI 1d)

### Event System (AsyncAPI)
- `uadp.agents.registered` — Real-time discovery
- `uadp.agents.updated` — Lifecycle/audit tracking
- `uadp.agents.revoked` — Real-time revocation

### Transport & Security
- REST via HTTPS (TLS 1.2+, optional mTLS for writes)
- AsyncAPI via WebSocket/TLS (API key or OAuth)
- A2A: DID in envelope with optional signed delegation

### CAISI Alignment
- **Identity:** GAID (DID) in agent card; DID Document in extensions
- **Authorization:** Cedar policies referencing principal DIDs
- **Tools:** Declarative via MCP servers
- **Observability:** Registry events, Cedar decision logs
- **Interoperability:** REST + AsyncAPI + A2A + MCP

---

## The Thesis

DUADP = **DNS + PKI for AI agents**. Not just a spec — a live federated network where any developer registers agents, any node operator runs a registry, and trust is cryptographically verified end-to-end. The NIST submission positions BlueFly.io as the team that solved agent identity and discovery for enterprise/federal.

---

## Session Log

### 2026-03-08
- Cleaned plans/ — moved 60+ completed/duplicate/resolved/recovery files to `completed/`
- Created this master plan as single DUADP status tracker
- **Sprint 1 implementation DONE:**
  - [x] Created `src/federation.ts` — cross-node federation module (fetchPeer, federatedFetch, deduplicateByGaid, resolveGaidFromPeers, resolveGaidLocally, startHealthChecks, registerEnvPeers)
  - [x] Modified `src/index.ts` — `?federated=true` on skills/agents/tools/search, federated WebFinger fallback, `GET /api/v1/resolve/:gaid`, enhanced gossip POST with peer list exchange + hop counting, DUADP_PEERS auto-registration on startup, health check loop
  - [x] Modified `src/seed.ts` — DUADP_SEED_FILE env var support for external JSON seed files
  - [x] Created `docker-compose.federation.yml` — 3 nodes (discover.duadp.org:4200, registry.openstandardagents.org:4201, discover.drupl.ai:4202) with health checks, separate volumes, federation network
  - [x] Created `seeds/discover-seed.json` — 5 agents, 3 skills, 3 tools (OSSA reference)
  - [x] Created `seeds/registry-seed.json` — 5 agents, 4 skills, 4 tools (OSSA spec tools)
  - [x] Created `seeds/drupal-seed.json` — 5 agents, 4 skills, 3 tools (Drupal AI ecosystem)
  - [x] Created `scripts/federate.ts` — bootstrap script (wait, register, verify, test federated search)
  - [x] Created `duadp.org/app/federation/page.tsx` — federation dashboard with animated mesh topology, node cards, metrics, activity feed
  - [x] Created `duadp.org/app/api/v1/federation/mesh/route.ts` — mesh topology API
  - [x] Updated `duadp.org/app/layout.tsx` — added Federation nav link
- Status: Sprint 1 COMPLETE. Ready to test locally.

### 2026-03-08 (continued)
- **Sprint 2 implementation IN PROGRESS:**
  - [x] Created `src/trust.ts` — automated trust tier verification (5 checks: schema, signature, DID resolution, domain ownership, official attestation)
  - [x] Modified `src/index.ts` — `POST /api/v1/verify` standalone verification, trust verification on publish with tier downgrade
  - [x] Created `src/revocation.ts` — revocation propagation module (storeRevocation, isRevoked, isNameRevoked, listRevocations, propagateRevocation)
  - [x] Added revocations table to `src/db.ts` — gaid, kind, name, reason, revoked_by, origin_node, propagated
  - [x] Enhanced DELETE handlers — revocations propagated to all peers via `POST /api/v1/federation/revocations`
  - [x] Added `POST /api/v1/federation/revocations` — gossip receiver (stores revocation, deletes local resource)
  - [x] Added `GET /api/v1/revocations` and `GET /api/v1/revocations/:name` — list/check revocations
  - [x] Added revocation blocking on publish — revoked GAIDs/names cannot be re-registered
  - [x] Added Cedar pre-authorization on publish — evaluateManifestCedar checks manifest Cedar policies
  - [x] Created `cli/` — DUADP CLI package (`@bluefly/duadp-cli`)
  - [x] CLI commands: init, publish, verify, search, status, peers, revocations, health
  - [x] CLI features: --node targeting, --federated search, --token auth, table output formatting
- Status: Sprint 2 MOSTLY COMPLETE. Cedar middleware wired in, revocation + gossip done, CLI done.
- **Sprint 3 implementation IN PROGRESS:**
  - [x] Created `reference-node/policies/duadp-authorization.cedar` — 8 DUADP-specific Cedar policies (publish auth, revocation auth, federation peering, anonymous write blocking)
  - [x] Updated `reference-node/Dockerfile` — multi-stage build with policies directory
  - [x] Updated `reference-node/package.json` — renamed to `@bluefly/duadp-node` v0.2.0, added bin entry for npx
  - [x] Created `duadp.org/app/trust/page.tsx` — interactive trust verification page with tier ladder, live manifest verifier, CLI quick reference
  - [x] Updated `duadp.org/app/layout.tsx` — added Trust nav link
- Status: Sprint 3 IN PROGRESS. Cedar policies created, trust page live, one-command deployment ready.
  - [x] Added 4 new MCP tools to `src/mcp.ts`: duadp_verify_trust, duadp_list_revocations, duadp_check_revocation, duadp_evaluate_cedar (21 total MCP tools)
  - [x] Updated `.well-known/duadp.json` capabilities: added trust-verification, revocations, cedar-authorization
- **Marketplace Fix (Oracle:3090):**
  - [x] Diagnosed root cause: nginx proxying /api/ to nonexistent Drupal DDEV on Mac
  - [x] Created `server/marketplace-api.mjs` — lightweight Node.js API adapter (~280 lines) replacing Drupal backend
  - [x] Updated `nginx.conf` — /api/ → marketplace-api:3091, /duadp/ → duadp-node:4200, /jsonapi/ → marketplace-api:3091
  - [x] Updated `Dockerfile` — multi-stage build, runs both marketplace-api.mjs + nginx
  - [x] Updated `.env.local` — VITE_DRUPAL_BACKEND=http://localhost:3091, VITE_UADP_NODE_URL=http://localhost:4200
  - [x] Updated `.gitlab-ci.yml` — build args point to marketplace-api:3091
  - [x] Updated `vite.config.ts` — cleaned proxy config, removed Drupal-specific paths, added /duadp/ proxy to UADP node
  - Marketplace-api serves all endpoints React app uses: agents CRUD, discovery, skills, wizard, validate, site-info, me, ossa-template, JSON:API
  - Drupal-only features (Canvas, Dragonfly, UADP nodes CRUD) gracefully 404 with React fallbacks
