# Protocols and Standards (late-2025 to early-2026)

This document compares the most relevant protocol efforts in agentic AI, including requested focus areas: MCP, A2A, AG-UI, ANP, LangChain Agent Protocol, ACP, DUADP, OSSA, and ATP.

## 1) DUADP and OSSA (requested primary focus)

### DUADP

DUADP positions itself as a federated discovery layer for agents/skills/tools with DNS/WebFinger style discovery, gossip federation, DID-linked identity, trust tiers, and policy endpoints. It explicitly frames itself as complementary to MCP and A2A. [S01][S02]

Key characteristics (project-published):
- Discovery manifest + API endpoints (`/.well-known/duadp`, search, publish, federation). [S02]
- DID + signature verification and trust-tier concepts. [S01][S03]
- npm SDK + CLI/server patterns under `@bluefly/duadp`. [S04]

Interpretation:
- Conceptually valuable as “agent discovery infrastructure”.
- Maturity claims are currently mostly first-party; independent interoperability testing is limited in public sources.

### OSSA

OSSA presents itself as a portable “agent contract” manifest layer that can reference protocols (MCP/A2A) and export to multiple deployment targets. [S05][S06][S07]

Key characteristics (project-published):
- Versioned manifest schema (`ossa/v0.5.0`) and validation pipeline. [S06]
- CLI + MCP tooling via `@bluefly/openstandardagents`. [S07]
- Strong emphasis on governance metadata and policy portability. [S05][S07]

Interpretation:
- Valuable for multi-platform portability and lifecycle packaging.
- Best treated as a “contract/tooling layer,” not a wire protocol.

## 2) Core interoperability protocols

### Model Context Protocol (MCP)

MCP is an open standard for agent/client access to external tools and context via standardized client-server patterns and SDKs. [S08][S09]

Design goals:
- Replace one-off integrations with a common protocol.
- Separate context/tool plumbing from model logic. [S08]

Adoption signals:
- Official spec + SDK + server ecosystem with high public repo activity.
- Strong npm/package and dependents footprint in JS ecosystem. [S10][S58][S65][S64]

### Agent2Agent (A2A)

A2A standardizes agent-to-agent discovery and collaboration through Agent Cards, task lifecycle exchange, and secure messaging patterns over common web transports. [S11][S14]

Design goals:
- Cross-vendor inter-agent interoperability.
- Long-running task coordination with structured artifacts/events. [S11][S14]

Adoption signals:
- Strong GitHub activity and partner ecosystem claims.
- SDKs in multiple languages and Linux Foundation governance trajectory. [S12][S14][S63][S59]

### AG-UI

AG-UI standardizes agent-to-frontend interaction as an event-driven layer, transport-agnostic across SSE/WebSocket/webhook/HTTP patterns. [S16][S17][S19]

Design goals:
- Real-time state/event UX for agent applications.
- Interop across backend frameworks without tying to one orchestration stack. [S17]

Adoption signals:
- Fast GitHub and npm growth, broad integration matrix claims in docs/readme. [S19][S60][S57]

### ANP (Agent Network Protocol)

ANP positions as open, decentralized agent-network protocol with DID-based identity/security layer, meta-protocol negotiation, and application-layer capability semantics. [S13][S20]

Design goals:
- Open “agent internet” style architecture.
- Decentralized trust and secure peer communication. [S20]

Adoption signals:
- Lower ecosystem scale than MCP/A2A, but clear architecture and active implementation references. [S13][S61]

## 3) Other important standards and protocol-adjacent efforts

### LangChain Agent Protocol

LangChain Agent Protocol codifies framework-agnostic APIs around runs, threads, and store (long-term memory semantics), with OpenAPI docs and LangGraph-platform superset implementation. [S21]

Best fit:
- API-level standardization for serving/managing agent runtimes.

### ACP (Agent Communication Protocol)

ACP is a REST-oriented inter-agent protocol emphasizing lightweight integration and framework neutrality; official ACP docs now indicate migration under A2A governance path. [S25][S24]

Interpretation:
- Useful in historical/current comparative analysis.
- For net-new standardization choices, roadmap direction appears to converge toward A2A.

### ATP (Monday Agent Tool Protocol)

ATP argues for code-execution-first orchestration versus strict function-call/tool-call flows, emphasizing sandboxed execution and composition benefits. [S66][S67][S69][S68]

Interpretation:
- Important “alternate interaction model” (code-first agent runtime).
- Not yet in the same ecosystem-adoption tier as MCP/A2A.

## 4) Comparative table

| Protocol / Standard | Primary scope | Typical transport/pattern | Core artifact | Discovery model | Security model (publicly emphasized) | Public maturity signal |
|---|---|---|---|---|---|---|
| MCP | Agent ↔ tools/context | JSON-RPC + stdio/HTTP transports | server/tool/resource definitions | via configured servers/registries | auth + controlled tool interfaces | Very high [S10][S64][S65] |
| A2A | Agent ↔ agent | HTTP/SSE/JSON-RPC (+ SDK variants) | Agent Card, task/artifact events | Agent Cards / well-known endpoints | enterprise auth + signed cards | High [S12][S14][S63] |
| AG-UI | Agent ↔ UI | event stream, transport-agnostic | typed event schema | app-side integration | app/proxy controls, framework-defined | High-growth [S16][S19][S60] |
| ANP | Agent network layer | layered protocol stack | DID + metadata/capability semantics | decentralized/networked | DID/E2E orientation | Medium/early [S13][S20][S61] |
| Agent Protocol (LangChain) | runtime API standard | OpenAPI/HTTP endpoints | runs/threads/store API | API endpoint based | implementation-specific | Medium [S21][S62] |
| ACP | Inter-agent REST protocol | REST/HTTP | agent REST contract | runtime + offline metadata | auth model + policy integration | Medium; archived/migrating [S24][S25][S71] |
| DUADP | Discovery/federation | REST + well-known + federation/gossip | DUADP manifest + GAID/DID mapping | DNS/WebFinger/federation | trust tiers + policy gating | Early/project-led [S01][S02][S03] |
| OSSA | Contract/manifest layer | schema + CLI + exports | OSSA manifest | registry/workspace/catalog patterns | policy/compliance metadata | Early/project-led [S05][S06][S07] |
| ATP | Code-first tool protocol | sandbox code execution + API connectors | executable code + runtime SDK | API catalogs + protocol adapters | sandbox/provenance/controls | Early/experimental [S66][S69] |

## 5) Practical guidance for protocol choices (2026 snapshot)

- Choose **MCP** for tool/data integration baseline.
- Add **A2A** where true cross-agent orchestration is required.
- Add **AG-UI** for rich real-time user-facing agent apps.
- Evaluate **DUADP** when decentralized discovery/federation is explicitly needed.
- Use **OSSA-like contract manifests** where multi-target deployment and policy portability are top priorities.
- Treat **ACP/ATP** as specialized or transitional paths unless they match strict requirements.

## 6) Gaps and unresolved standards questions

- No single universal standard yet for agent web conduct, safety disclosure, or accountability boundaries. [S31]
- Identity, authorization, and audit standards for autonomous software agents remain under active definition (NIST/NCCoE concept phase). [S34]
- Security posture and governance maturity still lag deployment velocity. [S36][S37]

