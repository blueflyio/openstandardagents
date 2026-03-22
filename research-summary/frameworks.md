# Open-Source Frameworks, Repositories, and npm Packages

## Snapshot (March 22, 2026)

| Project | Core focus | Key primitives/model | Repo signal (stars) |
| --- | --- | --- | --- |
| OpenAI Agents SDK (Py/JS) | Lightweight multi-agent orchestration | agents, handoffs, guardrails, tracing (+ tools/sessions/HITL/realtime) | Py 20,186; JS 2,512.[R26][R27][R64] |
| LangGraph | Stateful graph orchestration | nodes/edges/state graphs, durable execution, HITL, memory | 27,116.[R31][R32][R64] |
| CrewAI | Multi-agent + workflow composition | Crews (autonomy) + Flows (event-driven control) | 46,814.[R33][R64] |
| Microsoft AutoGen | Multi-agent framework stack | Core API, AgentChat, Extensions, Studio tools | 55,992.[R34][R64] |
| LlamaIndex | Data/RAG/document-agent framework | connectors, indexing/retrieval, llama-agents layer | 47,856.[R35][R64] |
| LangChain Agent Protocol | API contract for served agents | runs, threads, store, introspection | 532.[R18][R64] |
| Agent Network Protocol repo | Protocol/spec + ecosystem work | 3-layer network architecture | 1,242.[R20][R64] |

---

## OpenAI Agents SDK

The OpenAI Agents SDK emphasizes a small primitive set with production-oriented runtime capabilities:

- agents
- handoffs (agents as tools)
- guardrails
- tracing
- plus tools (including MCP), sessions, human-in-the-loop, realtime options.[R26][R27][R28][R29]

The npm package (`@openai/agents`) shows high weekly usage signals and active release cadence through 2026.[R30]

---

## LangGraph

LangGraph’s position is "low-level orchestration runtime" for durable, stateful, long-running workflows. Its strongest differentiators are:

- durable execution,
- explicit state transitions,
- interruption/human oversight patterns,
- deployment/observability coupling in broader LangChain ecosystem.[R31][R32]

---

## CrewAI

CrewAI markets a dual model:

- **Crews** for role-based autonomous collaboration,
- **Flows** for deterministic/event-driven production control.[R33]

It reports strong community momentum and provides many practical examples; however, performance and comparative claims should be validated in each target environment.[R33]

---

## AutoGen

AutoGen remains a major ecosystem with layered abstractions and companion tooling (Studio, benchmark tooling). It supports advanced multi-agent scenarios and MCP-connected agent workflows but explicitly points new users toward Microsoft Agent Framework for some greenfield use cases.[R34]

---

## LlamaIndex

LlamaIndex is increasingly positioned as a document-centric/agentic data stack:

- ingestion/connectors,
- indexing/retrieval,
- orchestration for document agents,
- large integration ecosystem.[R35]

Its strength is strongest where agent quality depends on retrieval/data plumbing discipline.

---

## GitLab Duo Agent Platform (enterprise reference implementation)

GitLab’s GA agent platform bundles:

- foundational agents (planner, security analyst),
- custom/external agents,
- predefined multi-step flows,
- integration with IDE contexts and MCP connectivity.[R36][R37][R38][R39]

This is useful as a model for end-to-end productization (governance + workflows + UI + deployment) rather than as a standalone framework library.

---

## Production cost and reliability notes (cross-framework)

A credible production writeup from 47Billion suggests:

- complexity and cost increase sharply from single-agent workflows to open-ended multi-agent systems,
- strong guardrails/HITL patterns are required for reliability,
- protocol standard adoption can reduce integration overhead.[R40]

Ruh.ai similarly argues protocol selection is often the integration bottleneck and proposes staged adoption/decision frameworks (with caveats noted in `blogs.md`).[R41]

---

## Requested deep dive: npm package meaning

## `@bluefly/openstandardagents`

A CLI/spec tooling package around OSSA, positioned as portable manifest + export layer across multiple target platforms and runtimes.[R03][R05]

What it is conceptually: **contract and packaging layer** for agent definitions, not a substitute for transport protocols like MCP/A2A.

## `@bluefly/duadp`

A TypeScript SDK/server package for DUADP discovery/federation/registry capabilities with well-known discovery endpoints and identity/trust concepts.[R01][R02][R04]

What it is conceptually: **federated discovery and registry layer** for capabilities.

## `@openai/agents`

A production-focused JS SDK for agent orchestration primitives and runtime concerns (tools, handoffs, guardrails, tracing, sessions, voice/realtime) with strong ecosystem adoption signals.[R27][R30]

## `@ag-ui/core`

A high-download package of AG-UI core schemas/types/events that functions as foundation library for agent-frontend integration flows.[R14][R17]

---

## Notable repos to watch

- `a2aproject/A2A` (protocol + tooling + ecosystem momentum).[R10][R64]
- `modelcontextprotocol/modelcontextprotocol` (MCP spec/docs baseline).[R07][R64]
- `ag-ui-protocol/ag-ui` (frontend interaction layer standardization).[R14][R16][R64]
- `mondaycom/agent-tool-protocol` (early code-execution protocol direction).[R24][R25]
- `blueflyio/openstandardagents` and `blueflyio/duadp` (contract + discovery stack experiments).[R03][R01][R64]

