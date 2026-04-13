# Protocols and Standards (Updated: April 13, 2026)

## Protocol map (what each protocol is for)

The ecosystem is converging on specialized protocol layers rather than a single universal protocol:

- **MCP** for agent-to-tool and agent-to-data integration,
- **A2A** for agent-to-agent interoperability,
- **AG-UI** for agent-to-user-interface interaction,
- **DUADP/registries** for capability discovery,
- **Contract schemas** (for example OSSA) for portable agent definitions. [S01][S02][S14][S16][S17][S20][S23]

## Core protocols requested in scope

### 1) Model Context Protocol (MCP)

Anthropic introduced MCP on **November 25, 2024** as an open standard for connecting AI systems to external data/tools through secure two-way client-server interactions. [S14]  
On **December 9, 2025**, Anthropic announced transfer of MCP stewardship into the Linux Foundation’s Agentic AI Foundation, while retaining community-driven maintainer governance. [S15]

Key points:
- Open protocol with SDK/spec ecosystem and broad implementation activity,
- Designed to replace point-to-point custom connectors,
- Supports server discovery/registry patterns and enterprise infrastructure providers. [S14][S15]

### 2) Agent2Agent Protocol (A2A)

Google announced A2A on **April 9, 2025** to standardize inter-agent communication over familiar web transports (HTTP/SSE/JSON-RPC), including capability discovery via **Agent Cards** and task/artifact lifecycle concepts. [S16]  
By **April 9, 2026**, Linux Foundation reporting stated 150+ supporting organizations and production deployments across multiple industries. [S18]

Key points:
- Agent discovery and capability advertising,
- Task-oriented communication with status updates for long-running work,
- Security-focused additions including signed identity metadata in later versions. [S16][S18][S19]

### 3) AG-UI (Agent-User Interaction Protocol)

AG-UI defines an event-based, bidirectional interface for front-end applications and agent backends. It emphasizes streaming events, multimodal interactions, state synchronization, and human-interruptibility on top of HTTP/WebSocket style transports. [S20]

Key points:
- Standardizes agent UX event flow,
- Explicitly positions itself as complementary to MCP and A2A,
- Focuses on interactive product behavior, not tool connectivity alone. [S20]

### 4) DUADP (Decentralized Universal AI Discovery Protocol)

DUADP positions itself as a decentralized discovery layer ("DNS for AI agents"), using `.well-known` manifests, federation/gossip behavior, and trust/identity metadata for discoverability across nodes. [S01][S04]

Packaging and implementation:
- npm package: `@bluefly/duadp`, Apache-2.0, version 0.1.4 at collection time,
- Includes MCP and REST interfaces in project documentation,
- Marketed for OSSA-compatible manifest validation/publication workflows. [S01][S04][S05][S06]

### 5) Open Standard Agents (OSSA) contract layer

OSSA defines a manifest-centered contract for agents (identity, capabilities, compliance metadata, trust descriptors) with exporter patterns to multiple deployment targets. [S02][S03]

Packaging and implementation:
- npm package: `@bluefly/openstandardagents`, Apache-2.0, version 0.5.1 at collection time,
- CLI/MCP workflow for validate/scaffold/convert operations,
- Presented as complementary to MCP and A2A (contract layer between transport and application logic). [S02][S03][S07][S08]

### 6) Agent Network Protocol (ANP)

ANP describes a three-layer architecture:
1. identity/secure communication (DID-based),
2. meta-protocol negotiation,
3. application protocol semantics. [S21]

ANP positions itself as "HTTP of the Agentic Web era" and emphasizes decentralized identity and interconnection beyond centralized platforms. [S21]

### 7) LangChain Agent Protocol

LangChain’s Agent Protocol codifies framework-agnostic APIs for production agent serving, organized around:
- **Runs** (execution lifecycle),
- **Threads** (multi-turn stateful conversations),
- **Store** (long-term memory primitives),
- plus introspection endpoints for discoverability and schema exchange. [S22]

### 8) ACP (Agent Communication Protocol)

ACP, documented by IBM as an agent-to-agent communication protocol, emphasizes REST-first communication and lightweight integration. IBM’s documentation also notes ACP’s consolidation path into A2A under Linux Foundation governance context. [S23]

### 9) Monday.com ATP (Agent Tool Protocol)

ATP proposes code-first sandboxed execution for tool use instead of strict predeclared function schemas:
- TypeScript/JavaScript execution in isolated runtime,
- provenance/security controls,
- OpenAPI and MCP compatibility adapters. [S24]

## Comparative table

| Protocol | Primary scope | Transport / format | Core primitive | Governance signal (as of Apr 13, 2026) |
| --- | --- | --- | --- | --- |
| MCP | Agent ↔ tools/data | JSON-RPC style protocol patterns; SDKs | Tool/resource access contracts | Linux Foundation AAIF stewardship announced Dec 9, 2025 [S14][S15] |
| A2A | Agent ↔ agent | HTTP, SSE, JSON-RPC | Agent Card + task/artifact lifecycle | Linux Foundation project; 150+ org support claim Apr 9, 2026 [S16][S18] |
| AG-UI | Agent ↔ UI | Event streams over HTTP/WebSocket patterns | Typed interaction events | Open protocol docs and ecosystem integrations [S20] |
| DUADP | Discovery/federation | `.well-known` JSON + REST/MCP | Capability registry/discovery manifest | Open source implementation and npm distribution [S01][S04][S05] |
| OSSA | Agent contract manifest | YAML/JSON schema + export adapters | Portable agent contract | Open source package and spec site [S02][S03][S07] |
| ANP | Agent network architecture | Layered protocol family | DID identity + negotiation | Open-source spec project [S21] |
| Agent Protocol (LangChain) | Agent serving API | OpenAPI HTTP endpoints | Runs/Threads/Store | Open-source specification [S22] |
| ACP | Agent messaging | REST/HTTP | Lightweight inter-agent messages | Documented migration context toward A2A [S23] |
| ATP | Tool execution runtime | Code execution + API connectors | Sandboxed code-first tooling | Open-source protocol implementation [S24] |

## Adoption trend summary

1. **MCP and A2A are currently the strongest cross-vendor interoperability anchors** in public discourse and platform support.
2. **Discovery and contract standards are still fragmented** (DUADP/OSSA, Agent Cards, ANP directions, registry approaches).
3. **Security and identity semantics are becoming first-class requirements**, especially signed metadata, trust tiers, and authorization boundaries.
4. **Enterprise use is moving from pilot to production**, but deployment governance remains inconsistent by survey evidence. [S15][S18][S19][S32][S33]

## Limitations

- Some protocol ecosystems are moving rapidly; version details may change between publication and review.
- A few claims (for example broad deployment counts) are vendor/foundation-reported and should be independently validated for procurement decisions.
