# Open-Source Frameworks and Projects

## Snapshot

The framework layer is highly active, with both horizontal orchestration frameworks (OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex) and standards-aligned platform layers (OSSA + DUADP) evolving in parallel [[R34]][[R37]][[R38]][[R39]][[R40]][[R06]].

## Key projects and primitives

## OpenAI Agents SDK
- Core primitives: **Agents, handoffs, guardrails, tracing** [[R36]].
- Positioning: lightweight multi-agent workflow framework.
- Open source: MIT (Python + JS repos) [[R34]][[R35]].
- Model breadth: README states support for OpenAI models and "100+ other LLMs" via integration paths [[R36]].

## LangGraph
- Graph-based runtime for resilient/stateful agent workflows [[R37]].
- Strong fit for deterministic control over branching, retries, and long-running state.
- Interoperability synergy with Agent Protocol concepts from LangChain ecosystem [[R29]].

## CrewAI
- Multi-agent orchestration framework with strong popularity and enterprise positioning [[R38]].
- Emphasis: role-based collaborative agents, task decomposition, production observability.

## Microsoft AutoGen
- Agentic programming framework focused on extensibility and scale [[R39]].
- Notable for enterprise integration patterns and multi-agent coordination at scale.

## LlamaIndex
- Strong in RAG-centric and document-grounded agent workflows [[R40]].
- Commonly used when retrieval/data integration is the dominant problem.

## OSSA and DUADP packages as infrastructure frameworks

Although not "agent runtimes" in the same sense as LangGraph/CrewAI:
- `@bluefly/openstandardagents` provides contract/spec/CLI/export infrastructure (Apache-2.0) [[R04]][[R05]].
- `@bluefly/duadp` provides discovery/federation SDK infrastructure (Apache-2.0) [[R09]][[R10]].

This pair is best interpreted as **infrastructure glue**: define + validate agent contracts, then publish/discover across federated environments [[R06]][[R11]].

## GitLab Duo Agent Platform

GitLab's GA messaging and docs describe a platform model with:
- context-aware agentic assistance across SDLC workflows,
- prebuilt agents (including planner/security-oriented flows),
- and catalog-driven custom/external agent integration [[R41]][[R42]].

Practical relevance: this is a strong example of "agent platformization" inside existing DevSecOps workflows rather than standalone bot frameworks.

## GitHub popularity signals (as of March 12, 2026)

| Project | Stars | Primary use | Maturity signal |
|---|---:|---|---|
| microsoft/autogen | 55,506 | Multi-agent programming framework | Mature/high momentum [[R39]] |
| run-llama/llama_index | 47,616 | RAG + agent workflows | Mature/high momentum [[R40]] |
| crewAIInc/crewAI | 45,858 | Role-based multi-agent orchestration | Mature/high momentum [[R38]] |
| langchain-ai/langgraph | 26,218 | Graph runtime for agents | Mature/high momentum [[R37]] |
| a2aproject/A2A | 22,448 | Inter-agent protocol spec and tooling | Fast-growing protocol base [[R58]] |
| openai/openai-agents-python | 19,906 | OpenAI Agents SDK (Python) | Fast-growing framework [[R34]] |
| openai/openai-agents-js | 2,440 | OpenAI Agents SDK (JS/TS) | Early but strong growth [[R35]] |
| agent-network-protocol/AgentNetworkProtocol | 1,224 | ANP protocol | Emerging [[R27]] |
| i-am-bee/acp | 961 | ACP protocol | Emerging [[R30]] |
| langchain-ai/agent-protocol | 529 | Framework-agnostic runtime API spec | Emerging standardization [[R28]] |

## Cost and production operations considerations

Industry engineering writeups point to consistent production patterns:
- Cost spikes happen when model/provider usage is not centrally tracked.
- LLM gateway patterns improve spend attribution, rate limits, and policy control.
- Progressive rollout (increasing autonomy gradually) is safer than full autonomy first [[R43]][[R44]].

Ruh.ai's protocol guide adds a planning lens: choose protocol strategy by topology and failure mode, not by hype; communication mismatch is a frequent implementation failure driver [[R45]].

## Practical framework selection heuristic

1. Use **LangGraph/AutoGen/CrewAI/OpenAI Agents** for execution/orchestration.
2. Add **OSSA-style contract layer** when portability/compliance and multi-target exports matter.
3. Add **DUADP/discovery protocol** if multi-domain publishing/federation is required.
4. Add **MCP + A2A + AG-UI** according to boundary needs (tools, agent collaboration, frontend interaction).
