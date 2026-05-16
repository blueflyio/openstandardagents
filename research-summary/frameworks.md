# Frameworks, Repositories, and Packages

Current date used for relative-date normalization: May 16, 2026.

## Comparison

| Project | Best fit | Core primitives | Adoption signal | Maturity |
| --- | --- | --- | --- | --- |
| OpenAI Agents SDK | OpenAI-native and provider-compatible workflows | Agents, tools, handoffs, guardrails, tracing, sessions | 26k+ GitHub stars [FW-01] | Young but official |
| LangGraph | Durable stateful workflows | Graphs, state, checkpoints, interrupts, memory | 32k+ GitHub stars [FW-02] | Production-oriented |
| CrewAI | Role-based multi-agent teams | Agents, tasks, crews, flows, tools | 51k+ GitHub stars [FW-03] | High adoption |
| AutoGen | Conversation-style multi-agent research | AgentChat, groups, async runtime, Studio | 58k+ GitHub stars [FW-04] | Influential; maintenance caveat |
| LlamaIndex | RAG-heavy agents | Indexes, retrievers, workflows, FunctionAgent | 49k+ GitHub stars [FW-05] | Mature data/RAG base |
| Parlant | Governed customer conversations | Guidelines, journeys, tools, tracing | 18k+ GitHub stars [FW-06] | Specialized |
| GitLab Duo Agent Platform | DevSecOps lifecycle automation | Agentic Chat, agents, flows, external agents, MCP | GA product [FW-07] | Productized platform |
| OSSA package | Portable agent contracts | YAML schema, CLI, SDK, exporters, MCP server | npm v0.5.1 [NPM-01] | Early |
| DUADP package | Federated discovery SDK | Client, server router, signing, DID, validation | npm v0.1.4 [NPM-02] | Very early |

## OpenAI Agents SDK

OpenAI's Agents SDK is a lightweight framework for multi-agent workflows. The
official docs describe a small primitive set: agents as LLMs with instructions
and tools, agents-as-tools/handoffs for delegation, guardrails for input/output
validation, and tracing for visualizing and debugging agentic flows [FW-01].
Additional features include sandbox agents, function tools, hosted tools, MCP
server tool calling, sessions, human-in-the-loop support, and realtime voice
agents [FW-01].

The SDK is useful when a team wants a minimal, Python-first runtime around the
Responses API while still retaining provider flexibility. 47Billion notes that
the SDK is worth evaluating as a simpler alternative for teams already in the
OpenAI ecosystem, and that it works with 100+ LLMs via Chat Completions-style
interfaces [BLOG-01].

## LangGraph

LangGraph is LangChain's graph-based execution layer for resilient agents. It is
strong for long-running workflows, checkpointing, cycles, memory, human
interrupts, streaming, and explicit state transitions [FW-02]. It is more
verbose than simple task frameworks but provides clearer control over execution
flow and failure recovery.

LangGraph is tightly aligned with LangChain Agent Protocol and LangGraph
Platform. Use it when agent state, resumability, and observability matter more
than quick scaffolding [PROTO-05] [FW-02].

## CrewAI

CrewAI is a role/task/crew framework for orchestrating collaborative agents
[FW-03]. It fits structured multi-step business workflows where agents have
clear roles, tasks, goals, backstories, and tool access. 47Billion found CrewAI
more production-pragmatic than AutoGen for a table reservation workflow: a
working version took one week with CrewAI versus three weeks with AutoGen
[BLOG-01].

CrewAI's strengths are clarity and task structure. Its risks are the usual
multi-agent risks: cost, debugging, memory boundaries, and over-delegation if
guards are weak [BLOG-01].

## AutoGen

Microsoft AutoGen popularized conversation-based multi-agent workflows. Its
model is intuitive for exploratory tasks where multiple agents debate, critique,
or refine an answer [FW-04]. It supports agent chat abstractions, event-driven
runtime concepts, Studio, and extensions [FW-04].

The caveat is production predictability. 47Billion reports circular
conversations, high token use, difficult debugging, and repeated tool calls in
AutoGen-style systems [BLOG-01]. The framework remains historically important,
but new Microsoft work has shifted toward newer Agent Framework directions
[FW-04].

## LlamaIndex

LlamaIndex is strongest when agents need private, document, or enterprise data.
It provides data connectors, indexes, retrievers, query engines, RAG pipelines,
FunctionAgent, AgentWorkflow, and tool abstractions [FW-05]. 47Billion describes
it as the document specialist: excellent for document processing and retrieval,
less ideal as a general-purpose orchestration layer [BLOG-01].

Use LlamaIndex for grounded answers, knowledge synthesis, document workflows,
and RAG systems. Pair it with strong data classification, source citation,
retrieval evaluation, and egress filtering [FW-05] [SEC-01].

## Parlant and the "Parlay" note

The requested "Parlay" framework did not surface as a mature comparable project
in the research pass. The modern relevant project appears to be Parlant, an
Apache-2.0 framework for governed customer-facing conversational agents [FW-06].
Parlant's core idea is a guideline system: behavioral rules are dynamically
matched to context rather than relying solely on a long system prompt [BLOG-01].

Parlant is most relevant for support, sales, and regulated conversation
settings where consistent behavior matters more than broad workflow
orchestration [FW-06].

## GitLab Duo Agent Platform

GitLab announced general availability of GitLab Duo Agent Platform on January
15, 2026 for Premium and Ultimate customers on GitLab.com and Self-Managed, with
GitLab Dedicated planned for the GitLab 18.8 release cycle [FW-07]. The platform
embeds agents across the software delivery lifecycle rather than focusing only
on code generation [FW-07].

GA features include Agentic Chat across GitLab Web UI and IDEs, context from
issues, merge requests, pipelines, and security findings, and use cases for
analysis, code, CI/CD, and security [FW-07]. Prebuilt foundational agents
include Planner Agent and Security Analyst Agent [FW-07]. Custom agents can be
built through an AI Catalog, while external agents integrate Claude Code and
OpenAI Codex CLI [FW-07].

GitLab's differentiator is governance and lifecycle context. It offers group
access control, model selection, self-hosted model support for Self-Managed, and
usage/activity visibility [FW-07]. The docs list generally available features
such as Agentic Chat, custom agents, external agents, planner, data analyst,
developer/code-review/CI flows, MCP clients, and security flows on higher tiers
[FW-08].

## AgentNetworkProtocol repository

The ANP repository describes an open-source protocol for agent communication and
an open, secure collaboration network for billions of agents [FW-09]. It is best
treated as protocol infrastructure rather than an application framework. The
project is early but important because it combines W3C DID-style identity,
agent descriptions, discovery, secure messaging, and protocol negotiation
[PROTO-04].

## LangChain Agent Protocol repository

LangChain Agent Protocol defines a framework-agnostic API for serving agents:
runs, threads, store, streaming, and introspection [FW-10] [PROTO-05]. It is not
as widely adopted as the frameworks above, but it is strategically relevant
because it separates "how to operate an agent server" from any one orchestration
framework.

## @bluefly/openstandardagents

`@bluefly/openstandardagents` is the OSSA npm package. npm lists v0.5.1,
published March 28, 2026, Apache-2.0, 75 dependencies, 23 versions, and package
description: "OSSA - Open Standard for Software Agents. Infrastructure bridge
between agent protocols (MCP, A2A) and deployment platforms" [NPM-01].

The package includes:

- CLI commands such as `ossa init`, `ossa validate`, `ossa export`, `ossa lint`,
  `ossa migrate`, `ossa generate-gaid`, `ossa skills`, `ossa workspace`, and
  `ossa serve` [NPM-01].
- JSON Schema exports for v0.5 and earlier versions [NPM-01].
- SDK exports for validation, generation, migration, agent-card generation,
  mesh, trust, workspace validation, and MCP server integration [NPM-01].
- Export targets including LangChain, MCP, npm, agent skills, CrewAI, Drupal,
  Claude Code, Cursor, Warp, Anthropic, kagent, GitLab Duo, Docker,
  Kubernetes, Temporal, n8n, OpenAI Agents SDK, A2A, Claude Skills, mobile
  agent, Symfony, and AgentScope, with maturity labels [NPM-01].

Adoption is early. npm displayed 90 weekly downloads on the package page, while
the npm downloads API returned 63 downloads for May 9-15, 2026 [NPM-01]
[NPM-03].

## @bluefly/duadp

`@bluefly/duadp` is the official TypeScript SDK for DUADP. npm lists v0.1.4,
published March 9, 2026, Apache-2.0, 7 dependencies, 5 versions, and package
description: "DUADP - Decentralized Universal AI Discovery Protocol SDK for
TypeScript" [NPM-02].

The package provides:

- A typed client for discovering nodes, listing/searching agents, skills, and
  tools, and interacting with federation [NPM-02].
- An Express server router for implementing 15 core DUADP endpoints, including
  `/.well-known/duadp.json`, WebFinger, agents/skills/tools routes, publish,
  validate, and federation endpoints [NPM-02].
- Ed25519 signing and verification, DID resolution for `did:web` and `did:key`,
  OSSA resource validation, and conformance tests [NPM-02].
- Concepts including DUADP node, GAID, DID, trust tier, federation, and OSSA
  payloads [NPM-02].

Adoption is very early. npm displayed 55 weekly downloads on the package page,
while the npm downloads API returned 23 downloads for May 9-15, 2026 [NPM-02]
[NPM-04].

## Practical selection

- Choose OpenAI Agents SDK for simple-to-moderate OpenAI-centered or
  provider-compatible agent loops.
- Choose LangGraph for stateful, resumable, auditable workflows.
- Choose CrewAI for structured role/task multi-agent systems.
- Choose LlamaIndex for RAG and knowledge workflows.
- Choose Parlant for governed customer-facing conversation.
- Choose GitLab Duo Agent Platform for DevSecOps workflows inside GitLab.
- Use OSSA above these frameworks when the agent definition must travel across
  platforms or carry governance metadata.
- Use DUADP beside these frameworks when agents, skills, or tools must be
  discoverable across organizational or federated boundaries.
