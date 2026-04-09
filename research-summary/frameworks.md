# Open-Source Frameworks and Projects (2025-2026)

This document compares major open-source agent frameworks, related protocol repositories, and ecosystem maturity indicators, with emphasis on practical architecture and operational tradeoffs.

## 1) OpenAI Agents SDK

OpenAI's Agents SDK (Python repo and corresponding ecosystem components) is centered on four production primitives often highlighted in adoption discussions: **agents, handoffs, guardrails, and tracing**. The project is designed for multi-agent workflows and supports tool integrations and human-in-the-loop patterns. [T27]

From an architecture perspective, this model targets reliable orchestration with inspectable execution paths and policy checkpoints. It fits teams that need a batteries-included developer experience and integrated observability, especially where runtime governance matters as much as raw generation quality. [T27][T33]

## 2) LangGraph

LangGraph provides graph-structured execution (state, nodes, edges) and message-passing semantics for long-running or branching workflows. This is useful when control flow complexity is high and teams need deterministic transitions, resumability, and explicit human intervention points. [T28]

Its positioning is complementary to protocol standards: LangGraph can serve as orchestration substrate while protocols (for example MCP/A2A/AG-UI) define external interoperability boundaries. [T14][T16][T19][T28]

## 3) CrewAI

CrewAI emphasizes multi-agent collaboration through distinct organizational constructs (often described as crews/flows), with a strong focus on enterprise workflow modeling. The approach is opinionated for role-based coordination and can reduce custom orchestration code for task specialization patterns. [T29]

Operationally, this is attractive for teams that prioritize delegation semantics and process modeling, but governance rigor still depends on external controls for identity, policy, and tool permissions. [T29][T35][T38]

## 4) AutoGen (Microsoft)

AutoGen remains influential in multi-agent research and prototyping, but repository guidance indicates maintenance-mode positioning while successor architectures evolve. This matters for roadmap planning: teams should assess long-term support and migration strategy before committing deeply to new production dependencies. [T30]

## 5) LlamaIndex

LlamaIndex is strong in data-centric agent systems, especially retrieval and knowledge interface patterns. It is often selected when the dominant challenge is building high-quality data grounding pipelines rather than agent-to-agent delegation fabric. [T31]

## 6) GitLab Duo Agent Platform

GitLab's GA announcement positions Duo Agent Platform as a software-delivery-native agent environment with prebuilt and custom agents plus MCP client integration. Its value proposition is context-rich SDLC tasks (planning, code, CI/CD, and security) within established enterprise workflows. [T32]

## 7) Protocol Repositories and Standards Projects

In addition to runtime frameworks, several repositories function as interoperability anchors:

- Agent Network Protocol (ANP): decentralized protocol vision and architecture work. [T22]  
- LangChain Agent Protocol repo: framework-agnostic runtime API model. [T23][T24]  
- monday.com's Agent Tool Protocol: protocol for secure tool/code execution semantics. [T25]

These projects are foundational for interoperability but are not direct substitutes for orchestration frameworks.

## 8) Snapshot Comparison (Stars/Forks are point-in-time)

**Metadata retrieval date:** April 9, 2026 (UTC), via GitHub repository API (read-only CLI queries). [T47]

| Project | Main role | Repo | Stars | Forks | Last updated (UTC) |
|---|---|---|---:|---:|---|
| OpenAI Agents SDK | Multi-agent runtime SDK | `openai/openai-agents-python` | 20,664 | 3,391 | 2026-04-09T09:40:14Z |
| LangGraph | Graph orchestration runtime | `langchain-ai/langgraph` | 28,764 | 4,914 | 2026-04-09T10:05:59Z |
| CrewAI | Multi-agent collaboration/orchestration | `crewAIInc/crewAI` | 48,415 | 6,601 | 2026-04-09T10:06:05Z |
| AutoGen | Multi-agent framework (maintenance trajectory) | `microsoft/autogen` | 56,856 | 8,550 | 2026-04-09T10:15:03Z |
| LlamaIndex | Data/RAG agent framework | `run-llama/llama_index` | 48,428 | 7,181 | 2026-04-09T10:05:39Z |
| ANP | Open protocol repository | `agent-network-protocol/AgentNetworkProtocol` | 1,262 | 86 | 2026-04-09T10:14:41Z |
| Agent Protocol | Interop protocol repository | `langchain-ai/agent-protocol` | 553 | 46 | 2026-04-08T15:23:15Z |
| Agent Tool Protocol | Tool execution protocol repo | `mondaycom/agent-tool-protocol` | 94 | 10 | 2026-04-08T23:44:49Z |

## 9) OSSA/DUADP Package Positioning in the Framework Ecosystem

OSSA and DUADP are better viewed as **infrastructure-adjacent standards tooling** than direct competitors to orchestration runtimes:

- `@bluefly/openstandardagents` provides manifest schema, validation, export adapters, and protocol declaration compatibility surfaces (MCP/A2A/ANP). [T03][T06][T07]  
- `@bluefly/duadp` provides discovery/federation capabilities around decentralized agent discovery and trust signaling. [T01][T04]

In practice, teams can pair framework runtimes (LangGraph/CrewAI/OpenAI SDK) with OSSA contracts and DUADP discovery to separate orchestration concerns from identity/discovery concerns.

## 10) Cost and Reliability Considerations from Engineering Publications

Operational reports emphasize that protocol adoption alone is insufficient; teams need reliability patterns (timeouts, retries, circuit breakers, caching discipline, staged rollout) and explicit cost controls for model/tool execution loops. [T33]

Framework choice should therefore be evaluated against:

1. Native support for guardrails, tracing, and policy checkpoints. [T27][T33]  
2. Ease of introducing identity-aware auth and least privilege. [T35][T38][T40]  
3. Ability to expose or consume open protocols without brittle custom adapters. [T14][T16][T19][T23]
