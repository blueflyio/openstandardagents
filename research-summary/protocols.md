# Agentic AI Protocols and Standards

Prepared: 2026-05-20

## High-level map

The agent protocol landscape is best read as a layered stack. Each protocol solves a different interoperability problem; most production architectures will combine several rather than choose one universal standard.

| Protocol | Main scope | Format/transport | Adoption status |
| --- | --- | --- | --- |
| MCP | Agent to tools/data | JSON-RPC, client-server | Broad ecosystem; official SDKs [S04][S30] |
| A2A | Agent to agent | HTTP, SSE, JSON-RPC, Agent Cards | Google/LF project; 150+ orgs by Aug. 2025 [S05][S15] |
| AG-UI | Agent to UI | Event streams over HTTP/WebSocket/SSE | Supported by LangGraph, CrewAI, Mastra, Microsoft Agent Framework, others [S06] |
| ACP | REST-native agent messaging | REST HTTP, MIME messages | BeeAI/Linux Foundation; now part of A2A [S10] |
| ANP | Agentic web network/discovery | W3C DID, semantic web, JSON-LD | Open-source, W3C CG-aligned, early adoption [S11][S25] |
| LangChain Agent Protocol | Framework-agnostic run API | HTTP/OpenAPI-style endpoints | LangChain ecosystem, 587 GitHub stars [S12] |
| OSSA | Agent contract and deployment | YAML/JSON Schema, exports | Npm package, CLI, manifests, 23+ export targets [S02][S31] |
| DUADP | Discovery and federation | DNS, WebFinger, REST, MCP tools, DID | Live site and npm package v0.1.4 [S01][S03][S32] |

## OSSA: Open Standard for Software Agents

OSSA is not a tool protocol like MCP and not an execution framework like CrewAI. It is a portable agent contract layer. The official site describes the problem as an M x N configuration explosion: every framework and platform uses a different agent definition, duplicating 40-60% of configuration across targets [S02].

OSSA manifests capture identity, capabilities, compliance, lifecycle, security, trust, cost controls, human-in-the-loop policies, state, MCP connections, A2A metadata, and platform export metadata. The package exports schemas, validators, generators, migration services, a CLI, and an MCP server [S02][S31].

OSSA's security posture is contract-first. It introduces Global Agent Identifiers (GAIDs), signed manifests, Cedar policy integration, supply-chain metadata, trust tiers, and NIST/FedRAMP-style compliance mappings [S02]. This places OSSA between communication protocols and deployment platforms: MCP describes tools; A2A describes agent communication; OSSA describes the governed agent artifact that references both.

## DUADP: Decentralized Universal AI Discovery Protocol

DUADP addresses the discovery gap: agents cannot use other agents or skills if they cannot find and verify them. DUADP combines federated DNS, WebFinger-style resolution, gossip federation, W3C DID identity, GAIDs, signature verification, trust tiers, and policy-aware discovery [S01][S03].

The official DUADP site describes it as "DNS for AI agents" and reports version 0.1.4, 17 MCP tools, federation enabled, and 36 indexed resources at the time of collection [S01]. The OpenStandardAgents DUADP spec describes conformance endpoints, including `/.well-known/duadp.json`, `/api/v1/agents`, `/api/v1/skills`, search, publish, validate, governance, health, federation, identity, and metrics [S03].

DUADP is intentionally separate from OSSA. The analogy used in the spec is that DNS tells you where to find things, HTTP tells you how to talk to them, DUADP tells agents where to find AI capabilities, and OSSA describes what those capabilities are [S03].

## MCP: Model Context Protocol

Anthropic announced MCP on 2024-11-25 as an open standard for connecting AI assistants to the systems where data lives. MCP replaces fragmented custom integrations with a standard protocol for secure, two-way connections between data sources and AI-powered tools [S04].

MCP has a straightforward client-server architecture. Developers expose data and actions through MCP servers, while AI applications act as MCP clients. Anthropic's launch included the specification and SDKs, Claude Desktop support, and pre-built servers for systems such as Google Drive, Slack, GitHub, Git, Postgres, and Puppeteer [S04].

Early adopters included Block and Apollo, while Zed, Replit, Codeium, and Sourcegraph were working with MCP to improve development tools [S04]. The npm package `@modelcontextprotocol/sdk` was version 1.29.0 at collection time [S30].

MCP is strongest when an agent needs governed access to tools, resources, prompts, and external systems. It does not by itself define agent identity, delegation, or platform deployment contracts; those are complementary layers.

## A2A: Agent2Agent Protocol

Google announced A2A on 2025-04-09 as an open protocol for agents built by different vendors or frameworks to communicate, securely exchange information, and coordinate actions across enterprise platforms [S05].

A2A design principles include embracing agentic capabilities, using existing web standards, being secure by default, supporting long-running tasks, and being modality agnostic. It uses Agent Cards in JSON format for capability discovery, task lifecycle objects for work management, messages and artifacts for collaboration, and user-experience negotiation through content parts [S05].

The August 2025 Google Cloud update reported A2A version 0.3, gRPC support, signed security cards, extended Python SDK support, and more than 150 supporting organizations. Google also contributed A2A to the Linux Foundation in June 2025 [S15].

A2A complements MCP: MCP lets an agent use tools; A2A lets agents delegate and coordinate work with each other [S05].

## AG-UI: Agent-User Interaction Protocol

AG-UI is an open, lightweight, event-based protocol for connecting agents to user-facing applications. It standardizes how agent state, UI intents, user interactions, tool outputs, and interactive updates flow between agentic backends and frontend apps [S06].

AG-UI is transport-flexible and built over web foundations such as HTTP, WebSockets, SSE, and webhooks. It focuses on long-running, streaming, multimodal, interactive experiences that do not fit traditional REST request-response patterns [S06].

AG-UI is positioned as the third layer in a common protocol stack: MCP for agent-to-tools, A2A for agent-to-agent, and AG-UI for agent-to-user interaction [S06]. Its integrations include LangGraph, CrewAI, Microsoft Agent Framework, Google ADK, AWS Strands, AWS Bedrock AgentCore, Mastra, Pydantic AI, LlamaIndex, AG2, A2A middleware, and multiple SDK/client efforts [S06].

## ACP: Agent Communication Protocol

ACP is an open protocol for agent interoperability using standardized RESTful APIs. It supports all modalities, synchronous and asynchronous communication, streaming, stateful and stateless patterns, online/offline discovery, and long-running tasks [S10].

The ACP docs note an important status update: ACP is now part of A2A under the Linux Foundation [S10]. That means ACP should be treated as a REST-native messaging profile or influence within the broader A2A family, not as a permanently separate competing standard.

ACP's strengths are simplicity and integration with standard HTTP tooling. It can be used with curl, Postman, browsers, or SDKs, and its REST orientation makes it easier for existing enterprise teams to adopt [S10].

## ANP: Agent Network Protocol

ANP describes itself as an open-source protocol for agent communication with a vision of building an open, secure, efficient collaboration network for billions of intelligent agents [S11].

Its architecture is often summarized in three layers:

1. Identity and secure communication based on W3C DIDs.
2. Meta-protocol negotiation so agents can agree on how to communicate.
3. Application protocol layer for describing capabilities and supported protocols [S11][S25].

The ANP GitHub repository had about 1,299 stars at collection time [S11]. Compared with A2A and MCP, ANP is more explicitly oriented toward decentralized open-network discovery and semantic identity rather than enterprise task delegation alone.

## LangChain Agent Protocol

LangChain's Agent Protocol is a framework-agnostic API specification for running, managing, and introspecting agents. Its core API surfaces are runs, threads, and store endpoints [S12].

The protocol includes stateless runs, streaming runs, thread management, persistent state/history, run operations, and long-term memory store APIs. Its purpose is to let agents built in different frameworks expose a common serving surface [S12].

The repository had about 587 GitHub stars at collection time [S12]. Adoption is strongest where LangGraph/LangChain systems need a stable API boundary.

## Emerging and adjacent protocols

Other protocol work is relevant but less mature or outside the core request scope:

- **Agent Tool Protocol from monday.com:** an emerging vendor-specific proposal for agent/tool interoperability; public information was less complete than MCP, A2A, AG-UI, ACP, ANP, and OSSA/DUADP during this research pass.
- **Agent permissions manifests:** Harvard and related research point to `agent-permissions.json`-style concepts for websites to declare allowed agent interactions, similar in spirit to robots.txt but with agent-specific authorization [S24].
- **Payment and commerce protocols:** Visa TAP, Mastercard Agentic Token, Google AP2, and Coinbase x402 are emerging around agentic commerce and verifiable delegated payments [S24].
- **OASF and W3C AI Agent Protocol Community Group:** Ruh.ai highlights Open Agentic Schema Framework and W3C community work as emerging schema/standardization efforts [S19].

## Comparative observations

1. **MCP won early mindshare for tools.** It has official SDKs, IDE integrations, and a simple client-server model [S04][S30].
2. **A2A is the main enterprise inter-agent contender.** Its industry support, Linux Foundation path, Agent Cards, long-running task semantics, and Google Cloud tooling give it momentum [S05][S15].
3. **AG-UI fills a real missing layer.** Production agents need streaming, state synchronization, interrupts, tool visualization, and human approval flows in frontends [S06].
4. **ACP is valuable for REST-native teams.** Its merger into A2A suggests consolidation rather than fragmentation [S10].
5. **ANP, DUADP, and OSSA emphasize identity/discovery/contracts.** These are the pieces most closely aligned with security and governance requirements [S01][S02][S03][S11].

## Recommended layered architecture

Use OSSA as the system-of-record for the agent contract, publish discovery through DUADP and A2A Agent Cards, expose tools through MCP, coordinate agents with A2A or ACP profiles, use AG-UI for frontend interaction, and enforce security through identity-aware gateways and policy engines.
