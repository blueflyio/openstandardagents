# Agentic AI Frameworks and Platforms (2026)

Date baseline for normalized references: **March 10, 2026**.

## Executive summary

The framework ecosystem has split into three dominant patterns: (1) **workflow-native orchestration** (LangGraph, CrewAI), (2) **agent-runtime SDKs with guardrails/tracing** (OpenAI Agents SDK), and (3) **data/knowledge-centric agent stacks** (LlamaIndex). A fourth category is emerging around **enterprise SDLC-integrated agents** (GitLab Duo Agent Platform) and **conversational control layers** (Parlant). DUADP/OSSA sit adjacent to these frameworks by standardizing discovery, identity, packaging, and governance rather than replacing framework internals [T01][T02][T18][T31][T32][T33][T35].

## Comparative landscape

| Framework / Platform | Primary role | Core primitives | Notable strengths | Notable constraints |
| --- | --- | --- | --- | --- |
| OpenAI Agents SDK (`@openai/agents`, `openai-agents-python`) | Multi-agent runtime SDK | Agents, Handoffs, Guardrails, Tracing | Clean abstraction for production agent workflows; strong observability model | Requires careful tool and policy design to avoid unsafe actions [T18][T31] |
| LangGraph | Stateful graph orchestration | Nodes, edges, shared state, cycles | Durable stateful execution and controllable control-flow | Graph design complexity rises quickly in large systems [T32] |
| CrewAI | Team-style multi-agent orchestration | Crews, Flows, roles, tasks | Intuitive multi-agent decomposition and collaborative patterns | Requires strong governance of role boundaries and tool permissions [T33] |
| AutoGen | Multi-agent conversation framework | Conversational agents, tool-use exchanges | Mature examples and broad community footprint | Officially in maintenance mode; recommended migration path for new Microsoft builds [T34] |
| LlamaIndex | Data and document agent stack | Indexes, retrievers, query engines, workflows | Strong RAG/data integration and enterprise connectors | Requires retrieval and index quality discipline to avoid low-signal contexts [T35] |
| Parlant | Conversational control/context-engineering | Guidelines, journeys, tool association, canned responses | Strong behavioral consistency for customer-facing interactions | Best fit is narrow to conversational control, not general DAG orchestration [T36] |
| BotParlay | Experimental multi-agent discourse platform | Structured sessions, urgency arbitration, sandboxed code execution | Useful experimentation model for multi-agent discourse and live prototyping | Very early-stage maturity and ecosystem depth [T37] |
| GitLab Duo Agent Platform | SDLC-integrated enterprise platform | Agentic chat, foundational agents, custom agents | Strong software lifecycle integration and enterprise workflows | Tied to GitLab ecosystem choices and enterprise rollout realities [T38][T39] |

## Adoption signals snapshot (as of April 7, 2026)

| Project / package | Signal type | Observed metric |
| --- | --- | --- |
| `@openai/agents` (npm) | Weekly downloads | ~468.9K weekly downloads [T17] |
| `@bluefly/duadp` (npm) | Weekly downloads | 165 weekly downloads [T15] |
| `@bluefly/openstandardagents` (npm) | Weekly downloads | 269 weekly downloads [T16] |
| `openai/openai-agents-python` | GitHub stars/forks | 20,624 stars / 3,381 forks [T31] |
| `langchain-ai/langgraph` | GitHub stars/forks | 28,603 stars / 4,892 forks [T32] |
| `crewAIInc/crewAI` | GitHub stars/forks | 48,230 stars / 6,572 forks [T33] |
| `microsoft/autogen` | GitHub stars/forks | 56,785 stars / 8,542 forks [T34] |
| `run-llama/llama_index` | GitHub stars/forks | 48,364 stars / 7,166 forks [T35] |
| `emcie-co/parlant` | GitHub stars/forks | 17,873 stars / 1,512 forks [T36] |
| `dray3310-hash/botparlay` | GitHub stars/forks | 1 star / 0 forks [T37] |

## Framework notes

### OpenAI Agents SDK

OpenAI positions its SDK around a minimal set of production primitives: **agent definitions, handoffs, guardrails, and tracing**. This design lowers implementation overhead for teams that need multi-agent decomposition without writing their own orchestration substrate [T18][T31]. The JavaScript package’s very high weekly download volume suggests broad experimentation and/or production uptake in the JS ecosystem [T17].

### LangGraph

LangGraph’s core value is deterministic orchestration under a graph model where state is explicit and cycles are legal. This is particularly useful for long-running or multi-step agent flows that need resumability, state checkpoints, and transparent transition logic [T32]. Teams typically pair it with explicit observability and policy layers.

### CrewAI

CrewAI emphasizes role specialization (crews) and event-driven workflow composition (flows). It is frequently used in settings where organizations map business roles to autonomous or semi-autonomous agents [T33]. It improves developer ergonomics for collaborative agent systems, but still needs external trust/governance controls.

### AutoGen

AutoGen remains influential and widely starred, but repository guidance indicates maintenance mode and points new projects toward Microsoft’s newer framework direction. Existing users can continue running it, but strategic greenfield work should evaluate migration risks and lifecycle support [T34].

### LlamaIndex

LlamaIndex is strongest when data access and retrieval quality are the differentiator. It extends beyond retrieval helpers into broader workflow and agentic patterns, but its core leverage remains **document/data grounding** and enterprise connectors [T35].

### Parlay-family and experimental systems

Parlant exemplifies a control-layer-first approach, prioritizing predictable behavior in customer-facing contexts with guideline matching, journeys, and controlled responses [T36]. BotParlay demonstrates an experimental discourse model for structured multi-agent dialogue and safe code execution in sandboxed runtime conditions [T37]. These represent useful alternatives for specialized scenarios, not general replacements for mature orchestration frameworks.

### GitLab Duo Agent Platform

GitLab’s platform demonstrates integration of agentic capability directly into SDLC systems (planning, analysis, security, CI), including foundational agents such as Planner and Security Analyst [T38][T39]. It is a notable example of enterprise productization where agent capabilities are embedded into existing developer workflows rather than deployed as standalone orchestration stacks.

## Selection guidance

| If your primary need is... | Prefer... | Why |
| --- | --- | --- |
| Stateful multi-step workflows with explicit control-flow | LangGraph | Strong graph semantics, state handling, and cyclic execution [T32] |
| Rapid multi-agent composition with clear role/task decomposition | CrewAI | Crew/flow abstractions map naturally to organizational roles [T33] |
| Lightweight multi-agent runtime + guardrails/tracing | OpenAI Agents SDK | Built-in primitives for handoffs and observability [T18][T31] |
| Data-grounded agents and document-centric intelligence | LlamaIndex | Mature retrieval/indexing and data integration focus [T35] |
| Customer-conversation behavioral consistency | Parlant | Guideline/journey model optimized for conversational control [T36] |
| SDLC-native enterprise automation | GitLab Duo Agent Platform | Deep integration into software delivery operations [T38][T39] |

## Implications for DUADP and OSSA adopters

DUADP and OSSA can act as interoperability and governance layers above these frameworks: register discoverable capabilities via DUADP and package/policy-normalize via OSSA while preserving runtime choice (LangGraph, CrewAI, Agents SDK, etc.) [T01][T02]. This allows framework diversity without uncontrolled integration sprawl.

## Sources (tether IDs)

- [T15] npm package `@bluefly/duadp` registry metadata (version 0.1.4; published March 9, 2026; weekly downloads observed).
- [T16] npm package `@bluefly/openstandardagents` registry metadata (version 0.5.1; published March 28, 2026; weekly downloads observed).
- [T17] npm package `@openai/agents` registry metadata (version 0.8.3; published April 6, 2026; weekly downloads observed).
- [T18] OpenAI Agents SDK (Python README): https://raw.githubusercontent.com/openai/openai-agents-python/main/README.md
- [T31] GitHub repository metrics snapshot: `openai/openai-agents-python` (queried April 7, 2026).
- [T32] LangGraph docs + GitHub repository metrics snapshot (`langchain-ai/langgraph`) (queried April 7, 2026): https://docs.langchain.com/oss/python/langgraph/graph-api
- [T33] CrewAI README + GitHub repository metrics snapshot (`crewAIInc/crewAI`) (queried April 7, 2026): https://raw.githubusercontent.com/crewAIInc/crewAI/main/README.md
- [T34] AutoGen README + GitHub repository metrics snapshot (`microsoft/autogen`) (queried April 7, 2026): https://raw.githubusercontent.com/microsoft/autogen/main/README.md
- [T35] LlamaIndex README + GitHub repository metrics snapshot (`run-llama/llama_index`) (queried April 7, 2026): https://raw.githubusercontent.com/run-llama/llama_index/main/README.md
- [T36] Parlant README + GitHub repository metrics snapshot (`emcie-co/parlant`) (queried April 7, 2026): https://raw.githubusercontent.com/emcie-co/parlant/main/README.md
- [T37] BotParlay README + GitHub repository metrics snapshot (`dray3310-hash/botparlay`) (queried April 7, 2026): https://raw.githubusercontent.com/dray3310-hash/botparlay/main/README.md
- [T38] GitLab Duo Agent Platform GA announcement (January 15, 2026): https://about.gitlab.com/blog/gitlab-duo-agent-platform-is-generally-available
- [T39] GitLab foundational agents docs: https://docs.gitlab.com/user/duo_agent_platform/agents/foundational_agents/
