# Protocols and Standards: Agent Interoperability in 2026

Date completed: April 2, 2026

## Protocol landscape summary

By early 2026, the ecosystem has at least three widely discussed protocol layers:

- **MCP** for agent-to-tool and agent-to-data connectivity.
- **A2A / ACP / ANP** patterns for agent-to-agent communication and coordination.
- **Contract layers** (for example OSSA) for describing deployable agents across frameworks. [SRC-01][SRC-02][SRC-03][SRC-07][SRC-13][SRC-14]

DUADP is trying to fill a fourth gap: **federated agent discovery and trust signaling**. [SRC-10][SRC-12]

---

## Deep dive by protocol/standard

### 1) Model Context Protocol (MCP)

MCP is an open standard for connecting AI applications to external systems (tools, data, workflows), using a client/server model and a common protocol surface. It was introduced by Anthropic in November 2024 and has broad ecosystem uptake, with later foundation governance developments in 2025. [SRC-01][SRC-02][SRC-18]

Key design value:

- Replaces bespoke per-tool integrations with one protocol model.
- Supports secure, two-way model-to-system interactions.
- Enables "build once, integrate widely" tooling ecosystems. [SRC-01][SRC-02]

### 2) Agent2Agent (A2A)

A2A is an open protocol for inter-agent collaboration, centered on capability discovery via Agent Cards and task-oriented messaging over common web standards (HTTP/SSE/JSON-RPC patterns). Google announced A2A in April 2025 and donated it into Linux Foundation stewardship in June 2025. [SRC-03][SRC-16][SRC-17]

Reported trajectory:

- Initial partner set >50 organizations at launch.
- Expanded ecosystem claims (100+ and then 150+ across subsequent updates). [SRC-03][SRC-17][SRC-18]

### 3) AG-UI (Agent-User Interaction Protocol)

AG-UI focuses on the UI plane: event-based, bidirectional communication between user-facing apps and agent backends over HTTP/WebSocket transports. It is complementary to MCP and A2A rather than a substitute. [SRC-04]

### 4) Agent Communication Protocol (ACP)

ACP is a REST-oriented interoperability protocol emphasizing simple HTTP integration, async-first operations, and framework-agnostic message exchange. ACP sources now indicate migration/merger into the broader A2A/Linux Foundation trajectory. [SRC-07][SRC-32][SRC-33]

### 5) Agent Network Protocol (ANP)

ANP positions itself as a decentralized network protocol vision for agent connectivity, often highlighting DID-based identity and layered architecture for secure and scalable collaboration. [SRC-16][SRC-36]

### 6) LangChain Agent Protocol

LangChain Agent Protocol codifies framework-agnostic APIs for production agent serving, especially around:

- runs,
- threads,
- store/memory,
- introspection.

This standardization target is API-level portability across implementations. [SRC-13][SRC-14][SRC-15]

### 7) DUADP (discovery-focused)

DUADP (as presented by duadp.org and npm package docs) is aimed at decentralized discovery/federation:

- well-known discovery endpoints,
- federated peer exchange,
- DID/signature-backed trust signals,
- registry/search/publish surfaces.

It is best interpreted as discovery/control-plane infrastructure, not a replacement for transport-layer A2A/MCP operations. [SRC-10][SRC-12]

### 8) OSSA (contract-focused standard)

OpenStandardAgents (OSSA) claims contract-layer standardization:

- schema-validated agent manifests,
- portability/export to multiple runtime ecosystems,
- governance/compliance metadata in manifest form.

This is conceptually adjacent to OpenAPI-style standardization for agents. [SRC-13][SRC-14][SRC-21][SRC-22]

### 9) Emerging alternatives: ATP (Monday.com)

Agent Tool Protocol (ATP) from monday.com is framed as code-execution-first (vs pure tool-calling), designed to reduce context bloat and increase composability by letting agents generate/execute bounded code paths. Adoption appears early-stage based on public repo maturity metrics. [SRC-11][SRC-12]

---

## Comparison table (concise)

| Standard / Protocol | Primary purpose | Typical artifacts | Transport/message style | Discovery model | Governance/adoption status (as of Apr 2026) |
| --- | --- | --- | --- | --- | --- |
| MCP | Agent-to-tool/data connectivity | Servers, tool/resource schemas | Client-server protocol (commonly JSON-RPC patterns) | Server endpoint + ecosystem registries | Broad adoption across major clients/tools |
| A2A | Agent-to-agent task collaboration | Agent Card, task/artifact semantics | HTTP/SSE + structured messaging | Capability discovery via Agent Card | Linux Foundation project; strong partner ecosystem claims |
| AG-UI | Agent-to-frontend interaction | Event schemas, client/server adapters | Event streams over HTTP/WebSocket | App-integrated discovery/config | Active open docs/integrations |
| ACP | Lightweight agent interoperability | REST endpoints + message conventions | REST/HTTP, async-first | Online/offline discovery patterns | ACP docs indicate migration into A2A path |
| ANP | Decentralized agent network model | DID-linked protocol layers | Varies by implementation | Network/distributed discovery vision | Active OSS effort, earlier maturity |
| LangChain Agent Protocol | API portability for serving agents | OpenAPI endpoints for runs/threads/store | HTTP API | API-level introspection/search endpoints | Mature specification with ecosystem usage |
| DUADP | Federated discovery + trust routing | well-known manifests, registry objects | HTTP APIs + MCP integration claims | DNS/WebFinger/federated peers | Early package maturity, clear control-plane intent |
| OSSA | Portable agent contract/deployment manifest | YAML manifests + exporters | N/A (contract layer) | Via associated registries/tooling | Early but functional ecosystem approach |
| ATP | Code-execution-first agent tooling | OpenAPI-backed runtime operations | Runtime code execution model | API/tool discovery from specs | Early-stage protocol, limited public maturity |

---

## Adoption trend observations

1. **Interoperability pressure is real**: nearly every serious protocol now claims "open" and "vendor-neutral" positioning.
2. **Foundation hosting is becoming important**: A2A and MCP governance narratives increasingly reference Linux Foundation structures for neutrality and longevity.
3. **Layering is clarifying**: no single protocol solves everything; practical architectures combine MCP + A2A + UI/contract/discovery overlays.
4. **Security still trails functionality**: identity, delegated authority, and policy enforcement remain inconsistent across implementations. [SRC-02][SRC-03][SRC-07][SRC-09][SRC-16][SRC-18]

