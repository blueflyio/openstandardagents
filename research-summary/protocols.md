# Protocols and Standards: Comparative Analysis (2025-2026)

This document compares major protocols and standards in the agent ecosystem, with special emphasis on DUADP and OSSA.

## 1) Positioning map

A practical way to map the protocol stack:

- **Agent <-> tool/data/context**: MCP. [R13][R15]
- **Agent <-> agent coordination**: A2A, ACP, ANP (different assumptions/scope). [R18][R24][R22]
- **Agent <-> user interface runtime events**: AG-UI. [R20][R21]
- **Agent contract/manifest portability**: OSSA. [R04][R05][R06]
- **Agent discovery/federation/trust routing**: DUADP. [R01][R02][R03]
- **Agent serving APIs for runs/threads/store**: LangChain Agent Protocol. [R23]

## 2) Deep dive: DUADP

### What it is

DUADP is presented as a decentralized universal discovery protocol for AI agents/skills/tools, with:

- web-native discovery surfaces (`/.well-known`, WebFinger, DNS TXT),
- federated node gossip,
- DID-linked identity and trust concepts,
- REST + MCP-compatible access surfaces,
- SDK distribution via npm (`@bluefly/duadp`). [R01][R02][R03]

### Architectural intent

DUADP claims to solve the "missing discovery layer" between transport protocols and runtime execution by making registries interoperable/federated instead of siloed.

### Current adoption signal

The package and site indicate early-stage but active usage (weekly downloads in the low hundreds in this snapshot). [R03][D02]

## 3) Deep dive: OSSA (Open Standard Agents)

### What it is

OSSA is positioned as a vendor-neutral manifest/contract standard for agents, intended to define identity, capabilities, trust/governance metadata, and export paths across platforms.

### Architectural intent

OSSA explicitly frames itself as complementary to MCP and A2A: not replacing transport protocols, but adding portability/governance and deployment-target conversion.

### Current adoption signal

OSSA package metadata shows a broad CLI/export surface and higher dependency footprint, consistent with tooling-platform scope. Weekly downloads in this snapshot exceed DUADP but remain early-stage by mainstream package standards. [R06][D02]

## 4) Other major protocols

### MCP (Model Context Protocol)

- Originated by Anthropic as open standard for secure two-way model-tool/data connections. [R13]
- Later moved to Linux Foundation stewardship (AAIF) with broad platform claims and connector growth. [R14]
- Ecosystem role: standardized tool/context interface, not full agent lifecycle standard. [R15]

### A2A (Agent2Agent)

- Open protocol for inter-agent communication and capability discovery via Agent Cards.
- Built on common web primitives and supports synchronous/streaming/async models.
- Official materials now highlight broad partner ecosystem and formal specification maturity (v1.0 context). [R16][R17][R18][R19]

### AG-UI

- Event-based protocol for agent-backend to frontend/user interaction surfaces.
- Defines lifecycle/state/tool call event semantics and transport flexibility (SSE-first but transport-agnostic design language). [R20][R21]

### ANP (Agent Network Protocol)

- Vision statement: "HTTP of the Agentic Web era."
- Emphasizes decentralized identity and a three-layer architecture (identity/security, meta-protocol negotiation, application layer capability description). [R22]

### ACP (Agent Communication Protocol)

- Open protocol focused on multimodal messaging/session-oriented communication.
- Current status explicitly indicates ACP being absorbed under A2A/Linux Foundation trajectory, implying ecosystem convergence pressure. [R24]

### Monday Agent Tool Protocol (ATP)

- Code-first, sandboxed code-execution protocol framing itself as an alternative/complement where function-call schema overhead is a limitation.
- Focuses on runtime SDK, parallelism, provenance/security controls, and API/MCP integration.
- Not an industry standard body protocol, but a notable practical pattern. [R25]

### LangChain Agent Protocol

- Framework-agnostic serving API proposal centered on Runs, Threads, and Store primitives.
- Useful reference for production serving interfaces and observability-friendly agent operations. [R23]

## 5) Comparative table (condensed)

| Protocol/Spec | Primary scope | Core artifact | Transport style | Discovery model | Governance/security emphasis | Adoption signal |
|---|---|---|---|---|---|---|
| MCP | Tool/data connectivity | MCP server schema/endpoints | JSON-RPC and related bindings | Directory/registry + app ecosystem | Tool access controls; ecosystem hardening | Broad cross-vendor support claims [R13][R14][R15] |
| A2A | Agent collaboration | Agent Card + task/message model | JSON-RPC/HTTP, streaming, async | Well-known agent card + registries | Enterprise auth/interop patterns | 50+ to 150+ org support claims depending on date [R16][R17][R18] |
| AG-UI | Agent-UI interaction | Typed event model | SSE + other transports | N/A (interface protocol) | Lifecycle/state/event controls | Growing framework integrations [R20][R21] |
| ANP | Open agent network | Layered protocol model | SDK-defined | Decentralized network framing | DID and secure communication core | Active OSS repo, early ecosystem [R22][D01] |
| ACP | Agent/application/human messaging | Message/run/session model | REST-oriented + streaming | Agent manifests/endpoints | Session and interoperability controls | Convergence toward A2A path [R24] |
| OSSA | Agent contract portability | YAML manifest/schema | Export/transformation tooling | Via registries/discovery layers | Explicit compliance/trust metadata | Early-stage but active CLI/package [R04][R05][R06] |
| DUADP | Federated discovery/trust | Discovery manifest + GAID/DID constructs | REST + MCP interface claims | DNS/WebFinger/.well-known + gossip federation | DID + trust-tier + governance endpoints | Early-stage, active npm/site [R01][R02][R03] |
| LangChain Agent Protocol | Serving APIs for agents | OpenAPI (runs/threads/store) | HTTP APIs | Service endpoint discovery | Operational consistency | Niche but concrete spec use [R23] |
| ATP | Code-execution oriented tooling protocol | Runtime SDK + sandbox model | HTTP APIs and adapters | API catalog/search | Provenance and sandbox emphasis | Early OSS practical adoption [R25][D01] |

## 6) Design trend: complementary standards, not replacement wars

A repeat pattern in primary docs:

- A2A docs call out complementarity with MCP. [R16][R18]
- AG-UI docs explicitly situate itself alongside MCP and A2A. [R20]
- OSSA framing positions itself as a missing contract layer above protocol transport. [R04][R05]
- DUADP framing positions itself as missing discovery layer.

Interpretation: **stack composition** is likely to dominate implementation architecture, not a single protocol winner.

## 7) Risks and unresolved issues

1. **Identity portability vs trust portability**: DID presence does not automatically solve trust adjudication across domains.
2. **Registry fragmentation**: discovery remains fragmented if federation incentives are weak.
3. **Security model mismatch**: protocol-level auth assumptions are often stronger than real enterprise identity hygiene.
4. **Spec drift risk**: rapid updates across repos can outpace interoperability testing.

## 8) Practical conclusion for protocol strategy

For organizations building now:

- treat MCP as baseline tool-connectivity plumbing,
- evaluate A2A/ACP/ANP depending on inter-agent coordination requirements,
- use AG-UI where user-facing interaction state/events are first-class,
- adopt manifest discipline (OSSA-like approach) to prevent platform lock-in,
- treat discovery (DUADP-like layer or equivalent) as separate architecture concern,
- invest early in policy/identity controls regardless of protocol choice.
