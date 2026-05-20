# Open-Source Frameworks, Repositories, and npm Packages

Prepared: 2026-05-20

## Package and repository snapshot

| Project/package | Purpose | Version/stars at collection | Notes |
| --- | --- | --- | --- |
| `@bluefly/openstandardagents` | OSSA manifest, validation, export, CLI, MCP server | npm 0.5.1 [S31] | Apache-2.0; `ossa` CLI and schema exports. |
| `@bluefly/duadp` | DUADP TypeScript SDK/CLI | npm 0.1.4 [S32] | Apache-2.0; `duadp` CLI. |
| `@modelcontextprotocol/sdk` | MCP TypeScript SDK | npm 1.29.0 [S30] | MIT; official MCP implementation. |
| `@openai/agents` | OpenAI Agents SDK for JS/TS | npm 0.11.4 [S33] | MIT; multi-agent workflows. |
| OpenAI Agents Python | Lightweight Python agent framework | 26,495 GitHub stars [S34] | Agents, handoffs, guardrails, tracing. |
| LangGraph | Graph-based stateful agent workflows | 32,493 GitHub stars [S35] | State, nodes, edges, Pregel-style execution. |
| `@langchain/langgraph` | LangGraph JS/TS package | npm 1.3.2 [S36] | MIT; LangGraph JavaScript. |
| CrewAI | Role/task-based multi-agent orchestration | 51,786 GitHub stars [S37] | Crews and Flows; production-oriented tasks. |
| AutoGen | Microsoft multi-agent framework | 58,211 GitHub stars [S38] | Strong community; moving toward successor frameworks. |
| LlamaIndex | Document/RAG agents and OCR platform | 49,526 GitHub stars [S39] | RAG, document agents, indexes, query engines. |
| AG-UI | Agent-user interaction protocol repo | 13,673 GitHub stars [S40] | Frontend protocol and SDKs. |
| `@ag-ui/core` | AG-UI runtime schemas/types | npm 0.0.53 [S41] | TypeScript definitions and schemas. |
| `@ag-ui/client` | AG-UI client SDK | npm 0.0.53 [S42] | Connects to AG-UI servers. |
| `@a2a-js/sdk` | A2A JS client/server SDK | npm 0.3.13 [S43] | Apache-2.0; Agent2Agent SDK. |

## OSSA and DUADP packages

The local repository is the `@bluefly/openstandardagents` package. Its npm metadata describes OSSA as "Open Standard for Software Agents" and "infrastructure bridge between agent protocols (MCP, A2A) and deployment platforms." It exports schemas, validation, generation, migration, mesh, agent-card, trust, workspace validation, and an MCP server [S31].

The OSSA CLI package exposes `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, and `ossa-mcp` binaries. This means OSSA is both a library and a command-line tool for validating, generating, migrating, and exporting agent manifests [S31].

The `@bluefly/duadp` package is the TypeScript SDK for the Decentralized Universal AI Discovery Protocol. It exposes a `duadp` CLI and is published as version 0.1.4 with Apache-2.0 licensing [S32]. The official DUADP site shows a live well-known response with protocol version 0.1.4, 17 MCP tools, and federation enabled [S01].

Together, the npm packages represent a three-layer model:

1. OSSA defines agent identity, trust, policy, lifecycle, and platform export.
2. DUADP discovers agents, skills, tools, nodes, and trust evidence.
3. Existing runtimes such as Kubernetes, LangChain, CrewAI, GitLab Duo, Claude/Cursor, Drupal, or MCP/A2A servers execute or expose the agent [S01][S02][S03][S31][S32].

## OpenAI Agents SDK

OpenAI's Agents SDK is a lightweight framework for multi-agent workflows. The Python documentation describes a small primitive set: agents, agents-as-tools/handoffs, guardrails, and built-in tracing [S16]. It also includes an agent loop, function tools, MCP server tool calling, sessions, sandbox agents, human-in-the-loop support, and realtime agents [S16].

The SDK is production-oriented but intentionally low abstraction. It is strongest where teams want a managed loop for OpenAI and compatible models while retaining Python or TypeScript control over orchestration [S16][S33][S34].

## LangGraph

LangGraph models workflows as graphs with three core elements: state, nodes, and edges. State is the shared data structure, nodes encode logic or side effects, and edges determine routing [S09].

The execution model is inspired by Pregel. Nodes pass messages through edges in discrete super-steps; nodes become active when they receive messages and vote to halt when there is no more work. This makes LangGraph well-suited for long-running, cyclic, stateful, human-in-the-loop, resumable workflows [S09].

LangGraph is more explicit than many agent frameworks. It trades simplicity for visibility and control, which is valuable when production behavior must be debugged, interrupted, resumed, or evaluated [S09][S35][S36].

## CrewAI

CrewAI is an open-source framework for orchestrating role-playing autonomous agents. It emphasizes collaborative intelligence, role-based agents, task delegation, and structured processes [S37].

47Billion's production review found CrewAI more predictable than AutoGen for structured multi-step tasks. They reported rebuilding the same table reservation system in roughly one week with CrewAI after a three-week AutoGen build, and described CrewAI as a pragmatic middle ground between simple workflows and full multi-agent chaos [S18].

CrewAI's core production concepts are "Crews" for collaborative teams and "Flows" for event-driven, controlled orchestration. Its strengths are quick development, role/task clarity, and production usability for bounded workflows [S18][S37].

## AutoGen

AutoGen is Microsoft's open-source programming framework for agentic AI, with 58,211 GitHub stars at collection time [S38]. It popularized conversation-centered multi-agent workflows where agents interact through messages, tool calls, and human input.

47Billion's assessment found AutoGen powerful for exploratory tasks and code-execution agents, but expensive and difficult to debug when multi-agent conversations loop or diverge. The cost issue is structural: multiple agents can repeatedly see and extend conversation history, increasing token usage [S18].

AutoGen remains important historically and for experimentation, but production teams should evaluate whether newer Microsoft Agent Framework paths or more constrained frameworks better fit their risk tolerance.

## LlamaIndex

LlamaIndex is strongest for RAG and document-heavy applications. The GitHub repository describes it as a document agent and OCR platform, with 49,526 stars at collection time [S39].

The framework is useful when the agent's main work is finding, organizing, retrieving, and synthesizing information from documents or structured indexes. 47Billion's report found LlamaIndex effective for note summarization and insurance-document workflows, but less ideal for pure orchestration [S18].

## GitLab Duo Agent Platform

GitLab announced the general availability of GitLab Duo Agent Platform as a platform for agentic AI across the software development lifecycle. The platform targets the "AI paradox": improving coding speed alone does not remove downstream bottlenecks in review, security, compliance, CI/CD, and delivery [S29].

Key capabilities include:

- Agentic Chat in the GitLab Web UI and IDEs, with multi-step reasoning and lifecycle context.
- Analyze, code, CI/CD, and security use cases.
- Foundational agents such as Planner Agent and Security Analyst Agent.
- Custom agents and flows through the AI Catalog.
- External agents including Claude Code and OpenAI Codex CLI.
- MCP client integrations for tools such as Jira, Confluence, Slack, Playwright, and Grafana.
- Governance, visibility, group-level controls, model selection, and self-hosted options [S29].

GitLab Duo is relevant because it represents a platform product using agentic ideas across a full enterprise workflow, rather than only a developer SDK.

## Framework cost and reliability considerations

47Billion's framework comparison is one of the clearest production-oriented cost models found. Their per-task estimates were:

| Approach | Typical cost per task | Best fit |
| --- | --- | --- |
| Simple workflow | $0.10-$0.50 | Linear deterministic tasks |
| CrewAI multi-agent | $0.50-$2.00 | Structured multi-step tasks |
| AutoGen multi-agent | $2.00-$5.00 | Exploratory collaborative tasks |
| LlamaIndex RAG | $0.20-$1.00 | Document query and synthesis |

They concluded that simple workflows and tool-using agents are production-ready with validation, monitoring, and guardrails; structured multi-agent systems can be production-ready with heavy guardrails and human checkpoints; open-ended multi-agent systems remain too unpredictable for critical paths [S18].

## Notable repositories and maturity

| Repository | Role in ecosystem | Maturity signal |
| --- | --- | --- |
| `modelcontextprotocol/typescript-sdk` | MCP implementation | Official SDK, npm package [S30] |
| `a2aproject/a2a-js` | A2A SDK | Google/LF-backed SDK [S43] |
| `agent-network-protocol/AgentNetworkProtocol` | ANP open-network protocol | 1,299 stars; early decentralized protocol [S11] |
| `langchain-ai/agent-protocol` | Framework-agnostic serving API | 587 stars; LangChain ecosystem [S12] |
| `ag-ui-protocol/ag-ui` | UI protocol and SDKs | 13,673 stars; strong frontend need [S40] |
| `openai/openai-agents-python` | SDK framework | 26,495 stars; official OpenAI project [S34] |
| `crewAIInc/crewAI` | Multi-agent orchestration | 51,786 stars; broad adoption [S37] |
| `microsoft/autogen` | Multi-agent programming | 58,211 stars; high visibility [S38] |
| `run-llama/llama_index` | RAG/document agents | 49,526 stars; RAG-centric [S39] |
| `langchain-ai/langgraph` | Graph workflows | 32,493 stars; stateful orchestration [S35] |

## Practical selection guide

- Choose **OpenAI Agents SDK** when you want few abstractions, managed loop behavior, guardrails, tracing, MCP tools, and OpenAI ecosystem alignment.
- Choose **LangGraph** when explicit state, graph control, durable execution, and human interrupts matter.
- Choose **CrewAI** when work can be decomposed into roles and tasks with bounded collaboration.
- Choose **LlamaIndex** when the core task is retrieval, document processing, knowledge indexing, or RAG.
- Choose **AutoGen** for research, exploratory multi-agent conversations, or scenarios where agent dialogue itself is the main abstraction.
- Choose **OSSA + DUADP** when the problem is portability, discovery, trust, governance, and deployment rather than runtime behavior.
- Choose **GitLab Duo Agent Platform** when the organizational goal is governed agentic software delivery inside GitLab's lifecycle.
