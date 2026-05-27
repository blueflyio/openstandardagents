# Open-Source Frameworks, Repositories, and Packages

Prepared on May 27, 2026. GitHub stars and npm metadata were collected during this run with read-only CLI queries and may change.

## Repository snapshot

| Project | Purpose | Stars | License | Latest release observed | Notes |
| --- | --- | ---: | --- | --- | --- |
| crewAIInc/crewAI | Role-based multi-agent automation with Crews and Flows | 52,277 | MIT | 1.14.5 | Strong community; Python; enterprise AMP suite [S21][S33] |
| microsoft/autogen | Multi-agent AI applications; now maintenance mode | 58,447 | CC-BY-4.0 docs / MIT code | python-v0.7.5 | Microsoft recommends Agent Framework for new work [S22][S33] |
| run-llama/llama_index | Context-augmented/RAG and agentic applications | 49,695 | MIT | v0.14.22 | Data connectors, indexing, RAG, workflows [S23][S33] |
| langchain-ai/langgraph | Stateful, long-running agent orchestration | 33,108 | MIT | 1.2.2 | Durable execution, HITL, memory, LangSmith [S20][S33] |
| openai/openai-agents-python | Provider-agnostic multi-agent workflows | 26,693 | MIT | v0.17.4 | Agents, tools, handoffs, guardrails, tracing [S19][S33] |
| openai/openai-agents-js | TypeScript Agents SDK | 3,129 | MIT | v0.11.5 | npm package `@openai/agents` 0.11.5 [S32][S33] |
| modelcontextprotocol/modelcontextprotocol | MCP spec and docs | 8,235 | Other/MIT assets vary | 2025-11-25 | Official MCP documentation/spec repo [S05][S33] |
| a2aproject/A2A | Agent2Agent protocol | 24,025 | Apache-2.0 | v1.0.0 | Open agent-to-agent communication [S06][S33] |
| ag-ui-protocol/ag-ui | Agent-user interaction protocol | 13,870 | MIT | release/2026-05-26 | Frontend event stream standard [S07][S33] |
| agent-network-protocol/AgentNetworkProtocol | ANP protocol docs | 1,304 | Apache-2.0 | V1.0 | DID/semantic web three-layer protocol [S08][S33] |
| langchain-ai/agent-protocol | Framework-agnostic production agent API | 594 | MIT | langchain-protocol 0.0.15 | Runs, threads, store, streaming [S09][S33] |
| mondaycom/agent-tool-protocol | Secure code-first tool protocol | 96 | MIT | none observed | ATP client/server packages [S11][S32][S33] |
| run-llama/llama-agents | Event-driven Llama Agents + workflows | 381 | MIT | llamactl 0.10.2 | Document-centric agent workflows [S33] |

## npm package snapshot

| Package | Version | Purpose | License | Size observed |
| --- | ---: | --- | --- | ---: |
| `@bluefly/openstandardagents` | 0.5.1 | OSSA CLI/SDK/schemas for portable agent manifests and exports | Apache-2.0 | 11.3 MB [S32] |
| `@bluefly/duadp` | 0.1.4 | TypeScript SDK for DUADP discovery, publishing, federation, DID/crypto, conformance | Apache-2.0 | 173 KB [S32] |
| `@modelcontextprotocol/sdk` | 1.29.0 | TypeScript MCP implementation | MIT | 4.3 MB [S32] |
| `@openai/agents` | 0.11.5 | TypeScript OpenAI Agents SDK | MIT | 19 KB [S32] |
| `@mondaydotcomorg/atp-client` | 0.24.0 | ATP client SDK | MIT | 904 KB [S32] |
| `@mondaydotcomorg/atp-server` | 0.25.0 | ATP server implementation | MIT | 6.3 MB [S32] |
| `@langchain/langgraph` | 1.3.2 | LangGraph.js stateful agent graphs | MIT | 3.6 MB [S32] |
| `langchain` | 1.4.2 | LangChain.js bindings | MIT | 2.9 MB [S32] |

## OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight framework for multi-agent workflows. The Python README says it is provider-agnostic, supports OpenAI Responses/Chat Completions and 100+ other LLMs, and has a JavaScript/TypeScript counterpart [S19].

Core primitives and capabilities include:

- Agents configured with instructions, tools, guardrails, and handoffs.
- Sandbox Agents for longer-horizon work in controlled filesystem/container environments.
- Agents as tools and handoffs for delegation.
- Tools, including functions, MCP, and hosted tools.
- Guardrails for input/output validation.
- Human-in-the-loop mechanisms.
- Sessions for automatic conversation history.
- Tracing for debugging and optimization.
- Realtime agents for voice [S19].

Strengths: official OpenAI ecosystem support, tracing and guardrails, handoff concepts, cross-provider support, and active releases. Risks: production security still depends on how tool permissions, sandboxing, and pre-action authorization are wired.

## LangGraph

LangGraph is a low-level orchestration framework for building, managing, and deploying long-running, stateful agents [S20]. Its documentation models workflows as graphs with three components:

- State: shared data structure and reducers.
- Nodes: functions that read state and return updates.
- Edges: routing logic, including conditional branches and parallel super-steps [S20].

The README highlights durable execution, human-in-the-loop interrupts, comprehensive memory, LangSmith debugging/observability, and deployment support [S20]. LangGraph's graph API is useful when agent behavior needs explicit state transitions, checkpointing, resumability, and branch/control clarity [S20].

Strengths: control, durability, graph transparency, production deployment ecosystem, and integration with LangChain/LangSmith. Tradeoff: steeper learning curve and more architectural choices than higher-level frameworks.

## CrewAI

CrewAI is a standalone Python framework for orchestrating role-playing autonomous agents [S21]. It is explicitly independent of LangChain and emphasizes speed, simplicity, low-level control, and enterprise automation [S21].

CrewAI has two major abstractions:

- Crews: role-based teams of autonomous agents with goals, backstories, collaboration, and dynamic task delegation [S21].
- Flows: event-driven production workflows with precise control, state management, conditional branching, and integration with normal Python code [S21].

The README also describes CrewAI AMP Suite with a control plane, tracing/observability, integrations, security/compliance, analytics, and cloud/on-prem deployment options [S21].

Strengths: approachable multi-agent role modeling, production workflows through Flows, and a large community. Tradeoff: like all high-level orchestration frameworks, it needs external policy, identity, tool authorization, and observability for high-risk production use.

## AutoGen and Microsoft Agent Framework direction

AutoGen remains historically important as a multi-agent conversation/orchestration framework, but the README now marks it as maintenance mode [S22]. Microsoft states that new users should start with Microsoft Agent Framework, which is positioned as the enterprise-ready successor with stable APIs, long-term support, multi-agent orchestration, multi-provider model support, and A2A/MCP interoperability [S22].

AutoGen's current architecture includes:

- Core API for message passing, event-driven agents, local/distributed runtime, and cross-language support.
- AgentChat API for opinionated rapid prototyping and common multi-agent patterns.
- Extensions API for LLM clients, tools, and code execution.
- AutoGen Studio for no-code prototyping, explicitly not production-ready without added authentication/security [S22].

Strengths: major community, research heritage, familiar conversation patterns. Tradeoff: new greenfield projects should evaluate Microsoft Agent Framework rather than assume AutoGen will receive new features [S22].

## LlamaIndex

LlamaIndex is a framework for context-augmented LLM applications and agents over data [S23]. Its docs define agents as LLM-powered knowledge assistants that use tools for tasks such as research and data extraction, and workflows as event-driven multi-step processes that combine agents, data connectors, and tools [S23].

LlamaIndex provides:

- Data connectors for APIs, PDFs, SQL, documents, and other sources.
- Data indexes and retrieval/query engines for RAG.
- Chat engines and agents that use tools.
- Observability and evaluation integrations.
- Workflows for event-driven systems and production microservices [S23].

Strengths: RAG, document understanding, connectors, indexing, and context augmentation. Tradeoff: for non-RAG orchestration, LangGraph/CrewAI/OpenAI Agents may be more natural; for data-heavy agents, LlamaIndex remains a core option.

## GitLab Duo Agent Platform

GitLab Duo Agent Platform is not an open-source framework in the same sense as LangGraph or CrewAI, but it is important as a production agent platform embedded in DevSecOps [S18]. GitLab announced general availability in the GitLab 18.8 release cycle [S18].

Capabilities include:

- Agentic Chat across GitLab Web UI and IDEs, with context from issues, merge requests, pipelines, security findings, and repositories [S18].
- Analyze, code, CI/CD, and security use cases [S18].
- Foundational agents such as Planner Agent and Security Analyst Agent [S18].
- Custom agents and flows built and shared through AI Catalog [S18].
- External agents integrated into GitLab, including Claude Code and Codex CLI [S18].
- MCP client support for systems such as Jira, Confluence, Slack, Playwright, and Grafana [S18].
- Model selection, self-hosted options, governance, visibility, and group-based access controls [S18].

This is a strong example of agentic AI moving from stand-alone developer tools into governed workflow platforms.

## OSSA and DUADP as ecosystem infrastructure

OSSA and DUADP are not general-purpose agent frameworks. Their value is ecosystem infrastructure:

- OSSA defines, validates, signs, diff-checks, and exports agent manifests [S02][S03].
- DUADP discovers and federates agents, skills, and tools, with DID identity, signatures, governance, and trust tiers [S01][S04].

For a team using LangGraph, CrewAI, OpenAI Agents, GitLab Duo, or a custom runtime, OSSA can provide the portable contract and DUADP can provide discovery/federation. This makes them complementary to frameworks rather than competitors.

## Cost and production considerations

The most credible production guidance is not "choose one framework." It is to map the framework to workflow risk:

- Use graph/state-machine patterns for auditable long-running flows.
- Use role-based crews where work naturally decomposes into specialist roles.
- Use RAG-first frameworks where data grounding is central.
- Use official SDKs where provider integration, tracing, guardrails, and handoffs matter.
- Add observability, cost caps, timeout limits, circuit breakers, and human approval before production [S24][S31].

Open-ended multi-agent systems remain the riskiest class. Structured workflows with explicit state, bounded tools, and policy gates are much closer to production readiness.
