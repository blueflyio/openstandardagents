# Reading list and source keys

Compiled on June 9, 2026. Source keys are used throughout the reports as
stable tether IDs. When a source was unavailable, incomplete, or paywalled, the
limitation is noted here.

## Core OSSA and DUADP sources

| Key | Source | Type | Notes |
| --- | --- | --- | --- |
| [S01] | https://duadp.org/ | Official site | DUADP positioning, DID/GAID flow, federation, MCP tools, trust tiers, npm package links. |
| [S02] | https://openstandardagents.org/ | Official site | OSSA positioning, MCP/A2A comparison, platform support, MCP server tools, site metrics. |
| [S03] | `/workspace/package.json` | Local repository | Local package metadata for `@bluefly/openstandardagents`, exports, CLI commands, dependencies. |
| [S04] | `npm view @bluefly/openstandardagents --json` | npm registry | Latest npm version `0.5.6`, Apache-2.0 license, creation and modification timestamps, CLI bin. |
| [S05] | `npm view @bluefly/duadp --json` | npm registry | Latest npm version `0.1.7`, Apache-2.0 license, TypeScript SDK, GitLab repo, CLI bin. |
| [S06] | https://api.npmjs.org/downloads/point/last-week/@bluefly%2Fopenstandardagents and https://api.npmjs.org/downloads/point/last-week/@bluefly%2Fduadp | npm downloads API | Weekly downloads for May 27-June 2, 2026: OSSA 42, DUADP 9. |
| [S07] | https://api.npmjs.org/downloads/point/last-week/@modelcontextprotocol%2Fsdk, https://api.npmjs.org/downloads/point/last-week/@openai%2Fagents, https://api.npmjs.org/downloads/point/last-week/@mondaydotcomorg%2Fatp-server | npm downloads API | Weekly downloads for May 27-June 2, 2026: MCP SDK 35,499,180; OpenAI Agents JS 1,066,478; ATP server 6,923. |

## Academia and research centers

| Key | Source | Type | Notes |
| --- | --- | --- | --- |
| [S08] | https://online.cornell.edu/certificates/ai/agentic-ai-architecture/ | Cornell/eCornell program | Agentic AI Architecture certificate: LLM fundamentals, RAG, tools, memory, MCP, governance, risk, security. |
| [S09] | https://lil.law.harvard.edu/blog/2026/02/23/agent-protocols-tech-tree/ and https://github.com/harvard-lil/agent-protocols | Harvard Library Innovation Lab | Agent Protocols Tech Tree and rationale for open protocols in agent ecosystems. |
| [S10] | https://cyber.harvard.edu/events/towards-internet-ecosystem-sane-autonomous-agents | Harvard Berkman Klein Center | February 9, 2026 workshop on autonomous-agent legal, technical, and governance challenges. |
| [S11] | https://aiagentindex.mit.edu/ and https://aiagentindex.mit.edu/data/2025-AI-Agent-Index.pdf | MIT AI Agent Index | 30 deployed agents, transparency gaps, safety disclosures, web-conduct findings. |
| [S12] | https://mitsloan.mit.edu/ideas-made-to-matter/action-items-ai-decision-makers-2026 | MIT Sloan | 2026 decision-maker guidance: agents not ready for prime time due to hallucinations and prompt injection, but likely to handle many transactions within five years. |
| [S13] | https://hbr.org/2025/06/organizations-arent-ready-for-the-risks-of-agentic-ai and https://hbr.org/2025/05/can-ai-agents-be-trusted | Harvard Business Review | HBR articles on trust, risk, and organizational readiness. Some HBR content can be gated; search snippets and accessible metadata were used. |
| [S14] | https://arxiv.org/abs/2602.16666 | arXiv | "Towards a Science of AI Agent Reliability": 12 reliability metrics across consistency, robustness, predictability, and safety. |
| [S15] | https://arxiv.org/abs/2603.23802 | arXiv / UK AI Security Institute | Evidence from 177,436 MCP tools, November 2024-February 2026, including action-tool growth. |
| [S16] | https://w3c-cg.github.io/webagents/TaskForces/Interoperability/Reports/report-interoperability.html | W3C Community Group | Interoperability for agents on the web and standardization gaps. |

## Protocols and standards

| Key | Source | Type | Notes |
| --- | --- | --- | --- |
| [S17] | https://www.anthropic.com/news/model-context-protocol | Anthropic announcement | MCP as an open standard for secure two-way connections between AI systems and data/tools. |
| [S18] | https://modelcontextprotocol.io/docs/getting-started/intro | Official MCP docs | MCP clients/servers, resources, prompts, tools, broad client support. |
| [S19] | https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ | Google Developers Blog | A2A announcement: HTTP, SSE, JSON-RPC, Agent Cards, partner support. |
| [S20] | https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade and https://github.com/a2aproject/A2A | Google Cloud / A2A repo | A2A v0.3 upgrade, Linux Foundation project, gRPC, signed security cards, 150+ organizations. |
| [S21] | https://docs.ag-ui.com/concepts/architecture and https://github.com/ag-ui-protocol/ag-ui | AG-UI docs/repo | Event-driven, transport-agnostic agent-to-UI protocol; HTTP SSE and WebSocket-compatible patterns. |
| [S22] | https://github.com/agent-network-protocol/AgentNetworkProtocol and https://agentnetworkprotocol.com/en/docs/ | ANP official sources | ANP "HTTP of the Agentic Web", three-layer architecture, W3C DID identity. |
| [S23] | https://github.com/langchain-ai/agent-protocol and https://www.langchain.com/blog/agent-protocol-interoperability-for-llm-agents | LangChain | Framework-agnostic Agent Protocol: runs, threads, store endpoints. |
| [S24] | https://agentcommunicationprotocol.dev/introduction/welcome and https://research.ibm.com/projects/agent-communication-protocol | ACP / IBM Research | REST-native Agent Communication Protocol under Linux Foundation/BeeAI governance. |
| [S25] | https://github.com/mondaycom/agent-tool-protocol and https://agenttoolprotocol.com/docs | monday.com ATP | Code-first protocol for sandboxed TypeScript/JavaScript tool execution, OpenAPI/MCP aggregation. |

## Frameworks, platforms, and repositories

| Key | Source | Type | Notes |
| --- | --- | --- | --- |
| [S26] | https://github.com/openai/openai-agents-python and https://openai.github.io/openai-agents-python/ | OpenAI | Agents SDK primitives: agents, handoffs, tools, guardrails, sessions, tracing; 100+ LLM support. |
| [S27] | https://docs.langchain.com/oss/python/langgraph/overview and https://github.com/langchain-ai/langgraph | LangGraph docs/repo | Graph-based orchestration for long-running, stateful agents with durable execution and human-in-the-loop. |
| [S28] | https://github.com/crewAIInc/crewAI and https://docs.crewai.com/ | CrewAI docs/repo | Crews, agents, tasks, flows, role-based collaboration, event-driven production workflows. |
| [S29] | https://github.com/microsoft/autogen and https://www.microsoft.com/en-us/research/project/autogen/ | Microsoft AutoGen | Multi-agent conversation framework, v0.4 architecture, maintenance-mode note and migration guidance. |
| [S30] | https://github.com/run-llama/llama_index and https://developers.llamaindex.ai/python/framework/ | LlamaIndex | RAG and document-agent framework with workflows, tools, and multi-agent orchestration. |
| [S31] | https://about.gitlab.com/blog/gitlab-duo-agent-platform-is-generally-available/ and https://about.gitlab.com/press/releases/2026-01-15-gitlab-announces-duo-agent-platform-general-availability/ | GitLab | Duo Agent Platform GA, foundational/custom/external agents, AI Catalog, Claude Code and Codex integration. |
| [S32] | `gh repo view ... --json` for selected repos | GitHub API | Repo stars/forks fetched June 9, 2026 for MCP SDK, A2A, AG-UI, ANP, LangGraph, CrewAI, AutoGen, LlamaIndex, OpenAI Agents, Agent Protocol, ATP, Harvard APTT. |

## Industry blogs, security, and governance

| Key | Source | Type | Notes |
| --- | --- | --- | --- |
| [S33] | https://47billion.com/blog/ai-agents-in-production-frameworks-protocols-and-what-actually-works-in-2026/ | 47Billion blog | Production-readiness matrix, protocol stack, cost ranges, reliability playbook. |
| [S34] | https://www.ruh.ai/blogs/ai-agent-protocols-2026-complete-guide | Ruh.ai blog | MCP/A2A/ACP guide and Gartner 40% enterprise-app integration forecast citation. |
| [S35] | https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control and https://www.gravitee.io/state-of-ai-agent-security | Gravitee report | 81% past planning, 14.4% full approval, 88% incidents, identity and monitoring gaps. |
| [S36] | https://dev.to/toxsec/how-to-lock-down-an-ai-agent-before-it-goes-rogue-15gd and https://dev.to/manveer_chawla_64a7283d5a/the-prompt-injection-problem-a-guide-to-defense-in-depth-for-ai-agents-3p1 | Dev.to security guides | Prompt injection, excessive permissions, deny-by-default tools, short-lived credentials, HITL. |
| [S37] | https://jolt.law.harvard.edu/digest/on-the-institutional-origins-of-the-agentic-web | Harvard JOLT | Agentic web governance, KYA, identity, verifiable delegation, protocol governance. |
| [S38] | https://arxiv.org/abs/2503.23278 and https://dl.acm.org/doi/10.1145/3796519 | arXiv / ACM TOSEM | Hou et al., MCP landscape and 16 threat scenarios across four attacker types. |
| [S39] | https://cacm.acm.org/research/guardians-of-the-agents/ | Communications of the ACM | Static verification, generate-verify-execute, strict data/instruction separation. |
| [S40] | https://proceedings.iclr.cc/paper_files/paper/2025/file/5750f91d8fb9d5c02bd8ad2c3b44456b-Paper-Conference.pdf | ICLR 2025 | Agent Security Bench: 10 scenarios, 400+ tools, attack/defense benchmark, high attack success rates. |
| [S41] | https://arxiv.org/abs/2506.23260 | arXiv | Threats in LLM-powered AI agent workflows: input manipulation, model compromise, privacy/system attacks, protocol vulnerabilities. |
| [S42] | https://arxiv.org/abs/2603.18829 | arXiv | Agent Control Protocol as admission-control layer for agent identity, delegation, capability scope, and auditability. |

## Limitations

- Firecrawl CLI was installed during the run but could not authenticate without external browser action. Web search, web fetch, npm registry, GitHub API, and local repository files were used instead.
- HBR content may be gated. The report cites accessible metadata and snippets, and uses other primary sources for technical/security claims.
- Repository star and npm download counts are point-in-time telemetry from June 9, 2026 or the npm last-week range ending June 2, 2026. They should be treated as adoption signals, not precise measures of usage.
