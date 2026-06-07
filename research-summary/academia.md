# Academia and research notes

## Cornell and eCornell

Cornell's eCornell Agentic AI Architecture certificate frames agentic AI as the move from "AI that chats" to "AI that acts." The program starts with LLM fundamentals, hallucinations, prompting, and context engineering; moves through RAG, Text-to-SQL, and GraphRAG; then teaches agents with tools, memory, multi-agent workflows, handoffs, and MCP; and ends with strategy, governance, ethics, risk, security, and human oversight [S09].

Key facts:

| Attribute | Notes |
| --- | --- |
| Program | Agentic AI Architecture certificate |
| Institution | Cornell Bowers Computing and Information Science via eCornell |
| Format | Online, 2 months, 8-10 hours per week |
| Cost | USD 3,750 |
| Next listed start | July 8, 2026 |
| Technical topics | LLMs, hallucinations, prompt/context engineering, RAG, Text-to-SQL, GraphRAG, tool agents, memory, workflows, protocols, MCP |
| Governance topics | AI opportunity evaluation, error cost, values alignment, workforce effects, governance, security, oversight |

The most relevant course for this research is "Building AI Agents With Tools, Memory, and Agentic Architecture." It identifies the practical agent components as model, system prompt, tools, and memory, and teaches architectural patterns such as prompt chaining, routing, parallelization, orchestrator-worker designs, reflection loops, protocols, handoffs, and MCP [S09].

## Harvard: protocols as architecture

Harvard's Library Innovation Lab launched the Agent Protocols Tech Tree (APTT) after a Berkman Klein Center workshop on "Towards an Internet Ecosystem for Sane Autonomous Agents" [S10][S11]. Its core claim is that protocols reveal what builder communities are forced to agree on: the shared abstractions, message formats, and trust assumptions that make interoperability possible [S10].

The Harvard framing is important because it treats protocols as governance leverage. Agents are described as a distributed technique, not a centrally controllable service: an LLM, a control loop, and tools. If agents are easy to recreate and hard to regulate at a single chokepoint, then protocol design becomes one of the practical ways to shape what kinds of agents are easy or hard to build [S10].

APTT also explicitly compares the agentic moment to the early internet. Open protocols such as TCP/IP, SMTP, DNS, FTP, HTTP, and SSL shaped the internet through "rough consensus and running code." Harvard's argument is that MCP, A2A, AG-UI, payment protocols, identity protocols, and future web-conduct protocols may play a similar architectural role for the agentic web [S10].

The related Harvard Journal of Law and Technology writing on the agentic web emphasizes institutional questions: how agents identify themselves, how their principals are represented, how delegation limits are expressed, and how auditability works when bots perform high-scale actions online [S20]. The useful policy lens is "Know Your Agent" rather than only "Know Your Customer."

## MIT AI Agent Index

MIT-affiliated researchers published the 2025 AI Agent Index as a structured transparency dataset for 30 prominent deployed agents. The site summarizes 30 agents across 45 fields and 6 categories, using public sources and developer correspondence [S12][S13].

Important findings:

- Rapid deployment: 24 of 30 agents launched or received major agentic updates in 2024-2025 [S12].
- Autonomy split: chat agents tend to operate at lower autonomy levels, browser agents at Level 4-5, and enterprise agents often move from user-configured Level 1-2 designs to Level 3-5 deployment behavior [S12].
- Transparency gap: of 13 frontier-autonomy agents, only 4 disclose any agentic safety evaluations [S12].
- Missing public information: 227 of 1,350 indexed fields had no public information; missingness concentrates in ecosystem interaction and safety [S12][S13].
- Safety/evaluation opacity: 25 of 30 agents disclose no internal safety results; 23 of 30 have no third-party testing information [S12][S13].
- Model concentration: most agents rely on GPT, Claude, or Gemini model families [S12].
- MCP adoption: 20 of 30 indexed agents support MCP [S12].
- Closed-source concentration: 23 of 30 are closed source at product level [S12].
- Web conduct: there are no established standards for how agents should behave on the web, and some browser agents are designed to bypass anti-bot protections or mimic human browsing [S12].

For governance, the key lesson is that model-level transparency is insufficient. Agent risks depend on tool access, autonomy level, deployment context, approval gates, browser behavior, and organization-specific controls. Those fields are often undocumented [S13].

## MIT Sloan and MIT SMR

MIT Sloan defines agentic AI as semi- or fully autonomous AI systems that perceive, reason, and act, integrating with other software systems to complete tasks independently or with minimal human supervision [S14]. The business framing is pragmatic: agent deployment requires data quality, governance, trust, security, permissions, accountability, and monitoring as a permanent operating expense, not a one-time implementation task [S14].

MIT Sloan also cites a spring 2025 MIT SMR/BCG survey where 35% of respondents had adopted AI agents and another 44% planned near-term deployment [S14]. The MIT SMR/BCG report surveyed 2,102 executives across 21 industries and 116 countries, with 76% viewing agentic AI more as a coworker than a tool [S16].

The strongest caution comes from MIT Sloan's "Action items for AI decision makers in 2026." Davenport and Bean say agentic AI is not ready for prime time because hallucinations, mistakes, prompt injection, and hijacking remain serious blockers. They still predict that agents may handle most transactions in many large-scale business processes within five years [S15].

MIT Sloan's implementation warning is useful for planning: in one 2025 clinical-agent case, about 80% of the work was not prompt engineering, but data engineering, stakeholder alignment, governance, and workflow integration [S14].

## arXiv, ACM, and technical research

The communication-security survey by Kong et al. is one of the most directly relevant academic sources. It defines agent communication as the next stage after computer, mobile, and IoT communication, then categorizes it into user-agent, agent-agent, and agent-environment communication. It reviews 19 protocols and analyzes security risks across the agent communication lifecycle [S17].

The same survey highlights risks that emerge specifically because agents communicate: privacy leakage, spoofing, bullying, denial of service, malicious tool/data interaction, and cross-organization trust failures. It also reports practical experiments against MCP and A2A to demonstrate that protocol-level attacks can cause real-world damage [S17].

The MCPShield paper by Acharya and Gupta narrows in on MCP. It reports the ecosystem scale as more than 10,000 active MCP servers, 177,000 registered tools, and 97 million monthly SDK downloads, and it notes that write/action tools grew from 27% to 65% between November 2024 and February 2026 [S18]. Its threat taxonomy spans 7 categories and 23 attack vectors across tool interface, transport, server, and composition attack surfaces [S18].

MCPShield's core research contribution is formalization. It defines properties such as tool integrity, data confinement, privilege boundedness, and context isolation, then proposes defense-in-depth across capability-based access control, cryptographic tool attestation, information-flow tracking, and runtime policy enforcement [S18].

AgentGuard addresses a related verification problem: static verification is insufficient for stochastic agent behavior, so runtime traces and probabilistic assurance become necessary [S19]. This aligns with the MIT Index finding that public safety evaluations are sparse and with Gravitee's finding that many agent actions are not monitored [S12][S48].

## HBR and MIT Press practitioner research

Harvard Business Review treats agentic AI as an organizational risk escalation. The HBR trust article defines agents as a software layer over LLMs that can collect data, decide, act, and adapt on behalf of a principal [S21]. Blackman's HBR article argues that agentic and multi-agent AI increase ethical, cyber, and operational risk beyond what most organizations' existing governance systems are built to handle [S22].

Harvard Data Science Review/MIT Press adds the enterprise redesign lens. "The Agent-Centric Enterprise" argues that 2-10x productivity gains require redesigning workflows around agents rather than adding agents on top of old processes [S23]. The HDSR decision-making article frames agents as a shift from reactive reporting to proactive monitoring, detection, and action, but stresses data readiness, governance, integration, trust, and human-in-the-loop oversight [S24].

## Cross-source synthesis

Academic and university sources agree on four points:

1. Agents are not just chatbots. They combine LLMs with tools, memory, control loops, and the ability to change digital or physical environments [S09][S14][S17].
2. Protocols matter because the ecosystem is decentralized and hard to regulate through a single gatekeeper [S10][S11].
3. Transparency remains inadequate as of the 2025 AI Agent Index, especially around safety testing, web behavior, autonomy, third-party evaluation, and agent identity [S12][S13].
4. Governance is a system design problem. It includes identity, authorization, data engineering, workflow integration, human approval, monitoring, auditability, and incident response [S14][S15][S18][S19].

## Open questions

- What minimum agent disclosure standard should be required for web conduct?
- Should agent identity be bound to a legal principal, a runtime workload, a manifest publisher, or all three?
- How should safety evaluations report autonomy and tool access rather than only model capability?
- Which protocol body, if any, will define interoperable consent and delegation semantics?
- How can agent benchmarks capture trajectory quality, not only final-answer correctness?
