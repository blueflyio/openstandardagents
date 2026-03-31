# Protocols and Standards (2025-2026)

Date context: March 31, 2026.

This document covers the key protocol families requested: MCP, A2A, AG-UI, ANP, LangChain Agent Protocol, ACP variants, Monday ATP, plus where DUADP and OSSA fit.

## 1) Protocol map (what each solves)

| Protocol | Primary scope | Main artifact | Typical transport | Current maturity signal |
| --- | --- | --- | --- | --- |
| MCP | Agent <-> tools/data/context | Server capabilities (tools/resources/prompts) | JSON-RPC 2.0 over stdio or Streamable HTTP/SSE | Broad ecosystem adoption; high SDK usage [S06][S07] |
| A2A | Agent <-> agent | Agent Card + task lifecycle objects | JSON-RPC/HTTP/SSE, plus gRPC/REST bindings in spec | Linux Foundation project, v1.0.0 spec [S09][S10] |
| AG-UI | Agent <-> user-facing app | Event stream schema | Event-based over HTTP/WebSocket patterns | Growing OSS/community support [S11][S12] |
| ANP | Decentralized agent network stack | Multi-doc layered specs (DID, discovery, messaging) | DID-based messaging / layered protocols | Active open specification set [S13][S14] |
| LangChain Agent Protocol | Standardized API for serving agents | OpenAPI (Runs/Threads/Store) | HTTP API | v0.1.6 documented API [S15][S16] |
| ACP (Agent Control Protocol) | Agent <-> existing app UI control | UI manifest + command/result loop | JSON message contracts | Production implementations listed by project [S17] |
| ACP (Agntcy Agent Connect Protocol) | Agent connectivity REST spec | OpenAPI-style spec repo | HTTP REST | Active open spec repo [S18] |
| ATP (Monday Agent Tool Protocol) | Code-execution-oriented agent tooling | ATP server/runtime API | HTTP + sandbox runtime | Public package + active release cadence [S19][S20] |

## 2) MCP (Model Context Protocol)

### 2.1 Purpose and architecture

MCP defines a standard way for LLM applications to connect to external capabilities, with three core roles: host, client, server. It standardizes server features (tools, resources, prompts) and capability negotiation via JSON-RPC 2.0 rather than bespoke adapters per data source [S06].

### 2.2 Security posture in the spec

MCP explicitly emphasizes consent, data privacy, and tool safety, while noting that protocol-level mechanisms cannot enforce all trust assumptions. Implementation guidance stresses robust authorization/consent and explicit approval for risky actions [S06].

### 2.3 Adoption signal

The npm TypeScript SDK reports very high weekly downloads and dependent counts, indicating significant ecosystem pull, though download metrics are not equivalent to unique production deployments [S07].

## 3) A2A (Agent2Agent)

### 3.1 Design goals

A2A is designed for interop between independent agents (including opaque internals), with discovery, modality negotiation, secure collaboration, and long-running task support [S08][S09].

### 3.2 Core objects and model

Key objects include Agent Card, Task, Message, Part, Artifact, Extension. The specification is layered (canonical data model -> operations -> protocol bindings), which is useful for cross-language and cross-transport consistency [S09].

### 3.3 Transport/binding details

A2A highlights HTTP, JSON-RPC 2.0, and SSE in guiding principles, and documents multiple binding modes (JSON-RPC, gRPC, HTTP/REST) in the technical spec [S09].

### 3.4 Adoption trajectory

Google launch materials cited 50+ partners at announcement and later cloud updates referenced support from 150+ organizations in the broader ecosystem [S08][S10]. Treat partner counts as directional ecosystem signals rather than equivalent implementation depth.

## 4) AG-UI (Agent-User Interaction)

AG-UI addresses a distinct layer: reliable, event-based interaction between agent backends and front-end applications. It positions itself alongside MCP and A2A rather than as a replacement [S11].

Operationally, this means standardized run lifecycle, streaming UX signals, state sync patterns, and interactive user interventions (e.g., approvals) in one event model [S11][S12].

## 5) ANP (Agent Network Protocol)

ANP presents a multi-layer architecture with identity, secure messaging, discovery, description, and meta-protocol components, with implementation guidance ordered from identity foundations upward [S13].

Its framing as a protocol stack for agent networks is conceptually close to “internet for agents” narratives. Practical adoption appears smaller than MCP/A2A by public indicators, but the design is comparatively ambitious in decentralized identity emphasis [S13][S14].

## 6) LangChain Agent Protocol

LangChain’s Agent Protocol is a framework-agnostic API effort centered on runs, threads, and store (long-term memory) operations [S16]. The published API docs expose a versioned OpenAPI surface (v0.1.6 on the retrieved page) and downloadable schema documents [S15].

This standard is primarily API-level interoperability for “serving an agent,” not a decentralized identity/governance protocol.

## 7) ACP family and ATP: clarify naming collision

“ACP” is overloaded in current discourse:

1. **Agent Control Protocol** (acp-protocol.org): focuses on controlling existing application UIs with manifests and command/result loops [S17].
2. **Agent Connect Protocol** (agntcy/acp-spec): separate open spec effort around agent connectivity interfaces [S18].

Separately, **ATP (Agent Tool Protocol)** from Monday emphasizes sandboxed code execution over rigid tool catalogs, arguing this improves flexibility and scalability in complex enterprise tool landscapes [S19]. The corresponding npm server package shows active releases and non-trivial weekly usage [S20].

## 8) DUADP and OSSA positioning against protocol layers

Based on requested sites and package pages:

- **DUADP** is positioned as decentralized discovery/federation (“DNS-like” for agents/resources), with DID/GAID identity and federated search semantics [S01][S03].
- **OSSA** is positioned as a portable contract/manifest layer that references protocols (e.g., MCP/A2A) and exports to deployment targets [S02][S04].

In layered terms:
- MCP/A2A/AG-UI/ACP/ATP = communication and interaction protocols.
- DUADP = discovery/federation layer.
- OSSA = contract/packaging/export layer.

## 9) Practical interoperability pattern in 2026

A plausible near-term production stack for many teams:
1. Use MCP for tool/data access.
2. Use A2A where cross-agent delegation is needed.
3. Use AG-UI for user interaction events.
4. Add discovery (DUADP-like) if multi-domain federation is required.
5. Use a contract/manifest layer (OSSA-like) to keep deployment portable.

This approach minimizes bespoke glue code while preserving architectural separation of concerns.

## 10) Risks and unresolved standardization issues

- Discovery and identity are still fragmented across protocols.
- Security controls often depend on implementation policy, not protocol guarantees.
- Competing “agent card/profile/manifest” objects can create schema drift.
- Partner/support announcements overstate practical interop unless conformance testing is shared publicly.

## 11) Source reliability notes

- Official specs and first-party announcements: higher confidence [S05][S06][S08][S09][S10][S11][S13][S15][S17][S18][S19].
- Package/repo metrics and ecosystem claims: medium confidence; susceptible to marketing and measurement bias [S03][S04][S07][S12][S14][S20].
