# Protocols, Standards, and Interoperability

Research current as of 2026-06-10. Source keys refer to `reading-list.md`.

## Protocol map

The major protocols are complementary. Most confusion comes from treating all agent standards as competitors.

| Protocol | Primary boundary | Core artifact or message | Transport or format | Adoption status |
| --- | --- | --- | --- | --- |
| MCP | Agent to tools/data | Tools, resources, prompts | JSON-RPC-style protocol over stdio/HTTP transports | Dominant tool/context standard; early adopters include Block, Apollo, Replit, Sourcegraph [S16]. |
| A2A | Agent to agent | Agent Card, tasks, messages, artifacts | HTTP(S), JSON-RPC 2.0, SSE; v1 adds broader bindings | Linux Foundation project; 24,220 GitHub stars; broad partner ecosystem [S17], [S18]. |
| AG-UI | Agent backend to UI | Typed event stream | HTTP, WebSockets, SSE, webhooks | Fast-growing UI protocol; 14,183 GitHub stars [S19], [S20]. |
| DUADP | Discovery, federation, identity | GAID, DID, `.well-known`, WebFinger, registry resources | HTTP endpoints, DNS TXT, WebFinger, gossip, MCP tools | Emerging Bluefly protocol; npm 0.1.7, 17 MCP tools on public node [S01], [S02]. |
| OSSA | Agent contract and governance | YAML/JSON manifest, schemas, policy bindings | JSON Schema, CLI, export targets | npm 0.5.6; contract layer for identity, capabilities, governance, export [S03], [S04]. |
| ANP | Agentic-web identity and communication | DID identities, meta-protocol negotiation, agent descriptions | W3C DID, semantic web/JSON-LD, application protocols | 1,319 GitHub stars; ambitious three-layer protocol suite [S21], [S22]. |
| LangChain Agent Protocol | Agent serving API | Runs, threads, store, agents | HTTP API/OpenAPI style | 605 GitHub stars; used by LangGraph Studio and framework adapters [S23]. |
| ACP | Lightweight agent communication | REST messages/runs | REST HTTP, SSE, optional SDKs | IBM/BeeAI-originated; now part of A2A under Linux Foundation [S24], [S25]. |
| ATP | Agent-to-tools via code execution | Sandboxed TypeScript/JavaScript programs | Secure V8 isolate runtime, API/MCP aggregation | Very early; 98 GitHub stars; strong design experiment [S26]. |

## Model Context Protocol (MCP)

Anthropic announced MCP on 2024-11-25 as an open standard for connecting AI assistants to the systems where data lives. MCP provides a universal interface for secure two-way connections between AI-powered tools and data sources, replacing custom integrations with a shared client/server architecture [S16].

Design goals:

- reduce N-by-M custom integration work;
- expose external systems as MCP servers;
- let AI applications act as MCP clients;
- support tools, resources, prompts, and contextual data;
- make integrations reusable across hosts and models [S16].

MCP is now the practical default for agent-to-tool access, but security sources warn that the protocol does not by itself enforce identity, least privilege, or safe tool use. Tool poisoning, malicious metadata, name squatting, prompt injection through tool outputs, and overbroad credentials remain implementation risks [S13], [S41], [S42].

## Agent2Agent (A2A)

Google launched A2A on 2025-04-09 as an open protocol for AI agents to communicate, securely exchange information, and coordinate actions across enterprise platforms. The launch described support from more than 50 technology and services partners. A2A builds on HTTP, SSE, and JSON-RPC and uses JSON Agent Cards for capability discovery [S17].

The A2A GitHub repository describes standardized communication through JSON-RPC 2.0 over HTTP(S), Agent Card discovery, synchronous request/response, SSE streaming, asynchronous push notifications, text/file/JSON exchange, and enterprise-oriented authentication/observability [S18].

Adoption signals:

- Linux Foundation-hosted open-source project;
- Apache-2.0 license;
- 24,220 stars and 2,456 forks on 2026-06-10;
- latest repository push on 2026-06-05;
- broad enterprise vendor and integrator support [S18].

A2A complements MCP. MCP is about what an agent can access. A2A is about how an agent delegates or collaborates with another agent [S17].

## Agent User Interaction Protocol (AG-UI)

AG-UI is an open, lightweight, event-based protocol for connecting agent backends to user-facing applications. It standardizes event streams for lifecycle events, text, tool calls, state changes, and user interactions, while remaining transport-agnostic across HTTP, WebSockets, SSE, webhooks, and similar channels [S19].

AG-UI’s value is UI interoperability. Without a shared event vocabulary, every frontend has to learn every backend framework's streaming format. With AG-UI, a frontend can consume typed events from LangGraph, CrewAI, custom runtimes, or other backends through a compatible adapter [S19], [S20].

Adoption signals:

- MIT-licensed GitHub repository;
- 14,183 stars and 1,273 forks on 2026-06-10;
- active push on 2026-06-10;
- first-party CopilotKit support and community client work [S20].

## Agent Network Protocol (ANP)

ANP aims to become “the HTTP of the Agentic Web.” Its architecture has three layers:

1. **Identity and secure communication layer.** W3C DID-based decentralized authentication and end-to-end encrypted communication.
2. **Meta-protocol layer.** Negotiation of communication protocols between agents.
3. **Application protocol layer.** Semantic descriptions of capabilities and supported application protocols [S21], [S22].

ANP is broader and more ambitious than A2A or MCP. It targets identity, encrypted communication, negotiation, discovery, semantic descriptions, messaging, and payment profiles. Its W3C community mirror describes did:wba, mutual authentication, JSON-LD/schema.org descriptions, RFC 8615 discovery, verifiable credentials, and reuse of existing standards such as OpenAPI and WebRTC [S22].

Adoption signals:

- Apache-2.0 GitHub repository;
- 1,319 stars and 92 forks on 2026-06-10;
- active push on 2026-06-08;
- strong technical vision but smaller ecosystem than MCP/A2A/AG-UI [S21].

## DUADP

DUADP fills a discovery gap: MCP connects tools and A2A connects agents, but neither is a federated global phonebook. DUADP uses DNS TXT records, WebFinger, gossip federation, DID identity, GAID handles, signatures, trust tiers, and policy-aware search to publish and resolve agents, skills, and tools [S01].

The TypeScript SDK provides both client and server surfaces. A DUADP node exposes discovery, WebFinger, registry, publish, resolve, inspect, validation, federation, and resource management endpoints. The SDK also includes signing, DID resolution, conformance tests, and Express router integration [S02].

Important distinction: DUADP does not replace A2A or MCP. It can discover A2A agent cards, MCP-compatible tools, or OSSA resources, then provide trust and provenance evidence around them [S01], [S02].

## OSSA

OSSA is a contract standard. It answers what an agent is, what it declares, what policy bindings apply, what capabilities it has, how it should be discovered, and how it can be exported. It is not a runtime, not a model framework, and not a direct communication protocol [S03], [S04].

The OSSA public site positions the standard as the missing layer between MCP and A2A:

- MCP: how an agent accesses tools and context.
- A2A: how agents exchange tasks.
- OSSA: what the agent contract says about identity, capabilities, compliance, lifecycle, security, and trust [S03].

The npm package contains schemas, validation utilities, CLI commands, reference contracts, and export-oriented package contents. Current stable release is 0.5.6, published on 2026-06-03 [S04].

## LangChain Agent Protocol

LangChain’s Agent Protocol codifies framework-agnostic APIs needed to serve LLM agents in production. It organizes the API around:

- **Runs:** execution, streaming, waiting, cancellation.
- **Threads:** multi-turn interactions and history.
- **Store:** long-term memory items and namespaces.
- **Agents:** introspection of available agents and schemas [S23].

This protocol is narrower than A2A. It standardizes serving and managing agent runs rather than global discovery, identity, or cross-vendor task delegation.

## ACP

IBM’s Agent Communication Protocol is a lightweight, HTTP-native standard for agent interoperability. It is REST-based, SDK-optional, asynchronous-first, synchronous-capable, and supports SSE streaming and multimodal messages [S24], [S25].

ACP is now described by IBM as part of A2A under the Linux Foundation, making it less of a rival standard and more of an influence or migration path into the larger A2A ecosystem [S24].

## Monday.com Agent Tool Protocol (ATP)

ATP is an emerging alternative to traditional function calling. Instead of selecting a predefined tool call, an agent writes TypeScript/JavaScript code that executes in a secure V8 sandbox. ATP aggregates OpenAPI specs, MCP servers, and custom functions; supports parallel execution, data transformation, provenance tracking, permissions, caching, and observability [S26].

ATP is early and much smaller than MCP, but it addresses real MCP pain points: context bloat from preloaded tool schemas, sequential tool execution, lack of inline data processing, and repeated custom gateway construction [S26].

## Standards trend

The winning pattern is not a single mega-protocol. It is layered interoperability with explicit scope:

- MCP for tools and data.
- A2A/ACP for delegation and task exchange.
- AG-UI for UI event streams.
- DUADP/ANP for discovery, identity, trust, and the agentic web.
- OSSA for portable contracts, validation, policy metadata, and deployment/export.
- OAuth/OIDC/SPIFFE/SCIM/NGAC/NIST guidance for identity and authorization enforcement [S15], [S16], [S17], [S19], [S21], [S24].
