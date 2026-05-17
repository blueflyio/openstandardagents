# Open-source frameworks, repositories, and npm packages

Research snapshot: May 17, 2026. GitHub star counts are point-in-time metadata collected on May 17, 2026.

## Summary

Agent frameworks are converging around a few repeatable primitives: an agent loop, tools/function calls, state/memory, handoffs or team coordination, human-in-the-loop interrupts, guardrails, and tracing/evaluation. The main differentiator is how much structure the framework imposes. LangGraph emphasizes explicit state graphs and durable execution; CrewAI emphasizes flows plus teams of role-based agents; AutoGen emphasizes conversational multi-agent systems and distributed/event-driven runtimes; LlamaIndex emphasizes RAG and event-driven workflows; OpenAI Agents SDK emphasizes few primitives with managed loops, handoffs, guardrails, and tracing [S24][S26][S27][S28][S29].

## Repository and package snapshot

| Project/package | Purpose | Metadata snapshot |
| --- | --- | --- |
| OpenAI Agents SDK | Lightweight multi-agent framework with agents, handoffs, guardrails, tracing | `openai/openai-agents-python`: 26,379 stars, release v0.17.2 [S24][M06]; npm `@openai/agents` latest 0.11.4 [S31] |
| LangGraph | Low-level orchestration runtime for reliable, stateful agents | 32,217 stars, release 1.2.0 [S26][M07] |
| CrewAI | Flows plus teams of autonomous agents | 51,559 stars, release 1.14.4 [S27][M08] |
| LlamaIndex | RAG-centric agents and event-driven workflows | 49,461 stars, release v0.14.22 [S28][M09] |
| AutoGen | AgentChat, Core, Studio for single/multi-agent apps | 58,095 stars, release python-v0.7.5 [S29][M10] |
| Parlant | Customer-facing conversational control harness | 18,080 stars in fetched GitHub page [S30][M11] |
| Agent Protocol | Framework-agnostic agent server API | 583 stars in fetched GitHub page [S11][M04] |
| ANP | Open agent network protocol | 1,296 stars in fetched GitHub page [S10][M05] |
| A2A | Agent-to-agent protocol implementation/spec | 23,813 stars, release v1.0.0 [S07][M01] |
| AG-UI | Agent-user interaction protocol and SDKs | 13,585 stars, release 2026-05-15 [S09][M02] |
| MCP TypeScript SDK | MCP SDK | 12,443 stars, release v1.29.0 [S32][M03] |
| OSSA npm package | Agent manifest spec, CLI, exporters, schemas, MCP server | `@bluefly/openstandardagents` latest 0.5.1, Apache-2.0 [S03] |
| DUADP npm package | Agent discovery SDK/CLI | `@bluefly/duadp` latest 0.1.4, Apache-2.0 [S04] |

## OpenAI Agents SDK

OpenAI's Agents SDK is described as a lightweight, production-ready upgrade from Swarm with a small primitive set: agents, agents-as-tools/handoffs, guardrails, and built-in tracing [S24]. Its documentation emphasizes a managed agent loop, Python-first orchestration, function tools with automatic schema generation, MCP server tool calling, sessions, human-in-the-loop mechanisms, sandbox agents, and realtime voice agents [S24].

The framework is especially attractive when a team wants managed turns, tool execution, guardrails, handoffs, sessions, or sandbox workspaces without adopting a more elaborate graph or conversation framework [S24]. The Python repository is large and active in the 2026 snapshot (26,379 stars, release v0.17.2), and npm metadata for `@openai/agents` shows latest 0.11.4 for the JavaScript/TypeScript package line [S31][M06].

## LangGraph

LangGraph is LangChain's low-level orchestration framework for reliable agents. Its public positioning is "balance agent control with agency": define expressive single-agent, multi-agent, and hierarchical workflows while preserving control over state, moderation, memory, and streaming [S26].

Core strengths:

- Human-in-the-loop checks for steering and approving actions [S26].
- Explicit customizable workflows rather than a black-box agent architecture [S26].
- Built-in memory and persistence for future interactions [S26].
- Streaming support for user experience and visibility into agent activity [S26].

LangGraph fits use cases that need durable execution, graph state, loops, human interruptions, time travel/debugging, and clear execution flow. It is more verbose than simpler frameworks, but that verbosity is often the price of control in production.

## CrewAI

CrewAI defines two primary architecture pieces: Flows and Crews [S27]. Flows are stateful, event-driven workflows that manage data movement and control execution. Crews are teams of role-playing autonomous agents that collaborate on tasks delegated by the Flow [S27].

The docs recommend using both for production: start with a Flow for structure, state, and logic, then invoke a Crew when a step requires autonomous collaboration [S27]. CrewAI advertises flexible tool integration, enterprise security, production-grade flows, autonomous crews, and cost-efficient token/API usage [S27]. The repository metadata snapshot shows 51,559 stars and release 1.14.4 [M08].

CrewAI is a pragmatic middle ground for structured multi-step tasks. 47Billion's production comparison found it faster and more predictable than AutoGen for a table reservation system, with better execution control and a gentler learning curve, but less flexibility for open-ended scenarios [S33].

## LlamaIndex

LlamaIndex frames an agent as an automated reasoning and decision engine that can break down questions, choose tools, plan tasks, and store completed tasks in memory [S28]. It offers prebuilt agent/tool architectures for quick builds and custom Workflows for full control [S28].

The strongest fit is RAG-heavy or document-centered work: agentic RAG, report generation, customer support, productivity assistants, and coding assistants over code/document sources [S28]. Workflows are an event-driven orchestration foundation for custom agentic systems [S28]. 47Billion likewise characterizes LlamaIndex as strongest for document processing and information retrieval, with event-driven architecture that helps logging, retries, and error handling [S33].

## Microsoft AutoGen

AutoGen is a framework for AI agents and applications with three major pieces [S29]:

- Studio: a web UI for no-code prototyping.
- AgentChat: a high-level Python framework for conversational single and multi-agent applications.
- Core: an event-driven programming framework for scalable multi-agent systems, deterministic/dynamic workflows, research, and distributed agents.

Extensions include MCP workbench integration, OpenAI Assistant Agent, Docker code execution, and gRPC distributed runtime [S29]. AutoGen remains a powerful option for conversational and research-style multi-agent collaboration, but production use often needs strong limits on loops, token consumption, and traceability [S33].

## Parlant

Parlant is an open-source customer-facing interaction control harness optimized for controlled, consistent, predictable LLM interactions [S30]. 47Billion describes its key innovation as a Guidelines system: behavioral rules dynamically matched to conversation context, intended to be more reliable than relying solely on a system prompt [S33]. This makes it notable for regulated, branded, or customer-facing interactions where style and policy consistency matter.

## OSSA package: `@bluefly/openstandardagents`

`@bluefly/openstandardagents` is the npm package backing OSSA. npm reports latest 0.5.1, Apache-2.0, created November 19, 2025 and modified March 28, 2026 [S03]. The package description calls OSSA an "Infrastructure bridge between agent protocols (MCP, A2A) and deployment platforms" and says to define once in YAML and export to 9+ platforms [S03]. The public site advertises a broader 23+ export target count and 10 MCP tools [S02].

Important exports and capabilities in the package metadata:

- Schema exports for v0.4/v0.5 agent schemas and agent-card schema [S03].
- Services for validation, generation, migration, version management, trust, and workspace validation [S03].
- CLI bins: `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, `ossa-mcp` [S03].
- Integrations/targets named in keywords or site copy: LangChain, CrewAI, AutoGen, Kubernetes, Docker, MCP, A2A, GitLab Duo Agent, Claude/Cursor/skills, Drupal [S02][S03].

Interpretation: OSSA is not primarily an agent runtime. It is the portable contract and transformation layer that makes runtimes, protocols, deployment platforms, and governance metadata agree on one manifest.

## DUADP package: `@bluefly/duadp`

`@bluefly/duadp` is the TypeScript SDK/CLI for DUADP. npm reports latest 0.1.4, Apache-2.0, created March 6, 2026 and modified March 9, 2026 [S04]. The package description is "DUADP - Decentralized Universal AI Discovery Protocol SDK for TypeScript" [S04].

Important exports and capabilities:

- CLI bin `duadp` [S04].
- ESM package with type declarations [S04].
- Exports for client, server, validate, crypto, DID, and conformance modules [S04].
- Dependencies include AJV, canonicalization, DID resolver packages, `web-did-resolver`, and YAML parsing [S04].

Interpretation: DUADP is a discovery, identity, validation, and conformance SDK. It complements OSSA manifests and can expose discovery through REST and MCP tools [S01][S04].

## Cost and production considerations

47Billion's production writeup gives useful cost ranges by architecture [S33]:

| Approach | Cost per task | Token range | Best fit |
| --- | --- | --- | --- |
| Simple workflow | USD 0.10-0.50 | 1,000-3,000 | Linear deterministic tasks |
| CrewAI multi-agent | USD 0.50-2.00 | 3,000-10,000 | Structured multi-step tasks |
| AutoGen multi-agent | USD 2.00-5.00 | 5,000-25,000 | Exploratory collaboration |
| LlamaIndex RAG | USD 0.20-1.00 | 1,000-5,000 | Document queries |

Their recommendation is conservative: simple workflows and tool-using agents can be production-ready with validation, monitoring, fallbacks, and cost limits; structured multi-agent systems can be used cautiously with heavy guardrails and human checkpoints; open-ended multi-agent systems are not yet appropriate for critical paths [S33].

## Selection guide

- Choose OpenAI Agents SDK when the application needs a minimal managed loop, handoffs, guardrails, sessions, tracing, and OpenAI ecosystem integration [S24].
- Choose LangGraph when execution state, loops, interrupts, persistence, human approvals, and debuggable graph flow are central [S26].
- Choose CrewAI when the team wants structured workflows with role-based agent teams and a relatively direct path to production [S27][S33].
- Choose LlamaIndex when the agent is mostly about RAG, document processing, knowledge assistants, and retrieval workflows [S28][S33].
- Choose AutoGen when the task genuinely benefits from conversational multi-agent collaboration, distributed agents, or research/prototyping flexibility [S29][S33].
- Use OSSA to define and export the agent contract across frameworks/platforms [S02][S03].
- Use DUADP when open-web/federated discovery and verifiable agent identity are needed [S01][S04].
