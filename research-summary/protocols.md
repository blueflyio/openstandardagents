# Protocols and open standards

Compiled on 2026-05-25.

## Layer map

| Layer | Protocol | Scope | Primary artifact |
| --- | --- | --- | --- |
| Agent contract | OSSA | Portable definition, governance, deployment | YAML manifest, schemas, exports |
| Discovery | DUADP | Federated lookup and trust | `.well-known`, DNS TXT, WebFinger, gossip |
| Tool/data access | MCP | Agent-to-tool/context | Tools, resources, prompts over MCP |
| Agent collaboration | A2A | Agent-to-agent task exchange | Agent Card, tasks, messages, artifacts |
| UI interaction | AG-UI | Agent-to-frontend event stream | Standard events over HTTP/WebSockets |
| Agent network | ANP | Identity, negotiation, app protocols | DID layer, meta-protocol, semantic app layer |
| Lightweight messaging | ACP | REST-native agent messaging | HTTP endpoints, async/sync messages |
| Production serving API | LangChain Agent Protocol | Framework-agnostic run/thread/store API | REST/OpenAPI endpoints |
| Code-first tool execution | monday ATP | Sandboxed code execution for tool use | TypeScript/JavaScript in V8 sandbox |

## OSSA

OSSA is a contract layer, not a transport protocol. It defines what an agent is, what it can access, what governance applies, and how the definition exports to runtimes such as Docker, Kubernetes, LangChain, CrewAI, GitLab Duo, Claude Code, Cursor, Drupal, MCP, A2A, and npm [S2][S3]. The current npm package exposes schema, validation, generation, migration, mesh, agent-card, SDK, trust, and workspace-validation APIs [S3].

Security is part of the manifest model. The OSSA site describes GAID/DID identity, signed manifests, Cedar policy integration, trust tiers, human-in-the-loop metadata, compliance modeling, cost controls, observability, and supply-chain evidence such as SBOM pointers [S2][S6].

## DUADP

DUADP is the discovery layer for agents, skills, and tools. It uses DNS TXT records, `.well-known` discovery, WebFinger, gossip federation, DID identity, signatures, trust tiers, and policy-aware routing [S1][S5]. Its npm SDK provides client/server helpers, validation, Ed25519 crypto, DID resolution, and conformance testing [S4][S5].

The website frames DUADP as the missing answer to "how do agents find each other?" MCP connects tools, A2A connects agents, and DUADP lets agents discover capabilities across a federated mesh without a central registry [S1].

## Model Context Protocol (MCP)

Anthropic introduced MCP on 2024-11-25 as an open standard for connecting AI assistants to systems where data lives. MCP replaces fragmented custom integrations with a single protocol and supports secure two-way connections between MCP clients and MCP servers [S21].

The current MCP documentation describes it as an open-source standard for connecting AI applications to external systems: local files, databases, search engines, calculators, workflows, prompts, and tools. It uses the "USB-C port for AI applications" analogy and notes broad support from clients such as Claude, ChatGPT, Visual Studio Code, Cursor, and others [S22].

## Agent2Agent (A2A)

Google announced A2A on 2025-04-09 as an open protocol for cross-vendor, cross-framework agent interoperability. It launched with more than 50 technology and service partners, including Atlassian, Box, Cohere, LangChain, MongoDB, PayPal, Salesforce, SAP, ServiceNow, Accenture, Deloitte, KPMG, PwC, TCS, and Wipro [S23].

A2A's design principles are agentic collaboration, existing web standards, secure-by-default authentication/authorization, long-running tasks, real-time updates, and modality-agnostic messages [S23]. Current A2A docs say the protocol was originally developed by Google and donated to the Linux Foundation. A2A provides agent-to-agent communication, while MCP provides agent-to-tool communication [S24].

Core primitives include Agent Cards for capability discovery, tasks with lifecycle state, messages, artifacts, and parts for multimodal content and UI negotiation [S23][S24].

## AG-UI

AG-UI is an open, lightweight, event-based protocol for connecting agentic backends to user-facing applications [S25]. It standardizes how agent state, UI intents, user interactions, streaming output, interrupts, tool outputs, shared state, and custom events flow between frontend and backend [S25].

AG-UI is complementary to MCP and A2A. MCP is agent-to-tool/data; A2A is agent-to-agent; AG-UI is agent-to-user-interface [S25]. Integrations listed in the docs include LangGraph, CrewAI, Microsoft Agent Framework, Google ADK, AWS Strands Agents, AWS Bedrock AgentCore, Mastra, Pydantic AI, Agno, LlamaIndex, and AG2, with OpenAI Agents SDK and Cloudflare Agents in progress [S25].

## Agent Network Protocol (ANP)

ANP aims to become "the HTTP of the Agentic Web era" [S26]. Its vision is an open, secure, efficient collaboration network for billions of agents, shifting from platform-centric silos toward protocol-centric, AI-native networks [S26].

ANP uses a three-layer architecture:

| Layer | Purpose |
| --- | --- |
| Identity and secure communication | W3C DID-based authentication and end-to-end encrypted communication |
| Meta-protocol | Negotiation of communication protocols between agents |
| Application protocol | Semantic descriptions of capabilities and supported application protocols |

Search metadata on 2026-05-25 reported `agent-network-protocol/AgentNetworkProtocol` at about 1.3k stars, Apache-2.0, latest release V1.0 in 2025, and active pushes in 2026 [S27].

## LangChain Agent Protocol

LangChain Agent Protocol codifies framework-agnostic APIs needed to serve LLM agents in production [S28][S29]. Its three central resources are:

| Resource | Role |
| --- | --- |
| Runs | Execute an agent, including streaming and wait endpoints |
| Threads | Organize stateful multi-turn interactions |
| Store | Manage long-term memory items and namespaces |

The protocol is REST/OpenAPI oriented. LangGraph Platform implements it, and the LangChain blog says any agent developer can implement it regardless of framework [S28][S29].

## Agent Communication Protocol (ACP)

IBM's ACP is a lightweight, HTTP-native open standard for agent-to-agent messaging across frameworks, languages, and runtimes [S30]. It uses REST principles, optional SDKs, synchronous and asynchronous modes, and SSE for streaming [S30].

ACP's status changed in 2025. LFAI & Data announced on 2025-08-29 that ACP was merging into A2A under the Linux Foundation; ACP active standalone development would wind down and migration paths would be provided [S31]. For new designs, ACP should be treated as a contributing lineage to A2A rather than a separate long-term bet.

## monday.com Agent Tool Protocol (ATP)

monday.com announced agent infrastructure in 2026 for external agents to sign up, authenticate, and operate within monday.com, including project organization, workflow updates, automations, reports, and coordination [S32].

The open-source `mondaycom/agent-tool-protocol` is a code-first protocol for agents to interact with external systems by generating and executing TypeScript/JavaScript in a secure sandbox. Search metadata reported about 94 stars and features such as isolated V8 VMs, memory limits, timeouts, LLM calls, embeddings, approvals, caching, logging, stateless architecture, OpenAPI compatibility, MCP compatibility, and provenance tracking against prompt injection [S33].

## Design comparison

| Protocol | Best fit | Avoid using it for |
| --- | --- | --- |
| MCP | Tool and data connectors | Agent-to-agent delegation as the main abstraction |
| A2A | Cross-vendor task delegation | Simple single-agent tool calls |
| AG-UI | Streaming agent UX and HITL UI | Backend tool discovery |
| DUADP | Federated discovery and trust | Runtime orchestration by itself |
| OSSA | Portable contract and governance | Low-level message transport |
| ANP | Broad agent-web identity/negotiation | Immediate enterprise app integration without maturity review |
| Agent Protocol | Serving, introspection, runs/threads/store | Discovery or identity |
| ATP | Complex tool actions needing sandboxed code | Simple deterministic API calls where function-calling is enough |
