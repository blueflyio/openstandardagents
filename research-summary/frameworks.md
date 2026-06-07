# Frameworks, repositories, npm packages, and platforms

## Summary

Frameworks and platforms differ mainly by how much control they give developers over state, orchestration, tools, memory, human approval, and deployment. The strongest open-source frameworks as of June 7, 2026 are LangGraph, CrewAI, OpenAI Agents SDK, LlamaIndex, Microsoft Agent Framework, AutoGen/AG2, and related ecosystem packages. OSSA and DUADP are not runtime frameworks; they are schema/contract and discovery packages [S02][S03][S04].

## Maturity snapshot

| Project | Primary role | Source signal | Best fit | Caution |
| --- | --- | --- | --- | --- |
| LangGraph | Durable graph/state orchestration | 34,065 GitHub stars at fetch time [S38] | Resilient agents, checkpointing, HITL, loops, explicit state | More verbose than task-first frameworks |
| CrewAI | Role/task/crew orchestration | 52,963 stars [S39] | Structured multi-step business workflows and role-based teams | Less ideal for open-ended dynamic orchestration |
| OpenAI Agents SDK | Lightweight agent runtime | 26,966 stars for Python repo; official docs list agents, handoffs, guardrails, sessions, HITL, tracing, MCP tools [S36][S37] | OpenAI/Responses-centric apps and simple multi-agent workflows | Python docs are mature; JS ecosystem remains fast-moving |
| LlamaIndex | Document/RAG agent platform | 49,962 stars [S42] | Retrieval, document agents, OCR, knowledge workflows | Not primarily a general orchestration layer |
| Microsoft Agent Framework | Python/.NET multi-agent framework | 11,099 stars [S43] | Microsoft/.NET/Azure-aligned agent workflows | Newer consolidation path; watch migration docs |
| AutoGen | Agentic programming framework | 58,742 stars [S40] | Legacy/community knowledge, conversational multi-agent patterns | Microsoft direction increasingly points to Agent Framework/AG2 paths |
| AG2 | AutoGen lineage/community AgentOS | 4,640 stars [S41] | Active community continuation of AutoGen-style patterns | Pre-1.0/younger than major alternatives |
| GitLab Duo Agent Platform | Enterprise SDLC agent platform | GA January 15, 2026; GitLab docs [S44][S45] | GitLab-native DevSecOps automation, governance, context, and flows | Product/platform dependency, credits-based usage |
| OSSA | Agent contract/package | npm 0.5.6, 42 weekly downloads [S03] | Portable manifests, validation, policy metadata, export targets | Early adoption; not runtime enforcement |
| DUADP | Discovery/federation package | npm 0.1.7, 9 weekly downloads [S04][S08] | Federated discovery pilots, registry resolution, DID/provenance experiments | Experimental protocol-pilot maturity |

## OpenAI Agents SDK

The OpenAI Agents SDK is a production-ready upgrade from Swarm with a small primitive set: agents, agents-as-tools/handoffs, guardrails, and tracing [S36]. The official docs also list sessions, human-in-the-loop support, sandbox agents, MCP server tool calling, function tools, realtime agents, and Python-first orchestration [S36].

The design is intentionally low-abstraction. It is appropriate when developers want the runtime to manage turns, tool execution, guardrails, handoffs, or sessions rather than directly owning every Responses API call [S36]. It is less appropriate where the runtime must be framework-neutral or where a team wants explicit graph/state modeling independent of OpenAI platform assumptions.

Repository signal: the Python repository had 26,966 stars at fetch time [S37].

## LangGraph

LangGraph is best understood as a graph/state orchestration runtime for resilient agents. It is strong when the workflow needs explicit state, cycles, checkpoints, retries, human interruption, memory, and observability. The repository had 34,065 stars at fetch time [S38].

LangGraph also matters because LangChain Agent Protocol gives the serving side a concrete API vocabulary for runs, threads, store, schemas, and streaming [S33]. If a production agent needs to pause/resume, stream intermediate state, or enforce branch-level policies, LangGraph-style modeling is usually easier to audit than ad hoc agent loops.

## CrewAI

CrewAI's repository describes it as a framework for orchestrating role-playing autonomous AI agents that work together [S39]. Its practical strength is mapping business workflows to agents with roles and tasks. 47Billion's production write-up says CrewAI felt more structured and predictable than AutoGen for a table-reservation style workflow, and it took one week to rebuild a working version compared with three weeks in AutoGen in their internal comparison [S46].

CrewAI is a good fit for structured multi-step tasks, content workflows, and business process automation where roles and task order are known. It needs stronger external controls for memory, approval, cost, and tool permissions when moving from prototype to production [S46].

Repository signal: 52,963 stars at fetch time [S39].

## AutoGen and AG2

AutoGen remains highly visible with 58,742 stars at fetch time and a large body of community examples [S40]. It popularized conversational multi-agent patterns where agents with roles talk to each other. 47Billion's analysis says this is powerful for exploratory collaboration but can be expensive and hard to debug when agents loop, disagree, or consume large conversation histories [S46].

AG2 is the active community continuation/former AutoGen path, described as "AG2 (formerly AutoGen): The Open-Source AgentOS" with 4,640 stars at fetch time [S41]. It is worth tracking for teams invested in AutoGen-style interactions, especially where community velocity matters more than vendor consolidation.

Microsoft Agent Framework is the stronger forward-looking Microsoft-aligned choice for Python/.NET shops. Its repository describes a framework for building, orchestrating, and deploying AI agents and multi-agent workflows with Python and .NET support [S43].

## LlamaIndex

LlamaIndex is strongest for document, OCR, and retrieval-heavy agent systems. The repository calls it the leading document agent and OCR platform and had 49,962 stars at fetch time [S42].

The key architectural point is to treat LlamaIndex as the data/retrieval layer in many applications. It can power knowledge agents directly, but it is often paired with LangGraph, CrewAI, OpenAI Agents SDK, or a platform runtime when orchestration, human approvals, and long-running workflows become central.

## GitLab Duo Agent Platform

GitLab Duo Agent Platform became generally available on January 15, 2026 [S45]. It is not a general open-source framework; it is a GitLab-native agent platform embedded into the software development lifecycle.

Generally available features listed in GitLab docs include Agentic Chat, Code Suggestions, custom agents, external agents, Planner Agent, Data Analyst Agent, Developer Flow, Code Review Flow, CI/CD conversion/fix flows, Software Development Flow, MCP clients, SAST false-positive detection, SAST vulnerability resolution, and Security Analyst Agent [S44].

The GA press release adds:

- Agentic Chat with multi-step reasoning across Web UI and IDEs, using project data from issues, MRs, pipelines, security findings, and more.
- Prebuilt Planner Agent and Security Analyst Agent.
- Custom Agents via an AI catalog.
- External Agents including Claude Code and Codex CLI.
- Foundational flows for issue-to-MR, CI/CD conversion, pipeline fixing, code review, and IDE software development.
- Governance, visibility, model selection, self-hosted model support, and group-based access control [S45].

The strategic value is context and governance. GitLab already holds code, issues, MRs, CI/CD, security findings, and access controls. Duo Agent Platform turns that system of record into the agent control plane [S44][S45].

## OSSA: @bluefly/openstandardagents

OSSA is an open standard and npm package for defining, validating, discovering, and governing software agents. The npm package states clearly that OSSA is not a framework and not a runtime; it is a contract layer with schema, identity, capabilities, policy bindings, discovery metadata, and validation rules [S03].

Current package facts:

| Field | Value |
| --- | --- |
| Package | `@bluefly/openstandardagents` |
| Version | 0.5.6 |
| Published | June 3, 2026 |
| First published | November 19, 2025 |
| License | Apache-2.0 |
| Node | Node.js 20+ |
| Weekly downloads | 42 on npm package page |
| Last-month downloads | 243 for May 4-June 2, 2026 [S07] |
| Dependencies | 0 in npm package page [S03] |
| CLI | `ossa` |

Core concepts in the package:

- Agent Manifest: identity, role, tools, capabilities, governance metadata, and interoperability surfaces.
- Role: behavioral/operational profile.
- Tool: callable capability declared by the manifest.
- Workflow: deterministic or semi-deterministic process composed from agents, tools, events, or external systems.
- Registry: discoverable index of agent manifests and metadata.
- Policy Binding: link between an action/resource/agent and an external policy authority such as Cedar [S03].

OSSA's package explicitly says it does not contain an agent runtime, orchestration engine, MCP server implementation, deployment controller, Drupal module, GitLab automation, or policy decision point [S03]. That boundary is important: OSSA can standardize and validate declarations, but enforcement must happen in runtimes and policy engines.

The local repository README adds the identity-discovery-governance framing: OSSA defines agent identity, signed manifests, Cedar policies, and NIST control mapping, while DUADP provides discovery and federation [S05].

## DUADP: @bluefly/duadp

DUADP is the Decentralized Universal AI Discovery Protocol. Its homepage describes it as a missing discovery layer: MCP connects tools, A2A connects agents, and DUADP helps agents find each other [S01].

Current package facts from `npm view` and npm downloads API:

| Field | Value |
| --- | --- |
| Package | `@bluefly/duadp` |
| Version | 0.1.7 |
| Registry modified | June 3, 2026 |
| First published | March 6, 2026 |
| License | Apache-2.0 |
| Description | "DUADP - Decentralized Universal AI Discovery Protocol SDK for TypeScript" |
| CLI | `duadp` |
| Last-week downloads | 9 for May 27-June 2, 2026 [S08] |
| Last-month downloads | 107 for May 4-June 2, 2026 [S08] |
| Dependencies | ajv, ajv-formats, canonicalize, did-resolver, js-yaml, key-did-resolver, web-did-resolver [S04] |

Homepage capabilities:

- Federated discovery through DNS TXT records and WebFinger.
- Gossip federation across nodes.
- DID identity using did:web in the June 7, 2026 site text plus did:key and did:pkh resolution in SDKs.
- GAID lookup handles such as `agent://discover.duadp.org/agents/code-reviewer`.
- Ed25519 signatures and provenance chain.
- Trust tiers used as policy inputs.
- REST endpoints for agents, skills, tools, search, publish, validate, federation, identity, governance, health, and metrics.
- 17 MCP tools for discovery, search, publishing, validation, federation, governance, and health [S01].

The local UADP draft shows an earlier/conceptual API shape using `/.well-known/uadp.json`, `/uadp/v1/skills`, `/uadp/v1/agents`, federation endpoints, OSSA payloads, trust tiers, and conformance language [S06]. The live DUADP site now uses `/.well-known/duadp` and `/api/v1/...` examples [S01]. That suggests the discovery protocol naming/API is evolving; implementers should pin a package/spec version and test conformance.

## How to choose

| Need | Prefer | Why |
| --- | --- | --- |
| Durable, explicit workflow state | LangGraph | Graphs, checkpoints, HITL, state visibility |
| Role-based business automation | CrewAI | Crews/tasks map well to structured workflows |
| Lightweight OpenAI-native agent loop | OpenAI Agents SDK | Few primitives, tracing, guardrails, handoffs, sessions |
| Document/RAG-heavy agents | LlamaIndex | Retrieval, document, OCR, and knowledge workflows |
| Microsoft/.NET/Azure integration | Microsoft Agent Framework | Python/.NET and Microsoft ecosystem alignment |
| Existing AutoGen-style code | AG2 or migration path | Active community lineage; evaluate Microsoft Agent Framework for new work |
| GitLab SDLC automation | GitLab Duo Agent Platform | Deep SDLC context, flows, custom/external agents, governance |
| Portable agent declaration | OSSA | Schema, validation, manifests, policy metadata, export targets |
| Federated agent discovery | DUADP | Well-known discovery, DIDs, GAID, registry/federation, MCP tools |

## Cost and production notes from engineering blogs

47Billion's production analysis gives useful cost ranges by autonomy level:

| Approach | Claimed cost per task | When to use |
| --- | --- | --- |
| Simple workflow | USD 0.10-0.50 | Linear deterministic tasks |
| CrewAI multi-agent | USD 0.50-2.00 | Structured multi-step tasks |
| AutoGen multi-agent | USD 2.00-5.00 | Exploratory collaboration |
| LlamaIndex RAG | USD 0.20-1.00 | Document processing queries |

The same source argues that simple workflows and constrained tool-using agents can be production-ready with validation, monitoring, fallbacks, cost limits, and guardrails, while open-ended multi-agent systems are not yet reliable enough for critical paths [S46].

## Recommendations

1. Match the framework to the workflow shape rather than popularity.
2. Keep the agent contract separate from runtime execution: use OSSA-style manifests for declaration and a runtime/policy engine for enforcement.
3. Prefer explicit state, approval, and tracing for production work.
4. Avoid shared credentials. Give each agent or runtime workload a specific identity and authorization boundary [S48][S49].
5. Treat OSSA/DUADP as promising early infrastructure. Their adoption metrics are low compared with major frameworks, but their focus on identity, discovery, and governance fills real gaps [S03][S04][S07][S08].
