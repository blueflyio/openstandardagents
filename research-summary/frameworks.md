# Open-Source Frameworks, Repositories, and npm Packages

Prepared on May 22, 2026. Citations use the source IDs in [reading-list.md](reading-list.md). GitHub star counts were gathered with `gh repo view` on May 22, 2026.

## Repository snapshot

| Project | Purpose | License | Stars | Latest release / status |
| --- | --- | --- | ---:| --- |
| OpenAI Agents SDK | Lightweight multi-agent workflows | MIT | 26,569 | v0.17.3, May 19, 2026 [S28]. |
| LangGraph | Durable stateful graph runtime for agents | MIT | 32,684 | v1.2.1, May 21, 2026 [S30]. |
| CrewAI | Role-playing autonomous multi-agent crews | MIT | 51,947 | v1.14.5, May 18, 2026 [S31]. |
| Microsoft AutoGen | Multi-agent AI application framework | Code MIT, docs CC-BY-4.0 | 58,285 | Maintenance mode; latest Python release v0.7.5, Sep 30, 2025 [S32]. |
| LlamaIndex | Data framework for RAG and document agents | MIT | 49,581 | v0.14.22, May 14, 2026 [S33]. |
| A2A | Agent-to-agent protocol | Apache-2.0 | 23,914 | v1.0.0, Mar 12, 2026 [S20]. |
| AG-UI | Agent-user interaction protocol | MIT | 13,742 | release/2026-05-20 [S22]. |
| ANP | Agent Network Protocol | Apache-2.0 per GitHub metadata | 1,300 | v1.0, May 19, 2025 [S25]. |
| LangChain Agent Protocol | Production serving API for agents | MIT | 590 | langchain-protocol 0.0.15, May 1, 2026 [S24]. |
| monday.com ATP | Sandboxed code-first tool protocol | MIT | 96 | npm packages active in May 2026 [S26]. |

## OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight framework for building agentic AI apps and multi-agent workflows [S27]. Its primitive set is intentionally small: agents, agents as tools/handoffs, guardrails, and tracing [S27]. Agents are LLMs with instructions and tools; handoffs delegate to other agents; guardrails validate inputs and outputs; tracing visualizes and debugs flows [S27].

Use it when you want Python-first orchestration with minimal abstraction, built-in tracing, guardrails, managed tool loops, sessions, MCP server tools, human-in-the-loop mechanisms, sandbox agents, and OpenAI ecosystem integration [S27].

## LangGraph

LangGraph models agent workflows as graphs with State, Nodes, and Edges [S29]. State is the shared application snapshot; nodes perform computation or side effects; edges route execution based on state [S29]. LangGraph uses message passing and super-steps inspired by Pregel, which supports parallel nodes in a single super-step and sequential nodes in separate steps [S29].

LangGraph is strong for long-running, stateful, durable, human-in-the-loop workflows with explicit state schemas, reducers, checkpoints, branching, and routing [S29][S30]. Its cost is design complexity: teams must own graph structure and state semantics.

## CrewAI

CrewAI is a Python framework for orchestrating role-playing autonomous agents [S31]. Its mental model is role-task-crew: define agents with roles, goals, backstories, tools, and LLMs; define tasks with expected outputs; assemble them into crews and flows [S31]. CrewAI is approachable for teams that naturally decompose work into specialized roles, but production deployments still need external guardrails, persistence, evaluation, tool governance, and cost monitoring [S31][S39].

## Microsoft AutoGen

AutoGen creates multi-agent AI applications that act autonomously or alongside humans [S32]. It supports AgentChat patterns such as two-agent and group-chat workflows, and has been used for web browsing, code execution, file handling, and multi-agent workflows [S32]. As of May 22, 2026, it is in maintenance mode and points new users toward Microsoft Agent Framework while continuing bug fixes and critical security patches [S32].

## LlamaIndex

LlamaIndex is an open-source data framework for RAG and document agents [S33]. It offers ingestion connectors, indexing, retrieval/query interfaces, and app integrations [S33]. Its Workflows library supports RAG plus reranking, citation query engines, corrective RAG, ReAct agents, function-calling agents, query planning, parallel steps, loops, routing, Text-to-SQL, and multi-step query engines [S34]. Use it when the hard part is data ingestion, parsing, indexing, retrieval, and grounded answers [S33][S34].

## GitLab Duo Agent Platform

GitLab Duo Agent Platform is generally available as part of GitLab 18.8+ and lets developers delegate SDLC tasks to specialized agents inside GitLab [S36]. It includes foundational agents, custom agents and flows via the AI Catalog, and external agents such as Claude Code and OpenAI Codex [S36][S37][S38]. The AI Catalog versions and enables agents across projects and groups [S37], while managed external agents can use GitLab-managed credentials [S38].

## OSSA and DUADP npm packages

`@bluefly/openstandardagents` is the npm distribution for OSSA. Version 0.5.1 is latest as of May 22, 2026, with Apache-2.0 licensing and GitLab source [S03]. It provides the `ossa` CLI, schemas, SDK exports, validation, generation, migration, trust services, MCP server integration, agent-card generation, and many export targets [S03].

`@bluefly/duadp` is the TypeScript SDK for DUADP. Version 0.1.4 is latest as of May 22, 2026, with Apache-2.0 licensing and GitLab source [S04]. It exposes core types, a typed client, Express router/server helper, validation, crypto signing/verification, DID resolution, and conformance tests [S04].

## Practical selection guidance

| Need | Better starting point | Why |
| --- | --- | --- |
| Portable manifest, compliance, export | OSSA | Contract layer with schemas, policies, and export targets [S01][S03]. |
| Federated discovery and trust | DUADP | GAID/DID/WebFinger/gossip and trust-tier model [S02][S04]. |
| Tool/data access | MCP | Most mature tool integration standard [S17]. |
| Cross-agent delegation | A2A | Agent Cards and task lifecycle across vendors [S18][S19]. |
| UI streaming and HITL | AG-UI | Event-based frontend/backend bridge [S21]. |
| Durable graph workflows | LangGraph | Explicit state, nodes, edges, checkpoints [S29]. |
| Fast role-based teams | CrewAI | Roles, goals, backstories, crews, flows [S31]. |
| RAG/document agents | LlamaIndex | Ingestion, indexing, retrieval, document workflows [S33][S34]. |
| Minimal Python agent runtime | OpenAI Agents SDK | Agents, handoffs, guardrails, tracing [S27]. |
| SDLC platform agents | GitLab Duo Agent Platform | Catalog and GitLab-native agent workflows [S36][S37]. |
