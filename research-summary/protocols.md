# Protocols and standards (2025-2026)

## Protocol map at a glance

| Protocol/spec | Primary job | Typical interaction | Message/transport shape | Adoption signal (2026-03-10) |
|---|---|---|---|---|
| MCP | Agent-to-tool/context | Client <-> server | JSON-RPC patterns; stdio/HTTP variants in ecosystem | Broad framework/tooling support momentum [R15][R16] |
| A2A | Agent-to-agent delegation | Client agent <-> remote agent | Agent Card JSON + task lifecycle; HTTP/SSE/JSON-RPC foundations; newer gRPC support | Google + partner ecosystem growth; >150 org claim in upgrade post [R17][R18] |
| AG-UI | Agent-to-frontend runtime UX | Agent/server -> app client | Event stream (run/message/tool/state/activity events) | Growing integration ecosystem and SDK docs [R20][R21] |
| ANP | Agentic-web interoperability | Agent <-> agent network | 3-layer model (DID identity, meta-negotiation, application semantics) | Active OSS protocol project [R22] |
| LangChain Agent Protocol | Framework-agnostic serving API | App <-> agent service | HTTP API for runs/threads/store | Reference implementation + LangGraph platform tie-in [R23] |
| ACP | General agent communication | Agent/app/human | REST/OpenAPI + session/run/message primitives | Linux Foundation alignment and A2A migration note [R24][R25] |
| ATP (monday) | Code-first external system interaction | LLM-generated code -> sandbox runtime | JS/TS code execution in isolated VM + adapters (OpenAPI/MCP) | Early-stage but concrete implementation [R26] |
| DUADP + OSSA | Discovery + manifest contract layer | Cross-system discovery + schema contract | DNS/discovery semantics (DUADP) + versioned YAML/JSON schemas (OSSA) | Active package/distribution evidence, smaller ecosystem [R01][R04][R05] |

---

## 1) MCP (Model Context Protocol)

Anthropic introduced MCP as an open standard to replace fragmented custom model-data integrations with a common protocol layer. [R15]

Design intent:

- one integration model for heterogeneous tools/data systems,
- reusable client/server components,
- tighter relevance/grounding via structured external context. [R15][R16]

Operationally, MCP now functions as the default **tool/context plane** in many stacks, even when higher-level orchestration differs.

## 2) A2A (Agent2Agent / Agent-to-Agent)

Google positions A2A as cross-vendor agent interoperability:

- capability discovery through **Agent Cards**,
- task lifecycle semantics for delegation and long-running execution,
- transport built on familiar web standards and ecosystem bindings. [R17][R18][R19]

2025->2026 movement:

- initial launch framing (April 2025), [R17]
- v0.3 upgrade messaging with gRPC/security-card-signing details and larger partner ecosystem claims. [R18]

A2A is best viewed as the **agent collaboration plane**.

## 3) AG-UI (Agent User Interaction Protocol)

AG-UI addresses runtime UI interoperability through an event grammar:

- lifecycle boundaries (`RunStarted`, `RunFinished`/`RunError`),
- streaming text/tool events,
- state snapshot/delta synchronization,
- extensibility through custom/raw events. [R20][R21]

This protocol fills the **agent-to-experience plane**, which MCP/A2A do not fully standardize.

## 4) ANP (Agent Network Protocol)

ANP explicitly aims to be "HTTP of the Agentic Web", with:

1. identity + secure communications (W3C DID),
2. meta-protocol negotiation,
3. application semantic layer. [R22]

Strength: explicit decentralized identity posture.  
Risk: ecosystem critical mass still developing relative to MCP/A2A.

## 5) LangChain Agent Protocol

LangChain's protocol is less a network-wide federation standard and more a **serving API contract** for production agents:

- Runs (stateless and background),
- Threads (stateful history + concurrency control),
- Store (long-term memory API). [R23]

Useful where teams want deterministic API ergonomics around agent execution regardless of internal graph/agent framework details.

## 6) ACP (Agent Communication Protocol)

ACP focuses on broad inter-agent/application communication primitives (messages, sessions, runs, streaming). [R24]

Key 2026 signal: project messaging indicates ACP is being aligned/migrated under an A2A umbrella in Linux Foundation context, implying consolidation pressure among agent-agent standards. [R24][R25]

## 7) ATP (Agent Tool Protocol, monday.com)

ATP argues for code-first tool use:

- model writes executable JS/TS in sandbox,
- runtime offers approvals/cache/logging/LLM hooks,
- provenance controls and security policy options,
- adapters to OpenAPI and MCP surfaces. [R26]

This is not a direct drop-in replacement for MCP/A2A; it is a different trade-off favoring programmable execution flexibility over strict function-call schemas.

## 8) DUADP + OSSA in the protocol stack

### DUADP role

DUADP positions itself as discovery/federation substrate for agent endpoints and trust domains ("DNS for AI agents"). [R01][R02]

### OSSA role

OSSA positions itself as schema/manifest contract for agent definition and portability across frameworks and deployment targets. [R03][R04][R05]

### Combined interpretation

DUADP + OSSA are complementary in concept:

- DUADP: "where/how to find agents,"
- OSSA: "how to describe agent identity/capability/governance contracts."

They are most coherent when used with a runtime protocol (for example MCP/A2A) rather than as a complete runtime protocol replacement.
