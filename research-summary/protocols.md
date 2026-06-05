# Protocols, standards, and interoperability layers

Prepared on 2026-06-05. Citation keys resolve in [reading-list.md](./reading-list.md).

## Summary table

| Protocol | Scope | Core artifact or message | Transport / format | Adoption status |
| --- | --- | --- | --- | --- |
| OSSA | Agent contract, governance, export | YAML/JSON manifest, schemas, CLI validation | JSON Schema, YAML, CLI, package exports | @bluefly/openstandardagents 0.5.6 on npm; public site reports 23+ export targets [S01], [S02] |
| DUADP | Discovery, federation, identity | GAID, DID, `/.well-known/duadp`, registry resources | HTTP/REST, WebFinger, DNS TXT, gossip, MCP tools | @bluefly/duadp 0.1.7 on npm; site reports 17 MCP tools [S03], [S04] |
| MCP | Agent-to-tool/data/context | Tool/resource/prompt schemas, MCP server/client | JSON-RPC over stdio or streamable transports | Very high adoption; Anthropic-originated open standard [S07] |
| A2A | Agent-to-agent delegation | Agent Card, task lifecycle, messages/artifacts | JSON-RPC 2.0 over HTTP(S), SSE, gRPC in newer versions | Linux Foundation project; 150+ organizations, v1.0.1 in 2026 [S08], [S09] |
| AG-UI | Agent-to-user UI streams | Typed event stream, RunAgent input | HTTP, SSE, WebSockets, webhooks; JSON/binary events | Active GitHub project; 14,043 stars on 2026-06-05 [S10], [S11] |
| ANP | Agent network identity and negotiation | DID identity, meta-protocol, semantic capability descriptions | Web/P2P-compatible; DID and encrypted communication | Emerging; 1,316 GitHub stars on 2026-06-05 [S12] |
| LangChain Agent Protocol | Framework-agnostic serving API | Runs, threads, store endpoints | REST/OpenAPI | Active but narrower; 601 GitHub stars on 2026-06-05 [S13], [S14] |
| ACP | Lightweight agent messaging | REST messages, metadata, async/sync flows | HTTP REST, SSE | Merged into A2A under Linux Foundation [S15], [S16] |
| ATP | Code-first tool/API execution | Secure TypeScript/JavaScript code execution, runtime SDK | Tool server, isolated V8 VM, OpenAPI/MCP adapters | Early; 98 GitHub stars on 2026-06-05 [S17] |

## OSSA: Open Standard for Software Agents

OSSA is a contract layer, not a runtime framework and not a wire protocol. Its public site says MCP connects tools and A2A connects agents, but neither defines the contract that says what an agent is, how it is governed, and how it moves across platforms [S01]. The npm package describes OSSA as an open standard for defining, validating, discovering, and governing software agents, including schemas, identity, capability boundaries, policy bindings, discovery metadata, validation rules, and auditability [S02].

The package `@bluefly/openstandardagents` is published as version 0.5.6, Apache-2.0, with the `ossa` CLI and exports for schemas, validation, generation, migration, agent-card generation, trust services, and other package surfaces [S02]. The public site reports 23+ export targets, 10 MCP tools, 65+ CLI commands, and an MCP server that can validate, scaffold, convert, inspect, generate agent cards, publish, list, manage workspaces, diff, and migrate manifests [S01].

OSSA's role is similar to OpenAPI for APIs. It is a portable description, not the execution engine. The manifest can reference MCP tools, A2A communication, policies, compliance metadata, cost controls, human-in-the-loop rules, observability, state management, and export targets [S01], [S02]. This makes it a useful bridge for organizations trying to avoid M x N configuration drift across LangChain, CrewAI, Kubernetes, Docker, GitLab Duo, Claude Code, Cursor, Drupal, MCP, A2A, and npm [S01].

## DUADP and UADP: decentralized discovery

DUADP is the Decentralized Universal AI Discovery Protocol. Its public site frames it as "DNS for AI agents": a protocol for any AI agent to publish itself to the web and be discovered by others without a central registry [S03]. DUADP combines DNS TXT records, WebFinger, gossip federation, GAIDs, DIDs, signatures, trust tiers, policy evaluation, REST endpoints, and MCP tools [S03].

The current npm package `@bluefly/duadp` is version 0.1.7, Apache-2.0, with a `duadp` CLI and dependencies for schema validation, canonicalization, YAML parsing, and DID resolution [S04]. The public site documents a node manifest at `/.well-known/duadp`, search and publish endpoints, federation endpoints, DID identity, NIST governance endpoints, and 17 MCP tools such as `duadp_search`, `duadp_publish_agent`, `duadp_validate_manifest`, `duadp_federation_register`, and `duadp_governance_evaluate` [S03].

The local draft UADP spec is close in spirit but uses `/.well-known/uadp.json` and `/uadp/v1/skills` or `/uadp/v1/agents` endpoints [S06]. It defines conformance requirements: JSON endpoints, at least one skills or agents endpoint, optional federation and validation endpoints, and OSSA-formatted payloads [S06]. In this repo, UADP/DUADP is therefore the discovery protocol paired with OSSA as the manifest standard [S05], [S06].

## MCP: Model Context Protocol

Anthropic introduced MCP on 2024-11-25 as an open standard for connecting AI assistants to the systems where data lives: content repositories, business tools, development environments, databases, and other external capabilities [S07]. MCP's stated goal is to replace fragmented custom integrations with one protocol that provides secure, two-way connections between AI systems and data sources [S07].

MCP's basic architecture is client/server. A data owner exposes capabilities through MCP servers; an AI application or host connects as an MCP client [S07]. The announcement included the specification and SDKs, local Claude Desktop support, and a repository of pre-built MCP servers for systems such as Google Drive, Slack, GitHub, Git, Postgres, and Puppeteer [S07]. Early adopters cited by Anthropic included Block and Apollo, with development tools such as Zed, Replit, Codeium, and Sourcegraph working on integrations [S07].

MCP is best treated as agent-to-tool/context infrastructure. It is not an agent identity framework, not a full governance layer, and not enough by itself for agent-to-agent delegation. The security caveat is significant: MCP server metadata and tool outputs can become model context, so clients must treat them as untrusted data and enforce access controls outside the model [S41], [S42].

## A2A: Agent2Agent protocol

Google announced A2A on 2025-04-09 as an open protocol for AI agents to communicate, securely exchange information, and coordinate actions across enterprise platforms [S08]. It was designed to complement MCP: MCP connects agents to tools, while A2A connects agents to other agents [S08], [S09]. Google's launch described A2A as built on existing standards including HTTP, SSE, and JSON-RPC, with Agent Cards in JSON for capability discovery [S08].

A2A's core primitives are Agent Cards and tasks. An Agent Card advertises an agent's name, endpoint, capabilities, modalities, authentication requirements, and other connection information. A client agent uses the card to decide whether and how to delegate work. Tasks carry the work and progress through lifecycle states, with synchronous, streaming, and asynchronous interaction patterns [S08], [S09].

By 2026-04-09, the Linux Foundation reported that A2A had more than 150 supporting organizations, major cloud integrations, active production deployments, and a stable v1.0 release. GitHub metadata gathered on 2026-06-05 showed the A2A repo at 24,141 stars, Apache-2.0, latest release v1.0.1 on 2026-05-28 [S09]. This makes A2A the leading open agent-to-agent task exchange protocol in the current landscape.

## AG-UI: Agent-User Interaction

AG-UI is an open, lightweight, event-based protocol for connecting AI agent backends to user-facing applications [S10]. It fills a different boundary than MCP and A2A: the bidirectional connection between an agentic backend and a frontend that needs real-time state, text deltas, tool-call progress, interrupts, and user input [S10], [S11].

The protocol is transport-agnostic and can run over HTTP, SSE, WebSockets, webhooks, text streaming, or binary protocols [S11]. Its central abstraction is a typed event stream. Agents emit events compatible with roughly 16 standard event types, and clients process those events to render progress, state, tool orchestration, and interaction flows [S10], [S11]. GitHub metadata on 2026-06-05 showed 14,043 stars and a release on the same date, indicating active development.

AG-UI is useful when an agent is not only producing an answer but collaborating with a user inside an application. It does not replace MCP or A2A; it exposes their consequences in the UI layer. For example, an A2A delegation or MCP tool call can surface as AG-UI events in a user's browser [S10].

## ANP: Agent Network Protocol

ANP aims to become "the HTTP of the Agentic Web era" [S12]. Its vision is an open, secure, efficient collaboration network for billions of agents. It proposes a three-layer architecture: identity and secure communication, meta-protocol negotiation, and application protocol descriptions [S12].

The identity layer is based on W3C DIDs and encrypted communication so agents from different platforms can authenticate each other without a central authority [S12]. The meta-protocol layer lets agents negotiate which application protocol to use, potentially through natural language and AI-assisted code generation. The application layer describes capabilities and supported protocols using semantic web concepts [S12].

ANP and DUADP are adjacent but not identical. ANP is broader as a network protocol framework for secure communication and negotiation. DUADP is more directly a discovery/federation registry protocol for agents, skills, and tools, tied to GAID/DID resolution and OSSA payloads [S03], [S06], [S12].

## LangChain Agent Protocol

LangChain Agent Protocol codifies framework-agnostic APIs for serving LLM agents in production [S13], [S14]. Its scope is operational API shape, not internet-scale discovery or identity. The main resources are runs, threads, and store endpoints: runs execute agents, threads organize multi-turn interactions and state history, and store endpoints support long-term memory items [S13].

This protocol is especially useful for deployment and tooling. LangGraph Studio can connect to servers implementing Agent Protocol, and agents from other frameworks can be wrapped as LangGraph nodes for deployment on LangGraph infrastructure [S14]. It is narrower than A2A: A2A focuses on opaque independent agents delegating tasks; Agent Protocol focuses on a service API for running, streaming, managing, and introspecting agents [S13], [S14].

## ACP: Agent Communication Protocol

IBM's ACP was a lightweight, HTTP-native, REST-based standard for agent interoperability, designed for agents to send and receive messages regardless of framework, programming language, or runtime environment [S15]. It supported synchronous and asynchronous communication, SSE streaming, SDK-optional usage, and BeeAI platform integration [S15].

ACP is now strategically important mostly as history and migration context. LF AI & Data announced on 2025-08-29 that ACP was officially merging with A2A under the Linux Foundation, with ACP active development winding down and the team contributing technology and expertise into A2A [S16]. This reduced fragmentation in the agent-to-agent layer and strengthened A2A as the default open standard for cross-framework agent task exchange.

## ATP: Agent Tool Protocol

Monday.com's Agent Tool Protocol is an early code-first alternative to conventional tool calling. Instead of pre-loading large tool catalogs into the agent context, ATP lets agents discover APIs on demand and generate TypeScript/JavaScript code that executes in a secure isolated V8 VM [S17]. The repo describes a runtime SDK with APIs for LLM calls, embeddings, approvals, cache, logging, progress, and dynamic APIs from OpenAPI specs, MCP servers, or custom functions [S17].

ATP's design goal is to avoid bespoke MCP gateway sprawl by aggregating APIs behind a single server and letting the agent manipulate official APIs through sandboxed code [S17]. Its security model depends on isolation, memory/time limits, endpoint annotations, human-in-the-loop approvals, provenance tracking, and compatibility with OpenAPI and MCP [S17]. As of 2026-06-05 it is early: 98 GitHub stars, MIT license, and active TypeScript development [S17].

## Design implications

- Use MCP first when the problem is tool/data access [S07].
- Add A2A when independently deployed agents need delegation and task exchange [S08], [S09].
- Add AG-UI when users need real-time visibility and control in an application [S10], [S11].
- Use OSSA or an equivalent manifest when portability, compliance, governance, and export targets matter [S01], [S02].
- Use DUADP or an equivalent discovery/identity layer when agents need to be published, found, verified, revoked, and federated across organizations [S03], [S04].
- Treat ACP as a migration path into A2A rather than a separate 2026 standard [S16].
- Treat ATP as an experimental but interesting answer to tool-catalog overload and MCP gateway duplication [S17].

The 2025 arXiv interoperability survey supports the layered interpretation. It compares MCP, ACP, A2A, and ANP and concludes that ad hoc integrations are difficult to scale, secure, and generalize; each protocol occupies a different interoperability context [S47]. Its adoption roadmap starts with MCP for tool access, then adds messaging/collaboration and finally decentralized discovery/marketplaces [S47]. In 2026, that roadmap should be adjusted to account for ACP's merger into A2A and for emerging contract/discovery layers such as OSSA and DUADP [S01], [S03], [S16].
