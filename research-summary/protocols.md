# Protocols and Standards in the Agentic AI Ecosystem (2025-2026)

Date compiled: March 27, 2026  
Relative-date normalization reference: March 10, 2026

## Scope and framing

This document summarizes protocol-level standards requested in the research brief, with emphasis on:

- primary source provenance,
- protocol purpose and architectural scope,
- message and transport patterns,
- maturity and adoption signals,
- interoperability role in a multi-protocol stack.

## DUADP (Decentralized Universal AI Discovery Protocol)

DUADP describes itself as the missing discovery layer for agents/skills/tools, analogous to DNS for AI capabilities. Across the DUADP and OSSA DUADP pages, the recurring implementation pattern is:

- `/.well-known/duadp(.json)` discovery manifest,
- registry/search endpoints for agents, skills, tools,
- optional federation endpoints and gossip propagation,
- DID-based identities, trust tiers, and verification metadata. [S01][S03]

The DUADP npm SDK (`@bluefly/duadp`) positions itself as a TypeScript client/server toolkit with endpoint routing, validation, conformance testing, and DID/signature support. [S06]

Key takeaway: DUADP's claimed value is cross-domain discovery and trust signaling, not runtime execution or model orchestration itself. [S01][S03][S06]

## OSSA (Open Standard Agents / Open Standard for Software Agents)

OSSA positions itself as a contract/manifest layer between protocol transports and deployment frameworks. In OSSA's framing:

- MCP = tool connectivity
- A2A = agent communication
- OSSA = portable agent definition with governance metadata [S02][S04][S05]

The OSSA npm package (`@bluefly/openstandardagents`) describes a schema/CLI export ecosystem with many deployment targets and built-in validation/tooling workflows. [S07]

Key takeaway: OSSA attempts to standardize "agent shape + governance descriptors" across runtimes, rather than replace transport protocols. [S02][S04][S07]

## Model Context Protocol (MCP)

MCP was introduced by Anthropic on November 25, 2024 as an open standard for model/client connections to external tools and data systems. Initial architecture and ecosystem claims include:

- open specification and SDKs,
- MCP servers + clients,
- secure two-way connectivity pattern,
- replacement of fragmented one-off connectors. [S08]

As of December 9, 2025, Anthropic announced donation of MCP into the Linux Foundation's Agentic AI Foundation (AAIF), citing broad ecosystem adoption and governance-neutral stewardship. [S09][S25]

Key takeaway: MCP has become a de facto baseline for agent-to-tool/data integration, with governance transitioning from vendor-led origin to foundation stewardship. [S08][S09][S25]

## Agent2Agent (A2A)

Google introduced A2A on April 9, 2025 for agent-to-agent interoperability across vendors/frameworks, with early support from 50+ organizations and later references to >150 supporters in follow-on ecosystem messaging. [S10][S26]

A2A specification and README-level design indicate:

- Agent Cards for capability discovery,
- JSON-RPC over HTTP(S),
- streaming and asynchronous task lifecycle support,
- task/message/part/artifact primitives,
- enterprise-aligned auth and observability patterns. [S11][S12]

The published A2A spec site lists a 1.0.0 release track and explicit operation model (send/stream/list/cancel/subscribe, push config methods), indicating maturation beyond draft concepts. [S11]

Key takeaway: A2A focuses on inter-agent coordination and delegated task exchange, complementing rather than replacing MCP. [S10][S11][S12]

## AG-UI (Agent-User Interaction protocol)

AG-UI is explicitly positioned as the agent-to-frontend interaction layer:

- event-driven protocol semantics,
- bidirectional interaction model,
- transport-agnostic framing (SSE/WebSockets/webhooks/HTTP variants),
- standardized event categories for lifecycle/text/tools/state/custom updates. [S13][S14]

Key takeaway: AG-UI addresses user experience and interface streaming/state concerns that MCP and A2A do not target directly. [S13][S14]

## Agent Network Protocol (ANP)

ANP's official repository frames the project as "HTTP of the Agentic Web era" and defines a three-layer architecture:

1. identity + secure communication (DID-based),
2. meta-protocol negotiation,
3. application protocol layer for capability/protocol descriptors. [S12]

Key takeaway: ANP is an ambitious broader network architecture vision; practical enterprise adoption appears less mature than MCP/A2A at this stage based on available evidence in this batch.

## LangChain Agent Protocol

LangChain's Agent Protocol repository and blog define framework-agnostic serving APIs centered on:

- Runs,
- Threads,
- Store (long-term memory APIs),
- agent introspection endpoints. [S15][S30]

Key takeaway: this is an application-serving API standard for agent backends (especially deployment interoperability), not a network discovery layer.

## ACP (Agent Communication Protocol)

ACP appears in two forms in this source set:

- academic/industry references and survey papers discussing ACP as REST-oriented agent communication,
- IBM's explainer noting ACP's merger trajectory into broader Linux Foundation-led A2A efforts and recommending migration paths. [S43][S46][S48]

Key takeaway: ACP is significant conceptually and historically in agent communication discourse, but ecosystem center-of-gravity appears to be consolidating around A2A governance channels in 2026. [S43][S46]

## Monday.com Agent Tool Protocol (ATP)

Monday's ATP positioning differs from pure function-calling:

- code-writing/code-execution paradigm for tool use,
- sandboxed execution controls,
- OpenAPI/MCP compatibility claims,
- emphasis on scalability, discoverability, and guardrailed action control. [S44]

Key takeaway: ATP is an emerging pragmatic approach for "agent writes code against APIs," potentially complementary to MCP/A2A stacks.

## Comparative table (concise)

| Protocol/Spec | Primary purpose | Core artifact(s) | Typical transport/model | Adoption signal in sources |
| --- | --- | --- | --- | --- |
| MCP | Agent-to-tool/data connectivity | MCP server definitions, tool schemas | protocol-specific MCP client/server interactions | Broad multi-vendor platform mentions + AAIF transfer [S08][S09][S25] |
| A2A | Agent-to-agent task collaboration | Agent Card, task/message/part/artifact objects | JSON-RPC over HTTP(S), streaming/push support [S11][S12] | 50+ launch partners, later >150 ecosystem mentions [S10][S26] |
| AG-UI | Agent-to-user interface interaction | event stream schemas/types | transport-agnostic (SSE/websocket/webhook/http) [S13][S14] | Growing framework integration list in docs [S13] |
| ANP | Open agent-network architecture | DID layer + meta protocol + app layer | layered network protocol design [S12] | Active open-source project; lower mainstream enterprise signal in this batch |
| LangChain Agent Protocol | Framework-agnostic backend APIs | runs/threads/store OpenAPI contract | HTTP API serving | LangGraph ecosystem implementation and published API docs [S15][S30] |
| ACP | REST-style inter-agent protocol model | REST endpoints + message/session concepts | HTTP-first | IBM-backed narrative; merger trajectory toward A2A ecosystem [S43][S46] |
| DUADP | Agent/skill/tool discovery and federation | `.well-known` manifest + registry/federation APIs | HTTP APIs + federation mechanisms | Active site/npm SDK and OSSA-linked spec pages [S01][S03][S06] |
| OSSA | Portable contract/manifest layer | OSSA YAML/JSON manifest + tooling | tooling/export layer (not transport protocol itself) | Active site/npm package and spec evolution [S02][S04][S07] |
| ATP | Code-execution-based agent tooling protocol | code runtime + API discovery/execution controls | runtime API calls + sandboxed execution | Early-stage but explicit operational model and examples [S44] |

## Adoption and maturity observations

1. **Most mature in this source set**: MCP and A2A (governance visibility, ecosystem support, active spec/SDKs). [S09][S11][S25][S12]
2. **Operationally important but differently scoped**: AG-UI and LangChain Agent Protocol (UI and serving-plane needs). [S13][S15][S30]
3. **Contract/discovery stack experimentation**: DUADP/OSSA pursuing portability + discovery + trust metadata.
4. **Consolidation trend**: ACP narratives increasingly reference convergence with/into A2A channels. [S43]

## Design guidance for implementers

- Treat protocol selection as **layer composition**, not winner-take-all:
  - MCP for tool/data,
  - A2A for inter-agent collaboration,
  - AG-UI for UX streaming,
  - manifest/discovery layer (e.g., OSSA/DUADP) if cross-platform portability/discovery is a hard requirement.
- Separate **contract and transport concerns** to reduce lock-in and simplify audits.
- Align protocol stack with identity and policy controls from day one (see `security.md`).

## Caveats

- Some claims (especially around broad ecosystem counts and benchmark assertions) are self-reported by protocol/project maintainers; where possible, they were retained as attributed claims.
- Several pages were partially inaccessible by direct fetch; alternatives (official mirrors, repo READMEs, official blogs) were used.
