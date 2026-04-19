# Protocols, Standards, and Interoperability (2025-2026)

## Scope

This document compares major open protocols relevant to agentic AI, with emphasis on:
- design goals
- architecture patterns
- protocol surfaces
- adoption and governance status
- security implications

Citations use tether IDs from `reading-list.md` (for example, [S06]).

---

## 1) Model Context Protocol (MCP)

MCP began as an Anthropic-led open standard (announced November 25, 2024) for connecting AI applications to data sources, tools, and external systems via a common protocol instead of custom one-off integrations [S06]. Core language in the launch emphasizes “secure, two-way connections” and a shared specification + SDK approach [S06].

By late 2025, MCP governance moved into Linux Foundation AAIF, with Anthropic explicitly donating MCP and citing ecosystem adoption such as >10,000 public MCP servers and 97M+ monthly SDK downloads (Python + TypeScript) [S07][S08]. MCP is now framed as neutral critical infrastructure rather than a single-vendor extension [S07][S08].

### MCP snapshot
- **Layer**: Agent <-> tools/data
- **Design center**: tool interoperability, context access, secure connection model
- **Transport style**: protocol-specific (commonly JSON-RPC ecosystems and server/client model per MCP docs references)
- **Governance**: Linux Foundation AAIF (from Dec 9, 2025) [S07][S08]
- **Adoption signals**: broad platform support claims in Anthropic post and AAIF statement [S07][S08]

---

## 2) Agent2Agent (A2A)

A2A was introduced by Google in April 2025 as an open protocol for agent-to-agent collaboration across frameworks and vendors [S09]. It is explicitly complementary to MCP: A2A handles inter-agent coordination while MCP handles tool/context integration [S09].

Google’s 2025 update (A2A v0.3) highlights gRPC support, signed security cards, and growing ecosystem support with “150+ organizations” [S10]. A2A was also contributed to Linux Foundation governance structures in 2025 according to Google and partner communications [S10].

Key protocol objects include **Agent Cards** (JSON capability descriptors) and **tasks/artifacts** lifecycle semantics [S09].

### A2A snapshot
- **Layer**: Agent <-> agent
- **Design center**: capability discovery, task delegation, multi-agent orchestration
- **Transport style**: HTTP/SSE/JSON-RPC baseline + newer gRPC support [S09][S10]
- **Governance**: Linux Foundation-hosted project trajectory [S10]
- **Adoption signals**: launch with >50 partners; expanded ecosystem claims at 150+ [S09][S10]

---

## 3) AG-UI (Agent-User Interaction Protocol)

AG-UI positions itself as a protocol for agent-backend and user-facing frontend interaction: event-based, bi-directional, transport-flexible (HTTP/WebSockets/SSE style), and oriented to interactive UX (streaming, interrupts, multimodality, shared state) [S11].

AG-UI explicitly places itself alongside MCP and A2A as a complementary layer (user interaction vs tool and inter-agent layers) [S11].

### AG-UI snapshot
- **Layer**: Agent <-> user interface
- **Design center**: event-based UX interoperability
- **Transport style**: transport agnostic/event stream semantics
- **Governance/maturity**: open protocol with rapidly expanding ecosystem docs [S11]

---

## 4) Agent Network Protocol (ANP)

ANP is presented by its maintainers as aiming to become “HTTP of the Agentic Web era,” with a three-layer model:
1. identity + secure communication (W3C DID grounding),
2. meta-protocol negotiation,
3. application protocol layer for capability description and domain protocols [S12].

The project’s framing is explicitly “protocol-first” against platform silos [S12].

### ANP snapshot
- **Layer**: networked agent internet stack
- **Design center**: open interconnection + decentralized identity + negotiated capability protocols
- **Architecture**: 3-layer model (identity / meta / app) [S12]
- **Governance/maturity**: active OSS project with SDK workstream [S12]

---

## 5) LangChain Agent Protocol

LangChain’s Agent Protocol is a framework-agnostic API contract for serving agents in production, centered on **runs**, **threads**, and **store** endpoints [S13]. It is less about wire-level inter-agent federation, more about operational serving semantics and introspection for deployable agent runtimes [S13].

### LangChain Agent Protocol snapshot
- **Layer**: runtime serving API for agents
- **Design center**: production API uniformity (execution, threading, memory)
- **Artifacts**: OpenAPI-defined endpoints (runs/threads/store) [S13]
- **Interoperability role**: app/runtime interoperability rather than network discovery

---

## 6) ACP and adjacent protocols (including Monday ATP)

IBM describes ACP as a REST-oriented open standard for agent communication, emphasizing lower integration friction than function-calling-centric approaches; importantly, IBM now notes ACP has merged toward A2A under Linux Foundation umbrella [S14]. This makes ACP more historically and conceptually relevant than likely long-term dominant as a distinct lineage.

Monday’s Agent Tool Protocol (ATP) is a code-execution-centric protocol surface (sandboxed TS/JS) that argues for richer composability than traditional function-call schemas in certain tool-heavy workflows [S15]. ATP is not a universal inter-agent standard in the same sense as A2A/MCP, but it is meaningful as a specialized runtime protocol for tool orchestration [S15].

---

## Comparative table (high-level)

| Protocol | Primary problem solved | Typical artifact(s) | Main interaction scope | Governance trend |
|---|---|---|---|---|
| MCP | Standardized tool/data connectivity | MCP servers, tools/resources/prompts | Agent <-> tools/data | AAIF/Linux Foundation [S07][S08] |
| A2A | Cross-agent collaboration and delegation | Agent Card, task/artifact lifecycle | Agent <-> agent | Linux Foundation trajectory [S10] |
| AG-UI | Standardized agent UX interaction | Event streams/messages | Agent <-> frontend/UI | Open protocol ecosystem [S11] |
| ANP | “Agent internet” layered architecture | DID identity, negotiated protocols | Agent-network fabric | Community-driven OSS [S12] |
| LangChain Agent Protocol | Production serving APIs for agents | OpenAPI runs/threads/store | Runtime/API clients <-> agent service | LangChain ecosystem standard [S13] |
| ACP (IBM/BeeAI) | Lightweight inter-agent communication | HTTP REST contract | Agent <-> agent | Merging into A2A line [S14] |
| ATP (Monday) | Secure code-first tool execution | Sandboxed runtime + runtime SDK | Agent <-> external APIs/tools | Vendor-led OSS protocol [S15] |

---

## 7) What this means for architecture decisions

### Practical stack convergence (2026 pattern)
Most production teams appear to combine:
- **MCP** for tool/data access,
- **A2A** for inter-agent workflow,
- **AG-UI** (or custom equivalent) for user interaction,
- plus a **runtime serving contract** (for example LangChain Agent Protocol-like) for lifecycle ops [S09][S11][S13].

### Governance trajectory
The strongest signal in 2025-2026 is institutional convergence under neutral foundations (especially Linux Foundation AAIF and related projects), which lowers vendor lock-in risk and increases confidence for enterprise adoption [S07][S08][S10][S14].

### Security consequence
Protocol adoption alone does not solve prompt injection or over-privilege risk. Security controls still require:
- identity-bearing agents,
- explicit authorization boundaries,
- runtime observability and policy enforcement [S16][S25][S27].

