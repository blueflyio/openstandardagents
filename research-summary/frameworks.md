# Open-Source Frameworks and Major Projects (2026)

Date completed: April 2, 2026

## 1) Framework landscape

Open-source agent frameworks are now robust enough for production use when scope is constrained and guardrails are explicit. The practical differentiator is no longer "can it run?" but rather:

- orchestration model (graph, crew/task, conversation, tool-loop),
- observability/debuggability,
- cost control under multi-step/multi-agent load,
- policy and IAM integration maturity. [SRC-37][SRC-38][SRC-39][SRC-40][SRC-41][SRC-46]

---

## 2) Core projects requested in scope

### 2.1 OpenAI Agents SDK (Python/JS)

OpenAI’s SDKs provide a small primitive set:

- Agents
- Handoffs (agents-as-tools/delegation)
- Guardrails
- Tracing

plus sessions, MCP tool integration, human-in-the-loop, and realtime/voice support. [SRC-42][SRC-37][SRC-38]

**Position in ecosystem:** a pragmatic, batteries-included runner model for production agent loops, especially where teams want fast onboarding with strong observability defaults.

### 2.2 LangGraph

LangGraph is a low-level orchestration runtime centered on stateful graphs and durable execution:

- stateful long-running workflows,
- interruption/human-in-the-loop,
- resumability and production deployment integrations.

It is particularly strong where deterministic control over flow topology is required. [SRC-43][SRC-39]

### 2.3 CrewAI

CrewAI centers role/task-based multi-agent orchestration, emphasizing practical composition and faster implementation for structured multi-step workflows. [SRC-40][SRC-46]

### 2.4 AutoGen (Microsoft)

AutoGen emphasizes multi-agent conversation and composability. It is powerful for exploratory/collaborative workflows but can become expensive and harder to debug without strict controls. [SRC-41][SRC-46]

### 2.5 LlamaIndex

LlamaIndex is strongest for document-centric/RAG-heavy systems and data-interface orchestration around retrieval and synthesis. [SRC-44][SRC-46]

### 2.6 Parlay / Parlant clarification

In practice, the framework commonly referenced in 2026 is **Parlant** (emcie-co/parlant), often misnamed "Parlay" in secondary references. It focuses on controlled conversational behavior via guideline systems and runtime steering for customer-facing agents. [SRC-32]

---

## 3) GitLab Duo Agent Platform (GA context)

GitLab’s GA release positions "agentic DevSecOps orchestration" as a lifecycle-wide layer, not just coding assistance:

- context-aware Agentic Chat across Web UI and IDEs,
- foundational agents (Planner, Security Analyst),
- custom agent catalog,
- external tool integration (including Claude Code and Codex CLI references),
- governance controls (access policies, visibility, model selection, deployment modes). [SRC-33][SRC-45]

This is a leading example of enterprise productization: multi-agent features packaged with governance and workflow ergonomics rather than just model APIs.

---

## 4) Notable repositories and maturity snapshot (point-in-time)

Stars are snapshots captured April 2, 2026.

| Project | Approx stars | Primary role |
|---|---:|---|
| `microsoft/AutoGen` | 56,604 | Multi-agent programming framework |
| `run-llama/llama_index` | 48,228 | Document/RAG + data orchestration |
| `crewAIInc/crewAI` | 47,831 | Role/task-oriented multi-agent orchestration |
| `langchain-ai/langgraph` | 28,224 | Stateful graph orchestration runtime |
| `openai/openai-agents-python` | 20,507 | Agent runner + handoffs + guardrails + tracing |
| `openai/openai-agents-js` | 2,570 | JS/TS counterpart of Agents SDK |
| `langchain-ai/agent-protocol` | 539 | Interop API spec for runs/threads/store |
| `agent-network-protocol/AgentNetworkProtocol` | 1,256 | ANP protocol work |
| `i-am-bee/ACP` | 979 | ACP protocol implementation |
| `mondaycom/agent-tool-protocol` | 92 | Code-execution-first protocol approach |

Sources for stars and descriptions: [SRC-32][SRC-37][SRC-38][SRC-39][SRC-40][SRC-41][SRC-44]

---

## 5) Cost and reliability observations from engineering publications

From 47Billion and similar engineering writeups:

- Most production wins appear in level-2/level-3 autonomy (structured workflows + selective tool use).
- Fully open-ended multi-agent systems tend to incur steep debugging and token costs.
- HITL gates, strict tool whitelisting, and rollout phasing consistently appear in successful deployments. [SRC-46]

These recommendations are consistent with MIT/Gravitee concerns on risk and transparency gaps. [SRC-51][SRC-23]

---

## 6) Practical framework selection heuristics

- Choose **LangGraph** for high-control stateful workflows.
- Choose **OpenAI Agents SDK** for fast production loops with built-in tracing/guardrails.
- Choose **CrewAI** for rapid, structured team-task orchestration.
- Choose **AutoGen** for exploratory multi-agent interactions where higher cost/variance is acceptable.
- Choose **LlamaIndex** when retrieval/document orchestration dominates.

For any choice: enforce policy at tool invocation, meter spend at run level, and require identity-aware execution context in production.

