# Open-Source Frameworks, Repositories, and npm Packages

Prepared on June 1, 2026.

## Package focus: OSSA and DUADP

### `@bluefly/openstandardagents`

`@bluefly/openstandardagents` is the npm package for OSSA, the Open Standard
for Software Agents. The package description states the core positioning:
OSSA is an infrastructure bridge between agent protocols such as MCP/A2A and
deployment platforms such as Docker, Kubernetes, LangChain, CrewAI, Claude
Skills, and others [S04]. It is Apache-2.0, v0.5.1, published March 28, 2026,
with an unpacked size of about 10.7 MB, 75 dependencies, one dependent, and
23 published versions at collection time [S04].

Important package exports include schemas, validation, generation, migration,
types, OpenAPI extensions, mesh, agent-card generation, SDK, version
management, MCP server, marketplace skills catalog, kagent integration, trust
services, and workspace validation [S04][S06]. The CLI exposes `ossa` and
related binaries, and the package includes schemas, spec files, examples,
OpenAPI artifacts, templates, README, and changelog [S04][S06].

What this means in practice:

- OSSA manifests define the portable contract for an agent: role, LLM settings,
  tools, autonomy, compliance, observability, resources, teams, and extensions
  [S03][S04].
- OSSA integrates with MCP by referencing MCP servers/tools and with A2A by
  producing agent cards and agent-to-agent configuration [S02][S04].
- OSSA exports agent definitions to multiple platforms, reducing duplicated
  configuration across frameworks [S02][S04].
- OSSA embeds governance concepts such as GAID/DID identity, signed manifests,
  SBOM/provenance hooks, Cedar policies, compliance metadata, cost controls,
  and human oversight [S02][S04].

### `@bluefly/duadp`

`@bluefly/duadp` is the TypeScript SDK for the Decentralized Universal AI
Discovery Protocol. It is Apache-2.0, v0.1.4, published March 9, 2026, with an
unpacked size of about 169 KB, seven dependencies, an Express peer dependency,
and five published versions at collection time [S05].

The package provides client and server primitives:

- `DuadpClient` for consuming any DUADP node [S05].
- `createDuadpRouter` for turning an Express app into a DUADP-compliant node
  [S05].
- Validation helpers for OSSA resources [S05].
- Ed25519 signing and verification helpers [S05].
- DID resolution for `did:web` and `did:key` [S05].
- Conformance tests for protocol compliance [S05].

DUADP's core model is a node that serves discovery and registry endpoints:
well-known manifests, WebFinger, agents, skills, tools, publish, validate, and
federation endpoints [S05]. The public site adds governance and operations
surfaces, including 17 MCP tools for discovery, search, publishing,
federation, identity, governance, and health [S01].

## Framework and repository comparison

GitHub counts below were collected on June 1, 2026 with read-only GitHub
metadata.

| Project | Stars | License | Primary language | Main purpose | Maturity signal |
| --- | ---: | --- | --- | --- | --- |
| OpenAI Agents Python SDK | 26,818 | MIT | Python | Multi-agent workflows with agents, handoffs, guardrails, tracing | v0.17.4, May 26, 2026 [S33]. |
| OpenAI Agents JS SDK | 3,153 | MIT | TypeScript | JS/TS multi-agent and voice-agent workflows | v0.11.6, May 29, 2026 [S34]. |
| LangGraph | 33,542 | MIT | Python | Stateful graph execution for resilient agents | SDK v0.4.0, May 28, 2026 [S39]. |
| CrewAI | 52,584 | MIT | Python | Role-based crews and flows for multi-agent automation | v1.14.6, May 28, 2026 [S40]. |
| Microsoft AutoGen | 58,593 | CC-BY-4.0 | Python | Multi-agent applications; now maintenance mode | Latest release September 30, 2025 [S42]. |
| LlamaIndex | 49,823 | MIT | Python | Data/RAG/document-agent framework | v0.14.22, May 14, 2026 [S44]. |
| AgentNetworkProtocol | 1,310 | Apache-2.0 | HTML/docs | Agentic-web communication protocol | v1.0, May 19, 2025 [S25]. |
| LangChain Agent Protocol | 598 | MIT | Python | Runs/threads/store serving API | v0.0.16, May 28, 2026 [S27]. |
| AG-UI | 13,949 | MIT | TypeScript | Agent-to-frontend event protocol | Release May 29, 2026 [S24]. |
| monday.com ATP | 98 | MIT | TypeScript | Sandboxed code-first tool protocol | Early-stage, no release tag [S31]. |

## OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight framework for multi-agent workflows.
The Python SDK describes the core primitives as agents, handoffs or agents as
tools, guardrails, and tracing [S33][S35][S36]. It is provider-agnostic,
supporting OpenAI APIs and 100+ other LLMs through LiteLLM integrations
[S33].

Key primitives:

- **Agents:** LLMs configured with instructions, tools, guardrails, and
  handoffs [S33].
- **Handoffs:** delegation from one agent to another specialized agent, with
  optional input filters and conversation-history handling [S35].
- **Guardrails:** input, output, and tool-call checks that can block or modify
  unsafe behavior [S36].
- **Tracing:** built-in tracking for viewing, debugging, and optimizing agent
  runs [S33].

Strengths are minimalism, first-party OpenAI support, provider flexibility, and
straightforward delegation semantics. Risks are typical of SDK-level
frameworks: production systems still need external identity, authorization,
policy, observability, spend controls, and deployment manifests.

## LangGraph

LangGraph models agent workflows as graphs with three main components: shared
State, Nodes that perform logic or side effects, and Edges that determine
routing [S37]. Execution proceeds in Pregel-inspired super-steps, allowing
parallel nodes in the same step and sequential nodes across steps [S37].

LangGraph's production differentiator is durability. It persists graph state
through checkpointers, organized into threads, and can resume from prior
checkpoints after failures or human review [S38]. This enables
human-in-the-loop workflows, conversational memory, time travel debugging, and
fault-tolerant long-running execution [S38].

LangGraph is strongest when workflows are complex, stateful, interruptible, or
need explicit routing. It is a natural fit for enterprise agents that must
survive failures, expose intermediate state, and make approval points
deterministic.

## CrewAI

CrewAI is a Python framework for role-playing autonomous agents that collaborate
on complex tasks [S40]. Its repository emphasizes that it is built from scratch
and independent of LangChain or other agent frameworks [S40]. CrewAI's public
materials describe two major modes: Crews for collaborative agent teams and
Flows for event-driven production architecture [S40][S41].

Strengths:

- Simple mental model: role, goal, backstory, tasks, crew [S40].
- Strong community and adoption signals, with more than 52,000 GitHub stars on
  June 1, 2026 [S40].
- First-class support for tools, custom MCP servers, and sandbox tool
  integrations [S41].
- Useful for structured business-process automation where specialization by
  role is easy to explain [S40][S41].

Cost and risk considerations: multi-agent collaboration increases token usage,
latency, and failure paths. Production guidance recommends heavy guardrails,
human checkpoints, progressive rollout, and cost monitoring before scaling
structured multi-agent systems [S50].

## Microsoft AutoGen and Microsoft Agent Framework

AutoGen is a framework for creating multi-agent AI applications that can act
autonomously or work alongside humans [S42]. Its repository now warns that
AutoGen is in maintenance mode and recommends Microsoft Agent Framework for new
projects [S42]. Microsoft describes Agent Framework as the successor to
Semantic Kernel and AutoGen, with stable release-candidate APIs for .NET and
Python, multi-provider support, workflows, handoffs, group chat, and
interoperability support [S43].

AutoGen remains important historically because it popularized conversational
multi-agent orchestration. For new 2026 projects, the active Microsoft path is
Agent Framework; for existing AutoGen projects, migration planning is the key
decision [S42][S43].

## LlamaIndex

LlamaIndex is an open-source framework for building agentic applications with a
strong data/RAG/document-agent focus [S44]. Its README emphasizes document
agents, parsing, extraction, indexing, RAG, and integrations with application
frameworks [S44]. LlamaIndex is strongest where the central problem is
ingesting, parsing, indexing, retrieving, and grounding responses in private or
domain-specific data.

In the agent stack, LlamaIndex complements rather than replaces LangGraph or
CrewAI. It can supply the knowledge substrate and retrieval engines that
agents use; stateful orchestration and multi-agent governance may still be
handled elsewhere.

## Parlay / PARL

The requested "Parlay" name does not resolve to one dominant production agent
framework. Current sources show several separate projects:

- `sh4shv4t/Parlay`: an OpenEnv-compliant reinforcement-learning negotiation
  environment where LLM agents learn game theory, theory of mind, and
  strategic bluffing through self-play [S45].
- `The-Swarm-Corporation/PARL`: an Apache-2.0 parallel-agent reinforcement
  learning paradigm for training models to decompose complex tasks into
  parallel subtasks and coordinate subagents [S46].
- PaddlePaddle PARL: an older distributed reinforcement-learning framework,
  not primarily an LLM-agent framework [S45].

For production agent system selection, Parlay/PARL should be treated as
research/training infrastructure unless a specific repository is intended.

## GitLab Duo Agent Platform

GitLab announced general availability of GitLab Duo Agent Platform on January
15, 2026 [S47]. The platform is designed to orchestrate agents across the
software lifecycle and solve the "AI paradox" in software delivery: coding
speed improves, but coding is only a fraction of total delivery work [S47].

The platform has three agent categories:

- **Foundational agents:** prebuilt by GitLab experts for common software
  delivery tasks [S47][S48].
- **Custom agents:** created and shared through the AI Catalog with team
  context, engineering standards, and guardrails [S48][S49].
- **External agents:** integrated tools such as Anthropic Claude Code and
  OpenAI Codex CLI [S47][S48].

GitLab's AI Catalog is a central list of agents and flows. It supports
discovery, creation, sharing, enablement in projects, version history, and
group-hierarchy restrictions [S49]. This is a concrete enterprise example of
the catalog/contract/discovery trend that OSSA and DUADP address at an open
standard layer.

## Cost considerations from production guidance

47Billion's production comparison gives approximate per-task costs:

| Approach | Cost per task | Typical use |
| --- | ---: | --- |
| Simple workflow | $0.10-$0.50 | Linear deterministic work [S50]. |
| CrewAI multi-agent | $0.50-$2.00 | Structured multi-step tasks [S50]. |
| AutoGen multi-agent | $2.00-$5.00 | Exploratory collaboration [S50]. |
| LlamaIndex RAG | $0.20-$1.00 | Document-processing queries [S50]. |

The practical conclusion is not "avoid agents." It is "instrument agents."
Teams need per-agent spend attribution, budget caps, loop detection, latency
tracking, task-level tracing, model routing, and staged rollout [S50][S55].

## Selection guidance

- Use **OSSA** when portability, deployment, governance, manifest validation,
  and platform export matter [S02][S04].
- Use **DUADP** when discovery, federation, trust tiers, and DID-backed
  registry behavior matter [S01][S05].
- Use **MCP** when the main problem is connecting agents to tools and data
  [S19][S20].
- Use **A2A** when independent agents from different teams, vendors, or
  runtimes need task delegation [S21][S22].
- Use **LangGraph** for stateful, long-running, checkpointed workflows
  [S37][S38].
- Use **CrewAI** for role-based multi-agent automation with a simple team
  metaphor [S40][S41].
- Use **LlamaIndex** for RAG, document agents, indexing, parsing, and grounded
  knowledge workflows [S44].
- Treat **AutoGen** as legacy/maintenance unless preserving or migrating an
  existing codebase [S42][S43].
