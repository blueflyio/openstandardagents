# Frameworks and major projects

Star counts below are snapshots taken on **2026-03-10**.

## 1) Core open-source frameworks

| Project | Stars (2026-03-10) | Core primitives/model | Strengths | Trade-offs |
|---|---:|---|---|---|
| OpenAI Agents SDK (`openai/openai-agents-python`) | 19,490 | Agents, handoffs/agents-as-tools, guardrails, tracing, sessions | Clear primitives, provider-agnostic path, built-in tracing/HITL | Python-centric SDK decisions may not match all org stacks [R27] |
| LangGraph (`langchain-ai/langgraph`) | 26,027 | Graph/state machine orchestration for long-running stateful agents | Durable execution, human interrupts, memory model, production observability tie-ins | Lower-level graph control adds implementation overhead [R28] |
| CrewAI (`crewAIInc/crewAI`) | 45,668 | "Crews" (agent collaboration) + "Flows" (event-driven control) | Strong multi-agent ergonomics and enterprise-focused positioning | Performance/comparison claims are vendor-asserted; validate per workload [R29] |
| AutoGen (`microsoft/autogen`) | 55,393 | Layered core/agentchat/extensions model; tooling + studio path | Mature ecosystem, multi-agent patterns, strong community | Product direction now points newcomers to Microsoft Agent Framework path [R30] |
| LlamaIndex (`run-llama/llama_index`) | 47,537 | Data-centric framework for retrieval/agentic data apps; large integration ecosystem | Strong ingestion/RAG foundation, broad connector ecosystem | Integration sprawl can raise governance complexity [R31] |

Sources: [R27][R28][R29][R30][R31]

## 2) Open-source protocol repos (not full app frameworks but critical)

| Repo | Stars (2026-03-10) | Why it matters |
|---|---:|---|
| `ag-ui-protocol/ag-ui` | 12,378 | Front-end/event interoperability layer for agent UX [R20][R21] |
| `agent-network-protocol/AgentNetworkProtocol` | 1,218 | Decentralized identity + protocol negotiation architecture [R22] |
| `langchain-ai/agent-protocol` | 528 | Standardized API contract for runs/threads/store serving [R23] |
| `i-am-bee/acp` | 961 | Inter-agent communication baseline with active migration narrative [R24] |
| `mondaycom/agent-tool-protocol` | 88 | Code-first interaction model + sandbox/provenance posture [R26] |

## 3) GitLab Duo Agent Platform (commercial platform signal)

GitLab's GA messaging and docs show a platformized approach beyond coding copilots:

- **Agentic Chat** across software lifecycle tasks (analysis, code, CI/CD, security context),
- **foundational agents** including Planner, Security Analyst, and Data Analyst,
- **custom flows/agents** and catalog/discovery controls,
- IDE and web UX integration plus governance controls for enterprise rollouts. [R32][R33][R34]

This indicates competitive differentiation around **DevSecOps-native orchestration + governance**, not only model quality.

## 4) DUADP/OSSA package perspective (framework-adjacent)

Although not direct replacements for LangGraph/CrewAI/etc., DUADP and OSSA packages are important as enabling infrastructure:

- `@bluefly/duadp` (CLI + discovery protocol SDK focus). [R02]
- `@bluefly/openstandardagents` (manifest/spec tooling, validation, MCP server command path, cross-target export posture). [R05]

The `@standardagents/*` packages appear as a separate lineage and should be evaluated independently for maturity/governance fit. [R06][R07]

## 5) "Parlay" naming ambiguity (limitation noted)

The requested "Parlay" framework was not unambiguously identifiable as a canonical agent framework project during this run.

- Closest high-signal match found: **Parlant** (`emcie-co/parlant`), a conversational-agent framework project.
- If "Parlay" refers to a different repository/product, update this report with the exact org/repo URL and rerun the comparison section. [R47]

## 6) Cost and rollout lessons from production-focused blogs

47Billion and Ruh.ai converge on similar operational advice:

- use protocol standards early to avoid bespoke integration costs,
- phase rollout from constrained pilots to broader autonomy,
- prioritize observability, guardrails, and reliability playbooks over demo velocity. [R42][R43]

These are not peer-reviewed results, but they align with enterprise security findings and with framework-level tracing/guardrail trends.
