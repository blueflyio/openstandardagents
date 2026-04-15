# Open-Source Frameworks and Projects (2025-2026)

Date of synthesis: April 15, 2026

## Framework landscape

The framework ecosystem is broad, but architecture patterns are converging:

- **Single-agent orchestration with tools and memory**,
- **Multi-agent delegation/handoffs**,
- **Graph/workflow state management**,
- **Production observability and guardrails**,
- **Interoperability via external protocols (MCP, A2A, Agent Protocol, AG-UI)**.

## Key projects

### OpenAI Agents SDK

- Positioning: lightweight, provider-agnostic SDK for multi-agent workflows.[T14][T15]
- Core primitives commonly emphasized: agents, handoffs, guardrails, tracing.[T14][T15]
- README explicitly claims support for OpenAI APIs plus “100+ other LLMs.”[T15]

### LangGraph

- Positioning: low-level orchestration framework for long-running, stateful agents.[T33]
- Notable claims: durable execution, human-in-the-loop interrupts, memory/persistence, production deployment tooling.[T33]
- Interop direction: aligns with LangChain’s Agent Protocol initiative for framework-agnostic serving interfaces.[T12][T13]

### CrewAI

- Positioning: standalone multi-agent framework emphasizing speed/control and separation from LangChain dependencies.[T34]
- Architecture framing: “Crews” for autonomous collaboration and “Flows” for event-driven production orchestration.[T34]

### Microsoft AutoGen

- Historically influential for multi-agent patterns, but now in maintenance mode; Microsoft recommends migration to Microsoft Agent Framework for new projects.[T38]
- Practical implication: still relevant in literature and legacy code, but riskier as a net-new platform choice.[T38]

### LlamaIndex

- Positioning: data-centric framework for retrieval/agentic applications, with a large integration surface.[T39]
- Emphasis on connector-rich ingestion + structured retrieval rather than one single orchestration pattern.[T39]

### GitLab Duo Agent Platform (GA)

- GA announced January 15, 2026, with foundational agents (Planner, Security Analyst), custom agents via AI catalog, external agent integration, and flow automation.[T27]
- Framing: addresses SDLC-wide orchestration and “AI paradox” bottlenecks beyond coding speed alone.[T27]

## Reference projects and standards repos

### Protocol/standards-adjacent

- `modelcontextprotocol/modelcontextprotocol` (MCP docs/spec ecosystem): 7,816 stars.[D01]
- `a2aproject/A2A`: 23,205 stars.[D01]
- `ag-ui-protocol/ag-ui`: 12,993 stars.[D01]
- `langchain-ai/agent-protocol`: 562 stars.[D01]
- `agent-network-protocol/AgentNetworkProtocol`: 1,265 stars.[D01]

### Framework-focused

- `microsoft/autogen`: 57,098 stars.[D01]
- `crewAIInc/crewAI`: 48,932 stars.[D01]
- `run-llama/llama_index`: 48,606 stars.[D01]
- `langchain-ai/langgraph`: 29,323 stars.[D01]
- `openai/openai-agents-python`: 20,791 stars.[D01]

### OSSA/DUADP package projects

- `blueflyio/openstandardagents`: 4 stars (early-stage public GitHub footprint).[D01]
- npm package indicators:
  - `@bluefly/duadp` v0.1.4, 166 weekly downloads.[D02][D03]
  - `@bluefly/openstandardagents` v0.5.1, 204 weekly downloads.[D02][D03]

## Comparative table (framework view)

| Framework / Platform | Primary design center | Core primitives / strengths | Cautions |
| --- | --- | --- | --- |
| OpenAI Agents SDK | Lightweight multi-agent app building | Handoffs, guardrails, tracing, provider-agnostic claim | Newer ecosystem; architecture decisions still evolving |
| LangGraph | Stateful orchestration | Durable execution, memory, HITL, graph workflows | Lower-level; may require more architecture effort |
| CrewAI | Task/role-based multi-agent automation | Crews + Flows split, standalone identity | Performance/comparison claims largely vendor-reported |
| AutoGen | Multi-agent pioneer | Rich historical pattern library | Maintenance mode; migration path recommended |
| LlamaIndex | Data/retrieval-centric agents | Connectors, indexing, retrieval-heavy pipelines | For pure orchestration, may need complementary tooling |
| GitLab Duo Agent Platform | SDLC-native enterprise orchestration | Foundational agents + custom catalog + governance | Primarily platform-bound to GitLab workflows |

## Cost and operations observations from practitioner sources

Practitioner sources emphasize:

- Multi-agent orchestration significantly increases operational complexity and debugging overhead relative to single-agent pipelines.[T24]
- Protocol standardization (MCP/A2A/AG-UI) is presented as a way to reduce bespoke integration burden over time.[T24]
- Cost and latency variability are recurring production constraints and often dominate architecture choices.[T24]

These are useful directional heuristics, but should be validated against organization-specific workloads.

