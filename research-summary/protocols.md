# Agent Protocols and Standards

Compiled on May 19, 2026.

## Protocol comparison

| Standard | Primary scope | Format / transport | Discovery | Adoption status |
| --- | --- | --- | --- | --- |
| MCP | Agent to tools/data/context | JSON-RPC; stdio, Streamable HTTP, legacy SSE | Client lists server tools/resources/prompts | Broad support; npm SDK 1.29.0 has 36.0M weekly downloads [S03][S37] |
| A2A | Agent to agent task delegation | HTTP, SSE, JSON-RPC; gRPC added in v0.3 | Agent Cards | Google-launched; 150+ org support by July 2025 [S04][S05] |
| AG-UI | Agent to user interface | Event stream over HTTP SSE, WebSocket, webhooks, binary HTTP | Compatible clients/agents | SDK and framework integrations; `@ag-ui/client` 0.0.53 has 526.1K weekly downloads [S07][S35] |
| OSSA | Agent contract and export | YAML manifest, JSON Schema, CLI exports | DUADP, manifests, registries | npm `@bluefly/openstandardagents` 0.5.1; 23+ export targets [S01][S25] |
| DUADP | Agent/skill/tool discovery | DNS TXT, WebFinger, REST, MCP tools, gossip | GAID, `.well-known`, federation | npm `@bluefly/duadp` 0.1.4; live site indexes 36 resources [S02][S26] |
| ANP | Open agent network | DID, encrypted communication, meta-protocol, semantic app layer | P2P/DID/capability descriptions | GitHub 1,296 stars; v1.0 release May 2025 [S09][S24] |
| ACP | REST-native agent messaging | HTTP REST, MIME messages, SSE streaming | Online and offline agent manifests | Now part of A2A under Linux Foundation [S08] |
| LangChain Agent Protocol | Agent server API | OpenAPI for runs, threads, store | API endpoints | GitHub 588 stars; LangGraph Platform superset [S10][S24] |
| ATP | Code-first tool execution | TypeScript/JavaScript in sandbox; OpenAPI/MCP adapters | API search and type definitions | npm server 0.25.0 has 7.1K weekly downloads [S11][S36] |

## MCP: Model Context Protocol

Anthropic announced MCP on November 25, 2024 as an open standard for connecting
AI assistants to systems where data lives, including repositories, business
tools, databases, and development environments [S03]. The goal is to replace
fragmented custom integrations with a single protocol that lets developers
expose data through MCP servers or build MCP clients that connect to those
servers [S03].

MCP's core primitives are tools, resources, prompts, and client/server
capabilities such as sampling, elicitation, tasks, progress, cancellation, and
pagination [S37]. The TypeScript SDK supports stdio, Streamable HTTP for remote
servers, and legacy HTTP/SSE compatibility; version 1.29.0 was published March
30, 2026 and reports 36.0M weekly npm downloads [S37].

MCP's adoption signal is unusually strong for a young standard. Anthropic named
Block, Apollo, Zed, Replit, Codeium, and Sourcegraph as early adopters [S03].
By May 2026, MCP support is visible across developer tools and frameworks, and
OSSA uses MCP references as part of its manifest model [S01][S03].

## A2A: Agent2Agent protocol

Google announced A2A on April 9, 2025 as an open protocol that lets agents
built with different vendors or frameworks communicate, securely exchange
information, coordinate tasks, and operate across enterprise applications [S04].
A2A complements MCP: MCP connects an agent to tools and context, while A2A
connects agents to other agents [S04].

A2A has five stated design principles: embrace agentic capabilities, build on
existing standards, be secure by default, support long-running tasks, and remain
modality agnostic [S04]. It uses Agent Cards in JSON format for capability
discovery, task objects with lifecycles, artifacts as outputs, messages for
context and user instructions, and "parts" for multimodal content and UI
capability negotiation [S04].

Google's July 31, 2025 update reported A2A protocol v0.3, gRPC support, signed
security cards, extended Python SDK support, native support in Google's Agent
Development Kit, deployment paths through Agent Engine, Cloud Run, and GKE, and
an ecosystem of more than 150 organizations [S05].

## AG-UI: Agent-User Interaction protocol

AG-UI is an open, lightweight, event-based protocol for connecting AI agents to
user-facing applications [S07]. It covers the gap left by MCP and A2A: MCP
connects agents to tools, A2A connects agents to agents, and AG-UI connects
agents to user experiences [S07].

The protocol is client-server and transport-agnostic. Agents emit standardized
events, and clients process streams over HTTP SSE, WebSockets, webhooks, or
other transports [S07]. Its primary abstraction is `run(input:
RunAgentInput) -> Observable<BaseEvent)`, with event categories for lifecycle,
steps, text messages, tool calls, state snapshots and deltas, message
snapshots, raw events, and custom events [S07].

AG-UI focuses on features that product teams need in agentic interfaces:
streaming chat, state synchronization, tool visualization, frontend tool calls,
human-in-the-loop interrupts, sub-agent composition, agent steering, and
long-running tool output streaming [S07]. The `@ag-ui/client` npm package,
version 0.0.53, reports 526.1K weekly downloads and 117 dependents [S35].

## OSSA: Open Standard for Software Agents

OSSA is a contract layer, not a runtime protocol. Its homepage says: "MCP
connects tools. A2A connects agents. Neither defines the contract" [S01]. OSSA
answers what an agent is: identity, role, tools, autonomy, lifecycle,
governance, cost controls, compliance, observability, trust, and export
targets [S01][S25].

The npm package `@bluefly/openstandardagents` version 0.5.1 was published
March 28, 2026. It describes OSSA as an infrastructure bridge between agent
protocols and deployment platforms, with a YAML manifest format exported to
Docker, Kubernetes, LangChain, CrewAI, Claude Skills, OpenAI Agents SDK, GitLab
Duo, Cursor, Drupal, and other targets [S25].

OSSA's distinctive contribution is source-of-truth portability. A manifest can
reference MCP servers and A2A messaging, declare W3C DID-style identity,
signed manifests, Cedar policies, cost controls, human approvals, compliance
frameworks, SBOM/provenance pointers, and observability settings [S01][S25].

## DUADP: Decentralized Universal AI Discovery Protocol

DUADP is the discovery and federation companion to OSSA. It addresses the
question: if MCP connects tools and A2A connects agents, how do agents find
each other [S02]? DUADP's answer is DNS/WebFinger/DID-based discovery with
federated search and gossip.

DUADP uses GAIDs such as `agent://discover.duadp.org/agents/code-reviewer`,
resolves them through WebFinger and node manifests, verifies DID documents and
signatures, and turns trust tiers into policy inputs [S02]. The site describes
a 17-tool MCP interface for discovery, listing agents/skills/tools, search,
publishing, validation, federation, identity, governance, trust evaluation,
health, and metrics [S02].

The npm package `@bluefly/duadp` version 0.1.4 was published March 9, 2026.
It provides TypeScript types, a client, an Express server router, validation,
crypto signing and verification, DID resolution, and conformance testing. The
package reports 17 weekly downloads and an Apache-2.0 license [S26].

## ANP: Agent Network Protocol

ANP aims to become "the HTTP of the Agentic Web era" [S09]. It is an
open-source communication protocol for intelligent agents, focused on an open,
secure, efficient collaboration network for billions of agents [S09].

ANP has a three-layer architecture:

1. Identity and secure communication based on W3C DIDs and end-to-end
   encrypted communication.
2. A meta-protocol layer for negotiating communication protocols between
   agents.
3. An application protocol layer based on semantic web specifications for
   describing capabilities and supported protocols [S09].

ANP is closer to a decentralized internet architecture than to an enterprise
task API. Its current GitHub repository has 1,296 stars, Apache-2.0 licensing,
and a v1.0 release from May 19, 2025 [S09][S24].

## ACP: Agent Communication Protocol

IBM Research describes ACP as a lightweight, HTTP-native, SDK-optional standard
for agent communication across frameworks, languages, and runtime environments
[S08]. It supports REST endpoints, MIME-typed multimodal messages, asynchronous
communication by default, synchronous use cases, SSE streaming, and online or
offline metadata-based discovery [S08].

ACP is important historically because it represents a REST-first response to
agent fragmentation. It also now functions as part of the A2A ecosystem under
the Linux Foundation, which suggests convergence rather than permanent
competition between ACP and A2A [S08].

## LangChain Agent Protocol

LangChain's Agent Protocol is a framework-agnostic API specification for
serving LLM agents in production [S10]. It centers on three resources: runs for
executing agents, threads for organizing multi-turn executions, and store APIs
for long-term memory [S10].

LangGraph Platform implements a superset of the protocol, and LangGraph Studio
can connect to servers that implement it [S10]. The protocol is useful less as
a universal internet standard and more as an OpenAPI-style agent server API for
deployment, local debugging, and cross-framework wrapping.

## ATP: Agent Tool Protocol

Monday.com's ATP takes a different view of tool use: agents should write and
execute code in a secure sandbox, not only call predefined tools [S11]. ATP
argues that MCP-like function calling can suffer from context bloat,
sequential execution, and poor inline data processing. ATP instead lets an
agent generate TypeScript/JavaScript that filters, maps, reduces, calls APIs in
parallel, and invokes sub-LLM calls under runtime controls [S11].

ATP includes sandboxed execution, memory limits, timeouts, API aggregation,
OpenAPI and MCP adapters, semantic search, pause/resume, approvals, audit logs,
OpenTelemetry, and provenance tracking against prompt injection and data
exfiltration [S11][S36]. The npm package `@mondaydotcomorg/atp-server` version
0.25.0 was published May 5, 2026 and reports 7.1K weekly downloads [S36].

ATP should be treated as an emerging, code-first tool-execution alternative
rather than a direct substitute for A2A. It may fit high-volume data
processing and API composition, but it requires strong sandbox and policy
engineering.

## Common design themes

- Discovery is moving from static registries to well-known endpoints, Agent
  Cards, DNS/WebFinger, manifests, semantic descriptions, and DID-backed
  identity [S02][S04][S09].
- Message formats remain pragmatic: JSON-RPC, REST/HTTP, SSE, JSON, JSON
  Schema, YAML manifests, and TypeScript types dominate [S03][S04][S07][S08].
- Security is increasingly identity-first: OAuth, mTLS, scoped credentials,
  DIDs, signatures, signed cards, trust tiers, and audit logs are recurring
  primitives [S04][S05][S09][S20][S28].
- The likely future is a stack, not one universal protocol. MCP, A2A, AG-UI,
  OSSA, DUADP, ANP, ACP, Agent Protocol, and ATP solve different parts of the
  system.
