# Protocols and Standards

Research snapshot compiled on May 18, 2026.

## Comparative view

| Protocol | Scope | Core artifact/message style | Discovery | Security posture | Adoption signal |
| --- | --- | --- | --- | --- | --- |
| MCP | Agent-to-tool and context exchange | JSON-RPC 2.0; tools, resources, prompts, sampling, elicitation, logging | `tools/list`, `resources/list`, dynamic primitive listings | Host-controlled access, transport auth, OAuth recommended for HTTP | Official SDKs, reference servers, IDE adoption [R09] [R10] |
| A2A | Agent-to-agent task delegation | JSON-RPC 2.0 over HTTP(S); Agent Cards, tasks, artifacts, messages, SSE | Agent Cards | Enterprise auth schemes, opacity-preserving collaboration | Google launch with 50+ partners; Linux Foundation project; 23,835 GitHub stars [R11] [R12] [R34] |
| AG-UI | Agent-to-user/front-end interaction | Typed JSON event stream over HTTP/SSE/WebSockets | Client connects to agent endpoint | CORS/auth/audit must be implemented by application; supports HITL events | LangGraph/CrewAI/Mastra/etc. integrations; 13,613 GitHub stars [R13] [R14] [R34] |
| LangChain Agent Protocol | Production API for serving agents | REST/OpenAPI endpoints for runs, threads, agents, store, streaming | Agent search and schemas endpoints | Implementation-defined; supports state/concurrency boundaries | 588 GitHub stars; LangGraph Platform superset [R15] [R34] |
| ANP | Open agent network communication | DID-based secure communication, meta-protocol negotiation, application protocol layer | Decentralized discovery and semantic descriptions | W3C DID, end-to-end encryption vision | 1,296 GitHub stars; AgentConnect SDK [R16] [R34] |
| ACP | Lightweight REST agent messaging | REST endpoints; MIME-typed messages; sync/async/SSE | Online/offline metadata discovery | HTTP-native auth; now migrating into A2A | IBM/BeeAI, Linux Foundation, ACP now part of A2A [R17] [R18] |
| ATP | Code-first tool execution | Sandboxed TypeScript/JavaScript code, runtime SDK, OpenAPI/MCP adapters | API discovery/search inside ATP server | V8 isolates, AST validation, provenance policies, audit logs | Monday.com repo; 96 GitHub stars [R19] [R34] |
| DUADP | Decentralized discovery and registry | REST + MCP tools; GAID; `.well-known`; DNS TXT; WebFinger; gossip | DNS, WebFinger, peer federation, federated search | DID identity, signatures, trust tiers, Cedar policy inputs | Live site and npm 0.1.4 [R01] [R02] [R04] |
| OSSA | Agent contract and deployment manifest | YAML/JSON schema; agent identity, tools, governance, exports | Can publish through DUADP and generate A2A Agent Cards | Signed manifests, Cedar policies, compliance metadata, SBOM/provenance | npm 0.5.1; 23+ export targets on site [R05] [R06] [R07] |

## MCP: Model Context Protocol

Anthropic introduced MCP on November 25, 2024 as an open standard for connecting AI assistants to the systems where data lives. The stated goal is to replace fragmented custom integrations with a universal way to expose data through MCP servers and consume it through MCP clients inside AI applications [R09].

MCP's architecture has two layers. The data layer uses JSON-RPC 2.0 for lifecycle management and core primitives; the transport layer handles stdio for local servers and Streamable HTTP for remote servers. MCP servers expose tools, resources, and prompts. MCP clients can expose sampling, elicitation, and logging, while notifications keep tool/resource changes synchronized [R10].

MCP's strongest fit is vertical integration: giving an agent access to tools and context without hardcoding every connector. It is not an agent identity framework, agent-to-agent negotiation protocol, or deployment contract [R10]. This is why protocols such as A2A, DUADP, and OSSA layer around it rather than replace it.

## A2A: Agent2Agent

Google announced A2A on April 9, 2025 as an open protocol for agents to communicate, securely exchange information, and coordinate actions across enterprise platforms. Google described A2A as complementary to MCP: MCP provides tools and context to agents, while A2A lets agents collaborate with each other [R11].

A2A's design principles are to embrace agentic capabilities, build on HTTP/SSE/JSON-RPC, be secure by default, support long-running tasks, and remain modality agnostic. Its core mechanics include Agent Cards for capability discovery, tasks with lifecycle state, artifacts as outputs, messages for collaboration, and parts for negotiating UI/content formats [R11].

The current GitHub README says A2A is an open protocol for communication and interoperability between opaque agentic applications. It emphasizes discovery, modality negotiation, secure collaboration on long-running tasks, and preserving internal state, memory, and tool opacity [R12].

## AG-UI: Agent-User Interaction

AG-UI is an event-based protocol for connecting agentic backends to user-facing applications. Its docs position it as the third major layer in the agentic protocol stack: MCP handles tools/data, A2A handles agent-agent coordination, and AG-UI handles agent-user interaction [R13].

AG-UI uses typed events to stream token output, state deltas, tool progress, lifecycle changes, frontend tool calls, human-in-the-loop interrupts, sub-agent composition, and custom events. The CopilotKit launch post describes a single POST from client to agent endpoint followed by a unified event stream containing event types such as `TEXT_MESSAGE_CONTENT`, `TOOL_CALL_START`, and `STATE_DELTA` [R14].

The protocol is useful where agents must be visible and interruptible, not just autonomous. It supports real-time collaboration, cancellation, shared mutable state, tool visualization, and approval workflows [R13] [R14].

## LangChain Agent Protocol

LangChain's Agent Protocol codifies framework-agnostic APIs for serving LLM agents in production. It organizes the API around runs, threads, agents, store, messages, and streaming primitives [R15].

Runs execute agents either as ephemeral stateless calls or background runs. Threads organize multi-turn state, history, concurrency, copies, and lifecycle. Store endpoints provide long-term memory by namespace and key. Agent endpoints provide introspection, including input/output/state/config schemas in JSON Schema format [R15].

Its strongest contribution is operational: it describes the server surface an agent platform needs once agents become persistent, multi-turn, streamable, cancellable, inspectable, and memory-bearing [R15].

## ANP: Agent Network Protocol

ANP's README states its ambition directly: "the HTTP of the Agentic Web era." It aims to define how agents connect, building an open, secure, efficient collaboration network for billions of agents [R16].

ANP's architecture has three layers:

1. Identity and secure communication, based on W3C DIDs and end-to-end encryption.
2. Meta-protocol negotiation, so agents can decide how to communicate.
3. Application protocol layer, based on semantic web specifications for capability and protocol description [R16].

ANP is broader and more internet-native than A2A or ACP. It focuses on decentralized identity, semantic description, open-network discovery, and self-negotiation rather than only enterprise task delegation [R16] [R29].

## ACP: Agent Communication Protocol

IBM describes ACP as an open standard for seamless communication between AI agents regardless of framework, language, or runtime. ACP is REST-native, SDK-optional, multimodal, asynchronous by default, and supports online/offline discovery [R17] [R18].

ACP's docs state that it is now part of A2A under the Linux Foundation. That is important for standards tracking: ACP should be treated as an influential REST design and BeeAI implementation lineage, but future adoption may converge into A2A rather than remain a separate protocol [R17] [R18].

## ATP: Agent Tool Protocol

Monday.com's Agent Tool Protocol is a code-first approach to agent/tool integration. It lets agents generate and execute TypeScript/JavaScript in a secure sandbox, enabling loops, conditionals, parallel calls, filtering, mapping, reducing, OpenAPI integration, and MCP compatibility [R19].

ATP's security model is more opinionated than ordinary tool calling. It uses isolated V8 VMs, memory limits, timeouts, AST analysis, proxy-mode external call interception, provenance tracking, configurable policies such as data-exfiltration prevention, and audit logging [R19].

ATP is not a universal inter-agent protocol. It is better understood as a sandboxed execution substrate for tool use where code is more concise and expressive than large function schemas [R19].

## DUADP and OSSA in the protocol stack

DUADP fills the discovery gap left by MCP and A2A. MCP can expose tools, and A2A can connect agents, but neither is primarily a decentralized phonebook. DUADP uses DNS TXT records, `.well-known/duadp`, WebFinger, GAIDs, DID identity, federated search, peer gossip, and MCP tools to let agents, skills, and tools be found across domains [R01] [R02].

OSSA fills the contract gap. Protocols can move messages, but they do not fully define what an agent is, what it may access, what policies constrain it, what compliance obligations apply, what deployment targets exist, or who is accountable. OSSA's manifest schema is designed to define those properties once and export to platforms and protocols [R05] [R06] [R08].

## Adoption pattern

The practical architecture emerging from the sources is layered:

1. Define an agent contract in OSSA [R06].
2. Publish and discover it through DUADP or another registry [R02].
3. Expose tools through MCP [R10].
4. Delegate tasks through A2A/ACP-style agent coordination [R12] [R18].
5. Render user-interactive progress through AG-UI [R13].
6. Enforce identity, authorization, provenance, logging, and human approval continuously [R28] [R39] [R40].
