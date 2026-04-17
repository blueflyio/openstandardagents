# Open-Source Frameworks and Project Landscape

Last updated: April 17, 2026

## Executive snapshot

The framework layer has split into two major categories:

1. **Agent runtimes/orchestrators** (OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex, etc.).
2. **Protocol/contract/discovery overlays** (MCP, A2A, OSSA, DUADP, AG-UI, ANP variants).

Production teams increasingly combine both layers rather than picking a single framework/protocol stack [SRC-009][SRC-030].

## Key projects and what they do

### OpenAI Agents SDK

OpenAI’s SDK emphasizes a minimal primitive set:

- Agents
- Handoffs (agents as tools)
- Guardrails
- Tracing [SRC-025]

It explicitly positions itself as a higher-level runtime over model APIs and includes support for tool loops, safety checks, and observability. This makes it suitable for teams wanting a guided runtime without building orchestration infrastructure from scratch [SRC-025].

### LangGraph

LangGraph is a low-level graph runtime for long-running, stateful, durable agent orchestration. Its value proposition is explicit state/edge control, human-in-the-loop support, and production observability integration [SRC-023].

It is especially useful when teams need deterministic control over multi-step workflows and failure recovery.

### CrewAI

CrewAI is commonly used for role-based multi-agent workflows. Field reports describe faster initial delivery than conversation-centric alternatives for structured tasks, with tradeoffs in deep dynamic flexibility [SRC-030].

### AutoGen

AutoGen is designed around multi-agent conversational collaboration and delegation. It is often strong for exploratory workflows, but practitioners report higher token overhead and harder debugging in open-ended multi-agent loops [SRC-030].

### LlamaIndex

LlamaIndex remains strongest for document-centric and RAG-heavy systems, where retrieval and synthesis are the core value path rather than arbitrary orchestration [SRC-030].

### GitLab Duo Agent Platform

GitLab positions Duo Agent Platform as lifecycle-wide agentic orchestration (not just coding assistance), including:

- Agentic chat,
- foundational agents (planner, security analyst),
- flow automation (issue-to-MR, CI/CD fixes, review),
- custom and external agent integration,
- governance controls and model-selection options [SRC-023][SRC-024].

This reflects a broader enterprise trend: embedding agents into existing delivery systems rather than adding standalone assistants.

## DUADP and OSSA in the framework ecosystem

### DUADP (`@bluefly/duadp`)

DUADP functions as a discovery/federation protocol + SDK layer. Public docs describe registry/discovery APIs, federation endpoints, DID identity hooks, and SDK support for client/server implementations [SRC-001][SRC-002][SRC-003].

### OSSA (`@bluefly/openstandardagents`)

OSSA is positioned as a contract/manifest layer across deployment targets (runtime adapters, CI/CD outputs, MCP integration, and platform export tooling). It attempts to reduce M×N configuration explosion by keeping one canonical manifest and exporting per-target artifacts [SRC-004][SRC-005][SRC-008].

## Community/maturity indicators (selected repositories, April 17, 2026 snapshot)

| Project | Focus | GitHub stars* | Notes |
| --- | --- | ---:| --- |
| microsoft/autogen | multi-agent framework | 57,167 | strong OSS momentum |
| crewAIInc/crewAI | role/task orchestration | 49,084 | large practitioner uptake |
| run-llama/llama_index | RAG + agent workflows | 48,646 | document-centric strength |
| langchain-ai/langgraph | stateful graph orchestration | 29,498 | mature orchestration core |
| openai/openai-agents-python | minimal primitives runtime | 21,522 | strong recent adoption |
| a2aproject/A2A | agent-to-agent protocol | 23,246 | protocol momentum |
| ag-ui-protocol/ag-ui | agent-user protocol | 13,046 | UI protocol traction |
| modelcontextprotocol/modelcontextprotocol | MCP spec | 7,843 | core tooling standard |
| agent-network-protocol/AgentNetworkProtocol | ANP | 1,264 | early ecosystem |
| langchain-ai/agent-protocol | framework-agnostic API | 567 | focused but smaller |
| mondaycom/agent-tool-protocol | code-first agent tooling protocol | 94 | early stage |

\*Star counts were collected via `gh repo view` snapshot on April 17, 2026 and will drift over time.

## Practical framework selection guidance

1. **If workflow is narrow and deterministic:** start with single-agent + strict tools + guardrails.
2. **If stateful orchestration is core:** favor graph/state runtimes (e.g., LangGraph class).
3. **If document/RAG depth is core:** favor retrieval-first frameworks (LlamaIndex class).
4. **If enterprise SDLC embedding is key:** use platform-native orchestration surfaces (e.g., GitLab Duo).
5. **Add protocol layers progressively:** MCP first, then A2A/AG-UI/contract-discovery layers as complexity grows.

This sequence matches the phased protocol-adoption recommendations in interoperability surveys and practitioner reports [SRC-030][SRC-037].
