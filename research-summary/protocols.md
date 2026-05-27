# Protocols, Standards, and Interoperability

Prepared on May 27, 2026. Citations use tether IDs from `reading-list.md`.

## Comparison table

| Protocol or spec | Primary scope | Message/artifact format | Discovery model | Adoption/status |
| --- | --- | --- | --- | --- |
| MCP | Agent to tools/data | JSON-RPC; tools/resources/prompts; SDK schemas | MCP servers listed/configured by clients | Official spec repo; 8,235 GitHub stars; TypeScript SDK 1.29.0 [S05][S33] |
| A2A | Agent to agent | HTTP, SSE, JSON-RPC; Agent Cards; tasks/artifacts/messages | Agent Card JSON descriptors | Google-launched; v1.0.0 on GitHub; 24,025 stars [S06][S33] |
| AG-UI | Agent to user interface | Typed event streams over HTTP, SSE, WebSockets | Client/framework integrations | 13,870 GitHub stars; broad framework integration list [S07][S33] |
| DUADP | Agent/skill/tool discovery and federation | REST plus MCP tools; GAID, DID, WebFinger, DNS TXT | `/.well-known`, WebFinger, gossip federation | `@bluefly/duadp` 0.1.4; live DUADP node and npm SDK [S01][S04][S32] |
| OSSA | Portable agent contract and deployment manifest | YAML/JSON schema manifest; CLI export artifacts | Registry/workspace plus DUADP integration | `@bluefly/openstandardagents` 0.5.1; Apache-2.0 [S02][S03][S32] |
| ANP | Agent network communication | DID-based identity, semantic web descriptions, app protocols | Agent description documents and DID methods | 1,304 GitHub stars; three-layer architecture [S08][S33] |
| LangChain Agent Protocol | Production agent API | REST/OpenAPI; runs, threads, store, agents, streaming | Agent introspection endpoints | 594 GitHub stars; LangGraph Platform superset [S09][S33] |
| ACP | Lightweight agent communication | REST/HTTP; sync/async; metadata manifests | BeeAI/Linux Foundation ecosystem | IBM Research describes RESTful HTTP, no SDK required [S10] |
| ATP | Agent to external systems via code execution | TypeScript/JavaScript executed in V8 isolates | API search over OpenAPI/MCP/custom providers | `@mondaydotcomorg/atp-client` 0.24.0; repo 96 stars [S11][S32][S33] |

## MCP: Model Context Protocol

Anthropic introduced MCP on November 25, 2024 as an open standard for connecting AI assistants to systems where data lives, including content repositories, business tools, and development environments [S05]. The stated goal is to replace fragmented custom integrations with a single protocol that lets developers expose data through MCP servers or build MCP clients that connect to those servers [S05].

MCP's design center is agent-to-tool and agent-to-data connectivity. It is not primarily an agent-to-agent protocol or UI protocol. Its ecosystem includes SDKs, local Claude Desktop support, and prebuilt servers for systems such as Google Drive, Slack, GitHub, Git, Postgres, and Puppeteer [S05]. Early adopters and tooling partners named by Anthropic included Block, Apollo, Zed, Replit, Codeium, and Sourcegraph [S05].

Security implications: MCP standardizes a powerful boundary. Because MCP servers can expose sensitive data and execute actions, the security model needs authentication, authorization, tool scoping, logging, and gateway controls. NIST, Gravitee, and 2026 security research all point to identity and pre-action authorization as necessary companions [S16][S17][S29].

## A2A: Agent2Agent Protocol

Google announced A2A on April 9, 2025 as an open protocol for collaboration among agents built by different vendors or frameworks [S06]. The protocol complements MCP: MCP provides tools and context; A2A enables agents to communicate and coordinate [S06].

Google's design principles are:

- Embrace agentic capabilities rather than reducing every agent to a tool.
- Build on HTTP, SSE, and JSON-RPC.
- Support enterprise-grade authentication and authorization.
- Support long-running tasks with feedback, notifications, and state updates.
- Be modality agnostic, including audio and video streaming [S06].

Core objects include Agent Cards for capability discovery, tasks with lifecycle state, messages, parts, artifacts, and user-experience negotiation [S06]. As of May 27, 2026, the GitHub repository shows v1.0.0 and 24,025 stars [S33].

## AG-UI: Agent-User Interaction Protocol

AG-UI fills the frontend boundary. It is an open, lightweight, event-based protocol for connecting AI agent backends to user-facing applications [S07]. Its focus is bidirectional user interaction: agent state, UI intents, human input, events, interrupts, and live streaming across HTTP/WebSockets/SSE [S07].

The protocol exists because agentic apps break simple request/response UI patterns. Agents are long-running, stream intermediate work, mix structured and unstructured IO, and need user-interactive composition [S07]. AG-UI defines building blocks such as streaming chat, typed attachments, shared state, frontend tool calls, backend tool rendering, human-in-the-loop interrupts, sub-agent composition, steering, tool-output streaming, and custom events [S07].

AG-UI is complementary to MCP and A2A: MCP exposes tools/data, A2A coordinates agents, and AG-UI gives humans a way to observe, guide, approve, and interrupt [S07].

## DUADP: Decentralized Universal AI Discovery Protocol

DUADP addresses discovery. The site describes the missing layer this way: agents are everywhere, but they cannot find each other; DUADP is "like DNS, but for AI" [S01]. It combines DNS TXT records, WebFinger, federated search, gossip propagation, DIDs, signatures, trust tiers, revocation, governance endpoints, and MCP tools [S01].

Important primitives:

- GAID: portable handle such as `agent://discover.duadp.org/agents/code-reviewer` [S01].
- DID: cryptographic identity, with support described for `did:web`, `did:key`, and `did:pkh` in SDK contexts [S01].
- WebFinger: maps GAID handles to real endpoints [S01].
- Trust tier: policy input after identity resolves and signatures verify [S01].
- Federation: peers register and share resources across the mesh, deduplicating by content hash and attributing source nodes [S01].

The npm SDK `@bluefly/duadp` is a TypeScript package for client and server implementation. It exposes a client for consuming nodes, an Express router for implementing nodes, validation, Ed25519 signing/verification, DID resolution, and conformance tests [S04].

## OSSA: Open Standard for Software Agents

OSSA is a contract layer, not a transport protocol. The Open Standard Agents site states that MCP connects tools and A2A connects agents, but neither defines the portable contract for what the agent is, what it can access, and under what governance rules [S02].

OSSA's artifact is a schema-validated YAML manifest. It can describe identity, capabilities, tools, autonomy, compliance, human oversight, cost controls, state management, team definitions, observability, and platform export targets [S02][S03]. It integrates with MCP by referencing MCP servers/tools and with A2A by generating or carrying agent-to-agent metadata [S03].

OSSA's strongest contribution to the ecosystem is packaging plus governance: a single artifact can be validated, diffed, signed, exported, and used as a compliance/audit surface [S02][S03].

## ANP: Agent Network Protocol

ANP aims to become "the HTTP of the Agentic Web era" [S08]. Its stated vision is an open, secure, efficient collaboration network for billions of agents, shifting from platform-centric silos to protocol-centric interconnection [S08].

Its three-layer architecture is:

1. Identity and secure communication layer based on W3C DIDs and end-to-end encryption.
2. Meta-protocol layer for negotiating communication protocols between agents.
3. Application protocol layer based on semantic web specifications for describing capabilities and supported protocols [S08].

ANP overlaps with DUADP in identity and discovery ambition, but ANP is broader as a general agent communication network while DUADP is specifically discovery/federation of agents, skills, and tools with OSSA-native payloads [S01][S08].

## LangChain Agent Protocol

LangChain's Agent Protocol codifies framework-agnostic APIs needed to serve LLM agents in production [S09]. It is a REST/OpenAPI-style interface centered on:

- Runs: executing an agent.
- Threads: organizing multi-turn executions.
- Store: working with long-term memory.
- Agents: introspection of agent capabilities and schemas.
- Streaming: SSE/WebSocket primitives for live execution, replay, nested namespaces, state snapshots, tool lifecycle events, and human-in-the-loop input [S09].

This protocol is especially relevant for framework interoperability and deployment infrastructure. LangGraph's local server and LangGraph Platform implement or extend it, and other frameworks can be wrapped into LangGraph nodes [S09].

## ACP: Agent Communication Protocol

IBM Research describes ACP as a shared language for agents to connect and collaborate [S10]. ACP is implemented over RESTful HTTP, supports synchronous and asynchronous interactions, can be used with curl/Postman/browser clients, and lets agents carry metadata for discovery even in secure or air-gapped setups [S10].

ACP's position is lightweight and enterprise-friendly: MCP connects agents to tools and knowledge, while ACP connects agents to agents [S10]. IBM contributed BeeAI to the Linux Foundation, and ACP powers BeeAI's discovery, running, and composition of agents [S10].

ACP and A2A overlap in agent-to-agent scope. ACP's differentiator is simplicity and REST-first ergonomics; A2A's differentiator is richer task lifecycle, Agent Cards, partner ecosystem, and long-running coordination semantics [S06][S10].

## ATP: Agent Tool Protocol

Monday.com's Agent Tool Protocol is a code-first alternative to traditional function-calling tool protocols [S11]. ATP lets an agent generate and execute TypeScript/JavaScript in isolated V8 VMs with memory limits and timeouts [S11].

ATP's rationale is that large tool schemas and sequential function calls can cause context bloat, token cost, and limited inline data processing. ATP instead gives agents code execution over a controlled runtime SDK:

- `atp.api.*` for dynamic APIs from OpenAPI, MCP, or custom functions.
- `atp.llm.*`, `atp.embedding.*`, `atp.approval.*`, `atp.cache.*`, `atp.log.*`, and `atp.progress.*` [S11].
- Provenance tracking, security policies, AST analysis, audit logging, and proxy mode for prompt-injection defense [S11].

ATP is powerful but changes the risk profile. It needs sandboxing, provenance, policy, audit, and approval by design because it explicitly grants agents a programming substrate [S11].

## Architecture guidance

- Use MCP when a single agent or agent team needs standardized access to external tools/data [S05].
- Use A2A or ACP when independent agents need task delegation, collaboration, or peer interaction [S06][S10].
- Use AG-UI when users need to see, steer, interrupt, approve, or consume multimodal agent progress [S07].
- Use OSSA when agent definitions must be portable, validated, governed, signed, and exported across platforms [S02][S03].
- Use DUADP or ANP when agents need cross-domain discovery, identity, and federation [S01][S08].
- Use ATP only when code execution is a good fit and the sandbox/audit/security posture is explicit [S11].
