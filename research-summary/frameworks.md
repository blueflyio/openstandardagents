# Open-source frameworks, repositories, npm packages, and project maturity

Generated: 2026-05-29. Repository metrics are point-in-time GitHub observations
from 2026-05-29.

## Summary

The framework ecosystem divides into runtime/orchestration libraries,
protocol/specification repositories, and agent platform products. LangGraph,
CrewAI, OpenAI Agents SDK, LlamaIndex, Microsoft Agent Framework, and AutoGen
help developers implement workflows. MCP, A2A, ACP, AG-UI, ANP, and LangChain
Agent Protocol define interoperability boundaries. OSSA and DUADP address
portable contracts and discovery/identity, which are different from both
frameworks and wire protocols [S02][S01].

## OSSA and DUADP packages

`@bluefly/openstandardagents` v0.5.1 is an Apache-2.0 npm package whose
description is "OSSA - Open Standard for Software Agents." Its binaries include
`ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, and `ossa-mcp` [S04].
The package exports schemas, validation, generation, migration, types,
OpenAPI extensions, mesh, agent-card generation, SDK, trust service, and an MCP
server [S04]. In practical terms, it is the contract layer: define an agent once
and export it to platform-specific forms [S02][S03].

`@bluefly/duadp` v0.1.4 is an Apache-2.0 npm package for the Decentralized
Universal AI Discovery Protocol. It provides a TypeScript SDK/CLI with the
`duadp` binary, schema validation dependencies, YAML support, canonicalization,
and DID resolver dependencies [S05]. Its website describes federated DNS +
WebFinger discovery, gossip federation, DID identity, governance endpoints, and
17 MCP tools [S01].

The relationship is concise: OSSA defines the agent; DUADP discovers, verifies,
federates, and filters it [S01][S03].

## Framework comparison

| Project | Stars | Core primitives | Strengths | Maturity notes |
| --- | ---: | --- | --- | --- |
| Microsoft AutoGen | 58,515 | Conversable agents, AgentChat, Core API, extensions | Research-backed multi-agent conversations | In maintenance mode; new users directed to Microsoft Agent Framework [S39] |
| CrewAI | 52,418 | Agents, tasks, crews, flows | Fast role-based teams and event-driven production flows | Active Python framework; independent of LangChain [S38] |
| LlamaIndex | 49,749 | Data connectors, indices, query engines, FunctionAgent, AgentWorkflow | RAG-heavy and document-agent systems | Strong data ingestion/retrieval ecosystem [S41][S42] |
| LangGraph | 33,303 | StateGraph, nodes, edges, shared state, checkpointers | Durable stateful workflows, HITL, graph control | Production-oriented orchestration runtime [S36][S37] |
| OpenAI Agents SDK Python | 26,741 | Agents, tools, handoffs, guardrails, sessions, tracing | Lightweight multi-agent workflows, provider-agnostic | MIT; 100+ LLM support claimed in README [S33] |
| A2A protocol | 24,059 | Agent Cards, tasks, messages, artifacts | Cross-vendor agent delegation | Linux Foundation project contributed by Google [S21][S22] |
| AG-UI | 13,912 | Run input, typed events, state/tool lifecycle | Frontend/backend agent streaming | Active TypeScript protocol project [S23][S24] |
| Microsoft Agent Framework | 10,847 | Agents, orchestration, Python/.NET | Enterprise successor to AutoGen/Semantic Kernel direction | Recommended by Microsoft for new projects [S40][S39] |
| OpenAI Agents SDK JS | 3,145 | Agents, sandbox agents, handoffs, guardrails, tracing | TypeScript agent apps and voice agents | npm package `@openai/agents` v0.11.6 [S34][S35] |
| ANP | 1,304 | DIDs, did:wba, meta-protocol, app protocol | Identity/discovery for agentic web | W3C community group alignment [S25][S26] |
| ACP | 1,004 | REST messages, parts, sessions, discovery | Lightweight REST agent communication | BeeAI/Linux Foundation ecosystem [S29][S30] |
| LangChain Agent Protocol | 595 | Runs, Threads, Store | Serving API for agent execution and memory | Used with LangGraph Studio and framework interop [S27][S28] |
| monday ATP | 97 | Sandboxed code execution, searchApi, runtime SDK | Large API aggregation and safe code execution | Young project; npm client v0.24.0 [S31][S32] |

## OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight framework for multi-agent workflows in
Python and TypeScript/JavaScript [S33][S34]. Its README lists agents, handoffs
or agents-as-tools, tools, guardrails, sessions, and tracing as core
capabilities. The Python repository claims provider-agnostic support for OpenAI
Responses/Chat Completions plus 100+ other LLMs [S33]. The TypeScript docs add
sandbox agents that pair agents with isolated filesystems, shell commands,
snapshots, and session state [S34].

The npm package `@openai/agents` v0.11.6 describes itself as a lightweight
framework for multi-agent workflows, with dependencies split across
`@openai/agents-core`, `@openai/agents-realtime`, and
`@openai/agents-openai` [S35].

## LangGraph

LangGraph is a low-level orchestration framework and runtime for long-running,
stateful agents [S36]. Its graph API models workflows as nodes and edges over a
shared state object, with execution proceeding in Pregel-like super-steps [S37].
It emphasizes durable execution, streaming, persistence, human-in-the-loop,
short-term and long-term memory, and debugging with LangSmith [S36].

LangGraph is strongest when an agent needs explicit control flow, loops,
branches, parallel fan-out/fan-in, checkpointing, recovery, and human approval
points [S36][S37]. Its integration with the LangChain Agent Protocol makes it
well suited to serving and introspection via Runs, Threads, and Store [S27].

## CrewAI

CrewAI is a Python framework for orchestrating role-playing autonomous agents
[S38]. Its two headline abstractions are Crews and Flows. Crews optimize for
collaborative intelligence: agents with roles, goals, backstories, and tools
work together on tasks. Flows provide event-driven, production-grade control,
state management, conditional branching, and precise task orchestration [S38].

CrewAI is useful when the mental model is a team of specialists and the
workflow can be expressed as role-based delegation. It is more opinionated than
LangGraph and generally faster to prototype, but lower-level graph systems give
more explicit state-machine control [S38][S47].

## AutoGen and Microsoft Agent Framework

AutoGen pioneered conversation-based multi-agent patterns and remains one of
the most starred open-source agent repositories [S39]. Its README now states
that AutoGen is in maintenance mode and recommends Microsoft Agent Framework
for new projects [S39]. AutoGen still matters historically and for existing
deployments: it introduced customizable, conversable agents that can combine
LLMs, human input, and tools [S39].

Microsoft Agent Framework is the successor path for enterprise-ready agent and
multi-agent workflows, with Python and .NET support [S40]. For new Microsoft
ecosystem projects, it should be evaluated before starting on AutoGen [S39][S40].

## LlamaIndex

LlamaIndex is a data framework for agentic applications, especially RAG and
document workflows [S41]. It provides connectors, indexing, retrieval/query
interfaces, and integrations for application frameworks. Its AgentWorkflow
system builds on Workflows to coordinate specialized agents, maintain state,
handle multi-step processes, and stream/monitor activities [S42].

LlamaIndex is the strongest fit when the core problem is knowledge ingestion,
document parsing, retrieval quality, query engines, and RAG tools that an agent
uses [S41][S42].

## Parlay, ParlAI, and naming ambiguity

The user's prompt mentioned "Parlay." The search results show multiple similar
names rather than one dominant general-purpose agent framework. Meta's ParlAI
is a mature Python framework for training and evaluating dialogue models across
open-domain chat, task-oriented dialogue, visual QA, agents, tasks, and
crowdsourcing [S43]. It is not a production multi-agent/RAG orchestration
framework in the same category as LangGraph or CrewAI.

`sh4shv4t/Parlay` is an OpenEnv-compliant reinforcement-learning negotiation
environment where LLM agents learn game theory, theory of mind, and strategic
bluffing through self-play, with a WebSocket environment and MCP tools [S44].
It is better categorized as an agent training/evaluation environment than an
enterprise agent orchestration framework [S44].

## GitLab Duo Agent Platform

GitLab Duo Agent Platform is a product platform rather than a framework
library. GitLab announced general availability with Agentic Chat, foundational
agents, custom agents through the AI Catalog, and external agents including
Claude Code and OpenAI Codex [S45]. GitLab docs describe features across the
SDLC: agentic chat that can answer complex questions and edit files, custom
agents, external agents, planner/data/security agents, custom flows, AGENTS.md
project context, and MCP server connections [S46].

GitLab is significant because it demonstrates the platform direction for
agents: embed them where work already happens, give them repository/issue/MR/
pipeline/security context, and govern them through the existing DevSecOps
surface [S45][S46].

## Cost and production considerations

Framework selection affects operational costs. Graph runtimes and workflow
systems add engineering control but require more design. Role-based crews are
easy to prototype but can multiply model calls if every task delegates through
LLM agents. RAG-heavy frameworks control cost by narrowing context with
retrieval, indexes, and document pipelines. Production sources recommend model
routing, prompt caching, conversation compaction, per-request and per-tenant
budgets, circuit breakers, and observability from the first production user
[S47][S56].

The safer default is to start with the smallest runtime that exposes explicit
tool permissions, traceability, and evaluation hooks. Add multi-agent
coordination only when task specialization, organizational boundaries, or
parallelism justify the extra attack surface [S36][S38][S47].
