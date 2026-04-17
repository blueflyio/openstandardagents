# Protocols and Standards Landscape (2025-2026)

Last updated: April 17, 2026

## Executive summary

The current interoperability stack is becoming layered:

- **MCP** for agent↔tool/data interaction,
- **A2A** for agent↔agent collaboration,
- **AG-UI** for agent↔user-interface event transport,
- **contract/discovery layers** (for example OSSA manifests and DUADP-like discovery registries) for portability and routing [SRC-004][SRC-005][SRC-009][SRC-010][SRC-018].

As of April 17, 2026, no single protocol covers identity, discovery, execution semantics, governance, and UI exchange with equal maturity.

## Core protocols

### 1) Model Context Protocol (MCP)

Anthropic introduced MCP as an open standard to reduce fragmented connector implementations and provide secure, structured two-way integration between AI systems and data/tools [SRC-009].

Key traits:

- client/server model with typed tool/resource access,
- strong ecosystem momentum (tooling and server catalogs),
- emphasis on integration consistency rather than full multi-agent orchestration [SRC-009].

### 2) Agent2Agent Protocol (A2A)

Google introduced A2A for inter-agent interoperability and task collaboration, using familiar web primitives (HTTP, JSON-RPC, SSE) plus capability discovery through Agent Cards [SRC-010].

Key traits:

- agent capability discovery and delegation,
- long-running task lifecycle support,
- enterprise-oriented security defaults,
- broad partner ecosystem and Linux Foundation trajectory [SRC-010][SRC-011][SRC-028][SRC-034].

### 3) AG-UI (Agent-User Interaction Protocol)

AG-UI is an event-based protocol for front-end/back-end agent interaction (streaming events, state snapshots/deltas, tool call events, HITL interrupts), and is explicitly transport-agnostic across SSE/WebSocket-like channels [SRC-018][SRC-019].

Key traits:

- standard event taxonomy for interactive UX,
- protocol layer for real-time UI behavior, not agent governance,
- complements MCP and A2A rather than competing with them [SRC-018].

### 4) ANP (Agent Network Protocol)

ANP frames itself as “HTTP for the Agentic Web,” with a three-layer architecture:

1. identity + secure communication (DID-based),
2. meta-protocol negotiation,
3. application protocol semantics [SRC-020][SRC-022][SRC-023].

Key traits:

- strong emphasis on decentralized identity and discovery,
- earlier ecosystem maturity than MCP/A2A based on available public adoption signals.

### 5) ACP (Agent Communication Protocol)

ACP (IBM/BeeAI origin) targeted HTTP-native, framework-agnostic agent communication, but was merged into A2A under Linux Foundation governance; active ACP development is winding down in favor of unified A2A evolution [SRC-029][SRC-034].

Key implication: teams evaluating ACP should plan migration-compatible architectures.

### 6) ATP (monday.com Agent Tool Protocol)

ATP is a code-execution-centric approach: agent-generated code runs in sandboxed V8 contexts, aiming to reduce serial tool-call overhead and enable richer in-loop data processing [SRC-026][SRC-030].

Key implication: ATP fits scenarios where controlled code execution and transformation pipelines are preferred over classic RPC tool calls.

## DUADP and OSSA in protocol context

### DUADP

DUADP presents itself as a discovery/federation layer for agents/skills/tools, combining:

- `.well-known` manifests,
- DNS/WebFinger discovery,
- federation gossip between nodes,
- DID-linked identity narratives [SRC-001][SRC-002][SRC-003].

From published materials, it acts as a **discovery and trust-routing layer** that can sit above transport protocols.

### OSSA

OSSA positions itself as a **portable contract/manifest standard**:

- define capabilities, governance metadata, and deployment characteristics once,
- export across multiple frameworks/runtimes,
- reference MCP/A2A-style integrations [SRC-004][SRC-005][SRC-008].

This is a spec/contract layer rather than a transport protocol.

## Comparison table (concise)

| Protocol / Standard | Primary purpose | Core artifact | Typical transport pattern | Maturity signal (public) |
| --- | --- | --- | --- | --- |
| MCP | Agent↔tool/data access | tool/resource definitions | client/server RPC-style | widely integrated in tooling [SRC-009] |
| A2A | Agent↔agent collaboration | Agent Card + task lifecycle | HTTP + JSON-RPC + SSE | large partner momentum [SRC-010][SRC-011] |
| AG-UI | Agent↔UI interaction | typed runtime events | SSE/WebSocket/event stream | broad framework integration docs [SRC-018] |
| ANP | decentralized networked agent comms | DID + layered protocol artifacts | protocol-suite dependent | active open-source, earlier-stage adoption [SRC-020][SRC-022] |
| ACP | general agent communication | HTTP-native protocol objects | REST/HTTP | merged into A2A path [SRC-029][SRC-034] |
| ATP | tooling via secure code execution | executable code + runtime SDK | sandboxed execution model | emerging, code-first niche [SRC-026] |
| DUADP | discovery/federation for agents | node manifest, registry entries | web endpoints + federation gossip | early-stage package + docs [SRC-001][SRC-003] |
| OSSA | portable agent contract | YAML manifest | N/A (export/spec layer) | active package + docs [SRC-004][SRC-008] |

## Adoption and architecture guidance

For most enterprise teams in 2026:

1. Use **MCP** for tool/data interface standardization.
2. Add **A2A** when cross-agent specialization/delegation is needed.
3. Use **AG-UI** where rich interactive UX and HITL controls matter.
4. Treat contract/discovery layers (OSSA/DUADP-like) as force multipliers for portability and governance metadata.

This layered path aligns with independent survey recommendations and observed production writeups [SRC-030][SRC-037].
