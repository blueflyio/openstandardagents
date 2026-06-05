# Reading list and citation keys

Prepared on 2026-06-05. Relative dates from source pages were resolved to absolute dates when the source provided enough metadata. Sources that were not directly accessible through Firecrawl because the CLI was unauthenticated were collected through web search, web fetch, npm registry metadata, GitHub metadata, and local repository documentation.

## Primary Bluefly / OSSA / DUADP sources

| Key | Source | Notes |
| --- | --- | --- |
| [S01] | https://openstandardagents.org/ | OSSA public site. Fetched 2026-06-05. Identifies OSSA as "the missing agent contract" between MCP and A2A; site showed v0.5.6, Apache-2.0, 23+ export targets, 10 MCP tools, 65+ CLI commands, and 42 weekly npm downloads. |
| [S02] | https://www.npmjs.com/package/@bluefly/openstandardagents | npm package page and `npm view`. Latest 0.5.6, published 2026-06-03, Apache-2.0, CLI `ossa`, no runtime dependencies in the npm package page, Node.js 20+. |
| [S03] | https://duadp.org/ | DUADP public site. Fetched 2026-06-05. Describes "DNS for AI agents": federated DNS, WebFinger, gossip federation, W3C DID identity, GAID lookup, trust tiers, and 17 MCP tools. |
| [S04] | https://www.npmjs.com/package/@bluefly/duadp | npm package page and `npm view`. Latest 0.1.7, published 2026-06-03, Apache-2.0, CLI `duadp`, TypeScript SDK, dependencies on AJV, DID resolvers, canonicalization, and YAML parsing. |
| [S05] | `/workspace/README.md` | Local repository README. Defines OSSA as the "infrastructure bridge between agent protocols and deployment platforms" and states "OSSA defines the agent. DUADP discovers it." |
| [S06] | `/workspace/spec/uadp/README.md` | Local UADP draft spec. Version 0.1.0 draft. Requires `/.well-known/uadp.json`, `GET /uadp/v1/skills` or `/agents`, JSON responses, and OSSA payloads. |

## Protocol and standards sources

| Key | Source | Notes |
| --- | --- | --- |
| [S07] | https://www.anthropic.com/news/model-context-protocol | Anthropic MCP announcement, 2024-11-25. MCP is an open standard for secure two-way connections between AI systems and data sources, replacing fragmented custom integrations. |
| [S08] | https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ | Google A2A announcement, 2025-04-09. A2A uses HTTP, SSE, and JSON-RPC; supports Agent Cards for capability discovery; launched with 50+ partners. |
| [S09] | https://www.linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year | Linux Foundation A2A one-year adoption release, 2026-04-09. Reports 150+ supporting organizations, A2A 1.0, major cloud integrations, and production deployments. |
| [S10] | https://docs.ag-ui.com/introduction | AG-UI introduction. Open, lightweight, event-based agent-user interaction protocol over HTTP/WebSockets/SSE. |
| [S11] | https://docs.ag-ui.com/concepts/architecture | AG-UI architecture. About 16 standard event types; transport-agnostic typed event stream; bidirectional user-agent interaction. |
| [S12] | https://github.com/agent-network-protocol/AgentNetworkProtocol | ANP README and GitHub metadata. "HTTP of the Agentic Web" with identity/secure communication, meta-protocol negotiation, and application protocol layers. |
| [S13] | https://github.com/langchain-ai/agent-protocol | LangChain Agent Protocol README and GitHub metadata. Framework-agnostic APIs for runs, threads, and long-term memory store endpoints. |
| [S14] | https://www.langchain.com/blog/agent-protocol-interoperability-for-llm-agents | LangChain Agent Protocol announcement. Explains production interface and LangGraph Studio interoperability. |
| [S15] | https://research.ibm.com/projects/agent-communication-protocol | IBM ACP project page. Lightweight HTTP-native REST messaging, now merged into A2A under Linux Foundation. |
| [S16] | https://lfaidata.foundation/communityblog/2025/08/29/acp-joins-forces-with-a2a-under-the-linux-foundations-lf-ai-data/ | LF AI & Data post announcing ACP merging with A2A, 2025-08-29. |
| [S17] | https://github.com/mondaycom/agent-tool-protocol | Monday.com ATP repository and GitHub metadata. TypeScript protocol for secure code execution, runtime SDK, OpenAPI and MCP compatibility. |

## Academia and policy sources

| Key | Source | Notes |
| --- | --- | --- |
| [S18] | https://ecornell.cornell.edu/certificates/ai/agentic-ai-architecture/ | eCornell Agentic AI Architecture certificate. Covers LLM fundamentals, RAG, tools, memory, multi-agent workflows, MCP, governance, risk, security, and human oversight. |
| [S19] | https://ecornell.cornell.edu/courses/artificial-intelligence/building-enterprise-ready-ai-agents-from-prototypes-to-production/ | eCornell enterprise-ready agents workshop. Covers LangGraph state machines, OWASP LLM Top 10, RAG architecture, approval gates, monitoring, and operational drift. |
| [S20] | https://lil.law.harvard.edu/blog/2026/02/23/agent-protocols-tech-tree/ | Harvard Library Innovation Lab post on the Agent Protocols Tech Tree, 2026-02-23. Protocols as the levers that shape agent behavior. |
| [S21] | https://github.com/harvard-lil/agent-protocols/ | Harvard APTT GitHub repo. Interactive open-protocol tech tree for inference APIs, tool calling, MCP, A2A, commerce, identity, and future protocols. |
| [S22] | https://aiagentindex.mit.edu/ | 2025 AI Agent Index. Documents 30 deployed agents, autonomy levels, transparency gaps, safety disclosure gaps, and unsettled web conduct. |
| [S23] | https://aiagentindex.mit.edu/data/2025-AI-Agent-Index.pdf | 2025 AI Agent Index PDF. Reports 1,350 fields for 30 agents, 135/240 safety fields with no public information, 25/30 no internal safety results, and 23/30 no third-party testing. |
| [S24] | https://mitsloan.mit.edu/ideas-made-to-matter/action-items-ai-decision-makers-2026 | MIT Sloan decision-maker guidance for 2026. Agentic AI is not ready for prime time because of hallucinations, mistakes, prompt injection, and need for human guardrails; agents may handle most large-scale process transactions within five years. |
| [S25] | https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd | NIST/NCCoE concept paper, 2026-02-05. Identity and authorization standards for software and AI agents; comment period closed 2026-04-02. |

## Framework and platform sources

| Key | Source | Notes |
| --- | --- | --- |
| [S26] | https://github.com/openai/openai-agents-python | OpenAI Agents SDK repo and GitHub metadata. MIT, 26,935 stars on 2026-06-05, v0.17.4, primitives include agents, tools/handoffs, guardrails, tracing; provider-agnostic support. |
| [S27] | https://openai.github.io/openai-agents-python/tracing/ | OpenAI Agents SDK tracing docs. Built-in tracing for LLM generations, tools, handoffs, guardrails, and custom events. |
| [S28] | https://docs.langchain.com/oss/python/langgraph/overview | LangGraph overview. Low-level orchestration runtime for long-running, stateful agents with durable execution, streaming, human-in-the-loop, persistence, and memory. |
| [S29] | https://github.com/langchain-ai/langgraph | LangGraph GitHub metadata. MIT, 33,957 stars on 2026-06-05, v1.2.4. |
| [S30] | https://github.com/crewAIInc/crewAI | CrewAI GitHub metadata. MIT, 52,878 stars on 2026-06-05, v1.14.6; crews and flows for multi-agent orchestration. |
| [S31] | https://github.com/microsoft/autogen | Microsoft AutoGen GitHub metadata. 58,707 stars on 2026-06-05; maintenance mode; new projects should use Microsoft Agent Framework. |
| [S32] | https://github.com/run-llama/llama_index/ | LlamaIndex GitHub metadata. MIT, 49,930 stars on 2026-06-05, v0.14.22; RAG, workflows, document agents. |
| [S33] | https://developers.llamaindex.ai/python/framework/ | LlamaIndex framework docs. RAG-first agents, context augmentation, tools, workflows, autonomous agents, multimodal apps. |
| [S34] | https://about.gitlab.com/blog/gitlab-duo-agent-platform-is-generally-available/ | GitLab Duo Agent Platform GA announcement, 2026. Foundational, custom, and external agents; AI Catalog; Claude Code and OpenAI Codex integrations; flexible model selection. |
| [S35] | https://about.gitlab.com/press/releases/2026-01-15-gitlab-announces-duo-agent-platform-general-availability/ | GitLab press release, 2026-01-15. GA availability and DevSecOps lifecycle positioning. |

## Industry and security sources

| Key | Source | Notes |
| --- | --- | --- |
| [S36] | https://47billion.com/blog/ai-agents-in-production-frameworks-protocols-and-what-actually-works-in-2026/ | 47Billion production frameworks/protocols blog. MCP/A2A/AG-UI stack, reliability playbook, cost ranges, progressive rollout, guardrails, HITL. |
| [S37] | https://www.ruh.ai/blogs/ai-agent-protocols-2026-complete-guide | Ruh.ai 2026 protocol guide. Cites Gartner forecast that 40% of enterprise apps will integrate AI agents by 2026 and offers MCP/A2A/ACP decision framework. |
| [S38] | https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control | Gravitee State of AI Agent Security 2026. 81% past planning, 14.4% full security approval, 88% incidents, 21.9% independent identities, 45.6% shared API keys. |
| [S39] | https://www.gravitee.io/state-of-ai-agent-security | Gravitee survey landing page. Survey of 919 executives and practitioners. |
| [S40] | https://dev.to/theaniketgiri/building-production-ready-ai-agents-a-complete-security-guide-2026-4d01 | Dev.to production-ready AI agents security guide. Prompt injection, excessive permissions, hallucinated actions, verification layer, signatures, revocation, nonces. |
| [S41] | https://arxiv.org/abs/2503.23278 | Hou et al., "Model Context Protocol (MCP): Landscape, Security Threats, and Future Research Directions." 16 threat scenarios across four attacker types. |
| [S42] | https://owasp.org/www-community/attacks/MCP_Tool_Poisoning | OWASP MCP Tool Poisoning page. Indirect prompt injection through malicious MCP tools and untrusted tool responses. |
| [S43] | https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/ | OWASP Top 10 for Agentic Applications, 2025-12-09. Agent goal hijack, tool misuse, identity abuse, supply chain, code execution, memory poisoning, inter-agent communication, cascading failures, human trust, rogue agents. |
| [S44] | https://www.malwarebytes.com/blog/news/2025/04/hi-robot-half-of-all-internet-traffic-now-automated | Malwarebytes summary of Imperva 2025 Bad Bot Report. Bot traffic exceeded human traffic; 37% bad bots and 14% good bots. |
| [S45] | https://www.potaroo.net/ietf/ids/draft-dhir-http-agent-profile-00.txt | Draft HTTP Agent Profile. HTTP Message Signatures, human lane, and HTTP 402 access for agent traffic. |
| [S46] | https://www.humansecurity.com/newsroom/2026-state-of-ai-traffic-cyberthreat-benchmark-report/ | HUMAN Security 2026 benchmark release. Automated traffic growing faster than human traffic; AI-driven traffic up 187% from January to December 2025. |
| [S47] | https://arxiv.org/html/2505.02279v1 | Ehtesham et al., "A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, and ANP." Compares interaction modes, discovery, communication, and security; proposes phased adoption from MCP to ANP. |
| [S48] | https://arxiv.org/html/2601.05293v1 | "A Survey of Agentic AI and Cybersecurity: Challenges, Opportunities and Use-case Prototypes." Covers dual-use cybersecurity implications, governance gaps, collusion, cascading failures, oversight evasion, and memory poisoning. |
| [S49] | https://dl.acm.org/doi/10.1145/3716628 | ACM Computing Surveys, "AI Agents Under Threat: A Survey of Key Security Challenges and Future Pathways." Identifies knowledge gaps: multi-step inputs, internal execution complexity, variable environments, and untrusted external interactions. |
| [S50] | https://cloudsecurityalliance.org/blog/2025/02/06/agentic-ai-threat-modeling-framework-maestro | Cloud Security Alliance MAESTRO threat modeling framework. Multi-layer agentic AI threat modeling with continuous monitoring and adaptation. |
| [S51] | https://labs.cloudsecurityalliance.org/wp-content/uploads/2026/05/CSA_research_note_cisa-agentic-ai-adoption-guide-implementation_20260519-csa-styled.pdf | CSA implementation note on Five Eyes "Careful Adoption of Agentic AI Services." Summarizes privilege, design/configuration, behavioral, structural, and accountability risks. |
| [S52] | https://www.technologyreview.com/2026/02/04/1131014/from-guardrails-to-governance-a-ceos-guide-for-securing-agentic-systems/ | MIT Technology Review CEO guide. Treat agents as powerful semi-autonomous users and enforce controls at identity, tools, data, and output boundaries. |
| [S53] | https://www.workato.com/the-connector/hbr-enterprise-ai-trust-gap/ | Workato summary of Harvard Business Review Analytic Services research with AWS and Workato. Reports low full trust in autonomous agents, high investment intent, infrastructure/data readiness concerns, and enterprise orchestration interest. |

## Notes on unavailable or substituted sources

- Firecrawl was installed but could not authenticate in unattended automation. The browser login flow was started and then stopped by PID when it waited for external authentication.
- A specific "Harvard policy review on the agentic web" page matching every quoted claim in the prompt was not located in the available search results. The report uses Harvard LIL's APTT post for the policy/protocol framing and supplements bot-traffic claims with Malwarebytes/Imperva, SecurityWeek, HUMAN Security, and the HTTP Agent Profile draft [S20], [S44], [S45], [S46].
- Paywalled or inaccessible sources are not quoted as primary evidence. When search snippets were used, the citation points to the source page and the limitation is called out in the relevant section.
