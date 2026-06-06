# Academic Research and Education

Date of research: 2026-06-06.

## Cornell and eCornell

Cornell's eCornell Agentic AI Architecture certificate frames agentic AI as a progression from LLM fundamentals to context engineering, RAG, tool use, memory, multi-agent workflows, agentic protocols, and governance. The certificate emphasizes why models hallucinate, how RAG can ground responses in private and current data, and how agent architectures move systems from "AI that chats" to "AI that acts." [S09]

The course "Building AI Agents With Tools, Memory, and Agentic Architecture" focuses on the agent building blocks: model, system prompt, tools, and memory. It also covers prompt chaining, routing, parallelization, orchestrator-worker designs, reflection loops, handoffs, and MCP as a standardized tool interface. [S09]

The RAG course adds production grounding patterns such as Text-to-SQL and GraphRAG. Its relevance to agentic systems is that better retrieval and structured context reduce hallucination risk before an agent acts. The enterprise-ready workshop extends the curriculum into controls: LangGraph state machines, human approval gates, OWASP LLM Top 10 threat modeling, monitoring, stop/escalate rules, and production deployment discipline. [S09]

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT) is an interactive map of open protocols for AI agents. It treats open protocols as evidence of what builder communities agree on, what has adoption, and what could shape future agent behavior. The project was created for the "Towards an Internet Ecosystem for Sane Autonomous Agents" convening at the Berkman Klein Center on 2026-02-09 and published publicly on 2026-02-23. [S10] [S11]

APTT is useful because it makes the protocol stack visible to both policy and engineering audiences. For policy readers, it shows why each layer became necessary; for technical readers, it exposes wire-level message flows. The important governance insight is that agents are simple to build but hard to regulate, so protocols become an indirect but powerful way to shape capabilities and incentives. [S10] [S11]

## MIT AI Agent Index

The 2025 AI Agent Index covers 30 prominent deployed agentic systems across categories such as product overview, company/accountability, technical capabilities, autonomy/control, ecosystem interaction, and safety/evaluation. It identifies four defining properties of agentic systems: autonomy, goal complexity, environmental interaction, and generality. [S12]

Key findings:

- Agent releases and agentic feature updates accelerated in 2024-2025; 24 of 30 indexed systems were released or received major updates in that period. [S12]
- Chat agents typically remain at autonomy levels 1-3, browser agents often operate at levels 4-5, and enterprise agents can be configured at low autonomy while deployed event-triggered agents act at higher autonomy. [S12]
- Of 13 agents with frontier autonomy, only 4 disclose any agentic safety evaluations. [S12]
- 25 of 30 disclose no internal safety results, and 23 of 30 provide no third-party testing information. [S12]
- Web conduct standards remain unsettled; many agents do not clearly document robots.txt, CAPTCHA, web access, or anti-bot behavior. [S12]

## MIT Sloan 2026 decision-maker guidance

MIT Sloan's 2026 AI guidance says agentic AI is "not ready for prime time" because hallucinations, mistakes, and prompt-injection hijacking remain serious barriers. It still predicts agents will handle most transactions in many large-scale business processes within five years, so organizations should build internal capability and reusable use cases while retaining human-in-the-loop controls. [S13]

## Other academic and research sources

The arXiv survey on LLM agent communication and MCP reviews MCP, A2A, ACP, and ANP as complementary interoperability protocols. It frames MCP as agent-to-tool communication, A2A as peer task delegation using agent capability descriptions, ACP as a REST/multipart messaging layer, and ANP as a decentralized identity/discovery layer. [S21]

The MCP security paper "Model Context Protocol (MCP): Landscape, Security Threats, and Future Research Directions" identifies four attacker classes and 16 representative threat scenarios. Its strongest warning is that MCP's tool descriptions and server lifecycle create new trust boundaries, with tool poisoning, installer spoofing, and unauthorized access among the key risks. [S17]

ACM-related security literature emphasizes that autonomous tool access changes the risk profile. "Guardians of the Agents" argues that agents with irreversible side-effect tools need static verification, runtime monitoring, strict distinction between code and data, and mechanisms to abort suspicious actions. ACM Computing Surveys' "AI Agents Under Threat" identifies four knowledge gaps: unpredictable multi-step inputs, complex internal execution, variable operational environments, and interaction with untrusted external entities. [S32] [S33]

## HBR and management research

Harvard Business Review's June 2025 article "Organizations Aren't Ready for the Risks of Agentic AI" is partly paywalled but frames agents as systems that execute series of tasks without specific step-by-step instructions. A later HBR/Workato/AWS trust-gap report, available through summaries, reports that only 6% of companies fully trust agents to autonomously run core business processes, while 86% plan to increase investment. Reported blockers include cybersecurity/privacy, output quality, unready processes, and infrastructure limitations. [S30] [S31]

## Academic takeaways

1. Education is shifting from prompt use toward architecture: RAG, memory, tools, graph workflows, protocols, governance, and oversight.
2. The research community treats interoperability protocols as layered and complementary rather than mutually exclusive.
3. Safety disclosure and web conduct lag capability growth.
4. Security work is moving from prompt-level defenses toward architecture-level controls: identity, policy, static verification, runtime mediation, and auditability.
