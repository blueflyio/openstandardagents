# Open Protocols and Standards for Agentic AI

Date of synthesis: 2026-04-05

## Why protocols now

Open protocols are becoming the control plane of the agent ecosystem. They reduce custom integration overhead, define explicit trust and message boundaries, and enable composability across vendors and runtimes. Harvard LIL and multiple industry sources frame this moment as similar to early internet protocol formation. `[T34][T27][T28]`

## DUADP and OSSA in the standards landscape

### DUADP

DUADP focuses on decentralized discovery and identity-aware trust routing for agents/skills/tools. It uses DNS/WebFinger patterns, federation, and DID-backed verification to make discovery portable across independent nodes. In practice, it complements communication protocols by solving *where to find* and *how to trust* participants before task exchange. `[T01][T03][T07]`

### OSSA

OSSA contributes a manifest contract layer that expresses identity, capabilities, safety/governance policy hooks, and deployment exports. It is designed to consume protocol-level capabilities (for example MCP, A2A) and make them deployable across heterogeneous environments. `[T02][T05][T06][T43]`

## Protocol summaries

### Model Context Protocol (MCP)

MCP, introduced by Anthropic on 2024-11-25, defines standardized client-server interfaces for connecting models/assistants to tools and data systems. Its value proposition is replacing one-off adapters with reusable connectors and SDK-backed server implementations. `[T08]`

### Agent-to-Agent (A2A)

A2A, announced on 2025-04-09 and moved to Linux Foundation governance on 2025-06-23, defines agent discovery and delegation using Agent Cards and interoperable task exchange over web-friendly transports (HTTP/SSE/JSON-RPC, later gRPC support). `[T09][T10][T11]`

### AG-UI

AG-UI standardizes bidirectional event communication between agent backends and user interfaces, with transport-agnostic support (for example SSE/WebSockets). It addresses observable execution, streaming outputs, tool-call rendering, and human-in-the-loop interaction patterns. `[T12][T13]`

### Agent Network Protocol (ANP)

ANP proposes a decentralized three-layer model: identity/secure communication, meta-protocol negotiation, and application-level capability semantics. Its framing as "HTTP of the agentic web" reflects ambitions for broad inter-network interoperability. `[T14]`

### LangChain Agent Protocol

LangChain's Agent Protocol defines framework-agnostic production APIs around `runs`, `threads`, and `store`, targeting remote execution, stateful conversations, and persistent memory semantics across agent runtimes. `[T15][T16]`

### ACP and ATP (emerging/adjacent)

ACP (historically by IBM/BeeAI ecosystem, now archived/merged directionally with A2A efforts) represents a lightweight REST messaging approach. Monday.com's Agent Tool Protocol (ATP) explores a narrower but practical space around sandboxed code/tool execution workflows. `[T17][T18]`

## Comparative view (concise)

| Protocol/Spec | Primary scope | Core artifacts | Typical transport/message model | Adoption signal (as of 2026-04-05) |
|---|---|---|---|---|
| MCP | Agent-to-tool/data | Tool schemas, server implementations | JSON-RPC style over standardized client/server interfaces | Broad ecosystem integration and active spec/server repos. `[T08][T25][T26]` |
| A2A | Agent-to-agent delegation | Agent Cards, task exchange contracts | HTTP/SSE/JSON-RPC (+ gRPC upgrades) | 150+ supporting orgs and LF governance path. `[T09][T10][T11]` |
| AG-UI | Agent-to-frontend interaction | Event schemas, UI bridge conventions | Event streams over SSE/WebSockets/webhooks | Growing integrations across major frameworks. `[T12][T13]` |
| ANP | Decentralized agent web | DID-based identity layers, negotiation model | Multi-layer protocol stack | Early but active open-source momentum. `[T14]` |
| Agent Protocol (LangChain) | Runtime execution APIs | runs/threads/store endpoints | HTTP APIs for managed agent execution | Implemented in LangGraph platform ecosystem. `[T15][T16][T20]` |
| DUADP | Discovery + trust mesh | Discovery docs, registry entries, signatures, DIDs | DNS/WebFinger + federation APIs | Early npm maturity, strong conceptual fit with OSSA. `[T01][T03][T07]` |
| OSSA | Contract/deployment bridge | YAML manifests, CLI/export targets | Spec + tooling (not transport protocol) | Active package and website/docs evolution. `[T02][T05][T06]` |

## Adoption and design trendlines

1. **Layered composition is winning**: teams combine tool, agent, and UI protocols rather than picking one universal standard. `[T27][T28][T40]`
2. **Governance institutionalization is increasing**: Linux Foundation stewardship (A2A) and NIST activity indicate standardization pressure. `[T11][T38][T39]`
3. **Identity and trust are moving upstream**: DID, signed metadata, and policy-aware discovery are becoming part of protocol strategy. `[T01][T14][T38]`

## Practical implementation guidance

- Treat MCP as the default tool integration substrate unless a specialized protocol is required.
- Use A2A-style contracts for external delegation boundaries.
- Add AG-UI for observable user-facing execution where streaming and intervention matter.
- Add manifest/discovery governance (OSSA + DUADP class approaches) when operating multi-team or multi-tenant ecosystems.
- Enforce trust-tier and authorization policy at invocation time, not only at registration time. `[T01][T02][T08][T11][T12][T38]`
