# Frameworks, Repositories, and npm Packages

Research snapshot: June 2, 2026. Citation keys map to `reading-list.md`.

## Summary table

| Project | Purpose | Stars / package status | Strengths | Cautions |
|---|---|---:|---|---|
| `@bluefly/openstandardagents` / OSSA | Portable agent manifests and exports | npm latest v0.5.1; Apache-2.0 [T34] | Contract layer, schemas, CLI, MCP server, exports, trust metadata | Early-stage adoption; governance claims need deployment validation |
| `@bluefly/duadp` / DUADP | Federated agent discovery | npm latest v0.1.4; Apache-2.0 [T35] | DNS/WebFinger/DID discovery, gossip, trust tiers, MCP tools | Early spec; needs wider federation |
| OpenAI Agents SDK | Lightweight multi-agent workflows | 26.8K stars; MIT; latest v0.17.4 [T16] | Agents, handoffs, tools, guardrails, sessions, tracing, 100+ LLMs | Strong OpenAI ecosystem bias despite provider agnosticism |
| LangGraph | Stateful long-running agent orchestration | 33.5K stars; MIT [T17] | Durable execution, memory, human-in-loop, checkpoints, observability | Low-level; more verbose than task-first frameworks |
| CrewAI | Multi-agent crews and flows | 52.6K stars; MIT [T21] | Role-based crews, event-driven flows, production architecture | Agent memory/custom behavior can need careful design |
| AutoGen | Conversational multi-agent orchestration | 56.9K stars; maintenance mode [T22] | Pioneered multi-agent conversations, Studio, benchmarks | Microsoft recommends new projects use Microsoft Agent Framework |
| Microsoft Agent Framework | Unified successor to AutoGen/Semantic Kernel | Microsoft Learn docs [T22] | Graph workflows, sessions, type safety, telemetry, .NET/Python | Newer; migration work for AutoGen users |
| LlamaIndex | Data/RAG/document-agent framework | 49.8K stars; MIT [T23] | Connectors, indexing, RAG, AgentWorkflow, document agents | Best when retrieval/document processing is central |
| Parlant | Conversational behavior governance | 18.1K stars; Apache-2.0 [T24] | Guidelines, context engineering, auditable behavior control | Not a full orchestration replacement |
| GitLab Duo Agent Platform | DevSecOps agent platform | GA announcement [T27] | Agentic chat, planner/security agents, custom catalog, external Claude/Codex agents, MCP client | Commercial platform; credit and model controls matter |
| AG-UI | Agent-to-frontend protocol implementation | 13.9K stars; MIT [T07] | UI events, streaming, state sync, SDKs | Protocol rather than end-to-end agent framework |
| A2A | Agent-to-agent protocol implementation | 24K stars; Apache-2.0 [T08] | Agent Cards, SDKs, Linux Foundation governance | Interop standard, not full runtime |
| Agent Tool Protocol | Code-first tool execution | 98 stars; emerging [T26] | V8 sandbox, OpenAPI/MCP aggregation, parallel code execution | Early and security-sensitive |

## OSSA and DUADP packages

The local repository and npm metadata show `@bluefly/openstandardagents` as the main OSSA package. It is a TypeScript/Node package with CLI bins `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, and `ossa-mcp` [T34]. It exports schemas, validation, generation, migration, type definitions, OpenAPI extensions, mesh services, agent-card generation, SDK entrypoints, version management, marketplace catalog data, kagent adapters, trust services, and workspace validation [T34].

OSSA's README is explicit about positioning: it is not MCP/A2A and not a framework, but an infrastructure bridge that translates agent definitions into platform-specific deployments [T33]. It says OSSA consumes MCP, builds on A2A, and adds deployment and packaging layers on top of communication protocols [T33]. The current local README highlights v0.5.1 additions such as execution economics, StateMesh integration, active operational memory, AI SDK v6 tool loops, reasoning escrow, DUADP trust tiers, CLI economics commands, and cognition extensions [T33].

`@bluefly/duadp` is the TypeScript SDK for the Decentralized Universal AI Discovery Protocol [T35]. Its npm metadata shows latest v0.1.4, CLI bin `duadp`, exports for client, server, validate, crypto, DID, and conformance modules, and dependencies centered on AJV schema validation, canonicalization, YAML, and DID resolution [T35]. The package repository path is `sdk/typescript` in the GitLab DUADP repo [T35].

Together, the npm packages implement a layered story:

- OSSA defines signed, policy-bearing, exportable agent contracts.
- DUADP discovers and verifies agents, skills, and tools across a federated mesh.
- MCP/A2A/AG-UI then provide tool, agent, and UI transport boundaries.

## OpenAI Agents SDK

OpenAI's Agents SDK is described as a lightweight framework for multi-agent workflows and is provider-agnostic across OpenAI Responses, Chat Completions, and 100+ other LLMs [T16]. Its README lists agents, sandbox agents, handoffs/agents-as-tools, tools including MCP and hosted tools, guardrails, human-in-the-loop, sessions, tracing, and realtime agents [T16].

OpenAI's March 2025 announcement presents the SDK as part of a broader agent-building release alongside Responses API, built-in web/file/computer-use tools, and integrated observability [T16]. It identifies four primitives: Agents, Handoffs, Guardrails, and Tracing/Observability [T16].

Best fit: teams already using OpenAI APIs who need a minimal, well-supported orchestration layer with built-in tracing and safety hooks.

## LangGraph

LangGraph is a low-level orchestration framework for building, managing, and deploying long-running, stateful agents [T17]. The project emphasizes durable execution, human-in-the-loop, comprehensive memory, debugging with LangSmith, and production deployment [T17].

LangGraph's durable execution docs explain that graph state can be checkpointed at every step. This enables human-in-the-loop workflows, memory, time-travel debugging, and fault-tolerant execution [T17]. It supports durability modes that trade off consistency and overhead: exit, async, and sync [T17].

Best fit: workflows that need explicit state machines, long-running execution, pause/resume, checkpointing, or human approvals. It is a runtime foundation rather than a high-level prompt abstraction.

## CrewAI

CrewAI is a Python framework for orchestrating autonomous agents using two main building blocks: Crews and Flows [T21]. The repository describes CrewAI as standalone, independent of LangChain, and optimized for speed, flexibility, and control [T21]. Crews provide role-playing autonomous collaboration; Flows provide event-driven state, execution control, and production architecture [T21].

CrewAI's docs recommend a flow-first mindset in production: wrap agents/crews in a Flow to define state schema, methods, routing, validation, and execution control [T21]. The docs recommend task guardrails, structured outputs, explicit state passing, async execution for long-running work, and persistence for crash recovery or human input [T21].

Best fit: structured multi-step tasks where role specialization helps, but the workflow should remain bounded and understandable.

## AutoGen and Microsoft Agent Framework

AutoGen remains historically important because it popularized conversational multi-agent orchestration [T22]. Its repo still has a large community, but Microsoft marks it as maintenance mode and recommends new projects use Microsoft Agent Framework [T22].

Microsoft's announcement says AutoGen and Semantic Kernel are merging into Microsoft Agent Framework. The new framework combines AutoGen's agent abstractions with Semantic Kernel's enterprise features, including session-based state management, type safety, middleware, telemetry, model support, and graph-based workflows [T22].

Best fit: existing AutoGen users can continue with maintenance and migration guidance. New Microsoft-stack projects should evaluate Microsoft Agent Framework first.

## LlamaIndex

LlamaIndex is an open-source data framework for LLM apps and agentic applications [T23]. It provides connectors for data ingestion, structures data as indices/graphs, exposes retrieval/query interfaces, and supports outer app integrations [T23].

For agents, LlamaIndex provides AgentWorkflow, FunctionAgent, ReActAgent, and multi-agent patterns such as built-in handoffs, orchestrator agents, and custom planners [T23]. Its cloud/product layer emphasizes document agents, OCR, parsing, extraction, indexing, and RAG [T23].

Best fit: RAG-heavy and document-heavy agents where retrieval quality, parsing, indexing, and structured extraction are central.

## Parlant

Parlant is an agentic harness focused on behavior governance for conversational agents [T24]. Its core primitive is the guideline: a condition-action behavioral rule that is dynamically matched to the current conversation context [T24]. Parlant positions itself as a context-engineering layer that loads only relevant rules, data, and tools at each turn [T24].

Parlant does not replace workflow frameworks like LangGraph, Agno, or LlamaIndex. It handles conversational governance while another framework can handle workflow automation and retrieval [T24].

Best fit: customer-facing agents where business rules, consistency, explainability, and rapid behavior changes matter.

## GitLab Duo Agent Platform

GitLab announced general availability for Duo Agent Platform as an agentic AI layer across the software development lifecycle [T27]. GitLab's argument is that code writing is only about 20% of a developer's time, so improving code generation alone creates new bottlenecks in planning, review, security, compliance, CI/CD, and downstream fixes [T27].

The platform includes:

- Agentic Chat across web UI and IDEs, using context from issues, merge requests, pipelines, security findings, and repositories [T27].
- Foundational agents such as Planner Agent and Security Analyst Agent [T27].
- Custom agents through an AI Catalog where teams create, publish, manage, and share agents and flows [T27].
- External agents such as Claude Code and OpenAI Codex CLI integrated into GitLab workflows [T27].
- Flows such as issue-to-MR, convert to GitLab CI/CD, fix CI/CD pipeline, code review, and IDE software development [T27].
- MCP Client support for Jira, Confluence, Slack, Playwright, Grafana, and other MCP-compatible tools, with group-level controls and approval flow [T27].
- Model selection across OpenAI GPT-5 variants, Mistral, Meta Llama, Anthropic Claude, and self-hosted options for some deployments [T27].

Best fit: teams wanting governed DevSecOps agents inside GitLab, with central controls, model selection, and workflow automation.

## Cost and production considerations

47Billion's production report gives useful cost bands: simple workflows at roughly $0.10-$0.50 per task, CrewAI multi-agent tasks at $0.50-$2.00, AutoGen multi-agent tasks at $2.00-$5.00, and LlamaIndex RAG tasks at $0.20-$1.00 [T19]. These are blog-reported ranges rather than universal benchmarks, but they capture a real dynamic: multi-agent context sharing can multiply token cost rather than add a small fixed overhead [T19].

The production-readiness conclusion is conservative:

- Simple workflows: yes, with error handling, validation, and monitoring.
- Tool-using agents: yes, with guardrails, output validation, cost limits, and fallbacks.
- Structured multi-agent systems: cautiously yes, with heavy guardrails, human-in-the-loop checkpoints, and progressive rollout.
- Open-ended multi-agent systems: not yet reliable enough for critical paths [T19].

## Framework selection heuristics

1. Use OSSA when the agent needs a portable manifest, governance metadata, conformance checks, export targets, or signed identity.
2. Use DUADP when agents, skills, or tools need to be discovered and verified across domains.
3. Use OpenAI Agents SDK for lightweight agent/handoff/guardrail/tracing workflows in Python.
4. Use LangGraph when durable execution, long-running state, explicit control flow, or human-in-loop resume is mandatory.
5. Use CrewAI when role-based crews and production flows fit the workflow.
6. Use LlamaIndex when retrieval and document handling dominate.
7. Use Parlant when behavior governance is the hardest problem.
8. Use GitLab Duo Agent Platform when the agent's home is the SDLC and the organization wants platform-level governance rather than a standalone framework.
