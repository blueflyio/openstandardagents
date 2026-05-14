# Protocols and Standards

## Comparison table

| Protocol | Main scope | Formats/transports | Discovery | Adoption status |
| --- | --- | --- | --- | --- |
| OSSA | Portable agent contract | YAML/JSON manifest, JSON Schema | DUADP, registries, exports | npm v0.5.1, 23+ targets claimed [S01][S04] |
| DUADP | Federated agent/skill/tool discovery | HTTP REST, WebFinger, DNS TXT, gossip, MCP tools | GAID, DID, DNS, WebFinger | npm v0.1.4, 36 indexed resources on site [S03][S05] |
| MCP | Agent-to-tool/data | JSON-RPC client/server | Server configs and registries | Broad adoption; Anthropic, Block, Apollo, Replit, Zed, Sourcegraph [S13] |
| A2A | Agent-to-agent tasks | HTTP, SSE, JSON-RPC, gRPC in v0.3 | Agent Cards | 50+ launch partners, 150+ organizations by July 2025 [S14][S15] |
| AG-UI | Agent-to-user interface | Event-based HTTP, SSE, WebSockets | SDK/client integration | 13,535 GitHub stars; multiple framework integrations [S16][S22] |
| ANP | Decentralized agent network | DIDs, JSON-LD, semantic descriptions, negotiation | Decentralized identifiers | 1,296 GitHub stars; early open-source protocol [S18] |
| Agent Protocol | Agent serving API | REST/OpenAPI, SSE/WebSocket streaming | Agent introspection endpoints | 582 GitHub stars; LangGraph Platform superset [S19] |
| ACP | Lightweight agent messaging | REST HTTP, SSE, multimodal messages | Metadata/offline discovery | Now part of A2A under Linux Foundation [S20] |
| ATP | Secure code execution for tools | TypeScript/JS code in V8 sandbox | API discovery, OpenAPI/MCP bridges | 96 GitHub stars; monday.com protocol [S21][S24] |

## OSSA: Open Standard for Software Agents

OSSA is a contract specification rather than a transport protocol. Its central artifact is an agent manifest that defines identity, role, LLM configuration, tools, trust boundaries, governance, lifecycle, cost controls, and platform extensions [S01][S02]. The public site describes OSSA as the missing layer between agent protocols and deployment platforms: MCP answers "how does the agent access tools?", A2A answers "how do agents talk?", and OSSA answers "what is this agent?" [S01].

The npm package `@bluefly/openstandardagents` is currently v0.5.1 with Apache-2.0 license, CLI binaries (`ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, `ossa-mcp`), schema exports, validation/generation/migration services, trust services, agent-card generation, MCP server support, and platform adapters [S04]. The local repository description says it exports one manifest to Docker, Kubernetes, LangChain, CrewAI, Claude Skills, and other platforms [S04].

Security primitives emphasized by OSSA include W3C DID-compatible GAID identity, signed manifests, Cedar policies, SBOM/provenance pointers, human-in-the-loop workflows, cost controls, and compliance metadata for SOC2, HIPAA, GDPR, FedRAMP, and NIST mappings [S01][S04]. In this landscape, OSSA is best understood as the auditable "contract layer" around tools, protocols, and runtimes.

## DUADP: Decentralized Universal AI Discovery Protocol

DUADP is the discovery layer for agents, tools, and skills. The website calls it "DNS for AI agents" and explains that it combines federated DNS, WebFinger, gossip protocol, and DIDs so any agent can find another agent without a central registry or vendor lock-in [S03].

DUADP's identity pipeline is: GAID lookup handle, WebFinger endpoint resolution, DID document for cryptographic identity, signatures/provenance for integrity, and trust-tier policy enforcement through Cedar-style rules [S03]. The homepage lists trust tiers from community to signed, verified-signature, and official, and exposes evidence APIs, revocation, provenance, governance audit, and risk surfaces [S03].

The npm package `@bluefly/duadp` is v0.1.4, Apache-2.0, TypeScript-first, and provides subpath exports for client, server, validation, crypto, DID resolution, and conformance testing [S05][S06]. Its README describes 15 core protocol endpoints, including `/.well-known/duadp.json`, `/.well-known/webfinger`, registries for skills/agents/tools, publish, validate, and federation peer endpoints [S06]. The website also lists 17 MCP tools covering discovery, search, publishing, validation, federation, identity, governance, and health [S03].

DUADP is complementary to OSSA. OSSA defines signed, governed payloads; DUADP discovers and verifies them across domains [S01][S03][S06].

## MCP: Model Context Protocol

Anthropic introduced MCP on November 25, 2024 as an open standard for connecting AI assistants to systems where data lives, including content repositories, business tools, and developer environments [S13]. MCP replaces fragmented custom integrations with a universal client/server protocol for secure, two-way connections between MCP clients and MCP servers [S13].

The initial release included the specification and SDKs, Claude Desktop local server support, and a repository of pre-built servers for Google Drive, Slack, GitHub, Git, Postgres, and Puppeteer [S13]. Early adopters named by Anthropic included Block and Apollo, with development tools such as Zed, Replit, Codeium, and Sourcegraph integrating MCP to provide coding context [S13].

MCP is best for agent-to-tool and agent-to-data integration. It does not itself define a complete agent identity, governance contract, decentralized discovery mesh, or agent-to-agent task lifecycle; those are handled by adjacent layers such as OSSA, DUADP, A2A, or ANP [S01][S03][S13].

## A2A: Agent2Agent Protocol

Google announced A2A on April 9, 2025 to let agents built by different vendors or frameworks communicate, securely exchange information, and coordinate actions across enterprise platforms [S14]. It launched with more than 50 technology and service partners, including Atlassian, Box, Cohere, Intuit, LangChain, MongoDB, PayPal, Salesforce, SAP, ServiceNow, Workday, Accenture, Deloitte, McKinsey, PwC, and others [S14].

A2A design principles are: embrace agentic capabilities without requiring agents to expose internal memory or tools; build on HTTP, SSE, and JSON-RPC; support enterprise auth; support long-running tasks; and remain modality agnostic [S14]. Its key objects include Agent Cards for JSON capability discovery, task lifecycles, artifacts, messages, and content "parts" for modality negotiation [S14].

By July 31, 2025, Google reported A2A v0.3 with gRPC support, signed security cards, extended Python SDK support, native ADK support, and an ecosystem of more than 150 organizations [S15]. The official A2A docs now describe it as a Linux Foundation open standard for local/remote agents and humans, complementary to MCP and incorporating IBM ACP [S17].

## AG-UI: Agent-User Interaction Protocol

AG-UI standardizes communication between AI agents and user-facing applications. It is an event-based protocol for bidirectional state, UI intents, user interactions, tool visualization, interrupts, streaming, multimodality, generative UI, shared state, frontend tool calls, and sub-agent composition [S16].

AG-UI occupies a separate layer from MCP and A2A. MCP connects agents to tools/data; A2A connects agents to agents; AG-UI connects agents to user-facing applications [S16]. It uses event-based HTTP/WebSocket patterns and has supported integrations with LangGraph, CrewAI, Microsoft Agent Framework, Google ADK, AWS Strands, AWS Bedrock AgentCore, Mastra, Pydantic AI, Agno, LlamaIndex, AG2, A2A middleware, and CopilotKit [S16]. Its GitHub repository had 13,535 stars when fetched [S22].

## ANP: Agent Network Protocol

ANP is an open-source protocol for agent communication whose vision is to define how agents connect into an open, secure, efficient collaboration network for billions of intelligent agents [S18]. Search results and the ANP repository describe a three-layer architecture: an identity and secure communication layer based on W3C DIDs, a meta-protocol negotiation layer, and an application protocol layer using semantic web-style capability descriptions [S18].

ANP is more decentralized and web-native than A2A. It targets open-network discovery, identity, negotiation, and semantic interoperability rather than only enterprise task delegation. Its GitHub repository had 1,296 stars when fetched [S18]. In practical adoption, ANP is earlier-stage than MCP and A2A, but it is important because it addresses decentralized identity and open agent network formation [S41].

## LangChain Agent Protocol

LangChain's Agent Protocol is a framework-agnostic API for serving LLM agents in production [S19]. It centers on runs, threads, store/memory, messages, agent introspection, background runs, and streaming primitives [S19].

Its endpoints include stateless runs (`POST /runs/wait`, `POST /runs/stream`), thread CRUD/history/copy, agent search/schema introspection, background run creation/cancel/wait/stream, store CRUD/search, and thread-centric streaming over SSE/WebSocket [S19]. LangGraph Platform implements a superset, and the repository includes Python server stubs, OpenAPI docs, JSON spec, and example self-hosted agent servers [S19].

This is not a network federation protocol like A2A/ANP. It is an API contract for running, managing, introspecting, and observing agent services.

## ACP: Agent Communication Protocol

IBM Research describes ACP as an open standard for seamless communication between agents regardless of framework, language, or runtime [S20]. ACP is lightweight, HTTP-native, SDK-optional, asynchronous by default, synchronous when needed, and supports multimodal messages, SSE streaming, REST endpoints, metadata discovery, and secure/offline discovery [S20].

ACP was developed to reduce fragmentation across modular agents for retrieval, reasoning, classification, and tool use [S20]. IBM now notes that ACP is part of A2A under Linux Foundation governance, which makes it less a separate long-term competitor and more a contributor to the A2A protocol family [S17][S20].

## Monday.com Agent Tool Protocol (ATP)

ATP takes a different approach: agents generate and execute TypeScript/JavaScript code in secure V8 sandboxes rather than invoking one tool call at a time [S21]. It supports OpenAPI/Swagger loading, custom TypeScript APIs, MCP servers, client-side tools, pause/resume for LLM callbacks or human approvals, semantic API discovery, OpenTelemetry, caching, rate limits, token management, and provenance tracking [S21].

ATP is best understood as a secure code-execution/tool orchestration protocol. It may reduce token-heavy tool schemas and allow parallel operations, but it also raises sandboxing, provenance, and policy-enforcement requirements [S21].

## Protocol selection

Use MCP for tool/data access. Use A2A for cross-agent delegation. Use AG-UI for interactive applications. Use Agent Protocol for serving and managing agent runs. Use ACP-style REST messaging for lightweight compatibility or as part of the A2A ecosystem. Use ANP or DUADP where decentralized discovery, DIDs, and federation are central. Use OSSA when the missing piece is not transport but a portable, signed, governed contract.
