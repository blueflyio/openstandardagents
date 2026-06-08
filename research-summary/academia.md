# Academia, research centers, and policy research

_Last updated: June 8, 2026._

## Cornell University and eCornell

Cornell's Agentic AI Architecture certificate frames the educational path from LLM fundamentals to autonomous agents. The program covers LLM behavior, hallucinations, prompting, context engineering, RAG, tool-using agents, multi-agent workflows, agentic protocols, governance, security, risk, human oversight, and strategic implementation planning. [S08]

The course "Building AI Agents With Tools, Memory, and Agentic Architecture" breaks agents into model, system prompt, tools, and memory, and introduces prompt chaining, routing, parallelization, orchestrator-worker designs, reflection loops, handoffs, and MCP as a standardized tool-interface layer. This is important because it treats protocols as architecture, not just integration glue. [S08]

Cornell's enterprise-ready workshop emphasizes the gap between demos and systems that engineering, security, and audit teams can trust. It highlights explicit LangGraph state machines, small named nodes, human approval gates for high-risk actions, OWASP LLM threat modeling, RAG architecture patterns, permission gates, and monitoring. [S08]

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard's Agent Protocols Tech Tree (APTT) maps open protocols behind AI agents in an interactive "tech tree". Harvard defines an open protocol as a shared language used by multiple projects from multiple sources so that they can interoperate or compete. APTT is explicitly not a complete catalog; it is an opinionated map of widely adopted and emerging protocols that shows what builders care about, what works, and what is catching on. [S09]

The February 23, 2026 Library Innovation Lab post argues that agents resemble the early internet: distributed, fast-moving, hard to regulate, and shaped by protocols. The post says protocols are important because they define the tools agents use, what builders can create, and which agent behaviors become easier or harder to build. [S09]

Harvard Journal of Law & Technology's "Institutional Origins of the Agentic Web" focuses on agent identity and accountability. It argues that the question is not whether agents should identify themselves but how: through proprietary platform mechanisms or portable, protocol-based credentials. It introduces Know Your Agent (KYA) as agent identity, principal-agent linkage, delegation parameters, and auditability. [S34]

## MIT

MIT's 2025 AI Agent Index documents 30 prominent deployed agentic AI systems across product overview, company/accountability, technical capabilities, autonomy/control, ecosystem interaction, and safety/evaluation. It reports release acceleration, rising autonomy, transparency gaps, and no established standards for agent web conduct. [S10]

The Agent Index highlights specific transparency numbers: of 13 high-autonomy agents, only 4 disclosed agentic safety evaluations; 25 of 30 agents disclosed no internal safety results; 23 of 30 had no third-party testing information; 16 of 30 had no clear statement about robots.txt, CAPTCHA handling, or web access methods; and only ChatGPT Agent used cryptographic request signing among the agents noted in the further-details page. [S10]

MIT Sloan's 2026 guidance says agentic AI is not ready for prime time because hallucinations, mistakes, prompt injection, and hijacking risks slow adoption and require human-in-the-loop guardrails. Davenport and Bean still predict that agents will handle most transactions in many large-scale business processes within five years, but the near-term recommendation is secure-by-design governance and realistic expectations. [S11]

MIT Sloan's broader explainer emphasizes unglamorous operational work: data engineering, stakeholder alignment, governance, workflow integration, regulatory controls, guardrails for prompt/model drift, clear KPIs, permission-based systems, and accountability for agent actions. [S11]

## Other academic and policy work

The ACM Europe Technology Policy Committee policy brief describes agentic AI as autonomous systems capable of perceiving, reasoning, learning, and acting, and argues that the EU AI Act only partially addresses the systemic risks of multi-agent autonomy. It recommends multi-agent risk assessment, cybersecurity audits, cyber-resilience testing, and stronger oversight for high-stakes autonomous decisions. [S35]

The Berkeley Center for Long-Term Cybersecurity Agentic AI Risk-Management Standards Profile extends NIST AI RMF for systems that reason and autonomously pursue goals through tools and environments. It emphasizes autonomy, authority, tool access, environment, interaction effects, privilege escalation, resource acquisition, self-replication, resistance to shutdown, AI supply chain transparency, and system-level governance. [S35]

GovTech Singapore's Agentic Risk and Capability (ARC) Framework provides a capability taxonomy, risk register, and control mappings for agentic systems. It reports 46 risks and 88 controls and positions itself against NIST AI RMF, EU AI Act, OWASP Agentic AI, Google SAIF 2.0, CSA MAESTRO, and other governance frameworks. [S35]

Recent arXiv work on MCP security treats MCP as a unified, bidirectional, dynamic discovery protocol between AI models and external tools/resources. One 2025 study models the MCP server lifecycle across creation, deployment, operation, and maintenance, and identifies 16 threat scenarios across malicious developers, external attackers, malicious users, and security flaws. A 2026 threat-modeling paper focuses on prompt injection with tool poisoning, especially client-side vulnerabilities where malicious instructions in tool descriptions or responses enter the model context. [S31]

## Implications for OSSA and DUADP

University and policy sources converge on the need for identity, transparency, governance metadata, and runtime controls. OSSA's contract model and DUADP's discovery/trust model directly address these gaps by standardizing manifest identity, capabilities, signatures, trust tiers, discovery endpoints, and policy-aware federation. They do not eliminate hallucinations or prompt injection, but they make agent identity, allowed capabilities, and provenance explicit enough for enforcement systems to act on. [S01] [S02] [S03] [S04] [S05]
