# Protocols and Standards (2025-2026)

Date prepared: March 29, 2026

## Protocol map at a glance

| Layer | Primary examples | Core purpose |
| --- | --- | --- |
| Agent ↔ tools/data | MCP | Connect models/agents to external tools and context |
| Agent ↔ agent | A2A, ACP, ANP | Inter-agent tasking, delegation, and cross-system collaboration |
| Agent ↔ user interface | AG-UI | Event-based frontend-backend interaction for agentic apps |
| Agent definition/contract | OSSA | Portable manifest describing identity/capabilities/governance metadata |
| Agent discovery | DUADP | Federated discovery of agents/skills/tools across domains |

## Direct analysis: DUADP and OSSA

### DUADP

DUADP presents itself as a decentralized discovery protocol with:

- well-known node manifests,
- DNS/WebFinger resolution,
- federation/gossip features,
- DID and signature-based trust mechanics,
- REST + MCP surfaces for discovery/search/publish/governance operations. [SRC-DUADP-HOME] [SRC-DUADP-DOCS] [SRC-NPM-DUADP]

This places DUADP in the discovery plane: helping agents locate capabilities published elsewhere.

### OSSA

OSSA presents itself as a contract/manifest standard:

- vendor-neutral YAML schema,
- CLI validation/scaffolding/export,
- "define once, export everywhere" model,
- explicit positioning as complementary to MCP and A2A (not replacing them). [SRC-OSSA-HOME] [SRC-OSSA-SPEC] [SRC-OSSA-ABOUT] [SRC-NPM-OSSA]

This places OSSA in the contract/governance plane: defining what an agent is and can do, before runtime interaction.

## Deep dives by protocol

### 1) Model Context Protocol (MCP)

MCP is an open protocol (origin announced by Anthropic in late 2024) for connecting AI applications to tools/data in a standardized way.

- Transport/message basis: JSON-RPC 2.0
- Model: host/client/server separation
- Feature model: resources, prompts, tools (+ client-side capabilities like sampling/roots/elicitations)
- Security guidance emphasizes user consent, explicit tool invocation approval, and data control; protocol does not enforce policy alone (implementation responsibility). [SRC-ANTHROPIC-MCP] [SRC-MCP-SPEC]

Practical significance:

- turned many bespoke connector patterns into one common integration substrate,
- became a dependency surface for IDE/assistant ecosystems and enterprise connectors.

### 2) Agent2Agent (A2A)

A2A is an interoperability protocol for agent-to-agent collaboration.

- Initial launch messaging (April 2025): open protocol with 50+ supporting organizations. [SRC-GOOGLE-A2A-LAUNCH]
- Later official updates: ecosystem claims exceed 150 organizations, with protocol governance maturing and tooling releases. [SRC-GOOGLE-A2A-UPGRADE] [SRC-A2A-PARTNERS]
- Current spec surfaces:
  - discovery through Agent Cards,
  - task lifecycle and streaming patterns,
  - protocol bindings including JSON-RPC, gRPC, and HTTP/REST. [SRC-A2A-SPEC] [SRC-A2A-DISCOVERY]

Design implication:

- A2A focuses on delegated collaborative work while preserving opaque internals of each agent.

### 3) AG-UI (Agent-User Interaction Protocol)

AG-UI addresses a different boundary: user-facing application ↔ agent backend.

- event-based pattern over web transports,
- aimed at streaming, state sync, interrupts/human-in-the-loop, and multimodal interactions,
- explicitly positioned as complementary to MCP and A2A. [SRC-AGUI-DOCS]

Repository momentum appears high in 2026 (public GitHub star signal), indicating strong frontend-integration demand. [SRC-AGUI-GITHUB]

### 4) LangChain Agent Protocol

LangChain's Agent Protocol tries to standardize framework-agnostic serving APIs for agents in production.

Core endpoint model centers on:

- runs (`/runs/wait`, `/runs/stream`),
- threads (state/history lifecycle),
- store (long-term memory interfaces). [SRC-LANGCHAIN-AGENT-PROTOCOL-README] [SRC-LANGCHAIN-AGENT-PROTOCOL-OPENAPI]

The significance is interoperability at serving/API boundary across heterogeneous agent implementations.

### 5) Agent Network Protocol (ANP)

ANP positions itself as "HTTP for the Agentic Web era" with a three-layer architecture:

1. identity and secure communication,
2. meta-protocol negotiation,
3. application protocol layer for capability description/discovery. [SRC-ANP-README]

Public guides and docs emphasize DID-oriented identity and open-network agent discovery. [SRC-ANP-GUIDE]

### 6) ACP (Agent Communication Protocol)

ACP is presented as an open agent communication protocol emphasizing REST-based communication and lightweight integration.

Notably, IBM's own explainer now includes an explicit status caveat that ACP has merged toward A2A under Linux Foundation umbrella and active ACP development is winding down. [SRC-IBM-ACP] [SRC-ACP-GITHUB]

Interpretation:

- ACP remains historically and conceptually important,
- but current trajectory suggests consolidation around A2A.

### 7) Monday Agent Tool Protocol (ATP)

Monday's ATP proposition: move from static tool-calling toward code-execution-centric orchestration for agents.

- Positioning emphasizes composition, context efficiency, and sandboxed execution controls.
- This is more implementation philosophy + protocol proposition than a broadly adopted interop standard today (relative to MCP/A2A). [SRC-MONDAY-ATP] [SRC-MONDAY-ATP-GITHUB]

## Comparative table

| Protocol/Spec | Main interaction boundary | Message/transport style | Discovery mechanism | Current adoption signal |
| --- | --- | --- | --- | --- |
| MCP | Agent ↔ tools/data | JSON-RPC based | Server capability exposure | Widely integrated across IDE/assistant ecosystems [SRC-ANTHROPIC-MCP] |
| A2A | Agent ↔ agent | JSON-RPC + gRPC + HTTP/REST bindings | Agent Card + registry/well-known patterns | Strong partner growth claims (50+ to 150+) [SRC-GOOGLE-A2A-LAUNCH] [SRC-GOOGLE-A2A-UPGRADE] |
| AG-UI | Agent ↔ UI | Event-based web transport | Integration docs/ecosystem connectors | Strong OSS momentum [SRC-AGUI-DOCS] [SRC-AGUI-GITHUB] |
| Agent Protocol | Agent serving API | HTTP OpenAPI style | N/A (API spec) | Useful interoperability pattern; moderate OSS footprint [SRC-LANGCHAIN-AGENT-PROTOCOL-README] |
| ANP | Agent network layer | Multi-layer protocol vision | DID/web semantic discovery concepts | Early but active open-source effort [SRC-ANP-README] |
| ACP | Agent ↔ agent/apps/humans | REST HTTP | Protocol-defined discovery options | Important, but consolidation risk toward A2A [SRC-IBM-ACP] |
| DUADP | Discovery plane | REST + MCP exposure | well-known + DNS/WebFinger + federation | Early-stage but concrete implementation artifacts [SRC-DUADP-HOME] |
| OSSA | Contract/manifest | YAML schema + tooling | Via DUADP and platform exports | Early-stage but operational tooling [SRC-OSSA-HOME] |

## Standards trajectory (2026 outlook)

1. **Layered specialization is increasing**  
   No protocol is winning "everything"; mature stacks will combine MCP + A2A + UI protocol + contract/discovery standards.

2. **Interop gravity toward fewer cores**  
   MCP (tool plane) and A2A (agent plane) have strongest cross-vendor standard gravity at this time.

3. **Identity/governance remains underdeveloped relative to connectivity**  
   DUADP/OSSA/ANP style efforts are trying to close this gap, but evidence of broad ecosystem convergence is still early.

4. **Version and governance discipline is becoming decisive**  
   Protocols with strong versioning, compatibility rules, and clear open governance are likelier to persist.
