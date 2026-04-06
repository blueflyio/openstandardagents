# Frameworks, SDKs, and Notable Repositories

Date of synthesis: April 6, 2026.

## Framework snapshot (open-source and platform)

## Core framework comparison

| Project | Core idea | Strong fit | Considerations |
| --- | --- | --- | --- |
| OpenAI Agents SDK | Minimal primitives (agents, handoffs, guardrails, tracing) with production-oriented loop tooling.[T35] | Teams wanting low abstraction + observability in Python stacks | Runtime choices and broader model/provider strategy still need explicit governance planning. |
| LangGraph | Low-level graph orchestration for long-running, stateful agents with durable execution and HITL support.[T37] | Complex, stateful, branch-heavy agent workflows | Higher control means higher design complexity. |
| CrewAI | Role/task-oriented multi-agent orchestration framework.[T39] | Structured multi-agent team workflows | Requires clear task design and guardrails to avoid uncontrolled behavior. |
| AutoGen | Programmable framework for agentic AI with broad multi-agent patterns.[T40] | Research and complex collaboration patterns | Can become expensive/complex without strict controls. |
| LlamaIndex | Document-centric agent/data framework, especially useful in RAG-heavy settings.[T41] | Knowledge-intensive assistants and retrieval workflows | Pure orchestration-only use cases may prefer different abstractions. |

## OSSA and DUADP package-level interpretation

## `@bluefly/openstandardagents`

What it is in practice:

- a spec+CLI+SDK package for defining agent manifests and exporting to multiple targets.[T06]
- positioned as infrastructure between protocol layer and deployment runtimes.[T04][T05]

Current package signals:

- version 0.5.1,
- weekly downloads ~269,
- Apache-2.0 license.[T06]

## `@bluefly/duadp`

What it is in practice:

- SDK/server package for discovery/federation node behavior and lookups.[T03]
- discovery-focused layer, not a runtime orchestration framework.[T01][T02]

Current package signals:

- version 0.1.4,
- weekly downloads ~65,
- Apache-2.0 license.[T03]

## GitLab Duo Agent Platform (commercial ecosystem reference)

GitLab Duo Agent Platform reached GA with:

- context-aware agentic chat across lifecycle tasks,
- foundational agents (planner, security analyst),
- flow-based automation,
- external agent integrations,
- MCP client connectivity and governance controls.[T33][T34]

This is important because it indicates enterprise productization of “agent orchestration across SDLC,” not just isolated coding assistants.

## Notable repository metrics (captured April 6, 2026)

The following star counts are snapshots from GitHub repository metadata captured during this run; they are directional and change continuously.[T36][T38][T39][T40][T41][T43][T44][T48]

| Repository | Stars (snapshot) | Notes |
| --- | ---:| --- |
| `microsoft/autogen` | 56,734 | Large OSS agent framework footprint.[T40] |
| `run-llama/llama_index` | 48,327 | Strong document/data-agent adoption signal.[T41] |
| `crewAIInc/crewAI` | 48,126 | High OSS attention for role-based orchestration.[T39] |
| `langchain-ai/langgraph` | 28,512 | Strong orchestration engine momentum.[T38] |
| `openai/openai-agents-python` | 20,596 | Rapid SDK adoption signal.[T36] |
| `ag-ui-protocol/ag-ui` | 12,825 | Significant UI protocol community interest.[T43] |
| `a2aproject/A2A` | 23,033 | Strong protocol visibility.[T44] |
| `langchain-ai/agent-protocol` | 546 | More niche, implementation-oriented standard.[T20] |
| `agent-network-protocol/AgentNetworkProtocol` | 1,259 | Emerging ecosystem project.[T18] |
| `mondaycom/agent-tool-protocol` | 93 | Early-stage but technically distinctive.[T42] |

## Framework and protocol interplay in production

The most robust pattern in 2026 is not “pick one framework and one protocol,” but layered composition:

- framework for orchestration/runtime,
- MCP for tool connectivity,
- A2A for inter-agent collaboration,
- AG-UI for user-facing streaming interfaces,
- optional contract/discovery overlays (OSSA/DUADP) where governance/discovery portability is needed.

## Cost and reliability considerations from engineering literature

Engineering analyses repeatedly highlight that:

- moving from demos to production introduces substantial reliability and observability effort,
- multi-agent systems can inflate operational complexity/cost without strict scope control,
- progressive rollout and human checkpoints remain common best practice.[T29][T49]

## Practical recommendation

If your near-term goal is production reliability:

1. start with one framework and narrow domain scope,
2. enforce strict authorization and output/tool guardrails,
3. add cross-agent protocols only when workflow coupling requires it,
4. treat discovery/governance metadata as a second-phase investment unless regulation requires it now.
