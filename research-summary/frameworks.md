# Open-Source Frameworks and Projects

Focus: practical frameworks, major repositories, maturity signals, and cost/operational implications.

## 1) Framework landscape (what each is best at)

### OpenAI Agents SDK

OpenAI's Python SDK emphasizes a small primitive set (agents, tools/handoffs, guardrails, tracing, sessions/HITL), and is explicitly provider-agnostic in docs/README. [R26][R27][R28][R29][R30]

**Strength**: clean production primitive model with integrated tracing.

### LangGraph

LangGraph is a low-level orchestration runtime for long-running stateful workflows with durable execution and HITL support, positioned as orchestration substrate rather than full batteries-included app framework. [R31]

**Strength**: explicit control over graph/state lifecycle.

### CrewAI

CrewAI emphasizes role-based multi-agent orchestration (Crews) plus event-driven workflows (Flows), with strong enterprise messaging and broad examples. [R32]

**Strength**: practical team/workflow abstractions for production scenarios.

### AutoGen (Microsoft)

AutoGen remains highly visible but is explicitly in maintenance mode; new projects are directed toward Microsoft Agent Framework. [R33]

**Strength**: legacy ecosystem and known patterns; **risk**: strategic migration overhead.

### LlamaIndex

LlamaIndex positions itself as data/doc-agent infrastructure with broad integrations and strong document/RAG-centric ergonomics. [R34]

**Strength**: document-heavy and retrieval-heavy pipelines.

### GitLab Duo Agent Platform

GitLab's GA release positions an integrated DevSecOps-native agent platform with agentic chat, foundational agents, flows, and governance controls. [R35][R36]

**Strength**: SDLC context integration + enterprise controls in one platform.

## 2) Repository maturity snapshot (captured 2026-04-14)

Captured via `gh repo view` in this run. [D01]

| Project | Repo | Stars | Forks | License | Signal |
|---|---|---:|---:|---|---|
| OpenAI Agents SDK | openai/openai-agents-python | 20,770 | 3,404 | MIT | High growth, active |
| LangGraph | langchain-ai/langgraph | 29,216 | 5,014 | MIT | Strong orchestration adoption |
| CrewAI | crewAIInc/crewAI | 48,845 | 6,668 | MIT | Very high community momentum |
| AutoGen | microsoft/autogen | 57,068 | 8,590 | CC-BY-4.0 docs + code mix | Mature but maintenance mode |
| LlamaIndex | run-llama/llama_index | 48,579 | 7,198 | MIT | Strong data/RAG ecosystem |
| LangChain Agent Protocol | langchain-ai/agent-protocol | 560 | 46 | MIT | Niche spec project |
| A2A | a2aproject/A2A | 23,185 | 2,355 | Apache-2.0 | Major protocol momentum |
| ACP | i-am-bee/acp | 986 | 116 | Apache-2.0 | Active, convergence underway |
| ANP | agent-network-protocol/AgentNetworkProtocol | 1,264 | 86 | Apache-2.0 | Early but active |
| ATP | mondaycom/agent-tool-protocol | 94 | 10 | MIT | Early, specialized |
| MCP spec repo | modelcontextprotocol/modelcontextprotocol | 7,804 | 1,439 | Other (repo-declared) | Core ecosystem baseline |

## 3) npm package snapshot for DUADP and OSSA

Captured via npm API in this run. [D02]

| Package | Version | Weekly downloads | Unpacked size | Dependencies |
|---|---:|---:|---:|---:|
| `@bluefly/duadp` | 0.1.4 | 120 | ~173 KB | 7 |
| `@bluefly/openstandardagents` | 0.5.1 | 198 | ~11.26 MB | 75 |

Interpretation:

- DUADP is currently lightweight and focused.
- OSSA is broader and more platform-bridge oriented (higher dependency and packaging surface).

## 4) Production fit patterns

### Pattern A: "Lean orchestration + strong external controls"

- Candidate stack: LangGraph or OpenAI Agents SDK + strict policy gateway + external observability.
- Good for teams wanting maximal custom control.

### Pattern B: "Workflow-heavy enterprise automation"

- Candidate stack: CrewAI flows/crews or GitLab Duo (if SDLC-centric).
- Good for organizations prioritizing speed of orchestration and role-based automation.

### Pattern C: "Data/document-heavy agents"

- Candidate stack: LlamaIndex-centered architecture.
- Good for knowledge ops, retrieval-intensive or doc processing workloads.

### Pattern D: "Protocol-first interop architecture"

- Candidate stack: MCP + A2A + AG-UI + contract/discovery layers (OSSA + DUADP or equivalents).
- Good when cross-vendor/cross-platform portability is a top requirement.

## 5) Cost and complexity implications

Evidence from engineering reports indicates costs scale more with orchestration complexity, context breadth, and debugging burden than with nominal "number of agents" alone. [R37]

Repeated operational pain points:

- context drift in multi-agent conversations,
- opaque failures requiring expensive trace forensics,
- integration fragility when bespoke connectors replace standards.

## 6) Key framework selection criteria

1. **Control vs speed**: low-level orchestrators favor control, integrated platforms favor speed.
2. **State model**: long-running durable state handling maturity.
3. **Guardrails and policy hooks**: first-class vs bolt-on.
4. **Interoperability posture**: MCP/A2A/agent-card compatibility paths.
5. **Migration risk**: especially for projects in lifecycle transition (example: AutoGen).
6. **Observability quality**: traceability of tool calls, handoffs, and policy decisions.

## 7) Bottom line

The "best framework" is context-dependent; the consistent winner pattern is:

- choose the framework for developer ergonomics and runtime behavior,
- choose protocols for interoperability,
- choose governance/identity tooling for production safety.

Without the third component, framework choice alone does not solve enterprise readiness.
