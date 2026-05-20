# Academia, Research, and Education

Prepared: 2026-05-20

## Cornell and eCornell

Cornell's eCornell Agentic AI Architecture certificate is a useful education snapshot because it shows what universities consider production-relevant agentic AI skills in 2026. The program moves from LLM fundamentals and prompt engineering to context engineering with RAG, tool-using agents, multi-agent workflows, Model Context Protocol, and finally governance, risk, security, ethics, and human oversight [S13].

The curriculum emphasizes practical reliability concerns rather than treating agents as magic. Course descriptions explicitly mention why LLMs hallucinate, how RAG gives models access to private and current data, and how advanced RAG variants such as Text-to-SQL and GraphRAG can improve accuracy and reduce errors [S13].

The agent course frames agents as LLMs equipped with tools, memory, and reasoning capabilities. It covers prompt chaining, routing, parallelization, orchestrator-worker designs, reflection loops, inter-agent protocols, handoffs, and MCP as a standardized tool interface. This confirms that agent education is now blending software architecture, retrieval, protocol literacy, and governance rather than focusing only on prompting [S13].

## Harvard: Agent Protocols Tech Tree

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT), launched in February 2026, frames open protocols as an "x-ray" of the emerging agent ecosystem: protocols reveal what builders agree on, what is already working, and what is likely to come next [S23].

The APTT argument is important for governance. It states that AI agents are easy to recreate because they can be described as a model, a control loop, and tools. That makes centralized regulation difficult and makes protocols a practical lever for shaping what kinds of agents are easiest to build [S23].

APTT deliberately draws a comparison with early internet protocols such as TCP/IP, SMTP, DNS, FTP, HTTP, and SSL. The lesson is that open protocols are not just technical plumbing; they allocate power and create incentives for interoperability [S23].

## Harvard: Agentic web governance

Harvard Journal of Law and Technology's "On the Institutional Origins of the Agentic Web" frames the agentic web as a governance choice between proprietary platform rules and open protocols that enable portable identity, verifiable delegation, and accountable behavior [S24].

The Amazon-Perplexity conflict is used as a case study. The article argues that transparent agent identification is non-negotiable, but that authority does not have to remain locked inside platforms. Delegation should govern on whose behalf an agent acts, while platform permission governs where it may act [S24].

The article also highlights "Know Your Agent" standards. A minimum KYA model would include agent identity, principal-agent linkage, delegation scope, revocability, auditability, and behavioral record keeping. This matches the direction of NIST/NCCoE, OSSA/DUADP, and identity-first security guidance [S21][S24].

## MIT AI Agent Index

MIT's 2025 AI Agent Index provides an empirical baseline for real-world agent products. It documents 30 agentic systems across 45 annotation fields and six categories, based on public documentation, websites, demos, published papers, governance documents, and developer correspondence [S07][S14].

The key findings are cautionary:

- 24 of 30 agents were released or received major agentic updates in 2024-2025.
- Browser agents operate at L4-L5 autonomy with limited mid-execution intervention.
- Enterprise agents can move from L1-L2 during design to L3-L5 after deployment.
- Only 4 of 13 frontier-autonomy agents disclose any agentic safety evaluations.
- 25 of 30 disclose no internal safety results, and 23 of 30 have no third-party testing information.
- Browser-agent web conduct standards remain unsettled; some agents ignore robots.txt or bypass anti-bot systems [S14].

MIT's index therefore supports two conclusions: agent autonomy is rising quickly, and transparency is not keeping pace. That makes third-party evaluation, signed behavior records, and standard disclosure artifacts more important.

## MIT Sloan guidance for 2026

MIT Sloan's 2026 decision-maker guidance says agentic AI is "not ready for prime time - yet." The cited blockers are ongoing hallucinations, mistakes, and the ease with which hackers can hijack agents through prompt injection and related methods [S08].

The same guidance expects agents to handle most transactions in many large-scale business processes within five years. Its recommended action is not to wait passively, but to identify reusable organizational use cases and build internal capacity to create and test agents [S08].

The implication is a staged adoption model: use agents where errors are reversible or supervised, keep humans in the loop for high-risk operations, and invest now in reusable infrastructure such as evaluation harnesses, policies, and identity controls.

## NIST/NCCoE research agenda

NIST/NCCoE's February 2026 concept paper, "Accelerating the Adoption of Software and Artificial Intelligence Agent Identity and Authorization," asks for feedback on a project to demonstrate how identity standards and best practices can be applied to software agents and agentic AI [S21].

NIST's framing is clear: agents promise productivity and efficiency, but giving them access to datasets, tools, and applications creates risks unless organizations apply appropriate identification and authorization controls. Requested feedback areas include use cases, unique challenges compared with traditional software, current and emerging standards, technologies, identification, authorization, auditing, non-repudiation, and prompt-injection controls [S21].

This is a major signal that agent governance is moving from generic AI risk to concrete IAM architecture.

## Academic protocol and security surveys

The 2025 arXiv survey of MCP, ACP, A2A, and ANP argues that ad-hoc integrations are difficult to scale, secure, and generalize. It classifies the four protocols by deployment context: MCP for JSON-RPC client-server tool invocation, ACP for RESTful HTTP multimodal messaging, A2A for capability-based Agent Cards and peer task delegation, and ANP for decentralized discovery and collaboration using W3C DIDs and JSON-LD graphs [S25].

The same survey recommends phased adoption: start with MCP for tool access, add ACP for structured multimodal and session-aware communication, add A2A for collaborative task execution, and extend to ANP for decentralized agent marketplaces [S25].

Recent security surveys identify autonomy-induced risks beyond classic LLM issues: memory poisoning, tool misuse, reward hacking, deferred decision hazards, irreversible tool chains, protocol vulnerabilities, and multi-agent systemic effects [S26][S27]. These risks require defenses at multiple layers: input filtering, memory lifecycle control, constrained decision-making, structured tool invocation, policy enforcement, observability, and incident response.

## Other university and publication coverage

Harvard Business Review coverage in 2025 emphasized governance readiness, supervision levels, and the organizational risks of autonomous systems. Direct access to some HBR articles was limited by paywall, so this report uses them only as contextual pointers and relies more heavily on accessible MIT, Harvard, Cornell, NIST, OWASP, and arXiv sources [S28].

ACM and arXiv research are converging on the same thesis: agents require standardized interoperability, explicit safety controls, and governance artifacts that can be inspected independently of vendor claims [S25][S26][S27].

## Research conclusions

1. Academic and education programs now treat protocols, RAG, governance, and security as core agentic AI literacy.
2. Public agent systems are becoming more autonomous faster than safety transparency is improving.
3. Governance work is shifting from abstract "responsible AI" to concrete agent identity, authorization, audit, and delegation standards.
4. Protocols are likely to shape the agentic web in the same way early internet protocols shaped web participation.
5. The central unanswered question is not whether agents can act, but how their authority, identity, and duty of care can be verified across systems.
