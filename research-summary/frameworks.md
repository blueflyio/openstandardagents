# Frameworks and Open-Source Projects (Updated: April 13, 2026)

## Framework landscape

Production agent frameworks now split into a few dominant implementation styles:

- **General-purpose orchestration frameworks** (OpenAI Agents SDK, LangGraph, CrewAI),
- **Conversation/multi-agent frameworks** (AutoGen legacy and successors),
- **Data/RAG-centric frameworks** (LlamaIndex),
- **Platform-integrated enterprise suites** (GitLab Duo Agent Platform),
- **Protocol/contract/discovery projects** (OSSA, DUADP, Agent Protocol, ANP). [S22][S25][S26][S27][S28][S29][S30]

## Key projects requested in scope

### OpenAI Agents SDK

OpenAI’s Agents SDK documents a minimal primitive model:
- agents,
- handoffs (agents-as-tools),
- guardrails,
- tracing (plus sessions/HITL/realtime pathways). [S25]

The project is explicitly lightweight and Python-first, with linked JS implementation and broad model-provider support claims in ecosystem docs. [S25][S31]

### LangGraph

LangGraph is positioned as a low-level orchestration framework for long-running, stateful agents/workflows with durable execution, human interrupts, and memory persistence. [S26]

It is well suited for:
- state machines with cycles,
- resumable operations,
- explicit production observability hooks.

### CrewAI

CrewAI emphasizes:
- autonomous role-based agent teams ("Crews"),
- event-driven deterministic orchestration ("Flows"),
- production-oriented controls and enterprise control-plane framing. [S27]

Its documentation differentiates autonomy-first and control-first patterns and positions the framework as independent from LangChain.

### AutoGen

AutoGen remains influential but is now in maintenance mode, with migration guidance toward Microsoft Agent Framework for net-new projects. [S28]

Still relevant for:
- established multi-agent codebases,
- agentchat patterns,
- MCP-tooling examples in existing implementations.

### LlamaIndex

LlamaIndex combines open-source data framework primitives and document-agent workflows with broad connector ecosystem support.
It remains a strong fit for:
- retrieval-heavy systems,
- document indexing/extraction pipelines,
- agentic workflows where knowledge integration is central. [S29]

### GitLab Duo Agent Platform

GitLab announced GA on **January 15, 2026**, highlighting:
- context-aware agentic chat in IDE and web contexts,
- foundational agents (planner, security analyst),
- custom/external agent catalog workflows,
- lifecycle use cases spanning code, CI/CD, and security. [S30]

This represents the enterprise platform pattern: agent capabilities embedded directly into existing SDLC workflows rather than stand-alone agent apps.

## DUADP and OSSA npm packages (requested deep understanding)

### `@bluefly/duadp`

What it is:
- TypeScript SDK/server toolkit for discovery/federation protocol operations. [S01][S05]

Current package signals:
- version `0.1.4`,
- Apache-2.0 license,
- GitLab project origin,
- public npm distribution and active downloads in recent week snapshot. [S05][S06]

Functional role in stack:
- discovery manifests, agent/skill/tool lookup/publish paths,
- trust/identity metadata and federation adjacency,
- protocol bridge for multi-node discovery networks. [S01][S04]

### `@bluefly/openstandardagents`

What it is:
- OSSA CLI/package for authoring/validating/exporting portable agent manifests. [S02][S03][S07]

Current package signals:
- version `0.5.1`,
- Apache-2.0 license,
- dist-tag history indicating legacy/RC/latest branches,
- weekly npm activity in recent snapshot. [S07][S08]

Functional role in stack:
- standardized contract artifact,
- policy/compliance metadata carrier,
- export layer across runtime targets and protocol touchpoints.

## Comparative framework table (selected projects)

| Project | Core model | Strength | Tradeoff / risk note |
| --- | --- | --- | --- |
| OpenAI Agents SDK | Minimal primitives (agents/handoffs/guardrails/tracing) [S26] | Fast path to production patterns with small conceptual surface | Requires explicit architecture decisions for large distributed systems |
| LangGraph | Stateful graph orchestration [S27] | Durable long-running workflows and explicit control | More engineering overhead than high-level wrappers |
| CrewAI | Autonomous crews + controlled flows [S28] | Easy role-based composition and workflow separation | Behavior quality depends heavily on task/prompt rigor |
| AutoGen | Multi-agent conversation framework [S29] | Mature ecosystem and historical patterns | Maintenance mode; migration planning needed |
| LlamaIndex | Data and document-centric agent framework [S30] | Strong retrieval/document pipeline capability | Not always the lightest choice for non-RAG orchestration |
| GitLab Duo Agent Platform | Integrated SDLC agent platform [S38] | Built-in enterprise workflow context and governance controls | Platform coupling to GitLab ecosystem decisions |

## Notable repositories and activity snapshot

GitHub metrics collected on **April 13, 2026**:

| Repository | Stars | Forks | Notes |
| --- | ---:| ---:| --- |
| `openai/openai-agents-python` | 20,747 | 3,401 | OpenAI Python SDK implementation [S31] |
| `langchain-ai/langgraph` | 29,118 | 4,995 | Stateful orchestration framework [S31] |
| `crewAIInc/crewAI` | 48,765 | 6,660 | Autonomous crews/flows [S31] |
| `microsoft/autogen` | 57,032 | 8,584 | Maintenance mode, large installed base [S28][S31] |
| `run-llama/llama_index` | 48,542 | 7,194 | Data framework and agent workflows [S29][S31] |
| `a2aproject/A2A` | 23,163 | 2,351 | Inter-agent protocol implementation [S31] |
| `langchain-ai/agent-protocol` | 560 | 46 | Spec-oriented protocol repo [S22][S31] |
| `agent-network-protocol/AgentNetworkProtocol` | 1,264 | 86 | ANP architecture project [S21][S31] |
| `blueflyio/openstandardagents` | 4 | 0 | OSSA mirror presence [S31] |

## Cost and production-readiness insights from engineering blogs

Industry practice write-ups report that:
- multi-agent architectures often increase debugging and observability costs substantially,
- constrained autonomy with explicit HITL controls tends to improve reliability,
- protocol adoption can reduce integration overhead but does not eliminate governance complexity. [S37][S38]

These claims are useful for implementation planning but should be validated against internal telemetry and workload constraints.

## Gaps and caveats

- A primary-source "Parlay" framework artifact was not clearly discoverable in this pass.
- Some framework comparisons come from vendor-authored content and should be treated as directional evidence.
