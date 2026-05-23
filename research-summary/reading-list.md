# Reading list and source tether IDs

Source review date: 2026-05-23. Tether IDs below are used across the reports.

| ID | Source | Type | Notes |
| --- | --- | --- | --- |
| S01 | https://duadp.org/ | Primary site | DUADP homepage and protocol positioning. |
| S02 | https://www.npmjs.com/package/@bluefly/duadp | npm package | `@bluefly/duadp` package metadata checked with `npm view` on 2026-05-23. |
| S03 | https://openstandardagents.org/ | Primary site | OSSA homepage, spec positioning, platform status, MCP tools. |
| S04 | https://www.npmjs.com/package/@bluefly/openstandardagents | npm package | `@bluefly/openstandardagents` package metadata checked with `npm view` on 2026-05-23. |
| S05 | https://gitlab.com/blueflyio/ossa/openstandardagents | Repository | Local checkout README and package metadata for OSSA v0.5.1. |
| S06 | https://www.anthropic.com/news/model-context-protocol | Official announcement | Anthropic MCP launch, goals, SDKs, early adopters. |
| S07 | https://modelcontextprotocol.io/introduction | Official docs | MCP definition, ecosystem support, clients and servers. |
| S08 | https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ | Official announcement | Google A2A design goals, Agent Cards, task lifecycle, partners. |
| S09 | https://github.com/a2aproject/A2A | Repository | A2A repository metadata checked with GitHub CLI on 2026-05-23. |
| S10 | https://docs.ag-ui.com/introduction | Official docs | AG-UI agent-user interaction protocol overview. |
| S11 | https://github.com/agent-network-protocol/AgentNetworkProtocol | Repository | ANP README, three-layer architecture, DID foundation. |
| S12 | https://github.com/langchain-ai/agent-protocol | Repository | LangChain Agent Protocol runs, threads, and store endpoints. |
| S13 | https://research.ibm.com/projects/agent-communication-protocol | Research/official | IBM ACP overview and Linux Foundation/A2A migration note. |
| S14 | https://ecornell.cornell.edu/certificates/ai/agentic-ai-architecture/ | University program | Cornell course descriptions for LLMs, RAG, agents, MCP, governance. |
| S15 | https://lil.law.harvard.edu/blog/2026/02/23/agent-protocols-tech-tree/ | University lab blog | Harvard Library Innovation Lab Agent Protocols Tech Tree. |
| S16 | https://aiagentindex.mit.edu/ | University research index | MIT 2025 AI Agent Index findings on autonomy, transparency, web conduct. |
| S17 | https://mitsloan.mit.edu/ideas-made-to-matter/action-items-ai-decision-makers-2026 | University/business guidance | MIT Sloan 2026 agentic AI guidance. |
| S18 | https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd | Government concept paper | NIST/NCCoE agent identity and authorization concept paper. |
| S19 | https://www.gravitee.io/state-of-ai-agent-security | Security report | Gravitee State of AI Agent Security 2026. |
| S20 | https://dev.to/theaniketgiri/building-production-ready-ai-agents-a-complete-security-guide-2026-4d01 | Engineering blog | Production agent security risks and verification pattern. |
| S21 | https://owasp.org/www-project-agentic-skills-top-10/ast03 | Security guidance | OWASP Agentic Skills Top 10 over-privileged skills; cross-read with LLM06. |
| S22 | https://openai.github.io/openai-agents-js/ | Official docs | OpenAI Agents SDK TypeScript docs; Python repo metadata also reviewed. |
| S23 | https://docs.langchain.com/oss/python/langgraph/graph-api | Official docs | LangGraph graph API, persistence, durable execution, interrupts. |
| S24 | https://github.com/CrewAIInc/CrewAI | Repository | CrewAI metadata checked with GitHub CLI on 2026-05-23. |
| S25 | https://github.com/microsoft/AutoGen | Repository | AutoGen metadata and maintenance-mode note checked with GitHub CLI. |
| S26 | https://developers.llamaindex.ai/python/framework/module_guides/deploying/agents/ | Official docs | LlamaIndex agent and RAG documentation; repo metadata also reviewed. |
| S27 | https://about.gitlab.com/blog/gitlab-duo-agent-platform-is-generally-available/ | Official announcement | GitLab Duo Agent Platform GA announcement. |
| S28 | https://47billion.com/blog/ai-agents-in-production-frameworks-protocols-and-what-actually-works-in-2026/ | Engineering blog | Production frameworks, protocols, cost and reliability guidance. |
| S29 | https://www.ruh.ai/blogs/ai-agent-protocols-2026-complete-guide | Industry guide | 2026 protocol decision framework and adoption statistics. |
| S30 | https://jolt.law.harvard.edu/digest/on-the-institutional-origins-of-the-agentic-web | Policy analysis | Harvard JOLT agentic web, KYA and delegated authority. |
| S31 | https://arxiv.org/html/2505.02279 | Academic survey | Survey of MCP, ACP, A2A and ANP. |
| S32 | https://arxiv.org/html/2506.19676v4 | Academic survey | LLM-driven agent communication protocols, security risks and defenses. |
| S33 | https://labs.cloudsecurityalliance.org/agentic/agentic-mcp-security-best-practices-v1/ | Security guide | CSA MCP security best practices and maturity model. |
| S34 | https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control | Security blog | Gravitee statistics and recommendations summary. |
| S35 | https://developers.googleblog.com/developers-guide-to-ai-agent-protocols/ | Official developer guide | Google protocol boundaries: MCP, A2A, UCP, AP2, A2UI, AG-UI. |
| S36 | https://github.com/openai/openai-agents-python | Repository | OpenAI Agents SDK Python metadata checked with GitHub CLI. |
| S37 | https://github.com/langchain-ai/langgraph | Repository | LangGraph metadata checked with GitHub CLI. |
| S38 | https://github.com/ag-ui-protocol/ag-ui | Repository | AG-UI metadata checked with GitHub CLI. |
| S39 | https://github.com/i-am-bee/ACP | Repository | ACP metadata; archived status checked with GitHub CLI. |
| S40 | https://www.akeyless.io/ebooks/state-of-ai-agent-identity-security-report/ | Security survey | Akeyless 2026 agent identity risk statistics. |
| S41 | https://grantex.dev/report/state-of-agent-security-2026 | Security audit | Grantex audit of agent project authorization patterns. |
| S42 | https://arxiv.org/html/2603.13417v1 | Academic/production paper | MCP production deployment gaps: identity propagation, budgeting, errors. |

## Npm package metadata snapshot

The following package metadata was gathered with `npm view --json` on 2026-05-23:

| Package | Version | Purpose |
| --- | --- | --- |
| `@bluefly/openstandardagents` | 0.5.1 | OSSA CLI, schemas, validation, generation, migration, MCP server, trust services. |
| `@bluefly/duadp` | 0.1.4 | DUADP TypeScript SDK and CLI for decentralized AI agent discovery. |
| `@openai/agents` | 0.11.5 | TypeScript OpenAI Agents SDK for text, sandbox, and voice agents. |
| `@modelcontextprotocol/sdk` | 1.29.0 | TypeScript implementation of MCP. |
| `@langchain/langgraph` | 1.3.2 | TypeScript LangGraph core package. |
| `@ag-ui/client` | 0.0.53 | AG-UI client SDK. |
| `@ag-ui/core` | 0.0.53 | AG-UI TypeScript definitions and runtime schemas. |
| `@a2a-js/sdk` | 0.3.13 | Agent2Agent protocol server and client SDK. |
