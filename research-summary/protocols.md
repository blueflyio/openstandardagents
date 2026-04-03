# Protocols and standards (MCP, A2A, AG-UI, ANP, OSSA, DUADP, ACP, ATP)

Date compiled: April 3, 2026

## Protocol map: what each one is for

| Protocol/Spec | Primary purpose | Typical transport/artifact | Current status signal |
| --- | --- | --- | --- |
| MCP | Agent-to-tool/data connectivity | JSON-RPC; client/server; MCP servers | Broad ecosystem support, active spec/repos |
| A2A | Agent-to-agent task collaboration | JSON-RPC/HTTP/gRPC; Agent Card | Formal spec versions and large partner ecosystem |
| ACP | Lightweight agent communication | HTTP/REST, multimodal messages, sessions | Maintainers indicate migration into A2A ecosystem |
| AG-UI | Agent-to-frontend interaction | Event stream over SSE/WebSocket/HTTP | Mature docs + active OSS implementation |
| ANP | Decentralized agent network architecture | DID + meta-protocol + app protocol layers | Active whitepaper/repo, evolving implementation |
| OSSA | Agent contract/manifest layer | YAML/JSON manifests + exporters | Active schema/tooling package and site |
| DUADP | Federated discovery/registry layer | Well-known + search/publish/federation APIs | Live node/docs + npm package |
| ATP (monday.com) | Code-first tool protocol alternative | Secure JS/TS sandbox execution model | Early ecosystem, repo + docs style README |

## 1) Model Context Protocol (MCP)

Anthropic introduced MCP as an open standard to replace fragmented one-off connectors with a common interface for AI applications to connect to tools/data. [SRC-MCP-ANTHROPIC-2024]

Key attributes:
- Open protocol and SDK ecosystem,
- Explicit client/server model for tool integration,
- Strong adoption narrative across IDE and assistant ecosystems. [SRC-MCP-SITE-2026]

Operationally, MCP is the default "tool plumbing" in many 2026 agent stacks.

## 2) Agent2Agent (A2A)

A2A defines interoperability between independent agents and has an explicit multi-layer specification model. It includes discovery, task operations, streaming, and security-oriented patterns for enterprise use. [SRC-A2A-SPEC-2026]

Important detail: A2A's Agent Card concept standardizes how agents advertise capabilities and endpoints.

Google Cloud's 2025 update described rapid ecosystem growth and a roadmap toward stable enterprise integrations. [SRC-A2A-GCLOUD-2025]

## 3) Agent Communication Protocol (ACP)

ACP provides a general-purpose communication protocol for messages, runs, sessions, and multimodal interaction. The maintainers currently state ACP is being incorporated into A2A-related governance/migration pathways. [SRC-ACP-README-2026]

Interpretation: ACP is important historically and conceptually, but teams should validate migration and compatibility plans against current A2A direction before adopting greenfield.

## 4) AG-UI (Agent User Interaction Protocol)

AG-UI standardizes event-driven communication between agent runtimes and frontend applications. Core model:
- lifecycle events,
- text/tool/state streams,
- transport-agnostic delivery (SSE, WebSocket, etc.). [SRC-AGUI-ARCH-2026] [SRC-AGUI-EVENTS-2026]

This fills a real gap: MCP and A2A do not define rich UI event semantics for live user experiences.

## 5) ANP (Agent Network Protocol)

ANP positions itself as "HTTP for the agentic web" and presents a three-layer architecture:
1. identity/encrypted communication,
2. meta-protocol negotiation,
3. application protocol layer. [SRC-ANP-README-2026] [SRC-ANP-WHITEPAPER-2026]

It is conceptually aligned with decentralized agent-network goals; production maturity remains evolving and should be evaluated per use case.

## 6) OSSA (contract layer)

OSSA is not transport protocol; it is a contract/manifests standard. It frames itself as the missing layer between communication protocols and deployment platforms. [SRC-OSSA-SITE-2026] [SRC-OSSA-SPEC-2026]

Notable: OSSA explicitly claims complementarity with MCP/A2A and offers export/tooling workflows via npm CLI. [SRC-OSSA-NPM-2026]

## 7) DUADP (discovery layer)

DUADP focuses on decentralized discovery, federation, and publish/search APIs for agent artifacts across nodes.
It presents itself as a missing discovery layer relative to MCP/A2A. [SRC-DUADP-SITE-2026] [SRC-DUADP-DOCS-2026]

As of this snapshot, DUADP provides:
- live protocol docs and endpoints,
- TypeScript SDK package,
- federation-oriented node operations. [SRC-DUADP-NPM-2026]

## 8) Monday.com ATP (emerging alternative)

Agent Tool Protocol (ATP) is a code-first model where the agent executes generated JS/TS in a sandbox, aiming to reduce rigid function-call/schema overhead and enable parallel operations. [SRC-ATP-README-2026]

This is an emerging pattern worth watching, especially for teams that prefer programmable agent runtime behavior over strict function-call envelopes.

## Comparative notes

### Scope comparison (quick)

| Problem | Strongest protocol/spec fit (today) |
| --- | --- |
| Tool access to APIs/data | MCP |
| Agent-to-agent task handoff | A2A (with ACP legacy concepts still relevant) |
| UI streaming and interaction semantics | AG-UI |
| Portable agent definition/package | OSSA |
| Cross-node discovery/federation | DUADP / ANP-family |
| Runtime programmable tool execution | ATP |

### Adoption signal quality caveat

Partner counts and growth numbers in blogs are useful but not equivalent to neutral interoperability benchmarks. Prefer combining:
- official specs/repos,
- live conformance tooling,
- production references from independent adopters.

