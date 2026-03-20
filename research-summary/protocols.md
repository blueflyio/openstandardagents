# Protocols and Standards Landscape (2025-2026)

Prepared: March 20, 2026

## 1) Fast comparison table

| Standard / Protocol | Primary purpose | Scope layer | Message or contract format | Adoption signal (Mar 2026) |
|---|---|---|---|---|
| MCP | Connect models/agents to tools and data | Tool/data connectivity | JSON-RPC 2.0 pattern in spec/docs | Very high SDK usage, broad ecosystem integration [R7][R8][R47] |
| A2A | Agent-to-agent task collaboration | Inter-agent communication | JSON-RPC over HTTP(S), streaming patterns, Agent Cards | "150+ organizations" support cited in Google Cloud update [R10][R11] |
| AG-UI | Agent-to-frontend interaction | UI/runtime interaction | Event-based streaming over web transports | Growing open-source integration footprint [R12][R13] |
| ANP | Internet-native agent network protocol stack | Identity + negotiation + application layers | Layered protocol model (DID + meta-protocol + app protocols) | Active spec/repo stage [R14][R15] |
| LangChain Agent Protocol | Framework-agnostic serving API for agents | Runtime API contract | OpenAPI (Runs/Threads/Store) | Implemented by LangGraph ecosystem variants [R16][R17] |
| ACP (Agent Client Protocol) | IDE/editor-to-agent interoperability | Client-agent control plane | JSON-RPC 2.0 | Early but clear standardization direction [R18] |
| ACP (IBM Agent Communication Protocol) | Cross-agent communication in IBM ecosystem | Inter-agent messaging | HTTP/SSE + structured message parts | Integrated into IBM/BeeAI pathway [R19] |
| ATP (Monday Agent Tool Protocol) | Code-first tool invocation in sandbox | Agent-tool execution runtime | Executable TS/JS in sandbox with runtime SDK | Early-stage open repo [R20] |
| DUADP | Decentralized discovery and federation | Discovery/registry layer | GAID, DID, WebFinger + node/discovery APIs | Public site + npm package + docs narrative [R1][R5] |
| OSSA | Vendor-neutral manifest/contract layer (not wire protocol) | Contract/packaging/governance | YAML/JSON manifest + schema validation | Spec + npm package + active implementation repo [R2][R3][R4] |

## 2) MCP (Anthropic + open ecosystem)

MCP is positioned as a universal open standard for secure two-way integration between AI systems and data/tool systems, reducing bespoke per-tool integrations. [R7][R8]  
Anthropic's own announcement highlights early adopters (Block, Apollo) and dev-tool collaborators (including Replit and others). [R7]

## 3) A2A (Google-origin, now broader project governance)

A2A defines interoperability for opaque agentic applications via discoverability (Agent Cards), structured task handling, and streaming-capable interactions. [R9][R11]  
Google Cloud's 2026 update reports support from a growing ecosystem of 150+ organizations. [R10]

## 4) AG-UI

AG-UI addresses the frequently under-specified frontier between agent backends and user-facing applications.  
Core framing: open, lightweight, event-based protocol for real-time interaction between agent runtimes and frontends. [R12][R13]

## 5) ANP

ANP's core claim is a three-layer architecture:

1. Identity and secure communication (DID-oriented)
2. Meta-protocol negotiation
3. Application protocol layer for capabilities and interactions [R14][R15]

The project frames itself as aiming to be "HTTP for the Agentic Web." [R15]

## 6) LangChain Agent Protocol

LangChain's Agent Protocol focuses on production-serving API primitives:

- **Runs** (execution)
- **Threads** (multi-turn state)
- **Store** (long-term memory) [R16][R17]

Its value is explicit API portability across implementations, with OpenAPI as the contract backbone.

## 7) ACP and ATP (emerging variants)

### ACP (Agent Client Protocol)

Focused on IDE/editor integration with coding agents, JSON-RPC-based, and explicitly MCP-friendly in design goals. [R18]

### ACP (IBM Agent Communication Protocol)

Focused on HTTP-native inter-agent exchange with async/streaming patterns and multimodal message structures. [R19]

### Monday Agent Tool Protocol (ATP)

Positions itself as code-first: instead of purely static function calling, agents generate TS/JS executed in a sandboxed runtime with explicit APIs (`atp.*`). [R20]

## 8) DUADP and OSSA deep dive

### DUADP (`duadp.org`, `@bluefly/duadp`)

DUADP is presented as the discovery layer between tool protocols and inter-agent protocols:

- discovery/federation orientation
- identity objects (GAID/DID)
- WebFinger-style resolution in ecosystem docs
- npm package distribution (`@bluefly/duadp`) [R1][R5]

As of March 20, 2026:

- npm package version: `0.1.4`
- npm last-week downloads: `125` (2026-03-10 to 2026-03-16) [R5][R47]

### OSSA (`openstandardagents.org`, `@bluefly/openstandardagents`)

OSSA is explicitly not positioned as a transport protocol; it is a contract/manifest layer for portability, governance, and packaging:

- define once in YAML/JSON
- validate against schema
- export into platform-specific artifacts [R2][R3][R4]

As of March 20, 2026:

- npm package version: `0.5.0` (registry) [R4]
- npm last-week downloads: `279` (2026-03-10 to 2026-03-16) [R47]

## 9) Practical interoperability pattern

For enterprise deployments, a common architecture is emerging:

- MCP for data/tools
- A2A for agent collaboration
- AG-UI for user interaction
- OSSA-like contract layer for portability/governance
- DUADP-like discovery for decentralized registry/federation

This reduces bespoke glue code and gives clearer security/policy insertion points. [R1][R3][R8][R10][R12]
