# Open-Source Frameworks, Projects, and npm Packages

Prepared as of May 30, 2026.

## Repository and package snapshot

| Project | Purpose | Stars / package status | License | Notes |
|---|---|---:|---|---|
| `@bluefly/openstandardagents` | OSSA manifest, CLI, exports | npm v0.5.1; 2,033 files | Apache-2.0 | Contract layer [S03]. |
| `@bluefly/duadp` | DUADP TypeScript SDK | npm v0.1.4; 23 files | Apache-2.0 | Discovery SDK [S04]. |
| OpenAI Agents SDK | Multi-agent workflows | 26,764 stars | MIT | Agents, handoffs, guardrails, tracing [S17]. |
| LangGraph | Stateful agent runtime | 33,369 stars | MIT | Durable execution and HITL [S18]. |
| CrewAI | Role-based crews/flows | 52,466 stars | MIT | Autonomous crews plus event flows [S19]. |
| AutoGen | Conversational multi-agent framework | 58,535 stars | CC-BY-4.0 / MIT | Maintenance mode; migrate to MS Agent Framework [S20]. |
| LlamaAgents | Document-centric agent workflows | 382 stars | MIT | Async event workflows [S21]. |
| Parlant | Controlled customer-facing agents | 18,093 stars | Apache-2.0 | Guidelines and journeys [S22]. |
| AG-UI | Agent-user UI protocol | 13,917 stars | MIT | Event protocol [S13]. |
| ANP | Agent network protocol | 1,306 stars | Apache-2.0 | DID + meta-protocol [S14]. |
| LangChain Agent Protocol | Agent serving API | 595 stars | MIT | Runs, threads, store [S15]. |
| Monday ATP | Sandboxed code execution protocol | 97 stars | MIT | Early project [S31]. |

Star counts were collected with the GitHub CLI on May 30, 2026.

## OSSA / `@bluefly/openstandardagents`

`@bluefly/openstandardagents` is the npm distribution for OSSA, version 0.5.1 at collection time. npm lists it as an Apache-2.0 package with a GitLab source repository, a 10.7 MB unpacked size, 2,033 files, 23 versions, and a description that positions OSSA as an infrastructure bridge between agent protocols and deployment platforms [S03]. The package exposes CLI binaries such as `ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, and `ossa-mcp`, plus subpath exports for schemas, validation, generation, migration, types, MCP server, agent-card generation, trust, workspace validation, and SDK use [S03].

OSSA's core value is export fidelity. A team can define an agent once and generate platform-specific packages. The package/readme describes production or beta targets across LangChain, MCP, npm, agent skills, CrewAI, Drupal, Claude Code, Cursor, Warp, Anthropic, kagent, GitLab Duo, Docker, Kubernetes, Temporal, n8n, OpenAI Agents SDK, A2A, Claude Skills, mobile agents, Symfony, and AgentScope [S02][S03].

## DUADP / `@bluefly/duadp`

`@bluefly/duadp` is the TypeScript SDK for DUADP, version 0.1.4, Apache-2.0, with a 169 KB unpacked size and 23 files [S04]. It provides subpath exports for core types, client, server, validation, crypto, DID resolution, and conformance tests [S04]. It is smaller and more focused than OSSA: its job is discovery, federation, validation, signing, and identity resolution.

The package is notable because it includes both client and server primitives. A consumer can query a DUADP node, list agents, skills, or tools, validate OSSA resources, resolve DIDs, and verify signatures. A producer can mount an Express router to implement a DUADP node and expose well-known discovery plus `/api/v1/*` endpoints [S04].

## OpenAI Agents SDK

The OpenAI Agents SDK is a lightweight framework for multi-agent workflows. Its public repository had 26,764 stars and a latest release `v0.17.4` on May 26, 2026 [S17]. The repository describes the SDK as provider-agnostic, supporting OpenAI APIs and 100+ other LLMs [S17].

The SDK's primitives are intentionally small: agents configured with instructions, tools, guardrails, and handoffs; handoffs or agents-as-tools for delegation; tools for functions, MCP, and hosted operations; guardrails for input/output checks; sessions for history; and tracing for debugging and optimization [S17]. It fits teams that prefer explicit Python control flow over large orchestration DSLs.

## LangGraph

LangGraph is LangChain's low-level orchestration framework and runtime for long-running, stateful agents [S18]. It emphasizes durable execution, streaming, human-in-the-loop, persistence, comprehensive memory, and debugging with LangSmith [S18]. The public repository had 33,369 stars and a latest SDK release on May 28, 2026.

LangGraph is best for workflows where state matters: resumable tasks, checkpoints, interrupts, human review, looping, and explicit graph control. It is less of a high-level agent persona framework and more of a runtime substrate for reliable execution [S18].

## CrewAI

CrewAI is a Python framework for orchestrating role-playing autonomous agents. Its repository had 52,466 stars and a latest release `1.14.6` on May 28, 2026 [S19]. CrewAI's two major abstractions are Crews and Flows. Crews optimize for role-based collaboration and autonomy. Flows provide event-driven, production-oriented control over state, conditions, branching, and multi-step automations [S19][S24].

47Billion's production analysis found CrewAI to be a pragmatic middle ground: more structured and cheaper to debug than conversation-heavy multi-agent frameworks, but less flexible for open-ended exploration [S24].

## AutoGen and Microsoft Agent Framework

AutoGen pioneered many multi-agent orchestration patterns and still had 58,535 stars at collection time [S20]. It is now in maintenance mode, with Microsoft recommending new users move to Microsoft Agent Framework, which merges lessons from AutoGen and Semantic Kernel [S20]. AutoGen remains valuable for understanding conversational multi-agent collaboration, code execution agents, and research workflows, but new production projects should account for its maintenance status [S20].

## LlamaAgents / LlamaIndex Workflows

LlamaAgents and LlamaIndex Workflows are data-centric, async, event-driven ways to build document-heavy agents [S21]. The `run-llama/llama-agents` repository had 382 stars, which is modest compared with LangGraph or CrewAI, but its value is specialization: document-centric agents, RAG workflows, branching, looping, persistence, recovery, and deployment as services or MCP servers [S21].

LlamaIndex remains strongest where retrieval quality is the bottleneck: enterprise search, document analysis, structured extraction, and agentic RAG [S21][S24].

## Parlant

Parlant is an Apache-2.0 framework for controlled, predictable customer-facing agents. Its repository had 18,093 stars and a `v3.3.2` release on April 28, 2026 [S22]. It focuses on context engineering for conversations: guidelines, journeys, tools, glossary, and real-time selection of relevant behavioral rules [S22].

Parlant's distinctive contribution is that tool availability and behavior are tied to policy-like guidelines rather than left entirely to the LLM's autonomous choice. This makes it attractive for customer-service and regulated conversational flows where consistency is more important than maximal autonomy [S22].

## GitLab Duo Agent Platform

GitLab Duo Agent Platform reached general availability for Premium and Ultimate customers on GitLab.com and self-managed deployments, with GitLab Dedicated availability tied to the 18.8 release cycle [S23]. It includes Agentic Chat, foundational agents, custom agents through the AI Catalog, external agents such as Anthropic Claude Code and OpenAI Codex CLI, flows, MCP client support, model selection, group access controls, and governance/visibility features [S23].

GitLab's platform is important because it shows enterprise agent packaging moving into DevSecOps systems. Agents are not only code-generation assistants; they are planners, security analysts, CI/CD troubleshooters, and workflow automation units embedded in issues, merge requests, pipelines, and security findings [S23].

## Cost and production considerations

47Billion's production article gives practical cost ranges: simple workflows at roughly $0.10-$0.50 per task, CrewAI multi-agent tasks at $0.50-$2.00, AutoGen multi-agent tasks at $2.00-$5.00, and LlamaIndex RAG at $0.20-$1.00 [S24]. The exact numbers are workload-specific, but the direction is robust: multi-agent systems multiply token usage because agents exchange context, deliberate, and repeat calls [S24].

For production readiness, the recommended pattern is simple workflows first, tool-using agents with guardrails next, structured multi-agent systems only with heavy guardrails and human approval, and open-ended multi-agent systems only outside critical paths [S24].
