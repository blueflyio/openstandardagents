# Protocols and Standards Landscape (2025-2026)

Date: 2026-03-25

## Core protocol stack in practice

The ecosystem is converging toward a layered protocol model:

- **Agent ↔ tools/data**: MCP [S05][S06]
- **Agent ↔ agent**: A2A, ACP lineage, ANP [S07][S08][S09][S11][S28]
- **Agent ↔ user interface**: AG-UI [S10]
- **Contract/manifest portability layer**: OSSA-style agent contract [S03][S04]
- **Discovery/federation overlay**: DUADP/related discovery registries [S01][S02]

## MCP (Model Context Protocol)

Anthropic introduced MCP as an open standard for secure two-way connections between AI systems and external data/tools, aiming to replace custom integrations with a single protocol approach. [S05]

Evidence of ecosystem depth includes:

- modelcontextprotocol organization with active spec/SDK/server repos [S06]
- significant OSS activity around server implementations and inspection tooling [S06]

MCP is best interpreted as **tool/context transport and capability access standard**, not a full agent governance framework.

## A2A (Agent2Agent)

Google launched A2A in April 2025 as an open protocol for inter-agent collaboration and task exchange, based on existing web standards (HTTP, SSE, JSON-RPC) and capability discovery via Agent Cards. [S07]

Design priorities from primary sources include:

- framework/vendor interoperability
- secure-by-default enterprise auth/authz posture
- support for long-running tasks and streaming updates
- modality agnosticism (text/audio/video) [S07]

By 2026, A2A moved into Linux Foundation stewardship context with broad partner participation and public documentation/samples/SDKs. [S08][S09]

## AG-UI

AG-UI presents itself as an open event-based protocol for **agent-backend to user-facing frontend** interactions, designed for streaming state, UI intents, and human-in-the-loop interactions over standard transports (HTTP/WebSocket/SSE patterns). [S10]

It positions itself as complementary to MCP (tools) and A2A (agent coordination), filling the UX interaction layer. [S10]

## ANP (Agent Network Protocol)

ANP positions itself as “HTTP of the Agentic Web era,” with a three-layer architecture:

1. Identity layer (W3C DID aligned)
2. Meta-protocol negotiation layer
3. Application capability layer [S11]

ANP’s core thesis is decentralized, open network collaboration among many agents, with identity and capability semantics as first-class architectural primitives.

## ACP (Agent Communication Protocol) and convergence dynamics

IBM’s ACP explainers describe ACP as REST-based agent communication standardization for multi-agent interoperability and note ACP’s convergence/merger direction into A2A under Linux Foundation umbrella. [S28]

Implication: in 2026, teams should treat ACP mainly as an important conceptual/technical lineage and watch migration paths rather than betting on long-term protocol fragmentation.

## Monday Agent Tool Protocol (ATP)

monday.com’s ATP ecosystem positions a different design tradeoff: code-execution-oriented agent-tool interaction model (TypeScript execution/sandboxing focus), with npm-distributed client SDK. [S30][S42]

This is best seen as a specialized protocol approach for execution ergonomics and runtime control, not a direct replacement for ecosystem-wide interop protocols like MCP/A2A.

## DUADP and OSSA in protocol context

### DUADP

DUADP positions itself as federated discovery + DID identity + governance overlay for agents/skills/tools, with MCP tooling integration claims and federation endpoints. [S01][S02]

### OSSA

OSSA positions itself as an agent contract/manifest layer between communication protocols (MCP/A2A) and deployment targets, with export adapters and governance metadata. [S03][S04]

## Comparative table

| Standard | Primary scope | Key artifact | Transport/pattern | Governance emphasis |
| --- | --- | --- | --- | --- |
| MCP | Agent-tool connectivity | MCP server/tool schema | JSON-RPC style ecosystem [S05] | Limited native governance |
| A2A | Agent-agent interoperability | Agent Card + task lifecycle | HTTP/SSE/JSON-RPC [S07] | Enterprise authz intent |
| AG-UI | Agent-frontend interaction | Event stream + UI state events | HTTP/WebSocket/SSE [S10] | UX control/HITL focus |
| ANP | Decentralized agent network | Layered protocol model | Multi-layer design [S11] | DID-first identity/trust |
| ACP (legacy/transition) | Agent-agent messaging | RESTful agent endpoints | HTTP REST [S28] | Open governance lineage |
| DUADP | Discovery/federation overlay | Well-known + registry/federation APIs | HTTP + federation mesh [S01] | DID + trust tiering claims |
| OSSA | Contract/deployment layer | Portable YAML manifest | Export/transformation tooling [S03][S04] | Compliance metadata focus |

## Adoption signals and maturity notes

- MCP and A2A appear to have the strongest large-ecosystem momentum in primary sources. [S06][S08][S09]
- AG-UI has strong OSS traction but sits in a younger integration layer focused on frontend interactivity. [S10]
- ANP and DUADP represent more ambitious decentralized network/discovery visions; practical deployment maturity varies and should be validated via implementation audits.
- ACP is now best viewed through migration and compatibility strategy due to convergence messaging. [S28]

## Protocol selection guidance (practical)

For most teams in 2026:

1. Start with **MCP** for tool integration baseline. [S05]
2. Add **A2A** where multi-agent external interoperability is required. [S07][S08]
3. Add **AG-UI** for rich frontend agent UX needs. [S10]
4. Use a contract/deployment abstraction (for example OSSA-like approaches) if portability/compliance pressure is high. [S03][S04]
5. Add discovery overlays (DUADP/others) if cross-org federation and decentralized registry functions are real requirements. [S01][S02]
