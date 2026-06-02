# Protocols and Standards

Research snapshot: June 2, 2026. Citation keys map to `reading-list.md`.

## Comparative table

| Protocol / standard | Primary scope | Core artifact / format | Transport | Adoption / maturity |
|---|---|---|---|---|
| MCP | Agent to tools, data, prompts, workflows | Servers expose tools/resources/prompts; clients connect | JSON-RPC over supported transports | Broad client/server ecosystem; official docs compare it to USB-C for AI apps [T03] [T04] |
| A2A | Agent to agent communication and delegation | Agent Card, tasks, messages, artifacts | JSON-RPC 2.0 over HTTP(S), SSE, push; spec also defines bindings | Linux Foundation project, Google-contributed, 100+ supporters at June 2025 donation; repo v1.0.1 by May 28, 2026 [T06] [T08] |
| AG-UI | Agent to user-facing UI | Standard event types, input shapes, middleware | Transport-agnostic; HTTP, SSE, WebSockets, webhooks | Fast-growing OSS project with many framework SDKs/integrations [T07] |
| ANP | Agentic web communication network | DID identities, meta-protocol negotiation, semantic application descriptions | Web/P2P-oriented; DID and encrypted communication | Ambitious early protocol, MIT license, AgentConnect implementation [T05] |
| LangChain Agent Protocol | Serving and introspecting production agents | REST/OpenAPI endpoints for runs, threads, agents, store, streaming | HTTP, SSE, WebSocket | Implemented as a superset by LangGraph Platform; OSS spec repo [T18] |
| ACP | Agent communication | REST/OpenAPI, Python/TS SDKs | HTTP REST, SSE | Merging into A2A under Linux Foundation; active development winding down [T25] |
| ATP | Agent to tool/code execution | TypeScript/JavaScript code execution over OpenAPI/MCP aggregation | V8 isolate sandbox plus APIs | Emerging monday.com OSS project, small repo, code-first alternative to function calling [T26] |
| OSSA | Agent contract / manifest / export layer | YAML manifests, JSON Schema, agent-card schema, trust metadata | CLI, SDK, MCP server, exported platform artifacts | `@bluefly/openstandardagents` v0.5.1, Apache-2.0, 23+ export targets on site [T02] [T34] |
| DUADP | Federated discovery and trust | GAID, WebFinger, DNS TXT, DIDs, registry resources, MCP tools | HTTP REST, MCP SSE, gossip federation | `@bluefly/duadp` v0.1.4, Apache-2.0, live node reports 36 resources and 17 MCP tools [T01] [T35] |

## MCP: Model Context Protocol

Anthropic announced MCP on November 25, 2024 as an open standard for connecting AI assistants to content repositories, business tools, development environments, and other systems where data lives [T03]. The stated problem was fragmented custom integrations: every new data source required a bespoke connector. MCP replaces that with a universal protocol where developers expose capabilities through MCP servers and AI applications connect as MCP clients [T03].

Official MCP docs define it as an open-source standard for connecting AI applications to external systems, including data sources, tools, and workflows [T04]. MCP's central analogy is "USB-C for AI applications" because it gives many clients and servers one interoperable connection model [T04]. The docs also state broad support from AI assistants and developer tools, including Claude, ChatGPT, Visual Studio Code, Cursor, MCPJam, and others [T04].

MCP's boundary is tools and context, not agent identity or agent-to-agent negotiation. That is why OSSA, A2A, AG-UI, and DUADP position themselves as complementary rather than replacements [T02] [T06] [T07].

## A2A: Agent2Agent Protocol

Google announced A2A in April 2025 with more than 50 technology and services partners [T06]. The goal is interoperation between agents built on different frameworks, vendors, and platforms. A2A's design principles include building on existing standards such as HTTP, SSE, and JSON-RPC, and enabling capability discovery through JSON Agent Cards [T06].

On June 23, 2025, Google Cloud donated A2A to the Linux Foundation. The announcement says the Linux Foundation project launched with AWS, Cisco, Google, Microsoft, Salesforce, SAP, and ServiceNow, and that more than 100 companies supported A2A at that time [T06]. Google transferred the specification, SDKs, and developer tooling to seed the project [T06].

The A2A GitHub README describes A2A as an open protocol for communication and interoperability between opaque agentic applications [T08]. Key features are standardized JSON-RPC 2.0 over HTTP(S), Agent Card discovery, synchronous request/response, streaming via SSE, asynchronous push notifications, text/file/structured JSON exchange, and enterprise concerns around security, authentication, and observability [T08]. The repo shows Apache-2.0 licensing and a latest release of v1.0.1 on May 28, 2026 [T08].

A2A's "opaque agents" posture is important. A remote agent does not need to expose its internal memory, tools, or proprietary logic. It publishes what it can do and accepts tasks over a common protocol [T08].

## AG-UI: Agent-User Interaction Protocol

AG-UI standardizes the agent-to-frontend layer. The raw README defines AG-UI as an open, lightweight, event-based protocol that connects AI agents to user-facing applications [T07]. It supports real-time streaming, bi-directional state synchronization, generative UI, real-time context enrichment, frontend tool integration, and human-in-the-loop collaboration [T07].

AG-UI positions itself next to MCP and A2A: MCP gives agents tools, A2A lets agents communicate with agents, and AG-UI brings agents into user-facing applications [T07]. The protocol is deliberately transport-flexible. Agent backends emit approximately 16 standard event types and accept a small set of compatible inputs; middleware can adapt events across SSE, WebSockets, webhooks, and other transports [T07].

Its adoption signal is strong for a young protocol: the repository has roughly 13.9K stars, many supported integrations, and SDKs across TypeScript, Python, Kotlin, Go, Dart, Java, Rust, Ruby, C++, and others [T07].

## ANP: Agent Network Protocol

ANP is the most ambitious network-layer project in the surveyed set. Its README says ANP aims to become "the HTTP of the Agentic Web era" and to define how agents connect with each other in an open, secure, efficient collaboration network for billions of agents [T05].

ANP's three-layer architecture is:

1. Identity and secure communication: W3C DID-based decentralized authentication and end-to-end encrypted communication.
2. Meta-protocol: negotiation of communication protocols between agents so networks can self-organize and self-negotiate.
3. Application protocol: semantic web specifications for capability and application-protocol descriptions [T05].

ANP is useful as a design reference because it treats identity, communication security, negotiation, and semantic capability description as one stack. That overlaps with OSSA/DUADP goals, but ANP's emphasis is agent network communication, while OSSA focuses on portable contracts and DUADP on discovery/federation [T01] [T02] [T05].

## LangChain Agent Protocol

LangChain's Agent Protocol codifies framework-agnostic APIs for serving LLM agents in production [T18]. It centers on three concepts:

- Runs: executing an agent, including ephemeral runs, background runs, wait endpoints, cancellation, deletion, and streaming.
- Threads: persistent multi-turn execution state, history, concurrency controls, copying, and deletion.
- Store: long-term memory namespaces and CRUD/search operations [T18].

The protocol also includes agent introspection endpoints and a thread-centric streaming protocol using SSE and WebSockets for live agent execution, replay, namespaces, content-block deltas, tool lifecycle events, human-in-the-loop input, checkpoints, tasks, and custom events [T18].

Unlike A2A, this is not primarily about cross-organization agent discovery. It is an API surface for running, managing, introspecting, and observing agents once a service endpoint is known [T18].

## ACP: Agent Communication Protocol

ACP was IBM/BeeAI's open protocol for communication between AI agents, applications, and humans [T25]. IBM describes it as lightweight, HTTP-native, framework-agnostic, and compatible with common web infrastructure. It used REST principles, well-defined HTTP endpoints, async-first semantics, synchronous support, and SSE streaming [T25].

ACP is now part of A2A under the Linux Foundation. The Linux Foundation AI & Data post says active ACP development is winding down and the team is contributing its technology and expertise directly to A2A; BeeAI users are directed toward A2A adapters and migration documentation [T25]. For new designs, ACP should usually be treated as a historical/converging branch rather than a long-term independent bet.

## ATP: Agent Tool Protocol

Monday.com's ATP is a code-first alternative or complement to predefined function-calling tool protocols. The project describes ATP as enabling AI agents to generate and execute TypeScript/JavaScript code in a secure sandbox rather than calling a fixed set of functions [T26].

ATP's claimed advantages are V8 isolate execution with memory/time limits, a runtime SDK, stateless architecture, LangChain/LangGraph integration, provenance tracking, OpenAPI and MCP compatibility, parallel execution, inline filtering/mapping/reducing, type safety, and observability [T26]. Its website argues that code execution can reduce context bloat and token usage by letting agents fetch relevant APIs on demand instead of seeing every tool up front [T26].

ATP's risk profile is different from MCP. It can be more expressive and efficient, but it moves more responsibility into sandboxing, policy annotations, provenance, and runtime approvals. It should be evaluated as an execution boundary, not just a protocol convenience [T26].

## OSSA: Open Standard for Software Agents

OSSA is explicitly not positioned as a protocol like MCP or A2A and not as a framework like LangChain or CrewAI. The local README calls it the "infrastructure bridge between agent protocols and deployment platforms" and "the missing middle layer that translates agent definitions into platform-specific deployments" [T33].

The OSSA website calls this the "contract layer": a portable manifest that declares identity, capabilities, compliance, lifecycle, security, trust, state management, human-in-the-loop controls, cost controls, MCP references, A2A patterns, and export targets [T02]. Its package metadata describes `@bluefly/openstandardagents` as "Define once in YAML, export to 9+ platforms" and exposes schemas, validation, generation, migration, mesh, agent-card generation, SDK, trust, workspace validation, and an MCP server [T34].

As of npm metadata fetched on June 2, 2026, `@bluefly/openstandardagents` latest is v0.5.1, Apache-2.0, with CLI bins `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, and `ossa-mcp` [T34]. The package depends on MCP, OpenAI/Anthropic/Google SDKs, Cedar WASM, LangChain, OpenTelemetry, DID resolvers, JSON canonicalization, and related tooling [T34].

## DUADP: Decentralized Universal AI Discovery Protocol

DUADP addresses a missing layer: how agents find other agents and verify what they find. The website describes it as "DNS for AI Agents" and says no universal discovery exists for agents; DUADP uses federated DNS, WebFinger, and gossip so any agent can find another agent on the open web [T01].

DUADP's identity model combines GAIDs, WebFinger, and DIDs. A GAID is the portable lookup handle, WebFinger maps that handle to endpoints, the DID document carries keys and verification methods, signatures prove published manifest integrity, and trust tiers become inputs to Cedar policies [T01]. The live site reports protocol version 0.1.4, federation enabled, 36 registered resources, and 17 MCP tools [T01].

The npm package `@bluefly/duadp` latest is v0.1.4, Apache-2.0, TypeScript-first, with CLI bin `duadp`, exports for client/server/validate/crypto/did/conformance, and dependencies on AJV, canonicalize, DID resolvers, `key-did-resolver`, and `web-did-resolver` [T35].

## Practical protocol selection

| If you need to... | Start with | Add when... |
|---|---|---|
| Expose internal APIs, tools, databases, prompts, or workflows to agents | MCP | Add OSSA to declare the agent contract and DUADP for discovery [T03] [T04] [T33] |
| Let agents from different vendors collaborate | A2A | Add KYA/identity policy, OSSA manifests, and DUADP discovery [T06] [T08] [T20] |
| Show live agent progress and user approvals in a frontend | AG-UI | Add A2A/MCP adapters behind the UI boundary [T07] |
| Run and introspect agent services with threads/runs/store APIs | LangChain Agent Protocol | Add platform-specific runtime and observability [T18] |
| Build a portable agent definition for many deployment targets | OSSA | Add MCP/A2A references and signed provenance [T02] [T33] |
| Discover agents across domains and verify trust | DUADP | Add signed OSSA manifests and revocation workflows [T01] [T35] |
| Explore decentralized network negotiation | ANP | Use cautiously; maturity is earlier than MCP/A2A [T05] |
