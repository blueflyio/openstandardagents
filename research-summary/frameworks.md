# Open-source frameworks, repositories and npm packages

Source review date: 2026-05-23. GitHub star counts are point-in-time metadata gathered with GitHub CLI on 2026-05-23.

## Repository snapshot

| Project | Stars | License | Latest release | Primary purpose |
| --- | ---: | --- | --- | --- |
| microsoft/autogen | 58,307 | CC-BY-4.0 reported by GitHub CLI | python-v0.7.5, 2025-09-30 | Multi-agent framework; maintenance mode in reviewed 2026 README [S25]. |
| CrewAIInc/CrewAI | 52,002 | MIT | 1.14.5, 2026-05-18 | Role-based crews and event-driven flows [S24]. |
| run-llama/llama_index | 49,606 | MIT | v0.14.22, 2026-05-14 | RAG, indexing, document agents and workflows [S26]. |
| langchain-ai/langgraph | 32,745 | MIT | langgraph-sdk 0.3.15, 2026-05-22 | Durable graph-based agent orchestration [S23][S37]. |
| openai/openai-agents-python | 26,594 | MIT | v0.17.3, 2026-05-19 | Multi-agent workflows, tools, guardrails, tracing [S36]. |
| a2aproject/A2A | 23,928 | Apache-2.0 | v1.0.0, 2026-03-12 | Agent2Agent protocol spec and examples [S09]. |
| ag-ui-protocol/ag-ui | 13,762 | MIT | 2026-05-22 release | Agent-user interaction protocol [S38]. |
| openai/openai-agents-js | 3,096 | MIT | v0.11.5, 2026-05-22 | TypeScript OpenAI Agents SDK [S22]. |
| agent-network-protocol/AgentNetworkProtocol | 1,301 | Apache-2.0 | V1.0, 2025-05-19 | Agent Network Protocol specification [S11]. |
| i-am-bee/ACP | 1,004 | Apache-2.0 | v1.0.3, 2025-08-21 | ACP protocol repo; archived after A2A consolidation [S39]. |
| langchain-ai/agent-protocol | 592 | MIT | langchain-protocol 0.0.15, 2026-05-01 | Framework-agnostic agent serving API [S12]. |

## Npm package snapshot

| Package | Version | Role |
| --- | --- | --- |
| `@bluefly/openstandardagents` | 0.5.1 | OSSA CLI, schemas, validation, exports, trust, MCP server [S04]. |
| `@bluefly/duadp` | 0.1.4 | DUADP TypeScript SDK and CLI [S02]. |
| `@openai/agents` | 0.11.5 | TypeScript OpenAI Agents SDK [S22]. |
| `@modelcontextprotocol/sdk` | 1.29.0 | TypeScript MCP SDK [S07]. |
| `@langchain/langgraph` | 1.3.2 | TypeScript LangGraph core package [S23]. |
| `@ag-ui/client` | 0.0.53 | AG-UI client SDK [S10]. |
| `@ag-ui/core` | 0.0.53 | AG-UI types and runtime schemas [S10]. |
| `@a2a-js/sdk` | 0.3.13 | A2A server/client SDK [S09]. |

## OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight framework for multi-agent workflows. The TypeScript docs describe a small set of primitives: agents, sandbox agents, agents as tools/handoffs, guardrails, sessions, human-in-the-loop and tracing [S22]. The Python repo adds that the SDK is provider-agnostic and supports OpenAI APIs plus 100+ other LLMs [S36].

The SDK's strengths are simplicity, built-in agent loop, function tools with schema validation, MCP server tool calling, sandbox execution, sessions and tracing [S22]. Its guardrail documentation is important: input and output guardrails validate user input and final output, while tool guardrails are needed when checks must run around individual function-tool calls [S22]. That distinction matters for security because handoffs and hosted tools may follow different enforcement paths [S22].

Use OpenAI Agents SDK when a team wants a compact TypeScript/Python agent framework with first-party tracing, tool calling, handoffs, sandbox agents and OpenAI model integration. Add external policy enforcement for high-risk side effects because SDK guardrails are not a complete IAM model [S18][S20][S22].

## LangGraph

LangGraph models agent workflows as graphs of state, nodes and edges. Nodes pass messages along edges in discrete "super-steps"; execution ends when all nodes are inactive and no messages are in transit [S23]. Its key production features are durable execution, persistence, human-in-the-loop interrupts and memory [S23].

When compiled with a checkpointer, LangGraph persists state snapshots at each step and organizes them by thread. This enables pause/resume, time travel debugging, fault tolerance and conversational memory [S23]. Interrupts can pause graph execution and resume later with a command, which is the right primitive for approval gates and manual inspection [S23].

Use LangGraph when agent workflows are long-running, stateful, multi-step, resumable or need human review. Its graph model is more explicit than a black-box agent loop and therefore easier to instrument with SLOs, evals and checkpoint-level audit trails [S23][S42].

## CrewAI

CrewAI is a Python framework for orchestrating role-playing autonomous agents. It presents two major primitives: Crews for collaborative intelligence and Flows for production-oriented event-driven workflows with granular control [S24]. Its repo describes itself as independent of LangChain and optimized for speed, flexibility and low-level customization [S24].

CrewAI is attractive for structured multi-agent content generation, role assignment, business-process automation and agent collaboration patterns. 47Billion's production guidance rates structured multi-agent systems as "cautiously yes" for production when paired with heavy guardrails, human-in-the-loop checkpoints and progressive rollout; it rates open-ended multi-agent systems as not yet suitable for critical paths [S28].

## Microsoft AutoGen

AutoGen is an influential Microsoft multi-agent framework for autonomous or human-supervised AI applications [S25]. The current README places AutoGen in maintenance mode: no new features or enhancements, community-managed going forward, with bug fixes and critical security patches continuing. New users are directed to Microsoft Agent Framework, described as the enterprise-ready successor with stable APIs, multi-agent orchestration, multi-provider model support and A2A/MCP interoperability [S25].

AutoGen remains important historically and for existing deployments, but greenfield production work should evaluate Microsoft Agent Framework or other actively developed runtimes first [S25].

## LlamaIndex

LlamaIndex began as an open-source RAG framework and, in the reviewed 2026 materials, positions itself as infrastructure for agentic document processing, parsing, extraction, indexing and document agents [S26]. Its agents are systems that use an LLM, memory and tools to handle user inputs; common classes include `FunctionAgent`, `ReActAgent`, `CodeActAgent` and `AgentWorkflow` [S26].

The practical LlamaIndex pattern is: ingest documents, build a vector index, expose retrieval as a tool, and let a function-calling agent use that tool alongside other functions [S26]. This makes LlamaIndex strong for knowledge-heavy workflows, enterprise document processing, RAG pipelines and document-centric agent systems.

## GitLab Duo Agent Platform

GitLab Duo Agent Platform became generally available in January 2026 [S27]. It brings agentic AI into the software development lifecycle through context-aware Duo Agentic Chat across GitLab Web UI and IDEs, using lifecycle context from issues, merge requests, pipelines, security findings and more [S27].

The GA release includes custom agents through the AI Catalog, where teams create, publish, manage and share custom agents and flows. It also integrates external agents such as Anthropic Claude Code and OpenAI Codex CLI for code generation, code review and analysis inside GitLab workflows [S27]. The local OSSA repository includes reusable GitLab Duo Agent Platform integration artifacts for OSSA validation, demonstrating how OSSA manifests can be validated in GitLab pipelines and agent flows [S05].

## OSSA and DUADP packages in context

`@bluefly/openstandardagents` and `@bluefly/duadp` are not general-purpose LLM agent frameworks like CrewAI or LangGraph. They are infrastructure standards packages:

- OSSA defines the portable agent contract, schema, validation, export, trust and governance metadata [S03][S04][S05].
- DUADP provides decentralized discovery and identity evidence for agents published across a federated mesh [S01][S02].

Together they address gaps that application frameworks leave open: agent identity, manifest portability, schema conformance, trust tiers, registry/discovery and policy-aware publishing [S01][S03][S05].

## Parlay and similarly named projects

Searches for "Parlay" found a GitHub project named `sh4shv4t/Parlay`, but it is an OpenEnv-compliant reinforcement-learning negotiation environment where LLM agents learn game theory and bluffing through self-play, not a general multi-agent RAG framework [S26]. For production multi-agent RAG, the reviewed sources point more strongly to LangGraph, LlamaIndex, CrewAI and enterprise orchestrators such as GitLab Duo or UnifAI-style architectures [S23][S24][S26][S27].

## Cost and production considerations

47Billion's production guide recommends matching framework and autonomy level to the task. It treats simple workflows as production ready with ordinary validation and monitoring, tool-using agents as production ready with guardrails, structured multi-agent systems as cautiously production ready with heavy checkpoints, and open-ended multi-agent systems as not yet ready for critical paths [S28].

Cost control is a framework selection issue. The same task can vary widely in token count and tool count depending on orchestration strategy. Recommendations across sources converge on: set budgets before rollout, log per-step token/cost, use smaller specialized models where possible, use circuit breakers for runaway loops, and watch eval quality, latency, error rate and cost separately [S28][S42].

## Selection guidance

- Need portable manifest, governance, export and conformance: OSSA [S03][S04].
- Need decentralized discovery and DID-backed evidence: DUADP or ANP [S01][S11].
- Need tool/data connectivity: MCP SDKs and servers [S07].
- Need long-running stateful workflows: LangGraph [S23].
- Need role-based multi-agent teams: CrewAI [S24].
- Need document/RAG workflows: LlamaIndex [S26].
- Need first-party OpenAI agent loop, tracing, handoffs and sandbox agents: OpenAI Agents SDK [S22][S36].
- Need DevSecOps lifecycle-native agents: GitLab Duo Agent Platform [S27].
