# Open-Source Frameworks, Repositories, and npm Packages

## Framework comparison

| Project | Primary fit | Core primitives | Community signal |
| --- | --- | --- | --- |
| OpenAI Agents SDK | Lightweight managed agent loops | Agents, handoffs, guardrails, tracing | 26,290 GitHub stars [S27] |
| LangGraph | Durable stateful orchestration | Graphs, state, persistence, interrupts | 32,027 GitHub stars [S28][S33] |
| CrewAI | Structured multi-agent workflows | Flows, crews, agents, tasks | 51,380 GitHub stars [S29][S34] |
| AutoGen | Conversational/distributed multi-agent systems | Studio, AgentChat, Core, Extensions | 58,025 GitHub stars [S30][S35] |
| LlamaIndex | RAG/document agents | FunctionAgent, AgentWorkflow, query engines | 49,399 GitHub stars [S31][S35] |
| GitLab Duo Agent Platform | DevSecOps lifecycle orchestration | Agentic chat, foundational agents, custom catalog | GA Jan. 15, 2026 [S32] |
| OSSA | Portable agent contract and exporter | Manifest, validation, generation, migration, trust | npm v0.5.1 [S04] |
| DUADP | Federated discovery SDK/node | Client, server, validate, crypto, DID, conformance | npm v0.1.4 [S05][S06] |
| AI-Parrot/Parlay-like | Async Python agents/chatbots | AgentCrew, A2A/MCP support, tools | 26 GitHub stars [S35] |

## OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight framework for building agentic applications with a small abstraction surface [S26]. It emphasizes:

- Agents: LLMs equipped with instructions and tools.
- Agents as tools / handoffs: delegation between specialized agents.
- Guardrails: validation of inputs and outputs.
- Tracing: visualization, debugging, monitoring, evaluation, fine-tuning, and distillation support [S26].

The SDK adds a managed runtime around model calls: agent loop, function tools with schema generation, MCP server tool calling, sessions, human-in-the-loop, sandbox agents, and realtime voice agents [S26]. The Python repository had 26,290 stars when fetched [S27]. It is a good fit when teams want a small primitive set rather than a large orchestration DSL.

## LangGraph

LangGraph is LangChain's low-level orchestration framework and runtime for long-running, stateful agents [S28]. It is focused on durable execution, streaming, human-in-the-loop, memory, persistence, debugging, and production deployment [S28].

Unlike higher-level agent frameworks, LangGraph does not abstract away prompts or architecture. Developers explicitly define state graphs, nodes, edges, checkpoints, and interruption/resume behavior [S28]. It is appropriate when workflows need cycles, retries, state recovery, user approvals, and long-lived execution. The repository had 32,027 GitHub stars when fetched [S33].

LangGraph also connects directly to LangChain's broader product stack: LangChain for framework abstractions, LangSmith for tracing/evaluation/deployment, and Deep Agents as a higher-level harness on top of LangGraph [S28].

## CrewAI

CrewAI is a framework for orchestrating autonomous AI agents and production workflows [S29]. Its core split is:

- Flows: stateful, structured, event-driven process definitions.
- Crews: teams of role-playing agents that collaborate on specific delegated tasks [S29].

CrewAI's docs recommend starting production applications with a Flow, then delegating complex work to Crews when autonomy is useful [S29]. Features include state management, event-driven execution, control flow, specialized agents, task delegation, tool integration, enterprise security posture, and cost-efficient token usage claims [S29]. The repository had 51,380 GitHub stars when fetched [S34].

CrewAI's strength is pragmatic structure: enough autonomy for multi-agent work, but more deterministic control than open-ended agent conversation [S36].

## Microsoft AutoGen

AutoGen is a Microsoft framework for building AI agents and applications. Its current architecture is organized into Studio, AgentChat, Core, and Extensions [S30].

- Studio is a web UI for prototyping agents without code.
- AgentChat is a high-level Python framework for conversational single- and multi-agent apps.
- Core is an event-driven framework for scalable multi-agent systems.
- Extensions integrate external systems such as MCP servers, OpenAI Assistants, Docker code execution, and gRPC distributed runtimes [S30].

The repository had 58,025 GitHub stars when fetched and uses CC-BY-4.0/MIT licensing according to the GitHub metadata [S35]. AutoGen is powerful for research, exploratory conversation, and distributed agent patterns, but production teams should pay attention to cost, guardrails, and successor-framework messaging in Microsoft's ecosystem [S35][S36].

## LlamaIndex

LlamaIndex defines an agent as semi-autonomous software powered by an LLM that takes a task, chooses tools, executes steps, and loops until the task is complete [S31]. Its prebuilt agents include `FunctionAgent` for function/tool calling and `AgentWorkflow` for managing multiple agents [S31].

LlamaIndex is especially strong when agents need RAG, document/query engines, retrieval, knowledge base integration, and agentic research workflows [S31][S36]. The repository had 49,399 GitHub stars when fetched [S35]. Compared with CrewAI or LangGraph, LlamaIndex is less about general process orchestration and more about connecting agents to information-rich data sources [S31][S36].

## GitLab Duo Agent Platform

GitLab announced general availability of GitLab Duo Agent Platform on January 15, 2026 for GitLab Premium and Ultimate customers on GitLab.com and Self-Managed, with Dedicated availability planned for GitLab 18.8 [S32].

Key components include:

- Agentic Chat: context-aware assistance across GitLab Web UI and IDEs, drawing on issues, merge requests, pipelines, security findings, and repository context [S32].
- Foundational Agents: Planner Agent and Security Analyst Agent [S32].
- Custom Agents: AI catalog for teams to create, publish, manage, and share agents and flows [S32].
- External Agents: integrated Claude Code and Codex CLI for code generation, review, and analysis [S32].
- Foundational flows: issue-to-MR, convert to GitLab CI/CD, fix CI/CD pipeline, code review, and IDE software development flows [S32].
- Governance and deployment: visibility, usage/activity details, model selection, self-hosted models on Self-Managed, namespace access control, LDAP/SAML support [S32].

GitLab's announcement is important because it shows agent platforms moving from isolated IDE assistance into whole-lifecycle orchestration with enterprise controls and usage-based credits [S32].

## OSSA npm package: @bluefly/openstandardagents

`@bluefly/openstandardagents` is the npm package for OSSA. Version metadata fetched from npm shows latest v0.5.1, Apache-2.0, created November 19, 2025, modified March 28, 2026, with versions through v0.5.1 [S04].

Important package surfaces:

- CLI: `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, `ossa-mcp` [S04].
- Exports: schemas, validation, generation, migration, types, OpenAPI extensions, mesh, agent-card generator/schema, SDK, version management, MCP server, kagent, trust, workspace validation [S04].
- Dependencies: MCP SDK, OpenAI Agents, LangChain, AI SDK providers, Cedar WASM, DIDs, JOSE, OpenTelemetry, Prometheus, Temporal, Qdrant, and other infra libraries [S04].
- Purpose: a bridge between agent protocols and deployment platforms; define once in YAML, export to multiple deployment targets [S04].

The package is not only a schema. It includes CLI tooling, validators, generators, adapters, trust services, schemas, examples, templates, and an MCP server [S04].

## DUADP npm package: @bluefly/duadp

`@bluefly/duadp` is the TypeScript SDK and CLI for DUADP. npm metadata shows latest v0.1.4, created March 6, 2026, modified March 9, 2026, Apache-2.0, a `duadp` binary, and a GitLab repository under `blueflyio/duadp/duadp` [S05].

Important package surfaces:

- `@bluefly/duadp`: core types for manifests/resources/skills/agents/tools and peers [S06].
- `@bluefly/duadp/client`: typed HTTP client for any DUADP node [S06].
- `@bluefly/duadp/server`: Express router mounting protocol endpoints [S06].
- `@bluefly/duadp/validate`: OSSA manifest/resource validation [S06].
- `@bluefly/duadp/crypto`: Ed25519 signing and verification [S06].
- `@bluefly/duadp/did`: did:web and did:key resolution [S06].
- `@bluefly/duadp/conformance`: protocol compliance testing [S06].

The README says the reference node uses Express and SQLite and includes all protocol endpoints plus governance endpoints; tests cover crypto, DID, validation, circuit breaker, deduplication, e2e crypto, and integration [S06].

## Cost and production considerations from engineering reports

47Billion's production write-up compares AutoGen, CrewAI, LlamaIndex, OpenAI Agents SDK, and LangGraph from actual delivery experience [S36]. Its cost ranges are useful directional numbers:

| Approach | Cost per task | Tokens per task |
| --- | --- | --- |
| Simple workflow | $0.10-$0.50 | 1,000-3,000 |
| CrewAI multi-agent | $0.50-$2.00 | 3,000-10,000 |
| AutoGen multi-agent | $2.00-$5.00 | 5,000-25,000 |
| LlamaIndex RAG | $0.20-$1.00 | 1,000-5,000 |

The same report recommends Level 2-3 autonomy for most production use cases: deterministic workflows with branching and tool-using agents. It calls open-ended multi-agent systems powerful but expensive and hard to debug [S36]. Human checkpoints, budget monitoring, tool constraints, structured outputs, lower temperatures, and progressive rollout are recurring recommendations [S36].

## Repository maturity notes

GitHub stars are not proof of production readiness, but they are useful community signals. The highest-starred projects here are AutoGen, CrewAI, LlamaIndex, LangGraph, and OpenAI Agents SDK [S27][S33][S34][S35]. The protocol repositories have lower but meaningful traction: AG-UI 13,535, ANP 1,296, ACP 1,006, Agent Protocol 582, ATP 96 [S18][S19][S22][S23][S24]. OSSA and DUADP are early-stage npm packages with active releases in March 2026 [S04][S05].
