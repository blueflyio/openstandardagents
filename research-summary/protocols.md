# Protocols and Standards (2025-2026)

Date of synthesis: April 6, 2026.

## Protocol landscape at a glance

| Protocol / Spec | Primary role | Transport / format emphasis | Current status signal |
| --- | --- | --- | --- |
| MCP | Agent-to-tool/data context | MCP server/client model; broad SDK/tooling ecosystem | Widely adopted open standard, Linux Foundation stewardship path noted.[T08][T09][T10] |
| A2A | Agent-to-agent task coordination | HTTP/JSON-RPC/SSE; Agent Cards; task lifecycle | Rapid growth; now under Linux Foundation ecosystem with formal spec versions.[T11][T13][T14] |
| AG-UI | Agent-to-UI interaction | Event model over SSE/WebSocket/etc. | Fast open-source adoption in frontend-agent integration circles.[T15][T16] |
| ANP | “Agentic web” protocol stack concept | DID-based identity + meta protocol + app layer | Active open-source concept/protocol effort.[T17][T18] |
| LangChain Agent Protocol | Framework-agnostic agent serving API | OpenAPI with runs/threads/store primitives | Implemented by LangGraph ecosystem and open to community implementations.[T19][T20] |
| ACP (IBM/BeeAI) | Agent-to-agent communication | REST-first, SDK-optional pattern | Migration/merge trajectory toward A2A acknowledged.[T22][T23][T47] |
| ATP (monday.com) | Code-first agent tool protocol | Sandboxed code execution + runtime APIs | Emerging production-oriented alternative to schema-heavy function calls.[T45][T46] |
| OSSA | Agent contract/manifest + export layer | YAML/JSON schema + CLI/exports | Positioned as contract layer, not transport protocol.[T04][T05][T06] |
| DUADP | Discovery/federation layer | `.well-known`, search/publish/federation APIs, SDKs | Early-stage but explicit discovery/federation focus.[T01][T02][T03] |

## 1) MCP (Model Context Protocol)

### What it is

MCP is an open standard for connecting AI applications to external systems (tools, data, workflows) through a common client/server model.[T08][T10]

### Why it matters

- Reduces custom connector sprawl.
- Has strong ecosystem momentum across assistants, IDEs, and tooling ecosystems.[T09][T10]
- Its governance trajectory (AAIF / Linux Foundation context) matters for neutrality and long-term durability.[T09]

## 2) A2A (Agent2Agent)

### What it is

A2A standardizes inter-agent collaboration: discovery of capabilities, task lifecycle management, and multi-modal coordination without requiring exposure of internal agent implementations.[T11][T13][T14]

### Key architecture points

- Agent Cards for discoverability and capabilities.
- Support for synchronous and long-running async interactions.
- Spec now documents layered model: data model, abstract operations, and protocol bindings.[T14]

### Ecosystem signal

A2A moved from launch-partner stage to broad multi-org participation and formalized versions, indicating strong standardization momentum.[T11][T12][T13][T14]

## 3) AG-UI (Agent-User Interaction)

AG-UI targets a different seam: agent-to-frontend communication. Its event model and transport flexibility (SSE/WebSocket/etc.) fill practical UX gaps not directly solved by MCP/A2A.[T15][T16]

This protocol is best viewed as complementary:

- MCP: tools/context
- A2A: agent coordination
- AG-UI: user-facing interaction channels

## 4) ANP (Agent Network Protocol)

ANP’s contribution is conceptual and architectural: framing an “agentic internet” with:

1. identity/secure communication,
2. meta-protocol negotiation,
3. application capability semantics.[T17][T18]

Its “HTTP of the agentic web” positioning is aspirational, but useful for thinking about long-range interoperability infrastructure.

## 5) LangChain Agent Protocol

This protocol codifies production-serving APIs around:

- **Runs** (invocations),
- **Threads** (stateful multi-turn),
- **Store** (long-term memory).[T19][T44]

It is practical for framework-agnostic serving contracts, particularly for teams deploying LangGraph-based systems while retaining portability goals.

## 6) ACP and the convergence dynamic

ACP (IBM/BeeAI) emphasizes REST simplicity and SDK-optional operation. A key 2026 development is acknowledged convergence/merge path into the A2A ecosystem, suggesting consolidation pressure in the agent-to-agent layer.[T22][T23][T47]

## 7) ATP (monday.com Agent Tool Protocol)

ATP proposes a code-first alternative to strict function-schema calling, with secure sandbox execution and runtime primitives for approvals/LLM/caching/logging.[T45][T46]

Potential advantages:

- parallel operations,
- richer data transformations,
- lower schema verbosity.

Trade-off:

- higher governance burden around execution control and sandbox policy.

## 8) Where OSSA and DUADP fit (relative to “core” protocols)

- **OSSA**: contract/specification and export layer for agent definition lifecycle.[T04][T05][T06]
- **DUADP**: discovery/federation layer intended to make agent resources discoverable across nodes.[T01][T02][T03]

This pair does not replace MCP/A2A/AG-UI; it attempts to fill adjacent governance/discovery gaps.

## Protocol selection guidance (pragmatic)

| If your primary need is… | Start with | Then layer |
| --- | --- | --- |
| Connecting one agent to many enterprise tools | MCP | AG-UI for UX, A2A for cross-agent orchestration |
| Multi-agent orchestration across services/vendors | A2A | MCP for tool access, AG-UI for user-facing workflows |
| Frontend-rich real-time co-pilot UX | AG-UI | MCP/A2A depending on backend architecture |
| Standardized serving API and state management | Agent Protocol | MCP/A2A integration per deployment model |
| Agent identity/contract portability and governance metadata | OSSA | DUADP for discovery, plus MCP/A2A at runtime |
| Decentralized discovery/federation experiments | DUADP | Pair with OSSA manifests and trust policy controls |

## Key protocol trends to watch in 2026

1. **Consolidation in agent-to-agent standards** (A2A gravity).
2. **Protocol composability** (MCP + A2A + AG-UI together in production stacks).
3. **Identity/authz becoming first-class** due to incident pressure and governance expectations.
4. **Shift from “single protocol winner” narrative** to layered standards architecture.
