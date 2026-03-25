# Open-Source Frameworks and Projects (2025-2026)

Date of synthesis: 2026-03-25

## 1. Core framework landscape

The current framework layer is crowded, but there is a practical split:

- **General multi-agent orchestration**: OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex [S15][S16][S36][S37][S38][S39][S40]  
- **Protocol-first interoperability repos**: Agent Protocol, A2A, ANP, AG-UI [S13][S08][S11][S10]  
- **Contract/deployment abstractions**: OSSA [S03][S04]  
- **Enterprise workflow-integrated platforms**: GitLab Duo Agent Platform [S17][S47]

## 2. Detailed project notes

### 2.1 OpenAI Agents SDK

**Primary source**: `openai/openai-agents-python` README and repo metadata. [S15][S36]

Key points:

- Positions itself as lightweight and provider-agnostic (OpenAI APIs + 100+ other LLMs). [S15]  
- Core constructs include agents, handoffs, tools, guardrails, tracing, sessions, and human-in-the-loop support. [S15]  
- High OSS traction (stars snapshot in reading-list). [S36]

Interpretation: strong developer ergonomics and observability focus, especially for teams that want programmable multi-agent flows without committing to one model vendor.

### 2.2 LangGraph

**Primary source**: LangGraph docs and repo metadata. [S16][S37]

Key points:

- Graph-based, low-level orchestration framework emphasizing durable execution, HITL interrupts, memory, and production deployment patterns. [S16]  
- Explicitly scoped as orchestration infrastructure rather than opinionated “one-shot” agent wrappers. [S16]  
- Strong OSS momentum (stars snapshot in reading-list). [S37]

Interpretation: best fit where stateful long-running workflows and recovery semantics matter more than rapid prototyping convenience.

### 2.3 CrewAI

**Primary source**: GitHub metadata + industry implementation writeups. [S38][S31]

Key points:

- Popular role/task oriented multi-agent framework (large star count). [S38]  
- Industry practitioners (47Billion) describe it as a practical middle ground for structured multi-step workflows versus more open-ended conversational multi-agent systems. [S31]

Interpretation: useful for explicit task decomposition with moderate complexity and manageable control flow.

### 2.4 AutoGen

**Primary source**: GitHub metadata + practitioner case comparisons. [S39][S31]

Key points:

- Positioned as a programming framework for agentic AI with large OSS adoption. [S39]  
- Practitioner reports describe strong flexibility for exploratory collaboration, but potentially higher token costs and debugging complexity in multi-agent loops. [S31]

Interpretation: high ceiling for complex agent collaboration but requires stronger operational controls for cost and stability.

### 2.5 LlamaIndex

**Primary source**: GitHub metadata + production comparison article. [S40][S31]

Key points:

- Strongly associated with document-centric and retrieval-centric agent workflows. [S31][S40]  
- Practitioner reports emphasize strengths in data/retrieval-heavy tasks and event-driven workflow composition. [S31]

Interpretation: often strongest when your agent system is fundamentally knowledge retrieval and synthesis driven.

### 2.6 LangChain Agent Protocol repository

**Primary source**: protocol README + repo metadata. [S13][S14]

Key points:

- Defines framework-agnostic serving APIs around runs, threads, and store/memory. [S13]  
- OpenAPI-first structure with LangGraph Platform as a superset implementation. [S13]  
- Important as a protocol baseline even if teams use different runtime stacks. [S13]

### 2.7 ANP and AG-UI repos

- **ANP**: identity/meta-protocol/application layers with DID emphasis; aims at open “agentic web” interconnection. [S11]  
- **AG-UI**: event-based frontend-backend interaction protocol for agentic UX and multimodal/HITL flows. [S10]

Both are standards-oriented initiatives rather than full application frameworks.

### 2.8 GitLab Duo Agent Platform

**Primary source**: GitLab GA announcement + platform page. [S17][S47]

Key points:

- GA positioning for “agentic AI across software lifecycle” in GitLab context. [S17]  
- Includes foundational agents (planner, security analyst), flows (developer, code review, CI fixes), and model-selection/governance controls. [S17][S47]  
- Integrates external agents (for example Claude Code and Codex CLI) and MCP client connectivity for external systems. [S17]

Interpretation: enterprise productized “agent operations” in DevSecOps, integrating governance and workflow surfaces directly where developers already work.

## 3. Focus section: DUADP + OSSA npm packages

### 3.1 `@bluefly/duadp`

**What it is**:

- Official TypeScript SDK for DUADP discovery/federation protocol. [S02][S34]  
- npm package metadata indicates Apache-2.0, small package footprint, and early-stage release history in March 2026. [S02][S34]

**Core capabilities (claimed)**:

- Client/server router for DUADP endpoints  
- validation, crypto signing/verification, DID resolution, conformance tooling [S02][S34]

**Practical role**:

- Discovery-plane building block; not a replacement for orchestration frameworks.

### 3.2 `@bluefly/openstandardagents`

**What it is**:

- OSSA CLI/SDK for portable agent manifests and exports. [S04][S35]  
- Apache-2.0; version 0.5.0 in March 2026 with broad command surface and platform adapters. [S04][S35]

**Core capabilities (claimed)**:

- Manifest authoring/validation/migration/export  
- Multi-target export (examples include Docker/K8s/LangChain/CrewAI/MCP/A2A and more), with maturity labels per target. [S35]

**Practical role**:

- Contract/deployment abstraction layer to reduce duplicate per-platform config work.

### 3.3 Quick package comparison

| Package | Primary function | npm signal (late Mar 2026) | Maturity signal |
| --- | --- | --- | --- |
| `@bluefly/duadp` | discovery/federation SDK | lower download volume vs mature ecosystem packages | early-stage, focused |
| `@bluefly/openstandardagents` | manifest/contract/export tooling | early but active package cadence | broad surface, mixed maturity claims |
| `@mondaydotcomorg/atp-client` | ATP protocol client SDK | significantly higher weekly download volume | product-attached adoption |

Sources: [S02][S04][S30][S34][S35]

## 4. Notable OSS repos snapshot (selected)

Snapshot values and links are in reading-list. Highlights include:

- OpenAI Agents SDK [S36]  
- LangGraph [S37]  
- CrewAI [S38]  
- AutoGen [S39]  
- LlamaIndex [S40]  
- MCP servers repo [S06]  
- A2A repo [S48]  
- AG-UI repo [S10]  
- Agent Protocol [S14]  
- ANP repo [S11]

## 5. Cost and operations observations from engineering blogs

47Billion’s production-focused writeup emphasizes:

- architecture level choices (single-agent vs multi-agent) materially change cost and reliability;  
- progressive rollout and HITL are practical necessities;  
- protocol adoption (MCP/A2A/AG-UI) can reduce custom integration burden if adopted intentionally. [S31]

Because this is a consultancy source, treat exact numbers as directional, not canonical benchmarks.

## 6. Risks and residual gaps

- Framework choice alone does not solve identity/authz/runtime governance gaps. [S23][S25]  
- Cross-framework “interoperable” claims still vary in real implementation depth.  
- Many stars/downloads indicate interest, but not guaranteed enterprise readiness.

