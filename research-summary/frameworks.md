# Open-Source Frameworks and Projects

Research snapshot compiled on May 18, 2026. GitHub stars are point-in-time values from `gh repo view` unless otherwise noted [R34].

## Summary table

| Project | Stars | License | Main purpose | Core primitives or strengths |
| --- | ---: | --- | --- | --- |
| CrewAI | 51,636 | MIT | Role-based multi-agent orchestration | Crews, agents, tasks, tools, structured collaboration [R34] [R37] |
| AutoGen | 58,140 | CC BY 4.0 | Agentic programming framework | Conversable agents, multi-agent conversations, HITL patterns [R34] [R37] |
| LlamaIndex | 49,480 | MIT | Document agents and RAG workflows | Loaders, indexes, retrievers, workflows, document synthesis [R34] [R37] |
| LangGraph | 32,317 | MIT | Stateful graph-based agents | Graph nodes/edges, durable state, cycles, resumable workflows [R34] [R37] |
| OpenAI Agents SDK Python | 26,427 | MIT | Lightweight multi-agent framework | Agents, handoffs/agents-as-tools, guardrails, tracing, sessions, sandbox agents [R32] [R33] [R34] |
| OpenAI Agents SDK JS | 3,053 | MIT | JavaScript/TypeScript agents | Multi-agent and voice workflows [R34] |
| Parlant | 18,080 | Apache 2.0 | Customer-facing conversational control | Guidelines, journeys, canned responses, explainability, tool association [R35] |
| AG-UI | 13,613 | MIT | Agent-user interaction protocol and SDKs | Typed event protocol, UI state sync, frontend tool calls [R13] [R34] |
| A2A | 23,835 | Apache 2.0 | Agent-agent interoperability | Agent Cards, tasks, messages, artifacts, SSE [R12] [R34] |
| MCP TypeScript SDK | 12,453 | Other | MCP client/server SDK | JSON-RPC MCP implementation [R10] [R34] |
| ANP | 1,296 | Apache 2.0 | Agent network protocol | DID identity, secure communication, meta-protocol layer [R16] [R34] |
| LangChain Agent Protocol | 588 | MIT | Framework-agnostic serving API | Runs, threads, store, agent schemas, streaming [R15] [R34] |
| ACP | 1,004 | Apache 2.0 | REST agent messaging | REST API, multimodal messages, async/sync, A2A migration [R17] [R18] [R34] |
| ATP | 96 | MIT | Sandboxed code-first tool execution | V8 isolates, runtime SDK, OpenAPI/MCP adapters, provenance [R19] [R34] |

## OpenAI Agents SDK

OpenAI's Agents SDK is a lightweight but production-oriented framework. Its docs describe it as an upgrade from Swarm, with a small primitive set: agents, agents as tools/handoffs, guardrails, and tracing [R33]. The README expands the current concept set to include sandbox agents, tools including MCP and hosted tools, human-in-the-loop mechanisms, sessions, tracing, realtime agents, and provider-agnostic support for OpenAI APIs and 100+ other LLMs [R32].

The SDK is most compelling for teams that want a minimal framework around a managed agent loop: tool invocation, guardrails, handoffs, sessions, and tracing without adopting a full graph engine. Its newer sandbox-agent concept is relevant to coding and workspace tasks because agents can operate in isolated filesystem environments with resumable state [R32].

## LangGraph and LangChain Agent Protocol

LangGraph is the stateful, graph-based execution engine in the LangChain ecosystem. 47Billion characterizes it as more verbose than CrewAI but more flexible when systems need stateful cycles, resumability, and clear execution flow [R37]. Its GitHub metadata shows 32,317 stars and active development on May 18, 2026 [R34].

LangChain Agent Protocol complements LangGraph by defining production APIs for serving agents: stateless runs, background runs, threads, agent introspection, long-term store, messages, and streaming over SSE/WebSockets [R15]. LangGraph Platform implements a superset, but the protocol remains framework-agnostic in intent [R15].

## CrewAI

CrewAI is a pragmatic multi-agent orchestration framework centered on roles and tasks. 47Billion found it faster to develop structured workflows than AutoGen in their table-reservation comparison, because it thinks in tasks rather than open-ended conversations [R37]. It is well suited to multi-step tasks with clear role separation and predictable execution needs.

The trade-off is flexibility. CrewAI is less natural for highly dynamic open-ended conversations than AutoGen, and memory across tasks may need deliberate design [R37]. Its high GitHub star count indicates substantial community interest [R34].

## AutoGen

AutoGen's strength is conversational multi-agent collaboration. 47Billion reports that it worked well for exploratory tasks and code execution agents, and made adding agents straightforward. The downside is cost and debuggability: agents can talk in circles, every participant may see large conversation histories, and tracing disagreements can require reading long generated transcripts [R37].

AutoGen is best reserved for exploratory or deliberative scenarios where multiple perspectives matter. It is usually excessive for deterministic workflows that can be expressed as a graph or task sequence [R37].

## LlamaIndex

LlamaIndex is strongest where the agent's job is to retrieve, organize, and synthesize knowledge from documents. 47Billion found it valuable for note summarization and insurance document extraction, with clean workflow steps and event-driven logging/retry patterns [R37].

Its use case is narrower than general orchestration. Teams should choose it when RAG and document processing dominate the workload, not when the main challenge is arbitrary multi-agent coordination [R37].

## Parlant

The user request mentioned "Parlay"; the strongest matching active framework located was Parlant (`emcie-co/parlant`). Parlant is a customer-facing conversational AI framework that tries to make behavior more predictable by matching natural-language Guidelines, Journeys, domain glossary entries, canned responses, and tools to the current conversation context [R35].

Parlant's core claim is not that it creates maximally autonomous agents, but that it provides interaction control for agents that must comply with business rules. Its explainability features are relevant for regulated customer support, healthcare, finance, legal, and ecommerce use cases where prompt-only guardrails are too weak [R35].

## GitLab Duo Agent Platform

GitLab Duo Agent Platform is a production DevSecOps agent platform rather than a low-level framework. GitLab announced general availability on January 15, 2026 for Premium and Ultimate customers on GitLab.com and Self-Managed deployments, with Dedicated availability planned for GitLab 18.8 [R36].

Its features include:

- Agentic Chat across the GitLab Web UI and IDEs, using project data from issues, merge requests, pipelines, security findings, and other GitLab context [R36].
- Foundational agents, including Planner Agent and Security Analyst Agent [R36].
- Custom agents through the AI Catalog, where teams create, publish, manage, and share agents and flows [R36].
- External agents integrated into GitLab, including Claude Code and Codex CLI [R36].
- Foundational flows for issue-to-merge-request, CI/CD migration, pipeline fixing, code review, and IDE development [R36].
- Governance features such as model selection, group-based access control, usage/activity visibility, and deployment flexibility [R36].

GitLab's positioning is important: agents are embedded in the system of record for code, issues, pipelines, security, and compliance. That reduces context-fragmentation risk compared with external agents that lack project metadata [R36].

## OSSA and DUADP packages

`@bluefly/openstandardagents` is the OSSA package. The local repository and npm metadata describe it as an Apache-2.0 package for defining agent manifests and exporting them to Docker, Kubernetes, LangChain, CrewAI, Claude Skills, GitLab Duo, MCP, A2A, npm, and other targets. It exposes schemas, validation, generation, migration, trust, SDK, agent-card, and MCP-server entry points [R07] [R08].

`@bluefly/duadp` is the TypeScript SDK for DUADP. npm version 0.1.4 exposes client, server, validation, crypto, DID, and conformance modules, with dependencies for AJV validation, canonicalization, DID resolution, YAML, and Web DID resolution [R04]. DUADP's docs also mention Python SDK usage, but this report verified the npm package specifically [R02] [R04].

## Cost and production considerations

47Billion's production experience provides useful cost ranges: simple workflows at roughly $0.10-$0.50 per task, CrewAI multi-agent tasks at $0.50-$2.00, AutoGen multi-agent tasks at $2.00-$5.00, and LlamaIndex RAG at $0.20-$1.00, with token ranges increasing sharply as conversation history and agent count grow [R37].

The production-ready zone is narrow. Simple workflows are ready with standard validation and monitoring. Tool-using agents are ready with output validation, cost limits, and fallbacks. Structured multi-agent systems are cautiously ready with guardrails and HITL checkpoints. Open-ended multi-agent systems remain too unpredictable for critical paths [R37].

## Recommendations for framework selection

1. Use simple workflows or LangGraph when you need explicit state, loops, and resumability.
2. Use CrewAI for structured multi-step work with clear roles and tasks.
3. Use LlamaIndex when documents and RAG are central.
4. Use OpenAI Agents SDK when you want a minimal managed agent loop with handoffs, guardrails, tracing, MCP tools, and sessions.
5. Use AutoGen for exploratory multi-agent conversations where higher token cost and debugging complexity are acceptable.
6. Use Parlant for customer-facing agents that must follow business rules consistently.
7. Use OSSA/DUADP when portability, identity, discovery, trust tiers, policy, and multi-platform export matter more than a single runtime's orchestration model.
