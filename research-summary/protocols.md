# Protocols, Standards, and Interoperability

Prepared on June 1, 2026.

## Comparative overview

| Protocol / standard | Scope | Core artifact | Transport / format | Adoption status |
| --- | --- | --- | --- | --- |
| MCP | Agent-to-tool/data/context | Server capabilities, tools, resources | JSON-RPC over stdio, SSE, streamable HTTP | Widely adopted; official SDKs and many servers [S19][S20]. |
| A2A | Agent-to-agent task exchange | Agent Card, task, message, artifact | HTTP, SSE, JSON-RPC, webhooks | Google-originated; donated to Linux Foundation; broad enterprise partner ecosystem [S21][S22]. |
| AG-UI | Agent-to-user interface | Typed event stream | HTTP, WebSockets, SSE, webhooks | Rapidly growing; TypeScript repo with 13,949 stars on June 1, 2026 [S23][S24]. |
| OSSA | Agent contract/deployment | YAML/JSON manifest | JSON Schema, CLI, SDK, MCP server | npm v0.5.1; Apache-2.0; contract layer for exports and governance [S02][S03][S04]. |
| DUADP | Discovery and trust routing | DUADP node manifest, GAID, DID, registry resources | DNS TXT, WebFinger, REST, MCP tools, gossip | npm v0.1.4; 17 MCP tools; federated discovery design [S01][S05]. |
| ANP | Agentic-web communication | DID-based identity, meta-protocol, app protocol | W3C DID, semantic web, encrypted communication | Open-source protocol; 1,310 GitHub stars on June 1, 2026 [S25][S26]. |
| LangChain Agent Protocol | Framework-agnostic agent serving API | Runs, threads, store | REST/OpenAPI | Active LangChain project; 598 GitHub stars on June 1, 2026 [S27][S28]. |
| ACP | REST-native agent messaging | HTTP agent endpoints | REST, MIME-style messages | Merged into A2A under Linux Foundation in August 2025 [S29][S30]. |
| ATP | Code-first tool execution | Sandboxed TypeScript/JavaScript code | V8 sandbox, OpenAPI/MCP aggregation | Early monday.com-led project; 98 GitHub stars on June 1, 2026 [S31][S32]. |

## Model Context Protocol (MCP)

Anthropic introduced MCP on November 25, 2024 as an open standard for
connecting AI assistants to the systems where data lives, including content
repositories, business tools, and development environments [S19]. MCP's core
problem statement is fragmentation: every data source had required its own
custom integration, making connected AI systems hard to scale [S19].

MCP's architecture is client/server. Developers expose data and capabilities
through MCP servers, while AI applications act as MCP clients that connect to
those servers [S19]. Anthropic announced three components at launch: the
protocol specification and SDKs, local MCP server support in Claude Desktop,
and an open-source repository of MCP servers [S19]. Early adopters and
integrators included Block, Apollo, Zed, Replit, Codeium, and Sourcegraph
[S19].

In the broader stack, MCP answers "what can the agent use?" It standardizes
tool and context access, not agent identity, agent discovery, portable
deployment, or inter-agent delegation. OSSA consumes MCP by referencing MCP
servers and tools in a manifest; DUADP exposes discovery through MCP tools
[S01][S02][S04].

## Agent2Agent Protocol (A2A)

Google announced A2A on April 9, 2025 as an open protocol for agents to
communicate, securely exchange information, and coordinate actions across
enterprise platforms [S21]. The initial announcement listed more than 50
technology partners and service providers, including Atlassian, Box, Cohere,
LangChain, MongoDB, PayPal, Salesforce, SAP, ServiceNow, Accenture, Deloitte,
KPMG, PwC, and others [S21]. Later ecosystem reporting and the protocol site
describe A2A as donated to the Linux Foundation and as the common language for
agent interoperability [S22].

A2A uses a client/remote-agent model. The client agent formulates and sends a
task; the remote agent acts on that task and returns messages, state updates,
and artifacts [S21]. Discovery is handled by Agent Cards, JSON descriptions of
capabilities that let client agents select the best remote agent for a task
[S21]. The protocol supports long-running tasks, real-time feedback,
notifications, state updates, multimodal content, and authentication parity
with OpenAPI-style schemes [S21].

A2A complements MCP: MCP gives an agent tools; A2A lets an agent delegate to or
coordinate with another agent [S21][S22]. IBM's ACP effort was merged into A2A
in August 2025, which reduces fragmentation in the agent-to-agent layer
[S29][S30].

## Agent-User Interaction Protocol (AG-UI)

AG-UI standardizes the connection between agentic backends and user-facing
applications. Its documentation describes it as an open, lightweight,
event-based protocol for how agent state, UI intents, and user interactions
flow between the agent runtime and frontend [S23]. AG-UI sits on HTTP,
WebSockets, SSE, webhooks, or similar transports; the value is the typed event
semantics, not a new network layer [S23][S24].

The event model includes lifecycle events, streaming text message events, tool
call events, state management events, activity events, and extensibility events
[S23]. This layer matters because long-running agents need visible progress,
interrupts, approvals, state synchronization, and debuggability in the user's
interface. AG-UI therefore answers "how does the human stay in control?"

## Agent Network Protocol (ANP)

ANP's repository states its ambition directly: become "the HTTP of the
Agentic Web era" [S25]. Its architecture has three layers [S25][S26]:

1. **Identity and secure communication layer.** Based on W3C DIDs, this layer
   supports decentralized authentication and end-to-end encrypted
   communication.
2. **Meta-protocol layer.** Agents negotiate which communication protocols to
   use, enabling a self-organizing and self-negotiating network.
3. **Application protocol layer.** Semantic web specifications describe
   capabilities and supported application protocols.

ANP overlaps with DUADP at the identity/discovery boundary but has a broader
communication-network ambition. DUADP is more immediately framed as DNS plus
WebFinger plus gossip discovery for agents, skills, and tools, while ANP is
framed as a full agentic-web communication stack [S01][S25][S26].

## LangChain Agent Protocol

LangChain's Agent Protocol codifies framework-agnostic APIs needed to serve
LLM agents in production [S27]. It organizes the surface around three concepts:

- **Runs:** APIs for executing an agent, including streaming and wait
  endpoints [S27][S28].
- **Threads:** APIs for organizing multi-turn state and history [S27][S28].
- **Store:** APIs for long-term memory, namespaces, item retrieval, and search
  [S27][S28].

This protocol is closer to an application-serving API than a network-wide
interoperability standard. It is useful for deployment, introspection, memory,
and lifecycle management of hosted agents.

## Agent Communication Protocol (ACP)

IBM Research's ACP was a REST-based open standard for agent interoperability:
lightweight, HTTP-native, and designed to let agents built in different
frameworks send and receive messages through a consistent interface [S29].
ACP was explicitly developed to reduce fragmentation in modular agent systems
[S29].

As of August 29, 2025, ACP is no longer best treated as a separate strategic
bet. LF AI & Data announced that ACP was merging with A2A under the Linux
Foundation umbrella, winding down active ACP development and contributing its
technology and expertise into A2A [S30]. For new work, the practical guidance
is to evaluate A2A rather than starting fresh on standalone ACP.

## monday.com Agent Tool Protocol (ATP)

ATP is a code-first tool protocol. Instead of giving an agent a large list of
function calls, ATP lets the agent generate TypeScript/JavaScript code that
runs in an isolated V8 sandbox with limits and explicit capabilities [S31][S32].
The protocol aggregates OpenAPI specifications, custom TypeScript APIs, MCP
servers, and client-side tools into one server surface [S32].

ATP's strongest ideas are sandboxed code execution, explicit memory/CPU/time
limits, provenance tracking, runtime SDK hooks for LLM calls and approvals,
OpenTelemetry support, and human-in-the-loop pause/resume controls [S31][S32].
It is early-stage compared with MCP and A2A, but it addresses a real production
pain: agents often need composition, filtering, parallel calls, and data
transformation rather than a single static function invocation.

## OSSA and DUADP in the protocol stack

OSSA and DUADP fill gaps left by communication protocols.

- **OSSA:** portable contract. It declares identity, role, LLM config, tools,
  autonomy, governance, compliance, observability, cost controls, teams,
  extensions, and export targets [S02][S03][S04].
- **DUADP:** decentralized discovery. It provides node manifests, DNS TXT,
  WebFinger, GAID/DID resolution, signatures, federation, gossip, trust tiers,
  REST endpoints, and MCP tools [S01][S05].

Together, they provide the "phonebook plus contract" layer. MCP, A2A, and
AG-UI move messages; OSSA and DUADP make it possible to know what an agent is,
where it can be found, what it claims, what cryptographic evidence backs the
claim, and which governance rules apply [S01][S02].

## Design trends

1. **Layer separation is winning.** Tool access, agent delegation, UI events,
   deployment contracts, and discovery are being standardized separately
   [S19][S21][S23][S27].
2. **Identity is moving into the protocol layer.** DUADP, ANP, NIST/NCCoE, and
   KYA proposals all emphasize agents as distinct non-human principals
   [S01][S15][S25][S59].
3. **Open governance is becoming an adoption signal.** A2A's Linux Foundation
   path and ACP's merge into A2A suggest consolidation around neutral
   stewardship [S22][S30].
4. **Runtime controls remain under-specified.** Most protocols describe message
   flow; security frameworks must still define least privilege, approval,
   revocation, and audit enforcement [S57][S59][S61].
