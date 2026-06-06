# Open-Source Frameworks, Projects, and npm Packages

Date of research: 2026-06-06.

## Package focus: Bluefly OSSA and DUADP

| Package | Latest npm version found | Purpose | Key exports/capabilities |
| --- | --- | --- | --- |
| `@bluefly/openstandardagents` | 0.5.6, published 2026-06-03 | OSSA schemas, validator, CLI, reference contracts | `ossa` CLI, v0.5 schemas, validation utilities, invocation/compliance OpenAPI contracts, well-known discovery document. [S44] |
| `@bluefly/duadp` | 0.1.7, published 2026-06-03 | DUADP TypeScript SDK for decentralized agent discovery | Typed client, Express router, manifest validation, Ed25519 signing, DID resolution, conformance tests, GAID inspection. [S43] |
| `@openai/agents` | Fetched npm page, current details not version-pinned in search result | OpenAI Agents SDK for JS/TS | Agents, sandbox agents, agents-as-tools/handoffs, tools, guardrails, HITL, sessions, tracing, realtime agents. [S22] |
| `@mondaydotcomorg/atp-server` | Registry result showed ATP server package with 7.1K weekly downloads | Agent Tool Protocol server | Sandboxed execution, OpenAPI/MCP aggregation, semantic search, state management, runtime APIs, observability. [S34] |

The local repository is `@bluefly/openstandardagents`; its checked-out `package.json` reports 0.5.1. The public npm package is newer at 0.5.6. This matters for any downstream install instructions: research users should install the latest stable npm package, while branch maintainers should reconcile local version metadata separately if release work is intended. [S44]

## Framework/project snapshot

Star counts below are the current counts returned by the web retrieval tools during this run. They should be treated as point-in-time signals, not stable facts.

| Project | Stars found | Primary purpose | Maturity signal |
| --- | ---: | --- | --- |
| Microsoft AutoGen | 58,726 | Programming framework for agentic AI | Very large community; MIT/CC-BY licensing mix in fetched metadata. [S38] |
| CrewAI | 52,918 | Role-playing autonomous agent orchestration | Large community; production-oriented multi-agent workflows. [S37] |
| LlamaIndex | 49,947 | Document agent and OCR/RAG platform | Strong RAG/document-agent ecosystem. [S39] |
| LangGraph | 34,021 | Resilient graph/state-machine agents | Strong durability/checkpointing model and LangChain ecosystem. [S23] |
| OpenAI Agents Python | 26,945 | Lightweight multi-agent workflows | Official OpenAI SDK with agents, handoffs, guardrails, tracing. [S35] |
| A2A | 24,152 | Open agent-to-agent protocol repo | Major protocol repo with Google origin and broad support. [S36] |
| Microsoft Agent Framework | about 11,000 in search results | Production-grade Python/.NET agents and workflows | Cross-language, graph workflows, HITL, hosting patterns. [S40] |
| OpenAI Agents JS | 3,152 | JS/TS multi-agent and voice workflows | npm package `@openai/agents`, MIT license. [S22] |
| Agent Network Protocol | 1,316 | Decentralized agent network protocol | DID/JSON-LD identity/discovery focus. [S07] |
| LangChain Agent Protocol | 603 | Framework-agnostic agent API | Runs/threads/store contract. [S08] |
| Monday ATP | 94 | Code-first tool protocol | New project; npm server package has notable weekly downloads. [S34] |

## OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight framework for agentic applications. The Python documentation describes a small primitive set: agents, agents as tools/handoffs, guardrails, and tracing. It also includes sessions, MCP server tool calling, function tools, sandbox agents, human-in-the-loop, and realtime agents. [S35]

The JavaScript/TypeScript SDK (`@openai/agents`) adds Node/Deno/Bun support and similar primitives: agents, sandbox agents, tools, handoffs, guardrails, HITL, sessions, tracing, and realtime agents. Secondary reviews report support for 100+ LLMs through Chat Completions-compatible APIs, but the strongest primary evidence in this report is the npm/repository documentation's provider-agnostic claim. [S22]

## LangGraph

LangGraph models agent workflows as graphs made of nodes and edges. Its runtime is inspired by Google's Pregel model and runs in discrete super-steps, enabling parallel node execution, checkpoints at super-step boundaries, durable state, fault-tolerant resume, human interrupts, time travel, and conversational memory. [S23] [S24]

LangGraph is especially relevant for production because it makes agent control flow explicit. This aligns with security guidance from Cornell and ACM: make workflows inspectable, checkpointable, interruptible, and reviewable rather than leaving all control flow inside free-form model reasoning. [S09] [S32]

## CrewAI

CrewAI is a framework for orchestrating role-playing autonomous agents that collaborate on tasks. Its core appeal is ergonomic multi-agent orchestration with roles, crews, tasks, and process definitions. In production comparisons, CrewAI is typically positioned as useful for structured content generation, research, operations, and team-like workflows, but needing guardrails, HITL, monitoring, and cost controls before critical-path deployment. [S37] [S27]

## AutoGen and Microsoft Agent Framework

Microsoft AutoGen remains one of the largest open-source agentic AI repositories. It is broadly described as a programming framework for agentic AI. [S38]

Microsoft Agent Framework is a newer production-oriented framework for Python and .NET. Search results describe it as supporting graph-based workflows, sequential/concurrent/handoff/group collaboration patterns, checkpointing, streaming, human-in-the-loop, time travel, local/cloud hosting, A2A, durable agents, and durable workflows. [S40]

## LlamaIndex

LlamaIndex is positioned as a document agent and OCR/RAG platform. It is important in the agent ecosystem because many production agents depend on retrieval, document understanding, structured context, and grounded answer generation. Agent security guidance repeatedly points to RAG quality and provenance as a way to reduce hallucinated action chains. [S39] [S09]

## GitLab Duo Agent Platform

GitLab announced general availability of GitLab Duo Agent Platform on 2026-01-15. It is not a generic open-source framework; it is a managed GitLab platform for orchestrating agentic AI across the software delivery lifecycle. It includes foundational agents, custom agents, and external agents. [S41]

Foundational agents at GA included:

- Planner Agent for structuring, prioritizing, and breaking down work in GitLab.
- Security Analyst Agent for vulnerability review and triage. [S41]

Custom agents are created and shared through GitLab's AI Catalog. External agents include Claude Code from Anthropic and Codex CLI from OpenAI, integrated into GitLab with managed credentials and embedded subscriptions. This positions GitLab Duo Agent Platform as a lifecycle/governance surface rather than a low-level agent framework. [S41]

## DUADP and OSSA repositories

The DUADP repository and package position DUADP as the discovery layer and OSSA as the identity/contract layer. DUADP provides federated DNS/WebFinger discovery, cross-node gossip, policy-aware routing, trust-tier gating, and MCP tooling. OSSA provides portable manifest schemas, validation, and export surfaces. [S05] [S06] [S43] [S44]

In the broader ecosystem, these projects address problems that frameworks usually leave outside the runtime:

- Frameworks answer: how do I run the agent?
- Protocols answer: how does it communicate?
- OSSA answers: how is it described, validated, governed, and moved?
- DUADP answers: how is it discovered, resolved, verified, and federated?

## Parlay limitation

The request named "Parlay" alongside CrewAI, AutoGen, and LlamaIndex. Current web searches did not identify a clearly maintained, mainstream open-source production agent framework named Parlay comparable to those projects. Results primarily pointed to research environments for strategic negotiation or unrelated projects. Because a reliable primary source was not available in this run, Parlay is not included in the framework table beyond this limitation note.

## Cost and production considerations

Production engineering blogs converge on the following framework-agnostic concerns:

- Track cost per task, model, workflow, and agent, with alerts for loops or budget overruns. [S27] [S29]
- Use smaller or cheaper models for routine subtasks and reserve expensive models for complexity. [S29]
- Add output validation and schema enforcement before critical actions. [S27]
- Start with deterministic workflows, then structured multi-agent systems, and avoid open-ended multi-agent behavior for critical paths. [S27]
- Add tracing across model calls, tool calls, agent hops, and user-visible outputs. [S27] [S29]

## Framework selection guide

| Use case | Strong candidates | Notes |
| --- | --- | --- |
| Durable state-machine agents | LangGraph, Microsoft Agent Framework | Best fit when explicit control flow, checkpoints, and HITL are central. |
| Rapid multi-agent role workflows | CrewAI, AutoGen | Add deterministic authorization and audit before production side effects. |
| OpenAI-centered app workflows | OpenAI Agents SDK | Lightweight primitives; built-in guardrails/tracing/handoffs. |
| RAG/document agents | LlamaIndex, LangGraph | Grounding and provenance are more important than agent count. |
| GitLab SDLC automation | GitLab Duo Agent Platform | Managed platform with foundational/custom/external agents. |
| Portable manifests and exports | OSSA | Use with frameworks rather than instead of them. |
| Federated discovery | DUADP, ANP | Use when registries or agents must discover each other across boundaries. |
