# Protocols and standards

Research snapshot: May 17, 2026.

## Summary

Agent protocols are separating into layers: contract, discovery, tool access, agent-to-agent work, and agent-to-user interaction. The most defensible architecture in 2026 is not "choose MCP or A2A"; it is "use each protocol at the layer it was designed for, with identity and policy enforcement around every transition" [S09][S16][S33][S34].

## Comparative table

| Protocol | Scope | Core artifact/message | Transport | Adoption/status |
| --- | --- | --- | --- | --- |
| MCP | Agent -> tools/data/context | Tools, resources, prompts, sampling via JSON-RPC | stdio, HTTP/SSE variants | Anthropic open standard; official SDKs and many clients/servers [S05][S32][M03] |
| A2A | Agent -> agent delegation | Agent Card, task, message, artifact, parts | HTTP, SSE, JSON-RPC | Announced by Google April 2025; donated to Linux Foundation June 2025; 100+ to 150+ partner ecosystem depending source/date [S06][S07][S08][M01] |
| AG-UI | Agent -> user-facing application | Typed events for lifecycle, text, tools, state, activity | HTTP, WebSockets | Supported by LangGraph, CrewAI, Mastra, Pydantic AI, Microsoft Agent Framework, Google ADK, AWS Strands, and others [S09][M02] |
| ACP | Agent -> agent messaging | REST resources, MIME-typed multipart messages, runs | REST/HTTP | IBM BeeAI origin; now part of A2A under Linux Foundation; winding down standalone development [S12][S13] |
| ANP | Open agent network/discovery | DID identity, JSON-LD graphs, meta-protocol negotiation | Open web/P2P layers | Open-source; positions itself as "HTTP of the Agentic Web" [S10][S16][M05] |
| LangChain Agent Protocol | Agent serving API | Runs, threads, store endpoints | HTTP/OpenAPI | Framework-agnostic API; LangGraph Platform implements a superset [S11][M04] |
| DUADP | Agent discovery and trust evidence | GAID, WebFinger, DID document, federation/gossip, trust tier | DNS TXT, WebFinger, REST, MCP | Bluefly protocol/site; npm package 0.1.4; 17 MCP tools [S01][S04] |
| OSSA | Portable agent contract | YAML manifest, schemas, exports, policies | CLI/package/schema/MCP server | Bluefly package 0.5.1; bridges protocols to deployment platforms [S02][S03] |
| ATP | Agent -> API/code execution | Sandboxed code over OpenAPI/MCP connectors | HTTP/package runtime | monday.com beta-stage protocol; small repo but detailed cost/security claims [S14][S15][M12] |

## MCP: Model Context Protocol

Anthropic introduced MCP on November 25, 2024 as an open standard for connecting AI assistants to data sources, business tools, repositories, and development environments [S05]. The key problem is connector fragmentation: without a standard, every new data source requires a custom integration. MCP uses an architecture in which MCP servers expose data/capabilities and MCP clients/hosts connect to them [S05].

MCP's official announcement highlights three components: the specification and SDKs, local MCP server support in Claude Desktop, and an open-source server repository [S05]. Early adopters included Block and Apollo, while Zed, Replit, Codeium, and Sourcegraph were working with MCP for coding-agent context [S05]. The current npm metadata for `@modelcontextprotocol/sdk` shows latest 1.29.0, with a TypeScript SDK repository at 12,443 stars and release v1.29.0 in the May 17, 2026 metadata snapshot [S32][M03].

Design role: MCP is best treated as a tool/data/context protocol, not a complete agent identity or governance layer. OSSA's homepage makes this distinction directly: MCP answers "How does it access tools?", while OSSA answers "What is this agent?" and A2A answers "How do agents talk?" [S02].

## A2A: Agent2Agent Protocol

Google announced A2A on April 9, 2025 to let agents built by different vendors/frameworks discover each other, securely exchange information, and coordinate actions across enterprise platforms [S06]. A2A's design principles include agentic collaboration, existing standards, secure-by-default authentication/authorization, long-running task support, and modality agnosticism [S06].

The main artifacts are Agent Cards and task-oriented communication. Agent Cards are JSON descriptions of capabilities, allowing a client agent to pick a remote agent for a task. The protocol's task model supports lifecycle state, messages, and artifacts; messages use typed "parts" so agents can negotiate modalities and UI capabilities [S06].

On June 23, 2025, Google donated A2A to the Linux Foundation. The project was seeded with A2A specifications, SDKs, and tooling, with founding members including AWS, Cisco, Google, Microsoft, Salesforce, SAP, and ServiceNow [S07]. Google's donation blog says more than 100 companies supported the protocol at that point, while partner pages and later industry summaries cite 150+ partners [S07][S08][S33]. The repository metadata snapshot shows `a2aproject/A2A` at 23,813 stars, 2,403 forks, release v1.0.0 [M01].

## AG-UI: Agent-User Interaction Protocol

AG-UI is an open, lightweight, event-based protocol for connecting AI agents to user-facing applications [S09]. It exists because agentic apps do not fit a simple request/response model: they stream intermediate work, mix structured and unstructured I/O, update state, call tools, and often pause for human approvals [S09].

AG-UI standardizes event flow between an agentic backend and frontend over HTTP/WebSockets. Its building blocks include streaming chat, multimodality, shared state, thinking-step visualization without raw chain of thought, frontend tool calls, backend tool rendering, interrupts, sub-agents, agent steering, tool output streaming, and custom events [S09]. The docs position AG-UI alongside MCP and A2A: AG-UI for agent-user interaction, MCP for agent-tools/data, and A2A for agent-agent communication [S09].

Adoption appears broad for UI integration. The docs list direct support or partnerships across LangGraph, CrewAI, Microsoft Agent Framework, Google ADK, AWS Strands Agents, AWS Bedrock AgentCore, Mastra, Pydantic AI, Agno, LlamaIndex, AG2, and A2A middleware [S09]. Repository metadata shows `ag-ui-protocol/ag-ui` at 13,585 stars with a May 15, 2026 release [M02].

## ACP: Agent Communication Protocol

ACP is an open protocol for agent interoperability originally associated with IBM BeeAI [S12][S13]. It uses a standardized RESTful API, supports all modalities through MIME types, synchronous and asynchronous communication, streaming, stateful/stateless operations, online/offline discovery, and long-running tasks [S12]. It is framework agnostic: agents may be built with BeeAI, LangChain, CrewAI, or custom code [S12].

The important 2026 status note is that ACP is now part of A2A under the Linux Foundation, and IBM's explainer warns that the standalone ACP information may not reflect current status because the team is winding down active development and contributing its technology to A2A [S12][S13]. ACP is still useful conceptually because it shows a REST-native design philosophy and argues for no-SDK-required interoperability, unlike MCP's JSON-RPC style [S13].

## ANP: Agent Network Protocol

ANP positions itself as an open-source communication protocol defining how agents connect with each other and building an open, secure, efficient collaboration network for billions of intelligent agents [S10]. Search and paper summaries describe its vision as becoming "the HTTP of the Agentic Web" [S10][S16].

The arXiv survey characterizes ANP as a decentralized open-network protocol using W3C DIDs and JSON-LD graphs for discovery and secure collaboration [S16]. Its layered architecture is commonly described as identity/encrypted communication, meta-protocol negotiation, and application protocol layers [S16]. The repository metadata page fetched for this report showed 1,296 stars [S10][M05].

## LangChain Agent Protocol

LangChain's Agent Protocol is a framework-agnostic API for serving LLM agents in production [S11]. It centers on runs, threads, and store:

- Runs: agent executions, including stateless wait/stream patterns and background runs [S11].
- Threads: multi-turn interactions with persistent state and concurrency controls [S11].
- Store: long-term memory as persistent key-value storage [S11].

LangGraph Platform implements a superset of the protocol, while the repository provides OpenAPI documentation and generated Python server/client materials [S11]. Its repository page showed 583 stars in the fetched metadata [M04].

## DUADP: Decentralized Universal AI Discovery Protocol

DUADP fills the discovery layer. The homepage argues that MCP connects agents to tools and A2A connects agents to agents, but agents still need a way to find each other across the open web [S01]. DUADP uses DNS TXT records, WebFinger, federation/gossip, DIDs, signature checks, provenance metadata, revocation, and Cedar policy decisions [S01].

Important primitives:

- GAID: a stable lookup handle such as `agent://discover.duadp.org/agents/code-reviewer` [S01].
- WebFinger: maps GAIDs to endpoints and node manifests [S01].
- DID: supplies cryptographic identity and verification methods [S01].
- Signature/provenance: verifies what was published [S01].
- Trust tier: feeds policy enforcement such as community, signed, verified-signature, or official [S01].

The npm package `@bluefly/duadp` 0.1.4 provides a TypeScript SDK and CLI with exports for client, server, validate, crypto, DID, and conformance functions [S04].

## OSSA: Open Standard for Software Agents

OSSA is a contract layer rather than a communication transport. It defines schema-validated YAML manifests that can be exported to many targets, carrying identity, capabilities, MCP and A2A references, compliance, human-in-the-loop, cost controls, state management, trust, and lifecycle metadata [S02][S03].

OSSA is important because protocols alone do not answer what an agent is allowed to do. The homepage explicitly says MCP connects tools and A2A connects agents, but neither defines the contract [S02]. OSSA's package `@bluefly/openstandardagents` 0.5.1 exposes schemas, validation, generation, migration, mesh, agent-card, SDK, kagent, trust, workspace validation, and MCP server modules [S03].

## ATP: Agent Tool Protocol

Agent Tool Protocol is monday.com's code-execution-oriented proposal for tool/API access [S14][S15]. ATP argues that agents should often generate and execute sandboxed TypeScript/JavaScript code instead of calling many predefined tools. Its stated reasons include reducing context bloat, enabling filtering/mapping/reducing in code, parallel execution through `Promise.all`, and avoiding MCP tool-discovery overload [S14].

ATP's security posture centers on isolated V8 execution, memory limits/timeouts, annotations for destructive/sensitive APIs, allow/block lists, human approvals, provenance tracking, and OpenAPI/MCP integration [S14]. It is much less mature than MCP or A2A by community metadata: the fetched GitHub page showed 96 stars [S15][M12]. Treat ATP as an emerging design worth watching rather than a settled standard.

## Adoption guidance

- Start with MCP when the main problem is giving an agent safe access to tools, APIs, databases, files, or workflows [S05][S33][S34].
- Add A2A when independent agents need to delegate tasks, coordinate long-running work, or cross vendor/framework boundaries [S06][S07].
- Use AG-UI when the product has a real-time agent frontend that needs streaming state, tool visibility, interruptions, approvals, or multimodal user interaction [S09].
- Use OSSA or equivalent manifest contracts when governance metadata must be portable across runtimes and platforms [S02][S03].
- Evaluate DUADP/ANP-style discovery when agents must be discoverable outside one vendor's registry or within a federated/open web setting [S01][S10][S16].
- Avoid treating protocol metadata as security. Agent cards, manifests, and DIDs need runtime authorization, audit, revocation, and least-privilege enforcement [S35][S37][S38].
