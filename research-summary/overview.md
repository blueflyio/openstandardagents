# Agentic AI Ecosystem Research (2026): Overview

Date completed: April 2, 2026  
Coverage window: late-2025 to early-2026 materials, with selective foundational references.

## Executive synthesis

The current agent stack is separating into five layers:

1. **Agent-to-tool/data connectivity** (MCP).
2. **Agent-to-agent collaboration** (A2A, ACP, ANP-style approaches).
3. **Agent contract/packaging** (manifest standards such as OSSA).
4. **Discovery and trust routing** (registries, federation, identity-backed discovery such as DUADP).
5. **Security governance and IAM** (authorization, monitoring, policy, audit, non-repudiation). [SRC-01][SRC-02][SRC-03][SRC-04][SRC-05][SRC-06][SRC-07][SRC-08][SRC-09]

The strongest macro pattern: interoperability standards are maturing faster than operational security governance.

---

## What DUADP is (duadp.org + npm package)

DUADP presents itself as a decentralized discovery protocol for agent resources (agents, skills, tools), combining:

- `/.well-known` discovery metadata.
- WebFinger and DNS-style discovery semantics.
- Federated peer registration/gossip/fanout search.
- Signature and DID-oriented trust metadata.
- API and MCP-facing integration points for discovery operations. [SRC-19][SRC-20]

On npm, `@bluefly/duadp` is published as a TypeScript SDK (Apache-2.0), with explicit positioning around discovery, federation, and trust-aware registry workflows. Point-in-time npm metadata on April 2, 2026: v0.1.4, 65 weekly downloads. [SRC-20]

**Interpretation:** DUADP is attempting to become a discovery/control-plane layer for the "agentic web," analogous to how DNS plus identity signals help route and trust web endpoints.

---

## What OpenStandardAgents is (openstandardagents.org + npm package)

OpenStandardAgents (OSSA) positions itself as a portable contract layer for agents:

- Define an agent once in a schema-validated YAML manifest.
- Embed governance/compliance metadata.
- Export the same definition to multiple runtimes/platform formats.
- Integrate with MCP/A2A ecosystems as referenced interfaces rather than replacing those protocols. [SRC-21][SRC-22]

On npm, `@bluefly/openstandardagents` is published as an Apache-2.0 package. Point-in-time npm metadata on April 2, 2026: v0.5.1, 12 weekly downloads. [SRC-22]

**Interpretation:** OSSA is best understood as an OpenAPI-like layer for agent packaging and portability, not as an on-wire transport protocol.

---

## High-signal findings for 2026

### 1) Protocol convergence is real, not hypothetical

- MCP is broadly established for tool/data access.
- A2A moved into Linux Foundation governance and has broad partner participation.
- ACP and ANP continue as meaningful alternatives/complements with different tradeoffs (REST simplicity, decentralized identity/network ambitions). [SRC-01][SRC-02][SRC-03][SRC-04][SRC-07][SRC-16][SRC-17][SRC-18]

### 2) Security remains the primary scaling constraint

- Gravitee survey data shows strong deployment velocity but weak security completion rates and frequent incidents.
- MIT AI Agent Index reports major transparency gaps in safety disclosures.
- NIST NCCoE is explicitly asking industry to standardize software/AI-agent identity and authorization controls. [SRC-23][SRC-24][SRC-30][SRC-50][SRC-51]

### 3) Identity and authorization are shifting left into architecture

Recent publications and standards work increasingly frame agent identity, delegated authority, and policy enforcement as first-class runtime controls rather than post-hoc compliance checks. [SRC-09][SRC-17][SRC-30][SRC-35]

### 4) Framework maturity is high enough for production in bounded domains

OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, and LlamaIndex all support credible production patterns, but cost/reliability can degrade quickly in unconstrained multi-agent topologies. [SRC-42][SRC-43][SRC-40][SRC-41][SRC-44][SRC-46]

---

## Evidence quality and limitations

- Claims on protocols and standards are anchored to primary sources (official docs, project repos, foundation/standards announcements).
- Industry blogs are used for operational perspective and cost/reliability heuristics; these are directional and should be validated against internal benchmarks before policy adoption.
- Some management publications can be partially paywalled; where access was limited, corroborating public sources were used and noted in the reading list. [SRC-47][SRC-49]

---

## Document map

- University and research landscape: `academia.md`
- Protocol and standards comparison: `protocols.md`
- Frameworks, projects, and repo maturity: `frameworks.md`
- Security, IAM, governance, and incidents: `security.md`
- Industry blog synthesis and recommendations: `blogs.md`
- Complete bibliography and citation keys: `reading-list.md`
