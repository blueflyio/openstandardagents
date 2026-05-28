# Protocols and standards

Research compiled as of 2026-05-28.

## Comparative view

| Protocol | Scope | Core artifact | Transport / format | Adoption signal |
| --- | --- | --- | --- | --- |
| MCP | Agent to tools/data/context | Server exposing tools/resources/prompts | JSON-RPC, client/server | Major ecosystem adoption; early adopters included Block, Apollo, Replit, Codeium, Sourcegraph [T18] |
| A2A | Agent to agent | Agent Card, task lifecycle | HTTP(S), JSON-RPC, SSE, gRPC in v0.3 | 150+ supporting organizations; Linux Foundation project; 24,042 GitHub stars [T19][T20] |
| AG-UI | Agent to frontend/user | Typed event stream | SSE, WebSockets, webhooks, HTTP | 13,894 GitHub stars; integrations with LangGraph/CrewAI/CopilotKit ecosystem [T21][T36] |
| DUADP | Agent/skill/tool discovery | Well-known manifest, GAID, DID, registry records | DNS TXT, WebFinger, REST, MCP tools, gossip | `@bluefly/duadp` v0.1.4; live public network claims 36 indexed resources [T02][T05][T07] |
| OSSA | Agent contract/manifest | YAML/JSON `.ossa` or `.ajson` manifest | JSON Schema, CLI, MCP server, exports | `@bluefly/openstandardagents` v0.5.1; 23+ export targets in site docs [T01][T03][T07] |
| ANP | Agent network communication | DID identity + capability descriptions | DID, semantic web, meta-protocol | 1,304 GitHub stars; "HTTP of the Agentic Web" vision [T22] |
| LangChain Agent Protocol | Agent serving API | Runs, threads, store | REST/OpenAPI | 595 GitHub stars; implemented by LangGraph server surfaces [T23] |
| ACP | Lightweight agent/app/human messaging | REST API and sessions | HTTP/REST, SSE, multimodal messages | 1,004 GitHub stars; BeeAI ACP now merged/part of A2A [T24] |
| ATP | Code-first tool interaction | Sandboxed TypeScript/JavaScript execution config | JSON-RPC-like protocol, V8 sandbox, SDK callbacks | monday.com packages on npm; server 0.25.0, client 0.24.0 [T25][T35] |

## MCP: Model Context Protocol

Anthropic introduced MCP on 2024-11-25 as an open standard for connecting AI assistants to systems where data lives, including repositories, business tools, and development environments [T18]. Its design replaces one-off connectors with a universal client/server pattern: data/tool owners expose MCP servers, and AI applications act as MCP clients [T18].

MCP's key contribution is standardizing tools, resources, prompts, and context access. The announcement shipped a specification, SDKs, local Claude Desktop support, and an open-source server repository. Early adopters included Block and Apollo, with Zed, Replit, Codeium, and Sourcegraph working on support [T18].

MCP is best understood as vertical integration: one agent or host connects to many tools. It does not define who an agent is, how agents find each other, or how two agents coordinate work. OSSA and DUADP intentionally fill adjacent layers: OSSA describes the agent contract, while DUADP handles discovery [T01][T02][T18].

## A2A: Agent2Agent

A2A is the primary open standard for cross-agent delegation and interoperability. The Google Cloud August 2025 update describes A2A v0.3 with a more stable interface, gRPC support, signed security cards, extended Python SDK client support, and enterprise deployment paths across Agent Engine, Cloud Run, and GKE [T19].

A2A's discovery primitive is the Agent Card: a JSON description of an agent's identity, capabilities, endpoint, modalities, and auth requirements. The GitHub project describes JSON-RPC 2.0 over HTTP(S), synchronous request/response, streaming via SSE, asynchronous push notifications, and structured data exchange [T20].

Adoption is a strong signal. Google reported support from more than 150 organizations, including major hyperscalers, technology providers, and customers; the GitHub project had 24,042 stars and Apache-2.0 licensing on 2026-05-28 [T19][T20].

## AG-UI: Agent-User Interaction Protocol

AG-UI addresses a different gap: agent-to-frontend communication. It standardizes how agent state, UI intents, user interactions, messages, tool calls, approvals, and streaming updates flow between an agent backend and a user-facing application [T21].

The protocol is lightweight and event-based. Agent backends emit events compatible with a fixed set of standard event types, and middleware can adapt diverse event formats and transports. Supported transports include SSE, WebSockets, webhooks, and HTTP streaming [T21].

AG-UI complements MCP and A2A. A production agent application can use MCP for tools, A2A for delegation, and AG-UI for the interactive user surface. 47Billion explicitly describes this three-protocol stack as the direction of production systems [T36].

## DUADP: Decentralized Universal AI Discovery Protocol

DUADP is the discovery layer in the OSSA ecosystem. Its public site states the problem plainly: MCP connects tools and A2A connects agents, but agents still need a way to find each other. DUADP answers with DNS TXT bootstrap, WebFinger resolution, gossip federation, GAID handles, DID proofs, registry endpoints, and MCP tools [T02].

The npm SDK presents a practical TypeScript implementation. It provides `DuadpClient`, `createDuadpRouter`, `validateResource`, Ed25519 signing/verification helpers, DID resolution for `did:web` and `did:key`, and conformance tests [T05]. The README lists 15 core endpoints: discovery, WebFinger, skills/agents/tools listing, publish/create/update/delete, validation, and federation [T05].

The public DUADP site expands that surface to 17 REST endpoints and 17 MCP tools, including governance and NIST trust-profile endpoints [T02]. This is stronger than a plain registry: DUADP is becoming an evidence and policy surface for discovery, provenance, revocation, and trust-tier gating [T02].

### DUADP / UADP naming and endpoint caution

Local repo specs still use UADP in places, including `/.well-known/uadp.json` and `/uadp/v1/*`, while newer DUADP package/site material uses DUADP and `/.well-known/duadp` or `/.well-known/duadp.json` [T02][T05][T06]. Any implementation should choose one canonical spelling and publish redirect/compatibility guidance before wider adoption.

## OSSA: Open Standard for Software Agents

OSSA is not a transport protocol. It is the contract layer. The public site describes it as the missing portable definition of "what an agent is, what it can access, and under what governance rules" [T01].

The npm package is broader than a schema bundle. `@bluefly/openstandardagents` v0.5.1 includes schema exports, CLI binaries, validation/generation/migration services, agent-card generation, trust services, workspace validation, an MCP server, and exports for framework/platform adapters [T03].

In a protocol stack, OSSA is analogous to OpenAPI plus security metadata for agents. It can reference MCP, generate A2A Agent Cards, encode Cedar policy and cost controls, and export platform-specific artifacts [T01][T03][T04].

## ANP: Agent Network Protocol

ANP aims to become the "HTTP of the Agentic Web era" [T22]. Its architecture has three layers:

1. Identity and secure communication based on W3C DIDs.
2. Meta-protocol negotiation so agents can agree on how to communicate.
3. Application protocol layer using semantic web style capability descriptions [T22].

ANP overlaps with A2A and DUADP in ambition, but it places heavier emphasis on decentralized identity and encrypted communication as the foundation. It is promising, but its adoption signal is smaller than A2A's: 1,304 stars versus A2A's 24,042 on 2026-05-28 [T20][T22].

## LangChain Agent Protocol

LangChain Agent Protocol is a framework-agnostic API for serving agents in production. Its three central resources are runs, threads, and store [T23].

- Runs execute agents, including streaming or wait semantics.
- Threads organize stateful, multi-turn interactions.
- Store provides long-term memory through namespaced key/value items [T23].

This protocol is narrower than MCP or A2A. It is not primarily about cross-organization discovery; it standardizes runtime serving surfaces so clients and tools can manage deployed agents regardless of the implementation framework [T23].

## ACP: Agent Communication Protocol

IBM BeeAI's ACP is an open protocol for communication between AI agents, applications, and humans. It supports rich messages, real-time/background/streaming responses, discovery, long-running collaboration, and optional state sharing [T24].

ACP's most important 2026 status note is consolidation. The BeeAI repository states that ACP is now part of A2A under the Linux Foundation and links to migration guidance [T24]. For new cross-agent systems, A2A should be treated as the stronger long-term standard unless a specific BeeAI/ACP deployment already exists.

## ATP: Agent Tool Protocol

monday.com's ATP is a code-first protocol for agent tool execution. Instead of only exposing fixed functions, ATP lets agents generate TypeScript/JavaScript code that runs in isolated V8 sandboxes with memory limits, CPU/timeouts, no implicit file/network access, and a runtime SDK under `atp.*` [T25].

The protocol supports LLM calls, embeddings, approvals, caching, progress, logging, dynamic APIs from OpenAPI specs, MCP servers, custom functions, provenance tracking, and security policies [T25]. npm metadata shows a still-early but active package family: `@mondaydotcomorg/atp-server` 0.25.0, `atp-client` 0.24.0, and `atp-protocol` 0.22.3 [T35].

ATP is useful for complex data transformations and chained operations where fixed tool calls become too rigid. Its risk profile is higher because it involves code execution, so sandboxing, provenance, and approval gates are core rather than optional [T25].

## Adoption trends

1. Tool access is consolidating around MCP [T18][T36][T37].
2. Agent-to-agent communication is consolidating around A2A, with ACP folding into the same ecosystem [T19][T20][T24].
3. UI streaming is emerging through AG-UI, still younger but with strong community interest [T21][T36].
4. Identity/discovery is unsettled. DUADP, ANP, Agent Cards, WebFinger, DIDs, and GAIDs address overlapping needs [T02][T20][T22].
5. Governance metadata is becoming part of the protocol conversation, not an afterthought. OSSA, DUADP, NIST/NCCoE, and Gravitee all point toward first-class agent identity and authorization [T01][T02][T12][T38].
