# Academic Research and Education

Research current as of 2026-06-10. Source keys refer to `reading-list.md`.

## Cornell and eCornell

eCornell's Agentic AI Architecture program frames agent education as a progression from LLM fundamentals to grounded systems, tool use, multi-agent workflows, and governance. The program explicitly covers why LLMs hallucinate, context engineering, Retrieval-Augmented Generation, private/up-to-date data access, and then agentic workflows using tools, memory, routing, parallelization, orchestrator-worker designs, reflection loops, protocols, handoffs, and MCP [S05].

The key educational signal is that “agentic AI architecture” is no longer taught as prompt writing. It is taught as systems design: state, tools, memory, retrieval, protocol boundaries, auditability, and human oversight. Cornell’s curriculum also emphasizes evaluating opportunities through governance, risk, security, responsible use, and feasibility, which mirrors the production concerns surfaced by MIT, NIST, and Gravitee [S05], [S09], [S15], [S38].

## Harvard and Berkman Klein

Harvard Library Innovation Lab's Agent Protocols Tech Tree makes an important governance argument: open protocols reveal what builders agree on, and they can shape which behaviors become easy or hard to build. The APTT is intentionally a visual “tech tree” of protocols supporting AI agents, inspired by the historical role of protocols such as TCP/IP and DNS in shaping the internet [S06].

The Berkman Klein Center workshop “Towards an Internet Ecosystem for Sane Autonomous Agents” expands this into policy and infrastructure questions. The workshop centered on how fast agents are becoming capable of planning, executing, iterating, and interacting with the outside world. It asked whether standards for agent identification and interchange should arise from industry, regulation, or new internet-style collaborations; what oversight mechanisms are needed; and what identifiers or operational-agency controls should exist [S07].

The Harvard Journal of Law and Technology commentary on the agentic web adds an institutional lens. It frames the central governance question as platform control versus open-protocol governance. It emphasizes Know Your Agent-style standards that make agents legible: architecture, capabilities, tools, action types, and identifiers that connect actions to accountable upstream actors [S08].

## MIT AI Agent Index

The 2025 AI Agent Index documents 30 prominent deployed agentic AI systems. It tracks legal, technical capabilities, autonomy and control, ecosystem interaction, evaluation, and safety fields using public information and developer correspondence [S09], [S11].

The core findings are governance-relevant:

| Finding | Why it matters |
| --- | --- |
| 24 of 30 indexed agents were released or received major agentic updates in 2024-2025 | Deployment is moving faster than governance [S09]. |
| Only 4 of 13 agents with frontier autonomy disclose any agentic safety evaluations | Safety evidence is scarce for the systems with greatest autonomy [S09]. |
| 25 of 30 disclose no internal safety results and 23 of 30 have no third-party testing information | Empirical safety evidence is mostly absent [S09]. |
| For 227 of 1,350 fields, no public information was found | Transparency gaps concentrate in ecosystem interaction and safety [S09]. |
| There are no established standards for web conduct | Websites cannot reliably distinguish legitimate agents, malicious bots, and human traffic [S09], [S11]. |

MIT Sloan's 2026 guidance is more operational. It argues that agentic AI is not ready for prime time because hallucinations and prompt-injection hijacking remain serious. At the same time, it predicts agents will handle most transactions in many large-scale business processes within five years, so organizations should build reusable internal capability and keep humans in the loop while reliability improves [S10].

## Other university, ACM, and arXiv work

The broader research literature increasingly treats agents as a systems-security and internet-infrastructure problem rather than only a model-behavior problem.

| Source | Contribution | Implication |
| --- | --- | --- |
| Agentic Web: Weaving the Next Web with AI Agents | Describes the agentic web as a shift from human-centric browsing to autonomous, agent-driven coordination; identifies intelligence, interaction, and economics as core dimensions [S12]. | Protocols and economic rules will shape whether agents act as interoperable user delegates or platform-controlled bots. |
| Systematic Survey of Security Threats and Defenses in LLM-Based AI Agents | Proposes a seven-layer attack surface: foundation, cognitive, memory, tool execution, multi-agent coordination, ecosystem, governance [S13]. | A control at one layer does not automatically defend another; prompt filters are not enough for tool or identity abuse. |
| Governance Architecture for Autonomous Agent Systems | Proposes a layered governance architecture: execution sandboxing, intent verification, zero-trust inter-agent authorization, immutable audit logging [S14]. | Secure agents require non-bypassable runtime controls around side effects. |
| Agent Network Protocol white paper | Frames agents as new internet entities and proposes identity/encrypted communication, meta-protocol negotiation, and application-layer descriptions [S21], [S22]. | Agent identity, capability discovery, and protocol negotiation are converging into an “agentic web” stack. |

## Themes across academia

1. **Transparency is the first governance gap.** The AI Agent Index shows that developers disclose capabilities far more than safety, evaluation, web conduct, or incident information [S09], [S11].
2. **Agency changes the risk class.** A hallucination in a chatbot is bad text; a hallucination in an agent can become an email, API call, payment, deployment, or data deletion [S10], [S13], [S14].
3. **Protocols are policy levers.** Harvard’s APTT and Berkman Klein workshop treat open protocols as places where default behaviors can be shaped before the ecosystem locks into proprietary designs [S06], [S07].
4. **Identity is becoming foundational.** Research and policy sources converge on the need to distinguish agents from humans, bind actions to accountable principals, and prevent unscoped or shared credentials [S08], [S15].
5. **Human oversight remains necessary.** Cornell, MIT Sloan, NIST, and security research all recommend human-in-the-loop controls for high-risk or irreversible actions [S05], [S10], [S15], [S14].

## Limitations

Some requested university-adjacent sources, such as Harvard Business Review articles, may be paywalled or partially accessible. The report therefore relies on available summaries and accessible primary pages where possible. The requested “Harvard policy review on the agentic web” appears most directly represented by the Harvard Journal of Law and Technology commentary and Berkman Klein workshop materials rather than a page with that exact title [S07], [S08].
