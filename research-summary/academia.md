# Academic Research and Education

As of 2026-05-21.

## Cornell and eCornell

eCornell's agentic AI education appears to be moving from model fundamentals toward production architecture. The RAG course teaches retrieval-augmented generation for proprietary knowledge, Text-to-SQL, GraphRAG, and production-ready RAG applications that ground answers in trusted data and reduce hallucinations [S33]. The enterprise-ready workshop is more operational: it emphasizes LangGraph state machines, small named nodes, human approval gates, OWASP LLM Top 10 threat modeling, RAG architecture patterns, permission gates, monitoring, and stop/escalate rules [S34]. Search metadata for the Agentic AI Architecture certificate describes a broader pathway from LLM fundamentals through RAG, multi-agent workflows, agentic protocols, and governance/risk/security [S34].

The educational pattern is important: universities are no longer teaching agents as only prompt engineering. They are teaching orchestration, state, controls, auditability, and risk as part of agent architecture [S33][S34].

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard's Library Innovation Lab launched the Agent Protocols Tech Tree for a 2026-02-09 Berkman Klein workshop on protocols in the agents ecosystem [S32]. Its central claim is that open protocols are an x-ray of builder consensus: they reveal what communities agree on, what is already solved, and what is likely next. The article explicitly compares agent protocol formation to early internet standards such as TCP/IP, DNS, SMTP, FTP, HTTP, and SSL [S32].

The Harvard post also argues that agents are hard to regulate centrally because an agent can be as simple as a model, a control loop, and tools. That makes protocol design a key governance lever: protocols shape which agents are easy to build and therefore can steer the ecosystem toward safer behavior [S32].

Harvard Journal of Law and Technology coverage of the agentic web frames governance as a choice between proprietary platform rules and open protocols for portable identity, verifiable delegation, and accountable behavior. Related HAP and permission-manifest proposals respond to bot traffic and agent traffic by using cryptographic authentication and site-declared rules for agent access [S37].

## MIT AI Agent Index

The 2025 MIT AI Agent Index tracks 30 prominent AI agents across product, accountability, technical capabilities, autonomy, ecosystem interaction, and safety [S30]. Key findings from the index and search metadata:

- 24 of 30 indexed agents launched or received major agentic updates in 2024-2025 [S30].
- Frontier autonomy systems disclose little about safety; search metadata reports only 4 of 13 high-autonomy agents disclose agentic safety evaluations [S30].
- The ServiceNow entry shows how enterprise agents can be configured by users at low autonomy while deployed agents operate at higher autonomy with approval and logging surfaces [S30].
- Web conduct remains underspecified. The index records no established web-conduct standards and often finds no clear technical identification for agent traffic [S30].

The index's practical contribution is methodological. It asks the right audit questions: who built the agent, what legal entity is accountable, what data and actions are exposed, how autonomous it is, how users stop it, what monitoring exists, what safety evaluations are disclosed, and how it identifies itself online [S30].

## MIT Sloan guidance for 2026

MIT Sloan's 2026 decision-maker guidance says agentic AI is not ready for prime time yet because hallucinations, mistakes, and prompt-injection hijacking have slowed adoption [S31]. The guidance expects companies to keep humans in the loop for guardrails, which reduces the productivity advantage promised by fully autonomous agents [S31]. Yet Davenport and Bean predict that agents will handle most transactions in many large-scale business processes within five years [S31].

This is a useful planning posture: build internal capabilities and reusable use cases now, but keep high-impact agent decisions behind controls until evaluation, identity, and security practices mature [S31].

## Other academic and research sources

A 2025 arXiv survey compares MCP, ACP, A2A, and ANP and describes a phased roadmap: MCP for tool access, ACP for structured multimodal messaging and session-aware interactions, A2A for collaborative task execution, and ANP for decentralized marketplaces [S35]. It stresses that ad-hoc integrations are hard to scale and secure, while protocol-level standards can provide common discovery, communication, and security models [S35].

A 2026 arXiv threat-modeling paper studies MCP, A2A, ANP, and Agora. It identifies twelve protocol-level risks across creation, operation, and update phases, with design-induced risks around trust boundaries, identity/authorization binding, cross-protocol composition, and missing mandatory validation or attestation for executable components [S36].

ACM and related research search results emphasize the same gaps: prompt injection, protocol exploits, weak validation, ad-hoc authentication, and the need for cryptographic provenance, sandboxing, dynamic trust, and continuous verification [S41]. HBR's 2025 agentic AI coverage adds organizational governance: autonomy should be tied to risk understanding, legal/security/governance teams must be involved early, and kill switches are a practical containment mechanism [S42].
