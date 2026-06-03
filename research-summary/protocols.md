# Agent protocols and standards

Research run date: 2026-06-03. Citation keys resolve in `reading-list.md`.

## Stack map

The 2026 protocol landscape is best understood by boundary, not brand. Each protocol is trying to standardize one interface in the agent stack:

| Layer | Protocols / specs | Main question answered |
| --- | --- | --- |
| Agent contract and deployment | OSSA | What is this agent, what can it access, how is it governed, and where can it run? |
| Discovery and identity federation | DUADP, ANP | How do agents find and verify each other across domains? |
| Tool and data access | MCP, ATP | How does an agent invoke tools, APIs, files, data, or code safely? |
| Agent-to-agent coordination | A2A, ACP, LangChain Agent Protocol | How do agents delegate tasks, manage runs, share state, and expose introspection? |
| Agent-to-user interface | AG-UI, A2UI | How do agents stream progress, state, tools, and UI to users? |
| Transport and web conduct | AGTP, Web Bot Auth drafts | How should agent traffic be identifiable and governable at infrastructure level? |

## Comparative table

| Protocol | Purpose | Scope | Message / artifact model | Adoption status |
| --- | --- | --- | --- | --- |
| MCP | Agent-to-tool/data connection | Tools, resources, prompts, clients/servers | JSON-RPC; MCP servers and clients | Strong cross-vendor adoption; SDK package `@modelcontextprotocol/sdk` 1.29.0 on 2026-03-30 [anthropic-mcp] [npm-agent-packages] |
| A2A | Agent-to-agent communication | Discovery, tasks, streaming, push, multimodal parts | Agent Card, Task, Message, Part, Artifact; proto source; JSON-RPC/gRPC/HTTP bindings | Linux Foundation project, spec 1.0.0, 150+ organization support reported [a2a-spec] [a2a-search] |
| AG-UI | Agent-to-frontend interaction | Streaming UI events, state sync, HITL, frontend tools | Typed event stream, `RunAgentInput`, `BaseEvent`, ~16 event types | MIT-licensed repo, 13,989 GitHub stars, integrations with LangGraph, CrewAI, Microsoft Agent Framework, Google ADK, LlamaIndex [ag-ui-readme] [github-repo-metadata] |
| ANP | Agentic web communication | DID identity, secure comms, meta-protocol negotiation, semantic app layer | DID-based identity, protocol negotiation, capability descriptions | Open-source protocol, 1,311 stars; implementation via AgentConnect [anp-readme] [github-repo-metadata] |
| LangChain Agent Protocol | Framework-agnostic agent serving API | Runs, threads, agents, store, streaming | OpenAPI endpoints for runs, threads, store, SSE/WebSocket streaming | 600 GitHub stars; implemented as LangGraph Platform superset [agent-protocol-readme] [github-repo-metadata] |
| ACP | Lightweight agent communication | REST-native agent messaging, multimodal messages, async/sync, SSE | HTTP/REST endpoints; optional SDK; metadata discovery | IBM/BeeAI protocol now part of A2A under Linux Foundation [ibm-acp] [lf-acp-a2a] |
| ATP | Agent-generated code execution for tools | Secure TypeScript/JavaScript sandbox, OpenAPI/MCP aggregation, approvals | Code execution API; V8 isolated VM; runtime `atp.*` APIs | monday.com repo 98 stars; npm server 0.25.0 and client 0.24.0 [monday-atp] [npm-agent-packages] |
| DUADP | Decentralized discovery | DNS TXT, WebFinger, gossip, DID, GAID, trust tiers, MCP tools | `.well-known/duadp`, `/api/v1/*`, MCP tools | `@bluefly/duadp` 0.1.4, 17 MCP tools, 36 indexed resources on site [duadp-site] [npm-duadp] |
| OSSA | Portable agent contract | Manifest schema, identity, capabilities, compliance, export targets | YAML manifest, JSON Schema, agent-card generation, MCP server | `@bluefly/openstandardagents` 0.5.1, 23+ export targets claimed by site [ossa-site] [npm-ossa] |
| AGTP | Dedicated transport for agent traffic | Intent-native methods, mandatory agent identity, authority scope, budgets | Internet-Draft with `agtp://`, port 4480 proposal, method floor | Individual IETF Internet-Draft, not endorsed standard [agtp-draft] |

## MCP: Model Context Protocol

Anthropic introduced MCP on 2024-11-25 as an open standard for connecting AI assistants to systems where data lives: content repositories, business tools, and development environments. MCP replaces fragmented custom integrations with one universal protocol for secure two-way connections between AI-powered tools and data sources [anthropic-mcp].

MCP's architecture is simple: data/tool owners expose MCP servers, and AI applications act as MCP clients that connect to those servers. Anthropic launched the specification, SDKs, Claude Desktop local server support, and an open-source repository of pre-built servers for systems such as Google Drive, Slack, GitHub, Git, Postgres, and Puppeteer [anthropic-mcp].

Early adopters included Block and Apollo, and developer-tool companies including Zed, Replit, Codeium, and Sourcegraph were working with MCP at launch. By 2026, MCP had become the dominant agent-to-tool layer in many industry comparisons [anthropic-mcp] [47billion-production].

## A2A: Agent2Agent Protocol

A2A is an open standard for independent, opaque AI agent systems to communicate and interoperate. The latest fetched specification is version 1.0.0. Its goals are capability discovery, interaction modality negotiation, collaborative task management, secure exchange, asynchronous long-running tasks, and human-in-the-loop scenarios [a2a-spec].

A2A is layered:

1. Canonical data model: Task, Message, AgentCard, Part, Artifact, Extension.
2. Abstract operations: Send Message, Send Streaming Message, Get/List/Cancel Task, Subscribe to Task, push notification config, extended agent card.
3. Protocol bindings: JSON-RPC, gRPC, HTTP/REST, and custom bindings [a2a-spec].

The public Agent Card is the key discovery artifact. It describes identity, capabilities, skills, service endpoint, and authentication requirements. A2A intentionally avoids requiring agents to expose internal state, memory, or tool implementations [a2a-spec].

Search results and Google Cloud coverage report that Google launched A2A in April 2025, donated it to the Linux Foundation, and that support grew to more than 150 organizations by 2026. Google Cloud also reported protocol version 0.3 adding gRPC support, signed security cards, and client-side SDK improvements; the fetched specification now reports 1.0.0 [a2a-search] [a2a-spec].

## AG-UI: Agent-User Interaction

AG-UI is an open, lightweight, event-based protocol for connecting AI agent backends to user-facing applications. It standardizes agent-human interaction, not tool access or agent-to-agent delegation [ag-ui-readme].

Its core abstractions are agent-compatible inputs and a stream of events compatible with roughly 16 standard event types. It is transport agnostic, supporting SSE, WebSockets, webhooks, and other transports, and ships a reference HTTP implementation and default connector [ag-ui-readme] [ag-ui-architecture-search].

AG-UI fits above MCP and A2A: MCP gives agents tools, A2A lets agents communicate with other agents, and AG-UI brings agents into live user-facing applications with streaming text, state synchronization, generative UI, frontend tools, and human-in-the-loop collaboration [ag-ui-readme].

## ANP: Agent Network Protocol

ANP aims to become "the HTTP of the Agentic Web era." Its vision is an open, secure, efficient collaboration network for billions of intelligent agents [anp-readme].

ANP's three-layer architecture is:

1. Identity and secure communication layer, based on W3C Decentralized Identifiers (DIDs), decentralized identity authentication, and end-to-end encrypted communication.
2. Meta-protocol layer for negotiating communication protocols between agents.
3. Application protocol layer using semantic web specifications so agents can describe capabilities and supported application protocols [anp-readme].

ANP emphasizes platform-to-protocol transition, AI-native interfaces instead of human-browser mimicry, and efficient self-organizing collaboration. The repository metadata reports Apache-2.0 license, 1,311 stars, 92 forks, and recent activity on 2026-06-03 [anp-readme] [github-repo-metadata].

## LangChain Agent Protocol

LangChain Agent Protocol codifies framework-agnostic APIs needed to serve LLM agents in production. Its central concepts are runs, threads, and store [agent-protocol-readme].

Runs execute agents, including stateless `POST /runs/wait` and `POST /runs/stream`, background runs, wait, stream, cancel, delete, and listing. Threads organize multi-turn executions with persistent state, revision history, concurrency control, CRUD, copying, and search. Store supports long-term memory with namespaces, CRUD, and search. Agent introspection endpoints expose agent metadata and JSON schemas [agent-protocol-readme].

The protocol also defines thread-centric streaming over SSE or WebSocket for run lifecycle events, tool lifecycle events, message deltas, human-in-the-loop inputs, checkpoints, tasks, and custom events [agent-protocol-readme].

## ACP: Agent Communication Protocol

IBM's Agent Communication Protocol was designed as an open, lightweight, HTTP-native standard for agent interoperability across frameworks, languages, and runtime environments. It supports REST-based design, optional SDKs, multimodal messages, asynchronous-by-default behavior, synchronous support, SSE streaming, and offline/secure discovery [ibm-acp].

IBM Research states ACP is now part of A2A under the Linux Foundation. The Linux Foundation announcement says IBM Research launched ACP in March 2025, donated BeeAI/ACP to the Linux Foundation, and in August 2025 began merging ACP into A2A to create a single stronger standard [ibm-acp] [lf-acp-a2a].

## ATP: Agent Tool Protocol

monday.com's Agent Tool Protocol is a code-first tool protocol. It argues that agents often need to generate and execute code, not just call predefined tools. ATP aggregates APIs and MCP servers, executes TypeScript/JavaScript inside isolated V8 sandboxes, applies memory/CPU/time limits, and supports human approval, caching, logging, OpenTelemetry, OpenAPI, and MCP compatibility [monday-atp].

The strongest ATP claim is efficiency: rather than loading hundreds of MCP tools up front, the agent can search APIs and write code to filter, transform, parallelize, and aggregate results. The source reports benchmark scenarios where ATP reduced context tokens and costs compared with MCP-style tool calling, but these are vendor-reported and should be independently validated [monday-atp].

## DUADP and OSSA in the protocol stack

DUADP is best classified as discovery plus identity federation. It is not a replacement for MCP or A2A; it answers how agents find each other and verify provenance before protocol-specific interaction begins. It uses DNS TXT, WebFinger, gossip federation, DIDs, GAIDs, trust tiers, and 17 MCP tools [duadp-site].

OSSA is best classified as a contract layer. It is not primarily a transport. It declares identity, capabilities, lifecycle, governance, security, compliance, and export/deployment metadata in a portable manifest, then generates artifacts for platforms such as Docker, Kubernetes, LangChain, CrewAI, GitLab Duo, MCP, A2A, and IDE agents [ossa-site] [local-readme].

Together, DUADP and OSSA fill two gaps around the better-known protocol stack: discovery/trust before connection, and a signed portable contract before execution [duadp-site] [ossa-site].

## Other emerging protocols

Google's developer guide to AI agent protocols lists MCP, A2A, UCP, AP2, A2UI, and AG-UI as distinct standards for tools/data, agent delegation, commerce, payment authorization, renderable UI, and streaming interaction respectively [google-protocol-guide].

AGTP is an individual IETF Internet-Draft last updated 2026-05-25. It argues that MCP, ACP, A2A, and ANP are messaging-layer protocols over HTTP and do not solve transport-level indistinguishability between human and agent traffic. AGTP proposes a dedicated application-layer protocol with intent-native methods, mandatory agent identity headers, authority scope, `agtp://` URI, and TCP/TLS plus QUIC support. It is not an endorsed IETF standard [agtp-draft].

The Web Bot Auth workstream and RFC 9421-style signing are relevant because MIT AI Agent Index found only one indexed agent using cryptographic request signing and no settled standards for web conduct [mit-index-details].
