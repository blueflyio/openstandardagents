# Protocols and standards

Compiled on June 9, 2026.

## Comparative map

| Protocol | Primary scope | Main artifact/format | Maturity signal |
| --- | --- | --- | --- |
| MCP | Agent-to-tools/data/context | Client-server protocol; tools/resources/prompts | 35.5M npm weekly downloads for TypeScript SDK [S07] |
| A2A | Agent-to-agent task delegation | Agent Card, tasks, messages, artifacts | 150+ supporting organizations, 24,206 GitHub stars [S20][S32] |
| AG-UI | Agent-to-user-interface stream | Typed events over HTTP/SSE/WebSockets | 14,157 GitHub stars [S21][S32] |
| ANP | Agent network identity and communication | DID-based identity, meta-protocol, semantic app layer | 1,318 GitHub stars [S22][S32] |
| LangChain Agent Protocol | Framework-agnostic serving API | REST/OpenAPI runs, threads, store | Integrated with LangGraph tooling [S23] |
| ACP | Lightweight REST agent messaging | REST endpoints, async/sync/streaming tasks | Linux Foundation/BeeAI governance [S24] |
| ATP | Agent-generated code execution against tools | Sandboxed TypeScript/JavaScript runtime | 6,923 npm weekly downloads [S07][S25] |
| OSSA | Agent contract and portability | YAML manifest, schemas, exports | npm latest 0.5.6; 23+ targets on site [S02][S04] |
| DUADP | Decentralized agent discovery | GAID, WebFinger, DID, gossip, REST/MCP | npm latest 0.1.7; public mesh site [S01][S05] |

## Model Context Protocol (MCP)

Anthropic introduced MCP in November 2024 as an open standard for connecting AI
assistants to systems where data lives, including repositories, business tools,
and development environments [S17]. Its purpose is to replace fragmented custom
integrations with a single protocol for secure, two-way connections between
AI-powered tools and data sources [S17].

The architecture is client-server. Developers expose data and capabilities
through MCP servers, while AI applications act as MCP clients [S17][S18]. The
official docs describe MCP as an open-source standard for connecting AI
applications to external systems such as local files, databases, search engines,
calculators, and workflows [S18]. It standardizes resources, prompts, and tools
so clients can discover and call capabilities consistently [S18].

Adoption is broad. Anthropic listed Block, Apollo, Replit, Zed, Codeium, and
Sourcegraph as early adopters or integrators [S17]. The MCP docs list support
across Claude, ChatGPT, Visual Studio Code, Cursor, MCPJam, and other clients
[S18]. The npm API reported 35,499,180 downloads of `@modelcontextprotocol/sdk`
for the week ending June 2, 2026 [S07]. Security research also shows MCP has
become the predominant public tool standard: the UK AI Security Institute
tracked 177,436 MCP tools from November 2024 to February 2026 [S15].

MCP is not a complete agent governance layer. It standardizes tool access, but
identity, authorization, least privilege, trust, and revocation must be supplied
by gateways, manifests, signed metadata, and runtime policy [S35][S38].

## Agent2Agent (A2A)

Google announced Agent2Agent (A2A) as an open protocol for agents to discover
capabilities, exchange information, and coordinate actions across enterprise
platforms [S19]. A2A builds on HTTP, Server-Sent Events, and JSON-RPC, so it can
fit existing web stacks [S19]. Its core discovery artifact is the Agent Card, a
JSON document that advertises identity, capabilities, skills, endpoints, and
authentication requirements [S19][S20].

The protocol's execution model centers on tasks, messages, and artifacts. An
agent can send or stream a message, subscribe to task state, retrieve tasks, and
receive artifacts as outputs [S20]. A2A is intentionally opaque about internal
agent state: the remote agent advertises what it can do and exchanges task
state, but it does not expose its internal chain of thought or implementation
[S20].

A2A's adoption trajectory is one of the strongest among communication
protocols. Google's launch named more than 50 technology partners and service
providers [S19]. Google Cloud later reported 150+ supporting organizations and
v0.3 capabilities including gRPC support, signed security cards, and extended
client SDK support [S20]. The A2A GitHub repo had 24,206 stars and 2,453 forks
when queried on June 9, 2026 [S32].

## Agent User Interaction Protocol (AG-UI)

AG-UI standardizes communication between agent backends and user-facing
applications. Its docs describe an open, lightweight, event-based protocol for
connecting agents to frontends [S21]. AG-UI uses typed events for run lifecycle,
text message streaming, tool call streaming, state synchronization, activity
progress, and custom/raw events [S21].

AG-UI is transport-agnostic. The standard HTTP client can use HTTP SSE,
text-based streaming, or binary transport; the architecture also accommodates
WebSockets and webhooks [S21]. This makes AG-UI complementary to MCP and A2A:
MCP handles tools, A2A handles agent-to-agent delegation, and AG-UI streams the
agent run to the user interface [S21].

The GitHub repo had 14,157 stars on June 9, 2026 [S32]. AG-UI is still younger
than MCP and A2A, but it addresses a real production gap: without it, teams
often build ad hoc WebSocket or streaming protocols for every agent UI [S21].

## Agent Network Protocol (ANP)

ANP aims to become the "HTTP of the Agentic Web" [S22]. Its architecture has
three layers:

1. Identity and secure communication, based on W3C Decentralized Identifiers
   (DIDs), decentralized authentication, and end-to-end encrypted communication
   [S22].
2. A meta-protocol layer for negotiating communication protocols between agents
   [S22].
3. An application protocol layer based on semantic web specifications, allowing
   agents to describe capabilities and supported application protocols [S22].

ANP is more ambitious and network-native than A2A or ACP. A2A focuses on
task-level enterprise interoperability; ACP focuses on REST-native agent
messaging. ANP tries to define identity, negotiation, and semantic capability
description for a decentralized agent network [S22]. Its GitHub repo had 1,318
stars on June 9, 2026 [S32].

## LangChain Agent Protocol

LangChain Agent Protocol is a framework-agnostic REST/OpenAPI specification for
serving LLM agents in production [S23]. Its three central concepts are:

- Runs: APIs for executing an agent.
- Threads: APIs for organizing multi-turn state.
- Store: APIs for long-term memory [S23].

The protocol is useful when teams want tools, UIs, or platforms to call an
agent regardless of whether the implementation is LangGraph, CrewAI, LlamaIndex,
AutoGen, or custom code [S23]. LangGraph CLI and LangGraph Studio integrate with
the protocol, and LangGraph can wrap non-LangGraph agents as nodes [S23].

## Agent Communication Protocol (ACP)

ACP is a REST-native open protocol for interoperable agent communication,
developed around IBM Research and BeeAI under Linux Foundation governance
[S24]. It supports standardized REST endpoints, synchronous execution,
asynchronous long-running tasks, streaming with SSE, multimodal payloads, and
SDK-optional usage [S24].

ACP is positioned as simpler and more HTTP-native than protocols requiring
specialized transports. It is designed so agents built with BeeAI, LangChain,
CrewAI, custom code, or other frameworks can interoperate through a shared
communication interface [S24].

ACP should not be confused with the separate Agent Control Protocol in the
security literature. Agent Communication Protocol focuses on messaging and
interoperability [S24]. Agent Control Protocol focuses on admission control,
identity, delegation, capability scope, policy compliance, and auditability
before actions mutate state [S42].

## monday.com Agent Tool Protocol (ATP)

ATP is a code-first protocol for AI agents to interact with external systems by
generating and executing TypeScript/JavaScript in secure V8 sandboxes [S25].
Instead of only calling predefined functions, agents can write code that
parallelizes operations, filters and transforms data, chains operations, and
uses a runtime SDK [S25].

ATP's security model includes isolated V8 execution, memory/CPU/time limits,
OpenAPI and MCP aggregation, semantic search, approvals, logging, and provenance
tracking [S25]. The npm package `@mondaydotcomorg/atp-server` was at version
0.25.0 and had 6,923 downloads for the week ending June 2, 2026 [S07]. The
GitHub repo had 98 stars on June 9, 2026 [S32].

ATP is best understood as an execution/gateway protocol, not a general
agent-to-agent standard. Its thesis is that agents need a safe code execution
substrate for tool composition rather than ever-growing lists of narrow tool
calls [S25].

## OSSA and DUADP in the protocol stack

OSSA does not replace MCP, A2A, ANP, ACP, or AG-UI. It defines a portable
contract above them: what the agent is, which tools and protocols it needs, how
it is deployed, which compliance and trust metadata apply, how cost and HITL
controls are declared, and which platform artifacts can be exported [S02][S03].
The site describes OSSA as the missing contract layer that bridges MCP and A2A
to deployment platforms [S02].

DUADP fills a different gap: discovery. Its site says MCP connects agents to
tools, A2A connects agents to agents, and DUADP helps them find each other
[S01]. DUADP uses GAIDs as portable lookup handles, WebFinger to resolve
handles to endpoints, DIDs for cryptographic identity, signatures and
provenance for integrity, and Cedar policies/trust tiers for enforcement inputs
[S01]. It exposes REST endpoints and 17 MCP tools for discovery, search,
publishing, validation, federation, governance, and health [S01].

## Design guidance

- Use MCP first when the problem is tool/data access [S17][S18].
- Add A2A when different agents or vendors need to delegate tasks while keeping
  internal state opaque [S19][S20].
- Add AG-UI when a frontend needs standardized real-time state, messages, tool
  calls, and user collaboration [S21].
- Use ACP for lightweight REST-based intra-enterprise agent messaging when A2A's
  task lifecycle is unnecessary [S24].
- Consider ANP for decentralized agent-network experiments where DID identity
  and protocol negotiation are first-class requirements [S22].
- Use OSSA-style manifests to keep identity, compliance, lifecycle, cost,
  security, and platform exports consistent [S02][S03].
- Use DUADP-style discovery only with signed identity, revocation, federation
  witnesses, and policy enforcement [S01][S35].
