# Agent Protocols and Standards

As of 2026-05-26.

## Comparative protocol table

| Protocol | Primary scope | Core artifacts | Transport/format | Adoption status |
| --- | --- | --- | --- | --- |
| MCP | Agent to tools/data/context | Servers, clients, tools, resources, prompts | JSON-RPC style protocol; local and remote transports | Broad ecosystem support across AI apps and IDEs [mcp-intro] |
| A2A | Agent to agent | Agent Card, tasks, messages, artifacts, status updates | JSON-RPC 2.0 over HTTP(S), SSE; specs also cover gRPC/REST bindings | Linux Foundation project with SDKs and broad vendor support [a2a-readme] [a2a-llms] |
| AG-UI | Agent to user-facing app | Typed events, shared state, interrupts, tool rendering | Event-based HTTP/WebSockets | Supported by LangGraph, CrewAI, Microsoft Agent Framework, Google ADK, and others [ag-ui-docs] |
| ANP | Agent network identity, secure communication, discovery | DID identity, meta-protocol negotiation, capability description | Layered protocol, W3C DID-based identity | Experimental/open community; 1,303 GitHub stars [anp-readme] [github-metrics] |
| LangChain Agent Protocol | Production agent serving API | Runs, threads, agents, store, streaming commands | OpenAPI; SSE/WebSocket for streaming | Implemented by LangGraph Platform superset; 594 GitHub stars [langchain-agent-protocol] [github-metrics] |
| IBM ACP | Lightweight agent messaging | REST endpoints, multimodal messages, metadata discovery | HTTP REST; SSE for streaming | Merged into A2A under Linux Foundation in Aug 2025 [ibm-acp] [lfai-acp-a2a] |
| AGNTCY ACP | Remote agent invocation/configuration | Agent descriptors, runs, threads, interrupts | OpenAPI REST | Archived in 2026; learnings contributed to broader standards [agntcy-acp] |
| Monday ATP | Agent to external systems via code execution | Runtime SDK, JSON-RPC messages, provenance, sandbox execution | TypeScript/JavaScript code in isolated V8 sandbox | Emerging; npm `@mondaydotcomorg/atp-protocol` v0.22.3 [monday-atp] [npm-metadata] |
| OSSA | Portable agent contract and deployment | YAML manifest, GAID/DID, Cedar policy, SBOM, exports | Schema-validated manifest plus CLI/SDK | npm `@bluefly/openstandardagents` v0.5.1 [ossa-site] [ossa-npm] |
| DUADP | Federated discovery and trust | Well-known manifest, WebFinger, GAID, DID, federation records | HTTP endpoints, DNS TXT, gossip, MCP tools | npm `@bluefly/duadp` v0.1.4 [duadp-site] [duadp-npm] |

## MCP: Model Context Protocol

Anthropic introduced MCP on 2024-11-25 as an open standard for connecting AI assistants to data sources, business tools, repositories, and development environments. MCP replaces one-off integrations with a standard architecture where developers expose data through MCP servers and AI applications connect through MCP clients. Early adopters included Block and Apollo, and development tools such as Zed, Replit, Codeium, and Sourcegraph were cited as working with MCP. [anthropic-mcp]

The current MCP documentation describes it as an open-source standard for connecting AI applications to external systems: local files, databases, search engines, calculators, workflows, and prompts. It uses the USB-C analogy: a standardized port for AI applications. MCP matters because it reduces development complexity, gives agents access to tool ecosystems, and lets users get more capable applications without every app building bespoke connectors. [mcp-intro]

MCP's main primitives are:

- Host/application: the AI app or agent runtime.
- Client: the component that manages a connection to an MCP server.
- Server: the external capability provider.
- Tools: executable functions.
- Resources: data sources exposed by URI.
- Prompts: reusable prompt templates.

Security note: MCP is powerful because it reaches real tools. MCPShield identifies risks such as tool poisoning, rug pulls, cross-server data leakage, capability chaining, server impersonation, memory poisoning, session hijacking, and cross-protocol confusion. [mcp-shield]

## A2A: Agent2Agent Protocol

Google announced A2A on 2025-04-09 as an open protocol for agent interoperability. The announcement positioned A2A as complementary to MCP: MCP gives agents tools and context; A2A lets agents collaborate with other agents across vendors and frameworks. Google listed more than 50 launch partners and emphasized HTTP, SSE, JSON-RPC, secure-by-default authentication and authorization, long-running tasks, and modality-agnostic exchange. [google-a2a]

The A2A project README now describes A2A as an open Linux Foundation project contributed by Google. Its goal is communication and interoperability between opaque agentic applications: agents can discover each other, negotiate modalities, collaborate on long-running tasks, and avoid exposing internal state, memory, or proprietary tools. [a2a-readme]

Key A2A concepts:

- Agent Card: JSON metadata, normally at `/.well-known/agent-card.json`, describing identity, endpoints, interfaces, capabilities, skills, input/output MIME types, and security schemes.
- Task: stateful unit of work with status, history, artifacts, and metadata.
- Message and Part: multi-turn payload structure supporting text, data, URLs, and binary references.
- Artifact: task output.
- Streaming: task status and artifact updates over SSE.
- Security: HTTPS/TLS in production, OpenAPI-style security schemes, push notification protections. [a2a-llms]

ACP convergence matters: IBM Research and Google announced in August 2025 that ACP would merge into A2A under Linux Foundation governance, with BeeAI moving toward A2A adapters. [lfai-acp-a2a]

## AG-UI: Agent-User Interaction Protocol

AG-UI is an open, lightweight, event-based protocol for connecting agentic backends to user-facing applications. It standardizes agent state, UI intents, user interactions, tool visualization, interrupts, and frontend tool calls. It is not A2A and not MCP: it covers the agent-to-user-interface layer. [ag-ui-docs]

AG-UI is valuable because user-facing agents break the classic request/response frontend model. Long-running work, streaming intermediate steps, nondeterministic tool use, multimodal content, shared state, and human approvals require structured event streams rather than ad hoc WebSocket messages. [ag-ui-docs]

AG-UI supports or tracks integrations with LangGraph, CrewAI, Microsoft Agent Framework, Google ADK, AWS Strands Agents, Bedrock AgentCore, Mastra, Pydantic AI, Agno, LlamaIndex, AG2, A2A middleware, and multiple SDK languages. [ag-ui-docs]

## ANP: Agent Network Protocol

ANP aims to become "the HTTP of the Agentic Web era." Its vision is an open, secure, efficient collaboration network for billions of intelligent agents. ANP focuses on moving the agent internet from platform-centric silos to protocol-centric open interconnection. [anp-readme]

ANP's architecture has three layers:

1. Identity and secure communication layer: W3C DID-based decentralized identity and end-to-end encrypted communication.
2. Meta-protocol layer: negotiation of communication protocols between agents.
3. Application protocol layer: semantic description of capabilities and supported application protocols. [anp-readme]

ANP is more ambitious and more experimental than MCP or A2A. It addresses discovery, identity, secure communication, and protocol negotiation, not only task delegation.

## LangChain Agent Protocol

LangChain's Agent Protocol codifies framework-agnostic APIs for serving LLM agents in production. Its core concepts are runs, threads, agents, store, and streaming. [langchain-agent-protocol]

The design is runtime-oriented:

- Runs execute an agent, either as ephemeral one-shot calls, background jobs, blocking waits, or streams.
- Threads organize multi-turn state and history, with concurrency controls and revision logs.
- Agents endpoints expose metadata and JSON schemas for input, output, state, and config.
- Store endpoints provide long-term memory with namespace/key CRUD and search.
- Streaming endpoints cover thread-centric live execution through SSE and WebSocket commands. [langchain-agent-protocol]

This protocol is less about Internet-scale discovery and more about a stable API surface for deploying and introspecting agents.

## ACP variants

### IBM Agent Communication Protocol

IBM ACP was a lightweight, HTTP-native, SDK-optional standard for agent messaging across frameworks, programming languages, and runtimes. It supported REST endpoints, multimodal messages, async-first workflows, synchronous low-latency calls, SSE streaming, and offline/secure metadata discovery. IBM explicitly states that ACP is now part of A2A under the Linux Foundation. [ibm-acp] [lfai-acp-a2a]

### AGNTCY Agent Connect Protocol

AGNTCY's ACP specification defined a standard interface to invoke and configure remote agents over an OpenAPI-described REST API. It included agent search, agent descriptors, stateless and thread-based execution, and interrupts for human-in-the-loop workflows. The repository was archived in 2026, and search results indicate AGNTCY is contributing learnings toward broader standards such as A2A. [agntcy-acp]

## Monday Agent Tool Protocol

Monday.com's Agent Tool Protocol (ATP) takes a different stance: agents interact with external systems by generating and executing TypeScript/JavaScript code in a secure isolated V8 environment. The repository describes sandboxed code execution with memory limits and timeouts, a runtime SDK for LLM calls, embeddings, approvals, caching and logging, stateless scaling, provenance tracking, OpenAPI and MCP compatibility, and LangChain/LangGraph client tools. [monday-atp]

ATP is aimed at the gateway problem: instead of stuffing many tool schemas into context or building bespoke aggregators, an agent can discover APIs and write constrained code that chains operations. That increases expressiveness but raises sandbox, provenance, and approval requirements.

## OSSA and DUADP in the stack

OSSA defines portable agent contracts. DUADP discovers and verifies those contracts across domains. Together they fill a gap that MCP, A2A, and AG-UI do not fully cover:

- persistent agent identity;
- manifest-level governance and policy;
- SBOM/provenance references;
- cross-platform export;
- trust-tier-aware discovery;
- federation and revocation. [ossa-site] [duadp-site]

DUADP's public endpoint advertises discovery, registry, search, validation, federation, identity, governance, health, metrics, and 17 MCP tools. The npm SDK provides client/server router support, validation, Ed25519 signing, DID resolution, and conformance tests. [duadp-site] [duadp-npm]

## Adoption trends

- MCP is the most widely adopted tool/context layer and is supported by major assistants and IDEs. [mcp-intro]
- A2A has become the focal point for agent-to-agent standardization after ACP convergence. [a2a-readme] [lfai-acp-a2a]
- AG-UI is gaining traction because production agents need visible progress, approvals, state sync, and frontend integration. [ag-ui-docs]
- ANP, DUADP, and KYA-style proposals reflect the unsolved identity/discovery/delegation layer. [anp-readme] [duadp-site] [harvard-jolt-agentic-web]
- Agent protocol design is now explicitly security-driven: identity, attestation, least privilege, context isolation, and auditability appear in both research and product guidance. [nist-agent-identity] [protocol-threat-modeling] [mcp-shield]
