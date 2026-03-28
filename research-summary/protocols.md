# Protocols and Standards for Agentic AI (2025-2026)

This document summarizes major protocol efforts relevant to interoperable, governable agent systems. Citations use keys from `reading-list.md`.

## 1) Protocol landscape at a glance

| Protocol / spec | Primary scope | Transport / shape | Discovery primitive | Governance status | Notes |
| --- | --- | --- | --- | --- | --- |
| MCP | Agent-to-tool/data connectivity | Client-server protocol, multiple SDKs | MCP server catalogs/registries | Open-source ecosystem, broad multi-vendor support | Dominant tool-interconnect layer [T15][T16][T17] |
| A2A | Agent-to-agent interoperability | HTTP/JSON-RPC/SSE (+ gRPC binding track) | Agent Card (`.well-known/agent-card.json`) | Linux Foundation-backed project, versioned spec | Strong momentum and broad partner claims [T19][T20][T21][T22] |
| AG-UI | Agent-to-user interface event protocol | Event-based over HTTP/WebSocket/SSE variants | Integration-level (framework/client adapters) | Open protocol, framework adapters expanding | Covers UX/runtime interactivity gap [T24] |
| ANP | Open-internet agent networking model | HTTP + JSON-LD + DID focus | `.well-known` + semantic descriptions | Open-source community effort | Emphasis on decentralized identity and negotiation [T25][T26] |
| ACP | REST-first agent communication | HTTP REST | Online/offline discovery patterns | Now aligned with A2A trajectory | Strong for simple API-native integration [T27][T28] |
| LangChain Agent Protocol | Framework-agnostic serving API for agents | OpenAPI-defined HTTP endpoints | Agent introspection endpoints | Open spec from LangChain ecosystem | Focus on runs/threads/store primitives [T29][T30] |
| DUADP | Federated discovery/registry protocol | REST + MCP exposure | DNS/WebFinger/well-known + federation | Project-driven ecosystem (Bluefly) | Discovery plane rather than runtime protocol [T01][T02][T03] |
| OSSA | Agent manifest contract/spec layer | YAML/JSON + CLI/export adapters | Registry/discovery integration via exports and DUADP | Project-driven open standard positioning | Not a runtime protocol; a contract layer [T04][T05][T06] |
| ATP (Monday) | Code-execution-first agent tool protocol | API composition + sandboxed code execution model | API/source cataloging | Vendor-led open project | Contrasts tool-calling with code-writing approach [T31][T32] |

## 2) MCP (Model Context Protocol)

MCP is now the default baseline for connecting agents/LLM applications to external systems (tools, data sources, workflows). The official framing is a universal open standard replacing one-off connectors with standardized integrations [T15][T16].

### Design goals
- decouple model/application logic from bespoke integration code,
- enable reusable client/server interfaces,
- support secure two-way connections to enterprise systems [T15].

### Practical adoption signals
- broad support across assistant/dev-tool ecosystem,
- large and active server catalog and SDK footprint [T16][T17][T18].

### Key implication
MCP is increasingly treated as infrastructure plumbing rather than a differentiating application feature.

## 3) A2A (Agent2Agent)

A2A standardizes communication among independent agents and emphasizes:
- capability discovery,
- task delegation and lifecycle management,
- async and streaming interaction patterns,
- secure collaboration without exposing internal agent internals [T19][T20].

### Agent discovery model
A2A uses Agent Cards as standardized self-descriptions, typically served from well-known paths and/or registries [T21].

### Governance and ecosystem
- current docs track a released 1.0.0 specification [T20],
- ecosystem messaging highlights broad industry participation [T22][T23].

## 4) AG-UI (Agent-User Interaction Protocol)

AG-UI addresses the frontend/runtime interaction layer for agentic applications:
- event-streaming semantics,
- multimodal and interactive UI flows,
- human-in-the-loop and state synchronization primitives [T24].

It is complementary to MCP and A2A: MCP connects tools, A2A connects agents, AG-UI structures agent-to-interface interaction [T24].

## 5) ANP and ACP

### ANP
ANP positions itself as an internet-scale agent networking protocol:
- DID-centric identity and secure communication,
- meta-protocol negotiation,
- JSON-LD semantic descriptions and discovery [T25][T26].

### ACP
ACP emphasizes a lightweight, REST-first interoperability model:
- broad modality support,
- async and streaming friendly,
- designed to interoperate across frameworks and stacks [T27][T28].

ACP documentation indicates alignment into the broader A2A/Linux Foundation path, signaling potential future convergence of standards tracks [T27].

## 6) LangChain Agent Protocol

LangChain's Agent Protocol codifies framework-agnostic serving APIs centered on:
- **runs** (execution),
- **threads** (stateful multi-turn workflows),
- **store** (long-term memory abstractions) [T29][T30].

This is less a transport protocol between independent organizations and more a standard serving surface for agent applications in production.

## 7) DUADP + OSSA in the standards stack

### DUADP
DUADP focuses on discovery/federation:
- node manifests,
- search/indexing endpoints,
- federation peer synchronization,
- DID/trust-oriented metadata,
- MCP tool exposure for node operations [T01][T02][T03].

### OSSA
OSSA focuses on portable manifest/contract definitions and export pipelines:
- schema validation,
- deployment target generation,
- governance/compliance metadata embedding [T04][T05][T06].

Together, they represent a "contract + discovery" layer that can sit above transport protocols.

## 8) Comparative implementation guidance

### If your primary need is tool integration
Start with MCP [T15][T16].

### If your primary need is cross-agent orchestration
Use A2A-compatible interfaces (and evaluate ACP compatibility where REST-first simplicity is needed) [T19][T27].

### If your primary need is frontend interactivity
Add AG-UI capabilities [T24].

### If your primary need is portability across deployment targets
Use a manifest contract layer (for example OSSA-style approach) and keep runtime/protocol concerns decoupled [T04][T06].

### If your primary need is federated discovery
Adopt explicit discovery plane architecture (for example DUADP-like patterns or equivalent registry mesh) [T01][T02].

## 9) Risks and unresolved questions

- **Protocol overlap risk:** Teams may adopt multiple standards without a clear boundary model.
- **Security handoff risk:** Inter-protocol boundaries (MCP ↔ A2A ↔ UI) can become policy blind spots.
- **Vendor-claim inflation:** Adoption metrics can be directional rather than independently audited [T22][T31].
- **Spec drift risk:** Fast-moving versions can outpace production implementation hardening.

## 10) Bottom line

The ecosystem is moving toward modular protocol layering rather than single "winner-take-all" standards. The most resilient architecture in 2026 is a composable stack:

- tool connectivity layer (MCP),
- inter-agent collaboration layer (A2A/compatible),
- explicit contract/discovery layer,
- identity- and policy-centric security overlays [T15][T19][T47].
