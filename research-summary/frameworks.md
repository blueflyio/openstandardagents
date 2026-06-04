# Open-Source Frameworks, Repositories, and npm Packages

Report date: 2026-06-04

Star counts and package metadata reflect the fetched source snapshots used for this report, not a permanent value.

## OSSA and DUADP packages

### `@bluefly/openstandardagents`

`@bluefly/openstandardagents` is the npm package for OSSA. The package describes OSSA as an open standard for defining, validating, discovering, and governing software agents. It is a contract layer rather than an agent runtime: schema, identity, capabilities, policy bindings, discovery metadata, and validation rules [OSSA-NPM].

Live registry facts:

- Latest stable: `0.5.6`, published 2026-06-03 [OSSA-NPM].
- First published: 2025-11-19 [OSSA-NPM].
- License: Apache-2.0 [OSSA-NPM].
- Node requirement: Node.js 20+ [OSSA-NPM].
- Package size: 99 files, about 644-660 KB unpacked depending on registry view [OSSA-NPM].
- Weekly downloads: npm page showed 42 at fetch time [OSSA-NPM].
- Important registry note: `0.5.3`, `0.5.4`, and `0.5.5` are marked in the npm README as accidentally published during recovery and deprecated; use `0.5.6` [OSSA-NPM].

What it contains:

- JSON Schemas for OSSA v0.5 manifests, workflows, registries, and policy bindings [OSSA-NPM].
- Reference OpenAPI contracts [OSSA-NPM].
- CLI entrypoint `ossa` with commands such as validate, validate-spec, discover, resolve-did, and lint-openapi [OSSA-NPM].
- Programmatic validation utilities [OSSA-NPM].
- Reference manifests and well-known discovery document [OSSA-NPM].

What it does not contain:

- Agent runtime, orchestration engine, deployment controller, Drupal module, GitLab automation, or policy decision point. Those are explicitly adjacent projects [OSSA-NPM].

Relationship to this repository:

- The local checkout's `package.json` currently reports version `0.5.1`, while npm latest is `0.5.6`. That means the local branch is behind the latest npm package metadata and should not be assumed to represent current registry state without checking tags/releases [LOCAL-PKG] [OSSA-NPM].

### `@bluefly/duadp`

`@bluefly/duadp` is the TypeScript SDK for DUADP, a decentralized universal AI discovery protocol for agents, skills, tools, and registries [DUADP-NPM].

Live registry facts:

- Latest: `0.1.7`, published 2026-06-03 [DUADP-NPM].
- First published: 2026-03-06 [DUADP-NPM].
- License: Apache-2.0 [DUADP-NPM].
- Repository: GitLab `blueflyio/duadp/duadp` [DUADP-NPM].
- Package size: 39 files, about 250-256 KB unpacked [DUADP-NPM].
- Weekly downloads: npm page showed 9 at fetch time [DUADP-NPM].
- Peer dependency: Express >=4.0.0 for the server router [DUADP-NPM].

What it provides:

- `DuadpClient` for discovery, search, GAID resolution, inspection, pagination, and federation [DUADP-NPM].
- `createDuadpRouter()` for turning an Express app into a DUADP node [DUADP-NPM].
- `validateManifest()` for OSSA manifest validation [DUADP-NPM].
- Ed25519 signing/verification helpers [DUADP-NPM].
- DID resolution for `did:web` and `did:key` [DUADP-NPM].
- Conformance tests for protocol compliance [DUADP-NPM].

Key endpoints:

- `GET /.well-known/duadp.json`
- `GET /.well-known/webfinger`
- `GET /api/v1/skills`
- `GET /api/v1/agents`
- `GET /api/v1/tools`
- `POST /api/v1/publish`
- `GET /api/v1/resolve/:gaid`
- `GET /api/v1/inspect`
- `POST /api/v1/validate`
- federation endpoints [DUADP-NPM]

## Framework and repository matrix

| Project | Snapshot stars | Primary role | Best fit | Caution |
| --- | ---: | --- | --- | --- |
| OpenAI Agents SDK | 26,904 | Lightweight multi-agent framework | Agents, handoffs, guardrails, tracing, sessions, tools | Provider-agnostic but OpenAI-centered docs/examples |
| LangGraph | 33,840 | Low-level stateful orchestration | Durable long-running agents, HITL, memory, graphs | More engineering control and complexity |
| CrewAI | 52,812 | Multi-agent automation framework | Structured crews and flows, enterprise automation | Telemetry and enterprise suite considerations |
| LlamaIndex | 49,907 | Document agent/RAG framework | Retrieval, parsing, OCR, indexing, document agents | Best when data/document work dominates |
| AutoGen | 58,688 | Multi-agent framework | Existing AutoGen systems, research patterns | Maintenance mode; Microsoft points new users to Agent Framework |
| Microsoft Agent Framework | Not fetched as star count | Production .NET/Python framework | Enterprise Microsoft stacks, MCP/A2A interop | New 1.0 path; migration planning required |
| Parlant | Not fetched as star count | Customer-facing conversational control harness | Regulated/high-stakes B2C/B2B interactions | Less general-purpose orchestration than LangGraph/CrewAI |
| AgentNetworkProtocol | 1,315 | Decentralized agent network protocol | DID-based open agent network design | Protocol and implementation still maturing |
| LangChain Agent Protocol | 601 | Framework-agnostic agent serving API | Runs/threads/store/streaming APIs | Protocol adoption depends on serving platform |

## OpenAI Agents SDK

OpenAI Agents SDK is a lightweight framework for multi-agent workflows. The Python README says it supports OpenAI Responses and Chat Completions APIs plus 100+ other LLMs [OPENAI-AGENTS]. The npm package `@openai/agents` was `0.11.6` at fetch time, MIT licensed, and described as "a lightweight yet powerful framework for building multi-agent workflows" [OPENAI-AGENTS-NPM].

Core concepts:

- Agents configured with instructions, tools, guardrails, and handoffs [OPENAI-AGENTS].
- Agents as tools and handoffs for delegation [OPENAI-AGENTS].
- Tools including functions, MCP, and hosted tools [OPENAI-AGENTS].
- Guardrails for input and output validation [OPENAI-AGENTS].
- Human-in-the-loop mechanisms [OPENAI-AGENTS].
- Sessions for conversation history [OPENAI-AGENTS].
- Tracing for debugging and optimization [OPENAI-AGENTS].
- Realtime agents for voice use cases [OPENAI-AGENTS].
- Sandbox agents for filesystem/command work over long time horizons [OPENAI-AGENTS].

Fit: good for teams seeking a focused agent SDK with built-in handoffs, guardrails, tracing, and tool integration.

## LangGraph

LangGraph is a low-level orchestration framework for long-running, stateful agents. Its README emphasizes durable execution, human-in-the-loop, comprehensive memory, debugging/observability with LangSmith, and production deployment [LANGGRAPH].

Core strengths:

- Durable execution with resume after failures [LANGGRAPH].
- Interrupts and human oversight at arbitrary workflow points [LANGGRAPH].
- Short-term and long-term memory [LANGGRAPH].
- Graph-based execution inspired by Pregel, Apache Beam, and NetworkX [LANGGRAPH].
- Integration with LangChain, Deep Agents, LangSmith, and LangSmith Deployment [LANGGRAPH].

Fit: best when workflows need explicit state, cycles, branches, checkpoints, recoverability, and inspection.

## CrewAI

CrewAI is a standalone Python framework for multi-agent automation, explicitly independent of LangChain. It provides two complementary abstractions: Crews for autonomous role-based collaboration and Flows for event-driven, production-grade orchestration [CREWAI].

Core strengths:

- Crews: specialized agents, tasks, role/goal/backstory, collaboration [CREWAI].
- Flows: structured state, event-driven control, conditional routing, integration with Crews [CREWAI].
- Enterprise control plane features for tracing, observability, integrations, security, compliance, analytics, support, and on-prem/cloud deployment [CREWAI].
- Large community signals: README claims more than 100,000 certified developers through community courses [CREWAI].

Fit: good middle ground for structured multi-step work that needs more than a prompt chain but less open-ended conversation chaos.

## LlamaIndex

LlamaIndex describes itself as an open-source framework for building agentic applications and a leading document agent/OCR platform. Its original strength is private-data augmentation for LLMs through connectors, indices, graphs, retrieval, query engines, and integrations [LLAMAINDEX].

Core strengths:

- Data connectors for APIs, PDFs, documents, SQL, and other sources [LLAMAINDEX].
- Structures for data such as indices and graphs [LLAMAINDEX].
- Retrieval and query interfaces for knowledge-augmented output [LLAMAINDEX].
- LlamaParse platform for parsing/OCR, extraction, indexing, and document agents [LLAMAINDEX].
- More than 300 integration packages via LlamaHub [LLAMAINDEX].

Fit: best when the agent's core problem is document parsing, extraction, RAG, indexing, or data retrieval.

## AutoGen and Microsoft Agent Framework

AutoGen is a Microsoft-originated framework for multi-agent AI applications that can act autonomously or work alongside humans. Its README now marks the project as maintenance mode: no new features, community-managed, and new users should start with Microsoft Agent Framework [AUTOGEN].

AutoGen remains important because it pioneered conversational multi-agent orchestration patterns and provides layered components:

- Core API for message passing, event-driven agents, and local/distributed runtime [AUTOGEN].
- AgentChat API for rapid prototyping and group chat patterns [AUTOGEN].
- Extensions for LLM clients, code execution, and MCP workbenches [AUTOGEN].
- AutoGen Studio for no-code prototyping, with a security warning that it is not production-ready as-is [AUTOGEN].

Microsoft Agent Framework is the successor path. Microsoft announced version 1.0 for .NET and Python as production-ready, with stable APIs, long-term support, multi-agent orchestration, multi-provider model support, streaming, checkpointing, HITL approvals, pause/resume, MCP, and A2A interoperability [MAF-SEARCH].

Fit: existing AutoGen users should plan migration; new Microsoft-centric teams should evaluate Microsoft Agent Framework instead of starting new AutoGen builds.

## Parlant

Parlant is a conversational control layer for customer-facing agents. It is an Apache-2.0 open-source harness designed for controlled, consistent, predictable, traceable, and safe LLM interactions in B2C and sensitive B2B settings [PARLANT-SEARCH].

Core primitives:

- Guidelines: condition-action behavioral rules [PARLANT-SEARCH].
- Context engineering: inject only the context relevant to the current turn [PARLANT-SEARCH].
- Journeys: scoped conversation logic for use cases [PARLANT-SEARCH].
- Guided tool use: tools execute when associated guidelines/conditions allow them [PARLANT-SEARCH].
- Utterance templates for critical non-hallucinated responses [PARLANT-SEARCH].

Fit: customer support, sales, onboarding, advisory, finance, insurance, healthcare, telecom, or any domain where brand, compliance, and auditability outweigh open-ended autonomy.

## GitLab Duo Agent Platform

GitLab announced general availability of GitLab Duo Agent Platform as an orchestration layer for agentic AI across the software development lifecycle [GITLAB-GA].

Core capabilities:

- Agentic Chat across Web UI and IDEs with project/issue/MR/pipeline/security context, multi-step reasoning, and actions [GITLAB-GA].
- Foundational agents such as Planner Agent and Security Analyst Agent [GITLAB-GA].
- Custom agents and flows through AI Catalog [GITLAB-GA] [GITLAB-PRODUCT].
- External agents including Claude Code and OpenAI Codex CLI [GITLAB-GA].
- Flows for issue-to-MR, CI/CD conversion, pipeline fixes, code review, and IDE development workflows [GITLAB-GA].
- MCP Client for IDEs to connect to Jira, Slack, Confluence, Playwright, Grafana, and other MCP-compatible tools with approval controls [GITLAB-GA].
- Governance controls, group-based access, model selection, and self-hosted model options [GITLAB-GA] [GITLAB-PRODUCT].

Fit: DevSecOps teams that want agents integrated into source control, issues, merge requests, CI/CD, and security workflows under centralized governance.

## Cost and maturity considerations

47Billion's production article provides useful cost and maturity ranges [FORTYSEVEN]:

| Approach | Cost per task | Production note |
| --- | ---: | --- |
| Simple workflow | $0.10-$0.50 | Production ready with error handling, validation, monitoring |
| CrewAI multi-agent | $0.50-$2.00 | Good for structured multi-step tasks |
| AutoGen multi-agent | $2.00-$5.00 | Powerful but token-heavy and difficult to debug |
| LlamaIndex RAG | $0.20-$1.00 | Strong fit for document processing queries |

47Billion's most important guidance is qualitative: do not start with multi-agent systems; start with bounded workflows, add cost monitoring first, and use standards such as MCP, A2A, and AG-UI instead of custom glue when a standard boundary exists [FORTYSEVEN].

## Suggested stack patterns

1. Internal tool-using agent:
   - OSSA manifest for contract/governance.
   - MCP servers for tools.
   - LangGraph or OpenAI Agents SDK for execution.
   - Policy engine/gateway for authorization.

2. Enterprise multi-agent workflow:
   - OSSA for manifest and policy metadata.
   - A2A for cross-agent delegation.
   - MCP for tool access.
   - AG-UI for user approvals and state streaming.
   - DUADP for discovery across teams or organizations.

3. Document-heavy agent:
   - LlamaIndex/LlamaParse for ingest, parsing, indexing, RAG.
   - OSSA manifest for tool/data access declaration.
   - MCP for standardized retrieval/tool interface.
   - HITL for high-risk output.

4. Customer-facing regulated agent:
   - Parlant for conversational control and guidelines.
   - OSSA for manifest, governance, and compliance metadata.
   - DUADP or registry for discoverability if shared across organizations.
   - Deterministic verification layer before tool execution.
