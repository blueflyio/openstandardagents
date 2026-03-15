# Protocols and Standards Landscape (2025-2026)

Date prepared: 2026-03-15

## Context: protocol stack is becoming layered

No single protocol currently covers all agent concerns. Teams are composing multiple standards:
- **MCP** for tool/data access,
- **A2A/ACP/ANP** for inter-agent communication,
- **AG-UI** for agent-front-end event flows,
- **DUADP** for decentralized discovery/federation,
- **contract standards** like OSSA for portable agent definitions.[R07][R10][R12][R13][R15][R05][R02]

## 1) DUADP (Decentralized Universal AI Discovery Protocol)

Primary role: decentralized discovery, publication, federation, and trust signaling for agents/tools/skills.

What it introduces:
- `/.well-known/duadp.json` discovery manifest
- registry endpoints for agents/skills/tools
- peer federation and gossip-like cross-node discovery
- DID/signature-oriented trust hooks
- SDK support for client/server/validation/crypto/conformance.[R05]

This positions DUADP as a “discovery plane” complementing MCP and A2A communication planes.[R01][R03][R05]

## 2) OSSA / Open Standard Agents (contract standard, not transport protocol)

OSSA is best understood as a **portable agent contract and export layer**:
- schema-based manifest,
- CLI validation/migration,
- conversion/export to multiple runtime targets.[R02][R04][R57]

It often appears alongside protocol discussions because it binds protocol config to deployable artifacts.

## 3) MCP (Model Context Protocol)

Anthropic introduced MCP as an open standard for secure two-way connection between AI systems and external data/tools, reducing one-off integrations.[R07]

Core architecture:
- client-server pattern,
- JSON-RPC-based interaction in ecosystem implementations,
- server-owned resource boundaries,
- growing SDK and ecosystem support.[R07][R08]

Adoption indicators include major early integrators and broad framework/vendor references by 2026.[R07][R20]

## 4) A2A (Agent2Agent protocol)

A2A is designed for **agent-to-agent interoperability**:
- capability discovery via Agent Cards,
- task lifecycle states,
- synchronous + streaming + async patterns over established web transports,
- enterprise auth posture expectations.[R09][R10]

Google’s launch cadence and partner ecosystem growth (50+ at launch, 150+ later support references) is a major adoption signal.[R09][R11]

## 5) AG-UI (Agent-User Interaction protocol)

AG-UI standardizes agent-to-front-end communication as typed events, commonly over HTTP + SSE, with transport flexibility (including WebSockets through adapters/implementations).[R12]

Design goal: remove custom UI wiring by standardizing event semantics (text, tool-call states, state deltas, interrupts).

## 6) ANP (Agent Network Protocol)

ANP proposes a broader internet-scale architecture for agent networking, with a layered model:
1) DID-based secure identity/communication,  
2) meta-protocol negotiation,  
3) application capability semantics.[R13]

This is more ambitious than narrow RPC-level standards and targets long-horizon “agentic web” infrastructure outcomes.

## 7) LangChain Agent Protocol

Agent Protocol (LangChain-led) codifies framework-agnostic service APIs for:
- **Runs**
- **Threads**
- **Store**[R14][R28]

Its strength is operational clarity for hosted/servable agents and compatibility across frameworks.

## 8) ACP (Agent Communication Protocol)

ACP (IBM + open-source community origins) focuses on lightweight, HTTP-native inter-agent communication with SDK-optional usage patterns.[R15][R16]

Ecosystem note: ACP-related work has been converging with broader A2A standardization dynamics.[R15]

## 9) Monday.com Agent Tool Protocol (ATP)

ATP emphasizes secure/sandboxed code-execution-style tool interaction for agents and positions itself as an alternative/complement to schema-heavy tool invocation models.[R17][R18]

It is currently less widely adopted than MCP/A2A but relevant for teams prioritizing programmable execution semantics.

## Comparative table (concise)

| Standard | Primary scope | Typical wire model | Discovery mechanism | Identity/security model | Adoption signal (2026) |
|---|---|---|---|---|---|
| DUADP | Decentralized agent/skill/tool discovery and federation | HTTP REST-style endpoints | `/.well-known/duadp.json`, federation peers | DID + signatures + trust tiers (implementation-specific) | Emerging, tied to OSSA ecosystem [R05] |
| OSSA | Agent contract/spec + packaging | YAML/JSON schema + CLI/export | Registry/platform dependent | Manifest-level policy/signing fields | Active npm + GitLab project [R04][R56] |
| MCP | Agent/model to tool/data connectivity | Client-server, JSON-RPC ecosystem patterns | Server registration/configuration | Server-side boundaries + auth controls | Very strong ecosystem momentum [R07][R08] |
| A2A | Agent-to-agent collaboration | JSON-RPC over HTTP/SSE + async flows | Agent Cards (`.well-known`) | Enterprise auth expectations | Large multi-vendor partner list [R09][R11] |
| AG-UI | Agent-to-frontend interaction | Event stream (often SSE; adaptable) | App-level endpoint wiring | App/session security controls | Growing frontend integration use [R12] |
| ANP | Internet-scale agent networking | Multi-layer protocol stack | DID/web-based discovery patterns | DID-centric secure comms | Early-stage but active OSS effort [R13] |
| Agent Protocol | Framework-agnostic hosted agent APIs | HTTP/OpenAPI-style endpoints | Service endpoint discovery | Platform-defined auth | Moderate but clear operational spec [R14][R28] |
| ACP | Lightweight inter-agent communication | HTTP-native REST patterns | Endpoint-driven | App-defined + protocol guidance | Niche/transitioning ecosystem [R15][R16] |
| ATP | Agent tool execution protocol | Code execution + API/tool bridge | Tool endpoint catalogs | Sandbox-oriented posture | Early-stage adoption [R17] |

## Practical protocol selection guidance

- If the bottleneck is **tool integration**, start with MCP.[R07]  
- If the bottleneck is **multi-agent orchestration across products/orgs**, add A2A (and optionally ACP/ANP patterns for specific needs).[R09][R15][R13]  
- If the bottleneck is **frontend observability/control**, add AG-UI.[R12]  
- If the bottleneck is **cross-org discovery and trustable publishing**, evaluate DUADP.[R05]  
- If portability/governance of definitions is weak, use a contract layer (e.g., OSSA) to avoid lock-in.[R02][R04]
