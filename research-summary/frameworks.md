# Open-Source Frameworks, Projects, and npm Packages

Prepared: May 15, 2026. Tether citation IDs are defined in
`reading-list.md`.

## Repository snapshot

GitHub star counts were collected with the GitHub API on May 15, 2026 [T54].

| Project | Purpose | Stars | Notes |
| --- | --- | ---: | --- |
| microsoft/autogen | Multi-agent framework and runtime | 58,046 | Event-driven redesign, AgentChat teams, Python/.NET direction [T54] |
| crewAIInc/crewAI | Role/task/crew/process multi-agent framework | 51,449 | Practical structured workflows [T25][T54] |
| run-llama/llama_index | RAG, data, workflow, and agent framework | 49,429 | Strong for document/RAG workloads [T25][T54] |
| langchain-ai/langgraph | Stateful graph runtime for agents | 32,095 | State, nodes, edges, checkpoints, interrupts [T12][T54] |
| openai/openai-agents-python | OpenAI Agents SDK | 26,326 | Provider-agnostic, 100+ LLMs, MIT/open source [T35][T54] |
| a2aproject/A2A | Agent2Agent protocol | 23,787 | Protocol repo and spec [T08][T54] |
| ag-ui-protocol/ag-ui | Agent-to-UI protocol | 13,565 | Event streams for front ends [T10][T54] |
| modelcontextprotocol/typescript-sdk | MCP TypeScript SDK | 12,429 | Official SDK [T06][T54] |
| modelcontextprotocol/modelcontextprotocol | MCP spec/docs repo | 8,111 | GitHub API redirected specification lookup here [T54] |
| agent-network-protocol/AgentNetworkProtocol | Agentic web networking protocol | 1,297 | DID/meta-protocol/application stack [T11][T54] |
| i-am-bee/acp | Agent Communication Protocol | 1,005 | Merging into A2A [T13][T34][T54] |
| langchain-ai/agent-protocol | Agent serving API | 582 | Runs, threads, store [T12][T54] |
| mondaycom/agent-tool-protocol | ATP code-execution protocol | 96 | Early-stage public repo [T32][T54] |
| sh4shv4t/Parlay | RL negotiation environment | 0 | Specialized environment, not a broad agent framework [T54] |

## OpenAI Agents SDK

OpenAI's Agents SDK is a lightweight framework for multi-agent workflows. The
README says it is provider-agnostic, supports the OpenAI Responses and Chat
Completions APIs, and supports 100+ other LLMs [T35].

Core concepts:

- Agents: LLMs configured with instructions, tools, guardrails, and handoffs.
- Sandbox Agents: agents preconfigured to work with containers or local
  sandboxes over long horizons.
- Agents-as-tools and handoffs: delegation to other agents.
- Tools: functions, MCP, and hosted tools.
- Guardrails: input/output validation.
- Human in the loop.
- Sessions: conversation history management.
- Tracing: run tracking for debugging and optimization.
- Realtime Agents: voice support [T35].

OpenAI's SDK is a framework rather than an interoperability protocol. It can
consume MCP tools and implement multi-agent handoffs, but it does not define
network-wide discovery or portable manifest governance by itself [T35].

## LangGraph

LangGraph is LangChain's stateful graph runtime for agentic and multi-agent
applications. The LangChain Agent Protocol post positions LangGraph as part of a
broader interoperability story: LangGraph Studio connects to servers
implementing Agent Protocol, and other frameworks can be wrapped as sub-agents
inside LangGraph nodes [T12].

Core primitives:

- State.
- Nodes.
- Edges.
- Graph execution with cycles.
- Checkpointing and persistence.
- Interrupts and human-in-the-loop.
- Integration with Agent Protocol serving surfaces [T12].

LangGraph's strength is visibility and control over complex stateful flows. It
is more appropriate when agents need branching, loops, resumability, and
explicit execution graphs than when a simple linear prompt chain is enough.

## CrewAI

CrewAI is a popular production-oriented framework for role/task/crew/process
multi-agent workflows. 47Billion's production report describes CrewAI as "the
pragmatic middle ground" because it thinks in tasks rather than unconstrained
conversations [T25]. In their table reservation comparison, a CrewAI version
reached a working system faster than an AutoGen version because the task-based
flow was more structured [T25].

Strengths:

- Roles, goals, tasks, crews, process ordering.
- More predictable than open-ended multi-agent conversations.
- Good fit for structured multi-step tasks.

Risks:

- Less flexible for open-ended dynamic exploration.
- Memory across tasks requires care.
- Deep customization may require workarounds [T25].

## AutoGen

AutoGen models agents as participants in conversations. 47Billion found this
powerful for exploratory tasks and code-execution agents, but expensive and
harder to debug in production because agents can loop, disagree, and consume
large token budgets [T25].

Strengths:

- Natural conversation model for exploratory collaboration.
- Human-in-the-loop support.
- Good for code execution and multi-perspective workflows.

Risks:

- High token use because agents share conversation history.
- Debugging multi-agent loops can be difficult.
- Deterministic workflows may be simpler without AutoGen [T25].

## LlamaIndex

LlamaIndex is strongest for RAG-heavy and document-centric workflows. 47Billion
used it for note summarization and insurance-helper workflows that extracted
structured data from unstructured documents [T25].

Strengths:

- Document processing and retrieval.
- Workflow steps and event-driven architecture.
- RAG integrations.

Risks:

- Not the first choice for pure orchestration.
- Advanced use cases may require custom debugging and error-handling tooling
  [T25].

## Parlay

Parlay appears in the requested project list, but current public evidence
supports classifying it as a specialized reinforcement-learning negotiation
environment rather than a general agent protocol or production framework. The
GitHub API snapshot showed zero stars on May 15, 2026 [T54]. It should be
tracked only if negotiation environments or OpenEnv-style RL benchmarks matter
to a specific research stream.

## GitLab Duo Agent Platform

GitLab announced general availability of GitLab Duo Agent Platform on January
15, 2026 [T36]. It is not an open-source framework in the same category as
LangGraph or CrewAI, but it is a major production agent platform for the
software delivery lifecycle.

GA features:

- Agentic Chat across GitLab Web UI and IDEs with multi-step reasoning and
  autonomous actions grounded in issues, merge requests, pipelines, security
  findings, and project data [T36].
- Foundational agents: Planner Agent and Security Analyst Agent at general
  availability [T36].
- Custom agents through the AI Catalog, where teams create, publish, manage,
  and share agents and flows [T36][T37].
- External agents, including Claude Code and Codex CLI, integrated into GitLab
  workflows [T36][T37].
- Foundational flows for issue-to-MR, GitLab CI/CD conversion, pipeline fixes,
  code review, and IDE software development [T36].
- Governance features: model selection, group-based access control, LDAP/SAML
  integration, usage/activity visibility, and self-hosted model support for
  self-managed deployments [T36][T37].

GitLab is important because it shows agentic AI moving into the system of record
for software delivery. Its platform surface also illustrates why identity,
traceability, policy, and model selection need to be built into agent platforms
from the start [T36][T37].

## OSSA npm package: `@bluefly/openstandardagents`

Verified npm metadata on May 15, 2026:

| Field | Value |
| --- | --- |
| Version | 0.5.1 |
| Description | OSSA - Open Standard for Software Agents; infrastructure bridge between MCP/A2A and deployment platforms |
| Homepage | https://openstandardagents.org |
| Repository | git+https://gitlab.com/blueflyio/ossa/openstandardagents.git |
| License | Apache-2.0 |

The package exposes the `ossa`, `ossa-dev`, `ossa-version`,
`ossa-validate-all`, and `ossa-mcp` binaries in this repository's `package.json`
[T52]. Its package description matches the website positioning: define once in
YAML and export to multiple platforms [T22][T52].

Practical purpose:

- Validate OSSA schemas.
- Generate/scaffold manifests.
- Export/migrate agent definitions.
- Provide SDK services for validation, generation, migration, version
  management, trust, and MCP server integration [T52].

## DUADP npm package: `@bluefly/duadp`

Verified npm metadata on May 15, 2026:

| Field | Value |
| --- | --- |
| Version | 0.1.4 |
| Description | Decentralized Universal AI Discovery Protocol SDK for TypeScript |
| Homepage | https://duadp.org |
| Repository | git+https://gitlab.com/blueflyio/duadp/duadp.git |
| License | Apache-2.0 |

The DUADP docs show TypeScript and Python SDK patterns for discovering nodes,
listing agents/skills/tools, searching, publishing agents, resolving GAIDs,
registering federation peers, and querying governance/health endpoints [T21].

Practical purpose:

- Publish and discover OSSA-compatible agents, skills, and tools.
- Operate or consume a federated discovery node.
- Resolve GAID/DID-style identities.
- Validate manifests and apply trust/governance metadata.
- Expose REST and MCP surfaces for discovery automation [T20][T21][T53].

## Framework selection guidance

| Need | Best-fit starting point |
| --- | --- |
| Strict tool access standard | MCP SDK/server [T05][T06] |
| Stateful branching/loops | LangGraph [T12] |
| Structured task teams | CrewAI [T25] |
| Exploratory multi-agent conversation | AutoGen [T25] |
| RAG/document workflows | LlamaIndex [T25] |
| OpenAI-oriented multi-agent workflows | OpenAI Agents SDK [T35] |
| Software delivery agents | GitLab Duo Agent Platform [T36][T37] |
| Portable manifest/export contract | OSSA [T22][T52] |
| Federated agent discovery | DUADP [T20][T53] |

## Cost considerations

47Billion's production report provides useful order-of-magnitude cost ranges
[T25]:

| Approach | Reported cost per task | Reported tokens per task |
| --- | ---: | ---: |
| Simple workflow | $0.10-$0.50 | 1,000-3,000 |
| CrewAI multi-agent | $0.50-$2.00 | 3,000-10,000 |
| AutoGen multi-agent | $2.00-$5.00 | 5,000-25,000 |
| LlamaIndex RAG | $0.20-$1.00 | 1,000-5,000 |

The directional lesson is more important than the exact numbers: multi-agent
conversation is multiplicative, not additive, because agents often see shared
history and call tools repeatedly [T25]. Cost monitoring, maximum iteration
counts, caching, and narrower agent scope are not optional in production.
