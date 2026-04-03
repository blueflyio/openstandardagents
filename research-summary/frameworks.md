# Frameworks and projects (open source + platform offerings)

Date compiled: April 3, 2026

## Quick landscape

Framework activity is high, but the categories differ:

1. **Agent runtime frameworks** (OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex),
2. **Protocol standards repos** (MCP/A2A/Agent Protocol/ANP/ACP),
3. **Enterprise platform products** (for example GitLab Duo Agent Platform). [SRC-OPENAI-AGENTS-README-2026] [SRC-LANGGRAPH-DOCS-2026] [SRC-GITLAB-DUO-GA-2026]

## Major open-source frameworks (selected)

Star counts below were queried on April 3, 2026 and will change over time. [SRC-GH-FRAMEWORK-METADATA-2026]

| Project | Approx. stars | What it is best at | Notes |
| --- | ---:| --- | --- |
| openai/openai-agents-python | 20,542 | Lightweight multi-agent orchestration with guardrails/tracing | README states provider-agnostic + 100+ LLM support |
| langchain-ai/langgraph | 28,319 | Stateful graph orchestration, durable workflows | Strong for explicit control over complex flows |
| crewAIInc/crewAI | 47,911 | Role/task-oriented multi-agent orchestration | Popular with teams preferring high-level abstractions |
| microsoft/autogen | 56,632 | General agentic programming framework | Broad experimentation and research use |
| run-llama/llama_index | 48,258 | Retrieval/document-centric agents and pipelines | Strong where RAG is central |

## OpenAI Agents SDK

OpenAI's SDK consistently emphasizes a small primitive set (agents, handoffs, guardrails, tracing) and a provider-agnostic model interface with support for OpenAI APIs and many non-OpenAI models. [SRC-OPENAI-AGENTS-README-2026] [SRC-OPENAI-AGENTS-DOCS-2026]

Practical implication: good fit for teams that want minimal abstractions and strong observability primitives out of the box.

## LangGraph

LangGraph frames agent execution as graph/state orchestration with durable runs, human-in-the-loop checkpoints, and production debugging integration. [SRC-LANGGRAPH-DOCS-2026]

Practical implication: good fit when teams need explicit, auditable control of branching/looping workflows rather than opaque autonomous behavior.

## CrewAI

CrewAI is widely adopted in practitioner communities for role-based multi-agent flows. Independent claims vary in quality; use official repo/docs for baseline and treat third-party growth claims as directional. [SRC-GH-FRAMEWORK-METADATA-2026] [SRC-CREWAI-WEBSEARCH-2026]

## AutoGen

AutoGen remains one of the most starred agentic frameworks and is often used for complex conversational multi-agent patterns and experimentation. [SRC-GH-FRAMEWORK-METADATA-2026]

## LlamaIndex

LlamaIndex positions itself strongly in document/knowledge workflows and remains one of the most-used open-source building blocks for retrieval-heavy systems. [SRC-GH-FRAMEWORK-METADATA-2026]

## LangChain Agent Protocol repo (standards-adjacent)

`langchain-ai/agent-protocol` is not a generic runtime framework; it codifies production-serving APIs (runs, threads, store, agent introspection). [SRC-LANGCHAIN-AGENT-PROTOCOL-README-2026]

This is important because it can act as an interop contract between different runtime implementations.

## Enterprise platform example: GitLab Duo Agent Platform

GitLab's GA announcement and docs describe:
- lifecycle-embedded "agentic chat",
- foundational agents (planner, security analyst),
- custom/external agents and flows,
- governance controls and model-selection options. [SRC-GITLAB-DUO-GA-2026] [SRC-GITLAB-DUO-DOCS-2026]

Interpretation: enterprises are moving from isolated coding assistants toward platform-level agent orchestration with policy controls.

## Cost and production guidance from engineering blogs (use with caution)

Sources like 47Billion and Ruh.ai are useful for implementation heuristics (progressive rollout, monitoring, protocol fit), but metrics are vendor/self-reported and should be validated before high-stakes decisions. [SRC-47B-2026] [SRC-RUH-2026]

## Framework selection checklist (2026)

Use this as a practical filter:

1. **Control model**: graph/task explicitness vs autonomous conversation loops.
2. **Protocol alignment**: MCP/A2A/AG-UI support path.
3. **Security hooks**: policy enforcement, approval workflows, traceability.
4. **State model**: memory/session durability and replayability.
5. **Ops fit**: deployment target, observability, governance integration.

No single framework dominates all five dimensions; architecture and risk profile should drive choice.
