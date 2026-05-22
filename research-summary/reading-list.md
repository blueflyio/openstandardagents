# Reading List and Source IDs

Prepared on May 22, 2026. Source IDs are used throughout the research-summary folder as tether IDs for claims.

## First-party OSSA and DUADP sources

| ID | Source | URL | Notes |
| --- | --- | --- | --- |
| S01 | OSSA homepage | https://openstandardagents.org/ | OSSA positioning as a portable agent contract layer; MCP/A2A/ANP/ACP relationship; trust tiers; npm and platform status. |
| S02 | DUADP homepage | https://duadp.org/ | DUADP positioning as federated discovery, DNS/WebFinger/gossip, DID identity, GAID resolution, MCP tools. |
| S03 | npm: @bluefly/openstandardagents | https://www.npmjs.com/package/@bluefly/openstandardagents | Package metadata, v0.5.1, published Mar 28, 2026, Apache-2.0, CLI/SDK/export capabilities. |
| S04 | npm: @bluefly/duadp | https://www.npmjs.com/package/@bluefly/duadp | Package metadata, v0.1.4, published Mar 9, 2026, TypeScript SDK, client/server/crypto/DID/conformance exports. |
| S05 | Local repository README | ../README.md | In-repo OSSA/DUADP architecture, v0.5.1 changelog notes, identity/discovery/execution stack. |
| S06 | Local UADP spec | ../spec/uadp/README.md | Draft UADP node conformance, well-known endpoint, resources, federation and trust tiers. |

## Academic, university, and policy sources

| ID | Source | URL | Notes |
| --- | --- | --- | --- |
| S07 | Cornell eCornell Agentic AI Architecture | https://online.cornell.edu/certificates/ai/agentic-ai-architecture/ | LLM fundamentals, RAG, agent tools/memory, MCP, multi-agent workflows, governance, risk, security, oversight. |
| S08 | Harvard Library Innovation Lab, Agent Protocols Tech Tree | https://lil.law.harvard.edu/blog/2026/02/23/agent-protocols-tech-tree/ | Open protocols as rough consensus/running code; protocols as architecture for shaping agent behavior. |
| S09 | MIT 2025 AI Agent Index | https://aiagentindex.mit.edu/ | 30-agent index, rapid deployment, autonomy split, transparency gaps, web conduct gaps, MCP support. |
| S10 | MIT Sloan action items for AI decision makers in 2026 | https://mitsloan.mit.edu/ideas-made-to-matter/action-items-ai-decision-makers-2026 | Agentic AI not ready for prime time due to hallucinations and prompt injection; five-year transaction forecast. |
| S11 | Harvard JOLT, On the Institutional Origins of the Agentic Web | https://jolt.law.harvard.edu/digest/on-the-institutional-origins-of-the-agentic-web | Know Your Agent concepts: identity, principal-agent linkage, delegated authority, auditability. |
| S12 | Harvard Business Review, How Much Supervision Should Companies Give AI Agents? | https://hbr.org/2025/01/how-much-supervision-should-companies-give-ai-agents | Autonomy should be calibrated to risk understanding; excessive autonomy can harm reputation and finances. |
| S13 | arXiv survey of agent interoperability protocols | https://arxiv.org/html/2505.02279 | Comparative survey of MCP, ACP, A2A, and ANP. |
| S14 | arXiv security threat modeling for MCP, A2A, Agora, ANP | https://arxiv.org/abs/2602.11327v1 | Protocol-centric risk surfaces and lack of standardized threat modeling. |
| S15 | arXiv governance architecture for autonomous agent systems | https://arxiv.org/html/2603.07191 | Layered Governance Architecture: sandboxing, intent verification, zero-trust inter-agent auth, immutable audit logs. |
| S16 | arXiv layered security framework for agentic AI | https://arxiv.org/html/2604.23338v1 | Seven-layer attack surface model; long-term memory poisoning, supply-chain compromise, collusion. |

## Protocol and standards sources

| ID | Source | URL | Notes |
| --- | --- | --- | --- |
| S17 | Anthropic MCP announcement | https://www.anthropic.com/news/model-context-protocol | MCP as an open standard for secure two-way connections between AI apps and data/tool servers. |
| S18 | Google A2A launch | https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ | A2A open protocol, HTTP/SSE/JSON-RPC, Agent Cards, 50+ launch partners, secure inter-agent coordination. |
| S19 | Google Cloud A2A v0.3 toolkit announcement | https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade | A2A v0.3, gRPC, signed security cards, Python SDK, 150+ organizations. |
| S20 | A2A GitHub metadata | https://github.com/a2aproject/A2A | Apache-2.0, v1.0.0 release Mar 12, 2026, 23,914 stars on May 22, 2026. |
| S21 | AG-UI docs | https://docs.ag-ui.com/introduction | Open, lightweight, event-based protocol for agent-user interaction over HTTP/WebSockets. |
| S22 | AG-UI GitHub metadata | https://github.com/ag-ui-protocol/ag-ui | MIT, 13,742 stars on May 22, 2026. |
| S23 | IBM Agent Communication Protocol | https://research.ibm.com/projects/agent-communication-protocol | ACP as lightweight HTTP-native REST/SSE messaging; merged into A2A under Linux Foundation. |
| S24 | LangChain Agent Protocol README | https://raw.githubusercontent.com/langchain-ai/agent-protocol/main/README.md | Framework-agnostic APIs for runs, threads, store, agents introspection, streaming. |
| S25 | ANP README | https://raw.githubusercontent.com/agent-network-protocol/AgentNetworkProtocol/main/README.md | ANP as the HTTP of the Agentic Web; DID identity, meta-protocol negotiation, application protocol layer. |
| S26 | monday.com Agent Tool Protocol | https://github.com/mondaycom/agent-tool-protocol | ATP code-first protocol for sandboxed TypeScript/JavaScript execution, provenance, OpenAPI/MCP compatibility. |

## Framework and repository sources

| ID | Source | URL | Notes |
| --- | --- | --- | --- |
| S27 | OpenAI Agents SDK docs | https://openai.github.io/openai-agents-python/ | Agents, handoffs, guardrails, tracing, MCP tools, sessions, human-in-the-loop. |
| S28 | OpenAI Agents SDK GitHub metadata | https://github.com/openai/openai-agents-python | MIT, v0.17.3, 26,569 stars on May 22, 2026. |
| S29 | LangGraph Graph API docs | https://docs.langchain.com/oss/python/langgraph/graph-api | State, nodes, edges, message passing, super-steps. |
| S30 | LangGraph GitHub metadata | https://github.com/langchain-ai/langgraph | MIT, v1.2.1, 32,684 stars on May 22, 2026. |
| S31 | CrewAI GitHub metadata | https://github.com/CrewAIInc/CrewAI | MIT, v1.14.5, 51,947 stars on May 22, 2026. |
| S32 | AutoGen GitHub metadata | https://github.com/microsoft/autogen | Maintenance mode; code MIT, docs CC-BY-4.0; 58,285 stars on May 22, 2026. |
| S33 | LlamaIndex GitHub metadata | https://github.com/run-llama/llama_index/ | MIT, v0.14.22, 49,581 stars on May 22, 2026. |
| S34 | LlamaIndex Workflows docs | https://developers.llamaindex.ai/python/llamaagents/workflows/ | Event-driven workflows, RAG, ReAct/function-calling agents, routing and parallel steps. |
| S35 | Parlay GitHub | https://github.com/sh4shv4t/Parlay | Early OpenEnv/MCP-ready multi-agent RL negotiation environment. |
| S36 | GitLab Duo Agent Platform GA | https://about.gitlab.com/blog/gitlab-duo-agent-platform-is-generally-available/ | Foundational/custom/external agents, AI Catalog, Claude Code and Codex integration. |
| S37 | GitLab AI Catalog docs | https://docs.gitlab.com/18.8/user/duo_agent_platform/ai_catalog/ | Central list of agents and flows; versioning and enablement. |
| S38 | GitLab external agents docs | https://docs.gitlab.com/user/duo_agent_platform/agents/third_party/ | Claude Code and Codex external agents with GitLab-managed credentials. |

## Industry blogs and security sources

| ID | Source | URL | Notes |
| --- | --- | --- | --- |
| S39 | 47Billion, AI Agents in Production | https://47billion.com/blog/ai-agents-in-production-frameworks-protocols-and-what-actually-works-in-2026/ | Production readiness, MCP/A2A/AG-UI, reliability playbooks, rollout and cost advice. |
| S40 | Ruh.ai, AI Agent Protocols 2026 Guide | https://www.ruh.ai/blogs/ai-agent-protocols-2026-complete-guide | MCP/A2A/ACP guide, Gartner 40% enterprise app forecast, protocol selection. |
| S41 | Gravitee State of AI Agent Security 2026 | https://www.gravitee.io/blog/state-of-ai-agent-security-2026-report-when-adoption-outpaces-control | 900+ respondents; 81% past planning, 14.4% full approval, 88% incidents, 21.9% independent identities. |
| S42 | NIST/NCCoE concept paper | https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd | Agent identity, authentication, authorization, auditing, prompt injection mitigation. |
| S43 | OWASP LLM06:2025 Excessive Agency | https://genai.owasp.org/llmrisk/llm06-sensitive-information-disclosure/ | Prompt injection, hallucination, excessive permission/autonomy, least privilege and human approval. |
| S44 | OWASP Top 10 for Agentic Applications | https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/ | Agent-specific risks: goal hijack, tool misuse, identity abuse, supply chain, memory poisoning. |
| S45 | DEV Community production security guide | https://dev.to/theaniketgiri/building-production-ready-ai-agents-a-complete-security-guide-2026-4d01 | Prompt injection, excessive permissions, hallucinated actions, cryptographic/action verification. |
| S46 | DEV Community agent authorization guide | https://dev.to/pockit_tools/ai-agent-authentication-authorization-how-to-secure-tool-calls-oauth-scopes-and-permissions-in-32ed | Runtime authorization gateway, OAuth 2.1 delegated access, scoped credentials. |
| S47 | Imperva Bad Bot Report 2026 | https://www.imperva.com/blog/bad-bot-report-2026-bots-agentic-age/ | Bots 53% of 2025 web traffic; agents as new internet participants. |
| S48 | Cisco agentic AI network traffic report | https://blogs.cisco.com/sp/the-impact-of-ai-on-wide-area-network-traffic-we-need-to-talk | AI inference forecast at 25% of network traffic by 2035; machine-speed traffic implications. |
