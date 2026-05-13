# Academia, Education, and Policy Research

Prepared: 2026-05-13.

## Cornell: agentic AI as an architecture discipline

Cornell's eCornell Agentic AI Architecture certificate is a useful signal that agentic AI is being packaged as an applied engineering discipline, not only a research topic. The curriculum moves from LLM mechanics, prompting, context engineering, hallucination awareness, and RAG into agents with tools, memory, routing, parallelization, orchestrator-worker designs, reflection loops, protocols, and MCP [S10].

The final course block emphasizes strategy, governance, ethics, risk, security, and human oversight. This matters because Cornell frames production agent design as a combination of implementation skill and organizational judgment: when to use autonomous AI, how to ground it in trusted data, how to reduce hallucinations, and how to design responsible oversight [S10].

## Harvard: protocols as the architecture of the agentic web

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT) maps agent standards as a "tech tree" from model-building standards to tool use, agent loops, context management, inter-agent coordination, registries, identity, bot authentication, commerce, payments, signed intent mandates, and audit traces [S11, S12].

The key Harvard claim is that open protocols reveal what builder communities care about and must agree on. The blog compares the moment to the early internet, where TCP/IP, SMTP, DNS, FTP, HTTP, and SSL were shaped by "rough consensus and running code" rather than centralized command [S11]. That framing is highly relevant to agents because the recipe for an agent -- model, loop, tools -- is simple and widely reproducible, making protocol-level architecture more important than vendor-specific policy [S11].

The APTT itself is explicit that it is a work in progress rather than an authoritative standards body. It is still valuable as a map of emerging layers: MCP, standard tools, AGENTS.md, llms.txt, agent skills, registries, AgentCard, A2A, agent identity, web bot auth, AP2, signed intent mandates, and audit traces [S12].

## MIT: deployment is accelerating, but transparency is lagging

MIT's 2025 AI Agent Index documents 30 agentic systems across six categories using public information only. Its core findings are stark: 24 of 30 agents were released or received major agentic updates during 2024-2025, autonomy levels are rising, and safety disclosure lags product capability disclosure [S13].

MIT reports that among 13 agents with frontier autonomy levels, only four disclose any agentic safety evaluations. It also reports that 25 of 30 disclose no internal safety results and 23 of 30 have no third-party testing information [S13]. The index further notes that web conduct standards remain unsettled; browser-based agents often ignore robots.txt or are designed to bypass anti-bot systems, while only one indexed agent uses cryptographic request signing [S13].

MIT Sloan's 2026 decision-maker guidance adds a management view. Davenport and Bean argue that agentic AI is not ready for broad prime-time deployment because hallucinations, mistakes, and prompt injection make autonomous action risky. They nevertheless expect AI agents to handle most transactions in many large-scale business processes within five years, while recommending reusable use cases, internal test capability, and continued human-in-the-loop guardrails [S14].

## Harvard Kennedy School and the agentic web policy lens

The HKS Student Policy Review essay frames autonomous agents as an "agentic web" where bots increasingly interact and coordinate with each other. It notes that bots already comprise about 50% of internet traffic and argues that improved bot-bot delegation could push network activity toward super-exponential growth [S15].

The policy recommendations are infrastructure-oriented: make bot-bot communication more efficient, scale digital infrastructure, and develop stronger ways to distinguish human activity from automated traffic. The essay highlights that traditional CAPTCHAs are increasingly weak against frontier AI and suggests next-generation proof-of-personhood credentials, secure hardware authentication, or decentralized reputation systems [S15].

## HBR and management governance

Harvard Business Review's public summaries focus on autonomy, trust, and supervision. "How Much Supervision Should Companies Give AI Agents?" argues that the right level of autonomy depends not only on the size of risk, but also on how well the organization understands that risk [S16]. "Can AI Agents Be Trusted?" defines agents as software layered on LLMs that can collect data, decide, act, adapt, interact with systems, and follow priorities set by a human principal [S17].

Limitation: only public summaries were available from HBR during this research pass, so those findings should be treated as directional rather than a full article review [S16, S17].

## Recent academic surveys

The May 2025 arXiv survey of agent interoperability protocols compares MCP, ACP, A2A, and ANP. Its thesis is that LLM-powered agents need standardized protocols to integrate tools, share context, discover capabilities, and coordinate tasks across heterogeneous systems. It positions MCP as JSON-RPC client-server tool/context access, ACP as RESTful multimodal messaging, A2A as Agent Card-based peer task delegation, and ANP as decentralized discovery and collaboration using W3C DIDs and JSON-LD graphs [S18].

"From Prompt Injections to Protocol Exploits" gives a security taxonomy across input manipulation, model compromise, system/privacy attacks, and protocol vulnerabilities. It argues that plugins, connectors, and inter-agent protocols have outpaced security practices and catalogs more than 30 attack techniques across host-to-tool and agent-to-agent communications [S19].

"From Secure Agentic AI to Secure Agentic Web" focuses on the transition from single-agent security to ecosystem security. It groups threats into prompt abuse, environment injection, memory attacks, toolchain abuse, model tampering, and agent network attacks, then maps defenses such as prompt hardening, tool control, runtime monitoring, continuous red-teaming, and protocol security [S20].

## Academic implications for builders

- Education is converging around a full stack: LLM fundamentals, RAG, tools, memory, agent protocols, governance, and security [S10].
- Protocols are now a research object and a governance object, not just engineering plumbing [S11, S12, S18].
- Safety evidence is not keeping pace with autonomy evidence [S13].
- The web conduct layer is unresolved: robots.txt, CAPTCHA, request signing, web bot authentication, and proof-of-personhood are all active concerns [S13, S15].
- Security research increasingly treats protocols and tool ecosystems as attack surfaces equivalent to supply chains [S19, S20].
