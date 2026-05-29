# Protocols and standards for agentic AI

Generated: 2026-05-29.

## Protocol landscape

The reviewed sources support a layered interpretation. MCP handles agent-to-tool
and agent-to-context access. A2A and ACP handle agent-to-agent coordination.
AG-UI handles agent-to-user interaction. ANP, DUADP, KYA, DIDs, WebFinger, and
NIST's identity work address discovery, identity, delegation, and authorization.
OSSA sits beside these as an agent contract/manifest layer rather than a wire
protocol [S01][S02][S18][S20][S23][S25][S29][S12].

## Comparative table

| Protocol | Primary scope | Format / transport | Key primitives | Adoption status |
| --- | --- | --- | --- | --- |
| OSSA | Portable agent contract and export layer | YAML/JSON schema, CLI, MCP server | Manifest, GAID/DID, Cedar policy, exports, conformance | npm v0.5.1; early stage; 23+ export targets claimed on site [S02][S04] |
| DUADP | Decentralized discovery and federation | DNS TXT, WebFinger, REST, MCP, gossip | GAID, DID, trust tier, federation peer, registry | npm v0.1.4; 17 MCP tools; 36 indexed resources on site [S01][S05] |
| MCP | Agent-to-tool/data/context | JSON-RPC; stdio and HTTP transports | Server, client, tools, resources, prompts | Broad adoption; donated to Linux Foundation AAIF [S18][S19] |
| A2A | Agent-to-agent task delegation | JSON-RPC 2.0 over HTTP/SSE; docs also discuss REST/gRPC bindings | Agent Card, tasks, messages, artifacts, streaming, push notifications | Google-originated; Linux Foundation project; 150+ organizations cited [S20][S21][S22] |
| AG-UI | Agent-to-user/frontend events | Transport-agnostic; HTTP SSE, WebSockets, webhooks, binary HTTP | RunAgentInput, typed events, state, tool lifecycle, UI context | Active GitHub project; integrations with CopilotKit and agent frameworks [S23][S24] |
| ANP | Agentic web identity, discovery, negotiation, collaboration | DID-based auth, Semantic Web/JSON-LD concepts, HTTP signatures | did:wba, meta-protocol, agent description document | 1,304 GitHub stars on 2026-05-29; W3C CG activity [S25][S26] |
| LangChain Agent Protocol | Framework-agnostic serving API for agents | HTTP/OpenAPI style REST endpoints | Runs, Threads, Store | 595 GitHub stars; used by LangGraph/Studio [S27][S28] |
| ACP | Lightweight REST-native agent communication | REST, SSE, OpenAPI, MIME-based multimodal messages | Message, Part, agent manifest, async/session support | Linux Foundation/BeeAI ecosystem; Python and TypeScript SDKs [S29][S30] |
| ATP | Agent-to-tool via sandboxed code execution | TypeScript/JavaScript in isolated V8 sandbox; client/server SDK | executeCode, searchApi, `atp.*` runtime SDK, approvals, provenance | monday.com open source; npm client v0.24.0 [S31][S32] |

## OSSA and DUADP in detail

OSSA answers "what is this agent?" It defines identity, capabilities, tools,
compliance metadata, cost controls, lifecycle, state, trust, and export intent
in a portable manifest [S02][S03]. The OSSA site positions MCP as "what the
agent can use" and A2A as "how agents communicate"; OSSA is the contract that
declares the portable definition across platforms [S02]. Its npm package
description says it exports one YAML definition to Docker, Kubernetes,
LangChain, CrewAI, Claude skills, and other platforms [S04].

DUADP answers "how does another agent find and verify it?" The homepage
describes a five-step GAID/DID pipeline: a portable `agent://...` handle, a
WebFinger resolution step, a DID document for cryptographic identity,
signature/provenance verification, and a trust tier that becomes a policy input
[S01]. It also exposes a node manifest at `/.well-known/duadp`, federation
registration and gossip endpoints, governance evaluation, metrics, and 17 MCP
tools [S01].

Together, OSSA and DUADP form an identity/discovery/control plane: OSSA carries
the signed agent contract and DUADP publishes, resolves, and filters it through
federated discovery and trust policy [S01][S02][S03].

## MCP

Anthropic introduced MCP on 2024-11-25 as an open standard for secure two-way
connections between AI assistants and external data systems, replacing
fragmented custom integrations with a universal protocol [S18]. Early adopters
included Block and Apollo, while Zed, Replit, Codeium, and Sourcegraph were
working with MCP for coding-context integrations [S18].

MCP's value is that tool servers can be implemented once and consumed by many
agent clients. Its limitation is that production safety often requires extra
infrastructure: identity propagation, tool-level ACLs, readiness endpoints,
structured errors, timeouts, and audit trails are not fully solved by baseline
tool discovery alone [S18][S56].

Anthropic later donated MCP to the Agentic AI Foundation under the Linux
Foundation, alongside founding projects such as Block's goose and OpenAI's
AGENTS.md, with support from major cloud and AI vendors [S19].

## A2A

Google announced Agent2Agent (A2A) as an open protocol for agents built by
different vendors and frameworks to discover each other, exchange information,
and coordinate actions [S20]. A2A is explicitly complementary to MCP: MCP
connects agents to tools; A2A connects agents to other agents [S20][S21].

The protocol uses Agent Cards to advertise an agent's identity, endpoint,
skills, modalities, and authentication requirements. Communication centers on
task lifecycle methods, messages, artifacts, streaming updates via SSE, and
asynchronous push notifications for long-running tasks [S21][S22]. Google
initially announced support from more than 50 technology and service partners;
later A2A documentation and secondary sources cite more than 150 organizations
[S20][S21][S47].

## AG-UI

AG-UI standardizes the agent-to-user interface boundary. It is an open,
lightweight, event-based protocol for connecting user-facing applications to
agent backends [S23][S24]. It does not mandate one transport; it can operate
over HTTP SSE, WebSockets, webhooks, text streams, or binary HTTP [S23].

The important primitives are typed events and compatible inputs. During a run,
agent backends emit lifecycle, text, tool-call, state, and error events while
frontends provide context, user messages, state, and tools [S23]. This boundary
is important for human-in-the-loop systems because approvals, progress, state
snapshots, and tool visualizations need to be visible in UI rather than hidden
inside model traces [S23][S47].

## ANP

Agent Network Protocol (ANP) aims to become the "HTTP of the Agentic Web era"
[S25]. Its architecture has three layers: identity and secure communication
based on W3C DIDs, a meta-protocol layer for negotiating communication
protocols, and an application protocol layer for describing capabilities and
interfaces [S25][S26].

ANP's DID work includes `did:wba`, a web-based agent DID method extending
`did:web` for cross-platform authentication. The W3C white paper describes
single-request authentication using DID documents, HTTP message signatures, and
access tokens [S26]. ANP is more ambitious than A2A/ACP because it tries to
define identity, discovery, negotiation, and semantic capability description
together [S25][S26].

## LangChain Agent Protocol

LangChain's Agent Protocol codifies framework-agnostic APIs for serving agents
in production [S27]. It focuses on three areas:

- Runs: execute an agent, stream output, wait for completion, and attach runs
  to threads [S27][S28].
- Threads: organize multi-turn agent state and allow create, retrieve, copy,
  search, patch, and delete operations [S27].
- Store: manage long-term memory with namespace/item APIs and search [S27].

This is less a universal web protocol and more an operational serving API. Its
primitives map well to LangGraph Studio and other agent runtimes that need
consistent execution and introspection [S27][S28].

## ACP

ACP, the Agent Communication Protocol, is a REST-native open protocol for
communication among agents, applications, and humans [S29][S30]. It supports
sync and async operation, streaming, stateful and stateless patterns, multimodal
messages, long-running tasks, and online/offline discovery [S29]. Compared with
A2A, ACP is lighter-weight and more directly HTTP/OpenAPI friendly; compared
with MCP, ACP is about peer communication rather than tool access [S29][S30].

## ATP

monday.com's Agent Tool Protocol (ATP) takes a different position: it lets
agents write and execute TypeScript/JavaScript code in a secure V8 sandbox
instead of only selecting predefined function calls [S31]. ATP aggregates
OpenAPI specs, MCP servers, and custom APIs behind a runtime SDK, with human
approval callbacks, caching, logging, progress reporting, and provenance
tracking [S31][S32]. Its security claim is that code execution can be safe if
the sandbox denies filesystem/network/process access unless explicitly exposed,
and if provenance and approvals are built into the runtime [S31].

## Adoption and convergence

Industry sources increasingly recommend an incremental protocol stack: start
with MCP for tools, add AG-UI for human-facing agent applications, then add A2A
or ACP when specialization requires cross-agent delegation [S47][S48]. NIST's
concept paper suggests the next convergence point is identity and authorization:
standards such as OAuth/OIDC, SPIFFE/SPIRE, SCIM, NGAC, MCP, and zero trust need
agent-specific application patterns [S12].

## Practical selection guide

- Choose OSSA when you need a portable, reviewable agent contract across
  frameworks, deployment targets, and compliance boundaries [S02][S04].
- Choose DUADP when agents need decentralized discovery, DID-backed identity,
  trust-tier filtering, federation, or MCP-based registry tools [S01][S05].
- Choose MCP when an agent needs databases, APIs, repos, cloud resources, or
  other tools [S18].
- Choose A2A when independently hosted agents must discover each other and
  delegate tasks across vendors or teams [S20][S21].
- Choose AG-UI when a product UI needs typed, real-time events for progress,
  tool calls, state, and human approval [S23].
- Choose ACP for REST-native intra-enterprise or framework-agnostic messaging
  where A2A's full task model is heavier than needed [S29].
- Choose ATP when the primary integration burden is huge API surface area and
  safe code execution is preferable to thousands of predefined tool schemas
  [S31].
