# Agent protocols and standards

_Last updated: June 8, 2026._

## Protocol comparison

| Protocol | Primary scope | Main artifact/message | Transport/style | Adoption signal |
|---|---|---|---|---|
| MCP | Agent-to-tool/data | Servers expose prompts, resources, tools; clients connect | JSON-RPC client/server | Anthropic origin; Block, Apollo, Replit, Sourcegraph, Codeium noted as adopters/implementers. [S13] |
| A2A | Agent-to-agent | Agent Card, task/message objects | JSON-RPC 2.0 over HTTP(S), SSE, push | Google origin; 50+ launch partners; reports of 150+ organizations by April 2026. [S14] [S15] |
| AG-UI | Agent-to-user UI | Typed event stream | HTTP, SSE, WebSockets, webhooks | ag-ui-protocol repo has 14,128 stars on June 8, 2026. [S16] [S37] |
| ANP | Agentic web networking | DID/auth layer, meta-protocol, agent description/discovery | DID + semantic web + web infrastructure | GitHub repo has 1,317 stars; active push on June 8, 2026. [S17] [S37] |
| LangChain Agent Protocol | Production agent API | Runs, threads, store | REST/OpenAPI | langchain-ai/agent-protocol has 604 stars and release 0.0.16 on May 28, 2026. [S18] [S37] |
| ACP | Lightweight agent communication | Multimodal messages, sessions | REST, SSE, async-first | i-am-bee/acp has 1,011 stars; v1.0.3 in 2025; IBM/BeeAI/Linux Foundation messaging. [S19] [S37] |
| ATP | Code-first tool access | Sandboxed TypeScript/JavaScript execution plus API search | ATP server API, sandbox runtime | @mondaydotcomorg/atp-server has 6.9K weekly npm downloads; GitHub repo has 98 stars. [S20] [S37] |
| OSSA | Agent contract/deployment | YAML/JSON manifest, schema, policy metadata | Package/spec/CLI/MCP tools | openstandardagents.org reports v0.5.6, 23+ export targets; npm latest 0.5.6. [S02] [S06] |
| DUADP/UADP | Agent discovery/federation | .well-known manifest, WebFinger, GAID/DID, registry APIs | HTTP endpoints, DNS TXT, gossip | duadp.org reports 36 indexed resources and 17 MCP tools; npm latest 0.1.7. [S01] [S07] |

## Model Context Protocol (MCP)

Anthropic introduced MCP in November 2024 as an open standard for connecting AI assistants to content repositories, business tools, development environments, and other systems where data lives. The announcement frames MCP as a replacement for fragmented custom integrations with one universal protocol. It uses an architecture where developers expose data through MCP servers or build MCP clients that connect to those servers. [S13]

MCP's core primitives are prompts, resources, and tools exposed by servers, with clients supporting roots and sampling according to secondary technical summaries. Its security value is standardization; its security risk is that tool descriptions and outputs become model context. MCP threat research identifies naming attacks, tool poisoning, description manipulation, and other trust-boundary failures, so MCP needs signing, validation, sandboxing, and policy enforcement around it. [S13] [S31] [S32]

## Agent2Agent Protocol (A2A)

Google announced A2A in April 2025 as an open protocol for agents to communicate, securely exchange information, coordinate actions, and work across enterprise platforms. It complements MCP: MCP gives agents tools/context, while A2A lets agents discover and delegate to other agents. [S14]

A2A uses Agent Cards in JSON to advertise capabilities, endpoints, modalities, and authentication requirements. The open-source A2A project describes standardized JSON-RPC 2.0 over HTTP(S), synchronous request/response, streaming via SSE, asynchronous push notifications, rich data exchange, and enterprise-ready security/observability goals. [S15]

## AG-UI

AG-UI standardizes the agent-to-user interaction layer. Its documentation describes an open, lightweight, event-based, bidirectional protocol between user-facing applications and any agentic backend. It standardizes agent state, UI intents, user interactions, lifecycle events, text events, tool events, and state updates over ordinary web transports such as HTTP, SSE, WebSockets, or webhooks. [S16]

AG-UI is especially relevant when agents become embedded in product UIs instead of standalone chatbots. It lets frontend teams consume typed streams without needing to know each agent runtime's internal state model. [S16]

## Agent Network Protocol (ANP)

ANP aims to become "the HTTP of the Agentic Web era." Its three-layer architecture includes: an identity and secure communication layer based on W3C DIDs, a meta-protocol layer for negotiating communication protocols, and an application protocol layer for capability description and discovery. [S17]

ANP is more ambitious than A2A-style task exchange. It treats the agentic web as a self-organizing network in which identity, negotiation, semantic descriptions, and application protocols evolve together. That ambition increases interoperability potential but also raises maturity and governance questions. [S17]

## LangChain Agent Protocol

LangChain Agent Protocol codifies framework-agnostic APIs for serving LLM agents in production. Its README and blog center the protocol on runs for execution, threads for multi-turn sessions, and store endpoints for long-term memory. It can be implemented by LangGraph or other frameworks, allowing tooling such as LangGraph Studio to connect to compatible servers. [S18]

This protocol is less about public agent identity and more about operational management: start a run, stream output, inspect status, manage a thread, and search/update memory. [S18]

## Agent Communication Protocol (ACP)

IBM Research describes ACP as an open standard for communication between AI agents regardless of framework, programming language, or runtime. It is lightweight, HTTP-native, REST-based, SDK-optional, async-first, and supports streaming via SSE. The ACP documentation includes synchronous/asynchronous communication, stateful/stateless patterns, online/offline discovery, long-running tasks, and multimodal messages. [S19]

ACP overlaps with A2A, but its design center is simple REST interoperability and minimal setup, while A2A emphasizes enterprise agent discovery and task coordination via Agent Cards and JSON-RPC. [S19] [S15]

## Monday.com Agent Tool Protocol (ATP)

ATP is a code-first alternative to traditional tool calling. Monday's repository describes a production-ready protocol for agents to interact with external systems by generating and executing TypeScript/JavaScript in isolated V8 sandboxes with memory limits and timeouts. It includes API aggregation, hybrid/semantic API search, MCP and OpenAPI compatibility, provenance tracking, human approvals, caching, logging, progress, and OpenTelemetry. [S20]

ATP's critique is that MCP list_tools happens before the agent has fully reasoned about the task, which can overload context or require premature tool filtering. ATP instead uses on-demand API search and sandboxed code execution so agents can compose parallel operations and transformations. [S20]

## OSSA as contract layer

OSSA is not another agent-to-agent or agent-to-tool protocol. The local README explicitly states that OSSA is not a protocol like MCP/A2A and not a framework like LangChain/CrewAI; it is the middle layer that translates agent definitions into platform-specific deployments. It provides a manifest format analogous to OpenAPI for REST APIs and exports to Docker, Kubernetes, LangChain, CrewAI, Claude Skills, GitLab Duo, and other platforms. [S03]

Openstandardagents.org positions OSSA as the contract that says how to deploy, govern, and move agents between platforms. It includes identity, capabilities, compliance, lifecycle, security, trust, cost controls, human-in-the-loop, state management, mesh networking, Drupal integration, and an MCP server for validation/scaffold/convert/inspect/generate/publish/list/workspace/diff/migrate actions. [S02]

## DUADP/UADP as discovery layer

DUADP's site describes federated discovery through DNS TXT, WebFinger, and gossip, with DID identity and OSSA-native validation. It uses GAID handles such as `agent://discover.duadp.org/agents/code-reviewer`, resolves through WebFinger and node manifests, verifies DID documents and Ed25519 signatures, and converts trust tier into policy input. [S01]

The local UADP draft spec defines conformance around `GET /.well-known/uadp.json`, at least one of `/uadp/v1/skills` or `/uadp/v1/agents`, JSON content types, and OSSA-formatted payloads. Later local UADP v0.4 docs define registry register/heartbeat/revoke/discovery/trust endpoints, event streams, and trust tiers from `official` through `experimental`. [S04] [S05]

## Design pattern

A production stack can reasonably use all these without treating them as competitors: OSSA defines the agent contract, DUADP publishes/discovers it, MCP exposes tools, A2A/ACP/ANP coordinate peers, Agent Protocol manages run/thread/store APIs, AG-UI streams UI state, and a framework runtime executes workflow logic. [S01] [S02] [S13] [S14] [S16] [S17] [S18] [S19]
