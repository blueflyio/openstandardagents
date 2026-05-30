# Reading List and Source Map

Prepared as of May 30, 2026. Source IDs are used as citation keys in the other documents.

| ID | Source | URL | Type | Notes |
|---|---|---|---|---|
| S01 | DUADP homepage | https://duadp.org/ | Primary project site | Discovery, GAID, DID, federation, MCP tools. |
| S02 | OSSA homepage | https://openstandardagents.org/ | Primary project site | Contract layer, exports, trust model. |
| S03 | npm `@bluefly/openstandardagents` | https://www.npmjs.com/package/@bluefly/openstandardagents | Package registry | v0.5.1, CLI, SDK, exports. |
| S04 | npm `@bluefly/duadp` | https://www.npmjs.com/package/@bluefly/duadp | Package registry | v0.1.4 TypeScript SDK. |
| S05 | Cornell Agentic AI Architecture | https://online.cornell.edu/certificates/ai/agentic-ai-architecture/ | University program | LLMs, RAG, agents, MCP, governance. |
| S06 | Harvard Library Innovation Lab APTT | https://lil.law.harvard.edu/blog/2026/02/23/agent-protocols-tech-tree/ | University lab blog | Protocols as builder consensus. |
| S07 | MIT 2025 AI Agent Index | https://aiagentindex.mit.edu/ | Research index | Deployment, autonomy, transparency. |
| S08 | MIT AI Agent Index further details | https://aiagentindex.mit.edu/2025/further-details/ | Research methodology | Inclusion criteria and detailed findings. |
| S09 | MIT Sloan 2026 action items | https://mitsloan.mit.edu/ideas-made-to-matter/action-items-ai-decision-makers-2026 | Business research | Agentic AI not ready yet; HITL. |
| S10 | Anthropic MCP announcement | https://www.anthropic.com/news/model-context-protocol | Official announcement | MCP open standard and early adopters. |
| S11 | Google A2A announcement | https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ | Official announcement | Agent Cards, tasks, HTTP/SSE/JSON-RPC. |
| S12 | Linux Foundation A2A milestone | https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year | Foundation press release | 150+ orgs, v1, cloud adoption. |
| S13 | AG-UI GitHub and docs evidence | https://github.com/ag-ui-protocol/ag-ui | Open-source repo | Agent-user event protocol. |
| S14 | Agent Network Protocol sources | https://github.com/agent-network-protocol/AgentNetworkProtocol and https://agent-network-protocol.com/ | Open protocol repo/site | DID layer, meta-protocol, application layer. |
| S15 | LangChain Agent Protocol API | https://langchain-ai.github.io/agent-protocol/api.html | OpenAPI docs | Runs, threads, store. |
| S16 | Agent Communication Protocol docs | https://agentcommunicationprotocol.dev/introduction/welcome | Protocol docs | REST API; now part of A2A. |
| S17 | OpenAI Agents SDK repo | https://github.com/openai/openai-agents-python | Open-source repo | Agents, handoffs, guardrails, sessions, tracing. |
| S18 | LangGraph docs | https://docs.langchain.com/oss/python/langgraph/overview | Framework docs | Durable execution, HITL, memory. |
| S19 | CrewAI repo | https://github.com/crewaiinc/crewai | Open-source repo | Crews and flows. |
| S20 | Microsoft AutoGen repo/docs | https://github.com/microsoft/autogen and https://microsoft.github.io/autogen/stable/index.html | Open-source repo/docs | Multi-agent framework; maintenance mode. |
| S21 | LlamaAgents / LlamaIndex Workflows | https://github.com/run-llama/llama-agents and https://developers.llamaindex.ai/typescript/workflows/ | Open-source repo/docs | Event-driven document-centric agents. |
| S22 | Parlant repo/docs | https://github.com/emcie-co/parlant and https://parlant.io/docs/concepts/customization/journeys/ | Open-source repo/docs | Guidelines, journeys, predictable conversations. |
| S23 | GitLab Duo Agent Platform GA | https://about.gitlab.com/blog/gitlab-duo-agent-platform-is-generally-available/ | Official product blog | Foundational/custom/external agents, flows, MCP client. |
| S24 | 47Billion AI Agents in Production | https://47billion.com/blog/ai-agents-in-production-frameworks-protocols-and-what-actually-works-in-2026/ | Engineering blog | Production patterns, costs, protocols. |
| S25 | Ruh.ai AI Agent Protocols 2026 | https://www.ruh.ai/blogs/ai-agent-protocols-2026-complete-guide | Industry blog | MCP/A2A/ACP decision framing; direct fetch partial. |
| S26 | Gravitee State of AI Agent Security 2026 | https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control | Security report/blog | Adoption, incidents, identity statistics. |
| S27 | NIST/NCCoE identity concept paper | https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd | Federal concept paper | Agent identity and authorization. |
| S28 | Harvard JOLT agentic web | https://jolt.law.harvard.edu/digest/on-the-institutional-origins-of-the-agentic-web | Policy/legal commentary | KYA, protocol governance. |
| S29 | DEV Community MCP security guide | https://dev.to/instatunnel/securing-mcp-servers-the-2026-guide-to-ai-tool-tunneling-9jj | Security engineering blog | Tool poisoning, gateway pattern, HITL. |
| S30 | Imperva Bad Bot Report 2026 article | https://www.imperva.com/blog/bad-bot-report-2026-bots-agentic-age/ | Security industry report | 53% automated traffic, API attacks. |
| S31 | Monday.com Agent Tool Protocol | https://github.com/mondaycom/agent-tool-protocol and https://registry.npmjs.org/@mondaydotcomorg/atp-server | Open-source repo/npm | Sandboxed TypeScript execution for agents. |
| S32 | NIST AI Agent Standards Initiative | https://www.nist.gov/artificial-intelligence/ai-agent-standards-initiative | Federal standards initiative | Interoperability, security, open protocols. |
| S33 | Layered Governance Architecture paper | https://arxiv.org/html/2603.07191 | Research paper | Sandboxing, intent verification, zero-trust auth, audit. |

## Local repository sources consulted

- `/workspace/README.md`: OSSA positioning, DUADP relationship, NIST alignment, v0.5.1 highlights.
- `/workspace/package.json`: npm metadata, exports, dependencies, scripts, CLI bins.
- `/workspace/spec/uadp/README.md`: draft UADP/DUADP endpoint model and conformance notes.
- `/workspace/docs/research/README.md`: earlier OSSA agent platform research inventory.

## Notes on evidence quality

- Primary sources were preferred where available: official project sites, official announcements, GitHub repositories, npm pages, university pages, NIST pages, and published research pages.
- Some industry blog claims are useful for practice but should be treated as vendor/consultancy perspectives rather than neutral empirical studies.
- GitHub star counts and release details were collected via GitHub CLI on May 30, 2026; they will drift over time.
- npm package metadata was collected via `npm view` and npm package pages on May 30, 2026; weekly download counts may change rapidly.
