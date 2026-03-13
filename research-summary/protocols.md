# Protocols and Standards

Reference date for relative time normalization: **March 10, 2026**.

## 1) DUADP and OSSA (the two properties you asked about)

## DUADP (`duadp.org`)

DUADP presents itself as a decentralized discovery protocol for agents, skills, and tools, analogous to DNS-like discovery for AI capabilities. First-party materials emphasize:

- decentralized discovery manifests (`/.well-known/...`)
- federated node exchange / gossip behavior
- DID-backed identity and trust
- OSSA-native publishing and validation pathways [SRC-01][SRC-04][SRC-05]

In practice, this positions DUADP as a **discovery + federation layer** rather than a model runtime.

## OSSA (`openstandardagents.org`, package `@bluefly/openstandardagents`)

OSSA is presented as a contract/specification layer for agent manifests, intended to be protocol-agnostic and platform-portable. It emphasizes schema validation, conformance, and export workflows across multiple targets. [SRC-02][SRC-03][SRC-06]

In practice, OSSA is best interpreted as a **declarative contract layer** for interoperability/governance metadata.

## 2) Major ecosystem protocols

### MCP (Model Context Protocol)

- Originated by Anthropic as an open standard for connecting AI apps with tools/data via standardized server/client interactions. [SRC-07]
- Current spec framing includes JSON-RPC 2.0 messaging, capability negotiation, and defined server/client features (resources, prompts, tools). [SRC-08]
- Governance broadened through transfer to the Linux Foundation's Agentic AI Foundation in late 2025. [SRC-09]

### A2A (Agent2Agent)

- Announced by Google as open agent interoperability protocol.
- Uses Agent Cards for capability discovery and supports enterprise-oriented task delegation patterns over standard web transports (HTTP, SSE, JSON-RPC semantics). [SRC-10][SRC-12]
- Google Cloud reported support from 150+ organizations and version progression in 2025. [SRC-11]

### AG-UI

AG-UI focuses on the **agent <-> user interface** boundary with event-driven interaction contracts and transport flexibility (SSE/WebSockets/webhooks/HTTP). [SRC-13][SRC-14]

### ANP (Agent Network Protocol)

ANP describes a three-layer architecture:

1. DID-based identity + secure communication
2. meta-protocol negotiation
3. application capability protocol layer [SRC-15]

It explicitly positions itself as "HTTP of the Agentic Web" (project vision language). [SRC-15]

### LangChain Agent Protocol

A framework-agnostic API specification focused on operational primitives such as:

- `runs` (execution)
- `threads` (stateful interaction lifecycle)
- `store` (memory/data abstractions) [SRC-16]

### ACP (Agent Communication Protocol)

ACP is an open protocol for communication between agents, applications, and humans, with OpenAPI-described endpoints and multimodal message concepts in project docs. [SRC-17][SRC-18]

### Monday Agent Tool Protocol (ATP)

ATP is positioned as code-first, sandboxed tool interaction where agents execute generated JS/TS in controlled runtime boundaries, including policy controls to reduce unsafe tool behavior. [SRC-19]

## 3) Comparative snapshot

| Protocol / Standard | Primary purpose | Scope boundary | Message/transport orientation | Identity/trust orientation | Adoption signal (as of Mar 2026) |
|---|---|---|---|---|---|
| DUADP | Federated discovery of agents/skills/tools | Discovery + registry federation | HTTP endpoints + well-known manifests | DID/signature-oriented claims | Early-stage; active npm + spec pages [SRC-01][SRC-05] |
| OSSA | Agent contract manifest standard | Definition/governance layer | YAML/JSON schema-driven artifacts | Trust tiers + provenance framing | Active docs + npm release cadence [SRC-02][SRC-06] |
| MCP | Agent-tool/data interoperability | Tool/data integration | JSON-RPC-based protocol over supported transports | AuthN/AuthZ profile emerging in specs | Broad ecosystem integration, LF governance move [SRC-08][SRC-09] |
| A2A | Agent-agent task interoperability | Cross-agent collaboration | JSON-RPC + HTTP/SSE patterns, Agent Cards | Enterprise security posture in design docs | 150+ org support (Google claim) [SRC-10][SRC-11] |
| AG-UI | Agent-user interaction standardization | UI/event layer | Event-driven; SSE/WebSocket/webhook compatible | Delegated to app/security architecture | Fast OSS uptake in frontend tooling [SRC-14] |
| ANP | Open agent network architecture | Full-stack network vision | Multi-layer protocol family | W3C DID-centric identity layer | Growing OSS community footprint [SRC-15] |
| Agent Protocol | Framework-agnostic serving API | Runtime management API | REST endpoints (`runs`/`threads`/`store`) | Depends on implementation | Implemented in LangGraph ecosystem [SRC-16] |
| ACP | Lightweight agent communications | Agent/app/human exchanges | REST/OpenAPI + multimodal messages | Platform-dependent | OSS reference SDKs + docs [SRC-17] |
| ATP | Secure code-mediated tool execution | Agent runtime/tool invocation | Runtime-executed code + adapters (OpenAPI/MCP) | Sandbox + policy controls | Early but active open-source project [SRC-19] |

## 4) Protocol strategy guidance

For production teams in 2026, the winning pattern is usually **compositional**, not exclusive:

- contracts: OSSA-like schema layer
- discovery: DUADP/registry equivalent
- tooling: MCP or equivalent
- agent-agent: A2A/ACP class protocol
- UI boundary: AG-UI class protocol

This avoids overloading one protocol to solve every concern.
