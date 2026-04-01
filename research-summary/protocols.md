# Protocols and Standards (2025-2026)

Prepared: 2026-04-01

## Protocol landscape at a glance

The ecosystem now separates into four interoperable protocol classes:

1. **Tool/context protocols**: MCP. [T06][T07]
2. **Agent-to-agent protocols**: A2A (with ACP convergence). [T12][T13][T19][T20]
3. **Agent-to-UI protocols**: AG-UI. [T14][T15]
4. **Network/discovery protocols**: ANP and DUADP-like approaches. [T16][T17][T01][T02]

---

## 1) Anthropic Model Context Protocol (MCP)

### Purpose
Standardize model/tool and model/data integration via a common JSON-RPC interface. [T06][T07]

### Design highlights
- Base JSON-RPC message model and lifecycle capability negotiation. [T07]
- Server features include tools/resources/prompts. [T07]
- HTTP auth guidance and explicit schema governance in spec docs. [T07]
- Open-source spec + SDK + server examples. [T06][T09]

### Adoption notes
- Early adopters in Anthropic's launch post include Block, Apollo, Replit, and developer tooling vendors. [T06]
- MCP has become the default reference point for "agent-to-tool" standardization across many frameworks. [T07][T10]

### Constraints
- MCP by itself does not define multi-agent coordination semantics; it is primarily tool/context access. [T03][T10]

---

## 2) Google/Linux Foundation Agent2Agent (A2A)

### Purpose
Enable interoperable coordination between heterogeneous agents, including discovery and task lifecycle management. [T11][T12]

### Design highlights
- Agent Cards for capability discovery/metadata exchange. [T11][T12]
- Task-oriented interaction model with status/artifact streaming. [T11][T12]
- Built on common web standards (HTTP, SSE, JSON-RPC), with versioned spec evolution. [T11][T12]
- Latest published spec line includes v1.0.0 and prior versions. [T12]

### Adoption notes
- Initial launch announced support from >50 organizations; later ecosystem messaging cites >150 organizations. [T11][T13]
- Positioned as complementary with MCP rather than a replacement. [T11][T13]

### Constraints
- Real-world security interoperability depends heavily on robust identity/authz profile implementation by participating systems, not protocol text alone.

---

## 3) ACP (Agent Communication Protocol) and convergence dynamics

### Purpose
REST-oriented, lightweight agent messaging/interactions with async support. [T19][T64]

### Current status
- IBM Think and ACP maintainers explicitly note ACP's merge/convergence path into A2A under Linux Foundation umbrella. [T19][T20][T64]

### Implication
- Important for 2026 planning: treat ACP as a migration or compatibility path in many stacks, and prioritize A2A governance trajectories for long-term interoperability programs. [T12][T20]

---

## 4) AG-UI (Agent User Interaction Protocol)

### Purpose
Standardize frontend <-> agent runtime event exchange.

### Design highlights
- Event-driven lifecycle model (run started/finished/error, step events, tool call events, state snapshots/deltas). [T14][T15]
- Transport agnostic (HTTP, SSE, WebSockets, webhooks). [T14]
- Explicitly targets reliable UI synchronization and observability of long-running agent flows. [T15]

### Usefulness
- AG-UI fills an often-missing boundary: many stacks have model/tool and agent/agent standards, but no consistent agent/UI stream semantics.

---

## 5) ANP (Agent Network Protocol)

### Purpose
Define internet-scale agent interconnection with decentralized identity and protocol negotiation.

### Design highlights
- Positioning: "HTTP of the Agentic Web era." [T17]
- Three layers:
  - identity + secure comms (DID-oriented),
  - meta-protocol negotiation,
  - application protocol/capability semantics. [T17]

### Maturity signal
- Strong vision-level framing and active community implementation work, but enterprise adoption maturity is less visible than MCP/A2A in mainstream vendor ecosystems.

---

## 6) DUADP as discovery-layer protocol

### Purpose
Cross-domain/federated discovery of agents, skills, and tools with trust metadata.

### Design highlights
- `.well-known` discovery artifacts + federation patterns.
- Registry + search + publication + identity/governance API surface.
- npm SDK and multi-language ecosystem indications from first-party pages. [T01][T02]

### Interpretation
- DUADP addresses a gap left by many tool/agent protocols: **how entities are discovered across organizational boundaries**, not just how already-known endpoints communicate.

---

## Comparative protocol table

| Protocol | Primary scope | Core transport/style | Main artifact | Typical role |
|---|---|---|---|---|
| MCP | Agent <-> tools/data | JSON-RPC (stdio/HTTP patterns) | tool/resource schema | Tool execution + context access |
| A2A | Agent <-> agent | HTTP + SSE + JSON-RPC semantics | Agent Card + Task | Delegation, multi-agent workflows |
| ACP | Agent messaging (lightweight) | REST/HTTP | agent/message endpoints | Simpler agent comms; migrating toward A2A |
| AG-UI | Agent <-> frontend | Event streams over HTTP/SSE/WebSocket | typed event stream | UI/state synchronization and interaction |
| ANP | Agent network fabric | multi-layer protocol architecture | DID/meta/app protocol descriptors | Open network discovery/negotiation vision |
| DUADP | Federated discovery/registry | HTTP APIs + discovery endpoints | discovery manifests + registry objects | Cross-registry discovery and federation |

---

## Security and standardization observations

1. **Protocol count is shrinking in core coordination layer** due to ACP->A2A convergence. [T20]
2. **Tool and coordination layers are decoupled** (MCP + A2A is increasingly common architecture). [T11][T13]
3. **UI and discovery remain separate concerns** (AG-UI and DUADP/ANP address different, still under-standardized boundaries). [T14][T17][T01]
4. **Cross-protocol composition risk is now a first-order concern** in recent security literature. [T65][T66]

---

## Recommended interoperability architecture pattern (2026 baseline)

For most organizations, a practical stack is:
- MCP for tool access,
- A2A for coordination,
- AG-UI for frontend events,
- plus a discovery/contract layer (DUADP and/or manifest-driven systems like OSSA).

This avoids protocol monolith assumptions and aligns with current ecosystem trajectories and vendor support patterns. [T03][T12][T14][T01]

