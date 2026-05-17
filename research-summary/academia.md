# Academia, education, and policy research

Research snapshot: May 17, 2026.

## Summary

University and research-center materials in 2025-2026 emphasize the same tension: agents are becoming easy to build, powerful enough to act, and hard to govern with old assumptions. Cornell's educational program teaches the engineering path from LLMs to RAG to tool-using agents and governance. Harvard's Library Innovation Lab treats protocols as the leverage point for shaping an ecosystem that no single institution controls. MIT's AI Agent Index documents rapid deployment, rising autonomy, and sparse safety transparency [S17][S18][S20].

## Cornell/eCornell: Agentic AI Architecture

Cornell's Agentic AI Architecture certificate is a four-course online program priced at USD 3,750, with a stated two-month commitment of 8-10 hours per week [S17]. It is positioned for developers, technical leaders, executives, data scientists, and AI/NLP practitioners who need to build or lead LLM-powered systems [S17].

The curriculum moves through:

- LLM fundamentals, prompt engineering, context engineering, hallucination causes, API usage, streaming chat, memory, and system prompts [S17].
- RAG, including private/up-to-date data, relational data access, text-to-SQL, GraphRAG, embeddings, vector search, chunking, query transformation, and citations [S17].
- AI agents with tools, memory, prompt chaining, routing, parallelization, orchestrator-worker designs, reflection loops, handoffs, multi-agent workflows, and MCP [S17].
- AI strategy, governance, ethics, opportunity evaluation, fairness, human transformation risks, security, and oversight [S17].

The program's value for this research is that it codifies a practical education sequence: reliable agent work starts with understanding model failure modes, then grounding through RAG, then constrained tool use, then governance and human oversight [S17].

## Harvard Library Innovation Lab: Agent Protocols Tech Tree

Harvard LIL launched the Agent Protocols Tech Tree (APTT) on February 23, 2026 after a Berkman Klein Center workshop on "Towards an Internet Ecosystem for Sane Autonomous Agents" [S18]. The project maps the evolving open protocols that support AI agents and intentionally uses a game-like tech tree to make protocol dependencies easier to understand [S18][S19].

The central argument is that open protocols are an "x-ray" of emerging technology because they reveal what builders need to agree on, what is working, and what is likely to come next [S18]. The blog compares the agent moment to the early internet: TCP/IP, SMTP, DNS, FTP, HTTP, and SSL were not imposed by one government or company, but converged through "rough consensus and running code" [S18].

Harvard's governance insight is important: agents are hard to regulate because their recipe is simple - a model, a control loop, and tools. Agents are a technique, not a single service. That makes protocol design one of the few practical levers for shaping behavior across a distributed builder ecosystem [S18].

## MIT AI Agent Index 2025

The 2025 MIT AI Agent Index provides public-information annotations on 30 agentic systems across product overview, company/accountability, technical capabilities, autonomy/control, ecosystem interaction, and safety/evaluation/impact [S20]. The index reflects a snapshot through December 31, 2025 [S20].

Key findings:

- Releases and major agentic updates accelerated: 24 of 30 agents were released or received major agentic feature updates in 2024-2025 [S20].
- Autonomy is rising: browser agents operate at L4-L5 with limited mid-execution intervention, while enterprise agents move from L1-L2 during design to L3-L5 when deployed [S20].
- Safety transparency is weak: of 13 agents with frontier autonomy, only 4 disclose agentic safety evaluations; 25 of 30 disclose no internal safety results; 23 of 30 disclose no third-party testing information [S20].
- Accountability is fragmented across foundation-model providers, scaffolding/orchestration layers, and deployers [S20].
- Web conduct standards remain unsettled. Some browser agents ignore robots.txt or are designed to bypass anti-bot systems, while content hosts cannot reliably verify or control agent access [S20].

The MIT Index is one of the strongest primary sources for the claim that agent deployment is moving faster than standards, safety disclosure, and web-conduct norms [S20].

## MIT Sloan: decision-maker guidance for 2026

MIT Sloan summarizes Thomas Davenport and Randy Bean's 2026 AI guidance as a level-set year rather than a pure acceleration year [S21]. Their first point is that agentic AI is not ready for prime time yet because hallucinations, mistakes, prompt injection, and other hijacking methods still slow adoption [S21].

They expect companies to keep humans in the loop for guardrails, even though that reduces some promised productivity gains [S21]. Their longer-term forecast remains bullish: AI agents may handle most transactions in many large-scale business processes within five years from 2026 [S21]. Recommended action is to envision reusable use cases and build internal capabilities to create and test agents [S21].

## Harvard policy review: agentic web and traffic growth

The Harvard Kennedy School Student Policy Review article "Wrangling with Explosive AI Growth" frames autonomous agents as part of an "agentic web" where bots interact and coordinate with other bots [S22]. It cites bots as already comprising 50% of internet traffic and argues that improved autonomous coordination could drive super-exponential network activity that crowds out human traffic [S22].

Policy recommendations include:

- Improve bot-to-bot communication efficiency and protocols [S22].
- Invest in network infrastructure to handle traffic growth [S22].
- Develop stronger methods to distinguish human from automated activity, because traditional CAPTCHAs are increasingly weak against frontier models [S22].
- Treat AI safety as reliability engineering: use redundancy, simulation, monitoring, guardrails, parallel model evaluations, and human review in sensitive applications [S22].

This is not an official Harvard institutional standard, but it is useful policy framing around infrastructure, proof-of-personhood, and human-centric internet preservation [S22].

## Harvard Business Review and organizational readiness

Harvard Business Review's June 13, 2025 article "Organizations Aren't Ready for the Risks of Agentic AI" describes agents as systems that execute a series of tasks without specific instructions and warns that leaders are facing wide-scale organizational disruption [S23]. The fetched page exposed only the summary text; the full article may require purchase or subscription [S23]. Treat HBR as a management signal rather than a technical primary source unless full text is available.

## arXiv survey: protocol landscape

The May 2025 arXiv survey of MCP, ACP, A2A, and ANP provides an academic taxonomy of four interoperability protocols [S16]. It describes the challenge as fragmented interoperability across LLM-powered autonomous agents and compares protocols by interaction mode, discovery, communication pattern, and security model [S16].

The survey's adoption roadmap is useful:

1. MCP for secure context ingestion and tool invocation.
2. ACP for RESTful, structured, multimodal messaging and session-aware interactions.
3. A2A for collaborative task execution and Agent Card-based delegation.
4. ANP for decentralized agent marketplaces and open-network DID/JSON-LD collaboration [S16].

The paper also reinforces that standardized protocols reduce development overhead, improve security, and enable cross-platform collaboration, but no unified protocol has yet resolved all needs [S16].

## Research gaps

- Standardized web conduct for browser agents remains open; MIT explicitly reports no established standards [S20].
- Safety disclosure is sparse and inconsistent, making public evaluation hard [S20].
- Identity and authorization standards are only now being scoped by NIST/NCCoE [S35].
- Protocol overlap creates coordination risk: ACP is merging into A2A, while ANP/DUADP/OSSA each introduce identity/discovery/contract layers that may need alignment [S01][S02][S12][S16].
- HBR and some management sources are partially paywalled or summary-only; the report uses them cautiously and favors primary technical or academic sources where available [S23].
