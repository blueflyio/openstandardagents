# Protocols and Standards (Agentic AI, 2025-2026)

This document compares major protocol and standards efforts relevant to agent interoperability, with direct focus on DUADP and OSSA plus MCP, A2A, AG-UI, ACP, ANP, LangChain Agent Protocol, and ATP.

## 1) Positioning map: what each protocol tries to standardize

| Layer | Primary standards/protocols | Core question answered |
| --- | --- | --- |
| Agent-tool/data | MCP | "How does an agent call tools/data safely?" |
| Agent-agent | A2A, ACP, ANP, ATP (partly) | "How do agents discover and coordinate with other agents?" |
| Agent-UI | AG-UI | "How does an agent stream/interact with front-end UX?" |
| Contract/manifest | OSSA | "How is an agent declared, governed, and exported?" |
| Discovery/federation | DUADP | "How are agent capabilities found across registries/domains?" |

This layered framing is increasingly explicit in ecosystem docs and avoids false "winner-takes-all" protocol debates. [R08][R10][R13][R05][R01][R17]

## 2) DUADP (Decentralized Universal AI Discovery Protocol)

### What it is

DUADP is an open discovery/federation protocol that combines:

- `.well-known` node manifests
- DNS/WebFinger resolution
- federated gossip between nodes
- DID-oriented identity metadata
- registry/search/publish endpoints
- MCP interface exposure for discovery operations [R01][R02]

### Design goal

DUADP's stated goal is to fill the "missing DNS layer for agents" between local MCP/tool integrations and broader multi-agent interoperability. [R01][R02]

### Practical strengths

- explicit discovery and federation API surface
- self-hostable node model
- protocol-friendly with OSSA manifests and MCP tooling [R02]

### Maturity signal (public)

- npm package exists (`@bluefly/duadp`, Apache-2.0), but with early-stage usage metrics as of March 2026. [R04]

## 3) OSSA (Open Standard for Software Agents / OpenStandardAgents)

### What it is

OSSA is a manifest/contract specification and CLI ecosystem for defining agents once and exporting to multiple targets. [R05][R06][R07]

### Design goal

OSSA positions itself as the missing "contract layer":

- MCP handles tool connectivity
- A2A handles inter-agent exchange
- OSSA handles portable agent definition, governance metadata, and platform export [R05][R06]

### Practical strengths

- schema-driven validation
- broad export/adapter ambition
- explicit governance/compliance metadata support [R05][R07]

### Maturity signal (public)

- npm package `@bluefly/openstandardagents` active with rapid version cadence; still early ecosystem scale. [R07]

## 4) MCP (Model Context Protocol)

Anthropic introduced MCP as an open protocol for connecting AI systems to tools/data via a standardized interface instead of bespoke adapters per source. [R08]

Ecosystem docs now describe broad multi-client support, reinforcing MCP as the de facto agent-tool interoperability baseline in 2026. [R09]

## 5) A2A (Agent2Agent)

Google launched A2A in April 2025 for cross-agent interoperability and task exchange, with JSON agent cards and HTTP/SSE/JSON-RPC semantics. [R10]

By July 2025 and beyond, A2A communications report support by 150+ organizations and movement toward Linux Foundation governance with SDK/tooling growth. [R11][R12]

## 6) AG-UI

AG-UI defines an event-driven protocol for agent <-> user-facing app interactions (streaming state/events over web transport like HTTP/WebSockets/SSE). [R13]

Operationally, AG-UI fills a different gap than MCP/A2A: frontend orchestration and user interaction semantics.

## 7) ACP (Agent Communication Protocol)

ACP defines REST-native interoperable messaging between agents/apps/humans, supporting sync+async operation, multimodality, and discovery modes. [R17]

ACP docs note an ecosystem migration path/integration toward A2A under Linux Foundation ecosystem evolution. [R17][R12]

## 8) ANP (Agent Network Protocol)

ANP positions itself as "HTTP of the Agentic Web" with a three-layer architecture:

1. Identity layer (DID + secure comms)
2. Meta-protocol negotiation layer
3. Application capability layer [R14][R15][R16]

ANP is conceptually strong on decentralized identity/network ambitions, but comparatively earlier in broad enterprise standardization than MCP/A2A.

## 9) LangChain Agent Protocol

LangChain's Agent Protocol standardizes APIs around:

- runs (execution)
- threads (multi-turn state)
- store (long-term memory)

with explicit interoperability ambition across frameworks. [R26][R27]

## 10) ATP (Agent Tool Protocol by monday.com)

ATP is a sandboxed code-execution-centric protocol/tooling stack with client/server packages and explicit positioning as an alternative/complement to traditional function-calling patterns. [R18][R19][R20]

It emphasizes:

- secure runtime execution
- API aggregation
- tool composition semantics

with notable npm activity in early 2026 for ATP client/server packages. [R19][R20]

## 11) Concise comparison table

| Protocol/standard | Primary scope | Canonical artifact | Governance pattern | Public adoption signal (Mar 2026) |
| --- | --- | --- | --- | --- |
| MCP | Agent-tool/data | MCP server/client spec + SDKs | Open-source ecosystem (Anthropic-origin) | Widely referenced by major clients/tools [R08][R09] |
| A2A | Agent-agent | Agent Card + task protocol | Google-origin, Linux Foundation trajectory | 150+ org support claim [R10][R11][R12] |
| AG-UI | Agent-UI | Event stream schema | Open protocol/project ecosystem | Large OSS repo footprint [R13][R59] |
| ACP | Agent-agent messaging | REST endpoints, message schema | Open protocol (BeeAI ecosystem) | Active OSS ecosystem [R17][R60] |
| ANP | Decentralized agent network | Layered identity/meta/app model | Open OSS effort | Moderate OSS traction [R14][R15][R16][R61] |
| LangChain Agent Protocol | Agent runtime APIs | Runs/threads/store API | LangChain-led OSS standard | Niche but growing [R16][R43][R55] |
| ATP | Agent tool/runtime protocol | ATP client/server runtime APIs | monday.com-led OSS | Active npm + early repo traction [R18][R19][R20][R63] |
| OSSA | Agent contract/manifest | YAML manifest + schema | OSSA project governance | Early-stage package/CLI [R05][R06][R07] |
| DUADP | Discovery/federation | `.well-known` + search/publish/federation APIs | DUADP project governance | Early-stage package/registry [R01][R02][R04] |

## 12) Key interoperability insight

No single protocol currently spans all layers effectively. The winning deployment pattern in 2026 is likely a composition:

- MCP for tool binding
- A2A/ACP (or equivalent) for inter-agent workflows
- AG-UI for human-facing interaction
- OSSA-like contract for governance/portability
- DUADP-like discovery for federated ecosystems [R05][R01][R09][R12][R13][R17]

---

## Citation keys used in this file

[R01], [R02], [R04], [R05], [R06], [R07], [R08], [R09], [R10], [R11], [R12], [R13], [R14], [R15], [R16], [R17], [R18], [R19], [R20], [R43], [R55], [R59], [R60], [R63], [R64]
