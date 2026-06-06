# Industry Standards and Open Protocols

Date of research: 2026-06-06.

## Layered view

Agent protocols are converging into a layered stack:

| Layer | Protocols | Main question answered |
| --- | --- | --- |
| Tool/data access | MCP, ATP | How does an agent call tools, APIs, databases, and workflows? |
| Agent contract | OSSA | What is this agent, what can it do, and what policies apply? |
| Agent-to-agent coordination | A2A, ACP | How do independent agents discover capabilities and exchange tasks? |
| Agent-to-user interaction | AG-UI | How does an agent stream state, messages, tools, and UI events to frontends? |
| Discovery/network identity | DUADP, ANP | How do agents and registries find and verify each other across the web? |
| IDE/client control | Agent Client Protocol | How does an editor drive a coding agent independent of vendor plugins? |

## Comparative table

| Protocol | Purpose | Scope | Formats/transports | Adoption status |
| --- | --- | --- | --- | --- |
| MCP | Agent/model to tools and data | Tool discovery/invocation, resources, prompts | JSON-RPC style protocol; local and remote servers; SDKs | Anthropic-originated open standard, early adopters include Block, Apollo, Replit, Zed, Codeium, Sourcegraph; broad ecosystem growth. [S01] |
| A2A | Agent-to-agent interoperability | Agent Cards, task lifecycle, artifacts, messages, multimodal parts | HTTP, SSE, JSON-RPC; JSON Agent Cards | Google launched 2025-04-09 with 50+ partners; later reporting says 150+ organizations in ecosystem sources. [S02] [S25] |
| AG-UI | Agent-to-frontend interaction | Streaming events, state sync, tool calls, human collaboration | Typed JSON events over SSE, WebSockets, webhooks, HTTP binary/text | Open event protocol with CopilotKit support and framework adapters. [S04] |
| ANP | Open-network agent communication/discovery | DID identity, encrypted communication, meta-protocol negotiation, application description/discovery | W3C DIDs, did:wba, HTTP signatures, JSON-LD, semantic web specs | Community/W3C-oriented white paper and GitHub project; 1,316 stars in fetched GitHub metadata. [S07] |
| LangChain Agent Protocol | Framework-agnostic agent runtime API | Runs, threads, store, introspection | HTTP API; schema/API contract | GitHub repo has 603 stars; used around LangGraph/LangServe ecosystem. [S08] |
| ACP - Agent Communication Protocol | REST-native agent messaging | Multipart messages, async interactions, sessions | HTTP REST, MIME multipart | IBM/BeeAI-origin protocol; industry sources report consolidation into A2A under LF AI & Data. [S25] [S21] |
| ACP - Agent Client Protocol | IDE-to-coding-agent control | Editor/agent sessions, prompts, diffs, permission prompts | JSON-RPC over stdio; streamable HTTP draft | Developed openly by JetBrains and Zed; LSP-like goal for coding agents. [S26] |
| ATP - Agent Tool Protocol | Code-first tool/API execution | Aggregates APIs/MCP, sandboxed TypeScript execution, approvals | TypeScript/JavaScript in isolated V8 runtime; npm packages | Monday.com-origin project; GitHub repo 94 stars; `@mondaydotcomorg/atp-server` has about 7.1K weekly downloads in fetched registry metadata. [S34] |
| OSSA | Portable agent contract | Identity, role, tools, capabilities, workflow, governance, policy binding, exports | YAML/JSON schemas, CLI, npm package | `@bluefly/openstandardagents` latest npm 0.5.6; 23+ export targets claimed by site. [S06] [S44] |
| DUADP | Decentralized discovery | GAIDs, WebFinger, DIDs, federation, trust tiers, MCP/REST discovery | HTTP well-known endpoints, DNS TXT, WebFinger, gossip, MCP tools | `@bluefly/duadp` latest npm 0.1.7; reference site reports live federation and 17 MCP tools. [S05] [S43] |

## MCP - Model Context Protocol

Anthropic introduced MCP on 2024-11-25 as an open standard for connecting AI assistants to systems where data lives. The announcement describes MCP as a way to replace fragmented, one-off connectors with secure two-way connections between MCP clients and MCP servers. The early ecosystem included prebuilt servers for Google Drive, Slack, GitHub, Git, Postgres, and Puppeteer, plus adopters or implementers such as Block, Apollo, Zed, Replit, Codeium, and Sourcegraph. [S01]

MCP's strength is vertical integration: agents get a standard way to discover and invoke tools and data. Its weakness is that the protocol does not by itself solve identity, authorization, tool trust, or tool poisoning. Research identifies 16 MCP threat scenarios and multiple attacker perspectives; tool poisoning embeds malicious behavior or hidden instructions in tools while preserving legitimate interfaces. [S17]

## A2A - Agent2Agent Protocol

Google announced Agent2Agent on 2025-04-09 as an open protocol that lets agents built by different vendors or frameworks collaborate. A2A is task-oriented: a client agent formulates work, a remote agent acts on that task, and the output is an artifact. Agents advertise capability through Agent Cards in JSON, and messages carry typed "parts" to support modality and UI negotiation. [S02]

Google's design principles are agentic capabilities, existing standards, secure-by-default authentication/authorization, long-running task support, and modality agnosticism. A2A complements MCP: MCP connects agents to tools; A2A connects agents to other agents. [S02]

## AG-UI - Agent User Interaction

AG-UI is an open, lightweight, event-based protocol for agent-to-frontend communication. It standardizes event streams for text, tool calls, lifecycle state, reasoning, shared state, and human collaboration. It is transport-agnostic and can use SSE, WebSockets, webhooks, text streaming, or binary HTTP. [S04]

AG-UI matters because agent UIs otherwise become custom protocol islands. It is complementary to A2A and MCP: MCP provides tools, A2A provides agent collaboration, and AG-UI lets users see and interact with agent state in real time. [S04]

## ANP - Agent Network Protocol

ANP's stated vision is to become "the HTTP of the Agentic Web era." Its architecture has three layers: identity and secure communication based on W3C DIDs, a meta-protocol negotiation layer, and an application protocol layer based on semantic web specifications and JSON-LD for capability description and discovery. [S07]

ANP is more ambitious than enterprise task exchange. It targets decentralized, internet-scale agent communication, with DID authentication, encrypted communication, protocol negotiation, agent description, and discovery. Its did:wba work extends `did:web` for agent-oriented authentication. [S07]

## LangChain Agent Protocol

LangChain's Agent Protocol codifies a framework-agnostic API for running, managing, and introspecting agents. It is useful where an application wants to talk to different agent runtimes through shared concepts such as runs, threads, and storage rather than framework-specific APIs. The GitHub repo metadata fetched for this report showed 603 stars. [S08]

## ACP: two meanings

"ACP" is overloaded. In interoperability surveys, ACP commonly means IBM/BeeAI's Agent Communication Protocol: REST-native, multipart, asynchronous agent messaging. Multiple 2026 industry sources report that ACP has consolidated into A2A under Linux Foundation governance, so new enterprise work should evaluate A2A first while understanding ACP's persistent-state and async concepts. [S21] [S25]

In coding tools, ACP also means Agent Client Protocol from JetBrains and Zed. This is a separate IDE-to-agent protocol, analogous to LSP. It uses JSON-RPC over stdio with streamable HTTP in draft discussion, allowing editors and coding agents to interoperate without one-off plugins. [S26]

## Monday.com Agent Tool Protocol

Monday.com's Agent Tool Protocol (ATP) is a code-first alternative/complement to conventional tool calling. It lets agents generate TypeScript/JavaScript that executes in isolated V8 sandboxes with timeouts, memory limits, no default file/network access, API aggregation, provenance tracking, approvals, caching, and observability. ATP can aggregate OpenAPI, custom APIs, and MCP servers behind one server. [S34]

ATP's central design difference is that the agent composes code against a restricted runtime rather than selecting one function call at a time. That increases expressiveness but makes sandboxing, provenance, approvals, and policy controls central to the security model. [S34]

## OSSA - contract layer

OSSA sits above protocols and below deployment platforms. It does not replace MCP or A2A; it references and exports to them. The site positions it as the missing contract for identity, capabilities, compliance, lifecycle, security, and trust. The npm package includes schemas, validation utilities, CLI commands, OpenAPI contracts, reference manifests, and well-known discovery assets. [S06] [S44]

The local repository is the `@bluefly/openstandardagents` package. Its `package.json` reports version 0.5.1, while npm reports 0.5.6 as the current stable release published 2026-06-03. [S44]

## DUADP - discovery layer

DUADP fills a different gap: universal discovery. It uses well-known documents, DNS TXT, WebFinger, GAID handles, DIDs, Ed25519 signatures, trust tiers, federation, gossip, and MCP/REST endpoints so agents, skills, and tools can be found across organizations. [S05] [S43]

The npm package `@bluefly/duadp` 0.1.7 includes a client, Express server router, validation, crypto, DID resolution, and conformance tests. The package README says DUADP bridges MCP tool servers and Google A2A agent cards into a unified registry and uses OSSA-native `.ajson` payloads. [S43]

## Protocol adoption pattern

The conservative adoption sequence is:

1. Define contracts and governance first with OSSA or an equivalent manifest.
2. Use MCP for tool access where the agent needs external capabilities.
3. Add deterministic authorization around MCP tool calls before production.
4. Add A2A when agents from different teams, vendors, or runtimes need task exchange.
5. Add AG-UI when user-facing state, progress, and approvals must be streamed.
6. Add DUADP or ANP when discovery crosses registry, organization, or open-web boundaries.
