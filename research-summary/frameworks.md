# Open-Source Frameworks and Projects

As of 2026-05-21.

## Notable repositories and maturity signals

GitHub metadata was collected with `gh api` on 2026-05-21 [S38]. Star counts are point-in-time indicators, not quality guarantees.

| Project | Stars | License | Purpose | Maturity signal |
|---|---:|---|---|---|
| microsoft/autogen | 58,241 | CC-BY-4.0 | Conversational and event-driven multi-agent framework | Mature, active docs [S21][S38] |
| crewAIInc/crewAI | 51,860 | MIT | Role/task-based agents, crews, flows | High adoption, production docs [S20][S38] |
| run-llama/llama_index | 49,550 | MIT | Document agents, RAG, workflows | High adoption, RAG strength [S38][S43] |
| langchain-ai/langgraph | 32,582 | MIT | Stateful graph runtime for agents | Active, production runtime [S19][S38] |
| openai/openai-agents-python | 26,533 | MIT | Lightweight multi-agent SDK | Active, official OpenAI SDK [S18][S38] |
| a2aproject/A2A | 23,888 | Apache-2.0 | Agent-to-agent protocol | LF project, stable v1.0 [S11][S12][S38] |
| emcie-co/parlant | 18,082 | Apache-2.0 | Controlled customer-facing agents | Strong niche adoption [S44] |
| ag-ui-protocol/ag-ui | 13,714 | MIT | Agent-to-UI protocol | Growing protocol ecosystem [S13][S38] |
| modelcontextprotocol/modelcontextprotocol | 8,175 | NOASSERTION | MCP specification/docs | Foundational protocol [S08][S38] |
| agent-network-protocol/AgentNetworkProtocol | 1,298 | Apache-2.0 in metadata; README says MIT | Decentralized agent network protocol | Early protocol project [S14][S38] |
| i-am-bee/acp | 1,004 | Apache-2.0 | REST agent communication protocol | Archived after A2A migration [S16][S38] |
| langchain-ai/agent-protocol | 589 | MIT | Agent serving API spec | Implemented by LangGraph Platform [S15][S38] |
| mondaycom/agent-tool-protocol | 96 | MIT | Sandboxed code-first tool protocol | New project [S17][S38] |
| sh4shv4t/Parlay | 0 | None in metadata | RL negotiation environment for LLM agents | New experimental repo [S45] |

## OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight Python framework for multi-agent workflows [S18]. The docs describe a deliberately small primitive set: agents, agents as tools/handoffs, guardrails, and tracing; the README now also lists sandbox agents, tools including MCP and hosted tools, human-in-the-loop, sessions, and realtime agents [S18]. The SDK is provider-agnostic, supporting OpenAI APIs and 100+ other LLMs [S18].

Its design sweet spot is teams that want a managed agent loop, tool execution, handoffs, guardrails, sessions, sandboxed workspaces, and tracing without adopting a heavy graph DSL [S18].

## LangGraph and LangChain Agent Protocol

LangGraph is a low-level orchestration framework and runtime for long-running, stateful agents [S19]. It emphasizes durable execution, streaming, human-in-the-loop interrupts, comprehensive memory, debugging through LangSmith, and production deployment [S19]. It models applications through state, nodes, and edges, with inspiration from Pregel and Apache Beam [S19].

LangGraph Platform's threads preserve state across multiple runs, enabling multi-turn conversations, long-running tasks, user-specific histories, inspection, checkpointing, and replay [S19]. The Agent Protocol provides the API envelope around these concepts: runs, threads, store, introspection, background run lifecycle, and streaming [S15].

## CrewAI

CrewAI presents itself as production-ready for collaborative agents, crews, and flows [S20]. It supports agents with tools, memory, knowledge, and structured outputs; flows with state, persistence, and resumption; and tasks/processes with sequential, hierarchical, or hybrid execution, guardrails, callbacks, and human-in-the-loop triggers [S20]. It also has enterprise features such as RBAC, automations, triggers, and deployment monitoring [S20].

47Billion's production comparison found CrewAI more predictable and faster to build with than AutoGen for structured multi-step tasks, while less flexible for dynamic open-ended scenarios [S23]. That makes it a pragmatic middle layer between simple workflows and unconstrained multi-agent conversation.

## AutoGen

Microsoft AutoGen is a framework for AI agents and applications with three main surfaces: Studio for no-code prototyping, AgentChat for conversational single- and multi-agent applications, and Core for event-driven, scalable multi-agent systems [S21]. Extensions include MCP workbenches, OpenAI Assistant API integration, Docker code executors, and gRPC worker runtimes [S21].

AutoGen remains strong for research, exploratory collaboration, code execution agents, and human-in-the-loop conversation patterns [S21][S23]. Production teams should budget for stronger guardrails and tracing when using open-ended multi-agent conversations [S23].

## LlamaIndex

LlamaIndex is strongest where agents are coupled to private data, documents, and RAG. Search-source summaries describe LlamaIndex agents as reasoning engines that break down questions, choose tools, plan tasks, and maintain memory [S43]. Its Workflows abstraction is event-driven and step-based, supporting loops, branching, state, concurrency, and event streaming [S43].

Use LlamaIndex for agentic RAG, report generation, customer support over private data, and document-heavy research assistants [S23][S43].

## Parlay and Parlant

The user request mentioned Parlay. Current search results identify `sh4shv4t/Parlay` as an April 2026 experimental RL negotiation environment where LLM agents learn game theory, theory-of-mind, and strategic bluffing through self-play; GitHub metadata shows no stars and no license metadata at collection time [S45]. This is not a broad production orchestration framework.

Industry coverage may have meant Parlant, an Apache-2.0 open-source framework for controlled customer-facing conversational agents. Parlant uses guidelines, observations, dynamic context assembly, tools, journeys, canned responses, domain understanding, and end-to-end traceability to keep customer-facing agents predictable [S44]. 47Billion also highlights Parlant's guideline system as a more reliable alternative to stuffing behavior into system prompts [S23].

## GitLab Duo Agent Platform

GitLab Duo Agent Platform reached general availability with agentic AI across the software lifecycle [S22]. It provides agentic chat for analysis, coding, CI/CD, and security tasks; foundational agents such as Planner and Security Analyst at GA; custom agents and flows through the AI Catalog; external agents such as Claude Code and Codex CLI; MCP client support for Jira, Confluence, Slack, Playwright, and Grafana; model selection; governance visibility; group-based access controls; and self-hosted model options [S22].

The key enterprise pattern is not only coding assistance. GitLab is turning agents into governed lifecycle actors with planning, security, CI, code review, and workflow automation surfaces [S22].

## Cost and reliability considerations

47Billion's production article gives practical cost ranges: simple workflows around $0.10-$0.50/task, CrewAI multi-agent around $0.50-$2.00, AutoGen multi-agent around $2.00-$5.00, and LlamaIndex RAG around $0.20-$1.00 [S23]. It recommends starting with simple workflows, using human-in-the-loop checkpoints, monitoring token budgets from day one, constraining tools, validating outputs, using conservative temperatures, and rolling out progressively [S23].

The main lesson is that framework choice should follow autonomy level. Linear prompt chains and branching workflows are easier to debug; tool-using agents need strict tool and output controls; structured multi-agent systems can be production viable with heavy guardrails; open-ended multi-agent systems remain risky for critical paths [S23].
