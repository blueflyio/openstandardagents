# Open-Source Frameworks, Repositories, and Packages

Prepared on May 24, 2026.

## Repository snapshot

GitHub repository metadata was collected with `gh repo view` on May 24, 2026.

| Project | Purpose | Stars | License |
| --- | --- | ---: | --- |
| microsoft/autogen | Programming framework for agentic AI | 58,335 | CC-BY-4.0 |
| crewAIInc/crewAI | Role-playing autonomous agent orchestration | 52,066 | MIT |
| run-llama/llama_index | Document agent and OCR/RAG platform | 49,623 | MIT |
| langchain-ai/langgraph | Resilient stateful agents and workflows | 32,800 | MIT |
| openai/openai-agents-python | Lightweight multi-agent framework | 26,609 | MIT |
| ag-ui-protocol/ag-ui | Agent-user interaction protocol | 13,775 | MIT |
| agent-network-protocol/AgentNetworkProtocol | Agent communication protocol for Agentic Web | 1,302 | Apache-2.0 |
| i-am-bee/acp | Agent Communication Protocol | 1,004 | Apache-2.0 |
| langchain-ai/agent-protocol | Framework-neutral agent protocol | 593 | MIT |
| mondaycom/agent-tool-protocol | Code-first tool protocol | 96 | MIT |

Source: GitHub metadata [S34].

## npm package snapshot

| Package | Version | Description | License |
| --- | ---: | --- | --- |
| `@bluefly/openstandardagents` | 0.5.1 | OSSA bridge between protocols and deployment platforms | Apache-2.0 |
| `@bluefly/duadp` | 0.1.4 | DUADP TypeScript SDK and CLI | Apache-2.0 |
| `@modelcontextprotocol/sdk` | 1.29.0 | TypeScript MCP implementation | MIT |
| `@openai/agents` | 0.11.5 | JS/TS multi-agent workflow SDK | MIT |
| `@ag-ui/core` | 0.0.53 | AG-UI TypeScript definitions and schemas | Not reported by npm view |
| `@ag-ui/client` | 0.0.53 | AG-UI client SDK | Not reported by npm view |
| `@mondaydotcomorg/atp-client` | 0.24.0 | ATP client SDK | MIT |
| `@mondaydotcomorg/atp-protocol` | 0.22.3 | ATP core types and interfaces | MIT |

Source: npm metadata [S31] [S32] [S33].

## OSSA: `@bluefly/openstandardagents`

OSSA is the repository/package at the center of this checkout. It defines a
portable YAML manifest for software agents and exports that manifest to
platform-specific targets. The repository README states that OSSA is not MCP or
A2A and not a framework like LangChain or CrewAI; it is the missing middle layer
that translates agent definitions into platform-specific deployments [S28].

Core primitives and surfaces:

* Schemas: `spec/v0.5/agent.schema.json` and agent-card schema exports.
* CLI: `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, `ossa-mcp`.
* Services: validation, generation, migration, agent-card generation, trust,
  mesh, workspace validation, and MCP server exports.
* Governance: W3C DID/GAID identity, signed manifests, Cedar policies, trust
  tiers, SBOM/provenance pointers, human oversight, and NIST control mapping
  [S28] [S30].
* Deployment: Docker, Kubernetes, LangChain, CrewAI, Claude Skills, GitLab Duo,
  Drupal, MCP/A2A, npm, and other targets [S02] [S28].

The package's public npm description calls it "OSSA - Open Standard for
Software Agents. Infrastructure bridge between agent protocols (MCP, A2A) and
deployment platforms" [S31].

## DUADP: `@bluefly/duadp`

DUADP is the companion discovery layer. Its website describes a federated DNS
plus WebFinger plus gossip protocol for discovering agents across the open web
[S01]. It uses GAIDs as lookup handles, DIDs for proof, signatures and
provenance for integrity, and trust tiers for policy decisions [S01].

The local OSSA architecture docs summarize the relation as: DUADP resolves
Global Agent IDs to metadata and endpoints, indexes OSSA manifests across a
node network, and attaches governance policies to discovery records [S29].
The npm package `@bluefly/duadp` is version 0.1.4 and provides a TypeScript SDK
and `duadp` CLI [S32].

## OpenAI Agents SDK

OpenAI Agents SDK exists in both Python and JavaScript/TypeScript forms. The
Python documentation describes it as a lightweight, production-ready upgrade of
Swarm with a small set of primitives: agents, agents-as-tools/handoffs,
guardrails, and tracing [S11]. The JavaScript package expands the current
feature list to include tools, MCP tools, human-in-the-loop, sessions,
sandbox agents, and realtime agents [S35].

Strengths:

* Minimal abstraction: agents are LLMs with instructions and tools.
* Handoffs: one agent can delegate to another.
* Guardrails: input/output validation and tripwires.
* Tracing: built-in workflow visibility.
* MCP support: MCP server tool calling is first-class in the Python docs [S11].

Use this SDK when a team wants a simple provider-supported runtime with strong
tool, handoff, guardrail, and tracing defaults. For more complex graph-shaped
state machines, LangGraph may be more explicit.

## LangGraph

LangGraph models agent workflows as stateful graphs. Developers define state,
nodes, and edges; execution proceeds in discrete super-steps inspired by
Pregel-style message passing [S10]. Checkpointers persist graph state at every
step, organized into threads, enabling human-in-the-loop review, memory,
time-travel debugging, fault tolerance, and resume after interruption [S10].

LangGraph is a good fit when:

* workflows need cycles and branching rather than a linear chain;
* a human must inspect or approve tool calls;
* long-running agents must checkpoint and resume;
* operations teams need explicit state and execution traces.

Its main cost is verbosity. Compared with CrewAI, LangGraph requires more
explicit workflow design, but the resulting system is easier to reason about in
regulated or production contexts [S10] [S20].

## CrewAI

CrewAI organizes work around roles, tasks, and crews. 47Billion's production
comparison found CrewAI faster to develop than AutoGen for structured,
multi-step tasks and more predictable because it is task-based rather than
conversation-based [S20]. The GitHub repository describes it as a framework for
orchestrating role-playing autonomous AI agents [S34].

Strengths:

* Clear fit for structured, multi-step workflows.
* Gentler learning curve than AutoGen.
* Useful middle ground between prompt chains and open-ended multi-agent
  conversations.

Risks:

* Less flexible for dynamic, open-ended collaboration.
* Memory across tasks and deep behavior customization may need extra work
  [S20].

## AutoGen

AutoGen's mental model is multi-agent conversation. Agents with roles talk to
each other until the task is complete [S20]. This is powerful for exploratory
tasks, code execution agents, and diverse perspectives, but production teams
report higher token use, conversation loops, and harder debugging [S20].

AutoGen is best suited for exploratory collaboration where open-ended dialogue
is an asset. It is a riskier default for deterministic workflows, because every
extra agent conversation can multiply token cost and failure modes [S20].

## LlamaIndex

LlamaIndex is strongest when an agent's primary job is document retrieval,
information extraction, or RAG. 47Billion calls it the "document specialist" and
highlights its clean workflow abstractions, event-driven architecture, and tight
RAG integration [S20]. The repository description calls it a document agent and
OCR platform [S34].

Use LlamaIndex for document-heavy workflows, insurance/contract review,
knowledge assistants, retrieval pipelines, and agent systems where grounding in
documents is the central value.

## Parlant and other specialized frameworks

47Billion identifies Parlant, by Emcie, as an Apache-2.0 framework focused on
customer-facing conversational agents. Its notable feature is a Guidelines
system: behavioral rules dynamically matched to conversation context, intended
to be more reliable than relying only on system prompts [S20]. This is part of a
broader trend: specialized agents often outperform broad general agents because
their scope and allowed actions are narrower [S20].

## GitLab Duo Agent Platform

GitLab announced general availability of GitLab Duo Agent Platform in January
2026. The platform lets developers delegate software delivery lifecycle tasks to
specialized agents directly inside GitLab [S13].

Agent types:

* Foundational agents: GitLab-built agents such as Planner Agent and Security
  Analyst Agent [S13].
* Custom agents: created, published, managed, and shared through the AI Catalog
  with organization-specific prompts, standards, and guardrails [S13].
* External agents: native integrations with Claude Code and OpenAI Codex/Codex
  CLI for code generation, code review, and analysis [S13].

The local repository also contains `.gitlab/DUO-AGENT-PLATFORM.md`, which
describes a reusable OSSA validator integration for GitLab Duo Agent Platform.
It validates OSSA manifests, access tiers, separation of duties, taxonomy,
security policies, best practices, reports, and knowledge graph updates [S36].

## Cost and maturity guidance

47Billion's per-task cost ranges are useful planning heuristics [S20]:

| Approach | Cost per task | Tokens per task | Production stance |
| --- | ---: | ---: | --- |
| Simple workflow | $0.10-$0.50 | 1,000-3,000 | Ready with monitoring |
| CrewAI multi-agent | $0.50-$2.00 | 3,000-10,000 | Good for structured tasks |
| AutoGen multi-agent | $2.00-$5.00 | 5,000-25,000 | Use for exploratory tasks |
| LlamaIndex RAG | $0.20-$1.00 | 1,000-5,000 | Good for document queries |

The production pattern is consistent: start with workflows, add tools, then add
multiple agents only when specialization is clearly necessary [S20].
