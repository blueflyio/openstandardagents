# Reading list and citation keys

Research compiled as of 2026-05-28. Citation keys are used across the reports as tether IDs.

## OSSA, DUADP, and local package sources

| Key | Source | Notes |
| --- | --- | --- |
| [T01] | OSSA homepage, https://openstandardagents.org/ | Positions OSSA as a contract layer between MCP/A2A/ANP and deployment platforms; includes trust, GAID, Cedar, export targets, MCP tools. |
| [T02] | DUADP homepage, https://duadp.org/ | Positions DUADP as DNS/WebFinger/gossip discovery for AI agents; v0.1.4, 17 REST/MCP surfaces, GAID/DID trust flow. |
| [T03] | Local `package.json` for `@bluefly/openstandardagents` | npm package v0.5.1; Apache-2.0; schema exports, CLI bins, MCP server, validation/generation/migration/trust exports. |
| [T04] | Local `README.md` for OSSA | Explains OSSA + DUADP stack: OSSA defines agent identity/governance; DUADP discovers agents. |
| [T05] | Local `node_modules/@bluefly/duadp/README.md` | npm package v0.1.4; TypeScript SDK with client, server, validation, crypto, DID, conformance exports. |
| [T06] | Local `spec/uadp/README.md` and `docs/specs/uadp.md` | Draft UADP/DUADP spec material; useful for endpoint, trust-tier, and security notes. |
| [T07] | npm registry metadata for `@bluefly/openstandardagents` and `@bluefly/duadp` | Latest versions: OSSA 0.5.1, DUADP 0.1.4; both Apache-2.0. |

## Academia and governance

| Key | Source | Notes |
| --- | --- | --- |
| [T08] | Cornell/eCornell Agentic AI Architecture certificate, https://online.cornell.edu/certificates/ai/agentic-ai-architecture/ | LLM foundations, RAG, tool-using agents, MCP, multi-agent workflows, governance/risk/security. |
| [T09] | Harvard Library Innovation Lab, "Launching the Agent Protocols Tech Tree", https://lil.law.harvard.edu/blog/2026/02/23/agent-protocols-tech-tree/ | Protocols as rough-consensus/running-code signals for agent ecosystem development. |
| [T10] | MIT AI Agent Index, https://aiagentindex.mit.edu/ | 30-agent index; autonomy, transparency, model concentration, web-conduct findings. |
| [T11] | MIT Sloan, "Action items for AI decision makers in 2026", https://mitsloan.mit.edu/ideas-made-to-matter/action-items-ai-decision-makers-2026 | Agentic AI not ready for prime time; hallucinations and prompt injection; five-year transaction prediction. |
| [T12] | NIST/NCCoE concept paper page, https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd | Project scoping for software and AI agent identity, authorization, auditing, and prompt-injection controls. |
| [T13] | ACM Computing Surveys, "AI Agents Under Threat", https://dl.acm.org/doi/10.1145/3716628 | Security survey; prompt injection, untrusted external entities, operational complexity. |
| [T14] | Communications of the ACM, "Guardians of the Agents", https://cacm.acm.org/practice/guardians-of-the-agents/ | Static verification and guardrail patterns for tool-calling agents. |
| [T15] | arXiv 2603.22928, "SoK: The Attack Surface of Agentic AI -- Tools, and Autonomy", https://arxiv.org/abs/2603.22928v1 | Attack taxonomy and defensive controls for agentic AI. |
| [T16] | arXiv 2506.23260, "From Prompt Injections to Protocol Exploits", https://arxiv.org/html/2506.23260v1 | End-to-end threat model including MCP, ACP, ANP, and A2A protocol vulnerabilities. |
| [T17] | Harvard Journal of Law & Technology, "On the Institutional Origins of the Agentic Web", https://jolt.law.harvard.edu/digest/on-the-institutional-origins-of-the-agentic-web | Know Your Agent, delegation, identity, and auditability governance framing. |

## Protocols and standards

| Key | Source | Notes |
| --- | --- | --- |
| [T18] | Anthropic, "Introducing the Model Context Protocol", https://www.anthropic.com/news/model-context-protocol | MCP announcement, open standard, client/server architecture, early adopters. |
| [T19] | Google Cloud, "Agent2Agent protocol (A2A) is getting an upgrade", https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade | A2A v0.3, gRPC, signed security cards, 150+ organizations, Google Cloud toolkit. |
| [T20] | A2A GitHub repository, https://github.com/a2aproject/A2A | Apache-2.0; JSON-RPC over HTTP, Agent Cards, SSE/push, SDK ecosystem; 24,042 stars on 2026-05-28. |
| [T21] | AG-UI GitHub repository, https://github.com/ag-ui-protocol/ag-ui | Agent-user interaction protocol; event transport over SSE/WebSockets/webhooks; 13,894 stars. |
| [T22] | Agent Network Protocol GitHub repository, https://github.com/agent-network-protocol/AgentNetworkProtocol | ANP "HTTP of the Agentic Web" vision; W3C DID, meta-protocol, application protocol layers; 1,304 stars. |
| [T23] | LangChain Agent Protocol repository/docs, https://github.com/langchain-ai/agent-protocol | Framework-agnostic APIs for runs, threads, and store; 595 stars. |
| [T24] | IBM BeeAI ACP repository, https://github.com/i-am-bee/acp | ACP open protocol for agents/apps/humans; now part of A2A; 1,004 stars. |
| [T25] | monday.com Agent Tool Protocol repository, https://github.com/mondaycom/agent-tool-protocol | ATP code-first sandboxed TypeScript/JavaScript execution; OpenAPI/MCP compatibility; 97 stars. |

## Frameworks, packages, and platforms

| Key | Source | Notes |
| --- | --- | --- |
| [T26] | OpenAI Agents SDK Python repository, https://github.com/openai/openai-agents-python | Agents, handoffs, guardrails, sessions, tracing; MIT; 26,716 stars. |
| [T27] | OpenAI Agents SDK TypeScript docs, https://openai.github.io/openai-agents-js/ | TypeScript SDK; agents, sandbox agents, handoffs/tools, guardrails, tracing. |
| [T28] | npm registry metadata for `@openai/agents` | npm package v0.11.5; MIT; TypeScript Agents SDK. |
| [T29] | LangGraph GitHub repository, https://github.com/langchain-ai/langgraph | Stateful graph runtime; MIT; 33,229 stars. |
| [T30] | LangGraph persistence and HITL docs, https://docs.langchain.com/oss/python/langgraph/persistence and https://docs.langchain.com/oss/python/langchain/human-in-the-loop | Checkpointing, threads, state snapshots, interrupts, review policies. |
| [T31] | CrewAI GitHub repository, https://github.com/crewAIInc/crewAI | Role-based crews and event-driven flows; MIT; 52,351 stars. |
| [T32] | Microsoft AutoGen GitHub repository, https://github.com/microsoft/autogen | Multi-agent framework, now maintenance-oriented with migration to Microsoft Agent Framework; 58,482 stars. |
| [T33] | LlamaIndex GitHub repository, https://github.com/run-llama/llama_index | Agentic RAG/document-agent framework; MIT; 49,721 stars. |
| [T34] | GitLab Duo Agent Platform GA announcement, https://about.gitlab.com/blog/gitlab-duo-agent-platform-is-generally-available/ | Foundational/custom/external agents, flows, MCP Client, governance, model selection. |
| [T35] | npm registry metadata for monday ATP packages | `@mondaydotcomorg/atp-server` 0.25.0, `atp-client` 0.24.0, `atp-protocol` 0.22.3. |

## Engineering blogs and security reports

| Key | Source | Notes |
| --- | --- | --- |
| [T36] | 47Billion, "AI Agents in Production", https://47billion.com/blog/ai-agents-in-production-frameworks-protocols-and-what-actually-works-in-2026/ | Framework tradeoffs, MCP/A2A/AG-UI, cost ranges, reliability playbook, rollout advice. |
| [T37] | Ruh.ai, "AI Agent Protocols 2026", https://www.ruh.ai/blogs/ai-agent-protocols-2026-complete-guide | MCP/A2A/ACP decision framework, Gartner 40% enterprise-app forecast, security considerations. |
| [T38] | Gravitee, "State of AI Agent Security 2026", https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control | 900+ respondent report; 80.9% past planning, 14.4% full security approval, 88% incidents, 21.9% identities. |
| [T39] | DEV Community, "LLM Security Vulnerabilities Engineers Need to Know in 2026", https://dev.to/opsbuzzdev/llm-security-vulnerabilities-engineers-need-to-know-in-2026-4cd8 | Prompt injection, excessive authority, authorization outside the model, logging and validation. |
| [T40] | DEV Community, "I Scanned 5 Common LangChain Agent Patterns", https://dev.to/waelrezguii/i-scanned-5-common-langchain-agent-patterns-every-single-one-was-over-permissioned-4d25 | Over-permissioning patterns and least-privilege recommendations. |
| [T41] | Imperva, "Bad Bot Report 2026", https://www.imperva.com/blog/bad-bot-report-2026-bots-agentic-age/ | Automated bot traffic reached 53% of web traffic in 2025; APIs and AI agents as new pressure points. |
| [T42] | HUMAN Security 2026 State of AI Traffic report announcement, https://www.humansecurity.com/newsroom/2026-state-of-ai-traffic-cyberthreat-benchmark-report/ | AI-driven traffic up 187% Jan-Dec 2025; agentic traffic up 7,851% year over year. |
| [T43] | Workato summary of HBR Analytic Services report, https://www.workato.com/the-connector/hbr-enterprise-ai-trust-gap/ | Secondary source for HBR enterprise trust gap; only 6% fully trust agents for core processes. |

## Limitations

- Firecrawl could not be used because the CLI was unauthenticated in the unattended environment. Official pages, npm metadata, GitHub metadata, and local package files were used instead.
- The full Harvard Business Review Analytic Services report appears gated/partner-hosted; [T43] is a secondary summary and should be replaced with the original report if access is available.
- Some blog statistics are vendor-reported and should be treated as directional unless corroborated by primary datasets.
