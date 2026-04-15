# Protocols: MCP, A2A, AG-UI, ANP, Agent Protocol, ACP, ATP

Date of synthesis: April 15, 2026

## Protocol landscape at a glance

The ecosystem is increasingly layered rather than winner-take-all:

- **MCP**: model/agent to tools and data,
- **A2A / ACP / ANP**: agent-to-agent and network-level interoperability,
- **AG-UI**: agent-to-user frontend interaction,
- **Agent Protocol (LangChain)**: serving/introspection API layer for production agents,
- **DUADP/OSSA-adjacent** layers: discovery and contract metadata.

## Comparative table (concise)

| Protocol | Primary purpose | Typical transport/message model | Discovery primitive | Security posture (published) | Adoption signals |
| --- | --- | --- | --- | --- | --- |
| MCP | Tool/context connectivity | Client-server; JSON-RPC style interfaces in ecosystem docs | MCP server definitions | “Secure two-way connections” positioning; auth depends on implementation | Broad ecosystem adoption from major vendors and SDKs |
| A2A | Agent-to-agent delegation/collaboration | HTTP/SSE + JSON-RPC patterns in official docs | Agent Card JSON at well-known endpoint | Designed for enterprise auth/authz; governance under Linux Foundation | 50+ launch partners, then 100+/150+ support claims |
| AG-UI | Agent-to-frontend interaction | Event-based transport over HTTP/WebSocket/SSE | Client/server integration metadata | App-level integration security; protocol focuses on UX/state/events | Large open-source community and broad framework integrations |
| ANP | “Agentic web” open network protocol | DID + layered protocol architecture | Capability description in application layer | Identity and secure communication layer based on W3C DID | Early-stage but active open-source community |
| Agent Protocol | Framework-agnostic APIs for serving agents | OpenAPI endpoints (runs/threads/store) | Agent introspection endpoints | Security left largely to implementers; API-first structure | Used by LangGraph ecosystem and community implementations |
| ACP | REST-first agent communication | REST HTTP, async/sync, multipart support | Online/offline metadata discovery | Simplicity + optional identity integration; now converging to A2A | Notable IBM/BeeAI adoption, then merger path into A2A |
| Monday ATP | JS/TS tool execution protocol around agents | JS/TS code-execution centered model | monday ecosystem onboarding + APIs | Enterprise controls in monday platform context | Early but visible via monday press + open GitHub repo |

## 1) Model Context Protocol (MCP)

Anthropic introduced MCP (Nov 25, 2024) as an open standard for connecting AI systems to data sources and tools, replacing fragmented one-off integrations.[T05]  
Key implementation concepts:

- MCP clients and servers,
- shared resources/tools/prompts across implementations,
- SDKs and public server repositories.

For enterprises, MCP is now a baseline integration layer; it does **not** by itself define an agent contract, federated discovery registry, or inter-agent governance model.

## 2) Agent2Agent Protocol (A2A)

Google announced A2A in April 2025 with design principles including interoperability, standard transports (HTTP/SSE/JSON-RPC), and enterprise security support.[T06]  
The protocol centers on:

- **Agent Card** capability advertisement,
- task lifecycle and artifact exchange,
- long-running task support and modality negotiation.

In June 2025, A2A moved under Linux Foundation governance, with public support from major hyperscalers and enterprise software vendors.[T08][T09]

## 3) AG-UI (Agent-User Interaction Protocol)

AG-UI focuses on reliable agent-app interaction:

- event-streamed state and output,
- frontend tool calls and human-in-the-loop controls,
- multi-framework backend compatibility.[T10]

Architecturally, AG-UI is not a substitute for MCP or A2A; it standardizes the user-facing interaction layer.

## 4) Agent Network Protocol (ANP)

ANP presents a broader “agentic web” vision and a three-layer architecture:

1. identity + secure communication (DID-based),
2. meta-protocol negotiation,
3. application protocol/capability semantics.[T11]

ANP is conceptually ambitious and aligned with decentralized identity paradigms; practical mainstream enterprise penetration is still earlier than MCP/A2A.

## 5) LangChain Agent Protocol

Agent Protocol codifies framework-agnostic production APIs across three primitives:

- **Runs** (execution),
- **Threads** (multi-turn stateful interactions),
- **Store** (long-term memory endpoints).[T12][T13]

It also includes agent introspection and standardized OpenAPI docs, making it a strong serving interface pattern for teams that need composable backends.

## 6) Agent Communication Protocol (ACP)

ACP emerged from IBM/BeeAI as a REST-native, SDK-optional standard with async/sync messaging and multimodal support.[T28][T29]  
Published updates now indicate ACP convergence/merger into A2A pathways under Linux Foundation umbrella.[T28][T29]

Practical implication: ACP concepts remain valuable (simplicity, REST ergonomics), but roadmap attention should include migration and interoperability with A2A.

## 7) Monday.com Agent Tool Protocol (ATP)

Monday introduced agent-native onboarding and MCP support in 2026 plus an ATP repository.[T31][T32]  
ATP appears positioned as a pragmatic JS/TS protocol for tool execution in their ecosystem rather than a universal cross-vendor standard at current maturity.

## 8) Where DUADP and OSSA fit relative to protocols

- **DUADP**: discovery/federation + DID trust evidence across nodes, complementary to MCP and A2A claims.[T01]
- **OSSA**: contract/manifest portability layer that can reference multiple transport protocols and deployment targets.[T03]

This distinction is important: transport interoperability alone does not solve agent identity semantics, trust metadata, and deployment portability.
