# Protocols and Standards Landscape

_Report date: 2026-03-11_

## 1) Core protocol families

## MCP (Model Context Protocol)
MCP is positioned as an open standard for connecting AI systems to external tools/data sources with a unified interface, replacing one-off integrations.[SRC-14][SRC-16]  
Anthropic’s 2025 follow-up reports donation of MCP governance/assets to a Linux Foundation structure and broad ecosystem uptake claims.[SRC-15]

## A2A (Agent2Agent)
A2A is positioned as an open protocol for agent interoperability, emphasizing capability discovery via Agent Cards, task-oriented exchanges, and web-native transport patterns.[SRC-17][SRC-18]

## AG-UI
AG-UI focuses on **agent-to-frontend** interaction, standardizing event streams and UX coordination patterns for interactive applications. Its docs explicitly position AG-UI as complementary to MCP and A2A rather than a replacement.[SRC-19]

## ANP (Agent Network Protocol)
ANP positions itself as “HTTP of the Agentic Web,” with a layered architecture (identity/secure communication, meta-protocol negotiation, and application protocol semantics), and DID-centric identity framing.[SRC-20][SRC-21]

## LangChain Agent Protocol
LangChain Agent Protocol aims to codify framework-agnostic serving APIs around three primitives: runs, threads, and store/memory interfaces.[SRC-22]

## ACP (Agent Communication Protocol)
IBM’s ACP is presented as an open interoperability protocol for agent communication, emphasizing cross-environment interoperability and practical implementation simplicity.[SRC-23]

## ATP (Agent Tool Protocol, monday.com ecosystem positioning)
ATP frames itself as code-execution-first interaction rather than static tool-call orchestration, arguing this can reduce composition bottlenecks in complex enterprise toolchains.[SRC-24]

## DUADP + OSSA (discovery/contract overlays)
DUADP and OSSA are not framed as direct replacements for MCP/A2A transport semantics:
- DUADP emphasizes decentralized discovery/federation/trust signaling.[SRC-01][SRC-02][SRC-04]
- OSSA emphasizes manifest contracts, trust boundaries, and exportable deployment definitions.[SRC-09][SRC-10][SRC-12]

## 2) Comparative snapshot

| Protocol / Spec | Primary purpose | Scope boundary | Message/format focus | Identity/security emphasis | Adoption signal (as of 2026-03-11) |
|---|---|---|---|---|---|
| MCP | Agent-to-tool/data connectivity | Context + tool interfaces | Structured protocol/schema ecosystem | Connector security + integration governance | High ecosystem visibility, broad client/server implementations claimed.[SRC-14][SRC-16][SRC-15] |
| A2A | Agent-to-agent collaboration | Discovery + delegation + task exchange | Agent Card metadata; JSON-RPC-oriented bindings | Authn/authz profile and enterprise readiness in spec docs | Large multi-vendor support claims since launch.[SRC-17][SRC-18] |
| AG-UI | Agent-to-user-interface interaction | Frontend eventing + state/UI sync | Event-based interaction model | UX-safe orchestration, app-layer controls | Growing developer uptake in agent product stacks.[SRC-19] |
| ANP | Decentralized agent network fabric | Inter-agent network and protocol negotiation | Layered protocol + DID-linked identity artifacts | W3C DID and secure communication layer | Active but earlier-stage vs MCP/A2A mindshare.[SRC-20][SRC-21] |
| Agent Protocol (LangChain) | Framework-agnostic serving API | Runs/threads/store lifecycle | OpenAPI endpoints | API-level lifecycle controls | Implemented/supersetted in LangGraph ecosystem.[SRC-22] |
| ACP | Inter-agent messaging interoperability | Agent communication plumbing | HTTP/REST and interoperability focus | Practical enterprise integration controls | Notable influence; overlaps with A2A trajectory.[SRC-23] |
| ATP | Agentic code-execution orchestration | Tooling/action composition | Code-first, API composition oriented | Security posture depends on execution sandboxing | Emerging, opinionated approach.[SRC-24] |
| DUADP | Decentralized discovery/federation | Discovery, registry, trust signals | Discovery APIs + federated patterns | Trust tiers / policy alignment claims | Early-stage, strongly positioned in OSSA-adjacent narrative.[SRC-01][SRC-03] |
| OSSA | Agent contract manifest standard | Identity/capability/deployment contract | YAML/JSON manifest + schema | Pre-authorization trust boundaries and governance metadata | Early-stage but clear contract-layer thesis.[SRC-08][SRC-09][SRC-12] |

## 3) Design-goal comparison

- **MCP** optimizes for “connect my model/agent to tools and data safely.”  
- **A2A/ACP/ANP** optimize for “connect my agent to other agents.”  
- **AG-UI** optimizes for “connect my agent to product UX.”  
- **OSSA/DUADP** optimize for “define/discover/govern agents across heterogeneous stacks.”

These are complementary concerns. Most production systems in 2026 will likely compose multiple protocols rather than choose exactly one.

## 4) Interoperability trend

Ecosystem momentum is shifting from monolithic “framework lock-in” to protocol-mediated composition. The strongest near-term pattern is:

`MCP (tools) + A2A (agents) + AG-UI (UX) + internal policy/identity layer`

Projects like OSSA/DUADP are betting that explicit contract + discovery standards become the next operational bottleneck and therefore the next standardization frontier.[SRC-08][SRC-01]

## 5) Risks if standards fragment

Without convergence:
- vendor-specific schema drift,
- duplicated integration work,
- weak cross-org trust/identity semantics,
- and ambiguous accountability boundaries for autonomous actions.

These are already visible in security/governance reports and are the main reason identity/authz standardization is now central to agentic AI policy discussions.[SRC-38][SRC-41]
