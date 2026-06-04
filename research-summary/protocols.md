# Protocols and Standards

Report date: 2026-06-04

## Layer map

The agent protocol ecosystem is converging on a layered stack. The strongest pattern is not one universal protocol, but several protocols with distinct boundaries:

| Layer | Main protocols | Primary question answered |
| --- | --- | --- |
| Agent contract | OSSA | What is this agent, what can it do, and what policies apply? |
| Discovery and identity | DUADP, ANP, A2A Agent Cards | Where is the agent/capability, and how do I verify it? |
| Tool and data access | MCP | What tools, resources, prompts, and workflows can an agent use? |
| Agent collaboration | A2A, ACP legacy | How do independent agents delegate tasks and exchange artifacts? |
| Runtime serving | LangChain Agent Protocol | How do clients run, stream, manage, and inspect agents? |
| User interaction | AG-UI | How do agent backends stream state, messages, tools, and HITL events to UIs? |
| Web/policy identity | Web Bot Auth, SAIP, HAP, CAIP-122, x402 | How does a site know an automated actor is legitimate? |

## Concise comparison

| Protocol | Scope | Message/format | Discovery | Adoption status |
| --- | --- | --- | --- | --- |
| OSSA | Portable agent manifest and governance contract | YAML/JSON Schema, OpenAPI refs | DUADP, well-known, registries | Early, npm package, 23+ export targets claimed on site |
| DUADP | Federated discovery for agents, skills, tools | HTTP JSON, GAID, DID, MCP tools | DNS TXT, WebFinger, gossip, well-known | Early, npm TypeScript SDK, 36 resources indexed on site |
| MCP | Agent-to-tool/data/context | JSON-RPC, resources, tools, prompts | Client/server config and registries | Broad ecosystem support across major AI tools |
| A2A | Agent-to-agent task delegation | HTTP, SSE, JSON-RPC, Agent Card JSON | Agent Cards | Google launch, Linux Foundation path, broad vendor support |
| AG-UI | Agent-to-frontend interaction | Standard event stream, HTTP/SSE/WebSocket | App endpoint/config | Early but active; LangGraph/CrewAI/CopilotKit integrations |
| ANP | Decentralized agent network | DIDs, JSON-LD, semantic web layers | DID and agent descriptions | Open-source community protocol |
| Agent Protocol | Production agent serving APIs | OpenAPI/JSON, SSE/WebSocket streaming | Agent introspection endpoints | LangGraph Platform superset, open spec |
| ACP | RESTful agent communication | REST, MIME typed messages | Online/offline agent discovery | Merged into A2A under Linux Foundation |

## OSSA: contract layer

OSSA is not a protocol like MCP or A2A and not a runtime framework like LangGraph or CrewAI. It is a contract layer for defining, validating, discovering, governing, and exporting agents. The website frames the problem as an M by N configuration problem: every framework and deployment target defines agents differently, so teams duplicate 40-60% of configuration across platforms. OSSA attempts to replace that with one schema-validated manifest per agent [OSSA-WEB].

Core primitives:

- Agent manifest: identity, role, tools, capabilities, governance metadata, interoperability surfaces [OSSA-NPM].
- Policy binding: links to Cedar or other policy authorities [OSSA-NPM].
- Discovery metadata: references DUADP and well-known documents [OSSA-WEB] [OSSA-NPM].
- Export targets: Docker, Kubernetes, LangChain, CrewAI, GitLab Duo, Claude, Cursor, Drupal, MCP, A2A, npm, and others as documented by the project site [OSSA-WEB].

Security emphasis: OSSA embeds trust and governance metadata before runtime execution. The site specifically discusses GAID/DID identity, signed manifests, Cedar policies, compliance metadata, and human-in-the-loop/cost/observability controls [OSSA-WEB].

## DUADP: discovery layer

DUADP fills the discovery gap. Its home page states: MCP connects tools, A2A connects agents, and DUADP helps agents find each other. It uses federated DNS plus WebFinger-style lookup, gossip federation, and DID identity to publish and discover agents, skills, tools, and registries without a single central broker [DUADP-WEB].

Core primitives:

- DUADP node: any server implementing the well-known discovery and API endpoints [DUADP-NPM].
- GAID: global agent/resource identifier such as `agent://discover.duadp.org/agents/code-reviewer` [DUADP-WEB].
- DID: cryptographic identity such as `did:web` or `did:key` used to verify node/resource identity [DUADP-WEB] [DUADP-NPM].
- Trust tier: `official`, `verified-signature`, `signed`, `community`, `experimental` [DUADP-NPM].
- Federation: peer discovery and gossip with hop limits, deduplication, provenance, revocation, and circuit breakers [DUADP-WEB] [DUADP-NPM].

Implementation surface:

- REST endpoints for agents, skills, tools, search, publish, validate, federation, identity, governance, health, and metrics [DUADP-WEB].
- MCP tools such as `duadp_discover`, `duadp_search`, `duadp_get_agent`, `duadp_publish_agent`, `duadp_validate_manifest`, federation tools, identity, governance, and health [DUADP-WEB].
- TypeScript SDK exports for client, server, validation, crypto, DID, and conformance [DUADP-NPM].

## MCP: model context protocol

Anthropic introduced MCP on 2024-11-25 as an open standard for connecting AI assistants to the systems where data lives, replacing fragmented custom connectors with a single protocol. The architecture has MCP servers that expose data/tools/resources/prompts and MCP clients that connect AI applications to those servers [MCP-ANN].

The official docs describe MCP as an open-source standard for connecting AI applications to external systems such as local files, databases, search engines, calculators, specialized prompts, and workflows. The docs use a USB-C analogy: MCP provides a standardized way to connect AI applications to external systems [MCP-DOCS].

Design goals:

- Reduce integration complexity for developers [MCP-DOCS].
- Give agents access to tool and data ecosystems [MCP-DOCS].
- Support secure two-way connections [MCP-ANN].
- Enable build-once integrations across assistants and IDEs [MCP-DOCS].

Adoption:

- Anthropic announced early adopters including Block and Apollo, plus development tools such as Zed, Replit, Codeium, and Sourcegraph [MCP-ANN].
- The docs list broad ecosystem support from assistants and development tools including Claude, ChatGPT, Visual Studio Code, Cursor, MCPJam, and others [MCP-DOCS].

Risk note: MCP standardizes tool access but does not by itself solve agent identity, least privilege, or policy enforcement. Those must be layered through IAM, resource servers, gateways, manifests, or policy engines [NIST-NCCOE] [GRAVITEE-REPORT].

## A2A: Agent2Agent

Google announced Agent2Agent (A2A) on 2025-04-09 as an open protocol for agents to communicate, exchange information securely, and coordinate actions across enterprise platforms and applications. It complements MCP: MCP gives agents tools and context, while A2A enables agents to collaborate with each other [A2A-GOOGLE].

Design principles:

- Embrace agentic capabilities rather than reducing every remote agent to a tool [A2A-GOOGLE].
- Build on HTTP, SSE, and JSON-RPC [A2A-GOOGLE].
- Support enterprise-grade authentication and authorization, with parity to OpenAPI authentication schemes at launch [A2A-GOOGLE].
- Support long-running tasks with real-time status, notifications, and state updates [A2A-GOOGLE].
- Support multiple modalities, including audio and video streaming [A2A-GOOGLE].

Core primitives:

- Client agent and remote agent roles [A2A-GOOGLE].
- Agent Card JSON for capability discovery [A2A-GOOGLE].
- Task object and lifecycle [A2A-GOOGLE].
- Artifact output [A2A-GOOGLE].
- Message parts for UI/content negotiation [A2A-GOOGLE].

Adoption:

- Google announced support from more than 50 technology partners and service providers at launch [A2A-GOOGLE].
- 47Billion reports that A2A had more than 150 supporting organizations by 2026 and had been donated to the Linux Foundation in June 2025 [FORTYSEVEN].
- ACP has merged into A2A under the Linux Foundation umbrella, reducing fragmentation in the agent-to-agent layer [ACP-LFAI].

## AG-UI: Agent User Interaction protocol

AG-UI is an open, lightweight, event-based protocol for connecting agent backends to user-facing applications. It standardizes how agent state, UI interactions, messages, tool calls, lifecycle signals, and human-in-the-loop events flow between a frontend and an agent backend [AGUI-GH].

Core primitives:

- Approximately 16 standard event types emitted during agent execution [AGUI-GH].
- Simple AG-UI compatible inputs accepted by agent backends [AGUI-GH].
- Middleware layer that adapts diverse agent/framework event formats [AGUI-GH].
- Transport flexibility across SSE, WebSockets, webhooks, text streams, and binary transports [AGUI-GH].
- Reference HTTP implementation and default connector [AGUI-GH].

AG-UI positions itself as complementary to MCP and A2A: MCP gives agents tools, A2A allows agents to communicate with agents, and AG-UI brings agents into user-facing applications [AGUI-GH].

Adoption:

- AG-UI documents supported/partnered integrations with LangGraph and CrewAI [AGUI-GH].
- First-party/community integrations include Microsoft Agent Framework, Google ADK, AWS Strands Agents, Mastra, Pydantic AI, Agno, LlamaIndex, AG2, Claude Agent SDK, and others, with some in progress [AGUI-GH].

## ANP: Agent Network Protocol

Agent Network Protocol (ANP) aims to become "the HTTP of the Agentic Web era." It is an open-source communication protocol for intelligent agents that seeks to define how billions of agents connect, authenticate, discover, and collaborate [ANP-GH].

Three-layer architecture:

1. Identity and secure communication layer based on W3C DIDs, decentralized authentication, and end-to-end encrypted communication [ANP-GH].
2. Meta-protocol layer for negotiating communication protocols between agents [ANP-GH].
3. Application protocol layer based on semantic web specifications for describing capabilities and supported application protocols [ANP-GH].

ANP is more internet-native and decentralized than enterprise-first A2A. It is useful to track for open-network agent marketplaces and autonomous agent-to-agent negotiation.

## LangChain Agent Protocol

LangChain Agent Protocol codifies framework-agnostic APIs for serving LLM agents in production. Its core concepts are runs, threads, agents, and store [LANGCHAIN-AP].

Endpoint groups:

- Stateless runs: `POST /runs/wait`, `POST /runs/stream` [LANGCHAIN-AP].
- Threads: create/search/get/copy/delete/update threads and browse thread state history [LANGCHAIN-AP].
- Agents: search agents, get agent info, get input/output/state/config JSON Schemas [LANGCHAIN-AP].
- Background runs: create, get, list, cancel, delete, wait, stream [LANGCHAIN-AP].
- Store: CRUD/search long-term memory items and namespaces [LANGCHAIN-AP].
- Streaming: SSE and WebSocket streams for live events, commands, replay, tool lifecycle events, state snapshots, HITL input, and custom events [LANGCHAIN-AP].

LangGraph Platform implements a superset of this protocol, and LangGraph.js has an open-source implementation using in-memory storage [LANGCHAIN-AP].

## ACP: Agent Communication Protocol

ACP was a REST-based open protocol for agent interoperability. It emphasized synchronous/asynchronous communication, streaming, stateful/stateless operation, online/offline discovery, long-running tasks, MIME-typed messages, and no-SDK-required HTTP usability [ACP-DOCS].

The forward-looking status changed in 2025. IBM Research and Google announced that ACP would merge into A2A under the Linux Foundation umbrella. ACP active development is winding down, its technology and expertise are moving into A2A, and BeeAI users are migrating to A2A adapters [ACP-LFAI].

Use ACP references mainly for historical context, REST-centric design patterns, and migration considerations.

## Other emerging standards

### Web Bot Auth, SAIP, HAP, CAIP-122, and x402

Agent traffic on the open web needs verifiable identity. TechPolicy.Press argues that `robots.txt` and user-agent strings are too weak because they are voluntary or spoofable. It highlights Web Bot Auth for provider-level signed crawler identity, CAIP-122 for wallet/account-level identity, and x402 for HTTP 402 payment and authorization flows [TECHPOLICY].

Search results also identify SAIP and HAP drafts. SAIP proposes Signed Agent Identity Protocol for verifiable automated software identities across HTTP/SMTP/header-based protocols, using cryptographic claims at vendor, agent type, and instance granularity. HAP proposes HTTP Message Signatures, privacy-preserving human tokens, and agent-specific policies/payments within HTTP semantics [WEB-IDENTITY-SEARCH].

These are not mature enough to replace application-layer controls, but they are important for agent web conduct and bot/human traffic separation.

## Protocol selection guidance

1. Start with the boundary. If the problem is tool access, use MCP. If it is peer task delegation, use A2A. If it is interactive UI streaming, use AG-UI. If it is production run/thread/memory serving, use Agent Protocol. If it is discovery across organizations, evaluate DUADP or ANP. If it is manifest portability/governance, use OSSA.
2. Do not overload one protocol. MCP servers should not become general identity authorities; Agent Cards should not replace complete governance manifests; UI event protocols should not be used as policy layers.
3. Treat identity and authorization as cross-cutting. NIST/NCCoE, Gravitee, and MIT all point to unique identity, delegated authorization, logging, and non-repudiation as structural requirements [NIST-NCCOE] [GRAVITEE-REPORT] [MIT-DETAILS].
4. Prefer standards over bespoke glue when a boundary is mature. 47Billion's production guidance explicitly warns against custom integration code when MCP, A2A, and AG-UI cover the boundary [FORTYSEVEN].
