# Open-source frameworks, repositories, and platforms

Prepared on 2026-06-05. GitHub metadata was collected with `gh repo view` on 2026-06-05 unless otherwise noted. Citation keys resolve in [reading-list.md](./reading-list.md).

## High-level comparison

| Project | Stars | License | Latest release / status | Primary fit |
| --- | ---: | --- | --- | --- |
| Microsoft AutoGen | 58,707 | CC-BY-4.0 | Maintenance mode; latest Python release 2025-09-30 | Research-style multi-agent conversations; migrate new work to Microsoft Agent Framework [S31] |
| CrewAI | 52,878 | MIT | 1.14.6, 2026-05-28 | Role-based multi-agent crews and production flows [S30] |
| LlamaIndex | 49,930 | MIT | 0.14.22, 2026-05-14 | RAG-first agents, document workflows, data-grounded apps [S32], [S33] |
| LangGraph | 33,957 | MIT | 1.2.4, 2026-06-02 | Durable stateful workflows, long-running agents, HITL [S28], [S29] |
| OpenAI Agents SDK | 26,935 | MIT | 0.17.4, 2026-05-26 | Lightweight multi-agent workflows, handoffs, guardrails, tracing [S26], [S27] |
| A2A protocol repo | 24,141 | Apache-2.0 | 1.0.1, 2026-05-28 | Agent-to-agent interoperability, not an agent framework [S09] |
| AG-UI | 14,043 | MIT | Release 2026-06-05 | Agent-to-frontend event protocol, not an agent framework [S10], [S11] |
| ANP | 1,316 | Apache-2.0 | Active, no release metadata from query | Agent network identity/negotiation protocol [S12] |
| LangChain Agent Protocol | 601 | MIT | Active, no release metadata from query | Framework-agnostic agent serving API [S13], [S14] |
| Monday ATP | 98 | MIT | Early active repo | Code-first tool/API execution protocol [S17] |

## OSSA and DUADP npm packages

`@bluefly/openstandardagents` is the package form of OSSA. The npm package is version 0.5.6, Apache-2.0, published 2026-06-03, and exposes the `ossa` CLI [S02]. It contains JSON Schemas for OSSA v0.5 manifests, validation utilities, reference OpenAPI contracts, well-known discovery documents, reference manifests, and package exports for validation, generation, migration, agent-card generation, trust, mesh, SDK, and related services [S02].

The package description is important: OSSA is an open standard for defining, validating, discovering, and governing software agents. It is explicitly not a runtime, orchestration engine, MCP server implementation, deployment controller, Drupal module, GitLab automation, or policy decision point [S02]. That boundary is healthy. OSSA should be the machine-readable contract consumed by those systems, not the system that executes every agent.

`@bluefly/duadp` is the package form of DUADP. The registry reports version 0.1.7, Apache-2.0, published 2026-06-03, with the `duadp` CLI and dependencies for AJV validation, canonicalization, DID resolution, and YAML parsing [S04]. The DUADP website describes the package as TypeScript-first with type definitions and a self-hostable node model [S03].

The strongest local interpretation is: OSSA is the agent manifest and governance package; DUADP is the discovery, registry, federation, and trust-resolution package [S01], [S03], [S05]. Together they are infrastructure for multi-runtime agent portability rather than yet another agent loop framework.

## OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight framework for building multi-agent workflows. Its repo describes four central implementation primitives: agents configured with instructions, tools, guardrails, and handoffs; tools and agents-as-tools; handoffs for delegation; guardrails for configurable input/output checks; and tracing for viewing, debugging, and optimizing runs [S26], [S27].

The SDK is provider-agnostic. It supports OpenAI APIs and 100+ other LLMs through provider mappings and third-party adapters such as LiteLLM and Any-LLM [S26]. Built-in tracing records LLM generations, tool calls, handoffs, guardrails, and custom events, with spans around runner calls, agent execution, function tools, guardrails, and handoffs [S27].

Best fit: teams building code-first agent workflows that want a small SDK with native OpenAI support, handoffs, guardrails, and tracing. It is less opinionated than LangGraph and CrewAI, but still provides production-relevant primitives.

## LangGraph

LangGraph is the strongest framework for explicit stateful orchestration. Its docs call it a low-level orchestration framework and runtime for building, managing, and deploying long-running, stateful agents [S28]. The core capabilities are durable execution, streaming, persistence, human-in-the-loop, short-term and long-term memory, and debugging via LangSmith [S28].

LangGraph models workflows as graphs with nodes, edges, and shared state. Execution proceeds in Pregel-inspired super-steps; checkpoints at super-step boundaries enable replay, time travel, recovery, and human intervention [S28]. The design encourages small nodes because checkpoint granularity controls how much work must be repeated after a failure [S28].

Best fit: enterprise agents where reliability, explicit state, resumability, HITL approvals, and introspection matter more than quick role-playing abstractions. Cornell's enterprise workshop specifically uses explicit LangGraph state machines as a pattern for production-grade agents [S19].

## CrewAI

CrewAI is a role-based multi-agent framework. Its repo describes two main surfaces: Crews and Flows [S30]. Crews are teams of autonomous agents with roles, goals, tasks, and collaboration patterns. Flows are production-ready, event-driven workflows with state management, conditional branching, and precise orchestration [S30].

CrewAI's strength is usability for multi-agent prototypes and structured team-like workflows. It maps naturally to content, research, analysis, sales, and operations pipelines where each agent can be assigned a role and task. The addition of Flows addresses a production need: role-based autonomy alone is often too loose for auditability, so deterministic flow control is needed around agent steps [S30], [S36].

Best fit: teams that want quick multi-agent composition with clear roles, but should use Flows, tool allowlists, cost limits, and HITL gates before production [S30], [S36].

## AutoGen and Microsoft Agent Framework direction

AutoGen remains one of the most influential multi-agent frameworks by community adoption, but it is now in maintenance mode [S31]. The repo states that new projects should use Microsoft Agent Framework, which incorporates lessons from AutoGen and Semantic Kernel with enterprise-grade support, multi-provider model support, and cross-runtime interoperability through MCP and A2A [S31].

This matters for maturity assessment. AutoGen still has a large installed base and pioneered many multi-agent orchestration patterns, but its future is migration rather than new feature growth [S31]. For 2026 planning, AutoGen should be treated as a legacy/research framework unless a project already depends on it.

Best fit: maintaining existing AutoGen systems or studying multi-agent conversation patterns. New Microsoft-centric projects should evaluate Microsoft Agent Framework instead [S31].

## LlamaIndex

LlamaIndex is a data and RAG-first framework for building LLM-powered agents over private data [S32], [S33]. Its docs emphasize context augmentation, ingestion, parsing, indexing, retrieval, RAG pipelines, document understanding, data extraction, autonomous agents, and workflows [S33].

The agentic side of LlamaIndex is built around workflows: event-driven, multi-step processes combining agents, data connectors, and tools. Workflows are useful for RAG plus reranking, corrective RAG, citation query engines, advanced Text-to-SQL, query planning, routing, and multi-step query engines [S33].

Best fit: data-grounded agents where the primary challenge is retrieving and reasoning over private documents, databases, and indexes. LlamaIndex pairs naturally with MCP for exposing data capabilities and with OSSA for declaring agent/tool/governance metadata [S02], [S07], [S33].

## LangChain Agent Protocol and LangGraph Platform

LangChain Agent Protocol is not a framework in the same sense as LangGraph or CrewAI. It is a framework-agnostic REST API for serving agents in production [S13], [S14]. It defines run execution, thread state/history, and long-term store endpoints so tools such as LangGraph Studio can interact with any compliant agent server [S13], [S14].

This is a narrower but practical standard. It gives a deployment and introspection API for agent services, while A2A handles cross-agent delegation and MCP handles tools. It is useful when a team needs a standard internal API for agents implemented in multiple frameworks [S13], [S14].

## GitLab Duo Agent Platform

GitLab Duo Agent Platform is an enterprise DevSecOps agent platform rather than a standalone open-source framework. GitLab announced GA in January 2026 and positions the platform as a way to use agents across analysis, coding, CI/CD, security, and software-delivery workflows [S34], [S35].

The platform has three agent classes. Foundational agents are built by GitLab and available out of the box, including general development, planner, security analyst, and data analyst patterns. Custom agents are built and shared through the AI Catalog so teams can encode their prompts, standards, guardrails, and workflows. External agents integrate tools such as Claude Code and OpenAI Codex into GitLab issues and merge requests through mentions or assignments [S34], [S35].

GitLab's model selection and credential management are especially relevant to governance. Administrators can choose supported models from providers including Anthropic, OpenAI, Meta, and Mistral, while GitLab-managed credentials reduce the need for customers to manage and rotate external-agent API keys directly [S34]. This maps to the NIST and Gravitee concern that agents need managed identities and centralized governance rather than shared ad hoc keys [S25], [S38].

## Cost and production considerations

The 47Billion production guide warns that not all agent systems are equally production-ready. Simple workflows and tool-using agents can be production-ready with validation, monitoring, cost limits, and fallbacks. Structured multi-agent systems are cautiously production-ready only with heavy guardrails, human checkpoints, and progressive rollout. Open-ended multi-agent systems are still too unpredictable for critical paths [S36].

Cost scales with agent loops, tool calls, model choice, retries, and multi-agent delegation. 47Billion lists approximate per-task ranges: simple workflows around $0.10-$0.50, CrewAI multi-agent around $0.50-$2.00, autonomous agents around $2.00-$5.00, and LlamaIndex RAG around $0.20-$1.00 [S36]. These numbers should not be treated as universal pricing, but they are useful planning ranges and support the recommendation to set up cost monitoring before production [S36].

Production rollout should be progressive: internal users, beta customers, then general availability, with monitoring and iterative refinement at each step [S36]. Framework choice should therefore be driven by control requirements:

- Need durable explicit state: LangGraph.
- Need quick role-based teams: CrewAI.
- Need RAG/document grounding: LlamaIndex.
- Need lightweight handoffs and tracing: OpenAI Agents SDK.
- Need Microsoft enterprise stack: Microsoft Agent Framework, not new AutoGen.
- Need package/discovery/governance portability: OSSA plus DUADP.

## Community and maturity observations

Star counts are not quality guarantees, but they reveal momentum. AutoGen, CrewAI, LlamaIndex, LangGraph, and OpenAI Agents SDK all have large communities. A2A and AG-UI also have strong protocol-specific adoption. OSSA and DUADP are newer, smaller ecosystem components, but their role is different: they are not competing for agent-loop developer mindshare; they are trying to define the contract and discovery layers that larger frameworks can interoperate through [S01], [S03].

The strategic opportunity for OSSA/DUADP is to integrate with the mature frameworks rather than replace them. OSSA manifests can declare LangGraph, CrewAI, LlamaIndex, OpenAI Agents SDK, GitLab Duo, MCP, A2A, and AG-UI surfaces. DUADP can make those manifests discoverable and trust-evaluable across organizations [S01], [S03], [S05].
