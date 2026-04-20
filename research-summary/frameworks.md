# Open-Source Frameworks, Repositories, and Project Maturity (2026)

Prepared: April 20, 2026

This document summarizes the principal open-source frameworks and repositories relevant to agentic AI implementation, with emphasis on:
- purpose and architecture
- core primitives
- maturity and community signals
- relationship to protocols (MCP, A2A, AG-UI, etc.)
- specific context for DUADP/OSSA npm packages

---

## 1) DUADP and OSSA package-level assessment (requested focus)

## 1.1 `@bluefly/duadp` (DUADP)

What it is:
- TypeScript SDK + server router for DUADP, positioned as decentralized discovery/federation for agents/skills/tools. [T03][T01]
- Provides protocol endpoints for discovery, search, publish, validate, federation, DID/webfinger-related identity flows, and conformance support. [T03][T02]

Key technical claims:
- 15+ core endpoints for discovery and registry; homepage/docs also reference a broader operations/governance surface. [T03][T02]
- DID support (`did:web`, `did:key`) and Ed25519 signing helpers in SDK messaging. [T03]
- Express integration via `createDuadpRouter(...)`. [T03]

Package metadata snapshot:
- npm package: `@bluefly/duadp`
- latest version observed: 0.1.4
- weekly downloads shown on npm page/registry snapshot: low hundreds range (time-varying)
- Apache-2.0 license
- early-stage adoption profile (few versions, minimal dependents). [T03]

Interpretation:
- This is currently best viewed as an **early-stage protocol implementation and SDK** rather than a broadly standardized internet-scale discovery substrate.
- Architecture direction (federated discovery + trust metadata) aligns with broader market need, but external ecosystem proof remains nascent.

## 1.2 `@bluefly/openstandardagents` (OSSA)

What it is:
- CLI + schema + exporters for OSSA manifest model; positions itself as “define once, export to many platforms.” [T05][T04]
- Explicitly framed as contract/packaging layer that complements MCP/A2A, not replacing them. [T05]

Key technical claims:
- Manifest schema/versioning, validation/lint/migration workflows.
- Large command surface (wizard, validate, export, migrate, skills, workspace, etc.) and multiple platform adapters of varying maturity labels. [T05]
- Integrates discovery story with DUADP in its own ecosystem narrative. [T05][T06]

Package metadata snapshot:
- npm package: `@bluefly/openstandardagents`
- latest version observed: 0.5.1
- weekly downloads: low hundreds range (time-varying)
- Apache-2.0 license
- large package footprint and substantial dependency tree. [T05]

Interpretation:
- OSSA currently functions as an **opinionated agent manifest + export ecosystem** with broad ambition.
- Adoption appears early but active. Teams should validate output quality per target runtime and treat maturity labels seriously before production standardization.

---

## 2) Major open-source frameworks and SDKs

## 2.1 OpenAI Agents SDK (`openai/openai-agents-python`)

Position:
- Lightweight multi-agent SDK with explicit primitives around agents, tools, handoffs, guardrails, sessions, tracing, human-in-the-loop, and realtime options. [T27]

Core primitives highlighted:
- Agents
- Handoffs / agents-as-tools
- Guardrails (input/output/tool)
- Tracing and run observability [T27]

Community snapshot (GitHub API, Apr 20 2026):
- stars: 23,618
- forks: 3,669
- open issues: 65
- very recent commit activity. [G01]

Assessment:
- Strong momentum and mature docs.
- Good fit for teams prioritizing explicit control primitives and integrated safety/observability semantics.

## 2.2 LangGraph (`langchain-ai/langgraph`)

Position:
- Low-level orchestration/runtime for durable, long-running, stateful agents and workflows. [T26]

Core strengths:
- durable execution and resume
- human interrupts
- memory patterns
- production orchestration orientation [T26]

Community snapshot:
- stars: 29,716
- forks: 5,075
- open issues: 489
- high activity. [G02]

Assessment:
- Strong orchestration substrate for teams that want explicit graph control instead of higher-level abstraction.

## 2.3 CrewAI (`crewAIInc/crewAI`)

Position:
- Python framework for autonomous/multi-agent collaboration, with “crews” and “flows” abstractions. [T28]

Core strengths:
- role-based collaboration model
- significant enterprise-style messaging around observability/control plane offerings
- broad user and training ecosystem claims [T28]

Community snapshot:
- stars: 49,301
- forks: 6,745
- open issues: 400 [G03]

Assessment:
- Highly popular and practical for production-minded teams, especially where structured workflow abstractions are preferred.

## 2.4 AutoGen (`microsoft/autogen`)

Position:
- Historically influential multi-agent framework; now explicitly marked maintenance mode in repo README. [T29]

Current status note:
- Microsoft recommends new projects use Microsoft Agent Framework (successor path). [T29]

Community snapshot:
- stars: 57,227
- forks: 8,624
- open issues: 778 [G04]

Assessment:
- Still extremely important historically and for existing installations, but new net-new builds should factor maintenance-mode risk.

## 2.5 LlamaIndex (`run-llama/llama_index`)

Position:
- Data-centric framework for LLM applications, retrieval, and document-centric systems; broad integration ecosystem. [T30]

Core strengths:
- data connectors/indexing/retrieval abstraction
- strong document/RAG orientation
- large extension ecosystem [T30]

Community snapshot:
- stars: 48,708
- forks: 7,231
- open issues: 302 [G05]

Assessment:
- Strong choice when the dominant challenge is grounding and retrieval over heterogeneous enterprise data.

---

## 3) Protocol and interoperability repositories

## 3.1 LangChain Agent Protocol (`langchain-ai/agent-protocol`)

Position:
- OpenAPI-described framework-agnostic serving interface around runs, threads, and store primitives. [T20][T21]

Community snapshot:
- stars: 569
- forks: 47
- open issues: 17 [G06]

Assessment:
- Important design influence for interoperability conversations, but adoption remains modest compared to top frameworks.

## 3.2 Google / A2A (`a2aproject/A2A`)

Position:
- Multi-agent interop protocol with Agent Card model and task lifecycle abstractions. [T15][T14]

Community snapshot:
- stars: 23,304
- forks: 2,359
- open issues: 233 [G08]

Assessment:
- One of the strongest momentum signals among inter-agent protocols; enterprise partner narrative is unusually broad.

## 3.3 ANP (`agent-network-protocol/AgentNetworkProtocol`)

Position:
- Open protocol vision for “HTTP of agentic web,” DID-centered layered architecture. [T19]

Community snapshot:
- stars: 1,266
- forks: 85
- open issues: 22 [G07]

Assessment:
- Conceptually ambitious; adoption still early relative to MCP/A2A mainstream gravity.

## 3.4 AG-UI (`ag-ui-protocol/ag-ui`)

Position:
- Event-based protocol for agent-user interaction in front-end contexts. [T18][T17]

Community snapshot:
- stars: 13,101
- forks: 1,174
- open issues: 253 [G10]

Assessment:
- Rapidly significant as “agent UX wiring” standard candidate; complements MCP/A2A, does not compete directly.

## 3.5 ACP (`i-am-bee/acp`)

Position:
- REST-oriented agent communication protocol from IBM/BeeAI lineage; now indicating movement under A2A umbrella in documentation. [T22][T23]

Community snapshot:
- stars: 988
- forks: 117
- open issues: 0 [G11]

Assessment:
- Useful practical REST-oriented model; governance consolidation with A2A may shape long-term trajectory.

## 3.6 Monday Agent Tool Protocol (`mondaycom/agent-tool-protocol`)

Position:
- Code-execution-centric protocol (TypeScript/JS sandbox) claiming advantages over strict function-schema approaches in some workloads. [T43]

Community snapshot:
- stars: 94
- forks: 10
- open issues: 0 [G09]

Assessment:
- Interesting alternative for specialized environments; currently niche compared to mainstream protocol initiatives.

---

## 4) GitLab Duo Agent Platform as productized “agent platform” benchmark

GitLab’s GA announcement (Jan 2026) is notable as a production platform reference model:
- contextual “agentic chat”
- foundational specialist agents (planner, security analyst)
- flow automation
- custom/internal catalog + external agents (including Claude Code and Codex CLI integration statements)
- governance and model selection controls. [T31][T49]

This matters for framework teams because it illustrates the operational envelope enterprises expect:
- lifecycle integration,
- policy/governance,
- and measurable productivity impact rather than isolated coding-assistant tasks.

---

## 5) Practical cost and reliability insights from engineering blogs

While not peer-reviewed, 47Billion’s long-form production writeup gives actionable engineering observations:
- major gap between demos and reliable production
- token/cost blowups in unbounded multi-agent loops
- need for HITL checkpoints and strict guardrails
- protocol layering (MCP/A2A/AG-UI) as integration hygiene. [T44]

Treat these as engineering heuristics, not universal benchmarks.

---

## 6) Comparative table: framework and project maturity snapshot

| Project | Category | Primary use | Snapshot maturity signal (Apr 20, 2026) |
|---|---|---|---|
| OpenAI Agents SDK | Framework/SDK | Multi-agent workflows with guardrails/tracing | 23.6k stars, active |
| LangGraph | Orchestration runtime | Durable stateful workflows/agents | 29.7k stars, active |
| CrewAI | Multi-agent framework | Role/task-driven agent orchestration | 49.3k stars, active |
| AutoGen | Multi-agent framework | Legacy influential multi-agent framework | 57.2k stars, maintenance mode |
| LlamaIndex | Data/RAG framework | Data integration, retrieval, document agents | 48.7k stars, active |
| A2A repo | Inter-agent protocol | Agent-to-agent interoperability | 23.3k stars, high momentum |
| AG-UI | Agent-UI protocol | Front-end/back-end agent interaction | 13.1k stars, high momentum |
| Agent Protocol | Serving protocol spec | Runs/threads/store APIs | 569 stars, early/moderate |
| ANP | Inter-agent protocol | DID/network-centric agent web | 1.3k stars, early |
| ACP | Inter-agent protocol | RESTful agent communication | 988 stars, evolving under A2A context |
| DUADP package | Discovery protocol SDK | Federated discovery + trust metadata | early-stage npm adoption |
| OSSA package | Contract/manifest toolchain | Define/export agent contracts | early-stage npm adoption |

Sources: [G01]–[G11], [T03], [T05]

---

## 7) Recommendations for teams selecting frameworks/protocols now

1. Separate decisions:
- Orchestration runtime (LangGraph/CrewAI/OpenAI SDK)
- Inter-agent protocol (A2A/ACP/ANP path)
- UI protocol (AG-UI where relevant)
- Contract and discovery layers (OSSA/DUADP or equivalents)

2. Avoid maintenance-mode lock-in for net-new systems:
- Treat AutoGen as migration planning case unless hard constraints apply. [T29]

3. Validate maturity by evidence:
- stars/issues/activity are useful but insufficient.
- run proof-of-conformance and operational tests (timeouts, retries, auth boundaries, policy enforcement, auditability).

4. For DUADP/OSSA evaluation:
- test against your concrete workloads: discovery latency, trust assertions, governance metadata utility, export fidelity, and rollback/migration ergonomics.
- do not assume ecosystem claims imply broad third-party interoperability until independently verified.

---

## References (frameworks and project signals)

- [T03] npm registry snapshot + README for `@bluefly/duadp` (`registry.npmjs.org/@bluefly/duadp`)
- [T05] npm registry snapshot + README for `@bluefly/openstandardagents` (`registry.npmjs.org/@bluefly/openstandardagents`)
- [T20] `langchain-ai/agent-protocol` README
- [T21] LangChain blog on Agent Protocol interoperability
- [T26] LangGraph docs overview
- [T27] `openai/openai-agents-python` README
- [T28] `crewAIInc/crewAI` README
- [T29] `microsoft/autogen` README
- [T30] `run-llama/llama_index` README
- [T31] GitLab blog: Duo Agent Platform GA
- [T44] 47Billion engineering blog on production agents
- [T49] GitLab press release (Jan 15, 2026)

- [G01] GitHub API snapshot: `openai/openai-agents-python` (Apr 20, 2026)
- [G02] GitHub API snapshot: `langchain-ai/langgraph`
- [G03] GitHub API snapshot: `crewAIInc/crewAI`
- [G04] GitHub API snapshot: `microsoft/autogen`
- [G05] GitHub API snapshot: `run-llama/llama_index`
- [G06] GitHub API snapshot: `langchain-ai/agent-protocol`
- [G07] GitHub API snapshot: `agent-network-protocol/AgentNetworkProtocol`
- [G08] GitHub API snapshot: `a2aproject/A2A`
- [G09] GitHub API snapshot: `mondaycom/agent-tool-protocol`
- [G10] GitHub API snapshot: `ag-ui-protocol/ag-ui`
- [G11] GitHub API snapshot: `i-am-bee/acp`
