# Protocols and standards

Generated on 2026-05-31.

## Summary

The 2026 agent protocol landscape is best understood as a stack. MCP standardizes agent-to-tool/data access. A2A standardizes opaque agent-to-agent task exchange. AG-UI standardizes agent-to-frontend event streams. ANP explores decentralized agent networking. LangChain Agent Protocol and AgentProtocol.ai define framework-agnostic run/thread/task APIs. OSSA and DUADP add two missing infrastructure layers: a portable agent contract and federated discovery [S01], [S03], [S05], [S06], [S09], [S11], [S12], [S13].

## Comparative table

| Protocol | Scope | Format / transport | Discovery | Adoption status |
| --- | --- | --- | --- | --- |
| OSSA | Agent contract and export manifest | YAML/JSON schemas, CLI exports | References DUADP, A2A, MCP | Early; npm 0.5.1, 49 weekly downloads [S02] |
| DUADP | Federated discovery for agents, skills, tools | HTTP endpoints, DNS TXT, WebFinger-style lookup, gossip | Core purpose | Early; npm 0.1.4, 16 weekly downloads [S04] |
| MCP | Agent to tools/data/context | JSON-RPC; stdio/SSE/HTTP patterns | Server/tool discovery | Broad; official Anthropic standard, many IDEs/tools [S05] |
| A2A | Agent to agent collaboration | JSON-RPC 2.0 over HTTP(S), SSE, push; SDKs | Agent Cards | Strong; 24,069 GitHub stars on 2026-05-31 [S07] |
| AG-UI | Agent to user interface | Typed event stream over SSE/WebSockets/webhooks | Client/framework integration | Strong npm signal; `@ag-ui/core` 854.7K weekly downloads [S10] |
| ANP | Decentralized agent network | DID-based secure communication, meta-protocol negotiation, application protocols | DIDs and semantic descriptions | Early; 1,307 GitHub stars on 2026-05-31 [S11] |
| LangChain Agent Protocol | Agent serving API | OpenAPI, REST, SSE/WebSocket streaming | Agent introspection endpoints | Niche; 597 GitHub stars on 2026-05-31 [S12] |
| AgentProtocol.ai | Universal agent task API | OpenAPI/REST task and step endpoints | Not primary focus | Used by AutoGPT ecosystem [S13] |
| ACP | Legacy agent communication | REST/HTTP, MIME messages, SSE | Agent metadata | Merged into A2A under Linux Foundation [S14] |

## OSSA: Open Standard for Software Agents

OSSA is not a runtime and not a message protocol. It is a contract layer for defining agents before they run. The homepage describes OSSA as "like OpenAPI, but for AI agents": a manifest that can be validated and exported to many platforms [S01].

The npm package `@bluefly/openstandardagents` describes OSSA as an infrastructure bridge between protocols and deployment platforms. It explicitly states that OSSA consumes MCP, builds on A2A, and adds deployment/packaging metadata above communication protocols [S02].

Important OSSA concepts:

- Portable manifest: identity, role, LLM config, tools, autonomy, budgets, compliance, observability, team topology, and export metadata [S01], [S02].
- Export targets: npm metadata lists LangChain, MCP, npm, agent-skills as production exports; other targets include CrewAI, Claude Code, Cursor, Docker, Kubernetes, GitLab Duo, A2A, OpenAI Agents SDK, and more at beta/alpha maturity [S02].
- Identity and governance: OSSA uses GAID/DID concepts, signed manifests, Cedar policies, compliance metadata, trust tiers, and SBOM/provenance pointers [S01], [S02].
- MCP server: the project ships an MCP server for validating, scaffolding, converting, inspecting, publishing, diffing, and migrating manifests [S01], [S02].

The key distinction is that OSSA answers "what is this agent and what are its declared boundaries?" MCP answers "what can this agent call?" and A2A answers "how does it communicate with another agent?" [S01], [S02], [S05], [S06].

## DUADP: Decentralized Universal AI Discovery Protocol

DUADP is the discovery counterpart to OSSA. It describes itself as "DNS for AI agents" and uses DNS TXT records, `.well-known` endpoints, WebFinger-like resolution, DID identity, signatures, and gossip federation to let agents, tools, and skills be found across domains [S03], [S04].

The npm package `@bluefly/duadp` provides:

- Client APIs for node discovery, search, pagination, agents, skills, tools, and federation [S04].
- Server router APIs for turning an Express app into a DUADP node [S04].
- Validation for OSSA resources [S04].
- Ed25519 signing and verification [S04].
- DID resolution for `did:web` and `did:key` [S04].
- Conformance testing for protocol compliance [S04].

The DUADP homepage currently advertises a broader reference surface than the npm SDK: 17 MCP tools, NIST governance endpoints, revocation mesh, federation witnesses, policy checks, provenance, and a `duadp://` desktop bridge [S03]. The npm package describes 15 core endpoints plus reference-node governance extensions [S04]. This suggests the project is moving quickly; implementers should pin package/spec versions and run conformance tests rather than relying only on homepage claims.

## MCP: Model Context Protocol

Anthropic introduced MCP on 2024-11-25 as an open standard for connecting AI assistants to data sources, business tools, content repositories, and development environments [S05]. MCP replaces fragmented custom integrations with a single protocol and supports secure two-way connections between MCP clients and MCP servers [S05].

Core architecture:

- MCP servers expose tools, resources, and prompts.
- MCP clients are AI applications that connect to servers.
- Implementers can use SDKs and pre-built servers for systems such as Google Drive, Slack, GitHub, Git, Postgres, and Puppeteer [S05].

Early adopters and ecosystem signals include Block, Apollo, Zed, Replit, Codeium, and Sourcegraph in the original announcement [S05]. By 2026, MCP is widely treated as the default tool/data integration standard in framework docs and production blogs [S24], [S32], [S34].

## A2A: Agent2Agent

Google announced A2A on 2025-04-09 with more than 50 launch partners and a goal of enabling agents built by different vendors or frameworks to collaborate securely [S06]. The protocol complements MCP: MCP gives agents tools and context; A2A lets agents collaborate with other opaque agents [S06], [S07].

Design principles:

- Agentic capabilities without forcing remote agents to expose memory, tools, or implementation details [S06], [S07].
- Existing standards: HTTP, SSE, JSON-RPC [S06].
- Secure-by-default posture with enterprise-grade authentication and authorization aligned with OpenAPI auth schemes [S06].
- Long-running task support with status updates, notifications, artifacts, and human-in-the-loop flows [S06], [S07].
- Modality-agnostic message parts for text, files, structured JSON, audio, video, and UI negotiation [S06], [S07].

A2A's core discovery artifact is the Agent Card: a JSON description of capabilities and connection info. The current A2A README lists SDKs for Python, Go, JavaScript, Java, and .NET, plus Apache-2.0 licensing and Linux Foundation governance [S07]. The `@a2a-js/sdk` package is version 0.3.13 and exports client/server, Express, and gRPC subpaths [S08].

## AG-UI

AG-UI, the Agent-User Interaction Protocol, standardizes how agent backends connect to user-facing applications. It is open, lightweight, event-based, and works over transports such as SSE, WebSockets, and webhooks [S09].

AG-UI's core abstraction is a stream of typed events. `@ag-ui/core` provides TypeScript definitions and runtime schemas for messages, state, run inputs, and 16 core streaming event kinds [S10]. The GitHub README says AG-UI is complementary to MCP and A2A: MCP gives agents tools, A2A lets agents communicate, and AG-UI brings agents into applications [S09].

Adoption signals are strong: AG-UI has first-party or supported integrations with CopilotKit, LangGraph, CrewAI, Microsoft Agent Framework, Google ADK, AWS Strands Agents, Mastra, Pydantic AI, LlamaIndex, AG2, and A2A [S09]. The npm package `@ag-ui/core` had 854.7K weekly downloads in the latest registry metadata [S10].

## ANP: Agent Network Protocol

ANP aims to be the "HTTP of the Agentic Web" [S11]. It is less focused on enterprise task delegation than A2A and more focused on decentralized agent networking.

The project describes a three-layer architecture:

1. Identity and secure communication layer based on W3C DIDs, decentralized identity authentication, and encrypted communication.
2. Meta-protocol layer for negotiating communication protocols between agents.
3. Application protocol layer for describing capabilities and supported application protocols using semantic web ideas [S11].

ANP's DID direction overlaps with DUADP's identity story, but the emphasis differs. ANP is a network protocol vision; DUADP is a concrete discovery registry/federation SDK with npm/PyPI packages and HTTP endpoints [S03], [S04], [S11].

## LangChain Agent Protocol and AgentProtocol.ai

LangChain's Agent Protocol defines framework-agnostic APIs for serving LLM agents in production. It centers on three concepts: runs, threads, and store [S12].

- Runs execute agents, including one-shot, background, wait, stream, cancel, and delete flows [S12].
- Threads organize multi-turn state, history, concurrency, copy, delete, and patch operations [S12].
- Store manages long-term memory by namespace/key with search endpoints [S12].

It also defines agent introspection endpoints and streaming primitives for filtered SSE/WebSocket streams, replay, nested agents, tool lifecycle events, checkpoints, tasks, and custom events [S12]. LangGraph Platform implements a superset of this protocol [S12].

AgentProtocol.ai is a different but related OpenAPI-style effort focused on task creation, step execution, artifact upload/download, and standardized benchmarking across agent projects such as AutoGPT [S13].

## ACP and consolidation into A2A

ACP, IBM Research's BeeAI-era Agent Communication Protocol, was a REST/HTTP protocol for agent interoperability. In 2025 it was donated to the Linux Foundation with BeeAI and later merged into A2A to consolidate agent communication standards [S14].

The practical conclusion is simple: do not start new 2026 projects on standalone ACP unless required by a legacy system. Treat A2A as the active migration target and monitor how ACP design ideas are incorporated into A2A [S14].

## Other emerging protocols

The broader ecosystem also includes commerce and payment-oriented agent protocols such as UCP, AP2, x402, A2UI-style UI rendering efforts, and experimental agent identity/web-conduct specifications [S39], [S40]. These are relevant when agents transact, pay, or render user interfaces, but for most enterprise agent architecture the immediate stack is: OSSA/manifest, DUADP/discovery when needed, MCP/tools, A2A/collaboration, AG-UI/frontend, plus runtime-specific guardrails.
