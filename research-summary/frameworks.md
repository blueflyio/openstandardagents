# Open-Source Frameworks and Project Landscape (2026)

Date baseline used for relative references: **March 10, 2026**.

## 1) Framework landscape: what teams are actually using

The framework ecosystem has split into three practical categories:

1. **General multi-agent orchestration frameworks** (AutoGen, CrewAI, LangGraph, OpenAI Agents SDK).
2. **Document/RAG-specialized frameworks** (LlamaIndex-heavy patterns).
3. **Platformized enterprise orchestration** (GitLab Duo Agent Platform, managed catalogs/flows/controls). [T17][T19][T20][T21][T22][T29]

## 2) Key projects and core primitives

## OpenAI Agents SDK

OpenAI's SDK emphasizes a small primitive set:

- agents,
- handoffs/agents-as-tools,
- guardrails,
- tracing/observability. [T17]

Model support is OpenAI-first, with non-OpenAI provider paths and LiteLLM-based multi-provider routing options documented in the model integration pages. [T17]

## LangGraph

LangGraph is explicitly low-level and graph/state-centric, prioritizing:

- durable execution,
- long-running stateful workflows,
- human interruption points,
- production tracing/deployment. [T19]

## CrewAI

CrewAI combines open-source orchestration with enterprise control-plane positioning (studio, tracing, RBAC, serverless/containerized scale paths). [T20]

## AutoGen

AutoGen remains one of the largest open-source agentic frameworks by community footprint, widely used for multi-agent conversation patterns and orchestration experimentation. [T54]

## LlamaIndex

LlamaIndex is increasingly positioned around document agents and OCR-driven workflows, making it strong for retrieval-heavy enterprise use cases. [T54]

## LangChain Agent Protocol (project-level)

While not a "framework" itself, Agent Protocol is increasingly relevant as a framework-neutral serving surface for runs/threads/store abstractions and introspection, influencing interoperability across stacks. [T15][T16]

## 3) GitLab Duo Agent Platform (enterprise reference)

GitLab's GA messaging and product pages indicate a full lifecycle approach:

- context-aware agentic chat,
- foundational + custom + external agents (including Claude Code and Codex integrations),
- reusable flows,
- MCP client integrations,
- model selection/governance controls and usage-based credit model. [T21][T22]

This is a notable signal that DevSecOps-native enterprises are treating agents as platform infrastructure, not one-off copilots.

## 4) Comparative framework table

| Framework/platform | Best fit | Core strength | Operational caution |
| --- | --- | --- | --- |
| OpenAI Agents SDK | Python-first multi-agent apps | Simple primitives + strong tracing model [T17] | Guardrail policy quality still developer-dependent |
| LangGraph | Long-running stateful workflows | Durable graph execution + HITL [T19] | Requires stronger architecture discipline |
| CrewAI | Team-oriented multi-agent flows | Developer + enterprise tooling blend [T20] | Governance quality depends on rollout rigor |
| AutoGen | Flexible multi-agent experimentation | Very large OSS community [T54] | Can become complex/costly without strict controls |
| LlamaIndex | RAG/document-heavy systems | Retrieval/document focus [T54] | Not a full governance framework by itself |
| GitLab Duo Agent Platform | DevSecOps lifecycle orchestration | Built-in SDLC integration + policy controls [T21][T22] | Platform coupling/trade-offs by org context |

## 5) Cost and reliability signals from production engineering blogs

From 47Billion's production write-up:

- Reliability gaps appear primarily at orchestration boundaries, not just model quality.
- Multi-agent systems can multiply token and tracing/ops cost if loops and memory are uncontrolled.
- Progressive rollout, guardrails, and human checkpoints were repeatedly highlighted as required for stable production outcomes. [T29]

Ruh.ai's protocol guide reinforces similar economics:

- communication standards reduce integration overhead,
- and protocol choices strongly impact deployment complexity and long-term maintainability. [T30]

## 6) Repository momentum snapshot (GitHub)

The following project classes currently show highest public OSS momentum (stars snapshot captured March 23, 2026): AutoGen, LlamaIndex, CrewAI, LangGraph, MCP servers, A2A, AG-UI. [T54]

High-level read:

- **MCP and framework ecosystems are already at mainstream OSS scale.**
- **Discovery/contract-layer projects (DUADP/OSSA) are earlier-stage but architecturally aligned with emergent needs.** [T49][T50][T51]

## 7) Notable repositories list (selected)

| Repo | Stars (snapshot) | Main purpose |
| --- | ---:| --- |
| modelcontextprotocol/servers | 81,839 | MCP server ecosystem [T54] |
| microsoft/autogen | 56,058 | Multi-agent programming framework [T54] |
| run-llama/llama_index | 47,893 | Document agent / RAG platform [T54] |
| crewAIInc/crewAI | 46,937 | Multi-agent orchestration framework [T54] |
| langchain-ai/langgraph | 27,215 | Graph-based stateful orchestration [T54] |
| a2aproject/A2A | 22,743 | Agent2Agent protocol reference [T54] |
| openai/openai-agents-python | 20,212 | OpenAI Agents SDK [T54] |
| ag-ui-protocol/ag-ui | 12,617 | Agent-user interaction protocol [T54] |
| modelcontextprotocol/modelcontextprotocol | 7,588 | MCP specification/docs [T54] |
| agent-network-protocol/AgentNetworkProtocol | 1,242 | ANP protocol docs [T54] |
| i-am-bee/acp | 969 | ACP protocol implementation [T54] |
| langchain-ai/agent-protocol | 533 | Framework-agnostic serving API spec [T54] |
| mondaycom/agent-tool-protocol | 90 | Code-execution-oriented tool protocol [T54] |

## 8) Framework selection recommendations (short)

- Choose **LangGraph/OpenAI SDK/CrewAI** based on orchestration complexity and team maturity.
- Add **protocol compatibility** (MCP/A2A/Agent Protocol) before scaling cross-system workflows.
- Add **identity-aware policy and audit controls** before enabling high-impact tools.
- Expect cost and reliability behavior to be mostly an orchestration/control problem, not only a model choice problem. [T26][T27][T29][T30]

Citations: [T15][T16][T17][T19][T20][T21][T22][T26][T27][T29][T30][T49][T50][T51][T54]
