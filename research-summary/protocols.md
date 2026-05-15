# Protocols and Open Standards

Prepared: May 15, 2026. Tether citation IDs are defined in
`reading-list.md`.

## Layered protocol map

| Layer | Protocols | Primary question |
| --- | --- | --- |
| Tool/context | MCP | What tools, data, and prompts can an agent use? |
| Agent-to-agent | A2A, ACP | How do agents discover, delegate, and complete tasks together? |
| Agent-to-UI | AG-UI | How do agents stream runs, state, tool calls, and human interrupts to UIs? |
| Network/discovery | DUADP, ANP | How do agents find each other and verify identity/trust? |
| Serving/contract | LangChain Agent Protocol, OSSA | How are agents served, managed, introspected, and governed? |
| Execution/tooling | Agent Tool Protocol | How can agents safely execute generated code against APIs? |

## Comparative table

| Protocol | Purpose | Message/transport | Core primitives | Adoption status |
| --- | --- | --- | --- | --- |
| MCP | Agent/tool and context integration | JSON-RPC 2.0 over stateful connections | Hosts, clients, servers; resources, prompts, tools; sampling, roots, elicitation | Anthropic-origin open standard with SDKs and broad IDE/tool adoption [T05][T06] |
| A2A | Agent-to-agent collaboration | HTTP, JSON-RPC, SSE, gRPC/REST bindings; protobuf data model | Agent Card, Task, Message, Part, Artifact, Extension | Google launch named 50+ partners; latest spec is 1.0.0 [T07][T08] |
| AG-UI | Agent-to-front-end interaction | Streaming JSON events over HTTP or optional binary channel | Run lifecycle, text, tool-call, state, activity, custom, reasoning events | CopilotKit-led open protocol with TS/Python SDKs [T09][T10] |
| ACP | REST-native agent messaging | REST/OpenAPI; multimodal message parts | Agent Manifest, Run, Message, MessagePart, Await, Sessions | Merging into A2A under LF AI & Data [T13][T31] |
| ANP | Agentic web networking | DID-based identity and semantic protocol layers | Identity/secure communication, meta-protocol negotiation, application protocols | Open-source project; vision is "HTTP of the Agentic Web era" [T11] |
| LangChain Agent Protocol | Framework-agnostic serving API | HTTP/OpenAPI; SSE for streaming | Runs, Threads, Store | LangGraph Studio/Platform interop surface [T12] |
| DUADP | Federated discovery of agents/skills/tools | DNS TXT, WebFinger, REST, gossip, MCP tools | GAID, DID identity, publish/search/validate/federation/governance endpoints | Live reference node and npm SDK [T20][T21][T53] |
| OSSA | Portable agent contract | YAML/JSON manifest + JSON Schema; CLI/exporters/MCP server | Identity, capabilities, lifecycle, security, trust, compliance, extensions | npm package, spec site, 23+ export targets claimed by site [T22][T23][T52] |
| Agent Tool Protocol | Code execution and API aggregation for agents | Client/server code execution against registered APIs | V8 sandbox, OpenAPI/MCP/custom APIs, provenance, pause/resume, approvals | Monday.com-origin public beta/protocol site and npm package [T32][T33] |

## MCP: Model Context Protocol

Anthropic introduced MCP on November 25, 2024 as an open standard for connecting
AI assistants to systems where data lives, replacing fragmented one-off
integrations [T05]. The architecture has AI applications acting as MCP hosts,
connectors as clients, and services exposing data/capabilities as servers
[T06].

Core protocol details:

- JSON-RPC 2.0 message format.
- Stateful connections with client/server capability negotiation.
- Server features: resources, prompts, tools.
- Client features: sampling, roots, elicitation.
- Utilities: configuration, progress, cancellation, error reporting, logging.
- Trust principles: explicit user consent, user control over data sharing,
  caution around arbitrary tool execution, and approval for LLM sampling [T06].

MCP is strong where agents need standardized tool and data access. It is not by
itself an agent identity, governance, or lifecycle contract; that is where OSSA,
DUADP, gateways, and policy engines may complement it [T22][T27].

## A2A: Agent2Agent Protocol

Google launched A2A on April 9, 2025 to let agents collaborate across vendors,
frameworks, and enterprise systems [T07]. The launch emphasized five design
principles: embrace agentic capabilities, build on existing standards, be secure
by default, support long-running tasks, and remain modality-agnostic [T07].

The latest A2A specification is version 1.0.0 and is structured in three layers
[T08]:

1. Data model: Task, Message, AgentCard, Part, Artifact, Extension.
2. Operations: Send Message, Stream Message, Get/List/Cancel Task, Get Agent
   Card, push notifications, extended cards.
3. Bindings: JSON-RPC, gRPC, HTTP/REST, and future custom bindings.

A2A's Agent Card is a JSON metadata document that describes identity,
capabilities, skills, service endpoints, and authentication requirements [T08].
The practical scope is task-oriented collaboration without requiring agents to
share internal memory, tools, or reasoning traces [T08].

## AG-UI: Agent User Interaction Protocol

CopilotKit announced AG-UI on May 12, 2025 as a bridge between agent backends
and real-world applications [T09]. AG-UI streams a JSON event sequence over
standard HTTP or an optional binary channel. Events cover messages, tool calls,
state patches, lifecycle signals, and human collaboration flows [T09].

The event specification groups events by function [T10]:

- lifecycle: `RunStarted`, `RunFinished`, `RunError`, step events
- text streaming: start/content/end chunk patterns
- tool calls: `ToolCallStart`, argument chunks, end, result
- state: snapshot/delta with JSON Patch (RFC 6902)
- activity: structured progress snapshots and patches
- special/custom/raw events
- reasoning events with privacy-aware encrypted values

AG-UI matters when agents are not purely background automations. It standardizes
the shared workspace between humans and agents, including state synchronization,
tool visibility, cancellation, and interrupts [T09][T10].

## ACP: Agent Communication Protocol

ACP is an open REST/OpenAPI protocol for agent interoperability. It supports
multimodal messages, synchronous/asynchronous operation, streaming, stateful and
stateless modes, discovery, and long-running tasks [T31].

ACP's own docs and README now state that it is part of A2A under the Linux
Foundation [T31][T34]. LF AI & Data's August 29, 2025 announcement says active
ACP development is winding down and its technology/expertise are moving into
A2A [T13].

ACP remains important historically because it contributed a simple REST-native
model: Agent Manifest, Run, Message, MessagePart, Await, and Sessions [T34].

## ANP: Agent Network Protocol

ANP's README states its goal directly: "ANP aims to become the HTTP of the
Agentic Web era" [T11]. It is not just a message API; it is a layered network
vision for open, secure, efficient collaboration among billions of agents [T11].

ANP's three-layer architecture:

1. Identity and secure communication based on W3C DID.
2. Meta-protocol negotiation so agents can agree how to communicate.
3. Application protocol layer for semantic capability description and protocol
   management [T11].

ANP overlaps with A2A/ACP in inter-agent communication, but emphasizes
decentralized identity, encrypted communication, semantic web descriptions, and
self-organizing networks [T11].

## LangChain Agent Protocol

LangChain's Agent Protocol is a framework-agnostic interface for serving LLM
agents in production [T12]. Its core concepts are:

- Runs: APIs for executing agents.
- Threads: APIs for multi-turn executions and persistent state.
- Store: APIs for long-term memory [T12].

LangGraph Studio can connect to servers that implement the protocol, and
LangGraph Platform can deploy agents from other frameworks by wrapping them in a
LangGraph node [T12]. This makes the protocol useful as a serving and debugging
surface, not a full agent network standard.

## DUADP: Decentralized Universal AI Discovery Protocol

DUADP fills a discovery gap. Its homepage states: "MCP connects tools. A2A
connects agents. But how do agents find each other? There is no DNS for AI.
DUADP is that missing layer" [T20].

DUADP layers:

- DNS TXT and `.well-known` discovery.
- WebFinger resolution of GAIDs.
- Gossip federation between nodes.
- DID-based identity, currently emphasizing `did:web`.
- Signatures, provenance, SBOM/build metadata, and trust tiers as policy inputs
  [T20][T21].

The docs expose REST endpoints for discovery, search, publish, validation,
federation, identity/governance, health, and metrics [T21]. The homepage also
lists 17 MCP tools that mirror the protocol surface, enabling MCP-compatible
agents to discover, search, publish, validate, and federate [T20].

## OSSA: Open Standard for Software Agents

OSSA is a manifest specification and toolchain. The homepage defines it as a
contract layer between protocol transports and application logic [T22]. The
specification page describes a YAML/JSON agent manifest that covers identity,
capabilities, trust boundaries, and governance before the agent runs [T23].

Core concepts:

- `apiVersion`, `kind`, `metadata`, `spec`.
- Agent identity, LLM configuration, tools, lifecycle, state, cost controls,
  human-in-the-loop, compliance, trust, and platform extensions [T22][T23].
- Export targets and adapters for platforms/frameworks, including MCP, A2A,
  LangChain, CrewAI, Docker, Kubernetes, GitLab, Claude Code, Cursor, Drupal,
  and npm [T22].
- An MCP server with tools such as `ossa_validate`, `ossa_scaffold`,
  `ossa_convert`, `ossa_generate`, `ossa_publish`, `ossa_diff`, and
  `ossa_migrate` [T22].

Security positioning:

- GAID / DID-style identity.
- Cedar policy integration for pre-execution authorization.
- Cryptographic manifest signatures.
- SBOM/provenance references.
- NIST SP 800-53 control mappings on the OSSA + NIST page [T24].

## Agent Tool Protocol

Agent Tool Protocol (ATP) argues that many agent tasks should be solved by
agent-generated code running in a sandbox rather than by long chains of coarse
tool calls [T32]. It registers OpenAPI, custom APIs, MCP connectors, and client
tools, then lets agents execute TypeScript/JavaScript inside isolated V8
sandboxes with approval, provenance, and policy controls [T32][T33].

ATP is not a general agent-to-agent protocol. It is an execution and API
aggregation protocol aimed at reducing context bloat, enabling code composition,
and making destructive/sensitive operations explicit [T32][T33].

## Design takeaways

1. Protocols should be selected by layer, not by popularity. MCP and A2A are
   complementary, and AG-UI solves a different problem entirely [T05][T07][T09].
2. Discovery and identity are still under-standardized. DUADP and ANP are early
   attempts to fill that gap, with different emphasis on federation and
   decentralized identity [T11][T20].
3. Contract metadata is becoming a separate concern. OSSA's claim is that
   transports do not define who an agent is, what it may do, or who is
   accountable [T22][T23].
4. Security cannot be assumed from transport. MCP and A2A can carry auth hooks,
   but identity-aware enforcement, scoped credentials, logs, and policy gates
   must be implemented in the surrounding system [T06][T08][T14][T19].
