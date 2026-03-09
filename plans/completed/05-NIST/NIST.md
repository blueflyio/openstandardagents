# NIST CAISI RFI Submission Plan

**Docket:** NIST-2025-0035
**Deadline:** March 9, 2026, 11:59 PM Eastern
**Agency:** Center for AI Standards and Innovation (CAISI), NIST
**Contact:** Peter Cihon, Senior Advisor — peter.cihon@nist.gov, (202) 695-5661
**Submitted by:** BlueFly.io / OSSA open-source community
**Submission method:** regulations.gov (electronic only, no mail/fax/email)

---

## Status: FINAL PUSH

### Completed

- [x] **openstandardagents.org** — LIVE, all pages serving (GitLab Pages)
- [x] **duadp.org** — LIVE (GitLab Pages)
- [x] **NIST proposal** — expanded from 172 → 820 lines, professional format
  - Cover letter → Executive Summary → Detailed Q&A (Sections 1-4) → Framework Alignment → Production Evidence → 12 Recommendations → 5 Exhibits
  - File: `openstandardagents.org/website/content/docs/government/nist-caisi-rfi-response.md`
  - URL: https://openstandardagents.org/docs/government/nist-caisi-rfi-response
- [x] **PDF generated** — `/downloads/OSSA-NIST-CAISI-RFI-Response-2026.pdf`
- [x] **compliance.blueflyagents.com** — landing page LIVE (was returning 404 on root)
  - 135 Cedar policies, 6 compliance frameworks
  - API: `/api/v1/cedar/policies`
- [x] **discover.duadp.org** — reference node running (5 skills, 3 agents, 3 tools)
- [x] **marketplace.blueflyagents.com** — API functional
- [x] **CI pipelines fixed** — all 3 repos (openstandardagents.org, duadp.org, openstandard-generated-agents)
- [x] **Deep dive** — full technical understanding of DUADP + OSSA CLI repos documented

### TODO (Before Submission)

- [ ] **Add PDF download link** on NIST page for the PDF
- [ ] **Verify all demo links** — 3 "Live Demos & Resources" links on NIST page
- [ ] **OSSA CLI v0.5.0 release** — Monday morning (currently at v0.4.8 on npm)
- [ ] **End-to-end builder test** — wizard → GitLab CI → artifact persistence
- [ ] **Final proofread** — check for typos, broken formatting, accuracy
- [ ] **Submit to regulations.gov** — upload PDF to docket NIST-2025-0035
- [ ] **NCCoE concept paper response** — deadline April 2, 2026 (post-submission follow-up)

---

## The RFI: What NIST Is Actually Asking

Source: Federal Register Vol. 91, No. 5, January 8, 2026 (NIST-2025-0035)

### Section 1: Security Threats, Risks, and Vulnerabilities

| Question | What NIST Wants | Our Answer |
|----------|-----------------|------------|
| **1a** | Unique threats to AI agents vs traditional software | OSSA threat model: prompt injection, tool poisoning, identity spoofing, delegation chain hijacking. Cedar policies enforce least-privilege per-tool. |
| **1b** | How threats vary by model, tool, deployment method | OSSA manifest captures LLM provider, tools, deployment context. 22+ export adapters prove cross-platform variation handling. |
| **1c** | Are threats barriers to wider adoption? | Yes — OSSA removes barriers by standardizing identity, auth, and governance across frameworks. |
| **1d** | How have threats changed over time? | Multi-agent systems create new attack surfaces (delegation chains, gossip poisoning). DUADP's trust tiers + Cedar address these. |
| **1e** | Multi-agent specific threats | DUADP federation gossip can be poisoned; mitigated by Ed25519 signatures, DID verification, circuit breakers, max_hops limits. |

### Section 2: Security Practices for AI Agent Systems

| Question | What NIST Wants | Our Answer |
|----------|-----------------|------------|
| **2a** | Technical controls for development & deployment | Cedar ABAC policies (formally verified), OSSA manifest validation, schema-level security posture declarations. |
| **2b** | Effectiveness variation by model/tool/deployment | OSSA's platform-specific validators (Zod-based) ensure controls adapt per-platform. 22+ adapters prove this. |
| **2c** | How controls need to evolve | OSSA's versioned schema (v0.2 → v0.4 → v0.5) with migration service demonstrates evolving controls. |
| **2d** | Patching/updating agents vs traditional software | OSSA manifest versioning + DUADP lifecycle states (draft → active → deprecated → revoked) with successor links. |
| **2e** | Which cybersecurity frameworks are relevant | NIST SP 800-53 Rev. 5 (AC, AU, SC, IA, CM, SI, CA families), NIST AI RMF 1.0, SP 800-218A. All mapped in Cedar. |

### Section 3: Assessing the Security of AI Agent Systems

| Question | What NIST Wants | Our Answer |
|----------|-----------------|------------|
| **3a** | Methods for assessing threats during development | OSSA `conformance` command, schema validation, Cedar policy evaluation, DUADP conformance test suite (136 tests). |
| **3b** | How to detect incidents post-deployment | DUADP audit logs, outcome attestations, feedback system, OpenTelemetry tracing at tracer.blueflyagents.com. |
| **3c** | Documentation for upstream/downstream partners | OSSA manifest IS the documentation — machine-readable, includes provenance, SBOM, compliance mappings. |
| **3d** | User-facing documentation for secure deployment | openstandardagents.org serves spec, examples, builder wizard. Cedar policies are human-readable. |

### Section 4: Limiting, Modifying, and Monitoring Deployment Environments

| Question | What NIST Wants | Our Answer |
|----------|-----------------|------------|
| **4a** | How to constrain agent deployment environments | OSSA sandboxing declarations, Cedar resource limits, DUADP rate limits + SLA specifications per-agent. |
| **4b** | How to modify environments to mitigate threats | OSSA's 22+ export adapters generate platform-specific security configs. Kubernetes CRDs via kagent. |
| **4c** | Managing risks with counterparties | DUADP's 5-tier trust model (official → experimental), DID verification chain, delegation depth limits. |
| **4d** | Methods to monitor deployment environments | OpenTelemetry integration, DUADP audit trail, Cedar policy evaluation logs, A2A collector telemetry. |
| **4e** | Current AI agent systems on open internet | DUADP federation with gossip protocol IS an open internet agent system. DNS TXT + WebFinger = zero-config. |

### Section 5: Additional Considerations

| Question | What NIST Wants | Our Answer |
|----------|-----------------|------------|
| **5a** | Methods to aid security adoption | Open source (Apache 2.0 / MIT), `npx @bluefly/openstandardagents` one-command install, builder wizard. |
| **5b** | Where government collaboration is most urgent | Discovery protocol standardization, agent identity (GAID namespace for .gov), Cedar policy templates. |
| **5c** | Where research should focus | Formal verification of agent authorization (Cedar), federated trust propagation, multi-agent delegation security. |

**NIST's priority questions** (for limited-bandwidth respondents): 1a, 1d, 2a, 2e, 3a, 3b, 4a, 4b, 4d — **we answer ALL of them**.

---

## Strategic Positioning

### Why We Win

From competitive analysis (see `compass_artifact_wf-*.md`):

1. **We occupy the last unsolved problem in the agent stack** — universal discovery. MCP solved tool connectivity (97M+ monthly SDK downloads). A2A solved agent-to-agent communication (150+ organizations). Nobody has solved cross-protocol, cross-marketplace discovery. DUADP does.

2. **The OSSA contract layer is unique** — no competitor (AGNTCY, ANS, Oracle Agent Spec) combines agent identity (W3C DIDs/GAID), authorization (Cedar), trust tiers, compliance frameworks, resource governance, and cryptographic provenance in a single composable schema. "MCP provides the hands. A2A provides the voice. OSSA provides the credentials."

3. **We have running code, not whitepapers** — live nodes, production APIs, 136 passing tests, 3 language SDKs, 22+ platform adapters, 135 Cedar policies in production. Most competitors are in "specification-drafting phases."

4. **NIST timing is strategic** — RFI deadline March 9, NCCoE concept paper deadline April 2. If NIST references DUADP/OSSA in guidance, we gain the institutional legitimacy that SMTP gained from DoD adoption.

### Competitive Landscape

| Competitor | Approach | Backing | Status | Our Advantage |
|-----------|---------|---------|--------|---------------|
| **AGNTCY** | P2P DHT discovery | Cisco, 75+ companies, Linux Foundation | Production code | Our federated gossip is simpler than DHT; "any system can be a node" vs dedicated node software |
| **ANS** | DNS-inspired, PKI identity | OWASP GenAI Project | IETF draft only, no production | We have running code; they have a draft |
| **Oracle Agent Spec** | Declarative schema ("ONNX for agents") | Oracle | Open-sourced, integrating with AGNTCY | No governance/compliance layer |
| **MCP Registry** | Centralized tool index | Anthropic/LF AAIF | registry.modelcontextprotocol.io | Tool-only, not cross-protocol |
| **A2A Agent Cards** | Per-domain agent discovery | Google, 150+ orgs | .well-known/agent.json | No global search, no federation |
| **JSON Agents / PAM** | Portable Agent Manifest | jsonagents.org | Spec only | No discovery protocol, no policy language |
| **Fetch.ai Almanac** | Blockchain registry | Fetch.ai | Production | Requires crypto transactions; friction |

### Standards Bodies in Play

| Body | Initiative | Deadline | Our Position |
|------|-----------|----------|-------------|
| **NIST CAISI** | AI Agent Security RFI | March 9, 2026 | Submitting comprehensive response |
| **NCCoE** | Agent Identity & Authorization concept paper | April 2, 2026 | Will respond (proposes federal GAID namespace) |
| **AAIF** (Linux Foundation) | Agentic AI governance | Ongoing | Target for OSSA/DUADP contribution |
| **DIF** | Trusted AI Agents WG | Launched Sept 2025 | OSSA's DID+VC+Cedar is ahead of their drafts |
| **OpenID Foundation** | OIDC-A proposal | Oct 2025 whitepaper | Their warning about OAuth2 cracks validates our Cedar approach |
| **IETF** | agent:// URI scheme (draft-narvaneni) | Needs "significant refactoring" | GAID URI is more complete; need our own I-D before they gain traction |

---

## What We're Submitting

### Core Technologies Referenced

| Technology | Version | Status | URL |
|-----------|---------|--------|-----|
| OSSA Spec | v0.4.8 (v0.5.0 Monday) | Production | https://openstandardagents.org/specification |
| DUADP Protocol | v0.2.0 | Production | https://duadp.org |
| Cedar Policies | 135 policies, 3,211 lines | Production | https://compliance.blueflyagents.com |
| OSSA CLI | v0.4.8 | Published (npm) | `npx @bluefly/openstandardagents` |
| DUADP SDK | v0.2.0 (TS/Python/Go) | Published (npm) | `@bluefly/duadp` |

### Live Infrastructure (Referenced in Submission)

| Service | URL | Purpose |
|---------|-----|---------|
| OSSA Website | https://openstandardagents.org | Spec, docs, builder |
| DUADP Website | https://duadp.org | Protocol docs |
| Agent Builder | https://openstandardagents.org/builder | Interactive agent creation |
| Discovery Explorer | https://discover.duadp.org | Federated agent lookup |
| Compliance Engine | https://compliance.blueflyagents.com | Cedar policy authorization |
| Cedar Policies API | https://compliance.blueflyagents.com/api/v1/cedar/policies | Real-time policy evaluation |
| Agent Marketplace | https://marketplace.blueflyagents.com | Drupal-based registry node |
| Agent Registry | https://agents.blueflyagents.com | Core DUADP registry |
| Skills Registry | https://skills.blueflyagents.com | Skills catalog |
| Mesh Network | https://mesh.blueflyagents.com | Agent-to-agent networking |
| Semantic Router | https://router.blueflyagents.com | Intent-based task routing |
| OTel Tracing | https://tracer.blueflyagents.com | OpenTelemetry trace ingestion |

### Production Stats

| Metric | Value |
|--------|-------|
| Cedar policies | 135 across 15 files (3,211 lines) |
| NIST SP 800-53 control families mapped | 7 (AC, AU, SC, IA, CM, SI, CA) |
| Compliance frameworks | 6 (NIST 800-53, AI RMF, SOC2, GDPR, HIPAA, PCI-DSS) |
| Platform export adapters | 22+ (LangChain, CrewAI, OpenAI, Anthropic, Cursor, Claude Code, Docker, K8s, etc.) |
| DUADP conformance tests | 136 passing |
| OSSA JSON Schema | 1,567 lines |
| DUADP protocol types | 1,164 lines |
| CLI commands | 45+ |
| Language SDKs | 3 (TypeScript, Python, Go) |
| Live DUADP nodes | 5+ (agents, skills, toolbox, marketplace, discover) |
| Infrastructure services | 20+ on Oracle Cloud |

---

## Architecture Overview

### The Six Pillars

1. **`openstandardagents`** (Core CLI & Validation) — JSON Schema validation, 45+ CLI commands, 22+ platform export adapters. The "compiler" that translates one manifest into many platform deployments.

2. **`duadp`** (Discovery & Transport) — Federated discovery protocol. DNS TXT bootstrap → WebFinger resolution → gossip federation. DID identity, Ed25519 signatures, 5-tier trust model. 3 language SDKs.

3. **`openstandard-ui` / `studio-ui`** (User Interfaces) — Visual composer, agent catalog, DUADP registry browser. Example consumers showing that any frontend can participate.

4. **`openstandard-generated-agents`** (Deployment Pipeline) — GitLab CI that receives manifests, runs `ossa export`, scores quality, and persists artifacts. The execution infrastructure.

5. **`openstandardagents.org`** (Governance Hub) — Spec hosting, JSON Schema files, protocol docs. Acts as a trusted seed DUADP node.

6. **`marketplace`** (Drupal Registry Node) — Enterprise-grade Drupal implementation of a DUADP registry. Proves that any CMS/backend can be a node.

### How DUADP Resolution Works

```
Client → DNS TXT (_duadp.domain) → discover endpoint
Client → WebFinger (/.well-known/webfinger?resource=uadp://...) → .ajson link
Client → GET .ajson → OSSA manifest with full identity, capabilities, trust
Gossip → Node A publishes agent → broadcasts to peers → Node B caches + verifies DID signature
```

### .ajson: Why It's Different from .json

Standard JSON is a generic serialization format. `.ajson` (Agent JSON) is a semantic contract aligned with OSSA spec:
- **Cryptographic Provenance:** `did:web` or `did:key` identity of creator
- **Tool/Protocol Binding:** Declares exactly which MCP servers, APIs, or A2A capabilities required
- **LLM Context:** System prompts, model constraints, token limits, Cedar policies
- **Cross-Compilable:** Any orchestrator can take `.ajson` and generate LangChain Python, Docker, Go binary, K8s CRD

---

## Key Files

| File | Purpose |
|------|---------|
| `openstandardagents.org/website/content/docs/government/nist-caisi-rfi-response.md` | The full RFI response (820 lines) |
| `openstandardagents.org/website/public/downloads/OSSA-NIST-CAISI-RFI-Response-2026.pdf` | Downloadable PDF |
| `cedar-policies/` | 15 Cedar policy files (3,211 lines, 135 policies) |
| `duadp/sdk/typescript/src/types.ts` | DUADP protocol types (1,164 lines) |
| `openstandardagents/spec/v0.4/agent.schema.json` | OSSA JSON Schema (1,567 lines) |
| `plans/NIST/NIST-2025-0035-0001_content.pdf` | Original NIST RFI document |
| `plans/NIST/architecture-overview.md` | Ecosystem architecture (6 pillars, mermaid diagrams, infrastructure topology) |
| `plans/NIST/competitive-analysis.md` | Competitive analysis & strategic positioning (AGNTCY, ANS, Oracle, standards bodies) |

---

## Timeline

| When | What |
|------|------|
| March 5-7 | CI fixes, site deployments, proposal expansion |
| March 8 (tonight) | PDF generation, compliance landing page, final fixes |
| March 9 (Monday AM) | v0.5.0 release, final proofread, submit to regulations.gov |
| March 9 (deadline) | Submission via regulations.gov (11:59 PM ET) |
| April 2 | NCCoE concept paper response deadline (follow-up) |

---

## Post-Submission Roadmap

### Immediate (Week of March 10)
- IETF Internet-Draft for GAID URI scheme (before draft-narvaneni gains traction)
- NCCoE concept paper response (federal GAID namespace, agent credential format)

### Short-term (March-April)
- OpenJudge rating system integration (replace heuristic scorer in generated-agents pipeline)
- Agent showcase/leaderboard page on openstandardagents.org
- Builder results UI with evaluation scores

### Medium-term (Q2 2026)
- AAIF / Linux Foundation contribution of OSSA/DUADP specs
- Drupal DUADP module (auto-serve .well-known/duadp.json, register agents)
- Kubernetes DUADP operator (watch Agent CRDs, auto-register in federation)
- WordPress DUADP plugin

### Strategic (12-18 month window)
- Establish DUADP as the "DNS for AI agents" before AGNTCY or ANS consolidates
- Infrastructure embedding: ship as module for every major platform
- Neutral governance: contribute specs to standards body
