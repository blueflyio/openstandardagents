# Protocols and Standards Landscape (2025-2026)

## Protocol map

No single protocol solves agent interoperability end-to-end. The stack is modular:

- **MCP**: model/tool/data connectivity [R19][R20]
- **A2A / ACP / ANP**: inter-agent coordination and discovery [R24][R30][R27]
- **AG-UI**: agent-to-user-interface event streaming [R25][R26]
- **ATP**: code-first secure tool execution model [R33]
- **DUADP**: federated discovery and publishing layer [R01][R02]
- **OSSA**: manifest contract/export layer (not a transport protocol) [R05][R08]

## Comparative protocol table

| Standard | Primary purpose | Scope | Message/transport model | Adoption status (2026-03-10) |
|---|---|---|---|---|
| MCP | Connect models/agents to tools and data sources | Agent/tool boundary | JSON-RPC; stdio and streamable HTTP transports | Mature momentum; foundation-backed governance and broad vendor integrations claimed [R19][R20][R21] |
| A2A | Agent-to-agent task delegation and collaboration | Cross-agent workflows | HTTP + JSON-RPC 2.0 + SSE; Agent Cards (JSON) | High enterprise momentum; 150+ org support claim; active spec updates [R22][R23][R24] |
| AG-UI | Standardize agent↔frontend interactions | UI/runtime boundary | Event-based streaming over HTTP/WebSocket patterns | Growing ecosystem and SDK adoption [R25][R26] |
| ANP | “HTTP for agentic web” with identity-first interop | Discovery + secure comms + app protocols | DID-based identity layer + meta negotiation + app layer | Emerging; active OSS repo and architecture work [R27] |
| ACP | Lightweight open A2A communication | Agent-agent messaging | REST/HTTP; async-friendly design; multimodal payloads | Originally IBM-led, now converging with broader A2A governance paths [R30][R31][R32] |
| ATP (monday.com) | Code-first tool interaction in secure sandbox | Agent/tool execution runtime | JS/TS code execution in isolated VM; OpenAPI + MCP connectors | Early-stage but technically opinionated (security + observability) [R33] |
| DUADP | Federated discovery for agents/skills/tools | Discovery and registry | `.well-known`, federation/gossip, API search/registry endpoints | Early-stage; explicit npm/PyPI SDK distribution [R01][R02][R03] |
| OSSA | Agent manifest contract and export standard | Description/validation/deployment | YAML/JSON manifest + schema validation + platform export | Growing as “contract layer”; packaged as npm CLI/SDK [R04][R05][R08] |

## Requested deep dive: DUADP + OSSA + npm packages

### DUADP (`duadp.org`, npm `@bluefly/duadp`)

DUADP describes itself as a decentralized universal discovery protocol for AI agents, emphasizing:

- federated discovery model,
- publish/search APIs across agents/skills/tools,
- governance hooks and compliance-oriented positioning,
- MCP-compatible tooling footprint. [R01][R02][R07]

The npm package `@bluefly/duadp` is published as the TypeScript SDK artifact and currently advertises Apache-2.0 licensing and discovery/federation keywords. [R03]

### OSSA (`openstandardagents.org`, npm `@bluefly/openstandardagents`)

OSSA is presented as a vendor-neutral manifest spec and tooling package to bridge protocols to deployment platforms:

- define agent contract once,
- validate via schema,
- export to multiple targets/frameworks. [R04][R05][R06][R08]

The npm package `@bluefly/openstandardagents` positions itself as infrastructure between protocols (MCP/A2A) and runtime targets. [R08]

### Why DUADP + OSSA are complementary

- DUADP targets **network discovery/distribution**.
- OSSA targets **agent contract/packaging/deployment**.
- Combined, they attempt to cover two missing layers not fully handled by MCP or A2A alone. [R02][R05]

## LangChain Agent Protocol specifics

LangChain’s Agent Protocol standardizes framework-agnostic service APIs around:

- **Runs**
- **Threads**
- **Store**

with endpoint conventions intended for production deployment and introspection. [R28][R29]

This is best viewed as an interoperability API surface at the service layer, rather than a replacement for MCP/A2A network transports.

## Design-pattern comparison (practical architecture)

| Need | Best-fit protocol(s) |
|---|---|
| Tool calls with structured schemas and context resources | MCP |
| Multi-agent delegation and task state exchange | A2A / ACP-family |
| Live front-end updates from agents | AG-UI |
| Federated discovery across organizations | DUADP / ANP-style discovery |
| Contract governance + reproducible deployment | OSSA-like manifest layer |

## Risks and open standards issues

1. **Overlapping standards** increase integration ambiguity.
2. **Security model mismatch** across protocols can create weakest-link failures.
3. **Identity portability** remains immature; NIST/NCCoE work indicates this is now urgent. [R50]
4. **Marketing-first claims** can exceed implementation maturity; verify with specs and code.
