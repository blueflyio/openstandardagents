# Protocols and standards (late-2025 to early-2026)

## Executive take

The stack is increasingly stratified:

- **MCP** standardizes agent-to-tool/data interaction. [P1][P2][P3]
- **A2A** standardizes agent-to-agent task exchange and discovery metadata. [P5][P8][P9]
- **AG-UI** standardizes agent-to-user-interface event streams. [P10][P11][P12]
- **OSSA** positions itself as the contract/spec layer describing the agent itself. [D5][D6]
- **DUADP** positions itself as decentralized/federated discovery (“DNS for AI agents”). [D1][D2]

This layering model is technically coherent and is the most important architectural insight from current standards work.

## 1) DUADP (duadp.org): what it is

DUADP describes itself as a **Decentralized Universal AI Discovery Protocol** with federated discovery, DNS/WebFinger roots, DID-based identity, and MCP/REST interfaces. Public docs/homepage repeatedly position it as the “missing discovery layer” between tool and communication protocols. [D1][D2]

Observed specifics:

- site/docs claims: **17 MCP tools** plus REST interfaces; [D1][D2]
- npm package exists and is active (`@bluefly/duadp`, latest 0.1.4 during this run); [D3]
- npm weekly downloads (last-week API at run time): 287. [D4]

## 2) OSSA / Open Standard Agents (openstandardagents.org): what it is

OSSA positions itself as a **vendor-neutral manifest/contract specification** (“define once, export everywhere”), explicitly saying MCP and A2A do not define complete agent contracts. [D5][D6]

Observed specifics:

- public npm package (`@bluefly/openstandardagents`, latest 0.5.0 during this run); [D7]
- npm weekly downloads (last-week API at run time): 648; [D8]
- exported-target framing and governance metadata are emphasized as core value. [D5][D6]

## 3) Major external protocols

### MCP (Anthropic-led, now foundation-governed)

Anthropic introduced MCP on 2024-11-25 as an open standard for secure two-way model/data connections; the official spec centers on JSON-RPC message semantics, lifecycle, capability negotiation, and auth for remote transport. [P1][P2][P3]

On 2025-12-09, Anthropic announced donation of MCP into Linux Foundation’s Agentic AI Foundation governance environment, with broad ecosystem support claims. [P4]

### A2A (Google-origin, Linux Foundation project)

Google introduced A2A on 2025-04-09 with Agent Cards, HTTP/SSE/JSON-RPC transport assumptions, and partner-backed interoperability goals. [P5]

By 2025-06-23, Google moved A2A stewardship to Linux Foundation project governance; both Google and Linux Foundation pages reference support from **100+** organizations (earlier launch messaging used “50+ partners”). [P6][P7]

### AG-UI

AG-UI presents a lightweight event-based contract between backend agents and frontend apps, with streaming interaction semantics and framework-agnostic UX integration goals. [P10][P11][P12]

### ANP (Agent Network Protocol)

ANP’s repository claims a three-layer architecture and a “HTTP of the Agentic Web” ambition, including DID-based identity/secure communication, meta-protocol negotiation, and application capability description layers. [P13]

### LangChain Agent Protocol

LangChain’s `agent-protocol` repo explicitly frames a framework-agnostic serving API with **Runs**, **Threads**, and **Store** endpoint families for stateless, stateful, and memory operations. [P14]

### ATP (Monday.com Agent Tool Protocol) and ACP discussion

Monday’s ATP proposes sandboxed code-execution-based interaction (TypeScript/JavaScript in constrained runtime) as an alternative to strict function-calling schemas in some scenarios. [P15][P16]

ACP appears in ecosystem discussions (for lightweight messaging), but I did not find a single dominant neutral ACP spec canon with adoption parity to MCP/A2A during this run; treat ACP references as emerging and fragmented. [B2]

## 4) Comparison table (concise)

| Protocol / spec | Primary scope | Typical transport/model | Core object | Governance signal (as of 2026-03-16) |
|---|---|---|---|---|
| MCP | Agent ↔ tools/data | JSON-RPC over local/remote transports | Tool/resource/prompt methods | High; foundation-backed, broad SDK/docs [P2][P4] |
| A2A | Agent ↔ agent tasks | HTTP(S), SSE, JSON-RPC | Task, message, artifact, Agent Card | High; Linux Foundation project, 100+ supporters claimed [P6][P7][P8] |
| AG-UI | Agent ↔ UI | Event streams (HTTP/SSE, related patterns) | Typed UI/agent events | Medium; strong practitioner momentum [P10][P11] |
| ANP | Agent network fabric | DID-oriented layered model | Identity + meta-protocol + app protocol layers | Medium; active OSS but earlier-stage adoption [P13] |
| LangChain Agent Protocol | Agent-serving API standardization | HTTP APIs | Runs/Threads/Store | Medium; strong in LangChain ecosystem [P14] |
| DUADP | Discovery/federation layer | DNS/WebFinger + REST/MCP interfaces | Registry/discovery resources | Emerging; active docs/npm but lower scale [D1][D2][D3] |
| OSSA | Agent contract/spec layer | YAML/JSON manifest + exporters | Agent manifest contract | Emerging-to-medium in OSSA ecosystem [D5][D6][D7] |
| ATP | Code-first tool interaction | Sandbox code execution pattern | Executable tool code units | Emerging; vendor-led but open repo [P15][P16] |

## 5) Practical architecture pattern (recommended)

For teams building in 2026:

1. Use **OSSA-like contract** for agent identity/capability declaration. [D5][D6]
2. Use **MCP** for tooling/data integration. [P2][P3]
3. Use **A2A** for inter-agent collaboration and task exchange. [P8][P9]
4. Use **AG-UI** (or equivalent event contract) for production UX synchronization. [P10][P11]
5. Use **DUADP-like discovery** if cross-org/federated discovery is required. [D1][D2]

This layered approach minimizes custom glue and improves auditability.
