# Protocols and Standards: Agentic Interoperability Stack (2026)

Date baseline used for relative references: **March 10, 2026**.

## 1) Stack view: what each protocol family is trying to solve

The ecosystem is stratifying into multiple layers:

- **Contract/definition layer**: what an agent is, what it can do, and under what controls (e.g., OSSA). [T02][T04]
- **Discovery layer**: how agents/capabilities are found across domains (e.g., DUADP, ANP discovery patterns). [T01][T03][T13][T14]
- **Tool/data access layer**: how an agent calls external tools/resources (MCP). [T07][T08]
- **Agent collaboration layer**: how agents delegate and coordinate (A2A, ACP-style approaches, Agent Protocol). [T09][T11][T15][T24]
- **Agent-to-user/app interaction layer**: how frontends receive and steer agent state (AG-UI). [T12]

## 2) DUADP and Open Standard Agents (OSSA): deep assessment

## DUADP (what it is)

DUADP presents itself as a decentralized discovery protocol for agents/skills/tools, with:

- well-known node metadata,
- search/registry/federation endpoints,
- identity and trust metadata integration,
- and SDK/node packaging for deployment. [T01][T03]

Its positioning is explicit: MCP covers tool connectivity; A2A covers agent-to-agent exchange; DUADP fills the "how do they find each other?" gap. [T01]

## OSSA (what it is)

OSSA frames itself as a portable, schema-validated contract layer for agent manifests:

- define once, export to multiple targets,
- include governance/compliance metadata,
- remain protocol-agnostic while referencing MCP/A2A integration points. [T02][T04]

## DUADP + OSSA relationship

The intended composition is:

- OSSA describes the capability contract.
- DUADP helps publish/find those capabilities.

This is conceptually similar to "OpenAPI spec + service registry" patterns in API ecosystems.

## npm/package reality (DUADP/OSSA and adjacent stack)

From package metadata and weekly downloads captured in this run:

- `@bluefly/duadp`: early-stage download volume, Apache-2.0.
- `@bluefly/openstandardagents`: early-stage download volume, Apache-2.0.
- Adjacent ecosystem packages (`@modelcontextprotocol/sdk`, `@a2a-js/sdk`) are operating at much higher weekly throughput. [T05][T06][T49][T50][T51][T52]

Interpretation: architecture is ambitious and coherent; adoption is still maturing relative to MCP/A2A mainstream tooling.

## 3) Major protocol snapshots

## MCP

Anthropic introduced MCP as an open standard to unify model-to-system connectivity and reduce bespoke connectors. It is now broadly supported by major AI apps and IDE ecosystems. [T07][T08]

## A2A

A2A defines peer collaboration semantics (agent cards, task lifecycle, sync/stream/async modalities). Initial launch cited 50+ partners, and subsequent Google Cloud update cites 150+ ecosystem organizations. [T09][T10][T11]

## AG-UI

AG-UI standardizes event-based agent/frontend communication over HTTP/WebSocket-style transports, focusing on streaming, shared state, tool events, and human checkpoints in user-facing apps. [T12]

## ANP

ANP positions itself as "HTTP of the agentic web" and highlights a three-layer architecture: DID-based identity/security, meta-protocol negotiation, and application protocol semantics. [T13][T14]

## LangChain Agent Protocol

Agent Protocol codifies framework-agnostic APIs around runs, threads, store/memory, and introspection for serving agents in production. [T15][T16]

## ACP

ACP emphasizes REST-first agent communication with async support and low integration friction; IBM now notes ACP's ecosystem trajectory merged toward A2A governance under Linux Foundation structures. [T24][T25]

## ATP (monday.com Agent Tool Protocol)

ATP argues for a code-execution-centric model versus strict tool-call chains, emphasizing parallelism, composability, and controlled execution environments. [T23]

## 4) Comparative protocol matrix (concise)

| Protocol | Primary scope | Core transport/model | Security posture (as described) | Adoption signal |
| --- | --- | --- | --- | --- |
| MCP | Agent->tool/data | JSON-RPC client/server | Depends on server authz and runtime controls | Very high package volume [T51] |
| A2A | Agent->agent | JSON-RPC over HTTP/SSE + task model | Enterprise auth/authz patterns, agent cards | 50+ launch, 150+ later ecosystem [T09][T10] |
| AG-UI | Agent->UI/app | Event stream over HTTP/WebSockets | App-layer enforcement + interaction controls | Strong open-source traction [T12][T54] |
| ANP | Agent network + identity | DID + negotiation + app layer | Identity-first, decentralized trust framing | Growing OSS footprint [T13][T14][T54] |
| Agent Protocol | Agent serving API | REST/OpenAPI endpoints | Implementation-defined; introspection-rich | Niche but influential [T15][T16] |
| ACP | Agent communication (REST-first) | HTTP/REST async-first | Lightweight and extensible; now converging with A2A ecosystem | Active OSS + transition note [T24][T25] |
| DUADP | Discovery/federation | Well-known + REST-style registry/federation | Trust-tier and identity metadata oriented | Early-stage package adoption [T01][T03][T49] |
| OSSA | Agent contract/manifest | YAML/schema + export adapters | Governance/compliance metadata in manifest | Early-stage package adoption [T02][T04][T50] |
| ATP | Tool execution paradigm | Runtime code execution over protocol SDK | Sandbox/approval patterns emphasized | Early-stage but active [T23][T54] |

## 5) Selection guidance (practical)

Use a compositional approach:

- Need robust tool interoperability: start with MCP.
- Need multi-agent delegation across boundaries: add A2A.
- Need frontend-safe interactive experiences: add AG-UI.
- Need open discovery/federation: evaluate DUADP (or equivalent registry model).
- Need portable compliance-ready definitions: add OSSA-like manifest contracts.

For high-risk domains, add identity, revocation, and policy enforcement before increasing autonomy. [T26][T27][T41]

## 6) Key risks for protocol adopters

- Protocol-level interoperability does not equal policy-level safety.
- Discovery and collaboration layers can amplify attack blast radius if identity and authorization are weak.
- Security maturity still varies by implementation and defaults, not only by protocol specification. [T41][T42]

Citations: [T01][T02][T03][T04][T05][T06][T07][T08][T09][T10][T11][T12][T13][T14][T15][T16][T23][T24][T25][T26][T27][T41][T42][T49][T50][T51][T52][T54]
