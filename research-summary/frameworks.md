# Open-Source Frameworks, Repositories, and Platform Ecosystem

## 1) Major framework families

### OpenAI Agents SDK

OpenAI’s Agents SDK (Python and JS) centers on four primitives:

1. Agents
2. Handoffs
3. Guardrails
4. Tracing [R34][R35][R36]

The design is intentionally lightweight and composable for multi-agent workflows.

### LangGraph (LangChain)

LangGraph provides graph-based orchestration for stateful and long-running workflows, with strong focus on persistence, checkpoints, and controlled transitions between nodes. [R37]

### CrewAI

CrewAI structures systems around agents, tasks, crews, and flows, making role-based orchestration explicit and developer-friendly for process automation. [R38]

### AutoGen (Microsoft)

AutoGen emphasizes multi-agent conversational coordination patterns (including group chat/selector patterns), tool-enabled collaboration, and custom agent teams. [R39]

### LlamaIndex

LlamaIndex is strongest in retrieval/data-centric pipelines and event-driven workflows; it is frequently used for agentic RAG and document-grounded systems. [R40]

## 2) Requested focus: DUADP and OSSA npm artifacts in framework workflows

| Package | What it is | Typical role in stack |
|---|---|---|
| `@bluefly/duadp` | TypeScript SDK for DUADP discovery protocol | Discovery/registry/federation layer around agents [R03] |
| `@bluefly/openstandardagents` | OSSA manifest CLI/SDK | Contract validation + export/deployment bridge [R08] |

Practical interpretation:

- OSSA handles agent specification and packaging.
- DUADP handles discovery/federation publication and search.
- Frameworks (LangGraph/CrewAI/AutoGen/OpenAI Agents) execute agent behavior.

## 3) Additional protocol-adjacent npm packages worth tracking

| Package | Purpose |
|---|---|
| `@modelcontextprotocol/sdk` | MCP TypeScript implementation [R20] |
| `@a2a-js/sdk` | A2A server/client SDK ecosystem artifact [R24][R56] |
| `@ag-ui/core`, `@ag-ui/client` | AG-UI protocol schema + client integration [R25][R26] |
| `@openai/agents` | OpenAI JS SDK for agent workflows [R35] |

## 4) Repository maturity snapshot (GitHub, collected 2026-03-10)

| Repository | Stars | License | Notes |
|---|---:|---|---|
| `microsoft/autogen` | 55,378 | CC-BY-4.0 | Very large community footprint |
| `run-llama/llama_index` | 47,528 | MIT | Strong RAG/data ecosystem |
| `crewAIInc/crewAI` | 45,638 | MIT | Rapid multi-agent workflow adoption |
| `langchain-ai/langgraph` | 26,001 | MIT | Stateful orchestration reference |
| `openai/openai-agents-python` | 19,475 | MIT | High momentum for OpenAI-native stacks |
| `a2aproject/A2A` | 22,382 | Apache-2.0 | Core A2A protocol implementation |
| `ag-ui-protocol/ag-ui` | 12,375 | MIT | UI protocol momentum |
| `modelcontextprotocol/modelcontextprotocol` | 7,439 | NOASSERTION | Central MCP specification repo |
| `openai/openai-agents-js` | 2,407 | MIT | JS counterpart growing fast |
| `agent-network-protocol/AgentNetworkProtocol` | 1,217 | Apache-2.0 | Emerging ANP standard effort |
| `langchain-ai/agent-protocol` | 528 | MIT | Interoperability API spec |
| `a2aproject/a2a-js` | 476 | Apache-2.0 | JS SDK for A2A usage |
| `mondaycom/agent-tool-protocol` | 88 | MIT | Early-stage ATP implementation |

Source: [R56]

## 5) Cost and operability considerations

From production engineering writeups:

- Real cost is often driven by orchestration overhead, retries, tracing, and guardrail design, not only model token spend. [R42]
- Teams adopting open protocols early report lower custom integration burden and faster migration flexibility. [R42][R43]
- Multi-agent stacks require explicit loop controls and termination policies to prevent runaway behavior.

## 6) GitLab Duo Agent Platform

GitLab’s GA announcement positions Duo Agent Platform as lifecycle-wide agentic tooling with:

- context-aware agentic chat,
- prebuilt planner and security analyst agents,
- support for custom and external agents (including Claude Code and Codex integrations). [R41]

This is important as an enterprise indicator: platform vendors are moving from “copilot features” to orchestrated agent ecosystems.

## 7) Note on “Parlay”

The requested list included “Parlay,” but a clear, widely accepted open-source framework by that exact name was not consistently identifiable in authoritative sources at this time. The report therefore focuses on clearly verifiable frameworks (OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex) and flags this as an ambiguity.
