# Open-Source Frameworks and Platforms (2025-2026)

## Scope

This document summarizes major framework ecosystems for agentic AI, with emphasis on:

- core primitives,
- production posture,
- interoperability with protocols (MCP/A2A/AG-UI/other),
- and ecosystem maturity signals (GitHub and npm where available).

For protocol specifics, see `protocols.md`.

## 1) Major framework projects

### OpenAI Agents SDK

OpenAI Agents SDK (Python) presents a concise core model: agents, tools, handoffs, guardrails, tracing, with provider-agnostic support claims and MCP tool support [R43]. It is one of the fastest-growing open-source projects in this category by GitHub stars [R74].

**Practical fit:** teams wanting a modern default for multi-agent orchestration with built-in observability and strong docs.

### LangGraph

LangGraph is a low-level orchestration framework for stateful, long-running graph execution, emphasizing durable execution, memory, and human-in-the-loop workflows [R44]. It also underpins LangChain’s higher-level agent experiences and aligns closely with Agent Protocol concepts [R05] [R44].

**Practical fit:** state-heavy workflows, long-horizon tasks, explicit control-flow and failure-recovery needs.

### CrewAI

CrewAI positions itself as independent, performance-oriented, and enterprise-focused with two abstractions:

- **Crews** (autonomous role collaboration),
- **Flows** (event-driven deterministic orchestration) [R45].

Adoption signal is high by GitHub stars, with active ecosystem examples [R74].

**Practical fit:** teams that want a high-level but production-minded orchestration pattern without deep graph plumbing.

### AutoGen (Microsoft)

AutoGen is now explicitly in maintenance mode and points new users to Microsoft Agent Framework; however, it remains influential and widely used in existing deployments [R46].

**Practical fit:** legacy/installed-base projects; not ideal as a greenfield default unless constrained by migration cost.

### LlamaIndex

LlamaIndex remains strong for retrieval-centric and document-agent patterns [R41] [R73].

**Practical fit:** RAG-heavy workloads and enterprise document/knowledge synthesis workflows.

### LangChain

LangChain remains a broad application framework with a very large ecosystem gravity signal [R73].

**Practical fit:** composable integration layer for mixed-tooling AI applications; often paired with LangGraph in production.

## 2) Specialized platform and enterprise products

### GitLab Duo Agent Platform (GA Jan 2026)

GitLab’s GA release introduces:

- context-rich agentic chat in web/IDE,
- foundational specialist agents (planner, security analyst),
- flow automation,
- MCP client integrations,
- model-selection and governance controls [R35] [R47].

This is a notable example of **agentization of an existing enterprise platform** rather than a standalone framework.

### Claude Code and coding agents

While not covered here as a dedicated framework spec, coding-focused agents illustrate the current pattern: high utility in scoped domains, heavy dependence on robust tool connectors and guardrails [R10] [R17].

## 3) Community and “trending” project signals

GitHub search/top-repo snapshots show broad, active interest in:

- LangChain/LangGraph,
- AutoGen,
- CrewAI,
- OpenAI Agents SDK,
- LlamaIndex,
- several newer and domain-specific agent frameworks [R73] [R74].

This indicates no single framework monopoly; instead, ecosystems are fragmenting by use case:

- enterprise process automation,
- coding agents,
- RAG/document agents,
- and domain-specific vertical agents.

## 4) Comparative summary

| Framework / Platform | Core abstraction | Best at | Risks / tradeoffs | Maturity signal |
| --- | --- | --- | --- | --- |
| OpenAI Agents SDK | agents/tools/handoffs/guardrails/tracing | rapid multi-agent build + tracing | API/provider coupling choices still matter | high OSS momentum [R43] [R74] |
| LangGraph | explicit stateful graph runtime | durable long-running workflows | steeper modeling complexity | high OSS momentum [R44] [R74] |
| CrewAI | crews + flows | structured collaborative orchestration | less low-level control than graph-first designs | high OSS momentum [R45] [R74] |
| AutoGen | multi-agent programming layers | legacy ecosystems, experimentation | maintenance mode; migration pressure | large installed base [R46] [R74] |
| LlamaIndex | retrieval/document agents | enterprise knowledge tasks | less general orchestration than some peers | strong OSS signal [R41] [R73] |
| GitLab Duo Agent Platform | integrated DevSecOps agents | SDLC-wide enterprise workflows | platform lock-in considerations | GA enterprise product [R35] [R47] |

## 5) Cost and production guidance from engineering literature

Production blog analyses emphasize:

- hidden costs in orchestration/debugging, not just token spend,
- need for progressive rollout,
- aggressive observability,
- and human approval for high-consequence actions [R24] [R25].

These recommendations align with independent security/governance data from Gravitee and NIST framing [R08] [R26] [R27].

## 6) DUADP + OSSA package-level interpretation in framework context

Although DUADP and OSSA are not “frameworks” in the same sense as LangGraph/CrewAI, they are best understood as **infrastructure and contract layers** that can sit under many frameworks.

### `@bluefly/duadp`

- TypeScript SDK + CLI, Apache-2.0, latest `0.1.4`,
- created March 2026 with rapid early patch releases,
- currently low npm volume (`170` weekly) [R57] [R58] [R59].

Interpretation: early infrastructure project with technical ambition and currently small ecosystem footprint.

### `@bluefly/openstandardagents`

- larger CLI/spec/tooling package, Apache-2.0, latest `0.5.1`,
- versions from Nov 2025 through Mar 2026,
- currently low npm volume (`182` weekly) [R57] [R58] [R59].

Interpretation: broader tooling surface and stronger maturity than DUADP, but still early-stage adoption versus mainstream framework ecosystems.

