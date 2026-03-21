# Protocols and Open Standards

## Protocol map (what each layer solves)

- **MCP**: agent-to-tool/data integration [T25][T26]
- **A2A**: agent-to-agent task collaboration [T27][T28]
- **AG-UI / A2UI ecosystem**: agent-to-frontend interaction and streaming UX [T33][T34][T30]
- **Agent Protocol (LangChain)**: framework-agnostic API shape for runs/threads/store [T38]
- **ANP**: decentralized agent network architecture with DID and negotiation layers [T35][T36]
- **ACP**: REST-first agent interoperability protocol (now converging into A2A governance path) [T40][T41]
- **ATP (monday.com)**: code-execution-centric approach to agent/tool operations [T42][T43]
- **DUADP + OSSA**: discovery plus contract layers (not direct replacements for MCP/A2A) [T05][T07]

## Comparative snapshot

| Protocol / Standard | Core purpose | Primary interface format | Discovery model | Security/identity posture | Ecosystem/adoption signal |
| --- | --- | --- | --- | --- | --- |
| MCP | Connect models/agents to tools and data | JSON-RPC + defined MCP transport patterns | MCP server catalogs | Tool boundary + auth patterns; depends on deployment hardening | Broad multi-vendor support; LF/AAIF standardization push [T25][T26][T68] |
| A2A | Agent-to-agent collaboration and delegation | JSON-RPC/HTTP/SSE, now multi-binding spec | Agent Card + well-known endpoint | Enterprise auth + secure exchange model in spec | 100+ to 150+ org support claims across 2025 sources [T27][T30][T29] |
| AG-UI | Agent ↔ user app event protocol | Event stream over SSE/WebSockets/HTTP | Integration-layer, app-defined | Transport-agnostic, implementation-dependent | Strong framework integration narrative (LangGraph/CrewAI/etc.) [T33] |
| ANP | Open internet-scale agent networking | HTTP + JSON-LD + DID-centered layers | `.well-known` + semantic descriptions | DID-based auth + encrypted comm + negotiation layer | Early-stage protocol + implementation project [T35][T36] |
| Agent Protocol | Standard API contract for agent serving | OpenAPI REST endpoints | Service endpoint discovery by deployment | Operational controls are implementation-specific | Implemented/supersetted by LangGraph platform [T38][T39] |
| ACP | Agent interoperability over REST | REST/HTTP, async-first | Online/offline discovery metadata | Framework-neutral; now folded toward A2A ecosystem | Documentation indicates migration toward A2A under LF [T40][T41] |
| ATP | Let agents execute code in sandbox against APIs/tools | Code execution runtime + API adapters | Server-managed API/tool registry | Sandboxed runtime + provenance claims | Early but active open-source traction [T42][T43] |
| DUADP | Federated agent discovery mesh | REST + optional MCP tooling surface | DNS + WebFinger + gossip federation | DID/trust tiers/policy gating narrative | Early-stage but opinionated full-stack discovery story [T05][T06] |
| OSSA | Portable agent contract/manifest | YAML/JSON schema | Registry/discovery externalized | Compliance/trust metadata in manifest | Positioned as contract layer bridging protocols and platforms [T07][T08] |

## Detailed notes by protocol

## MCP (Model Context Protocol)

Anthropic introduced MCP as a universal way to connect AI systems to external tools/data sources with secure two-way connections and shared SDK/spec ecosystem. [T25]  
Current docs position MCP as a “USB-C for AI applications” and highlight broad client/server support across coding assistants and model platforms. [T26]

## A2A (Agent2Agent)

Google launched A2A (April 2025) for cross-vendor agent communication using agent cards, task lifecycle management, and multimodal message parts. [T27]  
By July 2025, A2A reported v0.3 and >150 organizations in partner ecosystem messaging, and by 2026 docs show a matured specification track (latest 1.0.0 page). [T30][T28][T29]

## AG-UI (Agent-User Interaction Protocol)

AG-UI is positioned as event-first, transport-agnostic, bi-directional middleware between agent runtime and UX surface, with explicit support for lifecycle/tool/state events and streaming interfaces. [T33][T34]

## ANP (Agent Network Protocol)

ANP frames itself as “HTTP of the Agentic Web,” with a three-layer model:

1. identity and secure communication (DID),
2. meta-protocol negotiation,
3. application capability layer. [T35][T37]

It emphasizes decentralized discovery and semantic descriptions, with active implementation work in AgentConnect. [T36]

## LangChain Agent Protocol

LangChain’s Agent Protocol codifies framework-agnostic APIs around runs, threads, and store endpoints for production serving and memory management. [T38]  
LangGraph platform is described as a superset implementation path. [T39]

## ACP

ACP documentation describes REST-native, async-capable agent interoperability and framework-agnostic communication. [T40]  
IBM’s own explainer now includes explicit notice that ACP work is converging with A2A under Linux Foundation processes. [T41]

## Monday.com Agent Tool Protocol (ATP)

ATP is explicitly positioned as a “code-first” alternative to pure function/tool-calling patterns, emphasizing:

- sandboxed code execution,
- parallel operations,
- runtime APIs for approvals/cache/LLM calls,
- provenance/security controls,
- OpenAPI and MCP connectivity. [T42][T43]

## DUADP and OSSA in relation to mainstream protocol stack

DUADP and OSSA do not directly compete with MCP/A2A in strict scope terms:

- OSSA is presented as a **contract artifact** standard.
- DUADP is presented as a **discovery and federation** standard.
- MCP/A2A then occupy runtime interaction planes.

This layered framing is the core design claim of these projects. [T02][T05][T07]

## Adoption trend summary

The strongest observable trend from official sources is **convergence into open governance venues** (especially Linux Foundation structures), while allowing multiple complementary protocols to coexist by layer. [T31][T68][T69]
