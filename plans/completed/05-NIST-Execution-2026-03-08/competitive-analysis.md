# DUADP Competitive Analysis: The Race to Become DNS for AI Agents

**Last Updated:** March 8, 2026
**Context:** NIST CAISI RFI (NIST-2025-0035) submission, deadline March 9, 2026

---

## The Discovery Layer Is the Last Unsolved Problem

The agentic AI protocol landscape consolidated in 2025 into a complementary multi-protocol stack:

| Protocol | Layer | Adoption | Governance |
|----------|-------|----------|------------|
| **MCP** | Agent-to-tool connectivity | 97M+ monthly SDK downloads, 5,800+ servers | Linux Foundation AAIF |
| **A2A** | Agent-to-agent communication | 150+ organizations (Adobe, Cisco, SAP, all major clouds) | Google / LF AAIF |
| **AGENTS.md** | Coding-agent context | 60,000+ repositories | Community |
| **AGNTCY** | Infrastructure plumbing | 75+ companies (Cisco, Dell, Google Cloud, Oracle, Red Hat) | Linux Foundation |

**None answers the fundamental question: how does an agent discover the right agent across the entire ecosystem?**

- MCP Registry indexes only MCP servers
- A2A's `.well-known/agent.json` is per-domain with no global search
- Google Agentspace is a proprietary walled garden
- Salesforce AgentExchange serves only Salesforce
- OpenAI GPT Store has 3M+ agents but is OpenAI-locked
- Fetch.ai Almanac requires blockchain transactions

The fragmentation: **10+ major agent marketplaces**, each with different requirements. BCG calculates integration complexity rises **quadratically** without standards. AI agent market projected at **$50B by 2030** with **10,000+ custom agents published weekly**.

**DUADP is the cross-protocol, cross-marketplace discovery layer that addresses this gap.**

---

## GAID URI Scheme vs Competing Agent Identifiers

At least seven competing approaches exist for agent identification:

| Scheme | Format | Resolution | Status |
|--------|--------|------------|--------|
| **GAID (DUADP)** | `uadp://namespace/path` | DNS TXT + WebFinger + gossip (multi-mechanism fallback) | Production (v0.2.0) |
| **IETF agent://** | `agent://authority/path` | HTTPS-hosted descriptors | Draft only; IETF 123 said "significant refactoring" needed |
| **did:wba** (ANP) | `did:wba:domain:user:name` | DID document at domain | Spec only, agent-specific DID method |
| **AID** (DNS-first) | DNS TXT `_agent.domain` | Single TXT record, Ed25519 HTTP signatures | Proposal only |
| **BANDAID** (IETF) | SVCB records `_agents.domain` | DNSSEC + DANE secured | Standards Track draft |
| **jsonagents.org** | `ajson://domain/agents/name` | JSON Schema 2020-12, modular profiles | Spec with examples |
| **WebFinger** (RFC 7033) | `acct:user@domain` | HTTPS `/.well-known/webfinger` | Proven (Mastodon/ActivityPub) |

**GAID's three key differentiators:**

1. **Unifies discovery and identity** — `uadp://skills.sh/tools/web-search` simultaneously identifies the resource AND implies its discovery mechanism (unlike `agent://` which needs separate resolution, or `did:wba` which needs DID document fetching)
2. **Multi-mechanism resolution with fallback** — DNS TXT lookup → WebFinger query → registry API → gossip network. Graceful degradation vs single-mechanism approaches.
3. **Hierarchical namespace** — agents, tools, skills, and workflows under unified addressing scheme. The namespace component (`skills.sh`) enables ecosystem-wide organization.

The closest analog is **WebFinger (RFC 7033)** from ActivityPub/Mastodon — no formal proposal yet combines WebFinger with AI agent discovery, but the pattern is natural. DUADP implements exactly this: WebFinger query for a GAID returns links to A2A Agent Card, MCP server manifest, and OSSA contract simultaneously.

---

## Federated Gossip Beats Both Centralized and Pure P2P

| Approach | Examples | Pros | Cons |
|----------|----------|------|------|
| **Centralized** | MCP Registry, GPT Store, AgentExchange | Curated, fast, quality control | SPOF, vendor lock-in, fragmentation |
| **Pure P2P (DHT)** | AGNTCY (libp2p Kad-DHT), Fetch.ai (blockchain) | No SPOF | Latency, consistency, requires dedicated node software |
| **Federated gossip (DUADP)** | Email/SMTP, Mastodon/ActivityPub | Pragmatic middle, operational accessibility | Requires trust model (solved: 5-tier + DID + Cedar) |

**Critical advantage: "any system can be a node."**

Running a DUADP node can be as simple as hosting a static JSON file at `/.well-known/duadp.json`. A Drupal site, Flask API, Kubernetes operator, or GitHub Pages deployment can participate without DHT infrastructure. AGNTCY's P2P requires dedicated node software maintaining peer tables and routing.

Gossip propagation achieves convergence in **O(log N) rounds** with bounded per-node bandwidth. Nodes that can't maintain persistent connections (serverless, CMS, static sites) participate through polling and cached responses. Nodes that can (dedicated registries, K8s clusters) run full gossip for real-time propagation.

---

## .ajson Fills the Gap Between Protocol Cards and Full Contracts

| Format | Layer | Scope | Governance Info | Trust |
|--------|-------|-------|----------------|-------|
| **A2A Agent Cards** | Protocol-level discovery | A2A agents only | None | Optional JWS |
| **MCP server.json** | Tool-level metadata | MCP servers only | None | None |
| **AGENTS.md** | Human context | Coding agents | None | None |
| **JSON Agents / PAM** | Portable manifest | Multi-framework | Policy expressions | Framework mappings |
| **OSSA .ajson** | Full governance contract | Any protocol | Cedar policies, NIST controls, compliance | DID + Ed25519 + 5-tier trust |

OSSA .ajson serves as a **universal index record** — lightweight enough for discovery, rich enough for governance, pointing to full specifications in any format. Contains: GAID URI, capabilities, endpoint URLs for each protocol (A2A, MCP, OpenAPI), trust tier, provenance signatures.

---

## Direct Competitor Deep Dive

### AGNTCY — Primary Threat

- **Backing:** Cisco, 75+ companies, Linux Foundation
- **Stack:** OASF schema + P2P DHT discovery + Identity service + Messaging + Observability
- **Strengths:** Institutional backing, production code, LF governance
- **Weaknesses:** Architectural complexity (full P2P), Cisco-centric, no contract semantics
- **Our edge:** Simpler federation, OSSA contract layer (Cedar + DID + compliance). "Any system can be a node" vs dedicated node software.

### ANS — Agent Name Service

- **Backing:** OWASP GenAI Security Project
- **Stack:** DNS-inspired, PKI identity, protocol adapters, zero-knowledge proofs
- **Status:** IETF draft submitted, NO production deployment
- **Our edge:** Running code, 136 tests, live nodes. They have a draft.

### Oracle Open Agent Specification

- **Backing:** Oracle, integrating with AGNTCY's OASF
- **Position:** "ONNX for agents" — declarative schema
- **Our edge:** No governance/compliance layer, no discovery protocol

### DIF Trusted AI Agents WG

- **Backing:** Decentralized Identity Foundation (Sept 2025)
- **Focus:** Delegation chains, authorization, human oversight via DIDs + VCs
- **Our edge:** OSSA's GAID + DID + Cedar + VC architecture is already ahead of their specification drafts

### OpenID Foundation OIDC-A

- **Key insight:** Oct 2025 whitepaper warns OAuth 2.0 "reveals significant cracks when agents begin operating with greater autonomy"
- **Our edge:** This warning validates our Cedar ABAC approach. We solve the problem they identified.

---

## The OSSA Contract Layer: Unique Differentiator

**No competitor combines all of these:**

| Capability | OSSA | AGNTCY | ANS | A2A | MCP |
|-----------|------|--------|-----|-----|-----|
| Agent identity (W3C DID) | GAID + did:web + did:key | Identity service | PKI | None | None |
| Authorization | Cedar (formally verified) | None | None | OAuth2 | None |
| Trust tiers | 5-tier model | None | ZK proofs | None | None |
| Compliance (NIST, SOC2, etc.) | 7 frameworks mapped | None | None | None | None |
| Resource governance | Token budgets, SLA | None | None | None | None |
| Crypto provenance | Ed25519 + RFC 8785 | OCI-based | PKI | Optional JWS | None |
| Discovery protocol | DUADP (federated) | P2P DHT | DNS | Per-domain | Centralized |
| Platform exports | 22+ adapters | None | None | None | None |
| Cedar policies | 135 in production | None | None | None | None |

**"MCP provides the hands. A2A provides the voice. OSSA provides the credentials."**

---

## Standards Bodies & Strategic Timing

| Body | Initiative | Deadline | Our Position |
|------|-----------|----------|-------------|
| **NIST CAISI** | AI Agent Security RFI | **March 9, 2026** | Comprehensive response submitted |
| **NCCoE** | Agent Identity & Authorization | **April 2, 2026** | Will respond (federal GAID namespace) |
| **AAIF** (Linux Foundation) | Agentic AI governance | Ongoing | Target for OSSA/DUADP contribution |
| **DIF** | Trusted AI Agents WG | Sept 2025+ | Our architecture is ahead |
| **OpenID Foundation** | OIDC-A proposal | Oct 2025+ | Their OAuth warning validates Cedar |
| **IETF** | agent:// URI | Needs refactoring | Need GAID I-D before they gain traction |

**If NIST references DUADP/OSSA in guidance, we gain institutional legitimacy that SMTP gained from DoD adoption in 1982.**

---

## What Wins: Lessons from Protocol History

| Principle | Example | DUADP Implementation |
|-----------|---------|---------------------|
| **Simplicity** | SMTP: "few options → ubiquity" | Min viable node = static JSON file |
| **Infrastructure embedding** | TCP/IP: DoD mandate 1982, BSD 1983 | Drupal module, WP plugin, Helm chart, npm package |
| **Neutral governance** | HTTP: IETF/W3C | Apache 2.0, NIST submission, AAIF target |
| **Speed** | MCP: 13 months to standard | 12-18 month window before AGNTCY/ANS consolidates |

---

## Bridge-First Integration Strategy

DUADP becomes "THE API" by integrating, not displacing:

1. **Protocol bridges** — GAID resolution returns multi-protocol endpoints: `{"a2a": "...", "mcp": "...", "ossa": "..."}`
2. **Framework adapters** — `duadp.discover(capability="web-search")` returns framework-native objects
3. **Registry connectors** — Index MCP Registry, A2A endpoints, AGNTCY. Universal search layer (like Google indexes the web)
4. **CMS integration** — Every Drupal/WordPress site = DUADP node with zero additional infrastructure
5. **Kubernetes operator** — Watch Agent CRDs, auto-register. Every K8s cluster = DUADP node

---

## Production Evidence (March 8, 2026)

| Metric | Value |
|--------|-------|
| OSSA CLI | v0.4.8 on npm (v0.5.0 March 9) |
| DUADP SDK | v0.2.0 (TypeScript, Python, Go) |
| Export adapters | 22+ platforms |
| Cedar policies | 135 (3,211 lines, 15 files) |
| NIST controls mapped | 7 SP 800-53 families |
| Conformance tests | 136 passing |
| Live nodes | 5+ DUADP nodes |
| Infrastructure | 20+ services on Oracle Cloud |
| Sites | openstandardagents.org, duadp.org, compliance.blueflyagents.com, marketplace.blueflyagents.com, discover.duadp.org |
