# Academia, research centers, and policy research

Compiled on 2026-05-25.

## Cornell and eCornell

Cornell's Agentic AI Architecture program is explicitly structured as a path from LLM fundamentals to agentic systems. It covers hallucinations and context limits, prompt and context engineering, RAG pipeline patterns, structured data access, tool-using agents, memory, agentic workflows, multi-agent protocols, MCP, governance, security, risk, and human oversight [S7].

The program's practical patterns include prompt chaining, routing, parallelization, orchestrator-worker designs, reflection loops, RAG chunking/query transformation, and transparent citations [S7]. This is useful because it treats agent architecture as both an engineering pattern and a governance problem: students are asked to produce strategic implementation plans that evaluate value, feasibility, responsible use, governance, and security trade-offs [S7].

## Harvard: Agent Protocols Tech Tree

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT) is an interactive map of open protocols behind AI agents. The project was created for the Berkman Klein Center workshop "Towards an Internet Ecosystem for Sane Autonomous Agents" on 2026-02-09 and published on 2026-02-23 [S8][S9].

The key claim is that open protocols make the emerging agent ecosystem legible. They show what builders care about, what is working, and what may shape future behavior. Harvard frames agents as simple to assemble but hard to regulate because an agent can be an LLM plus a control loop and tools. The implication is that protocols are governance leverage: they can make some agent behaviors easier to build than others [S8].

APTT is intentionally opinionated rather than exhaustive. Its value is pedagogical and architectural: it shows layers of inference APIs, tool calling, MCP, agent-to-agent coordination, identity, commerce, and domain protocols, including raw message examples for technical readers and "why this exists" explanations for policy readers [S8][S9].

## MIT: AI Agent Index

MIT's 2025 AI Agent Index documents 30 deployed agents across product overview, accountability, technical capabilities, autonomy, ecosystem interaction, safety, evaluation, and impact fields [S10]. Its definition emphasizes autonomy, goal complexity, environmental interaction through tools/APIs, and generality [S11].

The strongest empirical findings are transparency gaps. MIT reports that 24 of 30 agents were released or received major agentic feature updates in 2024-2025. Of 13 agents exhibiting frontier levels of autonomy, only 4 disclosed any agentic safety evaluations. Across all 30, 25 disclosed no internal safety results and 23 had no third-party testing information [S10][S11].

The web-conduct finding is especially relevant to open protocols. MIT states that there are no established standards for how agents should behave on the web. Sixteen of 30 agents gave no clear statement about robots.txt, CAPTCHA handling, or web access methods, and only one agent used cryptographic request signing [S10][S11].

## MIT Sloan: decision-maker guidance for 2026

MIT Sloan's 2026 guidance is more cautious than many vendor narratives. Davenport and Bean say agentic AI is not ready for prime time because hallucinations and mistakes can cascade through multi-step transactions, and because prompt injection can hijack tool-using systems [S12].

The guidance is not anti-agent. It recommends that companies begin envisioning reusable use cases and build internal capability to create and test agents. It also predicts that agents may handle most transactions in many large-scale business processes within about five years, provided governance and security mature [S12].

## NIST/NCCoE: identity and authorization

NIST/NCCoE's 2026 concept paper directly targets the missing identity layer. It seeks stakeholder input for a project demonstrating how existing identity standards and best practices can be applied to software and AI agents [S13][S14].

The paper's scope includes identification, authentication, authorization, access delegation, auditing, non-repudiation, and prompt-injection controls [S13]. It names standards and technologies such as OAuth 2.0/2.1, OpenID Connect, SPIFFE/SPIRE, SCIM, NGAC, Model Context Protocol, and NIST zero-trust and digital-identity publications as relevant building blocks [S14].

## Harvard JOLT and agentic web governance

Harvard JOLT argues that the agentic web requires a lifecycle governance architecture: identity, delegation/standing, and runtime control [S15]. It proposes "Know Your Agent" (KYA) as a governance analogue to KYC: agents need cryptographically verifiable identity, principal-agent linkage, delegation parameters, revocation, and auditability [S15].

The Belfer Center policy brief similarly treats MCP and A2A as examples of emerging interoperability infrastructure. MCP standardizes context and tools for individual agents; A2A allows agents to share capabilities, negotiate tasks, and coordinate asynchronously through Agent Cards [S16].

## Recent academic security research

Recent arXiv work moves beyond prompt injection as a single vulnerability. A 2026 survey reviewed literature and web documents from 2023 through October 2025, yielding 128 papers, 51 attack methods, and 60 defense methods; it organizes risks at both component and system levels and identifies indirect prompt injection as a core threat when agents retrieve malicious instructions from web pages or documents [S17].

A 2025 survey frames agent threats across host-to-tool and agent-to-agent communications, including protocol vulnerabilities in MCP, ACP, ANP, and A2A [S18]. A 2026 layered security framework argues that the most dangerous emerging threats concentrate in high-layer, slow-burn zones such as covert agent collusion, long-term memory poisoning, MCP supply-chain compromise, and governance/accountability failures [S19].

## Limitations

Some academic and policy materials were available only as PDFs or search-result extracts. Where full text was unavailable or paywalled, this report cites the available official landing page, PDF snippet, or repository metadata and avoids claims beyond retrieved text.
