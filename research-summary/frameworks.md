# Frameworks, Platforms, and Open Repositories (late-2025 to early-2026)

This document summarizes major open-source frameworks, standards repositories, and platform offerings used to build or operate agentic systems.  
Citation keys reference `reading-list.md`.

## 1) Quick landscape

Three major implementation layers are visible in 2026:

1. **Framework layer** (how an agent/team is built and orchestrated): OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex [S31][S32][S33][S34][S35]
2. **Protocol/interop layer** (how agents talk to tools/agents): MCP, A2A, Agent Protocol, ANP, AG-UI [S06][S09][S13][S12][S11]
3. **Platform/ops layer** (how teams run agent workflows at enterprise scale): GitLab Duo Agent Platform, hosted governance/control planes, MCP clients [S36][S37][S38]

## 2) Core frameworks and their primitives

### 2.1 OpenAI Agents SDK (JavaScript/TypeScript)

- Describes itself as lightweight and provider-agnostic [S31]
- Core concepts include:
  - agents
  - tools
  - handoffs / agents-as-tools
  - guardrails
  - sessions
  - tracing
  - human-in-the-loop [S31]
- Strong fit for teams wanting direct JS/TS ergonomics with integrated tracing/voice paths [S31]

### 2.2 LangGraph

- Low-level orchestration framework for **stateful, long-running** agents [S32]
- Emphasis on:
  - durable execution
  - human interrupts
  - memory
  - production deployment and observability [S32]
- Strong fit where reliability and resumability are more important than shortest setup time [S32]

### 2.3 CrewAI

- Python framework independent of LangChain [S33]
- Distinguishes:
  - **Crews** (autonomous, role-based collaboration)
  - **Flows** (event-driven, explicit control paths for production) [S33]
- Enterprise framing includes control-plane observability and deployment options [S33]

### 2.4 AutoGen

- Historically important multi-agent framework, but currently in **maintenance mode** and community-managed [S34]
- Microsoft recommends new projects use Microsoft Agent Framework and migrate over time [S34]
- Still useful for legacy estates, but lower strategic durability for greenfield systems [S34]

### 2.5 LlamaIndex

- Strongly positioned in document-centric retrieval and agentic data workflows [S35]
- Commonly selected where RAG and enterprise knowledge-grounding are first-order concerns [S35]

## 3) Open standards repositories and health signals

The following snapshot uses public repository metadata and should be treated as directional, not absolute benchmarking [S41][S42][S43][S44][S45][S46][S47][S48].

| Project | Repo | Stars (observed Apr 19, 2026) | Signal |
|---|---|---:|---|
| AutoGen | `microsoft/autogen` | ~57k | Large install base, but now maintenance mode [S34][S43] |
| CrewAI | `crewAIInc/crewAI` | ~49k | Very high community traction in Python agent builders [S33][S42] |
| LlamaIndex | `run-llama/llama_index` | ~48k | Strong retrieval/data agent ecosystem [S35] |
| LangGraph | `langchain-ai/langgraph` | ~29k | Leading stateful orchestration framework [S32][S41] |
| A2A | `a2aproject/A2A` | ~23k | Rapid protocol visibility and partner growth [S10][S47] |
| MCP spec/docs | `modelcontextprotocol/modelcontextprotocol` | ~7.8k | Core protocol anchor plus broad ecosystem usage [S07][S48] |
| OpenAI Agents JS | `openai/openai-agents-js` | ~2.7k | Newer but rapidly growing official SDK [S31][S44] |
| ANP | `agent-network-protocol/AgentNetworkProtocol` | ~1.2k | Early but active standards effort [S12][S46] |
| LangChain Agent Protocol | `langchain-ai/agent-protocol` | ~569 | Niche but clear interop design [S13][S45] |

## 4) GitLab Duo Agent Platform as enterprise reference

GitLab’s GA release is useful as a concrete enterprise model:

- **Agentic chat** with lifecycle context (issues, MRs, CI, security findings) [S36][S37]
- **Foundational agents** at GA:
  - Planner
  - Security Analyst [S36][S37]
- **Custom agents** via AI catalog
- **External agents** including Claude Code and OpenAI Codex [S36][S37][S38]
- **Foundational flows** for repeatable multi-step automation (issue→MR, CI fix, code review, etc.) [S36][S37]

This shows how enterprises are moving from “single coding assistant” to “portfolio of specialized agents + flow orchestration + governance controls” [S36][S38].

## 5) Cost and reliability considerations from practitioner evidence

47Billion’s production writeup is useful as field telemetry (single source, but detailed):

- Multi-agent architectures increase debugging and coordination overhead materially
- Human-in-the-loop checkpoints are often required in production
- Protocol standardization (MCP, A2A, AG-UI) is framed as a way to reduce bespoke integrations
- Long-term reliability depends more on guardrails/ops design than on raw model capability [S39]

Interpretation:

- Framework selection should be based on **operating model fit** (stateful/durable vs rapid autonomy vs RAG-centric), not hype.
- The highest ROI path for most teams remains constrained agent automation with explicit controls before full autonomy [S39].

## 6) What this means for builders

For late-2025/early-2026 strategy:

1. Pick one primary orchestration framework (LangGraph/CrewAI/OpenAI Agents SDK class) and avoid parallel-stack sprawl [S31][S32][S33]
2. Adopt protocol interfaces early (MCP now; A2A where multi-agent collaboration is real) [S06][S10]
3. Treat observability and authorization as launch requirements, not post-launch hardening [S25][S26]
4. Prefer open, documented artifacts (agent cards, manifests, typed schemas) to reduce migration and lock-in risk [S03][S13][S47]

