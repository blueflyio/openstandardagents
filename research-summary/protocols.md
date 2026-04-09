# Protocols and Standards (Late-2025 to Early-2026)

This document compares major agent protocols and standards relevant to production interoperability, with emphasis on architecture, message surfaces, and adoption posture.

## Protocol Comparison Snapshot

| Protocol / Standard | Primary scope | Message or contract format | Discovery model | Adoption signal (as of March-April 2026) |
|---|---|---|---|---|
| MCP (Model Context Protocol) | Agent/tool and agent/data connectivity | JSON-RPC 2.0 over stdio/HTTP/SSE patterns in implementations | Tool/server registration via client/server config | Broad framework and vendor support; announced by Anthropic and integrated across ecosystem. [T14][T15] |
| A2A (Agent-to-Agent) | Cross-agent task delegation and capability discovery | HTTP + JSON(-RPC patterns) + streaming events (SSE/gRPC updates) | `/.well-known/agent-card.json` (Agent Card) | Backed by large consortium (150+ org claim) and Linux Foundation governance path. [T16][T17][T18] |
| AG-UI | Agent-to-frontend interaction | Event protocol over HTTP/SSE/WebSocket-style transport | App/frontend integration contracts | Growing in DX-focused stacks; clear event lifecycle model. [T19][T20][T21] |
| ANP (Agent Network Protocol) | Internet-style agent network architecture | Layered protocol family, DID-centric identity, negotiable meta-layer | Registry/discovery abstractions + capability metadata | Early but conceptually ambitious; active open repository. [T22] |
| LangChain Agent Protocol | Framework-agnostic serving/introspection for LLM agents | Runs / Threads / Store HTTP APIs | API endpoint discovery in deployments | Emerging interoperability substrate for LangChain ecosystem and beyond. [T23][T24] |
| ACP (Agent Communication Protocol lineage) | Async-first inter-agent messaging (historical lineage) | HTTP-native REST messaging patterns | Decentralized/registry-compatible patterns | Publicly described in ecosystem discourse as converging with A2A trajectories. [T17][T26][T34] |
| ATP (monday.com Agent Tool Protocol) | Secure code execution/tooling for agents | Code-first tool invocation contract | Platform-local registry/workspace context | Smaller ecosystem, focused on secure execution and token efficiency. [T25] |
| OSSA (manifest spec) | Agent contract, packaging, deployment portability | YAML manifest + JSON Schema + typed protocol declarations | Optional DUADP and workspace discovery integration | Active npm/GitLab/GitHub mirror usage, multi-platform exporter footprint. [T02][T03][T05][T06][T07] |
| DUADP (discovery protocol) | Federated agent discovery and trust routing | SDK/API endpoints + signed metadata and DID cues | DNS/WebFinger-like federated discovery and gossip | Early-stage but production-oriented narrative and published SDK. [T01][T04] |

## MCP (Anthropic-origin open standard)

Anthropic introduced MCP on November 25, 2024 as an open standard to connect assistants to tools and data through a consistent interface. The core value proposition is replacing bespoke tool adapters with a stable protocol surface that supports secure two-way interactions and easier ecosystem composition. [T14][T15]

By early 2026, MCP appears less as a standalone product and more as foundational plumbing adopted by framework vendors, editors, and internal platform teams. The strongest adoption signal is not one benchmark, but repeated appearance as a default integration target across documentation and platform releases. [T14][T15][T32]

## A2A (Google-led and foundation-governed trajectory)

Google’s April 9, 2025 A2A announcement positioned the protocol as open agent interoperability: discovering agents via Agent Cards and delegating tasks through web-native APIs. This tackles a different axis than MCP: agent-to-agent work exchange, not just tool calls. [T16][T18]

The July 31, 2025 update highlighted governance and transport maturity (including stronger enterprise alignment such as signed cards and broader transport options), reflecting movement from concept to operationalization. [T17]

## AG-UI (agent-to-interface protocol)

AG-UI focuses on a recurrent production problem: even when backend protocols exist, frontend behavior remains custom. Its event taxonomy (lifecycle, text, tool, state, reasoning, activity) standardizes how agent state and partial outputs stream into user interfaces. [T19][T20][T21]

The protocol is especially relevant for teams that require human-in-the-loop controls, auditable state transitions, and streaming UX without creating one-off client contracts for each agent runtime. [T20][T21]

## ANP (Agent Network Protocol)

ANP presents itself as a candidate "HTTP of the Agentic Web," with a three-layer design: identity/secure communication, meta-protocol negotiation, and application semantics for capabilities. [T22]

Its design is notable for treating interoperability as a network architecture problem rather than only a model API problem. Practical adoption will depend on reference implementations, conformance tools, and viable interop bridges to MCP/A2A stacks. [T22][T41]

## LangChain Agent Protocol (Runs/Threads/Store model)

LangChain’s Agent Protocol proposal defines common APIs for execution (`runs`), conversational state (`threads`), and durable context (`store`). This separates operational agent serving from any specific orchestration library internals. [T23][T24]

At research time, one linked OpenAPI artifact path returned 404, so implementation details were validated against available repository and blog documentation instead of that endpoint. [T48]

## ACP and ATP: Emerging/Adjacent Paths

The "ACP" label appears in two contexts in ecosystem discussion: (1) historical IBM-style agent communication protocol language that increasingly aligns with or merges into A2A standardization conversations, and (2) separate usage in UI automation communities. Claims should be read with context and date. [T17][T26][T34]

monday.com’s ATP is narrower: secure, code-first tool execution for agents. It is useful where teams prioritize sandboxed computation and deterministic tool behavior over broad federation goals. [T25]

## OSSA + DUADP as Contract + Discovery Infrastructure

OSSA and DUADP are best understood as complementary infrastructure:

- **OSSA**: defines agent identity, capability declarations, policy surfaces, and export targets through a portable manifest/CLI model. [T02][T03][T05][T06]
- **DUADP**: provides federated discovery and trust-tier-aware routing so these manifest-defined agents can be discoverable across boundaries. [T01][T04]

In local source evidence, OSSA includes first-class TypeScript protocol declarations for MCP, A2A, and ANP, and local plugin configuration references a DUADP discovery node. [T06][T07]

## Design Goal Matrix

| Goal | MCP | A2A | AG-UI | ANP | OSSA | DUADP |
|---|---|---|---|---|---|---|
| Tool interoperability | High | Medium | Low | Medium | Medium (declarative) | Low |
| Multi-agent delegation | Low | High | Low | High | Medium (declarative) | Medium |
| UI interaction standardization | Low | Low | High | Low | Low | Low |
| Identity-centric federation | Medium | Medium | Low | High | High | High |
| Deployment portability | Low | Low | Low | Low | High | Low |
| Discovery across org boundaries | Low | Medium | Low | High | Medium | High |

Interpretation note: this matrix is qualitative and reflects documented intent and visible ecosystem behavior, not a formal benchmark.

## Protocol Risks and Practical Controls

| Risk | Typical failure mode | Control direction |
|---|---|---|
| Prompt injection through tool channels | Unsafe tool arguments or context contamination | Pre-execution policy checks, strict tool input schemas, provenance verification. [T37][T40] |
| Cross-agent trust confusion | Unknown sender identity or unsigned capability declarations | Signed cards/manifests, DID/credential checks, transport-layer auth. [T17][T22][T42] |
| Over-privileged delegation | Downstream agent executes beyond intended authority | Least-privilege authorization policies and bounded delegation contracts. [T38][T43] |
| Protocol composition mismatch | Secure pieces become insecure when composed | Conformance checking and composition-safe design/testing. [T41] |

