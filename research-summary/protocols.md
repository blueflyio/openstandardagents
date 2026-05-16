# Protocols and Standards

Current date used for relative-date normalization: May 16, 2026.

## Comparative map

| Protocol | Main scope | Format/transport | Discovery | Security posture | Status |
| --- | --- | --- | --- | --- | --- |
| MCP | Agent to tools/context | JSON-RPC 2.0 over stdio or Streamable HTTP | Server registration by client/app | Consent, tool safety, OAuth guidance, host controls | High adoption [PROTO-01] |
| A2A | Agent to agent tasks | Proto data model; JSON-RPC, gRPC, HTTP/REST; SSE | Agent Card | Enterprise auth schemes, scoped task access | Linux Foundation, v1.0 [PROTO-02] |
| AG-UI | Agent to frontend/user | Event protocol over HTTP/WebSocket/SSE | App integration | App-layer auth, interrupt/HITL support | Growing UI ecosystem [PROTO-03] |
| ANP | Agentic web network | JSON-LD, DID:WBA, WebSocket drafts | `.well-known/agent-descriptions` | DID, E2EE drafts, JWT, signatures | Early/draft [PROTO-04] |
| Agent Protocol | Agent serving API | OpenAPI 3.1; REST; SSE; WebSocket | Agent introspection endpoints | Mostly deployment-defined | Early, LangGraph-aligned [PROTO-05] |
| ACP | Lightweight agent messaging | OpenAPI REST; JSON; SSE | Agent manifests/endpoints | TLS/IAM/reverse proxy; auth external | Folded into A2A [PROTO-06] |
| ATP | Agent code execution over tools | TypeScript/JS sandbox against OpenAPI/MCP/custom APIs | Runtime search/explore | V8 sandbox, API annotations, approvals | Early public beta path [PROTO-07] |
| DUADP | Discovery, registry, federation | HTTP/REST JSON, DNS TXT, WebFinger, MCP tools | Well-known DUADP, GAID, federation | DID, Ed25519, trust tiers, Cedar, revocation | Early npm v0.1.4 [PROTO-08] |
| OSSA | Portable agent contract | YAML/JSON manifest, JSON Schema, CLI, SDK, MCP server | Manifests, exports, DUADP integration | GAID/DID, signatures, SBOM, Cedar, HITL | npm v0.5.1 [PROTO-09] |

## MCP: Model Context Protocol

Anthropic introduced MCP on November 25, 2024 as an open standard for connecting
AI assistants to data sources, tools, content repositories, and development
environments [PROTO-01]. The official spec defines hosts, clients, and servers.
Servers expose resources, prompts, and tools; clients may expose sampling,
roots, and elicitation [PROTO-01].

MCP uses JSON-RPC 2.0 messages and stateful connections with capability
negotiation [PROTO-01]. It is inspired by the Language Server Protocol:
standardize how context and tools are exposed so each host does not need custom
connectors [PROTO-01]. The primary security model is implemented by hosts:
explicit user consent, control over data sharing, caution with arbitrary tool
execution, approval for sampling, and documented security implications
[PROTO-01].

MCP is the most broadly adopted agent protocol in this research. Anthropic named
early adopters including Block, Apollo, Zed, Replit, Codeium, and Sourcegraph in
the launch announcement [PROTO-01]. Many frameworks and platforms now treat MCP
as the default way to expose tools.

## A2A: Agent2Agent

Google announced A2A on April 9, 2025 with more than 50 technology and services
partners [PROTO-02]. The protocol is designed so independent agents can discover
capabilities, negotiate modalities, manage tasks, exchange messages, and
collaborate without sharing internal memory, tools, or plans [PROTO-02].

The released specification is layered:

1. Data model: Task, Message, AgentCard, Part, Artifact, Extension.
2. Operations: send message, stream message, get/list/cancel task, subscribe,
   push notifications, extended agent card.
3. Protocol bindings: JSON-RPC, gRPC, HTTP/REST, and custom bindings [PROTO-02].

A2A's Agent Card is a JSON metadata document describing identity, endpoint,
skills, modalities, and authentication requirements [PROTO-02]. Security is
based on standard enterprise web practices: authentication schemes, scoped task
access, extended authenticated cards, task authorization, tracing, and monitoring
[PROTO-02]. The project moved into Linux Foundation governance in 2025, and the
latest source researched here reports v1.0.0 [PROTO-02].

## AG-UI: Agent User Interaction

AG-UI standardizes the event stream between agentic backends and user-facing
applications [PROTO-03]. It exists because agentic applications are long-running,
nondeterministic, stateful, multimodal, and interactive in ways that traditional
REST/GraphQL request-response APIs do not handle well [PROTO-03].

The protocol includes lifecycle, text, tool-call, state, activity, reasoning,
custom, and interrupt events [PROTO-03]. It supports streaming chat, shared
state, generative UI, frontend tool calls, backend tool rendering, human-in-the
loop interrupts, sub-agent composition, steering, and tool-output streaming
[PROTO-03]. It is complementary to MCP and A2A: MCP connects tools, A2A connects
agents, and AG-UI connects agents to users [PROTO-03].

Security is mostly application-layer, but the protocol design is helpful for
governance because it makes approvals, interrupts, state diffs, and visible
agent activity first-class UI events [PROTO-03].

## ANP: Agent Network Protocol

ANP aims to define an open, secure, efficient collaboration network for billions
of intelligent agents [PROTO-04]. Its architecture is more decentralized than
MCP or A2A: identity and secure communication use W3C DID concepts, a
meta-protocol negotiation layer lets agents agree on application protocols, and
an application layer describes capabilities and interactions [PROTO-04].

ANP is security-forward but draft-heavy. The researched sources describe
DID-based identity, HTTPS, nonces, timestamps, signatures, JWT access tokens,
short-term key exchange, AES-GCM, and DNS-over-HTTPS recommendations [PROTO-04].
It is strategically important as a model of "agentic web" infrastructure, but it
is less mature than MCP and A2A.

## LangChain Agent Protocol

LangChain Agent Protocol codifies a framework-agnostic API for running,
managing, and introspecting agents [PROTO-05]. Its core resources are runs,
threads, store/long-term memory, and agent introspection. It uses OpenAPI 3.1,
REST/HTTP JSON, SSE streaming, and WebSocket thread streams [PROTO-05].

Its strongest fit is serving agents in production, especially with LangGraph
Platform. It is not a broad identity or security standard; auth and deployment
hardening are primarily outside the core protocol [PROTO-05].

## ACP: Agent Communication Protocol

ACP is a RESTful protocol for connecting agents, applications, and humans across
frameworks [PROTO-06]. It supports multimodal messages, synchronous and
asynchronous communication, streaming, stateful/stateless patterns, offline and
online discovery, and long-running tasks [PROTO-06].

The official docs now state ACP is part of A2A under the Linux Foundation and
provide migration guidance [PROTO-06]. ACP remains important because it shows a
simple HTTP path for teams that do not need the full A2A stack or specialized
SDKs [PROTO-06].

## monday.com ATP: Agent Tool Protocol

Agent Tool Protocol argues that agents should write and execute code against
safe APIs rather than call long lists of pre-defined tools [PROTO-07]. ATP
aggregates OpenAPI, MCP, and custom APIs, lets agents search for relevant
capabilities at runtime, and runs generated TypeScript/JavaScript in a sandbox
[PROTO-07].

The security model is the main differentiator: isolated V8 execution, no file,
network, environment-variable, or process access by default; endpoint
annotations for destructive/sensitive/safe operations; blacklists and
allowlists; human approvals; audit logs; and rate limits [PROTO-07]. ATP is
early, but it usefully reframes MCP's tool-list context problem and the risk of
community stdio servers.

## DUADP: Decentralized Universal AI Discovery Protocol

DUADP is "DNS for AI agents" in the Bluefly/OSSA ecosystem [BF-03]. It addresses
the discovery gap: MCP helps agents use tools, A2A helps agents communicate, but
neither tells agents how to find each other across the open web [BF-03].

DUADP nodes advertise via DNS TXT records and well-known endpoints; clients can
resolve resources with WebFinger; nodes federate registrations by gossip; and
agent records use GAID/DID identifiers with signatures, provenance, trust tiers,
and policy inputs [BF-03] [BF-04]. The live docs describe 17 MCP tools for
discovery, search, publishing, validation, federation, governance, identity, and
health [BF-03]. The npm package `@bluefly/duadp` v0.1.4 is the TypeScript SDK
and server router, with 15 core HTTP endpoints, Express support, validation,
Ed25519 signing, DID resolution, and conformance testing [NPM-02].

DUADP is early-stage. npm reported 55 weekly downloads on the package page and
23 downloads for May 9-15, 2026 via the npm downloads API [NPM-02] [NPM-04].
The important architectural insight is that discovery should carry evidence:
identity, signatures, federation witnesses, revocation state, provenance, and
policy decisions [BF-03].

## OSSA: Open Standard for Software Agents

OSSA is not a transport protocol. It is the agent contract layer [BF-01]. It
defines an agent in YAML/JSON: identity, capabilities, LLM configuration, tools,
autonomy, team/subagent topology, observability, compliance, cost controls,
human-in-the-loop, trust boundaries, and platform extensions [BF-01] [BF-02].

The problem OSSA targets is the agent configuration MxN problem. Each framework
and deployment platform has its own schema; OSSA provides one validated manifest
and exports to many targets [BF-01] [NPM-01]. The package
`@bluefly/openstandardagents` v0.5.1 is Apache-2.0, includes the CLI, schemas,
SDK, MCP server, exporters, and validation services, and describes OSSA as an
infrastructure bridge between MCP/A2A and deployment platforms [NPM-01].

OSSA's security posture is stronger than many transport specs because the
manifest can carry GAID/DID identity, cryptographic signatures, Cedar policies,
SBOM/provenance pointers, NIST mappings, observability, cost controls, and
approval workflows [BF-05] [NPM-01]. It is also early: npm showed 90 weekly
downloads on the package page and 63 downloads for May 9-15, 2026 via npm's
downloads API [NPM-01] [NPM-03].

## Choosing protocols

- Use MCP when an agent needs standardized access to tools, APIs, files,
  databases, prompts, or resources.
- Use A2A when one agent needs to delegate or collaborate with another agent,
  especially across vendors or organizations.
- Use ACP when a simple RESTful agent interface is enough or when migrating
  toward A2A incrementally.
- Use AG-UI when user-facing state, streaming, approvals, tool visualization, or
  agent steering matter.
- Use DUADP or ANP when discovery, decentralized identity, federation, or
  agentic-web routing are part of the problem.
- Use OSSA when a portable, validated, auditable agent definition is needed
  across frameworks and deployment targets.
