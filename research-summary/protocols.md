# Protocols and standards

Source review date: 2026-05-23.

## Layered comparison

| Protocol | Boundary | Core artifact | Transport/style | Adoption status |
| --- | --- | --- | --- | --- |
| MCP | Agent to tools/data | Server tools, resources, prompts | JSON-RPC over stdio, SSE or streamable HTTP | Broad support across Claude, ChatGPT, VS Code, Cursor and many servers [S07]. |
| A2A | Agent to agent | Agent Card, task, artifact, message parts | HTTP, SSE, JSON-RPC | Google-launched; Linux Foundation project repo shows v1.0.0 in 2026 [S08][S09]. |
| AG-UI | Agent to frontend UI | Event stream, messages, state | HTTP/WebSockets/event-based | Active protocol and repo with client/core npm packages [S10][S38]. |
| ANP | Open agent network | DID identity, meta-protocol, application protocol | DID-based web infrastructure and semantic descriptions | Open-source spec and SDK ecosystem [S11]. |
| DUADP | Agent discovery | GAID, DID evidence, node manifest, federation records | DNS TXT, WebFinger, REST, MCP tools, gossip | Bluefly protocol and npm package v0.1.4 [S01][S02]. |
| OSSA | Agent contract | YAML/JSON manifest, schemas, policies, signatures | Export/validation layer, not a wire protocol | Bluefly package v0.5.1, 23+ export targets on site [S03][S04]. |
| LangChain Agent Protocol | Agent runtime API | Runs, threads, store | REST endpoints | Framework-agnostic serving/introspection API [S12]. |
| ACP | Agent messaging | OpenAPI REST messages and runs | HTTP REST, sync/async/SSE streaming | IBM-originated; part of A2A under Linux Foundation in the reviewed 2026 docs [S13][S39]. |

## Model Context Protocol (MCP)

Anthropic introduced MCP on 2024-11-25 as an open standard for connecting AI assistants to systems where data lives: content repositories, business tools and development environments [S06]. Its stated goal is to replace fragmented custom integrations with a single protocol and enable secure two-way connections between data sources and AI-powered tools [S06].

MCP's architecture separates MCP clients and MCP servers. Developers can expose data/tools through servers or build AI applications that connect to servers [S06]. The public docs describe MCP as a "USB-C port for AI applications" and define it as an open-source standard for connecting AI applications to external systems: local files, databases, search engines, calculators and workflows [S07].

Adoption is broad. MCP docs list support in Claude, ChatGPT, VS Code, Cursor, MCPJam and other clients [S07]. Anthropic's launch announcement named early adopters including Block and Apollo and noted development tool vendors Zed, Replit, Codeium and Sourcegraph working with MCP [S06]. The npm package `@modelcontextprotocol/sdk` was version 1.29.0 in the 2026-05-23 snapshot [S07].

Security note: MCP standardizes integration but does not by itself enforce least privilege, server provenance or safe side effects. CSA and academic analyses recommend server identity verification, per-user scoped authorization, sandboxing, gateway enforcement, supply-chain vetting and end-to-end audit logs [S33][S42].

## Agent2Agent (A2A)

Google announced A2A on 2025-04-09 as an open protocol for agents to communicate, exchange information and coordinate actions across enterprise platforms and frameworks [S08]. Google positioned A2A as complementary to MCP: MCP provides tools and context; A2A enables agent collaboration [S08].

A2A's design principles are: embrace agentic capabilities, build on existing standards, secure by default, support long-running tasks and remain modality agnostic [S08]. It uses Agent Cards in JSON for capability discovery, task objects with lifecycle state, artifacts as task outputs, messages for collaboration and content "parts" for modality negotiation [S08].

The original announcement listed more than 50 technology partners and service providers, including Atlassian, Box, Cohere, LangChain, MongoDB, PayPal, Salesforce, SAP, ServiceNow, Accenture, Deloitte, KPMG and others [S08]. The GitHub project reviewed on 2026-05-23 is `a2aproject/A2A`; GitHub CLI metadata showed 23,928 stars, Apache-2.0 licensing, and latest release v1.0.0 published on 2026-03-12 [S09].

## AG-UI

AG-UI, the Agent-User Interaction Protocol, is an open, lightweight, event-based standard for connecting AI agents to user-facing applications [S10]. Its purpose is a bidirectional connection between frontend applications and agentic backends, standardizing agent state, UI intents, user interactions and real-time multimodal experiences [S10].

AG-UI fills a different boundary than MCP and A2A. MCP handles agent-to-tool/data access, A2A handles agent-to-agent coordination, and AG-UI handles agent-to-user interaction through web transports such as HTTP and WebSockets [S10]. Its message model is vendor neutral; messages use roles such as user, assistant, system, tool, developer, activity and reasoning, with support for tool calls and encrypted content [S10].

GitHub CLI metadata on 2026-05-23 showed `ag-ui-protocol/ag-ui` with 13,762 stars, MIT license, and a release dated 2026-05-22. Npm metadata showed `@ag-ui/client` and `@ag-ui/core` at 0.0.53 [S38].

## Agent Network Protocol (ANP)

ANP aims to become "the HTTP of the Agentic Web era" and defines how agents connect in an open, secure and efficient collaboration network [S11]. Its three-layer architecture is:

1. Identity and secure communication based on W3C DIDs, decentralized authentication and end-to-end encrypted communication.
2. Meta-protocol negotiation so agents can negotiate communication protocols.
3. Application protocol layer using semantic web specifications for capability description and supported protocol management [S11].

ANP is more ambitious than a task API. It focuses on internet-scale discovery, cross-platform authentication and semantically described capabilities. The GitHub repository metadata on 2026-05-23 showed 1,301 stars, Apache-2.0 licensing and latest release V1.0 published on 2025-05-19 [S11].

## DUADP

DUADP is a decentralized discovery protocol, not a model runtime. It solves the "how do agents find each other?" problem through federated DNS TXT records, WebFinger, well-known endpoints, node manifests and gossip federation [S01]. It uses Global Agent Identifiers, DID identity, Ed25519 signatures, provenance evidence and trust tiers so discovery can be gated by verifiable identity and policy [S01].

DUADP's public site describes 17 MCP tools plus REST endpoints for discovery, agent/skill/tool listing, search, publishing, manifest validation, federation, gossip, identity, NIST governance profile, trust evaluation, health and metrics [S01]. The npm package `@bluefly/duadp` is version 0.1.4 and exposes client, server, validation, crypto, DID and conformance modules [S02].

## OSSA

OSSA is the contract layer between protocols and platforms. It defines portable agent manifests with identity, capabilities, compliance, lifecycle, security, trust, cost controls, human-in-the-loop checkpoints, state and export metadata [S03][S05]. OSSA does not replace MCP or A2A; it references and exports to them [S03].

The `@bluefly/openstandardagents` npm package is version 0.5.1 as of 2026-05-23. It exports schemas, validation, generation, migration, OpenAPI extensions, mesh, agent-card generation, SDK, trust services and MCP server entry points. The CLI includes `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, and `ossa-mcp` [S04].

OSSA and DUADP are complementary in the Bluefly stack: OSSA defines the agent contract; DUADP discovers it and verifies its identity/provenance across a federated mesh [S01][S03][S05].

## LangChain Agent Protocol

LangChain's Agent Protocol codifies framework-agnostic APIs for serving LLM agents in production [S12]. Its primitives are:

- Runs: APIs to execute an agent, stream output, wait, cancel or delete runs.
- Threads: APIs for multi-turn state, history, copy, patch and run listing.
- Store: APIs for long-term memory items and namespaces [S12].

This protocol is narrower than A2A or ANP. It standardizes how a deployed agent service is invoked, inspected and persisted, not how independent agents discover each other on an open network [S12].

## Agent Communication Protocol (ACP)

IBM Research describes ACP as an open, lightweight, HTTP-native REST protocol for seamless communication between AI agents regardless of framework, programming language or runtime [S13]. It supports REST-based endpoints, synchronous and asynchronous interactions, streaming and discovery metadata [S13].

ACP's important 2026 status is consolidation: IBM and the ACP docs state that ACP is part of A2A under the Linux Foundation [S13]. The `i-am-bee/ACP` GitHub repository was archived in the 2026-05-23 metadata snapshot, with 1,004 stars, Apache-2.0 licensing and latest release v1.0.3 from 2025-08-21 [S39].

## Other emerging protocols

Google's developer guide maps adjacent protocols by boundary: MCP for tools/data, A2A for agent-to-agent, UCP for commerce, AP2 for payment authorization, A2UI for declarative UI and AG-UI for streaming UI interaction [S35]. The practical principle is modular adoption: start with MCP for data access, then add only the protocol needed by the next boundary [S35].

Agent Transfer Protocol (AGTP) appears in IETF draft form and uses DNS and TLS-related identity concepts, but it is less visibly adopted than MCP, A2A, AG-UI, ANP, DUADP and ACP in the sources reviewed [S15].

## Key conclusion

No single protocol covered the whole agent lifecycle in the 2026-05-23 source review. The emerging standard stack is plural: MCP for tools, A2A/ACP for delegation and messaging, AG-UI for user interaction, DUADP/ANP for discovery and decentralized identity, OSSA for portable contracts, and gateway/IAM standards for enforcement [S03][S18][S31][S35].
