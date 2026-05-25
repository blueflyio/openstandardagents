# Open-source frameworks, repositories, and platforms

Compiled on 2026-05-25.

## Bluefly packages

| Package | Latest | Published / modified | Purpose | Notable exports |
| --- | --- | --- | --- | --- |
| `@bluefly/openstandardagents` | 0.5.1 | npm modified 2026-03-28 | OSSA CLI/SDK for portable agent manifests | schema, validation, generation, migration, mesh, agent-card, trust, MCP server |
| `@bluefly/duadp` | 0.1.4 | npm modified 2026-03-09 | DUADP TypeScript SDK for discovery/federation | client, server, validate, crypto, did, conformance |

`@bluefly/openstandardagents` is the implementation package for OSSA. Its npm metadata describes it as an "infrastructure bridge between agent protocols (MCP, A2A) and deployment platforms" with YAML manifests that export to Docker, Kubernetes, LangChain, CrewAI, Claude Skills, and other platforms [S3]. The local package also includes dependencies for MCP, OpenAI Agents, LangChain, CrewAI, Temporal, Cedar, DIDs, telemetry, and AI SDK providers, reflecting its role as a bridge rather than a single-agent runtime [S3][S6].

`@bluefly/duadp` is the implementation package for DUADP. Its README says any HTTP server implementing the standard discovery and registry endpoints can become a DUADP node, and the SDK includes Express server routing, typed clients, validation, signing, DID resolution, and conformance tests [S4][S5].

## Major open-source frameworks

| Project | Stars from 2026-05-25 search | License | Main strengths | Maturity signal |
| --- | ---: | --- | --- | --- |
| OpenAI Agents SDK Python | 26.6k | MIT | Agents, handoffs, guardrails, tracing, 100+ LLMs | Latest release 2026-05-19; active |
| OpenAI Agents SDK JS/TS | 3.1k | MIT | JS/TS multi-agent workflows, guardrails, tracing | Latest release 2026-05-22; active |
| LangGraph | 32.9k | MIT | Stateful graph orchestration, durable execution, HITL, memory | 500+ releases; active |
| CrewAI | 52.0k | MIT | Role-based crews plus production Flows | 190+ releases; active |
| Microsoft AutoGen | 56.7k-58.3k | CC-BY-4.0 in metadata | Multi-agent chat, event-driven core, distributed runtime | Maintenance mode; new work moves to Microsoft Agent Framework |
| LlamaIndex | 49.4k | MIT | RAG/data framework, tools, workflows, document agents | 400+ releases; active |
| ANP spec | 1.3k | Apache-2.0 in metadata | Agent network identity/negotiation/application layers | V1.0 release; active |
| Agent Protocol | 1.5k | MIT | Common REST/OpenAPI interface for agents | Older but influential |
| monday ATP | 94 | Not captured in search summary | Sandboxed code-first tool protocol | New, small community |

## OpenAI Agents SDK

OpenAI's Agents SDK is a lightweight framework for multi-agent workflows. The Python SDK is provider-agnostic, supports OpenAI Responses and Chat Completions plus 100+ other LLMs, and centers on agents, handoffs, guardrails, tools, and tracing [S35]. Handoffs delegate control to specialized agents; guardrails validate inputs and outputs; tracing records LLM generations, tool calls, handoffs, guardrails, and custom events [S35].

The JavaScript/TypeScript SDK provides equivalent concepts for JS/TS applications, with active releases in May 2026 [S35]. OSSA v0.4.5 added an `openai-agents-sdk` export target for runnable `@openai/agents` TypeScript packages with handoffs, guardrails, and an MCP bridge [S6].

## LangGraph

LangGraph is a low-level orchestration framework for long-running, stateful agents. It is built around graphs, durable execution, checkpointing/resume, streaming, human-in-the-loop interrupts, and short-/long-term memory [S36]. It is intentionally lower-level than prompt or agent abstractions; the docs say it is inspired by Pregel, Apache Beam, and NetworkX and can be used without LangChain [S36].

LangGraph is a strong fit when reliability depends on explicit state machines, resumable workflows, auditability, and human approval points. Its Agent Protocol integration makes it a useful bridge between framework-native graphs and standard run/thread/store APIs [S28][S29][S36].

## CrewAI

CrewAI is a Python framework for orchestrating role-playing autonomous agents [S37]. It distinguishes "Crews" for autonomous role-based collaboration from "Flows" for event-driven, stateful production orchestration with conditional logic, branching, and integration with production Python code [S37].

CrewAI's appeal is speed and structure for multi-agent collaboration: role definitions, goals, tasks, manager/worker patterns, and YAML configuration are accessible for teams prototyping collaborative workflows. Production use should prefer Flows or other explicit workflow controls when conditional logic, state, approvals, or compliance are required [S37][S46].

## Microsoft AutoGen

AutoGen is a multi-agent framework for applications that can act autonomously or work alongside humans [S38]. Its newer architecture introduced an event-driven Core API with asynchronous message passing, local and distributed runtimes, cross-language support, AgentChat for rapid multi-agent patterns, and extension APIs for model clients and tools [S38].

Search metadata and the repository README indicate AutoGen is now in maintenance mode, receiving bug fixes and critical security patches, with new projects directed to Microsoft Agent Framework [S38]. Existing deployments can continue, but new work should account for that migration path.

## LlamaIndex

LlamaIndex is an open-source framework for context-aware AI agents and RAG/data applications [S39]. It provides document indexing, parsing, retrieval, query engines, tool abstractions, and workflows. Tools such as `FunctionTool` and `QueryEngineTool` expose functions and query engines to agents, while Workflows support routing, parallel execution, loops, RAG + reranking, corrective RAG, function-calling agents, and query planning [S39].

LlamaIndex is strongest when agent quality depends on proprietary or document-heavy context. It pairs naturally with protocols like MCP and contract layers like OSSA when the RAG agent must be exposed, governed, or deployed across platforms.

## GitLab Duo Agent Platform

GitLab Duo Agent Platform reached general availability in GitLab 18.8, bringing agentic AI orchestration across planning, building, securing, and shipping software [S40][S41]. The platform includes foundational agents such as Planner, Security Analyst, and Data Analyst; an AI Catalog for custom agents and flows; and external agent integrations such as Anthropic Claude Code and OpenAI Codex [S40-S42].

GitLab emphasizes governance controls, usage visibility, model selection, and self-hosted/offline options for regulated environments [S41]. It also uses GitLab-managed credentials for external agents at GA to reduce customer API-key management and rotation burden [S42].

## Parlay / Paracle note

The instruction named "Parlay"; current search did not identify a mature, widely adopted Parlay multi-agent framework. The closest result was `sh4shv4t/Parlay`, a new OpenEnv-compliant reinforcement-learning negotiation environment with 0 stars in the search metadata, not a general production agent framework [S45]. A separate project, Paracle, describes itself as a production-ready multi-agent framework with provider support and A2A, but search metadata showed 0 stars and limited maturity [S45].

## Cost and operations considerations

47Billion's production guidance recommends starting with simple workflows, then tool-using agents with guardrails, and only then structured multi-agent systems. It warns not to start with open-ended multi-agent systems, not to skip cost monitoring, and not to build custom integration code when standards such as MCP, A2A, and AG-UI already fit the problem [S46].

Common cost drivers across frameworks are model calls, tool-call fan-out, retries, long-running state, context-window growth, and unbounded multi-agent loops. Recommended controls are token/spend budgets, scoped tool exposure, caching, progressive rollout, evaluation gates, and per-tool observability [S2][S46][S55].
