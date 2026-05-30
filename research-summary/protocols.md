# Protocols and Standards

Prepared as of May 30, 2026.

## Comparison table

| Protocol | Primary scope | Main artifact / transport | Adoption status | Security notes |
|---|---|---|---|---|
| MCP | Agent-to-tool/context | JSON-RPC; servers expose tools, resources, prompts | Broad; 20/30 MIT-indexed agents support MCP | Security is implementation-dependent [S07][S10]. |
| A2A | Agent-to-agent tasks | HTTP, SSE, JSON-RPC; Agent Cards, tasks, artifacts | Linux Foundation; 150+ orgs in 2026 | Signed Agent Cards and enterprise auth in v1 [S11][S12]. |
| AG-UI | Agent-to-user UI | Event stream over HTTP/SSE/WebSockets | Active GitHub project; 13,917 stars | UI event/audit boundary [S13]. |
| ANP | Agentic web network | DID layer, meta-protocol, app protocol | Active protocol/spec community | DID-based auth and E2EE emphasis [S14]. |
| ACP | REST agent interoperability | REST API; sync/async; multimodal | Now part of A2A under Linux Foundation | Lightweight, SDK-optional [S16]. |
| LangChain Agent Protocol | Serving/running agents | OpenAPI; runs, threads, store | v0.1.6 API docs; LangGraph-compatible | Operational API; not an identity standard [S15]. |
| DUADP | Discovery/federation | Well-known, WebFinger, DNS TXT, gossip, MCP tools | npm `@bluefly/duadp` v0.1.4 | DID, GAID, trust tiers, signatures [S01][S04]. |
| OSSA | Agent contract/manifest | YAML/JSON Schema; CLI exports | npm `@bluefly/openstandardagents` v0.5.1 | Signed manifests, Cedar, NIST mappings [S02][S03]. |
| ATP | Agent-to-API/code execution | Sandboxed TypeScript/JS execution | Early GitHub project; npm packages active | V8 isolation, approvals, provenance [S31]. |

## Model Context Protocol (MCP)

Anthropic introduced MCP on November 25, 2024 as an open standard for connecting AI assistants to systems where data lives: content repositories, business tools, development environments, databases, and other applications [S10]. MCP replaces fragmented custom integrations with a single client-server architecture. Developers expose data through MCP servers, and AI applications act as MCP clients that consume tools, resources, and prompts [S10].

MCP is best understood as the tool and context layer. It does not define what an agent is, how agents discover each other, or how an agent's governance envelope is represented. That is why OSSA can reference MCP servers in a manifest, and why A2A can complement MCP for agent-to-agent coordination [S02][S10][S11]. MIT's index found MCP support in 20 of 30 prominent agents, which suggests MCP is becoming a de facto tool integration substrate [S07].

## Agent2Agent (A2A)

Google announced A2A on April 9, 2025 with more than 50 launch partners. A2A addresses how independent agents, built by different vendors or frameworks, securely exchange information and coordinate work across enterprise systems [S11]. It deliberately complements MCP: MCP gives agents tools and context, while A2A lets agents collaborate with other agents [S11].

A2A's design principles are existing standards, enterprise security, long-running task support, and modality agnosticism. Its core concepts are client agents, remote agents, Agent Cards in JSON format for capability discovery, task lifecycle management, messages, and artifacts [S11]. The Linux Foundation reported on April 9, 2026 that A2A had become a production-ready open standard with more than 150 supporting organizations, cloud platform integrations, v1.0, Signed Agent Cards, multi-tenancy, and SDKs in JavaScript, Java, Go, .NET, and Python [S12].

## AG-UI

AG-UI is the Agent-User Interaction Protocol. It standardizes how agent backends connect to front-end applications through a lightweight event-based stream [S13]. The project positions itself as the last-mile protocol for streaming chat, state synchronization, frontend tools, generative UI, and human-in-the-loop collaboration [S13].

AG-UI is transport-flexible: HTTP/SSE/WebSockets are common choices, and implementations emit a standard set of event types during agent execution [S13][S24]. In a full stack, AG-UI is not a replacement for MCP or A2A. It is the user interaction boundary: the place where a user sees tool calls, approves actions, receives progress, and synchronizes UI state [S13][S24].

## Agent Network Protocol (ANP)

ANP aims to become the "HTTP of the Agentic Web" and defines how agents connect in an open, secure collaboration network [S14]. Its architecture has three main layers: an identity and secure communication layer based on W3C DIDs, a meta-protocol layer for negotiating communication protocols, and an application protocol layer for describing capabilities and supported protocols [S14].

ANP is more ambitious than a single REST API. It is trying to define identity, negotiation, discovery, semantic descriptions, and domain-specific application protocols. This makes it conceptually closer to a web architecture for agents, while A2A is more immediately focused on interoperable task coordination [S11][S12][S14].

## Agent Communication Protocol (ACP)

ACP was introduced by IBM BeeAI and is now part of A2A under the Linux Foundation [S16]. It is a REST-based, SDK-optional protocol for connecting AI agents, applications, and humans. Its features include multimodal messages, synchronous and asynchronous communication, streaming, stateful and stateless patterns, offline discovery, and long-running tasks [S16].

ACP's strength is adoption simplicity. It uses familiar REST endpoints rather than requiring specialized transports. In practice, ACP looks like the lightweight path for teams that need agent interoperability inside production HTTP infrastructure, while A2A handles broader multi-agent task lifecycle and cross-vendor coordination [S16][S25].

## LangChain Agent Protocol

LangChain's Agent Protocol is an OpenAPI 3.1.0 specification, v0.1.6 at the consulted docs, for running and interacting with agents in production [S15]. It centers on runs, threads, and store endpoints. A run invokes an agent, optionally on a thread. Threads organize multi-turn state. Store APIs provide long-term memory operations [S15].

This protocol solves an operational serving problem rather than a web identity problem. It helps a client or platform invoke, stream, wait for, and inspect agent executions regardless of the framework behind the service. It pairs naturally with LangGraph and LangGraph Platform, but its abstractions can be implemented by other agent servers [S15][S18].

## DUADP and OSSA

DUADP provides decentralized discovery: well-known endpoints, WebFinger, DNS TXT records, gossip federation, DID-backed identities, GAID lookup handles, and trust-tier filtering [S01][S04]. It fills the gap between having agents and finding trustworthy agents across organizational boundaries. The TypeScript SDK supports client and server implementations, signing, validation, DID resolution, and conformance tests [S04].

OSSA provides the contract: a manifest that defines the agent and exports to runtime-specific packages [S02][S03]. OSSA is intentionally not MCP or A2A. It references and packages those protocols, adds identity and governance fields, and creates a portable artifact for validation, review, and deployment [S02][S03]. Together, OSSA and DUADP map well to the identity/discovery/governance gap highlighted by NIST and Gravitee [S26][S27].

## Monday.com Agent Tool Protocol (ATP)

ATP is an emerging protocol from monday.com that lets agents write and execute TypeScript/JavaScript code in a secure sandbox instead of only choosing from predefined function calls [S31]. It aggregates OpenAPI, MCP, and custom APIs, then gives agents runtime APIs such as `atp.llm`, `atp.embedding`, `atp.approval`, `atp.cache`, `atp.log`, `atp.progress`, and `atp.api` [S31].

ATP is early, with 97 GitHub stars at collection time, but it is important because it represents a different design philosophy: use constrained code execution for complex parallel API logic while enforcing V8 isolation, timeouts, memory limits, approvals, logging, and provenance [S31].
