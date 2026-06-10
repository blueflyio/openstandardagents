# Open-Source Frameworks, Platforms, and Repositories

Research current as of 2026-06-10. Source keys refer to `reading-list.md`. GitHub metrics were checked on 2026-06-10.

## Repository maturity snapshot

| Project | Stars | License | Last push checked | Main purpose |
| --- | ---: | --- | --- | --- |
| microsoft/autogen | 58,834 | CC-BY-4.0 repo metadata | 2026-04-15 | Conversational/event-driven multi-agent framework [S30]. |
| crewAIInc/crewAI | 53,195 | MIT | 2026-06-10 | Role-based autonomous agent teams [S29]. |
| run-llama/llama_index | 50,058 | MIT | 2026-06-10 | Document agents, RAG, data and retrieval framework [S31]. |
| langchain-ai/langgraph | 34,340 | MIT | 2026-06-09 | Stateful graph workflows and resilient agents [S28]. |
| openai/openai-agents-python | 27,053 | MIT | 2026-06-09 | Lightweight multi-agent workflows with handoffs, guardrails, tracing [S27]. |
| a2aproject/A2A | 24,220 | Apache-2.0 | 2026-06-05 | Agent-to-agent protocol and specification [S18]. |
| ag-ui-protocol/ag-ui | 14,183 | MIT | 2026-06-10 | Agent-to-UI event protocol [S20]. |
| microsoft/agent-framework | 11,217 | MIT | 2026-06-10 | Python/.NET agent orchestration and deployment [S33]. |
| facebookresearch/ParlAI | 10,626 | MIT | 2023-11-03 | Dialogue model research framework [S32]. |
| agent-network-protocol/AgentNetworkProtocol | 1,319 | Apache-2.0 | 2026-06-08 | Agentic-web protocol stack [S21]. |
| langchain-ai/agent-protocol | 605 | MIT | 2026-06-07 | Agent serving API for runs, threads, store [S23]. |
| mondaycom/agent-tool-protocol | 98 | MIT | 2026-05-05 | Sandboxed code-execution protocol for tools/API aggregation [S26]. |

## OpenAI Agents SDK

The OpenAI Agents SDK is an MIT-licensed Python framework for building multi-agent workflows. Its repository describes it as lightweight, provider-agnostic, and compatible with OpenAI Responses/Chat Completions plus 100+ other LLMs through provider integrations and adapters [S27].

Core primitives:

- **Agents:** LLMs configured with instructions, tools, guardrails, and handoffs.
- **Handoffs:** delegation from one specialist agent to another.
- **Guardrails:** configurable input and output safety checks.
- **Tracing:** built-in tracking of runs, tool calls, generations, and handoffs [S27].

Best fit: teams already using OpenAI APIs or wanting a small, direct framework for tool use, routing, and multi-agent handoff without adopting a full graph engine.

Risk: tracing and model integrations can create provider-specific operational dependencies, so teams need explicit choices for tracing export, privacy, and non-OpenAI provider adapters [S27].

## LangGraph

LangGraph models agent workflows as explicit graphs with state. It is the most natural fit for production workflows that need branching, loops, persistence, human-in-the-loop checkpoints, durable state, and debuggability [S28], [S36].

Strengths:

- explicit nodes and edges;
- better control than free-form agent loops;
- durable and resumable workflows;
- natural integration with LangSmith and Agent Protocol;
- good fit for bounded, business-critical automations [S23], [S28], [S36].

Costs and trade-offs: LangGraph’s framework is open source, but production teams often adopt LangSmith or LangGraph Platform for observability and operations. Cost should be modeled as LLM usage plus observability/platform usage, not just package license [S36].

## CrewAI

CrewAI is a role-based multi-agent framework. It maps naturally to “crew” metaphors: specialized agents with roles, goals, tools, and sequential or hierarchical processes [S29], [S36].

Strengths:

- fast prototyping;
- intuitive mental model for business workflows;
- good for structured content, research, planning, and specialist collaboration;
- large community adoption with 53,195 stars on 2026-06-10 [S29].

Risks: role-based collaboration can hide token overhead and coordination loops. Production use needs termination conditions, cost limits, structured outputs, and human approvals for risky actions [S36].

## Microsoft AutoGen and Microsoft Agent Framework

AutoGen popularized conversational multi-agent workflows and has the largest star count in this snapshot. It is effective for research, code review, negotiation, and tasks where dialogue between agents is part of the solution [S30].

However, the ecosystem is shifting toward Microsoft Agent Framework as the production-oriented successor path for Python and .NET orchestration. Microsoft Agent Framework lists production-oriented patterns such as sequential, concurrent, handoff, and group collaboration, with an active repository and 11,217 stars on 2026-06-10 [S33].

Production caution: conversational frameworks need hard stop conditions, max-turn budgets, cost ceilings, and traceability. Without these controls, multi-agent dialogue can create runaway cost or non-terminating loops [S36].

## LlamaIndex

LlamaIndex remains the strongest fit when retrieval and data integration are the hard part. It started as a data/RAG framework and now positions itself around document agents and OCR/data workflows [S31].

Strengths:

- ingestion and indexing patterns;
- RAG pipelines;
- document Q&A;
- connectors to enterprise data;
- retrieval evaluation and query transformations [S31].

Use it when the product’s core value is grounded knowledge access rather than complex agent orchestration. For broad workflow orchestration, combine with LangGraph or a custom state machine rather than relying on retrieval abstractions alone.

## ParlAI

ParlAI is a Meta/Facebook Research dialogue platform for sharing, training, and testing dialogue models across datasets and tasks. It includes agents, worlds, teachers, multitasking, and crowdsourcing tools [S32].

It is relevant historically and academically, but it is not a leading 2026 production agent orchestration framework. Its last repository push in this snapshot was 2023-11-03, and its purpose is dialogue-model research rather than enterprise tool-using agents [S32].

## GitLab Duo Agent Platform

GitLab announced the general availability of GitLab Duo Agent Platform on 2026-01-15. It targets the software development lifecycle rather than generic agent research. The platform includes:

- **Foundational agents:** GitLab-maintained agents for common development tasks.
- **Custom agents:** team-defined agents created and shared through the AI Catalog.
- **External agents:** integrations such as Claude Code and OpenAI Codex CLI for code generation, code review, and analysis [S34], [S35].

The AI Catalog is important because it moves agents into governed organizational assets: create, publish, manage, share, version, and reuse agents and flows. GitLab also emphasizes model selection for privacy, security, and compliance needs [S34], [S35].

The platform demonstrates a key trend: agent capabilities are being embedded into existing enterprise systems where project context, CI/CD, security scanning, and approval workflows already live.

## OSSA and DUADP package analysis

### `@bluefly/openstandardagents`

Current stable npm release: 0.5.6, published 2026-06-03. The package describes OSSA as an open standard for defining, validating, discovering, and governing software agents. It includes JSON schemas for v0.5 manifests, OpenAPI contracts, validation utilities, CLI entrypoint, reference manifests, and `.well-known` discovery material [S04].

Notable package facts:

- Apache-2.0 license.
- 42 weekly downloads at time of fetch.
- 99 package files.
- Node.js 20+.
- 27 versions since first publication on 2025-11-19.
- npm warns that versions 0.5.3, 0.5.4, and 0.5.5 were accidentally published during recovery and should not be used [S04].

The package is a standards/contract tool, not an agent runtime. Its value is portability, validation, governance metadata, and exports.

### `@bluefly/duadp`

Current npm release: 0.1.7, published 2026-06-03. The package is the TypeScript SDK for DUADP. It provides core types, a client, server router, validation, crypto, DID resolution, conformance, and adapters [S02].

Notable package facts:

- Apache-2.0 license.
- 9 weekly downloads at time of fetch.
- 39 package files.
- 7 dependencies.
- 6 versions since first publication on 2026-03-06.
- Express peer dependency.
- Includes client/server examples and a reference node path [S02].

DUADP is earlier-stage than OSSA, but it is more operational: it defines HTTP surfaces for discovery, registry, GAID resolution, inspection, federation, and publishing [S01], [S02].

## Framework selection guidance

| Use case | Prefer | Why |
| --- | --- | --- |
| Production stateful workflow with branches, retries, HITL | LangGraph | Explicit graph/state model and observability ecosystem [S28], [S36]. |
| Fast role-based multi-agent prototype | CrewAI | Natural crew/role abstraction and large community [S29]. |
| Research or dialogue-heavy multi-agent exploration | AutoGen | Conversational agent coordination pattern [S30]. |
| New Microsoft/.NET/Python enterprise agent work | Microsoft Agent Framework | Current Microsoft direction for production orchestration [S33]. |
| RAG-heavy knowledge assistant | LlamaIndex | Retrieval/data stack is the core strength [S31]. |
| OpenAI-centered lightweight handoffs and guardrails | OpenAI Agents SDK | Small primitives and built-in tracing/guardrails [S27]. |
| Standards-first portable agent definitions | OSSA | Contract, validation, governance, exports [S03], [S04]. |
| Federated discovery of agents, skills, tools | DUADP | GAID/DID/WebFinger/gossip discovery and trust evidence [S01], [S02]. |

## Cost and reliability considerations

Framework licenses are usually not the main cost. Production cost comes from:

- model calls and token volume;
- number of reasoning steps;
- multi-agent conversations and retries;
- vector/database queries;
- observability/tracing platforms;
- hosted workflow execution;
- human review operations [S36].

47Billion’s production guidance recommends starting with simple workflows, adding tool-using agents only with guardrails, treating structured multi-agent deployments cautiously, and avoiding open-ended multi-agent autonomy on critical paths [S36]. The practical pattern is to set budgets per task, per agent, and per organization; instrument every run; validate structured outputs; and roll out progressively [S36].
