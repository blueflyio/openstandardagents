# Protocols, Standards, and Interoperability Layers

Prepared on May 22, 2026. Citations use the source IDs in [reading-list.md](reading-list.md).

## Comparative table

| Protocol | Layer | Core artifact/message | Transport/style | Adoption status as of May 22, 2026 |
| --- | --- | --- | --- | --- |
| MCP | Agent-to-tool/data | MCP server resources, tools, prompts | Client/server JSON-RPC style; SDKs | Open standard from Anthropic; early adopters Block/Apollo; broad framework support [S17]. |
| A2A | Agent-to-agent | Agent Card, task, message, artifact | HTTP, SSE, JSON-RPC; v0.3 added gRPC | Google-launched, Linux Foundation project; 150+ organizations; A2A repo v1.0.0 and 23,914 stars [S18][S19][S20]. |
| AG-UI | Agent-to-user | Streaming events for lifecycle, text, tools, state | HTTP, WebSockets, SSE-compatible event streams | Supported by CopilotKit, LangGraph, CrewAI, ADK, Microsoft Agent Framework, AWS Bedrock AgentCore, etc. [S21][S22]. |
| ACP | Agent messaging | REST endpoints, messages, sync/async/SSE | HTTP-native REST | IBM/BeeAI protocol now merged into A2A under Linux Foundation [S23]. |
| ANP | Agentic web network | DID identity, meta-protocol negotiation, capability descriptions | DID, semantic web, encrypted communication | Open-source protocol aiming to be HTTP of Agentic Web; 1,300 GitHub stars [S25]. |
| Agent Protocol | Agent runtime API | Runs, threads, store, agents schemas, streaming events | HTTP APIs, SSE/WebSocket streaming | LangChain-led framework-agnostic API; LangGraph Platform implements a superset [S24]. |
| DUADP | Discovery/federation | GAID, DID, well-known manifest, WebFinger, registry resources | DNS TXT, WebFinger, REST, MCP, gossip | First-party Bluefly protocol; npm v0.1.4; 17 MCP tools on reference node [S02][S04]. |
| OSSA | Contract/manifest | YAML manifest, JSON Schema, exports, trust metadata | File/schema/CLI/SDK, MCP server | npm v0.5.1; export/validation contract layer across 23+ targets [S01][S03]. |
| ATP | Code-first tool execution | Sandboxed JS/TS execution config and protocol types | JSON-RPC plus sandbox runtime | monday.com MIT project; npm packages updated May 2026; OpenAPI/MCP compatibility [S26]. |

## MCP

Anthropic announced MCP on Nov 25, 2024 as an open standard for connecting AI assistants to systems where data lives: content repositories, business tools, development environments, and other data sources [S17]. MCP replaces fragmented custom integrations with a universal protocol where data/tool providers expose MCP servers and AI apps act as MCP clients [S17]. Early adopters included Block and Apollo, while Zed, Replit, Codeium, and Sourcegraph were working with MCP [S17].

MCP is strongest at tool and context access. It does not by itself solve agent identity, web conduct, deployment packaging, or inter-agent task delegation, so it composes with OSSA, A2A, DUADP, and runtime authorization gateways [S01][S17][S18][S42].

## A2A

Google launched Agent2Agent (A2A) on Apr 9, 2025 as an open protocol for agents to communicate across vendors, frameworks, enterprise platforms, and clouds [S18]. It complements MCP: MCP supplies tools/context; A2A handles inter-agent coordination [S18]. A2A's primitives include Agent Cards for capability discovery, task lifecycle objects, messages, artifacts, and user-experience negotiation [S18].

The July 31, 2025 Google Cloud update announced A2A v0.3 with gRPC support, signed security cards, and extended Python SDK support [S19]. It reported more than 150 supporting organizations and deployment paths through ADK, Agent Engine, Cloud Run, and GKE [S19]. The A2A repo had 23,914 stars and an Apache-2.0 v1.0.0 release as of May 22, 2026 [S20].

## AG-UI

AG-UI standardizes the agent-to-user/frontend boundary [S21]. Agents are long-running, stream intermediate work, mix structured and unstructured I/O, call tools, update state, and require user steering or approval; AG-UI represents those behaviors through event streams over HTTP/WebSockets [S21]. Its event model covers lifecycle events, streaming text, tool-call events, state snapshots/deltas, activity events, custom events, interrupts, shared state, and frontend tool calls [S21].

AG-UI had 13,742 GitHub stars as of May 22, 2026 and lists integrations or in-progress support across LangGraph, CrewAI, Google ADK, Microsoft Agent Framework, AWS Bedrock AgentCore, Mastra, Pydantic AI, Agno, LlamaIndex, AG2, and A2A middleware [S21][S22].

## ACP

IBM's ACP was designed as a lightweight HTTP-native protocol for agent interoperability across frameworks and languages [S23]. It used REST endpoints for sending, receiving, and routing messages, with async-first behavior, optional sync, and SSE streaming [S23]. IBM now states ACP is part of A2A under the Linux Foundation and that ACP development is winding down, so new designs should treat ACP as a contributor to A2A rather than a separate long-term standard unless legacy systems require it [S23].

## ANP

ANP aims to become the HTTP of the Agentic Web era [S25]. Its three layers are: W3C DID-based identity and secure communication, a meta-protocol layer for protocol negotiation between agents, and an application protocol layer based on semantic web specifications for describing capabilities and supported protocols [S25]. ANP is more network-native than A2A and closer to a decentralized agent internet vision [S18][S25].

## LangChain Agent Protocol

LangChain's Agent Protocol is a framework-agnostic API for serving agents in production [S24]. It standardizes runs, threads, store, agent introspection, and streaming control [S24]. Streaming primitives cover nested-agent namespaces, tool lifecycle events, run lifecycle events, human-in-the-loop input, state snapshots, checkpoints, tasks, and custom events [S24]. It is a runtime-serving API rather than an identity or discovery protocol.

## DUADP and OSSA

DUADP provides discovery and federation: well-known endpoints, WebFinger resolution, DNS TXT support, GAID handles, DID identity, signatures, trust tiers, federation, governance evaluation, REST endpoints, and MCP tools [S02][S04]. OSSA provides the contract: schema-validated YAML manifests describing identity, capabilities, compliance, lifecycle, security, trust, state, cost, and platform exports [S01][S03]. Together they fill two gaps not fully covered by MCP or A2A: portable governance-bearing definitions and decentralized discovery with verifiable identity [S01][S02].

## ATP

monday.com's ATP is a code-first protocol for external-system access through secure sandboxed TypeScript/JavaScript execution [S26]. It aggregates APIs and MCP servers, gives agents controlled code execution, and includes isolated V8 VMs, memory/time limits, approvals, caching, logging, provenance tracking, and OpenAPI/MCP compatibility [S26].

## Design guidance

1. Use MCP for tool/data integration where standard servers exist [S17].
2. Use A2A for cross-agent delegation where agents are independent services [S18][S19].
3. Use AG-UI where a user-facing application needs streaming state, tool, text, and HITL events [S21].
4. Use DUADP/ANP concepts where discovery, identity, federation, and agent network routing matter [S02][S25].
5. Use OSSA where portability, policy, compliance, provenance, export, and platform-agnostic definitions matter [S01][S03].
6. Treat protocol bridges as security-sensitive components because cross-protocol composition can break assumptions [S14][S16].
