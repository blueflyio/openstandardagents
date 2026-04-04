# Protocols and Standards Landscape (2025–2026)

## Quick framing

No single protocol currently covers all of:
- tool access,
- inter-agent collaboration,
- UI streaming semantics,
- identity/discovery,
- portable governance contracts.

The ecosystem is converging on a **composable stack** instead. [T19][T23][T24][T28][T33]

## Protocol comparison (concise)

| Protocol / Spec | Primary purpose | Typical transport / format | Core artifact | Adoption signal |
| --- | --- | --- | --- | --- |
| MCP | Agent-to-tool/data connectivity | Client-server, JSON over MCP transport | MCP server/tool definitions | Broad client/server ecosystem; major vendor support stated in docs |
| A2A | Agent-to-agent task collaboration | HTTP + JSON-RPC + SSE | Agent Card + Task lifecycle | Google launch + Linux Foundation project, 100+ supporters reported |
| AG-UI | Agent-to-frontend interaction | Event stream over HTTP/SSE (and WebSocket patterns) | Typed event stream | Fast growth across framework integrations |
| LangChain Agent Protocol | Framework-agnostic serving API for agents | HTTP REST/OpenAPI | Runs, Threads, Store endpoints | Open-source protocol docs and implementations |
| ACP | Lightweight agent interoperability | REST/HTTP (+ streaming support) | Agent APIs + message schema | Community protocol; now converging with A2A |
| ATP (monday) | Code-first agent execution/runtime | HTTP + sandboxed code exec runtime | Executable TS/JS + runtime APIs | Emerging; GitHub + npm package adoption |
| ANP | Agent-network vision with DID and negotiation layers | Multi-layer design (identity/meta/app layers) | DID-backed agent/network descriptors | Active OSS community; still earlier-stage |
| DUADP | Decentralized agent discovery/federation | DNS TXT + WebFinger + REST + gossip | Node manifest + GAID/DID + registry entries | Public node + npm SDK + federation APIs |
| OSSA | Portable agent contract/specification | YAML/JSON schema + CLI validation | Agent manifest contract | Versioned spec + npm CLI + export model |

Sources: [T02][T04][T19][T20][T23][T24][T25][T28][T29][T30][T31][T33][T34]

## Protocol-specific notes

### MCP (Anthropic-origin open standard)
- Design goal: replace per-tool custom integrations with one standard client/server contract. [T19]
- Strong practical value: now widely treated as the default tool-connection layer. [T20]
- Gap: does not define inter-agent collaboration semantics or complete governance model by itself. [T20][T24]

### A2A (Google-origin, Linux Foundation governance)
- Design goal: inter-agent collaboration without exposing internal memory/tools. [T21][T23]
- Key mechanics: Agent Cards, task lifecycle, async + streaming support, enterprise auth alignment. [T23][T24][T25]
- Trend: governance moved into Linux Foundation, signaling protocol-neutral stewardship direction. [T26][T27]

### AG-UI
- Design goal: normalize agent/frontend event semantics for real-time UX. [T28]
- Key mechanics: run lifecycle events, streaming text/tool/state events, extensible event types. [T29]
- Trend: positioned as complementary to MCP and A2A, not a replacement. [T28]

### LangChain Agent Protocol
- Design goal: framework-agnostic APIs for serving and operating agents in production.
- Core primitives: **Runs**, **Threads**, **Store**.
- Useful for ops and introspection portability across frameworks. [T31][T32]

### ACP
- Design goal: lightweight, SDK-optional REST interop for agents.
- Distinctive angle: simple HTTP-native patterns; supports async and multimodal payloads.
- Current directional trend: alignment/merging path into A2A ecosystem. [T33][T22]

### ATP (monday Agent Tool Protocol)
- Design goal: move from strict tool-calling toward sandboxed code execution with richer composition.
- Emphasis: parallelism, inline data transformation, OpenAPI+MCP ingestion, provenance-oriented controls. [T34]
- Caveat: maturity and neutrality are still emerging relative to MCP/A2A.

### ANP
- Vision statement: "HTTP of the Agentic Web".
- Architecture: identity/encryption layer (DID), negotiation/meta layer, application protocol layer. [T30]
- Status: ambitious and conceptually rich, but ecosystem scale is earlier than MCP/A2A.

### DUADP + OSSA (the two specifically requested projects)
- **DUADP** focuses on federated discovery/indexing and trust metadata across nodes. [T01][T02]
- **OSSA** focuses on portable contract definition and validation/export. [T03][T04][T05]
- Combined interpretation: OSSA defines *what an agent is*; DUADP helps nodes discover *where it is and whether to trust it*. [T02][T04]

## Adoption trends (short)

1. **Interoperability consolidation** around MCP + A2A + UI/event standards, not one protocol winner.
2. **Governance shift** from vendor posts to foundation/community governance for agent-agent standards.
3. **Identity and trust pressure** pushing discovery, policy, and attestation layers into protocol discussions. [T16][T26][T43]
