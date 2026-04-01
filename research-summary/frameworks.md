# Open-Source Frameworks and Project Analysis (2025-2026)

Prepared: 2026-04-01

## Scope

This document covers:
- major open-source agent frameworks,
- open protocol repositories,
- DUADP/OSSA npm packages requested by the user,
- and maturity/community indicators (stars/downloads where available).

---

## 1) DUADP and OSSA npm packages (requested focus)

## `@bluefly/duadp`

What it is:
- TypeScript SDK for DUADP discovery/federation protocol (agent/skill/tool publishing, search, trust metadata, DID/signed resources). [T02][T54]

Current package indicators (2026-04-01):
- Version: `0.1.4`
- License: Apache-2.0
- Last-week downloads: 76
- npm page describes discovery APIs, client/server router patterns, and conformance tooling. [T54][T61]

Role in stack:
- Discovery and federated registry layer (not a runtime orchestrator).

## `@bluefly/openstandardagents`

What it is:
- OSSA CLI/SDK for portable agent manifests and multi-target export/deployment translation. [T04][T55]

Current package indicators (2026-04-01):
- Version: `0.5.1`
- License: Apache-2.0
- Last-week downloads: 199
- npm package documents manifest validation, migrations, platform exports, and MCP-related tooling. [T55][T61]

Role in stack:
- Contract/packaging layer (between protocol specs and concrete runtime targets).

---

## 2) Core framework projects

## OpenAI Agents SDK (`openai/openai-agents-python`)

Positioning:
- Lightweight multi-agent SDK with explicit primitives and built-in tracing; provider-agnostic claim including 100+ LLM support in README/docs. [T34][T56]

Notable primitives:
- agents, handoffs/agents-as-tools, tools, guardrails, sessions, human-in-the-loop, tracing. [T34][T56]

Community signal (2026-04-01):
- GitHub stars: 20,483. [T60]

## LangGraph (`langchain-ai/langgraph`)

Positioning:
- Graph/state machine style orchestration framework with explicit state, node, and edge model; supports super-step style execution concepts. [T37][T73]

Notable strengths:
- loops/branching/stateful orchestration,
- precise control over execution graph.

Community signal:
- GitHub stars: 28,121. [T60]

## CrewAI (`crewAIInc/crewAI`)

Positioning:
- Standalone Python multi-agent framework, explicitly independent of LangChain in project README. [T57]

Notable strengths:
- crew/team abstraction for autonomous collaboration,
- flow abstraction for event-driven orchestration.

Community signal:
- GitHub stars: 47,756. [T60]

## AutoGen (`microsoft/autogen`)

Positioning:
- Multi-agent framework with layered architecture (core + agentchat + extensions), plus GUI/prototyping tooling.
- Project currently recommends new users evaluate Microsoft Agent Framework while AutoGen remains maintained for fixes/security. [T58]

Community signal:
- GitHub stars: 56,548. [T60]

## LlamaIndex (`run-llama/llama_index`)

Positioning:
- Data-centric framework for LLM apps with strong retrieval/document pipeline and workflow support; broad integration ecosystem. [T59][T74A]

Notable strengths:
- ingestion/index/retrieval pipeline composition,
- workflow/event-driven support for agentic patterns.

Community signal:
- GitHub stars: 48,190. [T60]

---

## 3) Protocol-standard repositories (for implementers)

## LangChain Agent Protocol (`langchain-ai/agent-protocol`)

Purpose:
- Framework-agnostic API spec around runs, threads, and store semantics for serving agent systems. [T53]

Community signal:
- Stars: 539. [T60]

## ANP repository (`agent-network-protocol/AgentNetworkProtocol`)

Purpose:
- Open protocol vision for network-scale agent interconnection, DID-oriented identity layer, and negotiation/application layers. [T17][T53]

Community signal:
- Stars: 1,254. [T60]

## MCP repositories

- `modelcontextprotocol/modelcontextprotocol` (spec/docs): 7,678 stars.
- `modelcontextprotocol/servers` (server implementations/examples): 82,703 stars. [T60]

Observation:
- The "servers" ecosystem signal is significantly larger than the spec-only repo, consistent with a tool-integration-heavy adoption path.

## monday.com Agent Tool Protocol (`mondaycom/agent-tool-protocol`)

Purpose:
- Code-execution-first protocol approach positioning itself as an alternative/complement to function-tool-call style protocols. [T64]

Community signal:
- Stars: 92. [T60]

---

## 4) GitLab Duo Agent Platform (industry framework/platform reference)

GitLab's 2026 GA materials show:
- lifecycle-integrated agent platform claims,
- foundational agents (e.g., planner, security analyst),
- custom/external agent support,
- and MCP client/server integration points in documentation. [T41][T42]

This is useful as a reference for "agent platformization" (operationalizing agents across SDLC) rather than as an open protocol standard.

---

## 5) Comparative framework matrix (concise)

| Project | Primary abstraction | Best fit | Open protocol posture |
|---|---|---|---|
| OpenAI Agents SDK | primitives + tracing | Python teams wanting explicit guardrails/handoffs | MCP-aware tooling support |
| LangGraph | stateful graph orchestration | deterministic complex flows, branching/loops | interoperates with Agent Protocol concepts |
| CrewAI | role-based crews + flows | fast multi-agent app development | framework-level, protocol adapters possible |
| AutoGen | conversation/multi-agent architecture | research/prototyping and advanced orchestration | supports MCP patterns; evolving ecosystem path |
| LlamaIndex | data/retrieval + workflows | RAG/document-centric agents | interoperable with external protocols |
| OSSA | manifest contract/export layer | portability/governance and deployment translation | explicit MCP/A2A complementary posture |
| DUADP | discovery/federation layer | cross-registry discovery and trust metadata | registry/discovery complement to execution protocols |

---

## 6) Cost and production maturity notes (from credible engineering commentary)

Production-focused engineering commentary (47Billion) emphasizes:
- major gap between demo and production reliability,
- high debugging and observability costs,
- need for HITL checkpoints and strict guardrails,
- and early adoption of protocol standards (MCP/A2A/AG-UI) to reduce bespoke integrations. [T43]

Interpretation:
- Framework choice should be secondary to architecture controls: policy enforcement, observability, bounded tool permissions, and escalation patterns.

---

## 7) Limitations

- GitHub star counts and npm downloads are popularity signals, not quality/security guarantees.
- Some framework claims (e.g., speed comparisons) are vendor-authored and may require independent benchmarking in your workload.
- "Parlay" in user instructions is ambiguous across multiple projects; no single canonical "Parlay framework" surfaced with unambiguous ecosystem consensus.

