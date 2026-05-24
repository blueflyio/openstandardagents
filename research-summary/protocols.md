# Agent Protocols and Standards

Prepared on May 24, 2026.

## Comparative map

| Protocol | Primary scope | Message/discovery shape | Adoption status |
| --- | --- | --- | --- |
| MCP | Agent-to-tool/data | JSON-RPC; MCP clients and servers | Broad IDE/framework adoption; official SDKs [S03] |
| A2A | Agent-to-agent tasks | HTTP, SSE, JSON-RPC; Agent Cards | Google launch with 50+ partners; later sources report 150+ supporters [S04] [S20] |
| AG-UI | Agent-to-UI | Typed events over SSE/WebSocket/protobuf | CopilotKit, LangGraph, CrewAI, AgentCore integrations [S05] [S20] |
| Agent Protocol | Framework-neutral agent task API | OpenAPI REST tasks, steps, artifacts | Used by AutoGPT lineage; lower current GitHub activity [S06] [S34] |
| ANP | Agentic Web identity/communication | DID identity, E2EE, meta-protocol, semantic capability docs | Active open-source project; 1,302 GitHub stars [S07] [S34] |
| ACP | Lightweight agent messaging | REST/OpenAPI; sync, async, streaming | IBM BeeAI; now part of A2A under Linux Foundation [S08] |
| DUADP/UADP | Agent discovery/federation | DNS TXT, WebFinger, REST, MCP tools, gossip, DID/GAID | Bluefly/OSSA ecosystem; npm package and live node [S01] [S30] [S32] |
| OSSA | Agent contract/manifest | YAML/JSON Schema; export targets; signed manifests | npm package v0.5.1; local repo; public site [S02] [S28] [S31] |
| ATP | Code-first tool execution | JSON-RPC/protocol packages; sandboxed TypeScript/JavaScript | monday.com protocol; npm packages and GitHub repo [S09] [S33] |

## Model Context Protocol (MCP)

Anthropic introduced MCP on November 25, 2024 as an open standard for connecting
AI assistants to systems where data lives, including content repositories,
business tools, and development environments [S03]. Its core promise is to
replace fragmented custom integrations with a single protocol for secure,
two-way connections between MCP clients and MCP servers [S03].

MCP's architecture is deliberately simple: data/tool owners expose capabilities
through MCP servers, and AI applications connect as MCP clients. Anthropic
released the specification, SDKs, local Claude Desktop support, and a repository
of prebuilt servers for systems such as Google Drive, Slack, GitHub, Git,
Postgres, and Puppeteer [S03]. Early adopters named by Anthropic include Block
and Apollo, and development-tool companies such as Zed, Replit, Codeium, and
Sourcegraph were already integrating MCP [S03].

Security note: MCP's adoption makes it a major attack surface. Recent papers
identify tool poisoning, malicious server descriptors, installer spoofing,
unauthorized access, and rug-pull descriptor changes as protocol-specific risks
[S22]. MCP should be deployed behind identity-aware gateways, tool allowlists,
schema validation, per-tool metrics, and readiness checks [S20] [S23].

## Agent2Agent Protocol (A2A)

Google announced A2A on April 9, 2025 as an open protocol for agents to
collaborate across vendors, frameworks, and enterprise platforms [S04]. A2A is
explicitly complementary to MCP: MCP connects agents to tools and context, while
A2A lets agents communicate and coordinate with other agents [S04].

Design principles include agentic capability support, reuse of HTTP/SSE/JSON-RPC
standards, secure-by-default authentication and authorization, long-running task
support, and modality-agnostic content such as audio and video [S04]. The core
interaction is between a client agent and a remote agent. Remote agents publish
Agent Cards in JSON so clients can discover capabilities, authentication
requirements, endpoints, and skills [S04]. Work is organized around tasks,
messages, parts, and artifacts [S04].

Google's launch named more than 50 technology and services partners, including
Atlassian, Box, Cohere, Intuit, LangChain, MongoDB, PayPal, Salesforce, SAP,
ServiceNow, UKG, Workday, Accenture, BCG, Capgemini, Deloitte, KPMG, PwC, TCS,
and Wipro [S04]. Later production blogs report wider support and Linux
Foundation governance [S20].

## Agent User Interaction Protocol (AG-UI)

AG-UI standardizes the missing UI layer: how agents stream state, text, tool
calls, and progress to user-facing applications. CopilotKit describes AG-UI as
a lightweight, event-based standard for agent-to-UI communication over
Server-Sent Events [S05]. The `@ag-ui/client` package provides `HttpAgent`,
`AbstractAgent`, event processing, reactive state updates, middleware, and
subscriber hooks [S05] [S33].

The protocol uses standard event families such as lifecycle, text, tool calls,
state snapshots/deltas, activity, reasoning, and custom events [S05]. This makes
AG-UI especially useful for real-time chat, generative UI, tool-call
visualization, and human approval flows [S05] [S20].

## Agent Protocol

Agent Protocol is an OpenAPI-based REST specification for running and
introspecting agents regardless of framework, language, or platform [S06]. It
defines task and step endpoints, plus artifact upload/download and task
management. The basic workflow is: create a task, execute steps, monitor
progress, and retrieve results [S06].

Its original value proposition was evaluation and interoperability: common
endpoints make it easier to benchmark agents, build universal tools, and switch
between implementations [S06]. The public site names AutoGPT,
Auto-GPT-Forge, smol developer, babyagi, and beebot as implementations or
integrations [S06]. The GitHub repository currently has 593 stars, lower than
the newer protocol and framework projects tracked in this report [S34].

## Agent Network Protocol (ANP)

ANP aims to become "the HTTP of the Agentic Web era" [S07]. Its technical
whitepaper and README define a three-layer architecture:

| Layer | Function |
| --- | --- |
| Identity and secure communication | W3C DID-based decentralized identity, authentication, and end-to-end encrypted communication |
| Meta-protocol | Negotiation of communication protocols between agents |
| Application protocol | Semantic capability descriptions, supported protocols, agent description, and discovery |

ANP is agent-centric rather than model-centric. It wants agents from any
platform to authenticate each other without a centralized system, negotiate how
to communicate, and describe capabilities for efficient collaboration [S07].
The repository is Apache-2.0 and had 1,302 stars on May 24, 2026 [S34].

## Agent Communication Protocol (ACP)

IBM Research describes ACP as an open, HTTP-native, lightweight protocol for
communication between AI agents regardless of framework, language, or runtime
[S08]. Its REST design exposes well-defined endpoints for messages and
execution, supports synchronous, asynchronous, streaming, stateless, and
stateful modes, and is defined through OpenAPI [S08].

The most important status update is governance: IBM's page states that ACP is
now part of A2A under the Linux Foundation [S08]. This makes ACP less a direct
competitor to A2A and more a converging REST-friendly profile or predecessor
inside the wider A2A ecosystem.

## DUADP / UADP

DUADP fills the discovery gap: if MCP answers "what tools can this agent use"
and A2A answers "how do agents talk," DUADP answers "how does an agent find
other agents and verify them" [S01]. It uses GAIDs as stable lookup handles,
WebFinger and well-known endpoints for resolution, DIDs for cryptographic
identity, signatures for integrity, and trust tiers as policy inputs [S01].

The local UADP spec describes a conforming node as any implementation that
serves `/.well-known/uadp.json`, at least one skills or agents endpoint, JSON
payloads, and OSSA-formatted resources [S29]. It supports federation endpoints,
validation, trust tiers, and REST/AsyncAPI flows for registration, discovery,
verification, revocation, heartbeat, and trust invalidation [S29] [S30].

## OSSA

OSSA is a contract layer rather than a transport. It defines portable agent
manifests with identity, capabilities, compliance, security, lifecycle, trust,
deployment, and economics metadata [S02] [S28]. The public site positions OSSA
between MCP/A2A/ANP/ACP and deployment platforms such as LangChain, CrewAI,
Kubernetes, Docker, GitLab Duo, Claude Code, Cursor, Drupal, npm, and MCP/A2A
exports [S02].

In the repository, OSSA is described as "the infrastructure bridge between
agent protocols and deployment platforms" and "not a protocol (like MCP or A2A)
and not a framework (like LangChain or CrewAI)" [S28]. It consumes MCP, builds
on A2A, and adds deployment, packaging, signed manifests, Cedar policy metadata,
and trust tiers [S28].

## monday.com Agent Tool Protocol (ATP)

ATP is monday.com's code-first protocol for AI agents to interact with external
systems by generating and executing TypeScript/JavaScript in secure sandboxed
V8 environments [S09]. It differs from fixed tool calling by allowing agents to
write code that chains operations, filters and transforms data, runs multiple
operations in parallel, uses approvals, and interacts with APIs or MCP servers
[S09].

The `@mondaydotcomorg/atp-client` package is version 0.24.0 and the
`@mondaydotcomorg/atp-protocol` package is version 0.22.3 as of this research
pass [S33]. Security-relevant features include isolated execution, memory
limits, timeouts, provenance tracking, human approvals, and stateless execution
with optional caching [S09].

## Design implications

Use these protocols as layers, not as mutually exclusive choices:

1. Start with MCP for tool/data access.
2. Add AG-UI when a user-facing application needs streamed state and approval.
3. Add A2A or ACP when multiple independent agents must delegate tasks.
4. Add DUADP/ANP-style discovery and identity when agents must find and verify
   each other across domains.
5. Use OSSA-style manifests when the agent definition itself must be portable,
   signed, validated, governed, and exportable.
