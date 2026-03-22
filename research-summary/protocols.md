# Agentic Protocols and Standards (2025-2026)

## Quick comparison

| Protocol | Primary role | Transport/pattern | Discovery primitive | Current adoption signal |
| --- | --- | --- | --- | --- |
| MCP | Agent/tool connectivity | Client-server, typed tool/resource exchange (JSON-RPC style ecosystem) | MCP server registration/config | Broad multi-client support and large open server ecosystem.[R06][R07] |
| A2A | Agent-to-agent coordination | HTTP + JSON-RPC + SSE patterns for tasks/artifacts | Agent Card (`.well-known`) | Large multi-vendor consortium; Linux Foundation governance.[R08][R10][R12] |
| AG-UI | Agent-UI interaction | Event streaming over HTTP/WebSocket/SSE | Client-server event contracts | Growing OSS + SDK adoption; high npm activity.[R14][R15][R17] |
| ANP | Agent-network architecture | Multi-layer model (identity, negotiation, app protocols) | DID + capability description | Active OSS/spec community; smaller than MCP/A2A.[R20][R21] |
| Agent Protocol (LangChain) | Framework-agnostic serving API for agents | REST endpoints for runs/threads/store | API-level discovery/introspection endpoints | Implemented/supported in LangGraph ecosystem.[R18][R19] |
| ACP | Lightweight cross-framework agent communication | REST-first (sync/async/stream) | Metadata and endpoint-based discovery | IBM/BeeAI origin; now converging toward A2A project path.[R22][R23] |
| ATP (monday.com) | Code-execution-centric tool orchestration | Agent writes/executes code against APIs | Tool/API discovery in gateway/server model | Early but notable enterprise-origin protocol proposal.[R24][R25] |
| DUADP | Federated capability discovery/registry layer | REST + federation mechanisms + identity endpoints | Well-known manifest + DNS/WebFinger style mechanisms | Early-stage ecosystem; paired with OSSA narrative.[R01][R02][R04] |

---

## 1) MCP (Model Context Protocol)

**Design goal:** replace bespoke model-tool integrations with one open interface for context/tool access.[R06][R07]

**Architecture:** MCP servers expose tools/resources/prompts; MCP clients connect to them under a common contract.[R06][R07]

**Why it matters:** MCP has become the de facto baseline for agent-to-tool interoperability in 2026, with broad support across assistant and IDE ecosystems.[R07]

---

## 2) A2A (Agent2Agent)

**Design goal:** make agents from different frameworks/vendors collaborate securely without exposing internal implementation details.[R08][R10]

**Core primitives:** Agent Card-based capability discovery, task lifecycle management, artifacts/messages, long-running task support, modality flexibility.[R08][R10]

**Adoption trend:** moved from Google-origin launch to Linux Foundation project with large partner base and ongoing spec/tooling expansion.[R09][R12][R13]

---

## 3) AG-UI (Agent-User Interaction Protocol)

**Design goal:** standardize agent/frontend interaction so UX teams don’t rebuild bespoke streaming/event plumbing per framework.[R14]

**Core primitives:** lifecycle, message, tool-call, state, activity, and custom events with shared schemas; transport agnostic (HTTP/SSE/WebSocket).[R15]

**Adoption trend:** strong OSS momentum and broad integration claims across agent frameworks and SDKs.[R14][R16][R17]

---

## 4) ANP (Agent Network Protocol)

**Design goal:** "HTTP of the agentic web" framing with explicit identity, negotiation, and application layers.[R20][R21]

**Three-layer model:**

1. DID-based identity and secure communication,
2. meta-protocol negotiation,
3. application-level capability/protocol expression.[R20][R21]

**Positioning:** more network-architecture ambitious than typical API protocol specs, but ecosystem scale remains smaller than MCP/A2A.[R20][R64]

---

## 5) LangChain Agent Protocol

**Design goal:** framework-agnostic API model for serving/operating agents in production.[R18][R19]

**Core primitives:** runs (stateless + background), threads (history/state/concurrency), store (long-term memory), agent introspection endpoints.[R18]

**Positioning:** operational API contract for deployed services rather than wire-level inter-agent protocol.

---

## 6) ACP (Agent Communication Protocol)

**Design goal:** simple HTTP-native protocol for cross-framework agent communication with multimodal and async support.[R22][R23]

**Notable status:** ACP documentation now points to transition/convergence into A2A under Linux Foundation community direction.[R22][R23]

---

## 7) ATP (Agent Tool Protocol, monday.com)

**Design goal:** move from rigid tool-calling to controlled code-execution model where agents compose API operations directly.[R24]

**Claimed advantages:** better composition, less context bloat, fewer round-trips, and stronger control via sandboxing/approvals for risky operations.[R24]

**Maturity note:** promising but early; ecosystem and independent benchmarks are limited compared with MCP/A2A/AG-UI.[R24][R25]

---

## 8) DUADP (Discovery layer focus)

**Design goal:** federated discovery/registry of agents, skills, and tools with identity/trust metadata, positioned as missing discovery layer between tool and agent-communication protocols.[R01][R04]

**Core ideas:** well-known manifests, GAID/DID concepts, registry/search endpoints, federation and governance endpoints, npm SDK availability.[R01][R02][R04]

**Maturity note:** highly active positioning and feature breadth; ecosystem appears early and concentrated around the originating community.[R01][R64]

---

## Practical protocol selection heuristic

| Need | Best starting protocol choice |
| --- | --- |
| Connect agents to enterprise tools quickly | MCP first.[R07] |
| Coordinate multiple autonomous agents | A2A first, plus MCP for tool access.[R10] |
| Build real-time product UI around agents | AG-UI + MCP/A2A backend mix.[R14][R15] |
| Experiment with REST-native cross-agent patterns | ACP-compatible models (with A2A migration awareness).[R22] |
| Explore code-centric agent tooling | ATP pilots in controlled environments.[R24] |
| Add federated discovery/registry semantics | DUADP-style discovery layer concepts.[R01][R04] |

