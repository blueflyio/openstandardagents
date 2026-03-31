# Frameworks and Open-Source Ecosystem (late 2025 to early 2026)

This document summarizes major open-source and productized agent frameworks and related repositories, including adoption indicators and practical trade-offs. Citation keys map to `reading-list.md`.

## 1) OpenAI Agents SDK

OpenAI positions its Agents SDK as a lightweight, production-oriented framework with a small primitive set: agents, handoffs (or agents-as-tools), guardrails, and tracing [S32][S33]. The npm package (`@openai/agents`) and GitHub repos (JS + Python) show rapid ecosystem growth with substantial weekly downloads and strong repository traction [S34][S35][S36].

### Core primitives and capabilities

- Agents with instructions, tools, and model config [S33].
- Handoffs / agents-as-tools for multi-agent composition [S33].
- Guardrails and human-in-the-loop workflows [S33].
- Built-in tracing, plus support for realtime voice agents [S33].

### Practical fit

- Best when teams want minimal abstraction overhead and direct control of orchestration logic.
- Strong fit for organizations already using OpenAI APIs, though the SDK is documented as provider-agnostic in parts of the ecosystem narrative [S34].

---

## 2) LangGraph

LangGraph is positioned as a low-level orchestration runtime for long-running, stateful agents. Its docs emphasize durability, human oversight, memory, and streaming, while explicitly noting that it does not abstract away prompts/architecture decisions [S37].

### Core strengths

- Durable execution for resumable long tasks [S37].
- Human-in-the-loop interrupt points [S37].
- State/memory handling and production deployment pathways [S37].
- Strong observability pairing with LangSmith [S37].

### Ecosystem indicators

- Large and active GitHub presence suggests broad developer adoption [S38].
- LangChain also promotes an Agent Protocol interoperability surface where LangGraph can interact with non-LangGraph agent systems [S16].

---

## 3) CrewAI

CrewAI describes a two-part architecture: **Flows** (stateful process backbone) and **Crews** (autonomous collaborative agent teams) [S39]. It is commonly used for role-based multi-agent automation with explicit process structure.

### Core strengths

- Combines deterministic flow control with autonomous team collaboration [S39].
- Marketed for enterprise-oriented security/compliance and production automation [S39].
- Large GitHub community indicates strong mindshare in multi-agent orchestration [S40].

### Caveat

- A package named `crewai` exists on npm but appears historically different from the current primary Python-focused project lineage; repository and package provenance should be checked carefully per deployment target [S40].

---

## 4) Microsoft AutoGen

AutoGen is a long-running and widely cited framework family for agentic composition and orchestration. The public repo indicates significant community use and active evolution [S41].

### Typical use profile

- Multi-agent conversation/coordination workflows.
- Research-heavy and experimental-to-production bridge scenarios.
- Broad usage in enterprise prototypes and academic implementations.

### Caveat

- As with any fast-moving framework, API layers and recommended architecture patterns can shift quickly; operational governance, evals, and observability should be built in from the start.

---

## 5) LlamaIndex

LlamaIndex remains highly adopted for data-centric LLM applications and document/RAG pipelines, with substantial npm download activity for the TS package and very strong GitHub traction for the broader project [S42][S43].

### Core strengths

- Data and retrieval-centric abstractions.
- Multi-environment runtime support in TS package docs [S42].
- Commonly used for document ingestion, indexing, retrieval, and agent workflows layered over enterprise data.

---

## 6) GitLab Duo Agent Platform

GitLab announced GA for Duo Agent Platform in early 2026, emphasizing full software lifecycle coverage (analysis, coding, CI/CD, security), specialized foundational agents, custom AI catalog, and integrations with external tools/agents [S44].

### Notable platform features (GA announcement)

- Agentic chat integrated in GitLab surfaces and IDE extensions [S44].
- Foundational agents such as planner and security analyst [S44].
- Flows for issue-to-MR, CI migration/fixing, and code review automation [S44].
- MCP client support for third-party context systems (e.g., Jira/Confluence/Slack) [S44].

### Strategic significance

- Represents how “agent frameworks” are being embedded into full SDLC platforms, not only standalone SDKs.

---

## 7) OSSA and DUADP in context (requested focus)

From the requested sites and npm pages:

- **OSSA** positions itself as a contract/manifest layer between protocols (MCP/A2A) and runtime platforms, with CLI export/scaffolding across many targets [S02][S04].
- **DUADP** positions itself as decentralized discovery/federation infrastructure (“DNS-like” layer for agents/tools/skills), with DID/trust and federated gossip concepts [S01][S03].

In ecosystem terms, they are not direct substitutes for OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, or LlamaIndex. They are better interpreted as complementary infrastructure ambitions:

- OSSA: definition + portability layer.
- DUADP: discovery + federation layer.
- Mainstream frameworks: execution/orchestration layer.

---

## 8) Snapshot table (features and indicators)

| Project | Primary role | Key primitives/capabilities | Public traction signal* |
| --- | --- | --- | --- |
| OpenAI Agents SDK | Agent runtime SDK | agents, handoffs, guardrails, tracing | High npm + strong GitHub [S34][S35][S36] |
| LangGraph | Low-level orchestration | durable execution, HITL, stateful graphs | High GitHub [S38] |
| CrewAI | Multi-agent + flow architecture | crews + flows, role-based collaboration | High GitHub [S40] |
| AutoGen | Agentic programming framework | multi-agent coordination patterns | High GitHub [S41] |
| LlamaIndex | Data/RAG + agents | indexing/retrieval + agent workflows | High npm + high GitHub [S42][S43] |
| GitLab Duo Agent Platform | Integrated SDLC agent platform | foundational agents, flows, catalog, governance | Product GA announcement [S44] |
| OSSA | Contract/manifest portability | schema + validation + export targets | Early-stage npm/community [S04] |
| DUADP | Discovery/federation protocol | `.well-known` discovery, federation, DID/trust | Early-stage npm/community [S03] |

*Traction signals are directional and should not be treated as quality guarantees.

---

## 9) Practical recommendations for teams selecting frameworks

1. **Pick execution first, protocol second, discovery third.**  
   Start with the runtime framework that matches your product constraints (latency, governance, data access, team skills). Then layer protocol interoperability and discovery/federation requirements.

2. **Bias toward observability-rich stacks.**  
   For production agents, tracing and replay matter as much as model quality.

3. **Design for constrained autonomy.**  
   Regardless of framework, add explicit approval/guardrail steps for high-impact actions.

4. **Treat ecosystem metrics cautiously.**  
   Stars/downloads indicate attention, not security or correctness.

5. **Separate control-plane and data-plane concerns.**  
   A manifest/discovery layer (OSSA/DUADP-style) can complement runtime frameworks, but it does not replace robust execution controls.
