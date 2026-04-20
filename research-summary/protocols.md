# Agentic Protocols and Open Standards (2026)

Date prepared: April 20, 2026

## Summary

The protocol landscape is converging toward a layered architecture rather than a single universal standard:

- **MCP** for model/agent-to-tool and context integration. [T12][T13]
- **A2A** (and ACP/ANP alternatives) for agent-to-agent interoperability and delegation. [T14][T15][T22][T19]
- **AG-UI** for agent-to-user-interface interaction semantics. [T17][T18]
- **OSSA-like contract layer** for portable agent manifests and governance metadata.
- **DUADP/ANP-like discovery layers** for locating agents and capabilities over decentralized/federated infrastructure. [T01][T19]

## Comparative view (high level)

| Protocol / standard | Primary purpose | Core transport/model | Discovery primitive | Security/identity model (as documented) | Adoption signal |
| --- | --- | --- | --- | --- | --- |
| MCP | Agent ↔ tools/data/context | JSON-RPC over stateful client-server channels | Server capability negotiation; server catalogs | User consent emphasis; host/client/server capability model | Broad tool and IDE adoption claims from Anthropic and ecosystem docs [T12][T13] |
| A2A | Agent ↔ agent collaboration and delegation | HTTP + JSON-RPC + SSE (plus gRPC in newer versions) | Agent Card metadata | Enterprise auth alignment, signed/secured cards in evolving spec | Launched with 50+ partners; later ecosystem claims >150 supporters [T14][T16] |
| AG-UI | Agent ↔ frontend/user interaction | Event-based protocol over HTTP/WebSocket/SSE | N/A (session/event channel centric) | Not an IAM standard by itself; focuses on reliable event semantics + HITL UX | Growing integrations across agent frameworks and UI stacks [T17][T18] |
| ACP | Lightweight agent communication | RESTful HTTP, MIME multipart, sync+async | Online/offline discovery with metadata | Integrates with RBAC/DID models; open governance orientation | ACP docs now indicate alignment/migration toward A2A umbrella [T22][T23] |
| ANP | Open/decentralized agent network protocol | Multi-layer architecture (identity/meta/application) | Capability/identity discovery in open network | DID-centric identity + secure communication layer | Active community/open-source with whitepaper + SDK projects [T19] |
| DUADP | Federated discovery and registry for agents/skills/tools | REST + MCP tool exposure + federation gossip patterns | `.well-known` manifest, DNS TXT, WebFinger, GAID URI conventions | DID, signatures, trust tiers, policy gates (as project-described) | Early-stage package/site + reference node claims [T01][T02][T03] |
| OSSA (manifest layer) | Portable agent contract and export schema | YAML/JSON schema + CLI exporters | Via registries/discovery layers (often DUADP references) | Contract-level metadata for identity/trust/compliance | Early-stage but active CLI/spec evolution [T04][T05][T06] |

## 1) Model Context Protocol (MCP)

Anthropic introduced MCP as an open standard in November 2024 to replace bespoke integrations between AI systems and enterprise tools/data sources. [T12]  
By specification, MCP uses JSON-RPC 2.0 and separates hosts, clients, and servers with negotiated capabilities. Server features include resources, prompts, and tools; client features include sampling/roots and related utilities depending on version. [T13]

Design goals that stand out:
- standardized tool/context interface,
- composability across vendors,
- explicit trust/safety guidance (consent, data privacy, tool invocation safeguards). [T13]

## 2) Agent2Agent (A2A)

Google announced A2A in April 2025 as an open protocol for inter-agent communication and delegation across frameworks/vendors. [T14]

Key characteristics in official docs:
- capability discovery via **Agent Cards**,
- task lifecycle primitives (send/stream/get/list/cancel task),
- async-first design with streaming and push notifications,
- enterprise-oriented auth/security expectations,
- explicit protocol bindings (JSON-RPC, gRPC, HTTP/REST). [T15]

Later Google Cloud updates emphasized ecosystem expansion (150+ organizations) and production-tooling evolution (SDKs, deployment paths, evaluation hooks). [T16]

## 3) AG-UI (Agent-User Interaction Protocol)

AG-UI defines an event-based interaction contract between user-facing applications and agent backends. It is positioned as a complementary layer to MCP and A2A: MCP for tools, A2A for agent collaboration, AG-UI for frontend interaction and stateful UX loops. [T17][T18]

Notable AG-UI properties:
- real-time event streaming model,
- bidirectional state synchronization,
- support for frontend tool interactions and human-in-the-loop workflows,
- intentionally transport-flexible (SSE/WebSocket/etc.). [T17][T18]

## 4) ACP (Agent Communication Protocol)

ACP is documented as a lightweight REST-based protocol for interoperable agent communication, with support for sync/async messaging, streaming, and optional SDK use. [T22][T23]

Important ecosystem note: ACP documentation now explicitly states ACP is moving under broader A2A/Linux Foundation direction, with migration guidance. This suggests partial convergence pressure in the inter-agent protocol space. [T23]

## 5) ANP (Agent Network Protocol)

ANP frames itself as “HTTP for the Agentic Web,” with a three-layer architecture:
- identity + secure communication layer (DID-oriented),
- meta-protocol negotiation,
- application protocol layer for capabilities and semantics. [T19]

ANP’s framing is more explicitly decentralized/open-network than enterprise-workflow-first protocols.

## 6) DUADP and OSSA as additional layers

### DUADP
DUADP documents position the protocol as federated discovery/registry infrastructure:
- `.well-known` node manifests,
- search/list/publish/federation endpoints,
- DNS/WebFinger hooks,
- trust tiers and governance endpoints. [T01][T02][T07]

Its npm package (`@bluefly/duadp`) describes a TypeScript SDK + server router with core protocol endpoints and cryptographic helper modules. [T03]

### OSSA
OSSA positions itself as contract/manifest layer:
- schema-validated portable definitions,
- export to multiple framework/runtime targets,
- governance and metadata hooks,
- explicit “not a replacement for MCP/A2A” positioning. [T04][T05][T06]

## 7) Emerging standards and protocol-adjacent work

- **Monday.com Agent Tool Protocol (ATP)** proposes code-first sandbox execution as an alternative/complement to tool-schema-first invocation approaches, with explicit critique of MCP limitations in some scenarios. [T20]
- Ongoing W3C/IETF community activity indicates broader standardization pressure, but still fragmented maturity levels and overlapping claims.

## Practical guidance for builders

1. Treat interoperability as layered:
 - choose tool protocol,
 - choose agent-agent protocol,
 - choose UI interaction protocol,
 - choose manifest/contract format.
2. Avoid protocol overloading: one protocol usually cannot satisfy all layers cleanly.
3. Verify concrete conformance and operational behavior (timeouts, retries, idempotency, auth propagation), not just compatibility claims.
4. For regulated use cases, couple protocol choice with identity and policy control plane design from day one. [T35]

## Constraints and caveats

- Many claims are ecosystem/vendor-authored and should be validated in controlled pilots.
- Protocol version churn is high in this period; some docs evolve rapidly.
