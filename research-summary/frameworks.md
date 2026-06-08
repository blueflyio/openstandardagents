# Open-source frameworks, repositories, and npm packages

_Last updated: June 8, 2026._

## BlueFly packages: OSSA and DUADP

| Package | Latest npm version | Published | License | Weekly downloads | Purpose |
|---|---:|---|---|---:|---|
| @bluefly/openstandardagents | 0.5.6 | June 3, 2026 | Apache-2.0 | npm page timed out; openstandardagents.org reports 42 | OSSA schemas, validator, CLI, portable agent contracts. [S02] [S06] |
| @bluefly/duadp | 0.1.7 | June 3, 2026 | Apache-2.0 | 9 | DUADP TypeScript SDK for decentralized discovery, publishing, validation, federation, GAID/DID inspection. [S07] |
| @mondaydotcomorg/atp-server | 0.25.0 | May 5, 2026 | MIT | 6.9K | ATP sandboxed code execution server with API aggregation, MCP/OpenAPI support, provenance, approvals, audit, and OTel. [S20] |

The checked-out repository identifies itself as @bluefly/openstandardagents v0.5.1, while the npm registry reports v0.5.6. This suggests the branch is behind the public npm package or intentionally pinned to an older release line. Any downstream report or docs should be explicit about which version it is describing. [S03] [S06]

@bluefly/openstandardagents exports schemas, validation, generation, migration, types, OpenAPI extensions, mesh, agent-card generation, SDK, version management, MCP server, marketplace skills catalog, kagent integration, trust services, and workspace validation in the local package. The npm v0.5.6 package exposes a smaller package surface centered on schemas, validation, well-known metadata, and the CLI. [S03] [S06]

@bluefly/duadp exposes `@bluefly/duadp`, `./client`, `./server`, `./validate`, `./crypto`, `./did`, `./conformance`, and `./fleet`. Its README defines a DUADP node as any HTTP server implementing discovery and API endpoints, and its server router can mount the protocol into an Express app. It supports Ed25519 signing, W3C DID resolution (`did:web`, `did:key`), conformance tests, and GAID inspection. [S07]

## Major framework comparison

| Project | Stars on June 8, 2026 | License | Latest release signal | Core primitives / strengths |
|---|---:|---|---|---|
| microsoft/autogen | 58,765 | CC-BY-4.0 | python-v0.7.5, Sep 30, 2025 | Historic multi-agent framework; now maintenance mode; Microsoft recommends Microsoft Agent Framework. [S24] [S37] |
| CrewAI | 53,045 | MIT | 1.14.6, May 28, 2026 | Agents, tasks, crews, flows; role-based collaboration plus production event-driven flows. [S23] [S37] |
| LlamaIndex | 49,991 | MIT | v0.14.22, May 14, 2026 | Data/RAG-first agents, workflows, document agents, parsing, extraction, indexing. [S25] [S37] |
| LangGraph | 34,146 | MIT | 1.2.4, Jun 2, 2026 | Graph-based stateful orchestration, durable execution, streaming, persistence, HITL. [S22] [S37] |
| OpenAI Agents SDK | 26,988 | MIT | v0.17.4, May 26, 2026 | Agents, handoffs, guardrails, tracing, tools, sessions, provider-agnostic 100+ LLM support. [S21] [S37] |
| AG-UI | 14,128 | MIT | release/2026-06-08 | Agent-user event protocol, UI state/event streams, frontend interoperability. [S16] [S37] |
| Microsoft Agent Framework | 11,110 | not recorded in command output | Build 2026/1.0 GA references | Production successor to AutoGen and Semantic Kernel; .NET/Python, MCP/A2A, workflows. [S24] [S37] |
| ANP | 1,317 | Apache-2.0 | V1.0, May 19, 2025 | DID identity, secure communication, meta-protocol negotiation, application protocol layer. [S17] [S37] |
| ACP | 1,011 | Apache-2.0 | v1.0.3, Aug 21, 2025 | REST-based multimodal messages, async/sync, streaming, sessions, framework-agnostic. [S19] [S37] |
| LangChain Agent Protocol | 604 | MIT | 0.0.16, May 28, 2026 | Runs, threads, store endpoints for production agent servers. [S18] [S37] |
| Monday ATP | 98 | MIT | npm 0.25.0, May 5, 2026 | Sandboxed code execution, API aggregation/search, MCP/OpenAPI compatibility. [S20] [S37] |

## OpenAI Agents SDK

OpenAI's Agents SDK is a lightweight framework for multi-agent workflows. Its GitHub README names agents, handoffs/agents-as-tools, guardrails, and tracing as core capabilities, with provider-agnostic support for OpenAI APIs and 100+ other LLMs. The SDK includes built-in tracing over agent runs, LLM generations, tool calls, handoffs, guardrails, and custom events. [S21]

The SDK's security story is improving but has boundaries. Documentation notes that input guardrails apply to the first agent in a chain and output guardrails to the final output, while tool guardrails are needed around each custom function-tool call in manager or handoff workflows. [S21]

## LangGraph

LangGraph is a low-level orchestration framework and runtime for long-running, stateful agents. It emphasizes durable execution, streaming, persistence, memory, human-in-the-loop control, and debugging through LangSmith. Its Graph API models workflows as nodes and edges with message-passing super-steps inspired by Pregel. [S22]

For production systems, LangGraph's explicit graph model makes state transitions and approval points auditable. Cornell's enterprise agent workshop also highlights explicit LangGraph state machines as a production pattern. [S08] [S22]

## CrewAI

CrewAI centers on role-based agents, tasks, crews, and flows. Crews optimize autonomous collaboration, while Flows provide deterministic, event-driven orchestration and state management for production systems. Its docs recommend Flows when teams need precise control over complex automations, conditional branches, and integration with external systems. [S23]

CrewAI's tool hooks provide a concrete pre-action control point: before_tool_call hooks can inspect/modify inputs, block tools, require human approval, validate parameters, and log invocations. That aligns with the broader security shift toward deterministic runtime authorization. [S23] [S31]

## AutoGen and Microsoft Agent Framework

AutoGen remains influential but is now in maintenance mode, with Microsoft recommending Microsoft Agent Framework for new projects. AutoGen's README says it will not receive new features or enhancements and will be community-managed with critical bug fixes/security patches. [S24]

Microsoft Agent Framework combines AutoGen and Semantic Kernel concepts into a production-grade .NET/Python framework with chat clients, tools, MCP integrations, context providers, middleware, multi-step workflows, checkpointing, streaming, human-in-the-loop, time travel, A2A, and durable hosting patterns. [S24]

## LlamaIndex

LlamaIndex is a data-centric framework for LLM applications, RAG, workflows, and document agents. Its docs describe agents as LLM-powered knowledge workers augmented by tools and workflows as event-driven systems combining agents, data connectors, and tools. LlamaIndex is especially strong for RAG, parsing, extraction, indexing, document understanding, and data-heavy agent workflows. [S25]

## GitLab Duo Agent Platform

GitLab Duo Agent Platform is generally available and integrates AI agents into the software delivery lifecycle. The GA announcement describes foundational agents, custom agents, and external agents. Foundational agents include Planner Agent and Security Analyst Agent. Custom agents are created and shared through the AI Catalog. External agents include Claude Code and OpenAI Codex. [S26]

GitLab's model reinforces the platform direction: agents are becoming governed catalog entries with versioning, enablement, access controls, and embedded provider integrations, rather than ad hoc scripts. [S26]

## Cost and maturity considerations

Framework selection should follow the risk and workflow shape. Simple bounded workflows can use deterministic orchestration plus LLM calls. Tool-using agents need output validation, cost limits, fallbacks, and tool authorization. Structured multi-agent systems need heavy guardrails, HITL checkpoints, progressive rollout, and observability. Open-ended multi-agent systems remain risky for critical paths. [S27]

Production cost controls should be designed before rollout. Reports and tools emphasize cost-per-task budgets, model routing, loop detection, spend caps, per-tenant/workflow attribution, and circuit breakers before execution rather than post-billing analysis. [S27] [S33]
