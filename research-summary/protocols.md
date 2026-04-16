# Agentic AI Protocols and Standards (Late 2025 to April 16, 2026)

## Framing

The protocol landscape is converging on a multi-layer stack rather than a single protocol:

- **Tool/context plane**: MCP [R01] [R02]
- **Agent collaboration plane**: A2A, ACP [R03] [R04] [R13] [R14]
- **Agent-UI plane**: AG-UI [R16]
- **Discovery/identity plane**: DUADP, ANP [R19] [R20] [R12]
- **Contract/governance plane**: OSSA and similar manifest approaches [R21] [R22]

## Core protocols

### Model Context Protocol (MCP)

MCP is an open protocol for connecting AI applications to tools/data/workflows via a standardized interface. Anthropic introduced MCP as a way to replace fragmented point integrations with a common client/server model and SDK ecosystem [R01]. The MCP documentation ecosystem frames it as an open “port” pattern for AI application interoperability [R02].

Key properties:

- Open-source spec and SDK ecosystem [R01]
- Broad client ecosystem support claims (Claude, ChatGPT, VS Code, Cursor, etc.) [R02]
- Focus: **agent-to-tool** interoperability, not agent identity governance [R02]

### Agent2Agent (A2A)

A2A is an open protocol for agent-to-agent collaboration launched by Google (April 9, 2025), designed around capability discovery (Agent Cards), task lifecycle exchange, and enterprise-grade secure interoperability [R03]. Google’s July 2025 update cites v0.3 (gRPC/signing improvements) and ecosystem expansion to 150+ organizations [R04].

Key properties:

- Uses web-native standards: HTTP, SSE, JSON-RPC [R03]
- Agent Card capability descriptor model [R03]
- Strong enterprise ecosystem positioning [R03] [R04]
- Focus: **agent-to-agent** coordination

### AG-UI (Agent-User Interaction Protocol)

AG-UI defines event-based semantics for agent/frontend integration. It positions itself as the agent-to-UI layer complementing MCP and A2A, with standard event types and transport flexibility (SSE/WebSockets/etc.) [R16].

Key properties:

- Approx. 16–17 standard event types [R16]
- UI synchronization, streaming, human-in-the-loop UX events [R16]
- Broad integration claims across frameworks/SDKs [R16]

### Agent Network Protocol (ANP)

ANP’s vision is “HTTP of the Agentic Web,” with three-layer architecture:

1. identity and secure communication (W3C DID),
2. meta-protocol negotiation,
3. application protocol layer [R12].

Key properties:

- Strong protocol-theory orientation around large-scale open agent internet [R12]
- Explicit DID-first architecture [R12]
- Early-stage but clear architecture narrative [R12]

### ACP (Agent Communication Protocol, IBM/BeeAI lineage)

IBM positions ACP as a complementary protocol to MCP (ACP for agent-agent, MCP for agent-tool), with RESTful architecture over HTTP and Linux Foundation/open governance trajectory through BeeAI contributions [R14].

Key properties:

- Agent-to-agent communication focus [R14]
- REST-first interoperability and SDK-optional usage [R14]
- Strategic positioning: complementary to MCP and partially overlapping with A2A [R14]

### Monday.com Agent Tool Protocol (ATP)

ATP is a code-execution-centric protocol where agents generate/execute sandboxed TypeScript/JavaScript, intended to overcome schema-heavy function-calling constraints [R15].

Key properties:

- Isolated VM execution, runtime SDKs, provenance/security controls [R15]
- Claims of parallel execution and inline data transformation benefits [R15]
- OpenAPI/MCP compatibility path [R15]

## DUADP and OSSA (deep focus)

### DUADP

DUADP (“Decentralized Universal AI Discovery Protocol”) positions as a federated discovery layer for agents, skills, and tools with:

- DNS TXT + WebFinger discovery,
- gossip mesh federation,
- DID identity and trust evaluation surfaces,
- MCP + REST endpoint parity [R19] [R20].

The `@bluefly/duadp` npm package (latest 0.1.4) is an Apache-2.0 TypeScript SDK with CLI exposure and DID-related dependencies, created March 2026 [R57] [R58].

### OSSA

OSSA positions as a contract specification for agent identity/capability/governance definitions, with YAML manifests, schema validation, and multi-target export [R21] [R22]. The project explicitly describes itself as a “missing contract layer” between protocol transports and application frameworks [R21].

The `@bluefly/openstandardagents` package (latest 0.5.1) is a larger Apache-2.0 CLI/spec distribution with broad export and validation capabilities and frequent version iteration from late 2025 onward [R57] [R58].

## Comparative protocol table

| Protocol/Spec | Main purpose | Primary interface model | Identity model emphasis | Governance semantics | Adoption signal (as published) |
| --- | --- | --- | --- | --- | --- |
| MCP | Agent-to-tool connectivity | Client/server protocol + SDKs | Limited native identity framing | Minimal built-in governance | Broad client support claims [R02] |
| A2A | Agent-to-agent tasks | Agent Card + task lifecycle over HTTP/SSE/JSON-RPC | Endpoint/auth aware | Delegation/task semantics | 50+ at launch; 150+ later claim [R03] [R04] |
| AG-UI | Agent-to-frontend UX sync | Event stream, transport-flexible | Not central | HITL/UI state semantics | Large OSS community signal [R16] |
| ANP | Open agentic network protocol | 3-layer architecture | Core DID-centric | Negotiation/application layers | Early-stage ecosystem [R12] |
| ACP | Agent-agent interoperability | REST/HTTP | Moderate | Emerging pattern | IBM/BeeAI + LF trajectory [R14] |
| ATP | Code-first tool interaction | Sandboxed code execution protocol | Not central | Provenance/security policy layer | Monday open-source early maturity [R15] |
| DUADP | Federated discovery mesh | DNS/WebFinger + gossip + REST/MCP | Strong DID/GAID framing | Trust tier + governance APIs | Early-stage package telemetry [R19] [R57] [R59] |
| OSSA | Agent contract spec | YAML/JSON schema + CLI export | Explicit ID/trust fields | Strong compliance/governance narrative | Early-stage but active versioning [R21] [R57] [R59] |

## Interoperability pattern likely to persist

A practical enterprise stack is increasingly:

- MCP for tools,
- A2A/ACP for delegation,
- AG-UI for user experience,
- plus optional discovery and contract overlays (DUADP/OSSA-like systems) for governance and portability [R01] [R03] [R16] [R19] [R21].

This reflects both engineering and governance realities: transport protocols alone are insufficient for identity/audit/compliance in regulated settings [R08] [R27].

