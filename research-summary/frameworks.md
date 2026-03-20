# Open-Source Frameworks and Platforms

Prepared: March 20, 2026

## 1) Framework comparison (core primitives and maturity)

| Framework / Platform | Core primitives | Strengths | Cost/ops considerations | Maturity signal |
|---|---|---|---|---|
| OpenAI Agents SDK | agents, tools, handoffs, guardrails, tracing | Fast path to multi-agent orchestration with built-in observability | Cost grows with tool loops, tracing volume, and model mix; requires strict tool policy bounds | 20,150 stars (`openai/openai-agents-python`) [R21][R22][R46] |
| LangGraph | graph nodes/edges/state, durable execution, HITL, memory | Deterministic workflow control for long-running agents | More design overhead than prompt-only apps; requires state model discipline | 26,965 stars [R23][R46] |
| CrewAI | agents + tasks + crews + process modes | Role-based team orchestration and practical multi-agent decomposition | Runtime complexity increases with hierarchical crews and memory stores | 46,649 stars [R24][R46] |
| AutoGen | event-driven agents, async messaging, actor-style runtime | Scalable/distributed multi-agent patterns; strong research-to-prod bridge | Greater architecture complexity; needs observability and failure handling patterns | 55,926 stars [R25][R46] |
| LlamaIndex | retrieval + workflows + agent workflows | Strong RAG-to-agent bridge and data-centric orchestration | Retrieval/index costs and data freshness management dominate in many deployments | 47,813 stars [R26][R46] |
| LangChain Agent Protocol ecosystem | Runs/Threads/Store contract for serving | API-level interoperability and deployability patterns | Must still solve infra/security independently | 531 stars (protocol repo) [R16][R17][R46] |
| GitLab Duo Agent Platform | foundational agents + agentic chat + AI catalog | End-to-end SDLC integration with governance surfaces in one platform | Commercial credits/licensing and platform coupling trade-offs | GA in GitLab 18.8 (Jan 15, 2026) [R27][R28] |

## 2) OpenAI Agents SDK

OpenAI's SDK centers around a small primitive set:

- agents
- tools
- handoffs/agents-as-tools
- guardrails
- tracing [R21][R22]

The project states provider-agnostic use and highlights interoperability patterns with external tools and MCP-style integrations. [R21][R22]

## 3) LangGraph

LangGraph uses graph/state semantics for resilient agent systems, with durable execution and human-in-the-loop controls explicitly treated as first-class deployment capabilities. [R23]  
This suits production workflows where retries, pause/resume, and deterministic transitions matter more than "single prompt" convenience.

## 4) CrewAI

CrewAI formalizes multi-agent workflows around:

- **agents** (roles/goals)
- **tasks**
- **crews**
- **execution process** (sequential/hierarchical) [R24]

It is often selected when role decomposition and team-style orchestration are central requirements.

## 5) Microsoft AutoGen

AutoGen emphasizes event-driven distributed multi-agent architecture with asynchronous messaging patterns and broad extensibility. [R25]  
It remains a strong option for teams that need deep control over agent runtime behaviors and cross-service orchestration.

## 6) LlamaIndex

LlamaIndex evolved from RAG-first tooling into broader workflow/agent orchestration, especially where enterprise data pipelines and retrieval quality are primary constraints. [R26]  
Agent workflows are positioned for multi-step, event-driven automation.

## 7) GitLab Duo Agent Platform (enterprise product)

GitLab's Duo Agent Platform reached GA in January 2026, featuring:

- foundational agents (including planner and security analyst)
- AI catalog for discoverability and controlled reuse
- integration across GitLab workflow surfaces [R27][R28]

This indicates a clear trend: agent features are moving into core enterprise developer platforms rather than staying in standalone experimentation tools.

## 8) Notable open standard repositories

| Repository | Why notable | Stars (Mar 20, 2026) |
|---|---|---:|
| `a2aproject/A2A` | Open A2A protocol implementation/spec repo | 22,684 |
| `modelcontextprotocol/typescript-sdk` | Dominant MCP SDK implementation | 11,904 |
| `ag-ui-protocol/ag-ui` | Agent-frontend interaction protocol | 12,577 |
| `langchain-ai/agent-protocol` | OpenAPI contract for agent runtime APIs | 531 |
| `agent-network-protocol/AgentNetworkProtocol` | ANP vision/spec reference | (verify in repo; stars not central maturity signal) |

Source for star counts: GitHub CLI queries executed on March 20, 2026. [R46]

## 9) Framework selection heuristic

Use this shorthand:

- Need deterministic stateful orchestration: **LangGraph / AutoGen**
- Need role/team style fast multi-agent iteration: **CrewAI**
- Need retrieval-heavy enterprise data workflows: **LlamaIndex**
- Need quickest production-ready primitives with integrated tracing/guardrails: **OpenAI Agents SDK**
- Need SDLC-native enterprise integration/governance: **GitLab Duo Agent Platform**
