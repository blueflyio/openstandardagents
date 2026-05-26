# Open-Source Frameworks, Projects, and npm Packages

As of 2026-05-26.

## Framework and repository snapshot

GitHub metrics were collected with `gh repo view` on 2026-05-26. Fork counts are included because they better indicate community activity than the simplified web previews.

| Project | Purpose | Stars | Forks | License | Notes |
| --- | --- | ---: | ---: | --- | --- |
| microsoft/autogen | Agentic AI programming framework | 58,411 | 8,814 | CC-BY-4.0 listed by GitHub | AgentChat, Core, Studio, extensions [autogen-docs] [github-metrics] |
| crewAIInc/crewAI | Role/task-based multi-agent automation | 52,207 | 7,243 | MIT | Crews for autonomy, Flows for event-driven control [crewai-readme] [github-metrics] |
| run-llama/llama_index | Document agents, RAG, OCR, data workflows | 49,673 | 7,459 | MIT | Strong for document-heavy and retrieval workflows [github-metrics] |
| langchain-ai/langgraph | Stateful graph orchestration runtime | 33,010 | 5,576 | MIT | Durable execution, HITL, streaming, persistence [langgraph-docs] [github-metrics] |
| a2aproject/A2A | Agent-to-agent protocol specification | 23,999 | 2,425 | Apache-2.0 | Linux Foundation project [a2a-readme] [github-metrics] |
| emcie-co/parlant | Customer-facing agent interaction control harness | 18,085 | 1,537 | Apache-2.0 | Guidelines system for reliable behavior [github-metrics] [47billion-production] |
| modelcontextprotocol/typescript-sdk | MCP TypeScript SDK | 12,535 | 1,868 | Other (GitHub) | Official TS SDK for MCP servers/clients [github-metrics] |
| openai/openai-agents-js | OpenAI Agents SDK for JS/TS | 3,122 | 787 | MIT | Agents, handoffs, guardrails, tracing, sandbox, realtime [openai-agents-js] [github-metrics] |
| agent-network-protocol/AgentNetworkProtocol | ANP protocol docs and vision | 1,303 | 90 | Apache-2.0 | DID-based agent network architecture [anp-readme] [github-metrics] |
| langchain-ai/agent-protocol | Framework-agnostic serving APIs | 594 | 52 | MIT | Runs, threads, store, streaming [langchain-agent-protocol] [github-metrics] |

## OpenAI Agents SDK

OpenAI's TypeScript Agents SDK is a lightweight framework for text, sandbox, and voice agents. The docs describe a small primitive set: agents with instructions and tools, sandbox agents with isolated workspaces and shell/file capabilities, agents as tools/handoffs for delegation, guardrails for validation, sessions for memory, human-in-the-loop mechanisms, and tracing for debugging/evaluation/fine-tuning workflows. [openai-agents-js]

The broader production blog view describes the OpenAI Agents SDK as released in March 2025 with four core primitives: Agents, Handoffs, Guardrails, and Tracing, plus provider-agnostic support for 100+ LLMs through Chat Completions-style APIs. The current docs add sandbox and realtime voice capabilities. [47billion-production] [openai-agents-js]

npm metadata on 2026-05-26:

| Package | Version | Description | License |
| --- | --- | --- | --- |
| `@openai/agents` | 0.11.5 | Lightweight framework for multi-agent workflows | MIT |

## LangGraph and LangChain Agent Protocol

LangGraph is a low-level orchestration framework and runtime for long-running, stateful agents. It focuses on durable execution, streaming, human-in-the-loop, comprehensive memory, debugging/observability through LangSmith, and production deployment. It is intentionally lower-level than high-level agent frameworks and can be used without LangChain, though it integrates with the LangChain ecosystem. [langgraph-docs]

LangGraph's strength is explicit graph/state control. It is suitable when workflows need loops, conditional routing, persistence, checkpoints, replay, or human approval nodes. Its tradeoff is verbosity and engineering complexity compared with CrewAI-style task definitions. [langgraph-docs] [47billion-production]

The LangChain Agent Protocol complements LangGraph by defining production APIs around runs, threads, agents, store/memory, and streaming. LangGraph Platform implements a superset of it. [langchain-agent-protocol]

## CrewAI

CrewAI is a Python framework for orchestrating role-playing autonomous agents. It emphasizes being standalone and independent of LangChain. Its two key abstractions are Crews and Flows:

- Crews: teams of agents with role-based collaboration and autonomous task execution.
- Flows: event-driven workflows for production-grade orchestration, state management, conditional logic, and precise control. [crewai-readme]

CrewAI is particularly strong for structured, multi-step work where roles and tasks can be defined up front. 47Billion's production review found CrewAI faster and easier than AutoGen for a table reservation agent because it thinks in tasks rather than open-ended conversations. [47billion-production]

Risks and costs: CrewAI still needs memory design, output validation, human checkpoints, and cost monitoring. It is not a substitute for production guardrails. [47billion-production]

## AutoGen

Microsoft AutoGen is a framework for agentic AI with three main surfaces:

- Studio: web UI for prototyping agents without code.
- AgentChat: Python framework for conversational single-agent and multi-agent applications.
- Core: event-driven framework for scalable multi-agent systems, deterministic/dynamic workflows, research, and distributed/multi-language agents.
- Extensions: integrations such as MCP workbench, OpenAI Assistant API, Docker code execution, and gRPC runtime. [autogen-docs]

AutoGen's conversational model is powerful for exploratory collaboration and code-execution agents, but it can be expensive and harder to debug when agents loop or disagree. 47Billion reported high token use and difficult tracing in multi-agent conversations. [47billion-production]

## LlamaIndex

LlamaIndex is described by its GitHub repository as a leading document agent and OCR platform. It remains especially relevant for RAG-heavy workflows: ingesting documents, indexing, retrieval, synthesis, and structured data extraction. [github-metrics]

47Billion's production comparison found LlamaIndex strongest for document-heavy and RAG-centric applications, such as note summarization and insurance document extraction. It was less ideal as a general orchestration framework when retrieval was not the core problem. [47billion-production]

## Parlant

The user's prompt mentioned "Parlay"; current search results indicate that the modern relevant project is likely Parlant by Emcie, not Meta's older ParlAI dialogue-research framework. Parlant is an Apache-2.0 open-source harness for reliable customer-facing agents. Its key idea, according to 47Billion, is a Guidelines system: behavioral rules dynamically matched to conversation context rather than relying only on static system prompt instructions. [47billion-production] [github-metrics]

Parlant is worth tracking where customer-facing consistency, policy adherence, and controlled behavior matter more than open-ended autonomy.

## ParlAI note

If "Parlay" meant ParlAI, that is an older Meta/Facebook AI research platform for training, evaluating, and sharing dialogue models. It uses worlds and agents: agents act and observe within environments, including multi-agent dialogue worlds. It remains relevant for dialogue research but is not the main 2026 production agent-orchestration pattern compared with LangGraph, CrewAI, AutoGen, OpenAI Agents SDK, and Microsoft Agent Framework. [parlai-search]

## GitLab Duo Agent Platform

GitLab Duo Agent Platform is a governed enterprise platform for software-delivery agents rather than a general open-source library. GitLab announced general availability for Premium and Ultimate customers in the GitLab 18.8 release cycle. [gitlab-duo-ga]

Key capabilities:

- Agentic Chat across GitLab UI and IDEs using lifecycle context from issues, merge requests, pipelines, security findings, and repositories.
- Foundational agents: Planner Agent and Security Analyst Agent at GA.
- Custom agents and flows through the AI Catalog.
- External agents: integrated Claude Code and OpenAI Codex CLI.
- Foundational flows: Issue to MR, Convert to GitLab CI/CD, Fix CI/CD pipeline, Code Review, and Software development in IDE.
- MCP Client for Jira, Confluence, Slack, Playwright, Grafana, and other MCP-compatible tools.
- Model selection across OpenAI GPT-5 variants, Mistral, Meta Llama, Anthropic Claude, and self-hosted options.
- Governance: usage visibility, group-based access controls, model selection controls, and deployment across GitLab.com, Self-Managed, and Dedicated. [gitlab-duo-ga]

GitLab is important for this research because it shows how agent platforms are becoming governed SDLC products: agents are not only chatbots or coding assistants; they are catalogued, permissioned, observable workflow actors.

## OSSA and DUADP npm packages

The user specifically requested understanding the npm packages. The local repository package and its DUADP dependency are central:

| Package | Version | Registry description | License | Size/files |
| --- | --- | --- | --- | --- |
| `@bluefly/openstandardagents` | 0.5.1 | OSSA: infrastructure bridge between agent protocols and deployment platforms; define once in YAML, export to 9+ platforms | Apache-2.0 | 10.7 MB, 2,033 files [ossa-npm] |
| `@bluefly/duadp` | 0.1.4 | Decentralized Universal AI Discovery Protocol SDK for TypeScript | Apache-2.0 | 169 KB, 23 files [duadp-npm] |

`@bluefly/openstandardagents` exposes a CLI (`ossa`, `ossa-dev`, `ossa-version`, `ossa-validate-all`, `ossa-mcp`) and subpath exports for schema, validation, generation, migration, types, OpenAPI extensions, mesh, agent cards, SDK, version management, trust, workspace validation, MCP server, and adapters. Its README emphasizes that OSSA is neither a protocol nor a framework; it is the middle layer that translates agent definitions into platform-specific deployments. [ossa-npm] [ossa-readme]

`@bluefly/duadp` provides:

- a TypeScript client for discovery/search/listing;
- an Express server router implementing 15 core DUADP endpoints;
- validation for OSSA resources;
- Ed25519 signing and verification;
- DID resolution for `did:web` and `did:key`;
- conformance tests;
- subpath exports for client, server, validate, crypto, DID, and conformance. [duadp-npm]

## Other protocol npm packages

| Package | Version on 2026-05-26 | Purpose |
| --- | --- | --- |
| `@modelcontextprotocol/sdk` | 1.29.0 | TypeScript SDK for MCP servers and clients [npm-metadata] |
| `@a2a-js/sdk` | 0.3.13 | Server and client SDK for A2A [npm-metadata] |
| `@ag-ui/client` | 0.0.53 | Client SDK for AG-UI servers [npm-metadata] |
| `@mondaydotcomorg/atp-protocol` | 0.22.3 | Core Agent Tool Protocol types and interfaces [npm-metadata] |

## Cost and production considerations

47Billion's per-task cost ranges are a practical benchmark:

| Approach | Typical task cost | Tokens/task | Fit |
| --- | ---: | ---: | --- |
| Simple workflow | USD 0.10-0.50 | 1k-3k | Deterministic linear tasks |
| CrewAI multi-agent | USD 0.50-2.00 | 3k-10k | Structured multi-step tasks |
| AutoGen multi-agent | USD 2.00-5.00 | 5k-25k | Exploratory collaboration |
| LlamaIndex RAG | USD 0.20-1.00 | 1k-5k | Document processing queries |

Production hardening patterns across frameworks:

1. Validate structured outputs.
2. Constrain tool use; never allow agents to invent APIs.
3. Add HITL approval gates before irreversible actions.
4. Monitor cost from day one.
5. Summarize/prune long conversations.
6. Use lower temperatures for deterministic workflows.
7. Roll out progressively and measure real user behavior. [47billion-production]
