# Frameworks, Repositories, Platforms, and npm Packages

Prepared: 2026-05-13.

## Repository and package snapshot

| Project | Type | Stars/downloads fetched 2026-05-13 | Core purpose | Maturity signal |
|---|---|---:|---|---|
| @bluefly/openstandardagents | npm package | 90 weekly downloads; 23 versions | OSSA manifest, CLI, SDK, exporters | v0.5.1; Apache-2.0 [S04] |
| @bluefly/duadp | npm package | 55 weekly downloads; 5 versions | DUADP discovery SDK | v0.1.4; Apache-2.0 [S02] |
| modelcontextprotocol/typescript-sdk | GitHub/npm | 12,416 stars; 36.0M weekly npm downloads | MCP server/client SDK | v1.29.0; MIT [S31] |
| google/A2A | GitHub | 23,747 stars | Agent2Agent protocol | Open protocol [S33] |
| ag-ui-protocol/ag-ui | GitHub/npm | 13,518 stars; @ag-ui/client 576.2K weekly downloads | Agent-to-UI protocol | v0.0.53 client [S35] |
| langchain-ai/agent-protocol | GitHub | 582 stars | Runs, threads, store API | OpenAPI spec [S38] |
| openai/openai-agents-python | GitHub | 26,266 stars | OpenAI Agents SDK | Production-ready docs [S50, S51] |
| @openai/agents | npm | version 0.11.4 | JS/TS OpenAI Agents SDK | Published 2026-05-12 approx. [S52] |
| langchain-ai/langgraph | GitHub/npm | 31,936 stars; 2.2M weekly npm downloads | Stateful agent orchestration | v1.3.0 [S53-S55] |
| crewAIInc/crewAI | GitHub | 51,308 stars | Multi-agent crews and flows | Production docs [S56, S57] |
| microsoft/autogen | GitHub | 57,997 stars | Agentic AI programming framework | Large community [S58] |
| run-llama/llama_index | GitHub/npm | 49,376 stars; llamaindex 95.0K weekly downloads | Data/RAG agents and workflows | v0.12.1 TS [S59-S61] |
| emcie-co/parlant | GitHub | 18,069 stars | Controlled customer-facing agents | Apache-2.0 [S62, S63] |
| GitLab Duo Agent Platform | Product platform | GA 2026-01-15 | DevSecOps agent orchestration | Premium/Ultimate GA [S64] |
| @mondaydotcomorg/atp-server | npm package | 7.0K weekly downloads | ATP sandbox server | v0.25.0; MIT [S41] |
| @langchain/langgraph | npm package | 2.2M weekly downloads | JS LangGraph | v1.3.0 [S54] |
| llamaindex | npm package | 95.0K weekly downloads | LlamaIndex.TS | v0.12.1 [S60] |

## OSSA and DUADP packages

The @bluefly/openstandardagents package is the OSSA distribution. It includes schema exports, validation, generation, migration, type exports, MCP server entry points, trust services, workspace validation, CLI commands, and a broad set of platform exporters [S04, S05]. Its README explicitly states that OSSA is neither MCP nor A2A nor a framework; it is the "missing middle layer" for portable agent definitions and deployment translation [S04, S05].

The @bluefly/duadp package is the official TypeScript SDK for DUADP. It turns applications into DUADP nodes and lets clients consume any DUADP node. Its subpath exports cover core types, client, server, validation, crypto, DID resolution, and conformance tests [S02]. It is designed around 15 protocol endpoints plus governance/reference-node extensions, and it bridges MCP tool servers and A2A agent cards into a unified registry [S02].

## OpenAI Agents SDK

OpenAI's Agents SDK presents a deliberately small abstraction set: agents, handoffs or agents-as-tools, guardrails, and tracing. The Python docs also highlight tool invocation loops, MCP server tool calling, sessions, human-in-the-loop, sandbox agents, and realtime voice agents [S50]. The JavaScript/TypeScript package @openai/agents adds the same major concepts for Node.js 22+, Deno, Bun, and experimental Cloudflare Workers support [S52].

Strengths:

- Minimal conceptual surface.
- Strong tracing and guardrail emphasis.
- Direct OpenAI model integration, with provider-agnostic JS package language [S52].
- Sandbox agents for longer-running workspace tasks [S50, S52].

Risks:

- Framework convenience can hide run-loop complexity.
- Production safety still depends on tool policy, sandbox isolation, and external authorization, not SDK primitives alone.

## LangGraph

LangGraph is a low-level orchestration framework and runtime for long-running, stateful agents [S53]. It emphasizes durable execution, streaming, human-in-the-loop, comprehensive memory, failure recovery, persistence, and detailed tracing through LangSmith [S53]. The JS package @langchain/langgraph had 2.2M weekly downloads and describes LangGraph as a controllable-agent orchestration layer used by companies including Replit, Uber, LinkedIn, GitLab, Klarna, and Elastic [S54].

Strengths:

- Strong fit for cyclic workflows, state persistence, and resumable execution.
- Human-in-the-loop and streaming are native concerns.
- Pairs with LangSmith for tracing, evaluation, prompts, and deployment [S53].

Risks:

- Lower-level design requires more architecture work than higher-level frameworks.
- Teams must define their own safe states, interrupts, and policies.

## CrewAI

CrewAI's docs position it as a production-ready system for collaborative agents, crews, and flows with guardrails, memory, knowledge, and observability [S56]. It supports agents, flows, tasks, sequential/hierarchical/hybrid processes, callbacks, human-in-the-loop triggers, enterprise deployment, triggers, RBAC, and integrations [S56].

47Billion's production comparison found CrewAI faster to implement for a structured table-reservation system than AutoGen, with better control over execution flow and a pragmatic task-based model [S70]. It cautioned that CrewAI is less flexible for dynamic open-ended scenarios and requires care around memory across tasks [S70].

## AutoGen

Microsoft AutoGen is a broad agentic AI programming framework with the largest star count in this snapshot: 57,997 stars [S58]. 47Billion describes AutoGen's core mental model as agent conversations. That makes it intuitive for exploratory multi-agent collaboration, code execution agents, and human-in-the-loop modes, but expensive and hard to debug when conversations loop or multiple agents see long shared histories [S70].

Best fit:

- Exploratory tasks.
- Multi-perspective collaboration.
- Prototyping complex agent conversations.

Use caution for deterministic workflows where simpler orchestration is cheaper and easier to test [S70].

## LlamaIndex

LlamaIndex is strongest where agents need private data, documents, parsing, indexing, retrieval, and RAG [S59]. Its docs define agents as LLM-powered knowledge assistants that use tools and workflows as event-driven multi-step systems combining agents, data connectors, and other tools [S59]. LlamaIndex.TS supports multiple JavaScript runtimes and had 95.0K weekly npm downloads in the fetched package view [S60].

47Billion's assessment aligns: LlamaIndex is the document specialist, strong for document processing and RAG-heavy workflows, less ideal as a pure orchestration layer [S70].

## Parlant

Parlant is a context-engineering and interaction-control harness for customer-facing AI agents [S62, S63]. Its key idea is that reliable customer-agent behavior needs explicit human guidance, not only larger models or prompt stuffing. Parlant uses dynamic context delivery, guidelines, glossaries, context variables, API instructions, and explainable relevance scoring to apply only the rules that matter to a given conversation turn [S62].

This is important because it represents a different direction from general-purpose agent orchestration: controlled, consistent, predictable LLM interactions for high-volume service agents.

## GitLab Duo Agent Platform

GitLab announced Duo Agent Platform general availability on 2026-01-15 for Premium and Ultimate customers on GitLab.com and Self-Managed deployments, with Dedicated planned for GitLab 18.8 [S64]. The platform includes:

- Agentic Chat for context-aware analysis, code generation, CI/CD troubleshooting, and security assistance.
- Foundational agents: Planner Agent and Security Analyst Agent.
- Custom Agents built through an AI catalog.
- External Agents including Claude Code and Codex CLI integrations.
- Foundational flows such as issue-to-MR, CI/CD conversion, pipeline fix, code review, and IDE software development.
- Governance, visibility, model selection, group-based access controls, LDAP/SAML integration, and usage credits [S64].

GitLab is a useful enterprise case study because it puts agents inside the system of record for code, issues, MRs, pipelines, and security findings, rather than treating agents as detached chat tools [S64].

## Cost and reliability lessons from production blogs

47Billion's production work suggests that the autonomy spectrum is the main framework-selection tool [S70]:

| Autonomy level | Pattern | Production posture |
|---|---|---|
| Level 1 | Prompt chaining | Predictable, easy to debug |
| Level 2 | Branching workflows | Good production fit |
| Level 3 | Tool-using agents | Good with guardrails |
| Level 4 | Multi-agent systems | Powerful but costly and hard to debug |

Per-task cost ranges from 47Billion [S70]:

| Approach | Approximate cost/task | Fit |
|---|---:|---|
| Simple workflow | $0.10-$0.50 | Linear tasks |
| CrewAI multi-agent | $0.50-$2.00 | Structured multi-step tasks |
| AutoGen multi-agent | $2.00-$5.00 | Exploratory collaboration |
| LlamaIndex RAG | $0.20-$1.00 | Document queries |

## Framework selection guide

- Choose OSSA when portability, manifest validation, governance metadata, and multi-platform export matter.
- Choose DUADP when you need a discoverable registry or federated capability mesh.
- Choose OpenAI Agents SDK for lightweight agent loops, handoffs, guardrails, tracing, and sandbox-based workspace agents.
- Choose LangGraph for durable, stateful, long-running workflows with interrupts and explicit control.
- Choose CrewAI for structured multi-step crews and flows where roles and tasks are clear.
- Choose AutoGen for open-ended multi-agent conversation research or exploratory collaboration.
- Choose LlamaIndex for RAG, document workflows, context augmentation, and data-heavy agents.
- Choose Parlant for customer-facing agents requiring controlled conversational behavior.
- Choose GitLab Duo Agent Platform when agents should operate inside GitLab's DevSecOps context and governance model.
