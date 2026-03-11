# Open-Source Frameworks and Project Landscape

_Report date: 2026-03-11_

## 1) Frameworks that define current implementation practice

### OpenAI Agents SDK
OpenAI’s SDK centers on multi-agent orchestration with first-class primitives for agents, handoffs, tools, guardrails, tracing, HITL, sessions, and realtime modes. The project README states support for OpenAI APIs plus 100+ additional LLMs via provider-agnostic integration paths.[SRC-25][SRC-26]

### LangGraph
LangGraph is positioned as low-level orchestration for long-running, stateful agents with durable execution, memory, human-in-the-loop controls, and production observability workflows.[SRC-27]

### CrewAI
CrewAI emphasizes dual constructs: autonomous “Crews” and event-driven “Flows” for production automation, with explicit enterprise messaging around control-plane, security, and observability.[SRC-28]

### AutoGen
AutoGen remains a major multi-agent framework with extensible layers, model integrations, and tooling support (including MCP usage examples and warnings about trusted tool servers).[SRC-29]

### LlamaIndex
LlamaIndex is now positioned as an agentic application/data framework spanning ingestion, retrieval, index/query workflows, and document-agent tooling in a larger ecosystem.[SRC-30]

### Parlant (interpreting user-provided “Parlay” as likely Parlant)
Parlant focuses on conversational control/context-engineering for customer-facing agent reliability, especially in high-stakes or compliance-sensitive flows.[SRC-31]

### GitLab Duo Agent Platform
GitLab’s GA messaging positions agentic workflows as extending beyond code generation into planning, security, CI/CD, and lifecycle automation, with planner/security agents and custom/external agent extensibility.[SRC-32][SRC-33][SRC-34]

## 2) Repository maturity snapshot (stars and recency)

_Star counts captured via GitHub on 2026-03-11 (UTC); they will change over time._

| Project | Repo | Stars | License | Last updated (UTC) | Notes |
|---|---|---:|---|---|---|
| OpenAI Agents SDK | `openai/openai-agents-python` | 19,781 | MIT | 2026-03-11 | Strong primitives + tracing/guardrails.[SRC-25] |
| LangGraph | `langchain-ai/langgraph` | 26,123 | MIT | 2026-03-11 | Stateful orchestration focus.[SRC-27] |
| CrewAI | `crewAIInc/crewAI` | 45,752 | MIT | 2026-03-11 | Multi-agent autonomy + flows.[SRC-28] |
| AutoGen | `microsoft/autogen` | 55,442 | CC-BY-4.0 | 2026-03-11 | Large installed base and layered APIs.[SRC-29] |
| LlamaIndex | `run-llama/llama_index` | 47,575 | MIT | 2026-03-11 | Data/retrieval-heavy agent stack.[SRC-30] |
| Parlant | `emcie-co/parlant` | 17,819 | Apache-2.0 | 2026-03-10 | Context-engineering niche.[SRC-31] |
| AG-UI | `ag-ui-protocol/ag-ui` | 12,391 | MIT | 2026-03-11 | UI protocol ecosystem.[SRC-19] |
| A2A | `a2aproject/A2A` | 22,422 | Apache-2.0 | 2026-03-11 | Core inter-agent standard repo.[SRC-18] |
| MCP servers | `modelcontextprotocol/servers` | 80,796 | Various | 2026-03-11 | Tool-server ecosystem proxy signal.[SRC-16] |
| ANP | `agent-network-protocol/AgentNetworkProtocol` | 1,223 | Apache-2.0 | 2026-03-11 | Emerging decentralized direction.[SRC-20] |
| Agent Protocol | `langchain-ai/agent-protocol` | 529 | MIT | 2026-03-11 | API standard layer.[SRC-22] |

## 3) DUADP + OSSA package layer

The user-requested npm packages are currently:
- `@bluefly/duadp` (latest observed: 0.1.4), described as DUADP TypeScript SDK.[SRC-07]
- `@bluefly/openstandardagents` (latest observed: 0.4.9), described as OSSA contract/export tooling.[SRC-13]

This pairing suggests an explicit architecture:
- OSSA handles definition/contract/deployment export.
- DUADP handles discovery/federation/trust exchange.

## 4) Cost and operations considerations (from production blogs)

Across 2026 practitioner writeups, common cost/ops themes:
- Reliability and debugging overhead often dominate token cost in early production deployments.
- Multi-agent loops, context drift, and weak termination criteria can explode spend.
- Teams report better outcomes with staged rollout, kill-switches, and strict observability before autonomy expansion.[SRC-35][SRC-36]

These claims are useful for operations planning but should be validated against your own telemetry and incident data.

## 5) Community support signals

Useful maturity indicators beyond stars:
- release cadence and issue resolution velocity,
- docs quality and examples,
- interoperability posture (MCP/A2A/standard compatibility),
- and security guidance quality.

Most high-traction projects now include observability or guardrail narratives by default, which is a positive shift from 2024-era “demo-first” agent frameworks.
