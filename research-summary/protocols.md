# Protocols and Standards

## Core point: the stack is multi-protocol by design

No single protocol covers all agent interactions. The ecosystem is separating into boundaries:
- **Agent <-> tools/context** (MCP),
- **Agent <-> agent** (A2A, ACP, ANP variants),
- **Agent <-> UI** (AG-UI),
- **Discovery/federation** (DUADP/UADP style),
- **Contract/manifest layer** (OSSA, Agent Protocol schema/API for execution management) [[R01]][[R07]][[R20]][[R23]][[R26]][[R28]].

## DUADP and OSSA (requested deep understanding)

## OSSA
OSSA is presented as a **normative contract format** for agents: identity/capability/governance declarations in portable manifests that can be exported across platforms [[R01]][[R02]][[R06]].  

npm package angle:
- `@bluefly/openstandardagents` bundles schema/spec/CLI/services to validate and export manifests [[R04]][[R05]].
- This is closer to "OpenAPI for agents" than to a runtime transport protocol [[R02]][[R06]].

## DUADP
DUADP is presented as **federated discovery infrastructure** ("DNS for AI agents"), including discovery, publication, trust tiers, and federation concepts [[R07]][[R08]].  

npm package angle:
- `@bluefly/duadp` is the SDK/tooling surface for DUADP workflows [[R09]][[R10]].
- The protocol draft in this codebase (UADP naming in spec) defines `.well-known` discovery, resource listing endpoints, and federation peer exchange [[R11]].

## Comparative protocol table (2026 snapshot)

| Protocol / Standard | Primary purpose | Scope boundary | Message/contract format | Adoption status (Mar 12, 2026) |
|---|---|---|---|---|
| MCP | Connect models/agents to tools and data sources | Agent <-> tools/context | JSON-RPC based protocol + SDKs/spec | Widely adopted in agent tooling; governed as open standard [[R20]][[R21]][[R22]] |
| A2A | Inter-agent collaboration/task exchange | Agent <-> agent | Agent Card (JSON), HTTP, SSE, JSON-RPC patterns | Rapid growth; Google reports ecosystem support above 150 orgs [[R23]][[R24]][[R25]] |
| AG-UI | Standardize agent-to-frontend streaming UX | Agent <-> UI | Event model over HTTP/SSE/WebSocket | Emerging, increasingly referenced in production discussions [[R26]][[R43]] |
| ANP | Agentic-web communication with identity + negotiation layers | Agent <-> agent network | 3-layer model (DID identity, meta-protocol, app protocol) | Early but active open-source community [[R27]] |
| Agent Protocol (LangChain-led) | Framework-agnostic APIs for serving agents in production | Agent runtime API surface | OpenAPI-style endpoints for runs/threads/store | Growing interoperability spec; used as baseline by LangGraph ecosystem [[R28]][[R29]] |
| ACP | Lightweight inter-agent communication protocol | Agent <-> agent | HTTP-native + streaming/SSE patterns | Early-stage, open-source and research-backed adoption [[R30]][[R31]] |
| ATP (Agent Tool Protocol) | Tool/API interaction through code execution-first model | Agent <-> tools/APIs | OpenAPI-oriented execution pattern | Experimental/emerging in engineering circles [[R32]][[R33]] |
| DUADP / UADP | Federated discovery, publication, trust, federation | Discovery/control plane | `.well-known` manifest + REST endpoints + federation metadata | Early-stage but concrete SDK/docs and ecosystem positioning [[R07]][[R08]][[R09]][[R11]] |
| OSSA (manifest standard) | Portable contract definition and policy envelope | Contract/packaging layer | YAML/JSON manifest + schema validation | Actively maintained with npm/CLI and multi-platform exports [[R01]][[R02]][[R04]][[R06]] |

## Design goals and architecture notes

- **MCP**: replace one-off integrations with a shared client/server tool-context interface [[R20]][[R21]].
- **A2A**: support secure inter-agent interoperability without exposing private internals; discoverable via Agent Cards [[R23]][[R24]].
- **AG-UI**: make UI streaming/state transitions portable across frameworks and frontends [[R26]].
- **ANP**: explicitly targets "HTTP of the Agentic Web" with decentralized identity and protocol negotiation [[R27]].
- **Agent Protocol**: codifies runtime management APIs (`runs`, `threads`, `store`) so agents are operable regardless of underlying framework [[R28]][[R29]].
- **DUADP/UADP**: discovery and federation semantics designed to avoid central lock-in and support cross-node search/publishing [[R07]][[R11]].
- **OSSA**: manifest-centric portability and governance envelope above protocol layer [[R02]][[R06]].

## Adoption trend summary

1. **Boundary specialization is increasing** rather than converging to one protocol.
2. **A2A and MCP are becoming de facto anchors** for communication and tool connectivity.
3. **Discovery and trust protocols are still early**; DUADP/ANP/ACP are influential but not yet universal defaults.
4. **Manifest/contract standards (OSSA-like approach)** are increasingly relevant for compliance, portability, and deployment automation.

## Open gaps

- Cross-protocol identity and authorization interoperability remains immature [[R49]][[R50]].
- Shared web-conduct norms for autonomous agents remain largely undefined [[R17]].
- Many protocol claims are ecosystem-reported; independent benchmark consortia are still limited.
