# Open-Source Frameworks and Projects (2025-2026)

Date prepared: March 29, 2026

## 1) Core takeaway

The framework layer is maturing quickly, but architectures are diverging:

- some frameworks optimize for **agent orchestration semantics** (LangGraph, AutoGen),
- some optimize for **team/task abstractions** (CrewAI),
- some optimize for **data and retrieval-centric agent systems** (LlamaIndex),
- and some focus on **contract/deployment packaging** (OSSA) and **network discovery** (DUADP).

This means architecture choices should be capability-led, not branding-led.

## 2) Requested projects: purpose and primitives

### OpenAI Agents SDK

OpenAI's SDK describes a small primitive set: agents, handoffs (agent delegation), guardrails, and tracing; with additional tool/session/HITL features. [SRC-OPENAI-AGENTS-DOCS] [SRC-OPENAI-AGENTS-MULTI]

Declared value:

- minimal abstractions,
- production-oriented orchestration,
- explicit debugging/observability via tracing.

Community signal (GitHub stars, snapshot): 20,391. [SRC-GH-STARS-SNAPSHOT]

### LangGraph

LangGraph positions itself as a low-level orchestration runtime for long-running, stateful agents with durable execution and human-in-the-loop controls. [SRC-LANGGRAPH-DOCS]

Community signal (GitHub stars, snapshot): 27,814. [SRC-GH-STARS-SNAPSHOT]

### CrewAI

CrewAI documentation emphasizes two core building blocks:

- Flows for stateful/event-driven process control,
- Crews for collaborative autonomous agents.

It markets explicitly toward enterprise automation and operational control. [SRC-CREWAI-DOCS]

Community signal (GitHub stars, snapshot): 47,456. [SRC-GH-STARS-SNAPSHOT]

### AutoGen (Microsoft)

AutoGen is presented as a framework for agentic AI, with significant enterprise/community traction and strong multi-agent roots. [SRC-AUTOGEN-DOCS] [SRC-AUTOGEN-GITHUB]

Community signal (GitHub stars, snapshot): 56,364. [SRC-GH-STARS-SNAPSHOT]

### LlamaIndex

LlamaIndex positions itself as a framework for agentic systems over proprietary data, emphasizing context augmentation, workflows, retrieval, and tool-enabled agents. [SRC-LLAMAINDEX-DOCS]

Community signal (GitHub stars, snapshot): 48,107. [SRC-GH-STARS-SNAPSHOT]

### Parlant (requested in user prompt context via ecosystem discovery)

Parlant is an open-source "conversational control layer" with strong emphasis on policy/guideline-style control in customer-facing interactions. [SRC-PARLANT-GITHUB]

This appears strongest for controlled conversational behavior governance rather than general orchestration breadth.

## 3) DUADP and OSSA as framework-adjacent infrastructure

### `@bluefly/duadp`

npm page and docs describe DUADP as:

- discovery/federation protocol SDK,
- server + client surfaces,
- DID/signature and trust-tier concepts,
- endpoint/tool surfaces for registry/search/federation and governance operations. [SRC-NPM-DUADP] [SRC-DUADP-DOCS] [SRC-DUADP-HOME]

### `@bluefly/openstandardagents`

npm page and OSSA site describe:

- manifest-first agent contracts in YAML,
- validation/migration/export CLI,
- broad multi-platform export ambitions,
- MCP tooling and governance metadata emphasis. [SRC-NPM-OSSA] [SRC-OSSA-HOME] [SRC-OSSA-SPEC]

These two packages can be interpreted as a "contract + discovery" architecture that sits next to, not necessarily inside, runtime frameworks like CrewAI/LangGraph.

## 4) GitLab Duo Agent Platform (productized enterprise stack)

GitLab's GA announcement and docs position Duo Agent Platform as:

- integrated Agentic Chat,
- foundational agents (planner/security analyst),
- reusable flows (issue->MR, CI conversion/fix, code review, software dev flow),
- custom/external agent support,
- governance/controls and credits-based operating model. [SRC-GITLAB-DUO-GA] [SRC-GITLAB-DUO-DOCS]

This is a strong example of enterprise productization around agent patterns and workflow orchestration.

## 5) Comparison table (frameworks and related projects)

| Project | Primary role | Core primitives/design | Strongest fit | Notable caveat |
| --- | --- | --- | --- | --- |
| OpenAI Agents SDK | Runtime SDK | Agents, handoffs, guardrails, tracing | Clean Python agent apps with explicit orchestration choices | Provider/feature compatibility planning required in mixed-model stacks |
| LangGraph | Low-level orchestration | Graph/stateful execution, durability, HITL | Long-running/stateful systems, precise control | More engineering overhead than high-level frameworks |
| CrewAI | Multi-agent app framework | Flows + Crews | Team-like task decomposition and enterprise workflows | Requires disciplined design to avoid uncontrolled autonomy |
| AutoGen | Agentic framework | Multi-agent orchestration patterns | Complex collaborative agents | Operational complexity and eval/guardrail needs can grow quickly |
| LlamaIndex | Data+agent framework | Retrieval/context augmentation + workflows | Data-centric agents and RAG-heavy systems | Less ideal if retrieval is not central |
| OSSA (`@bluefly/openstandardagents`) | Contract/packaging layer | Manifest + validation/export | Cross-platform specification portability | Runtime behavior still depends on downstream platform |
| DUADP (`@bluefly/duadp`) | Discovery/federation layer | Well-known discovery + federated registry/search | Cross-domain capability discovery | Ecosystem maturity is early; governance controls must be validated operationally |

## 6) Cost and production reliability (from engineering blogs)

Industry engineering posts consistently highlight:

- rapidly escalating cost in multi-agent loops,
- observability/debugging as major production bottleneck,
- and the need for bounded autonomy plus HITL checkpoints. [SRC-47BILLION-2026]

These are useful practitioner signals, but should be treated as experiential evidence, not universal benchmarks.

## 7) Practical selection guidance

For 2026 deployment planning:

1. Choose orchestration framework based on state/model/tooling needs.
2. Add protocol interoperability intentionally (MCP, A2A, AG-UI) rather than ad hoc.
3. Treat identity and policy as separate architecture concerns, not bolt-ons.
4. Require observability and evaluation gates before scaling autonomy.

## 8) Star-count snapshot (from GitHub, March 29, 2026)

- `microsoft/autogen`: 56,364  
- `run-llama/llama_index`: 48,107  
- `crewAIInc/crewAI`: 47,456  
- `langchain-ai/langgraph`: 27,814  
- `openai/openai-agents-python`: 20,391  
- `agent-network-protocol/AgentNetworkProtocol`: 1,252  
- `langchain-ai/agent-protocol`: 537  
- `i-am-bee/ACP`: 974  
- `mondaycom/agent-tool-protocol`: 92 [SRC-GH-STARS-SNAPSHOT] [SRC-ANP-GITHUB] [SRC-LANGCHAIN-AGENT-PROTOCOL-README] [SRC-ACP-GITHUB] [SRC-MONDAY-ATP-GITHUB]
