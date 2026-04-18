# Open-Source Frameworks and Projects (2025-2026)

Date finalized: April 18, 2026.

## 1) Core framework landscape

Frameworks have converged on a shared architecture pattern:

- Model abstraction
- Tool integration
- Planning/orchestration loop
- State/memory handling
- Observability/tracing

But each framework optimizes for a different tradeoff (developer speed, control, enterprise governance, or data-centric retrieval).

## 2) OpenAI Agents SDK

OpenAI’s Agents SDK documents a minimal primitive set:

- Agents
- Handoffs (agents as tools)
- Guardrails
- Tracing [F01]

It presents itself as lightweight and production-ready, with support for sessions, HITL, MCP server tool calling, and realtime/voice pathways [F01].

### Practical read

Strengths:

- clean abstraction for orchestration
- built-in tracing and guardrail concepts
- straightforward starting path for Python users

Constraints:

- like all high-level runtimes, behavior reliability still depends on tool boundaries and policy controls external to model reasoning.

## 3) LangGraph (LangChain)

LangGraph formalizes agent systems as a graph of state, nodes, and edges, with message-passing and super-step execution model [F02].

Key properties:

- explicit state transitions
- conditional routing
- looping workflows
- checkpointers and resumability hooks [F02]

### Practical read

Strengths:

- high control and debuggability for complex workflows
- suitable for long-running stateful tasks

Constraints:

- greater engineering overhead than “quick-start” agent wrappers

## 4) CrewAI

CrewAI is a high-growth open-source multi-agent framework emphasizing role-based collaboration and structured orchestration [F03].

As of snapshot data, repository scale is strong (49k+ GitHub stars), indicating large developer interest [F07].

### Practical read

Strengths:

- fast path for role/task-based orchestration
- broad community and template ecosystem

Constraints:

- large usage does not guarantee governance maturity; production controls still require explicit hardening.

## 5) AutoGen (Microsoft)

AutoGen remains a foundational multi-agent framework project, but public materials indicate maintenance-mode status and migration guidance toward newer Microsoft agent framework trajectories [F04].

### Practical read

Strengths:

- rich legacy patterns and examples for multi-agent conversation workflows

Constraints:

- organizations should account for maintenance trajectory before selecting for net-new core builds.

## 6) LlamaIndex

LlamaIndex remains strong for data-centric agent applications, especially retrieval and workflow orchestration over heterogeneous data sources [F05].

Public docs emphasize event-driven workflows and RAG-centric composition [F05].

### Practical read

Strengths:

- robust for “agents over data”
- retrieval tooling ecosystem depth

Constraints:

- not always the simplest option for non-RAG, pure orchestration tasks.

## 7) GitLab Duo Agent Platform

GitLab’s GA announcement positions Duo Agent Platform as lifecycle-wide agentic orchestration with:

- context-aware agentic chat
- foundational agents (Planner, Security Analyst)
- custom agent catalog and flows
- external tool/agent integration (including Claude Code and Codex CLI references)
- governance controls and model selection options [F06]

### Practical read

This is an example of “platformized agent operations” where governance and workflow integration are built into the SDLC toolchain.

## 8) Additional projects and compatibility layers

### LangChain Agent Protocol repository

Defines framework-agnostic API shape for serving agents in production, centered on Runs, Threads, and Store (plus introspection endpoints) [P06].

### Monday.com Agent Tool Protocol (ATP)

Proposes code-execution-centric agent tooling with secure sandbox execution, parallel operations, and OpenAPI/MCP compatibility [P10].

## 9) Repository maturity snapshot (GitHub, April 18, 2026)

| Project | Stars | License | Notes |
| --- | ---:| --- | --- |
| microsoft/autogen | 57,181 | CC-BY-4.0 | Strong legacy adoption; maintenance-mode messaging present [F04][F07] |
| crewAIInc/crewAI | 49,139 | MIT | Large OSS user momentum [F03][F07] |
| run-llama/llama_index | 48,665 | MIT | Strong data/RAG-centric ecosystem [F05][F07] |
| langchain-ai/langgraph | 29,555 | MIT | Graph-native orchestration [F02][F07] |
| openai/openai-agents-python | 22,003 | MIT | Newer but quickly adopted SDK [F01][F07] |
| ag-ui-protocol/ag-ui | 13,067 | MIT | Agent↔UI protocol repo growth [P04][F07] |
| a2aproject/A2A | 23,260 | Apache-2.0 | Protocol ecosystem momentum [P03][F07] |
| langchain-ai/agent-protocol | 568 | MIT | Spec-focused interoperability API [P06][F07] |
| mondaycom/agent-tool-protocol | 94 | MIT | Early-stage ATP protocol project [P10][F07] |
| blueflyio/openstandardagents | 4 | Apache-2.0 | Early-stage OSSA public repo signal [O01][F07] |

## 10) DUADP/OSSA npm package observations

### `@bluefly/duadp`

- Version: 0.1.4
- Weekly downloads (snapshot): 119
- Positioning: TypeScript SDK for decentralized discovery, federation, and trust-aware registry interfaces [D03]

### `@bluefly/openstandardagents`

- Version: 0.5.1
- Weekly downloads (snapshot): 245
- Positioning: contract/manifest and export layer across many agent deployment targets [O04]

## 11) Cost and production-readiness insights from engineering blogs

47Billion’s production writeup emphasizes:

- autonomy-level selection matters more than framework branding
- multi-agent systems increase complexity and token spend
- reliability comes from constraints, monitoring, and HITL, not from framework choice alone [B01]

Ruh.ai’s guide emphasizes protocol selection and communication standardization as key implementation success factors [B02].

---

For full citation map and URLs, see `reading-list.md`.
