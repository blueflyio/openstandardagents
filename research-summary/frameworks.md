# Open-Source Frameworks and Projects (2025-2026)

## Scope

This file summarizes major open-source and platform ecosystems for agentic AI, including:

- OpenAI Agents SDK
- LangGraph
- CrewAI
- AutoGen
- LlamaIndex
- GitLab Duo Agent Platform
- OSSA and DUADP
- selected protocol/framework repos and npm packages

Metrics are snapshots captured on March 30, 2026 where available.

## 1) OpenAI Agents SDK

OpenAI's current Agents SDK documentation emphasizes a minimal primitive set:

- agents
- handoffs (agents as tools)
- guardrails
- tracing [R30]

The design intent is low abstraction overhead with production observability and orchestration support. The docs also call out MCP tool integration and human-in-the-loop capabilities. [R30]

GitHub snapshot (Python SDK repo):

- `openai/openai-agents-python` stars: 20,415
- forks: 3,343 [R50]

## 2) LangGraph (LangChain ecosystem)

LangGraph is positioned as a low-level orchestration runtime for long-running, stateful agents, with emphasis on:

- durable execution
- memory and state
- human interruption points
- production tracing/observability integration [R31]

npm and GitHub signals:

- `@langchain/langgraph` weekly downloads: ~2.1M [R62]
- `langchain-ai/langgraph` stars: 27,923 [R51]

Interpretation: LangGraph currently shows among the strongest ecosystem maturity indicators in both package usage and repository traction.

## 3) CrewAI

CrewAI remains one of the highest-star OSS agent frameworks in the multi-agent orchestration segment.

GitHub snapshot:

- `crewAIInc/crewAI` stars: 47,563
- forks: 6,441 [R52]

In practitioner analysis (for example 47Billion), CrewAI is often described as a pragmatic middle-ground framework for structured multi-step workflows with less conversational chaos than some unconstrained multi-agent setups. [R41]

## 4) AutoGen

Microsoft AutoGen remains a major reference framework for multi-agent conversational orchestration.

GitHub snapshot:

- `microsoft/autogen` stars: 56,436
- forks: 8,480 [R53]

Recent applied analyses frequently note AutoGen strength in flexible conversational decomposition and weakness in cost/debug complexity for production unless strong guardrails are applied. [R41]

## 5) LlamaIndex

LlamaIndex is still strong where document/RAG-heavy pipelines dominate.

GitHub snapshot:

- `run-llama/llama_index` stars: 48,137
- forks: 7,117 [R54]

The practical pattern in engineering writeups is to pair LlamaIndex with explicit orchestration and security controls when moving to agentic action loops. [R41]

## 6) GitLab Duo Agent Platform

GitLab announced GA for Duo Agent Platform, emphasizing full lifecycle AI support and orchestration across planning, code, CI/CD, and security functions. [R32]

Notable GA capabilities described by GitLab include:

- Agentic Chat with project/runtime context
- foundational agents (Planner Agent, Security Analyst Agent)
- flows for issue-to-MR, CI conversion/fix, code review
- MCP client integrations to external systems [R32]

Practical significance: this is one of the clearer enterprise-platform examples of moving from isolated coding assistant use to "agentic SDLC control plane."

## 7) OSSA and DUADP package-level view

### @bluefly/openstandardagents

Snapshot highlights:

- version around v0.5.x in March 2026
- weekly downloads: 12
- 75 dependencies
- 23 versions [R07]

Interpretation: feature-rich and moving quickly, but still early adoption compared to top mainstream frameworks.

### @bluefly/duadp

Snapshot highlights:

- v0.1.4 published March 9, 2026
- weekly downloads: 28
- Apache-2.0
- early dependency graph and few dependents [R04]

Interpretation: very early infrastructure project centered on discovery/federation layer experimentation and ecosystem seeding.

## 8) Other notable protocol/framework repos

| Project | Purpose | Evidence of momentum |
| --- | --- | --- |
| `langchain-ai/agent-protocol` | framework-agnostic APIs for runs/threads/store | 538 stars [R55] |
| `a2aproject/A2A` | A2A protocol reference/spec | 22,920 stars [R56] |
| `modelcontextprotocol/modelcontextprotocol` | MCP spec ecosystem | 7,662 stars [R57] |
| `ag-ui-protocol/ag-ui` | agent-user interaction protocol | 12,730 stars [R58] |
| `i-am-bee/acp` | ACP protocol | 976 stars [R59] |
| `mondaycom/agent-tool-protocol` | ATP protocol | 92 stars [R60] |
| `agent-network-protocol/AgentNetworkProtocol` | ANP protocol | 1,252 stars [R61] |

## 9) Practical framework selection guidance (evidence-based)

### Choose by operational shape, not hype

- **Stateful long-running orchestration:** LangGraph strong fit. [R31][R55]
- **Multi-agent role/task delegation quickly:** CrewAI/AutoGen families.
- **Doc-heavy grounding + retrieval-first apps:** LlamaIndex.
- **Enterprise SDLC orchestration in one platform:** GitLab Duo Agent Platform. [R32]
- **Cross-platform manifest portability experiments:** OSSA.
- **Federated discovery experiments:** DUADP.

### Cost and reliability considerations

Engineering postmortems consistently describe hidden costs in:

- iterative debugging loops
- context management drift
- tool-call failures and retries
- governance and HITL integration [R41]

Teams generally benefit from phased autonomy:

1. deterministic workflows
2. constrained tool-using agents
3. multi-agent coordination only where it yields clear ROI [R24][R41]

---

## Citation keys used in this file

[R04], [R07], [R24], [R30], [R31], [R32], [R41], [R50], [R51], [R52], [R53], [R54], [R55], [R56], [R57], [R58], [R59], [R60], [R61], [R62]
