# Open-Source Frameworks and Platforms

Prepared on March 14, 2026.

## Snapshot of key frameworks

The framework landscape remains highly fragmented, but a practical segmentation is emerging:

- **General orchestration frameworks**: LangGraph, CrewAI, AutoGen, OpenAI Agents SDK.
- **Data-centric agent/RAG frameworks**: LlamaIndex.
- **Enterprise platform layer**: GitLab Duo Agent Platform (foundational + custom + external agents).
- **Contract/protocol adapter layer**: OSSA, LangChain Agent Protocol, DUADP, ACP/A2A connectors. [T02][T15][T27][T29][T31][T32][T33][T34]

## Framework comparison (features + maturity)

Repository metrics below are observed via GitHub on March 14, 2026.

| Project | Main purpose | Core primitives / model | Maturity signal |
|---|---|---|---|
| **OpenAI Agents SDK** (`openai/openai-agents-python`) | Multi-agent workflows with guardrails/tracing | Agents, tools, handoffs, guardrails, tracing | ~19,980 stars; active updates [T29][T30] |
| **LangGraph** (`langchain-ai/langgraph`) | Stateful graph orchestration for long-running agents | Graph nodes/edges/state, durable execution, HITL interrupts | ~26,367 stars; strong production adoption narrative [T31][T30] |
| **CrewAI** (`crewAIInc/crewAI`) | Role-based multi-agent collaboration | Crews, flows, tools, memory/event patterns | ~46,022 stars; strong OSS community footprint [T32][T30] |
| **AutoGen** (`microsoft/autogen`) | Conversational multi-agent coordination | Conversable agents, group chat patterns, execution loops | ~55,597 stars; large research+engineering community [T33][T30] |
| **LlamaIndex** (`run-llama/llama_index`) | Agentic data systems and RAG pipelines | Index/retrieval workflows + agent workflows/handoffs | ~47,660 stars; broad RAG adoption [T34][T30] |
| **LangChain Agent Protocol** | Runtime interoperability API for agent services | Runs, threads, store endpoints | ~530 stars in standards repo; early but active [T15][T30] |
| **Agent Network Protocol (ANP)** | Agent internet protocol stack | DID identity layer + negotiation layer + app protocol layer | ~1,229 stars; protocol-phase maturity [T13][T14][T30] |
| **AG-UI** | Agent-to-frontend event protocol | Typed events over HTTP/SSE; UI integration SDKs | ~12,453 stars; fast ecosystem traction [T11][T12][T30] |
| **ACP** (`i-am-bee/acp`) | Lightweight inter-agent communication | HTTP-native, sync/async/streaming, multimodal payloads | ~961 stars; active releases [T16][T30] |
| **Agent Tool Protocol (ATP)** | Code-execution-first tool interface | Sandbox execution runtime + protocol APIs | ~89 stars; early stage [T17][T30] |

## GitLab Duo Agent Platform

GitLab’s GA messaging positions Duo Agent Platform as lifecycle-wide agent orchestration rather than coding-only assistance, with:

- context-aware agentic chat,
- foundational agents (planner, security analyst, data analyst variants),
- custom agents and AI catalog workflows,
- external model/agent integrations (including Claude and Codex pathways in docs/blog content). [T27][T28]

Practical enterprise angle: this is a control-plane approach that packages governance, credits/cost controls, and SDLC context in one platform.

## Cost and operations considerations

From 47Billion and Ruh.ai analyses (non-peer-reviewed but operationally useful):

- hidden costs often come from orchestration overhead, debugging, and tracing data volume rather than only token spend;
- protocol mismatch/integration sprawl is a major failure mode;
- progressive rollout, kill-switches, cache/latency controls, and explicit reliability playbooks are recommended. [T35][T36]

These recommendations align with security survey findings that deployment speed is outpacing controls and observability. [T23]

## DUADP and OSSA package interpretation (npm)

You specifically asked about npm packages:

- `@bluefly/duadp`: TypeScript SDK for DUADP discovery/federation, with CLI and protocol endpoints for resource publishing/search/validation/federation. [T03][T05]
- `@bluefly/openstandardagents`: OSSA CLI/spec tooling for manifest validation and multi-target export, positioned as protocol-to-platform bridge. [T04][T06]

Both publish Apache-2.0 licensing metadata and active 2026 release cadence in npm registry data. [T03][T04]
