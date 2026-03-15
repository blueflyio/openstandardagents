# Open-Source Frameworks and Projects

Date prepared: 2026-03-15

## 1) Project-level summary

The ecosystem now has two dominant categories:

1. **Runtime/orchestration frameworks** (LangGraph, CrewAI, AutoGen, OpenAI Agents SDK, LlamaIndex)  
2. **Contract/protocol infrastructure projects** (OSSA/OpenStandardAgents, DUADP, Agent Protocol, ANP, MCP/A2A repos)

Production teams increasingly combine both categories instead of choosing only one.

## 2) Key repositories and maturity snapshot

Star counts below were collected via `gh repo view` in this workspace on 2026-03-15.[R55]

| Project | Repo | Stars | Main purpose | Maturity signal |
|---|---|---:|---|---|
| LangGraph | `langchain-ai/langgraph` | 26,421 | Stateful graph-based agent orchestration | Strong OSS traction [R27][R55] |
| CrewAI | `crewAIInc/crewAI` | 46,099 | Role-based multi-agent orchestration | Large community footprint [R24][R55] |
| AutoGen | `microsoft/autogen` | 55,622 | General agentic AI programming framework | Very high adoption and vendor backing [R25][R55] |
| LlamaIndex | `run-llama/llama_index` | 47,684 | Document/data-centric agent and RAG workflows | Mature data-agent ecosystem [R26][R55] |
| OpenAI Agents SDK (Python) | `openai/openai-agents-python` | 19,994 | Lightweight multi-agent workflow framework | Strong growth in 2025-2026 [R23][R55] |
| OpenAI Agents SDK (JS) | `openai/openai-agents-js` | 2,461 | TypeScript/JS agent SDK | Rapidly developing runtime option [R55] |
| Agent Protocol | `langchain-ai/agent-protocol` | 530 | Framework-agnostic hosted agent API standard | Moderate but focused interoperability effort [R28][R55] |
| Agent Network Protocol | `agent-network-protocol/AgentNetworkProtocol` | 1,230 | Agentic web protocol architecture | Early but active standards push [R13][R55] |
| MCP spec repo | `modelcontextprotocol/modelcontextprotocol` | 7,498 | MCP specification and docs | Strong protocol momentum [R08][R55] |
| A2A project repo | `a2aproject/A2A` | 22,521 | Open A2A protocol implementation/spec | Fast multi-vendor adoption [R10][R55] |
| Monday ATP | `mondaycom/agent-tool-protocol` | 90 | Agent Tool Protocol implementation | Emerging/specialized [R17][R55] |

## 3) Framework primitives and strengths

## OpenAI Agents SDK

Core primitives:
- Agents
- Handoffs
- Guardrails
- Tracing.[R19]

Notable for:
- built-in observability,
- explicit safety hooks,
- MCP integration support,
- multi-provider model routing through LiteLLM integration (including large model catalogs).[R19][R20]

## LangGraph

Core strength is explicit stateful graphs (state + nodes + edges + reducers), enabling robust long-running workflows and fine-grained control over branching/human checkpoints.[R21]

LangGraph also aligns with Agent Protocol concepts (runs/threads/store), which helps hosted interoperability.[R14][R21]

## CrewAI

Known for fast role-based multi-agent assembly and strong developer ergonomics. Teams often use it for early production pilots where speed of design iteration matters.[R24][R31]

## AutoGen

Conversation-first multi-agent design and broad enterprise experimentation footprint. Good fit when dialogue and role-to-role interaction is the dominant pattern.[R25]

## LlamaIndex

Strongest in data- and retrieval-centric agent pipelines (RAG/document operations), often used as the retrieval substrate beneath a broader orchestrator.[R26]

## 4) OSSA and DUADP in the framework landscape

## OSSA / `@bluefly/openstandardagents`

Positioning:
- contract/spec and tooling for portable agent manifests,
- integration bridge across protocol/runtime ecosystems,
- CLI + schema + exporters.[R02][R04][R57]

npm metadata (workspace query) confirms active package publication and Apache-2.0 license.[R56]

## DUADP / `@bluefly/duadp`

Positioning:
- TypeScript SDK for decentralized discovery/federation features,
- client + server router + validation + crypto + DID + conformance modules.[R03][R05]

In practice, DUADP acts as a registry/discovery control plane that can sit beside runtime frameworks.

## 5) GitLab Duo Agent Platform

GitLab’s GA release frames an enterprise platform model:
- context-aware agentic chat across SDLC artifacts,
- foundational agents (e.g., planner, security analyst),
- custom/external agent extensibility.[R29][R30]

This is an example of “platformized agents” where governance, workflow integration, and enterprise UX are bundled rather than hand-assembled.

## 6) Cost and operations considerations (from production engineering sources)

Across production blogs and field reports, repeated patterns appear:
- integration debt falls when open protocol standards are adopted early,
- hidden costs often come from observability/debugging and coordination overhead (not only tokens),
- staged rollouts and kill-switch controls are common reliability practices.[R31][R32][R34]

## 7) Selection heuristic

- Choose **LangGraph** when you need explicit state machines and durable graph control.  
- Choose **OpenAI Agents SDK** when you need fast multi-agent assembly with built-in guardrails/tracing and MCP connectivity.  
- Choose **CrewAI/AutoGen** when rapid multi-agent experimentation or conversation-centric collaboration dominates.  
- Use **LlamaIndex** for retrieval-heavy systems.  
- Add **OSSA/DUADP** if portability + discovery across org boundaries are strategic requirements.
