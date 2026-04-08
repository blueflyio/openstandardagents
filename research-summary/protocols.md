# Protocols and Standards for Agentic AI (2025-2026)

Date prepared: 2026-04-08

## Scope

This document compares major protocols and standards discussed in the current ecosystem:

- MCP
- A2A
- ACP
- AG-UI
- ANP
- DUADP
- OSSA (contract/spec layer)
- Monday Agent Tool Protocol (ATP)

## Comparative table (concise)

| Protocol / Spec | Primary purpose | Typical transport / format | Layer in stack | Adoption status (as of 2026-04-08) |
| --- | --- | --- | --- | --- |
| MCP | Agent-to-tool/data connectivity | JSON-RPC-style protocol, SDK ecosystem | Tool access | Broad multi-vendor support narrative; LF stewardship context [R07][R08][R09] |
| A2A | Agent-to-agent task exchange | HTTP/SSE, Agent Cards, SDKs | Agent communication | Rapid growth; >50 launch supporters; later updates cite 150+ org support [R10][R11][R12] |
| ACP | Lightweight agent interoperability | REST/HTTP, sync+async | Agent communication | Officially moving into A2A governance path [R16][R17] |
| AG-UI | Agent-to-frontend/UI event protocol | Event streams over HTTP/WebSockets, SDK packages | UI interaction | Fast open-source growth; framework integrations [R13] |
| ANP | Decentralized agent network protocol vision | DID + meta-protocol + app-layer semantics | Network/discovery/coordination | Early but active open-source/research trajectory [R18][R19] |
| DUADP | Federated discovery/registry for agents/skills/tools | `.well-known`, DNS/WebFinger, REST/MCP endpoints | Discovery layer | Emerging implementation, npm package + hosted node [R01][R02][R03] |
| OSSA | Portable agent contract/manifest | YAML/JSON schema + exporters | Contract/packaging layer | Active OSSA tooling/releases, npm package [R04][R05][R06] |
| ATP (Monday) | Code-execution-oriented agent tooling model | OpenAPI-centered runtime with secure execution model | Tool execution model | Early, opinionated alternative to tool-call-first design [R20][R21] |

## 1) MCP (Model Context Protocol)

### What it is

MCP is an open protocol for connecting AI applications to external systems, tools, and data sources. It is commonly framed as the standard “port” between agents and external capabilities. [R07][R08]

### Architecture intent

- MCP server exposes capabilities/resources.
- MCP client (agent/app) consumes them.
- Goal: remove bespoke point integrations and standardize capability access.

### 2025-2026 notable developments

- Expanded ecosystem support and integrations across major AI products reported by Anthropic. [R09]
- Governance formalization through Linux Foundation’s Agentic AI Foundation context. [R09]

### Implementation caveat

MCP standardizes connectivity, but production controls (authorization boundaries, runtime policy, identity provenance) still require additional layers in many deployments. [R39][R41]

## 2) A2A (Agent2Agent)

### What it is

A2A is an open protocol for inter-agent collaboration and task delegation, designed for heterogeneous frameworks and vendors. [R10][R12]

### Core primitives

- Agent Card capability advertisement.
- Task lifecycle and artifact exchange.
- Long-running, multi-step coordination support.

### Design posture

Google’s announcements emphasize:

- existing web standards (HTTP/SSE/JSON-RPC),
- enterprise authentication model support,
- modality-agnostic exchange for rich workflows. [R10][R11]

### Adoption note

Official launch highlighted 50+ ecosystem supporters, later updates cited 150+ organizations. [R10][R11]

## 3) ACP (Agent Communication Protocol)

### What it is

ACP was designed as a REST-forward interoperability protocol for multi-agent messaging and discovery patterns. [R16]

### Key characteristics

- REST-based communication,
- no mandatory SDK,
- sync and async flows,
- lightweight developer ergonomics. [R16][R17]

### Current status

ACP documentation now explicitly states ACP has moved under A2A trajectory in Linux Foundation context, with migration guidance available. [R16]

## 4) AG-UI

### What it is

AG-UI standardizes agent-to-user-interface interaction (event-driven streams, UI state synchronization, and interactive control patterns). [R13]

### Why it matters

Most protocol discussions focus on tool and agent layers; AG-UI addresses the missing “human interface protocol” for robust UX and HITL patterns.

### Maturity signal

- Large and active GitHub footprint,
- npm package ecosystem (`@ag-ui/core`),
- active integrations in modern agent stacks. [R13]

## 5) ANP (Agent Network Protocol)

### What it is

ANP proposes an “HTTP of the Agentic Web” style network architecture with:

1. identity/security layer,
2. meta-protocol negotiation,
3. application protocol layer. [R18][R19]

### Orientation

ANP is more infrastructure/architecture-oriented than immediate app-level agent orchestration protocols; it is useful for decentralized agent-network design discussions.

## 6) DUADP

### What it is

DUADP presents a federated discovery and registry model for agent assets (agents, skills, tools), including node discovery via DNS/WebFinger and DID/trust metadata.

### Technical characteristics

- `.well-known` node metadata,
- registry/search/publish REST surface,
- federation/gossip endpoints,
- SDK support and npm distribution. [R01][R02][R03]

### Strategic role

DUADP attempts to solve the “how do agents find each other/capabilities across domains” problem, which is adjacent to but distinct from MCP/A2A.

## 7) OSSA (Open Standard Agents spec/tooling)

### What it is

OSSA positions itself as the **contract layer** defining agent manifests independent of runtime framework.

### Core function

- schema validation,
- manifest portability,
- export/transformation into platform-specific deployment artifacts.

### Strategic role

OSSA is best understood as a packaging/governance contract layer above protocol transports and below runtime platforms. [R04][R05][R06]

## 8) Monday Agent Tool Protocol (ATP)

### What it is

ATP proposes a code-execution-first model (agents write/execute code in constrained runtime) rather than strictly tool-call-first orchestration.

### Claimed advantages

- reduced context bloat,
- richer composition and parallelization,
- stronger runtime controls when sandboxed correctly. [R21]

### Usage caveat

ATP claims are mostly project-authored narratives at this stage; validate independently for production architecture decisions. [R21]

## Synthesis: practical protocol stack guidance

A practical near-term stack for many enterprises is:

1. MCP for tool/data integration,
2. A2A for inter-agent workflows,
3. a manifest/contract layer (e.g., OSSA-like) for deployment governance and portability,
4. optional discovery layer (e.g., DUADP/registry) for multi-domain ecosystems,
5. AG-UI for frontend/HITL interactions.

This sequence aligns with published ecosystem evolution and addresses most current interoperability gaps. [R28][R09][R11]
