# Open-Source Frameworks and Projects

Reference date for relative time normalization: **March 10, 2026**.

## Framework-level observations

The ecosystem is splitting into:

- **runtime/orchestration frameworks** (OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex)
- **standard/spec repositories** (A2A, Agent Protocol, ANP, ACP)
- **platform products** (GitLab Duo Agent Platform)
- **contract/discovery infrastructure** (OSSA + DUADP)

## Key projects (purpose, primitives, maturity)

| Project | Primary role | Core primitives | Maturity signals |
|---|---|---|---|
| OpenAI Agents SDK (Python/JS) | Multi-agent workflow runtime | agents, tools/handoffs, guardrails, tracing, sessions/HITL | Highly active OSS + rapid package release cadence [SRC-20][SRC-38] |
| LangGraph | Stateful graph orchestration | nodes, edges, shared state, durable execution | Large OSS footprint and ecosystem adoption [SRC-22][SRC-39] |
| CrewAI | Role-based multi-agent orchestration | crews, roles, delegated workflows | Very large community repo and active development [SRC-40] |
| Microsoft AutoGen | Agentic programming framework | conversational/multi-agent patterns, tool use | Very large community repo and active development [SRC-40] |
| LlamaIndex | Data-centric agent/RAG framework | document indexing, retrieval workflows, agent interfaces | Large repo with strong data-agent usage [SRC-40] |
| GitLab Duo Agent Platform | Agentic SDLC platform | foundational/custom/external agents, agentic chat, catalog | Generally available product with enterprise docs [SRC-36][SRC-37] |
| OSSA + DUADP | Contract + discovery layer | manifests, validation, export, federated discovery | Active npm and docs releases in 2025-2026 [SRC-01][SRC-02][SRC-05][SRC-06] |

## Repository snapshot (GitHub metadata captured March 13, 2026)

| Repository | Stars | Forks | Last pushed (UTC) | What it indicates |
|---|---:|---:|---|---|
| `microsoft/autogen` | 55,558 | 8,385 | 2026-03-11 | broad developer adoption |
| `run-llama/llama_index` | 47,638 | 7,003 | 2026-03-12 | strong RAG/data-agent demand |
| `crewAIInc/crewAI` | 45,943 | 6,186 | 2026-03-13 | high interest in role-based multi-agent workflows |
| `langchain-ai/langgraph` | 26,297 | 4,546 | 2026-03-12 | mainstream orchestration layer |
| `openai/openai-agents-python` | 19,953 | 3,262 | 2026-03-13 | fast growth of agent SDK baseline |
| `a2aproject/A2A` | 22,485 | (not captured in this pass) | 2026-03-12 | rapid protocol attention |
| `ag-ui-protocol/ag-ui` | 12,436 | 1,127 | 2026-03-12 | fast growth at agent-UI layer |
| `agent-network-protocol/AgentNetworkProtocol` | 1,226 | 83 | 2026-03-05 | emerging standards effort |
| `langchain-ai/agent-protocol` | 530 | 44 | 2026-03-01 | niche but important standardization |
| `i-am-bee/acp` | 961 | 115 | 2025-08-25 (archived) | useful reference, but lifecycle caution |

Sources for this table are repository metadata and READMEs. [SRC-12][SRC-14][SRC-15][SRC-16][SRC-17][SRC-38][SRC-39][SRC-40]

## GitLab Duo Agent Platform (productized agent framework)

GitLab's GA material describes:

- foundational agents (Planner, Security Analyst)
- custom agents through an AI catalog
- external agent integrations (including Claude Code and Codex)
- agentic chat surfaces integrated into SDLC workflows [SRC-36][SRC-37]

This is an important indicator that enterprise platforms are converging on **agent catalogs + policy + workflow integration**, not just "chat assistants."

## Cost and production reliability notes

Secondary but practical engineering sources (47Billion and Ruh.ai) repeatedly emphasize:

- progressive rollout
- guardrails and validation before autonomy expansion
- cost control as a first-class design concern
- protocol selection by workload boundary (tooling vs delegation vs UI) [SRC-34][SRC-35]

## Note on "Parlay"

A clearly authoritative 2025-2026 open-source "Parlay" agent framework reference was not confidently identified in primary sources during this pass. Recommended follow-up: confirm exact repository/package name before using it in architecture decisions.
