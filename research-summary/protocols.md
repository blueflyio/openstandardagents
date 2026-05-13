# Protocols and Standards

Prepared: 2026-05-13.

## Layer model

| Layer | Standards | Main question |
|---|---|---|
| Contract | OSSA | What is this agent, what can it access, and how is it packaged? |
| Discovery | DUADP/UADP, ANP | How do agents and capabilities find each other? |
| Tool/context | MCP, ATP | How does an agent use tools, data, and APIs? |
| Agent coordination | A2A, ACP, LangChain Agent Protocol | How do agents delegate work and manage runs? |
| User interaction | AG-UI | How does an agent stream state and events to a UI? |

## OSSA: portable agent contract

OSSA is the Open Standard for Software Agents. It is not positioned as a runtime framework or a wire protocol; it is a manifest and export layer that defines agents once and maps them to platforms such as Docker, Kubernetes, LangChain, CrewAI, GitLab Duo, MCP, A2A, npm, Claude/Cursor-oriented artifacts, and others [S03, S04, S05].

Core primitives include schema-validated YAML manifests, identity and GAID fields, tool declarations, autonomy levels, compliance metadata, human-in-the-loop configuration, cost controls, observability, team definitions, and platform-specific exporters [S03, S04]. OSSA complements MCP and A2A by referencing tool/context servers and agent communication artifacts while preserving a portable definition of the agent itself [S03, S04].

The @bluefly/openstandardagents npm package was at version 0.5.1, published 2026-03-28, with Apache-2.0 licensing, 90 weekly downloads on the npm page fetched 2026-05-13, and 23 versions [S04]. The local package.json describes OSSA as an infrastructure bridge between agent protocols and deployment platforms and exposes CLI binaries including `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, and `ossa-mcp` [S05].

## DUADP / UADP: decentralized discovery

DUADP is the Decentralized Universal AI Discovery Protocol. The public site describes it as "DNS for AI agents" and says it uses federated DNS, WebFinger, gossip protocol, W3C DIDs, signatures, and trust-tier policy inputs so agents can find other agents or tools across the open web [S01].

The npm package @bluefly/duadp was at version 0.1.4, published 2026-03-09, with Apache-2.0 licensing and 55 weekly downloads on the fetched npm page [S02]. The SDK exposes a typed HTTP client, Express router, validation, Ed25519 signing/verification, DID resolution, and conformance tests [S02].

The OSSA repository also contains a UADP draft spec at version 0.1.0. It defines a decentralized, hybrid-federated protocol for discovery, validation, and exchange of agents, skills, tools, and marketplaces. A conforming node must serve `GET /.well-known/uadp.json`, must serve at least one agents or skills endpoint, should serve federation, must return JSON, and must return OSSA-formatted payloads [S06]. The naming difference appears to be project evolution: public package/site material uses DUADP, while the local draft spec uses UADP [S01, S02, S06].

## MCP: Model Context Protocol

Anthropic introduced MCP on 2024-11-25 as an open standard for connecting AI assistants to the systems where data lives. It replaces custom integrations with a single protocol for secure two-way connections between MCP clients and servers [S30].

MCP servers expose tools, resources, and prompts. MCP clients or hosts connect to those servers and make structured requests. The TypeScript SDK package @modelcontextprotocol/sdk was at version 1.29.0, published 2026-03-30, with 36.0M weekly downloads, 48.2K dependents, and support for stdio, Streamable HTTP, backwards-compatible HTTP+SSE, tools, resources, prompts, sampling, elicitation, tasks, and OAuth-related examples [S31].

MCP is currently the strongest adoption signal in the agent protocol stack. Its risk is also adoption-driven: each server is a new tool boundary, and tool metadata, credentials, transport, and third-party server supply chains must be treated as security-critical [S19, S20].

## A2A: Agent2Agent protocol

Google announced Agent2Agent (A2A) on 2025-04-09 as an open protocol for communication and collaboration between agents built by different vendors or frameworks [S32]. A2A complements MCP: MCP connects agents to tools and context, while A2A connects agents to other agents [S32].

A2A is built on HTTP, SSE, and JSON-RPC. Its core concepts include Agent Cards for capability discovery, task lifecycle management, artifacts, messages, content parts, and user-experience negotiation [S32]. Google launched it with more than 50 technology and service partners; later search results and ecosystem materials report 150+ organizations supporting or aligning with it [S32, S71].

The Google A2A GitHub repository had 23,747 stars when fetched 2026-05-13 [S33].

## AG-UI: Agent-User Interaction Protocol

AG-UI is an open, lightweight, event-based protocol for connecting agentic backends to user-facing applications [S34]. It standardizes event flows for streaming chat, multimodality, shared state, thinking-step visualization from traces, frontend tool calls, backend tool rendering, interrupts, sub-agents, cancellation, and custom events [S34].

AG-UI is transport-agnostic and built on web primitives such as HTTP, WebSockets, and SSE [S34]. The @ag-ui/client npm package was at version 0.0.53, published 2026-04-30, with 576.2K weekly downloads and 114 dependents on the fetched npm page [S35]. The protocol's GitHub repository had 13,518 stars when fetched [S34].

AG-UI fills a gap that MCP and A2A leave open: real-time user experience, human-in-the-loop approvals, UI state synchronization, and frontend/back-end event semantics [S34].

## ANP: Agent Network Protocol

Agent Network Protocol aims to be "the HTTP of the Agentic Web era" [S36]. Its three-layer architecture is:

| Layer | ANP description |
|---|---|
| Identity and secure communication | W3C DID-based identity and end-to-end encrypted communication |
| Meta-protocol | Negotiation of communication protocols between agents |
| Application protocol | Semantic capability description and protocol management |

ANP addresses interconnection, AI-native interfaces, and efficient collaboration. Its did:wba method extends did:web for agent identity, binding path-type DIDs to Ed25519 public key fingerprints, using HTTP Message Signatures (RFC 9421) and Content-Digest (RFC 9530) for cross-platform authentication [S36, S37].

The AgentNetworkProtocol GitHub repository had 1,296 stars when fetched 2026-05-13 [S36].

## LangChain Agent Protocol

LangChain's Agent Protocol codifies framework-agnostic APIs for serving LLM agents in production [S38]. It focuses on three major resources:

- Runs: executing agents, waiting, streaming, canceling, deleting, and listing runs.
- Threads: multi-turn state, history, status, copy/delete, concurrency controls, and updates.
- Store: long-term memory items, namespaces, CRUD, and search.

It also defines agent introspection endpoints and streaming primitives over SSE and WebSocket for live agent execution [S38]. LangGraph Platform implements a superset of the protocol, and open-source implementations exist for LangGraph.js agents [S38].

The langchain-ai/agent-protocol GitHub repository had 582 stars when fetched 2026-05-13.

## ACP: Agent Communication Protocol

ACP is an open protocol for agent interoperability, now part of A2A under the Linux Foundation according to its docs [S39]. It uses REST endpoints rather than requiring JSON-RPC-specific infrastructure. It supports multimodal MIME-typed messages, synchronous and asynchronous communication, streaming, stateful and stateless patterns, online and offline discovery, and long-running tasks [S39].

ACP's advantage is operational simplicity: no SDK is required, and standard HTTP clients can participate. Its limitation is that it overlaps with A2A and is now being folded into the A2A ecosystem [S39].

## ATP: Agent Tool Protocol

Agent Tool Protocol, from monday.com, argues that agents should write and execute code in a sandbox instead of only calling predefined tools [S40]. ATP's thesis is that OpenAPI was designed for code composition, and agents can reduce context bloat and repeated LLM tool loops by filtering, joining, summarizing, and parallelizing operations in TypeScript/JavaScript [S40].

The @mondaydotcomorg/atp-server package was at version 0.25.0, published 2026-05-05, with 7.0K weekly downloads on the fetched npm page [S41]. It provides sandboxed TypeScript execution, API aggregation, OpenAPI integration, MCP support, semantic search, state management, audit logging, OpenTelemetry, provenance security, execution limits, and approval hooks [S41].

ATP should be treated as a powerful but high-risk pattern. It improves composition and cost when sandboxing is strong, but raises the stakes for isolation, provenance, and policy enforcement [S40, S41].

## Comparative table

| Standard | Purpose | Scope | Format/transport | Adoption signal | Security focus |
|---|---|---|---|---|---|
| OSSA | Agent contract | Definition/export | YAML, JSON Schema | npm v0.5.1; GitHub mirror 4 stars | DIDs, Cedar, compliance |
| DUADP/UADP | Discovery | Agents, skills, tools | HTTP, DNS, WebFinger, gossip | npm v0.1.4 | DIDs, signatures, trust tiers |
| MCP | Tool/context | Tools, resources, prompts | JSON-RPC; stdio; Streamable HTTP | npm 36.0M weekly downloads | Server/tool boundary |
| A2A | Agent coordination | Agent tasks | HTTP, SSE, JSON-RPC | GitHub 23,747 stars | Auth schemes, Agent Cards |
| AG-UI | Agent-to-UI | UI events/state | HTTP, SSE, WebSocket | npm 576.2K weekly downloads | HITL, event visibility |
| ANP | Agentic web | Identity, negotiation, app protocols | DID, HTTP signatures, semantic web | GitHub 1,296 stars | did:wba, E2EE |
| Agent Protocol | Run management | Runs, threads, store | OpenAPI, SSE, WebSocket | GitHub 582 stars | State and execution APIs |
| ACP | REST messaging | Agent invocation | REST, MIME multipart | Part of A2A docs | HTTP auth, async flows |
| ATP | Tool execution | Sandboxed code over APIs | TypeScript sandbox, OpenAPI, MCP | npm 7.0K weekly downloads | Sandbox, provenance, audit |

## Design guidance

- Use MCP when the main problem is exposing tools and data to agents.
- Use A2A or ACP when specialized agents must delegate work or coordinate.
- Use AG-UI when a product needs real-time user-facing agent streams, interrupts, and shared state.
- Use DUADP/ANP when discovery, registry federation, and cryptographic agent identity matter.
- Use OSSA when the system needs portable agent manifests, governance metadata, conformance, and platform export.
- Consider ATP when token-heavy tool loops are the bottleneck and sandbox controls can be enforced rigorously.
