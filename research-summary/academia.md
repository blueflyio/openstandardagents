# Academia, Universities, and Research Centers

Prepared on May 22, 2026. Citations use the source IDs in [reading-list.md](reading-list.md).

## Cornell and eCornell

Cornell's Agentic AI Architecture certificate is a practical curriculum that moves from LLM fundamentals to RAG, tool-using agents, multi-agent workflows, agentic protocols, and governance/security [S07]. The program emphasizes that professionals need both technical implementation skills and strategic risk judgment. It teaches why LLMs hallucinate, how context engineering and RAG reduce ungrounded output, and how private/up-to-date data can be connected through retrieval [S07].

The agent course covers the standard ingredients of agents: model, system prompt, tools, and memory. It also teaches architectural patterns such as prompt chaining, routing, parallelization, orchestrator-worker designs, and reflection loops [S07]. Importantly for this research, Cornell includes how agents communicate through protocols and handoffs, specifically naming MCP as a standardized tool interface [S07].

The governance component is not separate from the technical curriculum. Cornell frames responsible deployment around governance, risk, security, human oversight, error cost, values alignment, algorithmic fairness, and organizational trade-offs [S07]. This matches the production consensus that agent safety is an architecture problem, not only a model problem.

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard's Library Innovation Lab launched the Agent Protocols Tech Tree (APTT) on Feb 23, 2026 after a Berkman Klein Center workshop on protocols in the agent ecosystem [S08]. APTT is a visual map of open protocols supporting AI agents. It is explicitly opinionated and not authoritative, but useful as a map of what builder communities are standardizing [S08].

The core idea is that open protocols are shared languages used by multiple software projects so they can interoperate or compete [S08]. Harvard compares this to internet standards such as TCP/IP, SMTP, DNS, FTP, HTTP, and SSL, which emerged through rough consensus and running code rather than top-down enforcement [S08]. Protocols reveal what builders care about, what they have been forced to agree on, and what is likely to come next [S08].

Harvard's motivation is governance. If agents are easy to build -- an LLM, a loop, and tools -- no single government or company can fully regulate the phenomenon [S08]. Protocols shape which tools agents use and which agent behaviors become easier or harder to build. Therefore, protocols are a practical lever for steering the agent ecosystem toward human benefit [S08].

## MIT AI Agent Index

MIT's 2025 AI Agent Index documents 30 prominent AI agents across 45 fields and six categories using public information and developer correspondence [S09]. It found that 24 of 30 agents were released or received major agentic updates in 2024-2025, indicating rapid deployment [S09]. Autonomy levels differ by category: chat agents tend to be Level 1-3, browser agents Level 4-5, and enterprise agents move from lower autonomy in design to Level 3-5 when deployed [S09].

MIT's most important policy finding is the transparency gap. Of 13 agents with frontier autonomy, only 4 disclosed any agentic safety evaluations [S09]. Across the 30-agent set, 25 disclosed no internal safety results, 23 had no third-party testing information, and only 4 provided agent-specific system cards [S09]. Capability claims are more common than safety evidence [S09].

The Index also highlights unsettled web conduct. MIT found no established standards for how agents should behave on the web, and some agents are designed to bypass anti-bot protections and mimic human browsing [S09]. That gap connects directly to Harvard's protocol-governance thesis and to bot traffic concerns from Imperva and Cisco [S08][S47][S48].

## MIT Sloan guidance for 2026 decision makers

MIT Sloan's 2026 decision-maker guidance says agentic AI is not ready for prime time yet [S10]. Davenport and Bean cite ongoing hallucinations, mistakes, and the ease with which attackers can hijack agentic systems through prompt injection or related methods [S10]. Their guidance is not anti-agent; they predict agents will handle most transactions in many large-scale business processes within five years, but they recommend human-in-the-loop guardrails and internal capability building first [S10].

MIT Sloan's framing is useful for governance: agentic AI may create new ways of working, but organizations should begin with reusable use cases, enterprise-scale structures, testing, and guardrails rather than immediate high-autonomy deployment [S10].

## Harvard JOLT and the institutional origins of the agentic web

Harvard JOLT frames the agentic web as an institutional problem: who defines, polices, and audits an agent's identity and delegated authority [S11]. It warns against centralized registries becoming gatekeepers and argues for interoperable identities and credentials that travel with the agent across environments [S11].

The article introduces Know Your Agent (KYA) as an identity and accountability layer. Minimum KYA elements are agent identity via verifiable credentials, principal-agent linkage, delegation parameters describing scope and revocability, and auditability/behavioral record-keeping [S11]. This is a conceptual match for DUADP's GAID/DID/signature pipeline and NIST's identity/authorization project [S02][S42].

## Harvard Business Review

HBR's 2025 article on AI agent supervision argues that autonomy should not be calibrated only to risk size, but to how well an organization understands and can manage the risk [S12]. Too little freedom limits value; too much autonomy can damage brand, reputation, customer relationships, and financial stability [S12].

This supports a practical adoption rule: increase autonomy only when uncertainty has been reduced through sandboxing, bounded tools, evaluation, auditability, escalation, and organizational readiness. That is consistent with Cornell's governance curriculum, MIT Sloan's human-in-the-loop recommendation, and OWASP's excessive-agency mitigation advice [S07][S10][S43].

## Recent academic and preprint research

A 2025 arXiv survey compares MCP, ACP, A2A, and ANP as interoperability protocols [S13]. It characterizes MCP as JSON-RPC tool invocation and typed data exchange; ACP as RESTful HTTP messaging with synchronous/asynchronous interactions; A2A as peer-to-peer task delegation via capability-based Agent Cards; and ANP as decentralized agent discovery and secure collaboration using W3C DIDs and JSON-LD graphs [S13]. The survey proposes phased adoption: MCP for tool access, ACP for structured messaging, A2A for collaborative task execution, and ANP for decentralized marketplaces [S13].

A 2026 security threat-modeling paper argues that standardized protocol-centric risk assessment is still limited for emerging protocols such as MCP, A2A, Agora, and ANP [S14]. It identifies protocol-specific and cross-protocol risk surfaces across creation, operation, and update phases [S14]. This is important because many deployments will bridge protocols; a bridge can accidentally undermine the trust model of each side.

A 2026 governance architecture paper proposes a Layered Governance Architecture for autonomous agents: L1 execution sandboxing, L2 intent verification, L3 zero-trust inter-agent authorization, and L4 immutable audit logging [S15]. The benchmark covers prompt injection, RAG poisoning, and malicious skill plugins; intent verification caught 93.0-98.5% of certain malicious tool-call classes, while an end-to-end four-layer pipeline reported 96% interception with about 980 ms P50 latency [S15].

A 2026 layered security framework argues that agentic AI systems need a distinct model because they plan over longer horizons, maintain memory, call tools, and coordinate with peers [S16]. Its seven-layer attack surface model includes foundation, cognitive, memory, tool execution, multi-agent coordination, ecosystem, and governance layers, with temporality ranging from instantaneous attacks to cross-session cumulative attacks [S16]. The paper highlights under-studied risks such as covert agent collusion, long-term memory poisoning, MCP supply-chain compromise, and alignment failures that manifest as insider threats [S16].

## Implications

1. Education is converging on architecture. Cornell teaches agents as systems of LLMs, retrieval, tools, memory, protocols, and governance, not as prompt tricks [S07].
2. Policy research is converging on protocols. Harvard and MIT show that standards and disclosure are missing, especially for web conduct and safety evidence [S08][S09].
3. Security research is converging on external enforcement. The strongest proposals place controls at execution, identity, authorization, and audit layers outside the LLM [S15][S16].
4. OSSA and DUADP fit the gap. OSSA gives a portable contract for agent identity, tools, compliance, autonomy, and trust; DUADP gives discovery and verifiable identity that can support KYA and NIST-style controls [S01][S02][S11][S42].
