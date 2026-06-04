# Academia and Research Notes

Report date: 2026-06-04

## Cornell and eCornell

Cornell's Agentic AI Architecture certificate is a practical bridge from LLM fundamentals to autonomous agent systems. The curriculum starts with LLM behavior, prompt engineering, context engineering, hallucination patterns, and API-based application development. It then moves into RAG, including private/up-to-date data access, relational data, Text-to-SQL, GraphRAG, embeddings, chunking, query transformation, and citation/transparency practices [CORNELL].

The agent-specific course, "Building AI Agents With Tools, Memory, and Agentic Architecture," treats agents as LLMs equipped with tools, memory, and reasoning capabilities that execute workflows autonomously. It covers model, system prompt, tools, and memory as core agent components, plus prompt chaining, routing, parallelization, orchestrator-worker designs, reflection loops, protocols, handoffs, and MCP as a standardized tool interface [CORNELL].

The program is notable because it does not stop at agent construction. It explicitly includes "AI Strategy, Governance, and Ethics" and asks learners to evaluate value, feasibility, responsible use, governance, and security trade-offs. The page repeatedly frames hallucination reduction, error-cost management, human oversight, and governance as part of production agent architecture rather than after-the-fact compliance [CORNELL].

Takeaway for OSSA/DUADP: Cornell's curriculum matches the OSSA/DUADP thesis that agent engineering needs formal contracts, discovery, identity, policy, and oversight, not only clever prompts and tool calls.

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard's Library Innovation Lab launched the Agent Protocols Tech Tree (APTT) on 2026-02-23 after a Berkman Klein Center workshop on "Towards an Internet Ecosystem for Sane Autonomous Agents" held on 2026-02-09. APTT is a visual, game-like map of the open protocols emerging around AI agents [HARVARD-APTT].

The core argument is that open protocols reveal what builder communities care about, what they have agreed on, what is working, and what might come next. Harvard compares the agent moment to the early internet, where TCP/IP, SMTP, DNS, FTP, HTTP, and SSL emerged through rough consensus and running code rather than a single centralized authority [HARVARD-APTT].

APTT also explains why protocols matter for governance. It cites Anthropic's practical definition of an agent as "models using tools in a loop" and argues that agents are a technique, not a single product or service. Because they are simple to recreate, protocols may shape agent behavior more effectively than centralized regulation alone [HARVARD-APTT].

Important limitations: APTT is deliberately described as a work-in-progress "whiteboard sketch," not an authoritative catalog. Its strength is the conceptual layer map and wire-level examples, not final standard-setting authority [HARVARD-APTT].

## MIT AI Agent Index

The 2025 MIT-affiliated AI Agent Index documents 30 prominent agentic systems across product overview, company/accountability, technical capabilities, autonomy/control, ecosystem interaction, and safety/evaluation/impact. It uses 45 fields per agent, producing 1,350 annotated fields, with data from public documentation, demos, published papers, governance documents, and limited developer correspondence [MIT-INDEX] [MIT-DETAILS].

Key findings:

- Rapid deployment: 24 of 30 agents launched or received major agentic updates in 2024-2025 [MIT-INDEX].
- Autonomy split: chat agents tend to Level 1-3 autonomy, browser agents Level 4-5, and enterprise agents shift from low-autonomy design to higher-autonomy deployment when event-triggered [MIT-INDEX].
- Safety transparency gap: among 13 frontier-autonomy agents, only 4 disclose agentic safety evaluations. Overall, 25 of 30 disclose no internal safety results and 23 of 30 have no third-party testing information [MIT-INDEX] [MIT-DETAILS].
- Model concentration: most agents depend on GPT, Claude, or Gemini model families, creating ecosystem-wide dependencies [MIT-INDEX].
- Web conduct gap: there are no established standards for how agents should behave on the web; browser-based agents often ignore `robots.txt`, bypass anti-bot systems, or mimic human browsing [MIT-INDEX] [MIT-DETAILS].

The Index is especially relevant for governance because it shows that voluntary disclosure is not keeping pace with deployment. It recommends structured transparency around agent-specific system cards, sandboxing documentation, web-conduct policies, safety evaluations, identity verification, and post-deployment monitoring [MIT-DETAILS].

## MIT Sloan guidance

MIT Sloan's 2026 guidance says agentic AI is not ready for prime time yet. Thomas Davenport and Randy Bean identify ongoing hallucinations, mistakes, prompt injection, and other hijacking methods as adoption-slowing risks. They also expect human-in-the-loop guardrails to remain common, even though those guardrails reduce the productivity upside promised by full autonomy [MIT-SLOAN-2026].

Despite that caution, the same article predicts agents will handle most transactions in many large-scale business processes within five years. The recommended action is to start envisioning reusable agent use cases and build internal capability to create and test agents [MIT-SLOAN-2026].

Another MIT Sloan article, based on MIT Sloan Management Review and BCG research, frames organizational adoption around four tensions: scalability versus adaptability, experience versus expediency, supervision versus autonomy, and retrofit versus reengineer. It reports that more than one third of surveyed companies are already deploying agentic AI and another 44% plan to do so, while warning that enthusiasm is running ahead of readiness in governance, talent, and accountability [MIT-SLOAN-AGENTIC].

## Recent academic protocol survey

The arXiv survey "A Survey of Agent Interoperability Protocols" compares MCP, ACP, A2A, and ANP. It describes MCP as JSON-RPC tool/context integration, ACP as RESTful HTTP for synchronous/asynchronous MIME-typed agent messaging, A2A as peer task delegation using Agent Cards, and ANP as decentralized discovery and collaboration based on W3C DIDs and JSON-LD graphs [ARXIV-INTEROP].

The paper's practical contribution is a layered adoption roadmap: begin with MCP for tool access, add ACP for structured multimodal invocation where needed, adopt A2A for collaborative task execution, and extend to ANP for decentralized agent marketplaces and identity-rich open networks [ARXIV-INTEROP].

Post-publication ecosystem changes matter: ACP has since merged into A2A under the Linux Foundation umbrella, with ACP active development winding down and the BeeAI platform moving to A2A adapters [ACP-LFAI]. Reports should therefore treat ACP as historically and architecturally important, but not as a fully independent forward path after the merger.

## Recent academic security surveys

Recent 2026 security surveys argue that agentic security must be treated as a layered distributed-systems problem rather than just "prompt injection." One survey introduces a Layered Attack Surface Model (LASM) with seven layers: foundation, cognitive, memory, tool execution, multi-agent coordination, ecosystem, and governance. It also adds temporality classes: instantaneous, session-persistent, cross-session cumulative, and sub-session-stack/non-session-bounded threats [ARXIV-SECURITY].

The under-studied zone is high-layer, slow-burn risk: multi-agent coordination, ecosystem, and governance threats that accumulate across sessions or outside normal session boundaries. Examples include covert agent collusion, long-term memory poisoning, MCP supply-chain compromise, and alignment failures that look like insider threats [ARXIV-SECURITY].

Another 2026 survey of the attack and defense landscape reviewed 128 papers and used OWASP LLM Top 10 and MITRE ATLAS as references. It emphasizes indirect prompt injection from external web pages, documents, or retrieved content as a core vulnerability for agents that act on untrusted environmental inputs [ARXIV-ATTACKS].

## Policy and web-governance research

TechPolicy.Press argues that agents are changing web rules of engagement by bypassing user-facing flows, ads, and conversion funnels. The article notes that `robots.txt` is voluntary and user-agent strings are spoofable, while CAPTCHAs are increasingly defeatable. It proposes verifiable agent identity through cryptographic signatures and payment/authorization protocols such as Web Bot Auth, CAIP-122, and x402 [TECHPOLICY].

The policy implication is direct: existing legal and authorization frameworks assume enforceable gates, but web infrastructure often still relies on weak signals. Verifiable identity creates binary records of whether an agent presented valid credentials, forged identity, or bypassed controls [TECHPOLICY].

## Research implications for this repo

1. OSSA should continue to emphasize machine-readable agent contracts, conformance, policy bindings, provenance, and export fidelity.
2. DUADP should continue to emphasize evidence-based discovery, GAID/DID resolution, trust-tier decisions, revocation, and federation.
3. Security posture should be documented as part of the manifest/discovery path, not only in runtime code.
4. Web-conduct and agent identity standards should be watched closely, especially request signing, well-known identity endpoints, and privacy-preserving human/agent traffic separation.
