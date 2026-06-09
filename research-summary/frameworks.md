# Open-source frameworks, platforms, repositories, and npm packages

Compiled on June 9, 2026.

## Repository and package signals

Point-in-time repository metrics were fetched with the GitHub CLI on June 9,
2026 [S32]. npm download data covers the week May 27-June 2, 2026 [S06][S07].

| Project | Purpose | Stars | Forks | Package/download signal |
| --- | --- | ---: | ---: | --- |
| Microsoft AutoGen | Multi-agent conversation framework | 58,801 | 8,873 | Maintenance mode; new projects directed to Microsoft Agent Framework [S29] |
| CrewAI | Crews and event-driven multi-agent flows | 53,127 | 7,430 | Python framework [S28] |
| LlamaIndex | RAG, document agents, workflows | 50,028 | 7,527 | Python and TypeScript packages [S30] |
| LangGraph | Stateful graph orchestration | 34,250 | 5,751 | LangChain ecosystem [S27] |
| OpenAI Agents Python | Lightweight multi-agent SDK | 27,017 | 4,173 | Python SDK; JS package below [S26] |
| A2A | Agent-to-agent protocol | 24,206 | 2,453 | Protocol/repo, not framework [S20] |
| AG-UI | Agent-to-UI protocol | 14,157 | 1,268 | Protocol/repo [S21] |
| MCP TypeScript SDK | MCP clients and servers | 12,632 | 1,918 | 35,499,180 npm downloads/week [S07] |
| OpenAI Agents JS | Agents SDK for JS/TS | 3,187 | 805 | 1,066,478 npm downloads/week [S07] |
| ANP | Agent network protocol | 1,318 | 92 | Protocol/repo [S22] |
| LangChain Agent Protocol | Agent serving API | 604 | 52 | Protocol/repo [S23] |
| monday ATP | Sandboxed code execution protocol | 98 | 10 | 6,923 npm downloads/week [S07] |
| Harvard APTT | Agent protocol map | 0 | 1 | Educational/research map [S09] |
| OSSA | Agent contract, CLI, exports | GitLab repo | GitLab repo | `@bluefly/openstandardagents@0.5.6`; 42 downloads/week [S04][S06] |
| DUADP | Decentralized discovery SDK | GitLab repo | GitLab repo | `@bluefly/duadp@0.1.7`; 9 downloads/week [S05][S06] |

## OpenAI Agents SDK

OpenAI's Agents SDK is a lightweight framework for multi-agent workflows. The
Python repository describes provider-agnostic support for OpenAI Responses and
Chat Completions APIs plus 100+ other LLMs [S26]. The central primitives are:

- Agents: LLMs configured with instructions, tools, guardrails, and handoffs.
- Handoffs and agents-as-tools: delegation to specialized agents.
- Tools: functions, MCP tools, hosted tools, and other action surfaces.
- Guardrails: configurable input and output validation.
- Sessions: conversation history across runs.
- Tracing: automatic spans for runs, LLM calls, tool executions, handoffs, and
  guardrail checks [S26].

The SDK is a good fit when the team wants explicit orchestration primitives with
built-in tracing and safety checks but does not need a full graph runtime. Its
JavaScript package `@openai/agents` had 1,066,478 downloads for the npm week
ending June 2, 2026 [S07].

## LangGraph

LangGraph is a low-level orchestration framework and runtime for long-running,
stateful agents [S27]. Its core strengths are durable execution, streaming,
human-in-the-loop interrupts, persistence, comprehensive memory, debugging
through LangSmith, and production deployment infrastructure [S27].

LangGraph models workflows as graphs with nodes, edges, and state. A checkpointer
saves graph state at execution boundaries, enabling resume, time travel,
conversational memory, and human review [S27]. This makes it a strong option for
workflows where agent state must survive failures, approval pauses, and
multi-step execution.

LangGraph complements LangChain Agent Protocol: Agent Protocol standardizes how
to call agents as services, while LangGraph supplies a runtime for building and
deploying stateful agents [S23][S27].

## CrewAI

CrewAI is a Python framework for orchestrating role-playing autonomous agents
that collaborate on complex tasks [S28]. Its core abstractions are agents,
tasks, crews, processes, and flows. Agents have roles, goals, backstories, tools,
memory, and optional delegation [S28]. Tasks define assignments and expected
outputs. Crews execute tasks sequentially or hierarchically [S28].

CrewAI Flows provide the more production-oriented layer: event-driven workflows
with state management, branching, loops, and decorators such as `@start`,
`@listen`, and `@router` [S28]. The framework is strongest when the domain maps
naturally to team-like specialization, such as research, content generation,
operations triage, or business process automation.

## Microsoft AutoGen and Microsoft Agent Framework transition

AutoGen pioneered many multi-agent conversation patterns. Microsoft Research
describes it as an open-source programming framework for building AI agents and
facilitating cooperation among multiple agents [S29]. AutoGen v0.4 introduced an
asynchronous, event-driven architecture, stronger observability, reusable
components, and more flexible collaboration patterns [S29].

The current AutoGen GitHub repo warns that AutoGen is in maintenance mode and
will not receive new features or enhancements. It recommends Microsoft Agent
Framework for new projects and provides migration guidance [S29]. AutoGen
therefore remains important historically and for existing systems, but it is not
the preferred greenfield choice in the Microsoft ecosystem [S29].

## LlamaIndex

LlamaIndex is a data framework for LLM-powered agents, document agents,
workflows, RAG, extraction, and indexing [S30]. Its strongest surface area is
context augmentation: ingesting, parsing, indexing, retrieving, reranking, and
making organizational data available to models [S30].

For agentic applications, LlamaIndex offers agents, tools, workflows, and
AgentWorkflow for multi-agent handoffs and shared state [S30]. Workflows are
event-driven and async-first; steps emit and consume events, can branch, loop,
parallelize, persist state, recover from failures, and run as REST services
[S30]. LlamaIndex is a good fit when the agent's core value depends on
documents, search, extraction, or RAG pipelines.

## GitLab Duo Agent Platform

GitLab Duo Agent Platform reached general availability in January 2026 [S31].
It packages agentic AI into the software delivery lifecycle rather than only
offering a framework library. Its three agent types are:

- Foundational agents: prebuilt GitLab agents, such as planner and security
  analyst patterns, available out of the box [S31].
- Custom agents: agents created by teams through the AI Catalog with
  organization-specific context, standards, capabilities, and guardrails [S31].
- External agents: integrated provider agents such as Anthropic Claude Code and
  OpenAI Codex, triggered through GitLab workflows and backed by GitLab-managed
  credentials [S31].

The AI Catalog is the central repository for discovering, creating, publishing,
managing, and sharing agents and flows across an organization [S31]. GitLab is
important because it shows how agent platforms are moving from standalone chat
and coding tools toward enterprise workflow surfaces with identity, credentials,
catalogs, and DevSecOps context.

## OSSA npm package and local repository

The local `package.json` identifies the package as `@bluefly/openstandardagents`
version `0.5.1`, Apache-2.0, with CLI binaries `ossa`, `ossa-dev`,
`ossa-version`, `ossa-validate-all`, and `ossa-mcp` [S03]. Its exports include
schema versions, validation, generation, migration, type exports, OpenAPI
extensions, mesh, agent-card generation, SDK, version management, MCP server,
trust service, kagent integration, and workspace validation [S03].

The npm registry reports the latest public package as
`@bluefly/openstandardagents@0.5.6`, description "OSSA - Open Standard for
Software Agents. Spec-first schemas, validator, and CLI", Apache-2.0, created
November 19, 2025 and modified June 3, 2026 [S04]. The package had 42 downloads
for the week ending June 2, 2026 [S06].

OSSA's key role is portability. Its public site says one OSSA manifest can
export to 23+ targets, including LangChain, CrewAI, Kubernetes, Docker, GitLab
Duo, Claude Code, Cursor, Drupal, MCP, A2A, and npm [S02]. It also ships an MCP
server with tools for validating, scaffolding, converting, inspecting,
generating agent cards, publishing, listing, workspace management, diffing, and
migration [S02].

## DUADP npm package and project surface

The npm registry reports `@bluefly/duadp@0.1.7` as a TypeScript SDK for the
Decentralized Universal AI Discovery Protocol, Apache-2.0, with a `duadp` CLI,
created March 6, 2026 and modified June 3, 2026 [S05]. Its weekly download
count for the npm period ending June 2, 2026 was 9 [S06].

The DUADP site positions the project as "DNS for AI agents" and "the missing
discovery layer" [S01]. It includes DNS TXT and WebFinger discovery, gossip
federation, DID-based node identity, GAID lookup handles, manifest signatures,
provenance, revocation, trust tiers, governance endpoints, and 17 MCP tools
[S01]. DUADP is not a workflow framework; it is a discovery, identity, and trust
surface for agents to find and verify each other [S01].

## Cost and production considerations

47Billion's production guide emphasizes progressive rollout and cost monitoring
before broad deployment [S33]. Its cost examples place simple workflows around
`$0.10-$0.50`, CrewAI multi-agent patterns around `$0.50-$2.00`, more complex
multi-agent patterns around `$2.00-$5.00`, and LlamaIndex RAG queries around
`$0.20-$1.00`, depending on workload and token usage [S33]. The exact values
should be treated as examples, not universal pricing.

The practical pattern is to start simple, prove a narrow workflow, instrument
cost per session, add guardrails and HITL checkpoints, then expand to
multi-agent orchestration only when needed [S33]. Framework choice should follow
the workload:

- Use LangGraph for durable, stateful, long-running workflows [S27].
- Use CrewAI when role-based collaboration is the organizing model [S28].
- Use LlamaIndex when RAG, document parsing, extraction, or data connectors are
  central [S30].
- Use OpenAI Agents SDK when lightweight agent/handoff/guardrail/tracing
  primitives are enough [S26].
- Use GitLab Duo Agent Platform when the desired surface is DevSecOps workflow
  integration rather than a standalone agent runtime [S31].
- Use OSSA to keep manifests portable across frameworks and platforms [S02].
- Use DUADP to make agents discoverable and verifiable across decentralized
  registries [S01].
