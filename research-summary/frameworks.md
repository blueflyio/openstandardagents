# Open-Source Frameworks, Projects, and npm Packages

Compiled on May 19, 2026.

## Repository and package snapshot

GitHub counts were gathered with GitHub CLI on May 19, 2026 [S24].

| Project                                     | Purpose                               |  Stars | Latest release observed                | License        |
| ------------------------------------------- | ------------------------------------- | -----: | -------------------------------------- | -------------- |
| openai/openai-agents-python                 | Python multi-agent SDK                | 26,464 | v0.17.3, May 19, 2026                  | MIT            |
| openai/openai-agents-js                     | TypeScript/JavaScript Agents SDK      |  3,061 | v0.11.4, May 12, 2026                  | MIT            |
| langchain-ai/langgraph                      | Graph runtime for stateful agents     | 32,397 | 1.2.0, May 12, 2026                    | MIT            |
| crewAIInc/crewAI                            | Role/task-based multi-agent framework | 51,709 | 1.14.5, May 18, 2026                   | MIT            |
| microsoft/autogen                           | Multi-agent programming framework     | 58,169 | python-v0.7.5, Sep 30, 2025            | CC-BY-4.0, MIT |
| run-llama/llama_index                       | RAG, workflows, and agent framework   | 49,501 | v0.14.22, May 14, 2026                 | MIT            |
| langchain-ai/agent-protocol                 | Framework-agnostic agent server API   |    588 | langchain-protocol 0.0.15, May 1, 2026 | MIT            |
| agent-network-protocol/AgentNetworkProtocol | Agent network protocol                |  1,296 | V1.0, May 19, 2025                     | Apache-2.0     |
| ag-ui-protocol/ag-ui                        | Agent-user interaction protocol       | 13,645 | release/2026-05-18                     | MIT            |
| mondaycom/agent-tool-protocol               | Code-first tool execution protocol    |     96 | none observed                          | MIT            |

## OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight framework for building multi-agent
workflows. The Python documentation describes four core primitives: agents,
agents-as-tools or handoffs, guardrails, and tracing [S21]. Agents are LLMs
equipped with instructions and tools; handoffs delegate to specialists;
guardrails validate inputs and outputs; tracing visualizes, debugs, evaluates,
and monitors runs [S21].

The SDK also supports MCP server tool calling, sessions for memory, human in
the loop, sandbox agents with isolated workspaces, realtime voice agents, and
provider customization through Responses API and Chat Completions paths [S21].
The `@openai/agents` npm package version 0.11.4 has an MIT license, depends on
the OpenAI SDK and OpenAI agent subpackages, and includes npm provenance
attestations [S34].

OpenAI's SDK is especially attractive for teams already using OpenAI APIs and
looking for a small set of explicit primitives rather than a heavy workflow
abstraction. It is less opinionated than CrewAI and less graph-centric than
LangGraph.

## LangGraph

LangGraph is a low-level orchestration framework and runtime for building,
managing, and deploying long-running, stateful agents [S22]. Its core value is
durable execution, streaming, human-in-the-loop interrupts, persistence, memory,
and visibility through LangSmith [S22].

LangGraph models agent workflows as graphs of nodes and edges, but it does not
abstract prompts or architecture away from the developer. It is well suited for
systems that need loops, retries, branching, checkpointing, state inspection,
and resumability [S22].

LangGraph also sits in LangChain's broader stack: LangChain provides model/tool
abstractions, LangGraph provides orchestration, LangSmith provides tracing and
evaluation, and LangGraph Platform/LangSmith Deployment provide deployment
infrastructure [S22].

## CrewAI

CrewAI is an open-source framework for orchestrating autonomous agents and
complex workflows [S23]. Its two main abstractions are Flows and Crews. Flows
define structured, event-driven workflows, state, and control flow; Crews are
teams of autonomous role-playing agents that collaborate to solve delegated
tasks [S23].

CrewAI's product positioning emphasizes production-ready multi-agent systems
that balance autonomy with control. It also reports more than 100,000
developers certified through community courses [S23]. In practitioner
experience, 47Billion found CrewAI faster to develop with than AutoGen for a
table-reservation workflow and positioned it as a pragmatic middle ground for
structured multi-step tasks [S27].

CrewAI is a good fit when the team wants explicit roles and tasks, moderate
autonomy, and production flow control without writing a graph by hand.

## Microsoft AutoGen

AutoGen is a programming framework for agentic AI and remains one of the most
starred agent repositories [S24]. Search results and repository metadata show
58,169 stars on May 19, 2026, with latest release python-v0.7.5 published
September 30, 2025 [S24].

Recent public summaries indicate that AutoGen is moving into maintenance mode
with Microsoft's newer Agent Framework as the successor path. Existing users
should review migration guidance, while new enterprise projects should evaluate
the newer Microsoft Agent Framework where stable APIs and long-term support are
required [S24].

AutoGen's historical strength is conversation-based multi-agent collaboration
with human-in-the-loop and code execution support. The drawback reported by
47Billion is high token usage and difficult debugging when agents converse in
circles [S27].

## LlamaIndex

LlamaIndex defines an agent as a system that uses an LLM, memory, and tools to
handle user input [S32]. It supports FunctionAgent for provider-native tool
calling, ReActAgent and CodeActAgent for prompt-based strategies, and
AgentWorkflow for multi-agent handoffs [S32].

LlamaIndex Workflows are event-driven and step-based. They divide applications
into steps triggered by events and emitting further events, which supports
loops, branches, state, async execution, checkpointing, and complex RAG flows
without forcing all control logic into graph edges [S33].

LlamaIndex is strongest for RAG and document-heavy agentic systems: document
loading, indexing, retrieval, citation, query planning, reranking, corrective
RAG, and agentic workflows that work over knowledge bases [S32][S33].

## GitLab Duo Agent Platform

GitLab announced general availability for GitLab Duo Agent Platform as a way to
bring agentic AI across the software development lifecycle [S29]. GitLab argues
that code writing is only about 20% of developer time, so agentic AI must also
address planning, code review, CI/CD, security, and downstream workflow
bottlenecks [S29].

The platform includes Agentic Chat across the GitLab Web UI and IDEs,
foundational agents, custom agents through the AI Catalog, external agents
including Claude Code and Codex CLI, and flows for issue-to-MR, CI conversion,
pipeline fixes, code review, and IDE software development [S29].

It also includes an MCP Client for connecting IDE-based GitLab Duo workflows to
external tools such as Jira, Confluence, Slack, Playwright, and Grafana, with
workspace/user configuration, group-level controls, user approval flow, and IDE
extension support [S29]. Governance features include usage visibility,
namespace access controls, model selection, self-hosted model options, and
support for GitLab.com, Self-Managed, and Dedicated deployments in the GitLab
18.8 release cycle [S29].

## OSSA and DUADP npm packages

### @bluefly/openstandardagents

`@bluefly/openstandardagents` version 0.5.1 is the main OSSA npm package. It is
a CLI and TypeScript SDK for defining agent manifests and exporting them to
deployment targets [S25]. The package metadata reports:

- Published: March 28, 2026 [S25].
- Weekly downloads: 63 [S25].
- License: Apache-2.0 [S25].
- Unpacked size: 10.7MB across 2,033 files [S25].
- Dependencies: 75 [S25].
- CLI bins: `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`,
  `ossa-mcp` [S25].
- Production exports include LangChain, MCP, npm, and agent-skills; additional
  beta/alpha exports cover CrewAI, Docker, Kubernetes, GitLab Duo, Cursor,
  Drupal, OpenAI Agents SDK, A2A, and more [S25].

The package is best understood as the implementation vehicle for the OSSA
contract layer: it validates YAML manifests, migrates spec versions, exports to
platform scaffolds, runs an MCP server, generates agent cards, and manages
skills [S25].

### @bluefly/duadp

`@bluefly/duadp` version 0.1.4 is the official TypeScript SDK for DUADP [S26].
The package metadata reports:

- Published: March 9, 2026 [S26].
- Weekly downloads: 17 [S26].
- License: Apache-2.0 [S26].
- Unpacked size: 169KB across 23 files [S26].
- Dependencies: 7 [S26].
- Exports: client, server router, validate, crypto, DID resolution, and
  conformance testing [S26].

The SDK can consume DUADP nodes, turn Express apps into DUADP nodes, validate
OSSA resource manifests, sign and verify resources, resolve DIDs, and run
protocol conformance tests [S26].

## Other npm packages

| Package                       | Purpose                     | Version observed |             Weekly downloads | Notes                                                   |
| ----------------------------- | --------------------------- | ---------------- | ---------------------------: | ------------------------------------------------------- |
| `@modelcontextprotocol/sdk`   | MCP TypeScript SDK          | 1.29.0           |                        36.0M | Tools, resources, prompts, Streamable HTTP [S37]        |
| `@openai/agents`              | OpenAI Agents SDK for JS/TS | 0.11.4           | not shown by latest endpoint | MIT, npm provenance attestation [S34]                   |
| `@ag-ui/client`               | AG-UI client SDK            | 0.0.53           |                       526.1K | HttpAgent, middleware, event/state handling [S35]       |
| `@mondaydotcomorg/atp-server` | ATP server                  | 0.25.0           |                         7.1K | Sandbox execution, OpenAPI/MCP, audit [S36]             |
| `@mondaydotcomorg/atp-client` | ATP client                  | 0.24.0           |                         7.0K | Execute code, pause/resume, LLM/approval handlers [S38] |

## Parlay / Parlant note

The user request named "Parlay." Public search results surfaced `sh4shv4t/Parlay`
as an RL negotiation environment for LLM agents rather than a general
production agent framework, and `emcie-co/parlant` as a context-engineering
framework for controlled customer-facing agents [S39]. Because the source
signal is ambiguous, this report treats Parlay as a niche agent environment and
does not rank it with OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, or
LlamaIndex.

## Selection guidance

- Use OpenAI Agents SDK when you want minimal primitives, Python/TypeScript
  ergonomics, OpenAI-first tracing, guardrails, handoffs, and MCP tool calls.
- Use LangGraph when state, cycles, checkpointing, long-running execution, and
  human interrupts are primary requirements.
- Use CrewAI when roles, tasks, and structured multi-agent execution are the
  easiest mental model for the team.
- Use LlamaIndex when the agent's primary work is over documents, indexes,
  citations, RAG, and query planning.
- Use GitLab Duo Agent Platform when the agent surface is the DevSecOps
  lifecycle and governance must stay inside GitLab.
- Use OSSA when the problem is portability and governance of agent definitions
  across frameworks and deployment targets.
- Use DUADP when the problem is discovering, publishing, federating, and
  verifying agents, skills, and tools across organizational boundaries.
