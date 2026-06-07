# Agent protocols and standards

## Layered view

The most useful way to compare agent protocols is by layer rather than by vendor. MCP, A2A, AG-UI, ANP, Agent Protocol, ACP, ATP, OSSA, and DUADP do not all solve the same problem.

| Layer | Protocols | Primary question answered |
| --- | --- | --- |
| Contract and governance | OSSA | What is this agent, what can it do, what policies and trust metadata apply? [S02][S03] |
| Discovery and federation | DUADP, ANP | How do agents, skills, tools, and nodes find and verify each other? [S01][S32] |
| Agent-to-tool/data | MCP, ATP | How does an agent access tools, APIs, files, databases, or code execution safely? [S25][S26][S35] |
| Agent-to-agent | A2A, ACP | How do agents delegate work, exchange tasks, and share artifacts? [S27][S28][S34] |
| Agent-to-UI | AG-UI | How does an agent stream state, tool calls, UI events, and HITL interactions to a frontend? [S30][S31] |
| Runtime serving API | LangChain Agent Protocol | How are agents run, threaded, stored, streamed, and introspected in production? [S33] |

## Comparative table

| Protocol | Scope | Format/transport | Core primitives | Adoption status |
| --- | --- | --- | --- | --- |
| MCP | Agent-to-tool/context | JSON-RPC 2.0; stateful host/client/server sessions; stdio and HTTP-style transports in spec family | Hosts, clients, servers, tools, resources, prompts, sampling, roots, elicitation | Strong and broad; introduced by Anthropic and widely implemented [S25][S26] |
| A2A | Agent-to-agent collaboration | HTTP, SSE, JSON-RPC orientation; latest spec includes formal task/message/artifact model | Agent Card, task, message, part, artifact, client agent, remote agent | Strong vendor backing; Google launch with 50+ partners, LF project [S27][S29] |
| AG-UI | Agent-to-user interaction | Event stream; supports SSE, WebSockets, webhooks, text/binary HTTP streaming | BaseEvent, lifecycle/text/tool/state/custom events, RunAgentInput, HttpAgent | Growing frontend/framework ecosystem; LangGraph and CrewAI partnerships [S30][S31] |
| ANP/ADP | Agent description, identity, discovery | JSON-LD using schema.org and ANP vocabulary; did:wba; signatures; links to OpenAPI/JSON-RPC | AgentDescription, DID, owner, products, interfaces, proof | Draft/early; useful for identity-centric discovery concepts [S32] |
| LangChain Agent Protocol | Agent runtime serving | REST/OpenAPI plus SSE/WebSocket streaming primitives | Runs, threads, agents, store, schemas, streaming commands | Implemented by LangGraph Platform superset; ecosystem-specific but concrete [S33] |
| ACP | Agent communication | REST-ish lightweight messaging in IBM BeeAI lineage | Agent messaging and BeeAI integration | Merged into A2A; active ACP development winding down [S34] |
| ATP | Agent-to-tools via sandboxed code | TypeScript/JavaScript code execution in isolated V8 VM; OpenAPI/MCP adapters | ATP client/server, code validator, sandbox executor, runtime SDK, provenance, approvals, cache, audit | Young but production-aimed; not a broad standard yet [S35] |
| OSSA | Agent contract | YAML/JSON manifest, JSON Schema, OpenAPI contracts, CLI validation/export | Agent manifest, role, tool, workflow, registry, policy binding, discovery metadata | Early but packaged; npm 0.5.6, 42 weekly downloads at package page [S03] |
| DUADP | Discovery/federation | Well-known docs, REST endpoints, WebFinger, DNS TXT, gossip, MCP tools, DIDs | GAID, DID, node manifest, agents/skills/tools endpoints, search, publish, federation, governance | Experimental; npm 0.1.7, low package downloads [S01][S04][S08] |

## MCP: Model Context Protocol

Anthropic introduced MCP on November 25, 2024 as an open standard for connecting AI assistants to content repositories, business tools, development environments, and other systems where data lives [S25]. Anthropic's announcement emphasizes secure two-way connections and replacing fragmented custom integrations with one protocol [S25].

The current fetched specification revision, 2025-11-25, defines MCP as an open protocol for LLM applications to share context, expose tools/capabilities, and build composable integrations [S26]. The core architecture is:

- Host: the LLM application that initiates connections.
- Client: the connector inside the host.
- Server: the service exposing resources, prompts, tools, and context.

The base protocol uses JSON-RPC 2.0, stateful connections, and capability negotiation [S26]. Server features include resources, prompts, and tools. Client features include sampling, roots, and elicitation [S26].

Security in MCP is explicit but largely implementor-enforced. The specification says users must consent to data access and operations, hosts must obtain explicit consent before exposing user data, tool descriptions should be treated as untrusted unless from trusted servers, and users should approve tool invocations and LLM sampling requests [S26]. MCP therefore standardizes the interface, not the complete security policy.

## A2A: Agent2Agent Protocol

Google announced A2A on April 9, 2025 as an open protocol for interoperable agents across vendors, frameworks, enterprise platforms, and cloud environments [S27]. Its design principles are:

- Enable true multi-agent collaboration without forcing every agent to be exposed as a tool.
- Build on existing standards such as HTTP, SSE, and JSON-RPC.
- Support enterprise authentication and authorization.
- Support long-running tasks with feedback, notifications, and state updates.
- Remain modality-agnostic across text, audio, video, and richer UI parts [S27].

A2A's conceptual model has a client agent and a remote agent. The client formulates and communicates tasks; the remote agent acts on those tasks. Agent Cards advertise capabilities in JSON, tasks have lifecycle state, outputs are artifacts, and messages carry parts with content types for UI/modality negotiation [S27][S28].

The key strategic distinction is that A2A complements MCP. MCP makes external systems usable as tools. A2A lets separate agents coordinate without sharing memory, tools, or implementation details [S27].

## AG-UI: Agent-User Interaction Protocol

AG-UI is an event-based protocol for connecting agent backends to user-facing applications [S30]. It addresses a different gap from MCP and A2A: traditional request/response APIs do not fit long-running, nondeterministic, stateful, multimodal agent experiences [S30].

The architecture uses frontend applications, AG-UI clients, backend agents, and optionally secure proxies [S31]. AG-UI is transport-agnostic and supports SSE, webhooks, WebSockets, text streaming, and HTTP binary transports [S31].

Core event groups:

- Lifecycle: `RUN_STARTED`, `RUN_FINISHED`, `RUN_ERROR`, `STEP_STARTED`, `STEP_FINISHED`.
- Text: `TEXT_MESSAGE_START`, `TEXT_MESSAGE_CONTENT`, `TEXT_MESSAGE_END`.
- Tools: `TOOL_CALL_START`, `TOOL_CALL_ARGS`, `TOOL_CALL_END`.
- State: `STATE_SNAPSHOT`, `STATE_DELTA`, `MESSAGES_SNAPSHOT`.
- Extensibility: `RAW`, `CUSTOM` [S31].

AG-UI is especially relevant where users need visibility into intermediate work, approval gates, tool-call visualization, shared state, streaming output, and frontend-executed actions [S30][S31].

## ANP and ADP: Agent Network Protocol

The Agent Network Protocol's Agent Description Protocol (ADP) is a draft standard for describing agents with JSON-LD, schema.org vocabulary, ANP vocabulary, and decentralized identifiers [S32]. It positions the agent description as the entry point for learning an agent's name, owner, functions, products, services, interfaces, and security scheme [S32].

Notable design elements:

- JSON-LD as the data model.
- schema.org vocabulary for product/service interoperability.
- `did:wba` as a cross-platform identity mechanism.
- `proof` fields for digital signatures.
- Interfaces linked to YAML, OpenAPI, JSON-RPC 2.0, or natural-language interfaces.
- Optional `humanAuthorization` flags on structured interfaces [S32].

ANP is less adopted than MCP and A2A, but it is valuable because it treats identity, semantic description, and verifiable ownership as first-class protocol concerns.

## LangChain Agent Protocol

LangChain's Agent Protocol codifies framework-agnostic APIs needed to serve LLM agents in production [S33]. It is not mainly a cross-organization protocol like A2A; it is a serving/runtime API for agents.

Primary concepts:

- Runs: executing an agent, including stateless runs, background runs, waiting, streaming, cancellation, deletion, and reconnecting.
- Threads: multi-turn state, revisions, concurrency controls, copying, deletion, and search.
- Agents: introspection endpoints for agent metadata and schemas.
- Store: long-term memory items and namespaces.
- Streaming: SSE and WebSocket primitives for live execution, nested agents, tool lifecycle events, state snapshots, HITL input, checkpoints, tasks, and custom events [S33].

LangGraph Platform implements a superset of this protocol, while community implementations can implement the OpenAPI spec [S33].

## ACP: Agent Communication Protocol

IBM Research launched ACP in March 2025 for BeeAI, then donated BeeAI and ACP to the Linux Foundation [S34]. When A2A launched, IBM and Google found enough alignment that ACP officially merged into A2A under the Linux Foundation umbrella [S34].

Implication: treat ACP as historically important and migration-relevant, but not as a separate forward path if A2A compliance is available. The LF AI and Data announcement says ACP active development is winding down, BeeAI uses A2A after the August 29, 2025 merger announcement, and ACP users will receive migration paths [S34].

## ATP: monday.com Agent Tool Protocol

ATP is a code-first protocol for agent-to-tool interaction through secure sandboxed TypeScript/JavaScript execution [S35]. It argues that traditional function-calling and MCP-style schemas can create context bloat, sequential execution, and limited in-protocol data processing [S35].

ATP's model:

- Agent submits code.
- Server validates code with AST analysis.
- Isolated V8 VM executes code with memory/time limits.
- Runtime SDK exposes `atp.llm`, `atp.embedding`, `atp.approval`, `atp.cache`, `atp.log`, `atp.progress`, and `atp.api`.
- API aggregator loads OpenAPI, MCP, and custom APIs.
- Provenance tracking and security policies defend against prompt injection and exfiltration [S35].

ATP is best treated as an emerging alternative pattern, not a general industry standard. Its strongest contribution is demonstrating that "tools" may become programmable, sandboxed execution surfaces rather than fixed function calls.

## OSSA and DUADP in the protocol map

OSSA and DUADP are adjacent to the communication protocols rather than replacements for them.

OSSA:

- Defines agent identity, role, tools, capabilities, governance, policy bindings, discovery metadata, and validation.
- Provides JSON Schemas and CLI validation.
- Exports/migrates definitions to frameworks and platforms.
- References MCP/A2A rather than replacing them [S02][S03][S05].

DUADP:

- Publishes and discovers agents/skills/tools through well-known endpoints, REST, WebFinger, DNS TXT, gossip federation, and MCP tools.
- Uses GAID handles, DIDs, signatures, provenance, trust tiers, and Cedar policy inputs.
- Bridges discovery to OSSA manifests [S01][S04][S06].

If MCP is "how an agent uses a tool" and A2A is "how an agent delegates to another agent," then OSSA is "what the agent contract says" and DUADP is "where the agent or skill can be discovered."

## Design trade-offs

| Decision axis | Centralized approach | Open protocol approach | Risk |
| --- | --- | --- | --- |
| Tool integration | Vendor-specific connectors | MCP/ATP adapters | Tool poisoning and permission drift |
| Agent collaboration | Same-vendor orchestration | A2A/ACP lineage | Cross-agent auth and accountability |
| User experience | Custom UI streams | AG-UI event model | UI state confusion and unclear approvals |
| Discovery | Marketplace/platform registry | DUADP/ANP-style federation | Spam, impersonation, revocation complexity |
| Governance | Platform-specific policy | OSSA manifests plus policy bindings | Spec adoption and conformance gaps |

## Adoption trend

MCP has the strongest practical adoption signal because it is already integrated into many tools and frameworks and is supported by a large ecosystem [S25][S26][S18]. A2A has the strongest enterprise coordination signal because it launched with many large partners and moved into Linux Foundation governance [S27][S29]. AG-UI has a focused but important frontend niche, with explicit framework integrations and transport flexibility [S30][S31].

OSSA and DUADP are earlier. The OSSA package has 42 weekly downloads on npm and 243 monthly downloads in the npm downloads API window; DUADP has 9 weekly and 107 monthly downloads in the fetched npm downloads window [S03][S07][S08]. They are important to study because they directly address contract, discovery, policy, identity, and governance gaps, but their ecosystem is not yet comparable to MCP/A2A.

## Recommendations

1. Adopt MCP for tool/data interoperability, but pair it with strict consent, tool validation, capability scoping, and audit logs [S26][S18].
2. Use A2A for cross-agent collaboration where agent capability discovery, task state, artifacts, and modality negotiation are needed [S27][S28].
3. Use AG-UI when the frontend must render streamed state, tool calls, progress, and human approvals [S30][S31].
4. Track ANP/DUADP for identity and discovery, especially where federated registries or web-scale agent lookup matter [S01][S32].
5. Use OSSA as an internal manifest/governance schema if portability, policy metadata, and export targets are important, but keep runtime enforcement separate and test conformance explicitly [S02][S03].
6. Treat ACP as part of A2A migration history after the Linux Foundation merger [S34].
7. Evaluate ATP for code-heavy tool workflows, but require sandbox, provenance, rate limits, and audit evidence before production use [S35].
