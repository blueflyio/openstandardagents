# Academia and research centers

Prepared on 2026-06-05. Citation keys resolve in [reading-list.md](./reading-list.md).

## Cornell and eCornell

Cornell's Agentic AI Architecture certificate is a useful education signal because it teaches the stack in the same order production teams encounter it: LLM fundamentals, prompt/context engineering, RAG, tool-using agents, memory, multi-agent workflows, protocols, and finally governance, risk, security, and human oversight [S18]. The course description explicitly moves learners from "AI that chats" to "AI that acts" by building AI agents and improving them through multi-agent workflows and agentic protocols [S18].

The curriculum names core architecture patterns that show up repeatedly in production frameworks: prompt chaining, routing, parallelization, orchestrator-worker designs, reflection loops, tools, memory, protocols, and handoffs [S18]. It also includes MCP as the standard interface for building and consuming tool interfaces, which reflects how quickly MCP has become part of the teaching baseline for agent architecture [S18], [S07].

The Cornell RAG material is important because RAG is still the most common way to make agents useful in enterprise settings without granting broad tool permissions. Cornell frames RAG as the architecture for giving AI access to proprietary, private, and current knowledge while reducing hallucinations through grounding, chunking, query transformation, GraphRAG, Text-to-SQL, and citations [S18]. That connects directly to agent safety: RAG improves factual grounding, but it also creates context-poisoning and indirect prompt-injection surfaces that need retrieval filtering and policy controls [S43].

The eCornell enterprise-ready agents workshop gives a more operational framing. It distinguishes a flashy agent demo from a system engineering teams, security reviewers, and auditors can rely on. The workshop emphasizes explicit LangGraph state machines, small named nodes, structured atomic workflows, approval gates for high-risk actions, OWASP LLM threat models, RAG architecture, monitoring, stop/escalate rules, and operational drift controls [S19]. This aligns with the broader 2026 consensus: production agent reliability depends more on state, guardrails, observability, and governance than on prompt cleverness.

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT), introduced 2026-02-23, is a policy and education artifact rather than a standards body. Its central claim is that open protocols reveal what builders have working, what they care about, and which agent behaviors become easier to build [S20], [S21]. The APTT maps layers from inference APIs through tool calling, MCP, agent-to-agent coordination, commerce, identity, and speculative future standards [S21].

The Harvard framing is useful because it explains why protocols are not just plumbing. The blog argues that agents are easy to build - essentially an LLM plus a control loop and tools - which makes them hard to regulate through traditional product-by-product mechanisms. Protocols therefore become a leverage point: they determine the default paths for interoperability, tool use, coordination, identity, and accountability [S20].

APTT also presents protocols as historically similar to TCP/IP and DNS: unglamorous but deeply consequential coordination layers that shape what the internet can become [S20]. For agentic systems, this supports investing in contract, discovery, and identity layers such as OSSA and DUADP rather than treating each framework integration as a bespoke application feature [S01], [S03], [S20].

## MIT AI Agent Index

The 2025 AI Agent Index is one of the strongest empirical sources because it documents 30 prominent deployed agents across 1,350 fields, including origin, design, capabilities, ecosystem interaction, autonomy, safety, and transparency [S22], [S23]. Its headline finding is a transparency gap: developers disclose product capabilities far more than safety practices [S22].

Key reported metrics are severe. The Index found that 25 of 30 agents disclosed no internal safety results and 23 of 30 had no third-party testing information. Of 13 agents exhibiting frontier levels of autonomy, only 4 disclosed any agent-specific safety evaluations [S22], [S23]. It also reported that only 4 agents provide agent-specific system cards and that missing information concentrates in ecosystem interaction and safety categories [S22], [S23].

The autonomy findings show why governance has to operate at deployment time. Chat agents tend to operate at lower autonomy levels (Level 1-3), browser agents at Level 4-5 with limited intervention, and enterprise agents often move from user configuration at Level 1-2 to deployed event-triggered operation at Level 3-5 [S22]. In other words, the risk profile changes after deployment, when an agent can act through APIs, browsers, and other tools without a human reading each step.

The Index is also explicit that there are no established standards for how agents should behave on the web. Web conduct practices are undocumented for most indexed agents, and browser-based agents may ignore robots.txt or bypass anti-bot systems to act on behalf of users [S22], [S23]. This is a governance gap for the open web. Existing web controls were designed for browsers, crawlers, and APIs, not personalized autonomous agents that can mimic human traffic and perform transactions.

## MIT Sloan 2026 decision-maker guidance

MIT Sloan's 2026 guidance is more conservative than much of the agent marketing cycle. It says agentic AI is not ready for prime time because ongoing hallucinations, mistakes, prompt injection, and other hijacking methods force companies to keep humans in the loop [S24]. That human oversight reduces the productivity advantage that agentic AI promises, but removing it prematurely creates operational and security risk [S24].

At the same time, MIT Sloan does not dismiss agents. Davenport and Bean predict that AI agents will handle most transactions in many large-scale business processes within five years, and they advise organizations to start building internal capabilities to create and test agents [S24]. The practical implication is phased adoption: reusable, bounded use cases first; broader autonomous workflows only after identity, policy, evaluations, auditability, and rollback controls are mature.

## NIST/NCCoE identity and authorization work

NIST/NCCoE's 2026 concept paper is a major governance signal because it treats AI agents as software actors that need identification, authentication, authorization, auditing, and non-repudiation [S25]. The concept paper asks how existing identity standards and best practices can be applied to software and AI agents, especially in enterprise environments where agents access diverse data sets, tools, and applications [S25].

The paper's focus areas map directly to current incidents: agent identification, metadata for controlling autonomy level, authorization rights and entitlements, auditing, non-repudiation, and prompt-injection mitigation [S25]. Secondary summaries of the paper identify relevant standards and technologies under consideration, including OAuth 2.0/2.1, OpenID Connect, SPIFFE/SPIRE, SCIM, NGAC, zero trust architecture, and MCP [S25]. The open question is multi-hop delegation: how to track and constrain authority when Agent A spawns Agent B that calls Agent C.

This work reinforces the need for OSSA/DUADP-style metadata. An agent identity system needs more than a user token. It needs a machine-readable declaration of the agent, issuer, allowed tools, trust tier, autonomy bounds, revocation state, and evidence trail [S01], [S03], [S25].

## Other academic and research threads

Academic security research is moving quickly around MCP because MCP is the first widely adopted standard with a large tool/server ecosystem. Hou et al. identify four attacker types and 16 threat scenarios across the MCP lifecycle, including tool poisoning, installer spoofing, unauthorized access, naming attacks, and description manipulation [S41]. Their paper argues that MCP's rapid adoption has outpaced comprehensive security, discoverability, and remote deployment practices [S41].

Tool poisoning research has advanced from anecdotal demos to benchmarks. MCPTox examines poisoned tool metadata in real-world MCP servers, while later threat modeling studies use STRIDE and DREAD across MCP host/client, LLM, server, external data stores, and authorization server components [S41], [S42]. The most important conclusion is that MCP clients often treat server-provided metadata and tool responses as trusted context, which lets an attacker influence the LLM before any traditional code vulnerability is triggered [S42].

The arXiv interoperability survey by Ehtesham et al. compares MCP, ACP, A2A, and ANP across interaction modes, discovery mechanisms, communication patterns, and security models [S47]. Its phased roadmap - MCP for tool access, ACP for multimodal messaging, A2A for collaborative task execution, and ANP for decentralized marketplaces - is slightly dated because ACP has since merged into A2A, but the layered analysis remains useful [S16], [S47].

Broader cybersecurity surveys now treat agentic AI as a dual-use shift. One 2026 survey argues that agents enable continuous monitoring, autonomous incident response, adaptive threat hunting, and fraud detection, while also amplifying adversarial reconnaissance, exploitation, coordination, and social engineering [S48]. The ACM Computing Surveys article identifies four knowledge gaps behind agent insecurity: unpredictability of multi-step user inputs, complexity in internal executions, variability of operating environments, and interactions with untrusted external entities [S49].

ANP's technical white paper and GitHub project are also research-adjacent because they propose a three-layer architecture for the Agentic Web: DID-based identity and encrypted communication, a meta-protocol layer for negotiation, and an application protocol layer for capability description [S12]. This aligns with Harvard's protocol-tree framing: the agent ecosystem is not just adding APIs; it is exploring new network semantics for autonomous software actors [S20], [S21].

Cloud Security Alliance's MAESTRO framework and Five Eyes implementation notes show the policy community moving toward agent-specific threat modeling [S50], [S51]. MAESTRO emphasizes a multi-layer view of agent architecture, while the Five Eyes guidance categories - privilege, design/configuration, behavioral, structural, and accountability risks - match the operational failure modes seen in OWASP and Gravitee sources [S38], [S43], [S50], [S51].

## Research gaps

- Public transparency is still poor. MIT's Index shows that safety evaluations, third-party testing, and web-conduct policies are usually absent from public documentation [S22], [S23].
- Agent identity is underspecified. NIST is explicitly asking how to identify, authenticate, authorize, audit, and revoke agents at enterprise scale [S25].
- Web conduct standards are unsettled. Browser agents, content hosts, CAPTCHAs, robots.txt, signed traffic, and user-delegated access remain in conflict [S22], [S45].
- MCP security requires more than server hardening. The client side needs static metadata vetting, privilege separation, user transparency, and runtime policy enforcement because malicious tool descriptions and responses enter the model context [S41], [S42].
- Education is catching up fast. Cornell and Harvard are already teaching agent protocols and governance as core material, suggesting that protocol literacy will become baseline knowledge for AI system architects [S18], [S20].
