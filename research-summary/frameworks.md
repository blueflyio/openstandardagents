# Open-Source Frameworks and Platforms (2025-2026)

This document summarizes major frameworks and platforms used to build and operate agentic systems, with emphasis on primitives, maturity signals, and interoperability posture.

## 1) Snapshot comparison

| Project / platform | Primary role | Core primitives / architecture | Public maturity signals* | Notes |
| --- | --- | --- | --- | --- |
| OpenAI Agents SDK | Multi-agent app SDK | Agents, tools, handoffs, guardrails, tracing, sessions | `openai/openai-agents-python` ~20k+ stars [T34] | Provider-agnostic support claim (100+ LLMs) in README [T33] |
| LangGraph | Orchestration runtime | Stateful graph execution, durable runs, human-in-loop, streaming | `langchain-ai/langgraph` ~27k+ stars [T36] | Low-level orchestration focus, broad production claims [T35] |
| CrewAI | Multi-agent orchestration framework | "Crews" (autonomy) + "Flows" (event-driven control) | `crewAIInc/crewAI` ~47k+ stars [T38] | Strong productization narrative around enterprise control plane [T37] |
| AutoGen | Multi-agent framework ecosystem | Layered APIs (Core, AgentChat, Extensions), Studio, Bench | `microsoft/autogen` ~56k+ stars [T40] | Maintained; Microsoft points new users to Agent Framework [T39] |
| LlamaIndex | Data/doc/RAG-centric agent stack | Retrieval, indexing, document-agent patterns | `run-llama/llama_index` ~48k+ stars [T41] | Strong for document-heavy pipelines [T41] |
| GitLab Duo Agent Platform | Integrated enterprise agent platform | Foundational/custom/external agents + flows + governance controls | GA docs and feature matrix [T42][T43] | Lifecycle-integrated DevSecOps posture; usage credits model [T42] |

\*Public stars are directional popularity signals, not proof of production quality.

## 2) OpenAI Agents SDK

The OpenAI Agents SDK describes a compact set of production primitives: agents, tools, guardrails, handoffs, tracing, sessions, and human-in-the-loop mechanisms [T33]. The Python README explicitly states provider-agnostic support (OpenAI APIs plus "100+ other LLMs") [T33].

Why it matters:
- Gives teams a minimal "agent control loop + tooling + observability" model.
- Guardrails and tracing are first-class, which helps teams with safety/debug pipelines.
- Works well where teams want SDK-level control rather than full platform lock-in.

Potential caveats:
- "Provider agnostic" claims still require verifying adapter quality and behavior across chosen providers in your own test harness.

## 3) LangGraph

LangGraph positions itself as a low-level orchestration/runtime layer for long-running, stateful agents, emphasizing durable execution, interruptions/human checkpoints, and deployment observability [T35].

Why it matters:
- Strong fit for workflows where deterministic control flow and resumability matter.
- Encourages explicit state and graph edges, which can improve incident diagnosis.
- Aligns well with protocolized serving patterns (for example Agent Protocol concepts around runs/threads/store) [T29][T35].

Potential caveats:
- Lower-level control can increase engineering overhead for simple use cases.

## 4) CrewAI

CrewAI emphasizes two complementary abstractions:
- **Crews** for collaborative autonomous agents.
- **Flows** for event-driven, production workflow control [T37].

The framework strongly markets itself as independent from LangChain and focused on speed, control, and enterprise production patterns [T37].

Why it matters:
- Practical for teams that need a middle ground between rigid workflows and free-form agent interactions.
- Makes explicit the distinction between autonomous collaboration and deterministic orchestration.

Potential caveats:
- Claims of comparative performance vs alternatives are project-published and should be independently validated in your workload.

## 5) AutoGen

AutoGen remains a major open-source framework with layered architecture:
- Core message/event runtime
- AgentChat for higher-level workflows
- Extensions for model/tool integrations [T39]

Microsoft's README flags strategic guidance: new users are pointed to Microsoft Agent Framework, while AutoGen continues to receive maintenance/security updates [T39].

Why it matters:
- Still relevant for existing AutoGen deployments and research-heavy multi-agent patterns.
- Rich ecosystem around experimentation, studio prototyping, and benchmarking.

Potential caveats:
- Teams beginning greenfield enterprise work should assess Microsoft’s newer strategic path in parallel.

## 6) LlamaIndex

LlamaIndex has evolved from retrieval tooling into a broader "document agent and OCR platform" positioning [T41]. In practice, it remains especially strong where:
- document ingestion/retrieval quality is central,
- RAG grounding quality dominates outcomes,
- indexing and data connectors are core to value.

Why it matters:
- Good fit for agent systems where data pipeline quality matters more than multi-agent choreography complexity.

## 7) GitLab Duo Agent Platform

GitLab Duo Agent Platform reached GA with:
- Agentic chat integrated across SDLC context,
- foundational agents (for example planner, security analyst),
- custom and external agents,
- foundational flows for issue-to-MR, code review, CI/CD conversion/fix, and other lifecycle tasks [T42][T43].

Why it matters:
- Represents a "platform-native agentization" model for enterprise DevSecOps.
- Couples agent features with governance controls, model selection, and tiered deployment options [T42][T43].

Potential caveats:
- Best fit for organizations already standardized on GitLab workflows.

## 8) Related frameworks/protocol-adjacent projects

- LangChain Agent Protocol (`langchain-ai/agent-protocol`) defines framework-agnostic serving interfaces around runs, threads, and store [T29][T30].
- Agent Tool Protocol (ATP) argues for code-execution-centric agent behavior over tool-call abstraction, with strong performance claims in project materials [T31][T32]. Treat performance tables as directional unless independently reproduced.

## 9) Practical framework selection guidance

### Favor SDK-centric approach when:
- You need maximal control over orchestration and policy checks.
- You have internal platform engineering capacity.

### Favor orchestration-runtime approach when:
- You need durable, stateful long workflows with interruption/resume.
- You need clear graph/state introspection.

### Favor integrated platform approach when:
- You want fast enterprise rollout in an existing ecosystem (for example GitLab).
- You prioritize policy/governance consolidation over custom runtime control.

### Favor document-first stack when:
- Your agent quality is bottlenecked by retrieval/indexing/document transformations.

## 10) Bottom line

Frameworks are converging on similar primitives (agent config, tools, memory/state, delegation, observability). Selection is less about headline "autonomy" and more about:
- control vs abstraction,
- governance requirements,
- integration surface area,
- and operational maturity in your specific domain [T29][T33][T35][T42].

