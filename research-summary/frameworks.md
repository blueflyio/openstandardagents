# Open-Source Frameworks and Projects (late-2025 to early-2026)

Date compiled: March 27, 2026  
Relative-date normalization reference: March 10, 2026

## Executive summary

The framework layer is highly active and fragmented, but practical patterns are converging:

- **General-purpose orchestration frameworks** (OpenAI Agents SDK, LangGraph, CrewAI, AutoGen) are the most mature and actively updated. [S28][S29][S30][S31][S32]
- **Data-centric frameworks** (LlamaIndex) remain strong for RAG/workflows over enterprise data. [S33][S34]
- **Platform-native agent products** (GitLab Duo Agent Platform) are moving from point features to full SDLC orchestration with specialist agents and flows. [S25][S26]
- **Interoperability repos** (A2A, LangChain Agent Protocol, ANP) are increasingly used as boundary contracts rather than end-user frameworks. [S11][S15][S12]

## Framework snapshots

### OpenAI Agents SDK

- Positions as lightweight, provider-agnostic multi-agent workflow framework.
- Explicit core concepts include agents, handoffs/agents-as-tools, tools (including MCP), guardrails, HITL, sessions, and tracing.
- Public README explicitly claims support for OpenAI APIs plus "100+ other LLMs." [S28]

Observed role in stack: orchestration runtime and developer primitives, with strong observability focus.

### LangGraph

- Described as low-level orchestration/runtime for durable, long-running, stateful agents.
- Uses graph abstraction (state, nodes, edges) with a Pregel-inspired message-passing execution model.
- Designed for durability, HITL interrupts, memory, and production deployment workflows. [S32][S29]

Observed role in stack: highly controllable orchestration substrate, often used where deterministic workflow control is needed.

### CrewAI

- Positions as standalone, independent framework (not built on LangChain), emphasizing crews (autonomous collaboration) and flows (event-driven control).
- Strong claims of enterprise-readiness and broad community uptake.
- Supports hybrid usage of autonomous teams plus deterministic flow control. [S30]

Observed role in stack: pragmatic multi-agent automation framework with low-to-mid abstraction and strong workflow ergonomics.

### AutoGen (Microsoft)

- Continues as maintained framework for multi-agent AI apps with autonomous/human-collaborative operation.
- Microsoft now points new users toward Microsoft Agent Framework, while keeping AutoGen for maintenance and critical updates.
- Strong layered architecture claims (core runtime, agentchat abstraction, extensions). [S31]

Observed role in stack: still significant ecosystem footprint; strategic direction indicates evolving Microsoft portfolio segmentation.

### LlamaIndex

- Positions as data framework for LLM/agent applications, with strong ingestion/index/retrieval tooling.
- Workflow docs emphasize event-driven orchestration and step/event abstractions for complex branching/looping applications.
- Tight coupling to document-heavy agentic workloads via LlamaParse/LlamaCloud ecosystem. [S34][S33]

Observed role in stack: document/RAG-first system builder with growing workflow-agent abstractions.

### GitLab Duo Agent Platform

- GA announcement and docs describe end-to-end SDLC orchestration approach (agentic chat + specialist agents + reusable flows).
- Foundational agents include planner and security analyst; custom and external agent categories include Claude Code and Codex integrations.
- Includes MCP client capability for external toolchain context (e.g., Jira/Confluence/Slack). [S25][S26]

Observed role in stack: integrated DevSecOps AI platform where agents are embedded into existing engineering workflow surfaces.

## Notable standards-aligned repositories (not always full frameworks)

- **A2A repository**: canonical protocol implementation/community surface for agent-to-agent interoperability. [S11]
- **LangChain Agent Protocol repository**: OpenAPI-defined interface for runs/threads/store and agent introspection. [S15]
- **ANP repository**: protocol-first effort targeting decentralized identity and multi-layer agent networking. [S12]
- **Monday ATP repository/site**: code-execution-first protocol model for tool interaction and gateway simplification. [S44][S45]

These projects increasingly function as "infrastructure contracts" consumed by frameworks/platforms.

## Maturity signals (GitHub snapshot as of March 27, 2026)

| Project | Stars (approx.) | Repo signal |
| --- | ---:| --- |
| microsoft/autogen | 56k+ | Very large footprint, active updates |
| run-llama/llama_index | 48k+ | Large footprint, active updates |
| crewAIInc/crewAI | 47k+ | Large footprint, active updates |
| langchain-ai/langgraph | 27k+ | Large footprint, active updates |
| openai/openai-agents-python | 20k+ | Rapid growth, active updates |
| a2aproject/A2A | 22k+ | Strong protocol adoption momentum |
| langchain-ai/agent-protocol | 500+ | Niche but active interop contract |
| agent-network-protocol/AgentNetworkProtocol | 1k+ | Early-stage protocol effort |
| mondaycom/agent-tool-protocol | <200 | Early-stage protocol effort |

Source: repository metadata snapshot via GitHub CLI (public metadata), supplemented by project READMEs. [S35]

## Cost and production-readiness observations from engineering literature

The most detailed production narrative in this batch (47Billion) argues:

- Level-2/3 autonomy patterns (structured workflows + single-agent tool use) are currently the practical reliability/cost sweet spot.
- Fully open-ended multi-agent autonomy materially increases debugging and cost overhead.
- HITL and staged rollout remain essential for enterprise reliability. [S27]

This aligns with more cautious security literature emphasizing architecture over model-only trust. [S23][S24]

## "Parlay" status note

The requested framework list includes "Parlay." In this research pass, no widely recognized, high-authority "Parlay" framework emerged as a first-tier ecosystem project equivalent to OpenAI Agents SDK/LangGraph/CrewAI/AutoGen/LlamaIndex. Search results suggest multiple similarly named smaller projects, but not a clear dominant framework standard. [S41]

Interpretation: treat "Parlay" as ambiguous in current ecosystem mapping unless a specific repository or vendor reference is provided.

## Practical selection guidance

- Choose **OpenAI Agents SDK** when you want compact primitives + tracing + broad model/provider flexibility.
- Choose **LangGraph** when you need explicit deterministic orchestration control, durability, and stateful execution semantics.
- Choose **CrewAI** for fast multi-agent automation with explicit crew/flow split.
- Choose **AutoGen** if you already operate in that ecosystem and need continuity with strong multi-agent patterns.
- Choose **LlamaIndex** when data ingestion/retrieval/document pipelines dominate requirements.
- Choose **platform-native stacks** like GitLab Duo where deep SDLC integration and governance are more important than framework-level portability.
