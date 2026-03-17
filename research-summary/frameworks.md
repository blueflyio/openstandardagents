# Open-Source Frameworks and Projects

Snapshot date for repo metrics: **2026-03-17** (via GitHub metadata queries and project docs).

## 1) Framework landscape at a glance

| Project | Type | Core primitives / model | Stars (2026-03-17) | Notes |
|---|---|---|---:|---|
| OpenAI Agents SDK (`openai/openai-agents-python`) | Agent framework SDK | Agents, handoffs/agents-as-tools, tools, guardrails, tracing | 20,058 | Provider-agnostic claim with broad model support and strong observability story [S41] |
| LangGraph (`langchain-ai/langgraph`) | Orchestration framework | Graph/state model, durable execution, memory, human-in-the-loop | 26,649 | Positioned as low-level stateful agent runtime [S42] |
| CrewAI (`crewAIInc/crewAI`) | Multi-agent framework | "Crews" (autonomy) + "Flows" (event-driven control) | 46,310 | Strong enterprise positioning, OSS + commercial control plane [S43] |
| AutoGen (`microsoft/autogen`) | Multi-agent framework | Layered Core API, AgentChat, Extensions, Studio | 55,744 | Mature multi-agent ecosystem; explicit MCP integration examples [S44] |
| LlamaIndex (`run-llama/llama_index`) | Data/agent framework | Data connectors, retrieval/indexing, workflows/agents | 47,729 | Strong RAG/data-centric ecosystem with many integrations [S45] |
| LangChain Agent Protocol (`langchain-ai/agent-protocol`) | Open API spec | `runs`, `threads`, `store`, introspection endpoints | 530 | Important as interoperability contract layer [S17] |
| A2A (`a2aproject/A2A`) | Open protocol repo | Agent Cards, JSON-RPC over HTTP(S), async task model | 22,588 | Large multi-vendor ecosystem momentum [S11][S12] |
| AG-UI (`ag-ui-protocol/ag-ui`) | Open protocol ecosystem | Event-stream contract for agent-UI interactions | 12,500 | Rapidly growing frontend protocol layer [S14][S15] |
| ANP (`agent-network-protocol/AgentNetworkProtocol`) | Open protocol repo | DID identity + meta-protocol + app protocol layers | 1,234 | Conceptually ambitious, earlier maturity stage [S16] |
| ACP (`i-am-bee/acp`) | Open protocol repo | Lightweight message-centric agent communication | 964 | Active integration with A2A/LF direction [S18][S19] |
| Monday ATP (`mondaycom/agent-tool-protocol`) | Protocol/tool-runtime repo | Secure sandboxed code execution for tool use | 90 | Early but novel code-first alternative to schema-heavy patterns [S20] |

## 2) OpenAI Agents SDK: why it matters

OpenAI’s SDK documents a compact set of primitives: agent definitions, delegation/handoffs, tools, guardrails, and tracing. The practical value is that these primitives map to real production concerns (safety checks, compositionality, observability) instead of only prompt abstractions. [S41]

The framework also emphasizes interoperability with many models/providers and provides language-specific SDK tracks (Python and JS/TS references in docs/readme), which lowers lock-in pressure for teams already operating heterogeneous stacks. [S41]

## 3) LangGraph, CrewAI, AutoGen, LlamaIndex

- **LangGraph** is strongest where teams need long-running stateful workflows with deterministic control over transitions and recovery. [S42]
- **CrewAI** emphasizes high-level multi-agent ergonomics ("Crews") plus event-driven production control ("Flows"), with clear enterprise packaging language. [S43]
- **AutoGen** presents a layered architecture (Core/AgentChat/Extensions) that supports both fast prototyping and lower-level runtime customization, plus no-code Studio support. [S44]
- **LlamaIndex** remains a key choice for data-heavy and RAG-centric agent systems because its architecture starts with ingestion/retrieval/indexing before orchestration. [S45]

## 4) OSSA and DUADP npm packages (requested deep dive)

### `@bluefly/openstandardagents`

What it is:
- CLI + schema/manifest tooling for the OSSA contract model ("define once, export everywhere"). [S05][S06][S08]
- Published under Apache-2.0, with homepage and repository linking to OSSA resources. [S08]

Why it matters:
- It is not just a framework helper; it formalizes a **portable contract layer** between protocol stacks (like MCP/A2A) and deployment/runtime targets. [S05][S06]

### `@bluefly/duadp`

What it is:
- TypeScript SDK for DUADP discovery/federation protocol patterns. [S01][S02][S04]
- Includes discovery/registry/federation semantics and identity/trust hooks aligned with protocol docs. [S02][S03]

Why it matters:
- It addresses a less solved piece of the market: decentralized, interoperable, policy-aware discovery of agents/tools across domains. [S01][S02][S03]

## 5) GitLab Duo Agent Platform

GitLab’s GA messaging and docs frame a platform approach: foundational agents, custom agents, external agents, and "agentic chat" embedded in SDLC workflows. [S46][S47][S48][S49][S50]

Operationally relevant features:
- prebuilt specialist agents (for example planner/security roles),
- custom agent catalog and governance controls,
- IDE + web access patterns,
- AI-credit based consumption model.

This is one of the clearest examples of "agentic AI as platform product" rather than library-only adoption. [S46][S47]

## 6) Cost and production engineering signals

Industry engineering analyses (47Billion, Ruh.ai) consistently stress:
- protocol selection as an architectural decision, not a tooling afterthought,
- staged rollout with reliability playbooks,
- cost control via observability, caching, and bounded autonomy.

These are directional sources (non-peer-reviewed) but useful for implementation heuristics and failure-mode awareness. [S51][S52]
