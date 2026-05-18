# Academia and Policy Research

Research snapshot compiled on May 18, 2026.

## Cornell

Cornell's eCornell Agentic AI Architecture certificate is a useful education signal because it packages the agent stack as an end-to-end production curriculum rather than as isolated prompt engineering. The program moves from LLM fundamentals and hallucination mitigation to RAG, tool use, memory, agentic protocols, multi-agent workflows, and finally governance, risk, security, ethics, and human oversight [R20].

The Cornell course sequence explicitly bridges "AI that chats" to "AI that acts." Its agent course covers models, system prompts, tools, memory, prompt chaining, routing, parallelization, orchestrator-worker designs, reflection loops, inter-agent handoffs, and MCP as a standardized tool interface [R20]. Its RAG course emphasizes grounding models in private and current data, including Text-to-SQL and GraphRAG, to reduce hallucinations [R20].

The program's final strategy/governance course is important because it frames agentic AI as an organizational risk system. It asks learners to evaluate opportunities through impact, feasibility, ethics, error cost, governance, security, and oversight, rather than treating technical autonomy as sufficient for deployment [R20].

## Harvard

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT) frames open protocols as the "x-ray" of the emerging agent ecosystem: they reveal what builders agree on, what problems are forcing coordination, and what may come next [R21]. The blog explicitly compares agent protocols with early internet standards such as TCP/IP, SMTP, DNS, FTP, HTTP, and SSL, which emerged through rough consensus and running code rather than centralized command [R21].

The APTT article argues that AI agents are hard to regulate because the ingredients are simple: an LLM, a control loop, and tools. Since agent construction is distributed and easy to reproduce, protocols become a key way to shape behavior by making some agent capabilities easier to build and others harder or more constrained [R21].

Harvard Journal of Law and Technology's agentic web essay focuses on institutional design. It uses the Amazon-Perplexity Comet dispute to show the unresolved question of whether agent action online will be governed by platform-specific permission systems or by interoperable credentials, delegation, and accountability protocols [R27]. The essay argues for "Know Your Agent" style standards covering identity, principal-agent linkage, delegation parameters, and auditability [R27].

## MIT

The MIT AI Agent Index is one of the most concrete transparency datasets in this research set. Its 2025 edition indexes 30 agentic systems across 45 fields, using public documentation, demos, governance materials, and company engagement. It spans chat, browser, and enterprise agents [R22] [R23].

Key MIT findings:

- 24 of 30 indexed agents were released or received major agentic feature updates in 2024-2025 [R23].
- Browser agents operate at autonomy levels L4-L5 with limited mid-execution intervention, while enterprise agents often move from L1-L2 during design to L3-L5 after deployment [R23].
- Of 13 agents with frontier levels of autonomy, only 4 disclose any agentic safety evaluations [R23].
- 25 of 30 disclose no internal safety results, and 23 of 30 disclose no third-party testing information [R23].
- Web conduct standards remain unsettled; browser agents often ignore robots.txt, and only one indexed agent used cryptographic request signing [R23].

MIT Sloan's 2026 guidance is more cautionary. Davenport and Bean write that agentic AI is not yet ready for prime time because hallucinations, mistakes, and prompt injection have slowed adoption and require human-in-the-loop guardrails. They still expect agents to handle most transactions in many large-scale business processes within five years, so their recommendation is not to ignore agents but to build internal capability, reusable use cases, and enterprise AI foundations now [R24].

MIT CISR's active research project on decision rights and autonomy addresses a missing management layer: which decisions agents should make, when humans should retain decision rights, and which governance practices constrain risk while enabling learning and scale [R25]. This aligns with the broader conclusion that agent maturity is as much about organizational design as model capability.

## Harvard Business Review and management literature

HBR's public summary of "Can AI Agents Be Trusted?" defines agents as an added programming layer over LLMs that can collect data, decide, act, adapt behavior, interact with systems, and work toward goals set by a principal [R26]. The publicly available text is limited, so this report treats HBR as a management framing source rather than as a source for detailed technical controls.

The recurring management theme across HBR, MIT Sloan, MIT CISR, and Cornell is that agentic AI creates a supervision problem: too little autonomy collapses value back into basic automation, while too much autonomy creates brand, legal, financial, safety, and security exposure [R20] [R24] [R25] [R26].

## Academic protocol surveys

Ehtesham et al.'s arXiv survey compares MCP, ACP, A2A, and ANP across interaction modes, discovery mechanisms, communication patterns, and security models. It proposes a phased adoption roadmap: MCP for tool access, ACP for structured multimodal messaging and session-aware interaction, A2A for collaborative task execution, and ANP for decentralized agent marketplaces [R29].

The survey's most important conclusion for standards work is that protocol interoperability is not a single feature. It spans context standardization for LLMs, communication between heterogeneous agents, collaboration standards for capability negotiation and task coordination, and internet-native decentralized identity for agents [R29].

## Academic security research

Schroeder de Witt et al. introduce "multi-agent security" as a distinct field. Their argument is that multi-agent systems are non-compositional: individually safe agents can compose into unsafe systems through collusion, coordinated attacks, cascading failures, information asymmetries, shared state, and network effects [R30].

Ferrag et al. provide a unified threat taxonomy for LLM-powered agent workflows that bridges prompt injection and protocol-layer exploits. They catalog more than 30 attack techniques across input manipulation, model compromise, system/privacy attacks, and protocol vulnerabilities, including attacks affecting MCP, ACP, ANP, and A2A [R31].

## Implications

Academic and education sources converge on four practical implications:

1. Agents need explicit autonomy levels and decision-right boundaries before deployment [R23] [R25].
2. RAG, tool calling, memory, and multi-agent workflows are now mainstream skills, not fringe research topics [R20].
3. Protocols are the primary governance leverage point when agent construction is decentralized [R21] [R29].
4. Security must be studied at the system-of-agents level, not only at the model or single-agent level [R30] [R31].
