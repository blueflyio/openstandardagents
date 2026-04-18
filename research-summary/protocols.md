# Protocols and Standards (2025-2026)

Date finalized: April 18, 2026.

## Comparative protocol table

| Protocol | Primary boundary | Core transport/model | Discovery model | Security posture (as documented) | Adoption signal |
| --- | --- | --- | --- | --- | --- |
| MCP | Agent <-> tools/data | Client-server protocol + SDK ecosystem | Server endpoint config | Secure two-way connections; server/client separation | Broad integration ecosystem since 2024 launch [P01] |
| A2A | Agent <-> agent | HTTP, SSE, JSON-RPC; tasks, messages, artifacts, Agent Cards | Agent Card JSON capability discovery | Enterprise auth/authz focus; secure-by-default design principle | 50+ partners at launch; >150 org support by mid-2025 [P02][P03] |
| AG-UI | Agent <-> user-facing apps | Event-based protocol over HTTP/WebSocket/SSE patterns | App/backend integration docs and SDKs | Protocol-level event discipline; security delegated to implementation | Growing framework integrations [P04] |
| ANP | Networked decentralized agent communication | 3-layer architecture; DID + meta-protocol + app layer | Protocol-level capability and identity discovery | W3C DID-based secure identity and encrypted communication intent | Open-source protocol with active repo [P05] |
| LangChain Agent Protocol | Agent runtime serving API | OpenAPI-defined runs/threads/store endpoints | Agent search/introspection endpoints | API-level controls; implementation-defined auth | Early but concrete open spec and implementations [P06] |
| ACP (IBM/BeeAI path) | Agent <-> agent | REST-first, async/sync patterns | Metadata/offline/online patterns | Strong portability framing; now converging toward A2A path | ACP announced, later merged trajectory into A2A ecosystem [P07] |
| ATP (monday.com) | Agent <-> tools via code execution | Sandboxed JS/TS runtime + API aggregation | OpenAPI/MCP bridge and discovery utilities | Sandboxed execution, provenance policies, runtime controls | Early-stage, code-first protocol positioning [P10] |
| DUADP | Discovery/federation for agents/skills/tools | REST + MCP tool surface; well-known manifest | DNS TXT + well-known + federation gossip + WebFinger/DID narrative | DID/trust-tier/governance policy model | NPM package + docs + reference node [D01][D02] |

## Protocol notes

### MCP (Model Context Protocol)

MCP is presented as the standard answer to “how an AI system connects to external tools and data sources” [P01]. It solves integration fragmentation by offering a single interface model for tool access instead of bespoke connectors for every system pair.

Practical impact:

- establishes “agent/tool contract” expectations
- enables portable tool adapter investments
- is now a baseline dependency for many agent stacks

### A2A (Agent2Agent)

A2A targets collaborative multi-agent workflows with explicit abstractions (Agent Card, task lifecycle, artifacts, message parts) [P02]. It is explicitly positioned as complementary to MCP, not a replacement [P02].

Key design behavior:

- discovery via machine-readable Agent Cards
- support for long-running work and asynchronous status flow
- enterprise-oriented auth/authz framing

The protocol gained additional governance momentum via Linux Foundation pathway and expanded ecosystem support in 2025 [P03].

### AG-UI

AG-UI defines the “agent to front-end interaction bus” and standardizes event flows between backend agent runtimes and user-facing applications [P04].

Important role in stack:

- handles user-interaction semantics not covered by MCP or A2A
- enables multimodal, streaming, and human-in-the-loop UX patterns

### ANP (Agent Network Protocol)

ANP’s explicit goal is internet-scale interoperable agent networking (“HTTP of Agentic Web”) [P05]. It describes:

1. identity and secure communication layer (DID-oriented)
2. meta-protocol negotiation layer
3. application capability layer

It is most relevant for decentralized identity and open-network discovery discussions.

### LangChain Agent Protocol

LangChain’s Agent Protocol is a framework-agnostic serving API for production agent systems with three operational primitives: runs, threads, store [P06].

This is useful because it focuses on operational interoperability:

- ephemeral and background run semantics
- multi-turn thread state/history APIs
- memory/store CRUD/search endpoints

### ACP and ATP

- **ACP** (IBM/BeeAI): REST-native, lightweight agent communication framing, with explicit note that ACP direction merged toward A2A ecosystem governance [P07].
- **ATP** (monday.com): code-first model where agents execute sandboxed code with runtime APIs and provenance controls, plus OpenAPI/MCP bridging [P10].

These illustrate divergence in philosophy:

- message-centric protocol standardization (ACP/A2A)
- code-execution-centric interoperability (ATP)

### DUADP as discovery-layer protocol

DUADP is distinct from transport/collaboration protocols by centering discovery and federation:

- well-known node manifest
- standardized discovery/search/publish APIs
- federation peer exchange and gossip model
- trust-tier framing and DID-linked identity claims [D01][D02]

## Architectural synthesis

A coherent protocol stack in 2026 usually requires more than one protocol:

- **MCP** for tool access
- **A2A/ACP-lineage** for delegation and peer collaboration
- **AG-UI** for front-end interaction semantics
- **Discovery layer** (DUADP/ANP-like) for locating capabilities
- **Contract layer** (OSSA-like) for declaring what an agent is

This decomposition is now more useful than searching for a single “universal” protocol.

## Risks and open questions

1. **Fragmented governance**
   Multiple protocol bodies and vendor interests can create partial overlap without full compatibility guarantees.

2. **Security model heterogeneity**
   Authn/authz assumptions are inconsistent across protocols; cross-protocol trust remains hard.

3. **Discovery trust bootstrapping**
   Discovery protocols need strong anti-spoofing and provenance guarantees to avoid “malicious capability registries.”

4. **Version drift**
   Fast-moving protocol revisions increase integration and compliance maintenance overhead.

5. **Contract gap still under-standardized**
   Transport standards exist; portable, governance-rich contract definitions are still less universal.

---

For citation keys and URLs, see `reading-list.md`.
