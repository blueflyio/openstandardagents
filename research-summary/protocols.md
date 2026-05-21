# Industry Protocols and Open Standards

As of 2026-05-21.

## Protocol comparison

| Protocol | Primary layer | Message/transport | Core artifact | Adoption status |
|---|---|---|---|---|
| MCP | Agent-to-tool/data | JSON-RPC, client/server | Server tools/resources/prompts | 10,000+ public servers, major platform adoption [S08] |
| A2A | Agent-to-agent | JSON-RPC over HTTP(S), SSE, push | Agent Card, task, artifact | Linux Foundation, 150+ orgs, v1.0 stable [S11][S12] |
| AG-UI | Agent-to-user interface | Events over HTTP, SSE, WebSocket, webhooks | Event stream, run input | Supported by LangGraph, CrewAI, many SDKs [S13] |
| ACP | REST agent messaging | REST/HTTP, MIME messages | Agent manifest, REST endpoints | Now part of A2A under Linux Foundation [S16] |
| ANP | Open agent network | DID-secured layers, semantic web | DID, meta-protocol, capability description | Early open-source protocol, 1.3k GitHub stars [S14][S38] |
| LangChain Agent Protocol | Agent serving API | REST, SSE/WebSocket streaming | Runs, threads, store | LangGraph Platform superset, 589 stars [S15][S38] |
| ATP | Agent-to-tool code execution | Client/server sandbox execution | TypeScript/JS code in V8 sandbox | New monday.com protocol, 96 stars [S17][S38] |
| OSSA | Agent contract | YAML/JSON Schema, exporters | Agent manifest | npm 0.5.1, 23+ export targets on site [S01][S03] |
| DUADP/UADP | Discovery/federation | Well-known, WebFinger, REST, MCP | GAID, DID, registry resources | npm 0.1.4, 17 MCP tools [S04][S05][S06] |

## Model Context Protocol (MCP)

Anthropic introduced MCP on 2024-11-25 as an open standard for connecting AI assistants to data sources, business tools, repositories, and development environments [S07]. MCP replaces fragmented custom integrations with a common client/server architecture: developers expose data through MCP servers or build MCP clients that connect to those servers [S07]. The launch included the specification and SDKs, local Claude Desktop server support, and an open-source server repository with examples such as Google Drive, Slack, GitHub, Git, Postgres, and Puppeteer [S07]. Early adopters included Block and Apollo, and tools such as Zed, Replit, Codeium, and Sourcegraph were already working with MCP [S07].

By 2025-12-09 Anthropic donated MCP to the Linux Foundation's Agentic AI Foundation, co-founded with Block and OpenAI [S08]. Anthropic reported more than 10,000 active public MCP servers, adoption across ChatGPT, Cursor, Gemini, Microsoft Copilot, Visual Studio Code, and cloud infrastructure support from AWS, Cloudflare, Google Cloud, and Microsoft Azure [S08]. It also reported 97M+ monthly SDK downloads across Python and TypeScript, official SDKs in major languages, a community registry, and spec features such as asynchronous operations, statelessness, server identity, and extensions [S08].

## Agent2Agent Protocol (A2A)

Google announced A2A on 2025-04-09 with more than 50 technology and service partners [S09]. The protocol's design principles are agentic collaboration, reuse of existing standards such as HTTP, SSE, and JSON-RPC, secure-by-default enterprise authentication/authorization, support for long-running tasks, and modality-agnostic content [S09]. A2A defines client and remote agents, Agent Cards for capability discovery, task lifecycles, artifacts, message parts, and user-experience negotiation [S09].

The Linux Foundation launched the A2A project on 2025-06-23, moving Google's protocol into vendor-neutral governance with support from more than 100 companies [S10]. On 2026-04-09 the Linux Foundation reported A2A v1.0 as a production-ready open standard with 150+ supporting organizations, integrations across Google, Microsoft, and AWS, signed Agent Cards, multi-protocol support, enterprise multi-tenancy, modernized security flows, version negotiation, and production deployments across supply chain, financial services, insurance, and IT operations [S11]. The repository README describes A2A as enabling opaque agents to discover capabilities, negotiate modalities, collaborate on long-running tasks, and operate without exposing internal state, memory, or tools [S12].

## AG-UI

AG-UI is an open, lightweight, event-based protocol for connecting agents to user-facing applications [S13]. It is designed as a bidirectional connection between an agentic frontend and any backend agent runtime, standardizing how state, UI intents, user interactions, streaming output, tool visualization, and human-in-the-loop approvals flow between app and agent [S13]. Its docs position it as the third protocol layer beside MCP and A2A: MCP connects tools, A2A connects agents, and AG-UI connects agents to people and interfaces [S13].

AG-UI is transport-agnostic and works over SSE, WebSockets, webhooks, and a reference HTTP implementation. The project describes about 16 standard event types and supports streaming chat, multimodality, shared state, frontend tool calls, interrupts, sub-agents, progress events, and custom events [S13]. Integrations include LangGraph, CrewAI, Microsoft Agent Framework, Google ADK, AWS Strands, Mastra, Pydantic AI, Agno, LlamaIndex, AG2, and A2A middleware [S13].

## Agent Communication Protocol (ACP)

ACP is a REST-native open protocol for connecting agents, applications, and humans [S16]. Its docs describe a standardized RESTful API supporting all modalities, synchronous and asynchronous communication, streaming, stateful/stateless patterns, online/offline discovery, and long-running tasks [S16]. ACP is SDK-optional: curl, Postman, browsers, Python SDKs, and TypeScript SDKs can all interact with it [S16].

The important 2026 update is governance: ACP is now part of A2A under the Linux Foundation [S16]. That makes ACP less a rival to A2A and more a REST-oriented design lineage feeding the broader A2A ecosystem.

## Agent Network Protocol (ANP)

ANP aims to be the HTTP of the Agentic Web era [S14]. Its README defines a three-layer architecture:

1. Identity and secure communication based on W3C DIDs, decentralized authentication, and end-to-end encrypted communication.
2. Meta-protocol negotiation so agents can self-organize and agree on communication protocols.
3. Application protocol layer based on semantic web specifications for describing capabilities and supported application protocols [S14].

ANP's goal is a protocol-centric agent internet where all nodes are describable, discoverable, and callable agents or data units. It is ambitious and early; GitHub metadata shows roughly 1.3k stars and recent activity [S14][S38].

## LangChain Agent Protocol

LangChain's Agent Protocol codifies framework-agnostic APIs needed to serve LLM agents in production [S15]. It centers on three concepts: runs for agent execution, threads for multi-turn state, and store endpoints for long-term memory [S15]. It defines ephemeral stateless runs, persistent threads with append-only state history and concurrency controls, agent introspection endpoints, background run lifecycle endpoints, memory store APIs, messages, and streaming primitives over SSE/WebSocket [S15]. LangGraph Platform implements a superset of this protocol [S15][S19].

## Agent Tool Protocol (ATP)

Monday.com's ATP is a code-first tool protocol for executing agent-generated TypeScript/JavaScript in isolated V8 sandboxes [S17]. It argues that traditional function-calling protocols can suffer from schema token bloat, sequential execution, and limited inline data processing. ATP lets models write code that can call OpenAPI APIs, MCP servers, or custom functions, while enforcing memory/time limits, AST validation, provenance tracking, audit logging, caching, approvals, OpenTelemetry, and optional Redis-backed state [S17].

ATP is not a general inter-agent protocol; it is a tool-execution substrate for agents that need programmable orchestration under strict sandbox boundaries [S17].

## OSSA and DUADP in the protocol landscape

OSSA and DUADP fill two gaps not fully covered by MCP or A2A. OSSA is the portable agent contract: the manifest that says what the agent is, what it can access, which compliance controls apply, which policies constrain it, and how it can be exported to platforms [S01][S02]. DUADP is discovery: DNS/WebFinger/gossip plus DID-based identity and trust-tier evaluation for finding agents, skills, tools, and registries [S04][S05].

In a layered architecture, OSSA can reference MCP tools and A2A endpoints, DUADP can discover OSSA resources, A2A can delegate tasks to discovered agents, and AG-UI can expose progress and approvals to users [S01][S04][S11][S13].
