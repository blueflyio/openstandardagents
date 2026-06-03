# Academic research and education

Research run date: 2026-06-03. Citation keys resolve in `reading-list.md`.

## Cornell and eCornell

Cornell's Agentic AI Architecture certificate is an applied education program that bridges LLM fundamentals to production agent design. The curriculum starts with LLM behavior, prompt engineering, context limits, and hallucination mitigation; moves to RAG, Text-to-SQL, and GraphRAG; then builds agents with tools, memory, routing, orchestrator-worker workflows, reflection loops, protocols, handoffs, and MCP; and ends with strategy, governance, risk, ethics, security, and human oversight [ecornell-agentic].

The program is useful as a snapshot of what a major university considers production-relevant in 2026: RAG to ground private data, agents with memory and tool use, standardized tool interfaces, and organizational governance. Its project examples include calling LLM APIs, building multi-turn chatbots, building "chat with your document" and RAG pipelines, implementing natural-language-to-SQL, designing agentic workflows, and producing an AI implementation plan that evaluates value, feasibility, responsible use, governance, and security tradeoffs [ecornell-agentic].

Cornell's course framing reinforces a key industry lesson: autonomous capability is not just a model problem. Reliable agents need context engineering, retrieval, structured data access, evaluation, human oversight, and explicit security controls [ecornell-agentic].

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT), created for a Berkman Klein Center workshop on 2026-02-09 and published on 2026-02-23, is a policy-and-technology map of open protocols supporting AI agents [harvard-aptt].

The article defines an open protocol as a shared language used by multiple software projects so they can interoperate or compete. It compares agent protocols to the early internet's TCP/IP, SMTP, DNS, FTP, HTTP, and SSL evolution, where "rough consensus and running code" created incentives to speak common languages [harvard-aptt].

Harvard's main governance insight is that agents are hard to regulate because they are easy to recreate: "models using tools in a loop" require a model, a control loop, and tools. Therefore, protocols matter because they determine which tools agents can use, which behaviors are easiest to build, and how dispersed agent systems interoperate [harvard-aptt].

APTT is explicitly not authoritative. It is a "whiteboard sketch" designed to explain the arc from widely adopted protocols such as MCP to less proven or future concepts such as signed intent mandates and interoperable memory. That caveat is important: the field is still fluid, and even university-led maps are exploratory [harvard-aptt].

## MIT AI Agent Index

The 2025 AI Agent Index, with affiliations including MIT, Cambridge, Stanford, Harvard Law School, University of Washington, University of Pennsylvania, Concordia AI, and Hebrew University, documents 30 prominent AI agents across product overview, accountability, technical capabilities, autonomy and control, ecosystem interaction, evaluation, and safety [mit-index] [mit-index-details].

Its key findings quantify the governance gap:

| Finding | Value |
| --- | --- |
| Agents launched or materially updated in 2024-2025 | 24 / 30 |
| Annotated fields | 1,350 |
| Fields with no public information | 227 |
| Frontier-autonomy agents disclosing agentic safety evals | 4 / 13 |
| Agents with no internal safety results disclosed | 25 / 30 |
| Agents with no third-party testing information | 23 / 30 |
| Agents supporting MCP | 20 / 30 |
| Fully closed-source products | 23 / 30 |

The Index defines agentic systems by autonomy, goal complexity, environmental interaction, and generality, rather than proposing a new universal definition. Its inclusion criteria required autonomy, goal complexity, tool/world interaction, generality, public availability, deployability, and impact [mit-index-details].

The most important standards finding is blunt: there are no established standards for how agents should behave on the web. Browser-based agents often ignore robots.txt, some are designed to bypass anti-bot systems, and only ChatGPT Agent used cryptographic request signing in the 2025 snapshot [mit-index] [mit-index-details].

## MIT Sloan and MIT Press/HDSR

MIT Sloan's 2026 decision-maker guidance says agentic AI is "not ready for prime time - yet" because hallucinations, mistakes, prompt injection, and hijacking risks have slowed adoption. Davenport and Bean still predict that agents will handle most transactions in many large-scale business processes within five years, and recommend that firms build reusable use cases plus internal capabilities to create and test agents [mit-sloan-2026].

MIT Sloan's agentic enterprise article, based on a survey of more than 2,000 respondents with MIT Sloan Management Review and BCG, reports that more than one third of surveyed companies are already deploying agentic AI and another 44% plan to do so. It frames adoption around four management tensions: scalability versus adaptability, experience versus expediency, supervision versus autonomy, and retrofit versus reengineer [mit-sloan-agentic].

The MIT Sloan article's governance recommendation is dynamic oversight. Agentic AI must be managed more like a human coworker than a traditional tool: define when the system can act autonomously, when humans must intervene, and how oversight changes based on context, performance, and risk [mit-sloan-agentic].

MIT Press/HDSR search results point to "AI Agents Are Transforming Decision Making: What Leaders Should Know" in Spring 2026. The accessible search extract emphasizes data readiness, trust, integration, human-in-the-loop deployment, and an enterprise governance stack with observability, security, RBAC, lifecycle gates, and alignment with cloud governance guidance [mitpress-hdsr-search]. Direct fetching timed out, so this source is treated as secondary-unverified in this report.

## Recent arXiv and academic security work

Recent 2025-2026 research has shifted from individual LLM safety to multi-agent and workflow security. "Open Challenges in Multi-Agent Security" presents attacker models and open problems across environment design, provenance, protocols, monitoring, containment, attribution, and governance [arxiv-multiagent-security].

"From Prompt Injections to Protocol Exploits" surveys LLM-powered agent workflows and explicitly includes protocol vulnerabilities in MCP, ACP, ANP, and A2A. It organizes threats into input manipulation, model compromise, system/privacy attacks, and protocol vulnerabilities, showing that inter-agent protocols create their own attack surface [arxiv-protocol-exploits].

"The Attack and Defense Landscape of Agentic AI" reviewed literature and web documents from 2023 through October 2025, yielding 128 papers, 51 attack methods, and 60 defense methods. It highlights indirect prompt injection, memory poisoning, tool abuse, and defense-in-depth approaches grounded in OWASP and MITRE ATLAS [arxiv-attack-defense].

"Before the Tool Call" argues that agents have credentials but no "permission slips." It introduces pre-action authorization through the Open Agent Passport (OAP): a blocking before-tool-call hook, declarative policies, Ed25519-signed audit records, and fail-closed decisions. Its testbed reports median 53 ms authorization overhead and 0% success under restrictive policy across 879 comparable attack attempts after social engineering succeeded 74.6% under permissive policy [oap-paper].

Communications of the ACM's "Guardians of the Agents" recommends moving from "generate then execute" to "generate, verify, then execute," including real-time monitoring and formal verification of workflows before execution when tool actions can have irreversible side effects [cacm-guardians].

## Other governance research and management literature

California Management Review's March 2026 "Governing the Agentic Enterprise" proposes an Agentic Operating Model with four interdependent layers: cognitive specialization, coordination architecture, real-time control, and organizational governance. The core claim is that agent failures often arise from misalignment across these layers, not only from weak model performance [cmr-agentic-enterprise].

Harvard Business Review search results surfaced sponsored CyberArk content rather than editorial research. The content is still relevant to identity risk, citing the need for visibility, strong authentication, least privilege, and just-in-time access for AI identities, but it should not be treated as independent academic evidence [hbr-cyberark-sponsored].

## Limitations

Some named sources in the prompt were unavailable, paywalled, or returned only search snippets. Ruh.ai's protocol guide page rendered only minimal content through the available fetch path, and a specific "Harvard Policy Review" article on the agentic web was not found. Where that happened, this report uses an accessible substitute and labels the limitation in `blogs.md` and `reading-list.md` [ruh-protocol-search] [imperva-bad-bot] [agtp-draft].
