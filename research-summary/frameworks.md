# Open-Source Frameworks and Repositories

Date of synthesis: 2026-04-05

## Framework landscape snapshot

Open-source agent frameworks now occupy distinct niches rather than a single winner-take-all category. Most production stacks in 2026 combine at least one orchestration framework, one protocol layer, and one security/governance approach. `[T19][T20][T21][T22][T23][T24][T27]`

## Key projects and primitives

### OpenAI Agents SDK (Python and JavaScript)

OpenAI's Agents SDK line emphasizes four high-level primitives: agents, handoffs, guardrails, and tracing. The design target is multi-agent application composition with built-in observability and safety boundaries rather than ad hoc prompt orchestration. `[T19]`

### LangGraph

LangGraph uses graph-based execution for stateful agent workflows and aligns with LangChain's broader agent protocol work. It is positioned for long-running, inspectable flows with explicit transitions and tool usage patterns. `[T20][T15][T16]`

### CrewAI

CrewAI splits abstractions into "Crews" (autonomous collaborative agent groups) and "Flows" (event-driven process orchestration). It emphasizes practical throughput and operational control for production automation use cases. `[T21]`

### AutoGen

AutoGen provides layered APIs (core event/messaging model, chat-level abstractions, extensions) plus tooling for prototyping and no-code experimentation (AutoGen Studio). Its documentation explicitly warns against trusting unverified MCP servers, signaling growing security awareness in framework docs themselves. `[T22]`

### LlamaIndex

LlamaIndex is strongest as a data/RAG substrate: connectors, indexing/retrieval structures, and query interfaces that support agent workflows requiring heavy document grounding. `[T23]`

### GitLab Duo Agent Platform (GA)

GitLab's GA positioning integrates specialized agents, context-aware chat, and workflow automation across SDLC tasks with enterprise controls and model-routing flexibility. It indicates enterprise convergence between agent orchestration and existing DevSecOps platforms. `[T24]`

## DUADP + OSSA package-level positioning

### `@bluefly/duadp` (latest observed: 0.1.4; published 2026-03-09)

Purpose: decentralized discovery protocol SDK for agent records, skills, and tools, with DID-aware identity/provenance and federation patterns.

Role in a stack:
- discovery and registration plane,
- trust metadata propagation,
- verification hooks for supply-chain aware agent exchange. `[T01][T03][T07]`

### `@bluefly/openstandardagents` (latest observed: 0.5.1; published 2026-03-28)

Purpose: manifest and tooling standard for portable agent contracts and multi-target export/deployment.

Role in a stack:
- define capabilities and controls once,
- enforce schema and policy compatibility,
- package for runtime targets and ecosystem tools. `[T02][T05][T06]`

## Community maturity signals (selected repositories)

The table below uses repository snapshots collected on 2026-04-05.

| Repository | Main purpose | Stars | Open issues | Last push |
|---|---|---:|---:|---|
| `openai/openai-agents-python` | Agent SDK (Python) | 20,577 | 78 | 2026-04-04 |
| `openai/openai-agents-js` | Agent SDK (JavaScript/TypeScript) | 2,583 | 39 | 2026-04-05 |
| `langchain-ai/langgraph` | Graph-based agent orchestration | 28,449 | 475 | 2026-04-05 |
| `langchain-ai/agent-protocol` | Agent runtime API protocol | 545 | 17 | 2026-04-02 |
| `crewAIInc/crewAI` | Multi-agent framework | 48,066 | 508 | 2026-04-05 |
| `microsoft/autogen` | Multi-agent framework/platform | 56,708 | 731 | 2026-04-02 |
| `run-llama/llama_index` | Data/RAG framework | 48,304 | 271 | 2026-04-04 |
| `a2aproject/A2A` | Agent-to-agent open protocol | 23,019 | 225 | 2026-04-02 |
| `modelcontextprotocol/servers` | MCP server implementations | 82,994 | 668 | 2026-03-29 |
| `modelcontextprotocol/modelcontextprotocol` | MCP specification | 7,719 | 213 | 2026-04-04 |
| `agent-network-protocol/AgentNetworkProtocol` | ANP spec/SDK direction | 1,259 | 20 | 2026-04-05 |
| `mondaycom/agent-tool-protocol` | ATP proposal and implementation | 93 | 0 | 2026-03-23 |

Source references for repository metrics: `[T25][T26][T44]`

## Cost and operations patterns in practice

Practitioner analyses repeatedly highlight:

1. **Autonomy-level calibration** (avoid defaulting to maximum autonomy).
2. **Strict boundarying of tools and permissions**.
3. **Progressive rollout and telemetry-first deployment**.
4. **Token/cost observability as a first-class requirement**.

Framework selection typically follows workload shape:
- Highly deterministic workflows: graph/event systems.
- Collaborative decomposition tasks: crew/multi-agent abstractions.
- Data-heavy grounded reasoning: RAG/data frameworks.
- Cross-vendor interoperability: protocol-first compositions. `[T27][T28][T29]`

## Selection heuristics (concise)

- Choose by failure mode tolerance, not only benchmark speed.
- Prefer frameworks with strong tracing, policy hooks, and explicit state models.
- Validate protocol compatibility early (MCP, A2A, AG-UI, agent runtime APIs).
- For multi-team deployments, require manifest/deployment contracts and discovery trust metadata. `[T08][T11][T12][T15][T01][T02]`
