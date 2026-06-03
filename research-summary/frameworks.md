# Open-source frameworks, repositories, and packages

Research run date: 2026-06-03. GitHub counts are from `gh repo view` during the run. Citation keys resolve in `reading-list.md`.

## Repository and package snapshot

| Project | Repo / package | Stars | License | Main purpose |
| --- | --- | ---: | --- | --- |
| OpenAI Agents SDK Python | `openai/openai-agents-python` | 26,869 | MIT | Lightweight provider-agnostic multi-agent workflows [openai-agents-python] |
| OpenAI Agents SDK JS/TS | `openai/openai-agents-js`, `@openai/agents` 0.11.6 | 3,164 | MIT | JS/TS multi-agent and voice-agent workflows [openai-agents-js] [npm-agent-packages] |
| LangGraph | `langchain-ai/langgraph`, `@langchain/langgraph` 1.3.4 | 33,728 | MIT | Stateful, long-running graph orchestration [langgraph-readme] [npm-langgraph] |
| CrewAI | `crewAIInc/crewAI` | 52,736 | MIT | Crews and Flows for multi-agent automation [crewai-readme] |
| Microsoft AutoGen | `microsoft/autogen` | 58,658 | CC-BY-4.0 docs / MIT code | Multi-agent framework, now maintenance mode [autogen-readme] |
| LlamaIndex | `run-llama/llama_index` | 49,870 | MIT | Document agents, RAG, indexing, parsing [llamaindex-readme] |
| AG-UI | `ag-ui-protocol/ag-ui`, `@ag-ui/core` 0.0.55 | 13,989 | MIT | Agent-to-UI event protocol and SDKs [ag-ui-readme] [npm-agent-packages] |
| ANP | `agent-network-protocol/AgentNetworkProtocol` | 1,311 | Apache-2.0 in repo metadata | Decentralized agent communication protocol [anp-readme] |
| LangChain Agent Protocol | `langchain-ai/agent-protocol` | 600 | MIT | Framework-agnostic runs/threads/store API [agent-protocol-readme] |
| monday ATP | `mondaycom/agent-tool-protocol`, `@mondaydotcomorg/atp-server` 0.25.0 | 98 | MIT | Sandboxed code execution and API/MCP aggregation [monday-atp] [npm-agent-packages] |
| OSSA | `@bluefly/openstandardagents` 0.5.1 | Site reports 3 GitHub stars | Apache-2.0 | Portable agent manifests, schemas, exports, MCP server [ossa-site] [npm-ossa] |
| DUADP | `@bluefly/duadp` 0.1.4 | Not available from public GitHub metadata in this run | Apache-2.0 | Decentralized discovery SDK/CLI [duadp-site] [npm-duadp] |

## OpenAI Agents SDK

OpenAI Agents SDK is a lightweight provider-agnostic framework for multi-agent workflows. The Python README says it supports the OpenAI Responses and Chat Completions APIs plus 100+ other LLMs. Its core concepts include agents, sandbox agents, agents-as-tools/handoffs, tools, guardrails, human-in-the-loop, sessions, tracing, and realtime agents [openai-agents-python].

The JavaScript/TypeScript SDK mirrors those primitives for Node.js 22+, Deno, Bun, and experimental Cloudflare Workers with `nodejs_compat`. The npm package `@openai/agents` was version 0.11.6, MIT, modified 2026-06-01 [openai-agents-js] [npm-agent-packages].

The SDK is attractive when teams want a minimal primitive set: define agents, attach tools/MCP/hosted tools, delegate through handoffs or agents-as-tools, validate with guardrails, preserve session history, and trace runs [openai-agents-python] [openai-agents-js].

## LangGraph

LangGraph is LangChain's low-level orchestration framework for long-running, stateful agents. Its README highlights durable execution, human-in-the-loop interrupts, short-term and long-term memory, debugging with LangSmith, and production deployment [langgraph-readme].

LangGraph is best suited when workflows need loops, branches, checkpoints, resumability, explicit state, and graph visibility. The JS package `@langchain/langgraph` was version 1.3.4, MIT, modified 2026-06-02 [npm-langgraph].

LangGraph also connects to LangChain's larger ecosystem: Deep Agents for higher-level complex tasks, LangSmith for observability and evaluations, and LangSmith Deployment for managed long-running agents [langgraph-readme].

## CrewAI

CrewAI is a standalone Python framework for orchestrating role-playing autonomous agents. The project emphasizes that it is built from scratch and independent of LangChain. Its two primary abstractions are Crews and Flows: Crews optimize for autonomous role-based collaboration, while Flows provide event-driven control, state management, and production architecture [crewai-readme].

CrewAI's README positions it as enterprise-ready, with a Crew Control Plane for tracing, observability, centralized management, integrations, security/compliance, analytics, and cloud/on-prem deployment options [crewai-readme].

47Billion's production comparison found CrewAI more predictable than AutoGen for structured multi-step tasks, with a task-based approach, smoother tool integration, and a faster path to a working reservation-system rebuild. The same article notes CrewAI is less flexible for dynamic open-ended scenarios and that memory across tasks can be tricky [47billion-production].

## Microsoft AutoGen and Microsoft Agent Framework

AutoGen pioneered many multi-agent conversation patterns, but the current README states that AutoGen is in maintenance mode, will not receive new features, and new users should start with Microsoft Agent Framework. Existing users are encouraged to migrate [autogen-readme].

AutoGen still supports Python and .NET layers: Core API for message passing and distributed runtime, AgentChat for opinionated multi-agent patterns, Extensions for LLM clients and code execution, AutoGen Studio for prototyping, and AutoGen Bench for evaluation [autogen-readme].

The migration status matters for maturity assessment. AutoGen has the largest star count in this snapshot, but new production architecture should evaluate Microsoft Agent Framework rather than assuming AutoGen is the forward path [autogen-readme] [github-repo-metadata].

## LlamaIndex

LlamaIndex is an open-source framework for agentic applications with deep strength in data ingestion, indexing, retrieval, RAG, document parsing, and document agents. Its README describes connectors for APIs, PDFs, docs, SQL, and other data sources; data structures such as indices and graphs; retrieval/query interfaces; and integrations with application frameworks [llamaindex-readme].

The current LlamaIndex messaging emphasizes its enterprise document-agent platform: LlamaParse for agentic OCR and document parsing, Extract for structured extraction, Index for ingest/RAG, and LlamaAgents for deployed document agents [llamaindex-readme].

47Billion's production writeup described LlamaIndex Workflows as a strong fit for document-heavy and RAG-centric applications, with an event-driven architecture that helps logging, retries, and error handling, but not the best choice for pure orchestration [47billion-production].

## Open-source standards repositories

### AgentNetworkProtocol

AgentNetworkProtocol (ANP) is a protocol repo, not a framework. It defines a vision for an agentic web built around DID identity, secure communication, meta-protocol negotiation, and application-layer capability descriptions [anp-readme].

Its maturity is early but real: 1,311 stars, 92 forks, recent activity, a technical white paper, sample docs, and an implementation repo called AgentConnect [anp-readme] [github-repo-metadata].

### LangChain Agent Protocol

LangChain Agent Protocol is an API standardization repo. It defines endpoints and schemas for serving agents in production across runs, threads, agents, store, and streaming. LangGraph Platform implements a superset, and the repo includes OpenAPI docs and generated server stubs [agent-protocol-readme].

It is best treated as an operations/control API for hosted agents rather than an agent reasoning framework [agent-protocol-readme].

### AG-UI

AG-UI is both a protocol and SDK ecosystem. It has first-party and partner integrations with LangGraph, CrewAI, Microsoft Agent Framework, Google ADK, AWS Strands, Mastra, Pydantic AI, Agno, LlamaIndex, AG2, Amazon Bedrock AgentCore, and more [ag-ui-readme].

Its community support appears strong for a newer UI-layer protocol: 13,989 GitHub stars and frequent activity during the research run [github-repo-metadata].

## Bluefly OSSA and DUADP packages

### `@bluefly/openstandardagents`

`@bluefly/openstandardagents` is the OSSA npm package. Version 0.5.1 was published 2026-03-28. It is an Apache-2.0 TypeScript package with schema exports, CLI binaries, validation/generation/migration services, agent-card generation, OpenAPI extensions, mesh APIs, trust services, workspace validation, and an MCP server [npm-ossa] [local-package].

The local package description is precise: "OSSA - Open Standard for Software Agents. Infrastructure bridge between agent protocols (MCP, A2A) and deployment platforms. Define once in YAML, export to 9+ platforms" [local-package].

The site expands this to 23+ export targets, 65+ CLI commands, 10 MCP tools, 50+ example manifests, and a platform maturity table across production and beta adapters [ossa-site].

### `@bluefly/duadp`

`@bluefly/duadp` is the DUADP TypeScript SDK and CLI. Version 0.1.4 was published 2026-03-09. It exposes `client`, `server`, `validate`, `crypto`, `did`, and `conformance` subpaths, depends on AJV, DID resolvers, canonicalization, and YAML parsing, and has an optional Express peer dependency [npm-duadp].

The package description is "DUADP - Decentralized Universal AI Discovery Protocol SDK for TypeScript." Its repo metadata points to `gitlab.com/blueflyio/duadp/duadp`, directory `sdk/typescript` [npm-duadp].

The public site positions DUADP as the discovery layer that OSSA and the broader agent stack were missing: publish once, discover everywhere across federated nodes, validate identities through DID/GAID, verify signatures, and gate by trust tier [duadp-site].

## Production cost and reliability considerations

47Billion's practical cost table is one of the clearest engineering summaries:

| Approach | Cost per task | Tokens per task | Best fit |
| --- | ---: | ---: | --- |
| Simple workflow | $0.10-$0.50 | 1,000-3,000 | Linear deterministic tasks |
| CrewAI multi-agent | $0.50-$2.00 | 3,000-10,000 | Structured multi-step tasks |
| AutoGen multi-agent | $2.00-$5.00 | 5,000-25,000 | Exploratory collaboration |
| LlamaIndex RAG | $0.20-$1.00 | 1,000-5,000 | Document processing queries |

The same source recommends structured outputs, conservative temperatures, strict tool whitelisting, progressive rollout, cost monitoring, and iterative refinement. It argues that simple workflows and constrained tool-using agents can be production-ready, while open-ended multi-agent systems are not yet suitable for critical paths [47billion-production].

## Maturity notes

1. Repo stars measure attention, not safety. AutoGen has very high stars but is now maintenance mode [autogen-readme].
2. Framework and protocol boundaries are often blurred in marketing. Agent Protocol and AG-UI are protocols; LangGraph and CrewAI are orchestration frameworks; OSSA is a contract/export layer; DUADP is discovery/identity [agent-protocol-readme] [ag-ui-readme] [ossa-site] [duadp-site].
3. The strongest production systems use narrower agents. 47Billion cites Claude Code, Cursor, and domain-specific training simulators as evidence that constrained agents outperform generic agents in production [47billion-production].
4. Security and observability need to be designed in, not bolted on. GitLab Duo Agent Platform and CrewAI AMP both emphasize governance, visibility, and controls as product capabilities, not optional extras [gitlab-duo-ga] [crewai-readme].
