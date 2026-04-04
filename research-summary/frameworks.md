# Open-Source Frameworks and Repositories

As of April 4, 2026, production usage appears concentrated in a small set of framework families plus rapidly growing protocol tooling. [T36][T37][T38][T39][T40][T48]

## Framework snapshot

| Project | Core primitives / model | Best-fit use cases | OSS signal (stars) |
| --- | --- | --- | --- |
| OpenAI Agents SDK | Agents, handoffs/agent-as-tool, guardrails, tracing; MCP integration | Structured agent workflows with strong observability | 20,561 [T36][T48] |
| LangGraph | Graph/runtime orchestration, durable execution, HITL, stateful long-running flows | Complex, stateful orchestration and enterprise workflows | 28,376 [T37][T48] |
| CrewAI | Crews + Flows, strong process abstractions, enterprise control-plane story | Team-style multi-agent automation, event-driven orchestration | 47,982 [T38][T48] |
| AutoGen | Layered framework (core, agentchat, extensions), multi-agent chat patterns | Research/prototyping and extensible multi-agent apps | 56,676 [T39][T48] |
| LlamaIndex | Data-first agent framework, large integration catalog, document-centric tooling | RAG/document agents, retrieval and enterprise data workflows | 48,279 [T40][T48] |
| GitLab Duo Agent Platform | Integrated product with foundational agents + flows + MCP client | End-to-end DevSecOps agentic automation in GitLab ecosystem | Product platform [T41] |

## Detailed notes

### OpenAI Agents SDK
- Minimal primitive set is explicit in docs: agent loop, handoffs, guardrails, tracing.
- Includes OpenAI-native and non-OpenAI integration pathways via providers/adapters.
- Practical strength: quick path from prototype to instrumented production loops. [T36]

### LangGraph
- Low-level orchestration runtime (durable execution, human interrupts, memory handling).
- Strong when you need explicit control of graph state and failure/resume semantics. [T37]

### CrewAI
- Distinct split between autonomous “Crews” and deterministic “Flows”.
- Enterprise narrative emphasizes observability, guardrails, and managed control plane. [T38]

### AutoGen
- Mature multi-agent lineage with layered architecture and strong extension model.
- Current maintainers point new users toward Microsoft Agent Framework for greenfield, while AutoGen remains maintained. [T39]

### LlamaIndex
- Data- and document-centric architecture with extensive connector ecosystem.
- Useful for organizations where retrieval/parsing/index quality is the bottleneck, not just agent orchestration. [T40]

### GitLab Duo Agent Platform
- General-availability release highlights lifecycle-wide use (planning, code, CI/CD, security).
- Includes foundational agents (Planner, Security Analyst), custom catalog, and external integrations (including Claude Code and Codex CLI). [T41]

## Notable open standards repos

| Repository | Purpose | Stars |
| --- | --- | --- |
| `langchain-ai/agent-protocol` | Agent serving/API contract (runs, threads, store) | 543 |
| `agent-network-protocol/AgentNetworkProtocol` | ANP protocol spec and architecture | 1,259 |
| `mondaycom/agent-tool-protocol` | ATP code-first protocol runtime | 93 |

Source: GitHub CLI snapshot captured April 4, 2026. [T48]

## Cost/operations observations from engineering writeups

Industry implementation writeups repeatedly call out:
- multi-agent cost nonlinearity (token and orchestration overhead),
- reliability/guardrail overhead becoming the dominant engineering effort,
- and practical need for progressive rollout with explicit human checkpoints. [T45]

These claims are directional and useful for planning, but they are vendor-blog level evidence and should be validated with internal telemetry in your own stack. [T45][T46]

## “Parlay” note

The “Parlay” name appears in multiple unrelated projects in search results, with no single clearly dominant framework matching the same adoption tier as the frameworks above. For this report, mainstream framework coverage is based on widely referenced production stacks (OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex). [T36][T37][T38][T39][T40]
