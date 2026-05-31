# Frameworks, platforms, repositories, and npm packages

Generated on 2026-05-31.

## Requested npm packages: OSSA and DUADP

### `@bluefly/openstandardagents`

`@bluefly/openstandardagents` is the npm-distributed OSSA CLI/SDK. The package describes OSSA as an "infrastructure bridge between agent protocols (MCP, A2A) and deployment platforms" with a define-once YAML manifest and export targets for Docker, Kubernetes, LangChain, CrewAI, Claude Skills, and other platforms [S02].

Observed npm metadata:

- Version: 0.5.1, published 2026-03-28 [S02].
- License: Apache-2.0 [S02].
- Weekly downloads: 49 [S02].
- Package size: 10.7 MB unpacked, 2,033 files [S02].
- Dependencies: 75 [S02].
- Versions: 23 [S02].
- Source of truth: GitLab repository `blueflyio/ossa/openstandardagents`; GitHub mirror had 5 stars on 2026-05-31 [S02].

Functional role:

- Validates OSSA manifests.
- Scaffolds and exports agents to runtime/deployment formats.
- Provides an MCP server with tools such as `ossa_validate`, `ossa_scaffold`, `ossa_convert`, `ossa_inspect`, `ossa_diff`, and `ossa_migrate` [S01], [S02].
- Encodes identity, trust, governance, compliance, observability, memory, execution economics, team definitions, and cost controls in the manifest [S01], [S02].

### `@bluefly/duadp`

`@bluefly/duadp` is the TypeScript SDK for the Decentralized Universal AI Discovery Protocol. The package frames DUADP as the missing DNS layer for AI capabilities: any node that serves standard endpoints can publish and discover agents, skills, and tools in a federated network [S04].

Observed npm metadata:

- Version: 0.1.4, published 2026-03-09 [S04].
- License: Apache-2.0 [S04].
- Weekly downloads: 16 [S04].
- Package size: 169.0 KB unpacked, 23 files [S04].
- Dependencies: 7 [S04].
- Versions: 5 [S04].
- Repository: GitLab `blueflyio/duadp/duadp`; GitHub mirror had 0 stars on 2026-05-31 [S04].

Functional role:

- Provides typed client APIs for discovery, search, skills, agents, tools, pagination, and federation [S04].
- Provides an Express router to host DUADP node endpoints [S04].
- Provides OSSA resource validation, Ed25519 signing/verification, DID resolution, and conformance testing [S04].
- Bridges OSSA payloads, MCP tool servers, and A2A Agent Cards into a unified registry model [S04].

## Major open-source frameworks

| Project | Stars on 2026-05-31 | Primary strength | Notes |
| --- | ---: | --- | --- |
| OpenAI Agents SDK | 26,786 | Lightweight multi-agent workflow SDK | Provider-agnostic, guardrails, tracing, MCP tools [S23] |
| LangGraph | 33,433 | Long-running stateful orchestration | Durable execution, persistence, HITL, memory [S24] |
| CrewAI | 52,506 | Role/team based multi-agent automation | Crews for autonomy; Flows for production control [S25] |
| Microsoft AutoGen | 58,557 | Research-origin multi-agent conversations | Now in maintenance mode; new users directed to Microsoft Agent Framework [S26] |
| LlamaIndex | 49,788 | Data/RAG/document agents | 300+ integrations, parsing/extraction/indexing ecosystem [S27] |
| Parlant | 18,093 | Customer-facing conversational control | Context engineering, guidelines, canned responses, OpenTelemetry [S28] |

### OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight framework for multi-agent workflows. Despite the name, the Python README says it is provider-agnostic and supports OpenAI Responses/Chat Completions plus more than 100 other LLMs [S23].

Core concepts include agents, sandbox agents, agents-as-tools and handoffs, tools including MCP and hosted tools, guardrails, human-in-the-loop, sessions, tracing, and realtime voice agents [S23]. The common simplified description of the SDK as "agents, handoffs, guardrails, tracing" is accurate but incomplete as of the current README because sessions, sandbox agents, tools, and realtime agents are also first-class [S23].

Best fit: teams that want a minimal SDK with guardrails/tracing and do not need the full graph/runtime surface of LangGraph.

### LangGraph

LangGraph is a low-level orchestration framework and runtime for long-running, stateful agents [S24]. It focuses on durable execution, streaming, human-in-the-loop, persistence, comprehensive memory, debugging with LangSmith, and production-ready deployment [S24].

LangGraph is intentionally lower level than LangChain's prebuilt agent abstractions. It is a strong fit for workflows that loop, branch, checkpoint, resume after failure, and require explicit state inspection/modification [S24].

Best fit: complex state machines, regulated workflows, and systems that need inspectable execution paths rather than only prompt chains.

### CrewAI

CrewAI is a standalone Python framework for multi-agent automation. Its README emphasizes that it is independent of LangChain and designed around two complementary abstractions: Crews and Flows [S25].

- Crews optimize for autonomy and role-based collaboration among agents [S25].
- Flows provide event-driven, production-oriented control over execution paths and state [S25].

47Billion's production account found CrewAI more predictable and faster to develop than AutoGen for structured, multi-step tasks, while less flexible for open-ended exploration [S32]. CrewAI's own README also emphasizes enterprise control plane features such as tracing, observability, centralized management, integrations, security, analytics, and cloud/on-prem deployment options [S25].

Best fit: structured multi-agent tasks where role and task definitions are clearer than arbitrary conversational debate.

### Microsoft AutoGen and Microsoft Agent Framework

AutoGen pioneered multi-agent orchestration patterns but is now in maintenance mode. The README warns that it will not receive new features and directs new users to Microsoft Agent Framework, described as the enterprise-ready successor with long-term support and cross-runtime interoperability via A2A and MCP [S26].

AutoGen remains relevant historically and for existing deployments. It supports AgentChat, Core APIs, extensions, AutoGen Studio, and benchmarking, but new 2026 architecture decisions should evaluate Microsoft Agent Framework rather than starting fresh on AutoGen [S26].

Best fit: legacy/experimental multi-agent conversation systems, with migration planning for new production work.

### LlamaIndex

LlamaIndex is a data framework for building LLM and agentic applications over private data. The README emphasizes data connectors, data structures/indexes, retrieval/query interfaces, and integrations with outer application frameworks [S27].

The current project also includes LlamaParse and document-agent platform capabilities for parsing, extraction, indexing, RAG, and end-to-end document agents [S27]. This makes LlamaIndex most relevant when the agent's main job is to ingest, structure, retrieve, and synthesize documents or enterprise knowledge.

Best fit: RAG, document processing, knowledge extraction, and agentic OCR/document workflows.

### Parlant

Parlant is an interaction-control harness for customer-facing agents, especially regulated B2C or sensitive B2B interactions. It argues that system prompts buckle under production complexity and that routed graphs can become fragile [S28].

Its core approach is contextual matching: define guidelines, relationships, journeys, canned responses, tools, glossary terms, and variables, then include only the context relevant to the current turn [S28]. Parlant also provides strict canned-response modes for critical moments and OpenTelemetry tracing for explainability [S28].

Best fit: customer support, sales, onboarding, advisory, financial/healthcare/insurance flows where tone, compliance, and auditability are central.

## GitLab Duo Agent Platform

GitLab Duo Agent Platform reached general availability on 2026-01-15. GitLab frames it as agentic AI across the software development lifecycle, not only coding assistance [S29].

Key platform pieces:

- Foundational agents: ready-to-use GitLab-maintained agents such as Planner and Security Analyst [S29], [S30].
- Custom agents: created and shared through the AI Catalog with team-specific prompts, context, capabilities, standards, and guardrails [S29], [S31].
- External agents: integrations with Claude Code and OpenAI Codex/Codex CLI for code generation, review, and analysis [S29], [S30].
- AI Catalog: central place to discover, create, version, share, restrict, and enable agents/flows across projects and groups [S31].
- Flexible model selection: administrators can choose supported models such as GPT, Mistral, Llama, and Claude variants to align with privacy, security, and compliance needs [S29].

GitLab is an important example because it productizes agent governance inside an existing DevSecOps surface. The platform inherits GitLab's audit, project, issue, MR, pipeline, and security context, which is the kind of operational integration standalone frameworks often lack [S29], [S30], [S31].

## Protocol and standards repositories

| Repository | Stars on 2026-05-31 | Purpose |
| --- | ---: | --- |
| `modelcontextprotocol/modelcontextprotocol` | 8,281 | MCP specification and documentation |
| `a2aproject/A2A` | 24,069 | Agent2Agent protocol |
| `ag-ui-protocol/ag-ui` | 13,933 | Agent-User Interaction protocol |
| `agent-network-protocol/AgentNetworkProtocol` | 1,307 | Agent Network Protocol |
| `langchain-ai/agent-protocol` | 597 | OpenAPI-style agent serving API |
| `blueflyio/openstandardagents` | 5 | OSSA GitHub mirror; source of truth is GitLab |
| `blueflyio/duadp` | 0 | DUADP GitHub mirror; source of truth is GitLab |

## Cost and production considerations

47Billion's production experience gives a useful cost gradient: simple workflows were estimated at $0.10-$0.50 per task, CrewAI multi-agent at $0.50-$2.00, AutoGen multi-agent at $2.00-$5.00, and LlamaIndex RAG at $0.20-$1.00 [S32]. These numbers should not be treated as universal pricing, but the shape is important: multi-agent systems multiply token and debugging costs because agents often share or replay context [S32].

Production readiness is highest for deterministic workflows, tool-using agents with guardrails, and structured multi-agent systems with HITL checkpoints. Open-ended multi-agent autonomy remains too unpredictable for critical paths without strong supervision [S32].

## Practical selection guidance

- Use OSSA when you need a portable, auditable, versioned agent definition that can export to multiple platforms [S01], [S02].
- Use DUADP when you need cross-domain agent/skill/tool discovery and verifiable federation rather than a single private registry [S03], [S04].
- Use LangGraph when the workflow is stateful, long-running, interruptible, or requires explicit graph-level control [S24].
- Use CrewAI when the team/task metaphor maps well to the problem and you want faster structured multi-agent development [S25], [S32].
- Use LlamaIndex when document ingestion, retrieval, and structured extraction dominate [S27].
- Use Parlant when customer-facing behavioral control and traceability are more important than generic workflow orchestration [S28].
- Use OpenAI Agents SDK when you want a small SDK with guardrails, tracing, handoffs, tools, and broad model support [S23].
- Treat AutoGen as legacy/maintenance for new work; evaluate Microsoft Agent Framework instead if staying in the Microsoft ecosystem [S26].
- Use GitLab Duo Agent Platform when the work lives inside GitLab issues, MRs, CI/CD, security findings, and organizational DevSecOps governance [S29], [S31].
