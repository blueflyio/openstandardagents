# Academic Research and Education

As of 2026-05-26.

## Cornell and eCornell

Cornell's Agentic AI Architecture certificate frames agents as the progression from "AI that chats" to "AI that acts." The program starts with LLM behavior, prompt engineering, context engineering, and hallucination mitigation; moves into RAG, Text-to-SQL, GraphRAG, and private data grounding; then covers tool-using agents with memory, routing, parallelization, orchestrator-worker designs, reflection loops, agentic protocols, handoffs, and MCP. The final course emphasizes strategy, governance, ethics, risk, security, and human oversight. [cornell-agentic]

This curriculum is notable because it treats agent architecture as both a technical and organizational discipline. The technical pieces are tools, memory, reasoning loops, workflows, and standardized tool interfaces. The governance pieces are error-cost assessment, feasibility, responsible use, human transformation, security, and oversight. That combination matches the current production evidence: agents need both orchestration design and enforceable operating controls. [cornell-agentic] [47billion-production]

Cornell's enterprise-ready AI agent workshop is even more operational. It distinguishes a demo agent from a production-grade agent that engineering, security, and auditors can rely on. It emphasizes explicit LangGraph state machines, small named nodes, structured atomic workflows, human approval gates for high-risk actions, OWASP LLM/agentic threat modeling, RAG patterns, stop/escalate rules, and permission gates. [cornell-enterprise]

## Harvard: open protocols and the agentic web

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT) explains open protocols as shared languages that allow independently built systems to interoperate. The project explicitly compares AI-agent protocol development to the early internet's rough-consensus pattern around TCP/IP, DNS, SMTP, FTP, HTTP, and SSL. Its policy point is that agents are easy to build and hard to regulate directly, so protocols may be one of the most important levers for shaping what agents can conveniently do. [harvard-aptt] [harvard-bkc-aptt]

APTT is also useful as a map of community priorities. It shows that builders are not only standardizing model calls; they are standardizing tool access, agent-to-agent delegation, UI interaction, identity, discovery, and governance. The project's core claim is that open protocols reveal what builder communities agree on, what is catching on, and what capabilities are likely to be easy or hard to build next. [harvard-aptt]

Harvard Journal of Law and Technology's agentic web commentary adds an institutional lens. It asks whether the agentic web will be governed by proprietary platform rules or open protocols that enable portable identity, verifiable delegation, and accountable behavior. It argues for Know Your Agent (KYA) standards that include cryptographically verifiable agent identity, linkage to the authorizing principal, bounded delegation parameters, revocability, and auditability. [harvard-jolt-agentic-web]

## MIT: Agent Index and decision-maker guidance

The 2025 AI Agent Index documents 30 prominent deployed AI agents across product overview, company/accountability, technical capabilities, autonomy/control, ecosystem interaction, evaluation, and safety. It found that 24 of 30 agents launched or received major agentic updates in 2024-2025; chat agents generally remain at autonomy levels 1-3, browser agents operate at levels 4-5, and enterprise agents often move from low-autonomy design to higher-autonomy event-triggered deployment. [mit-index]

The Index's safety and transparency findings are central:

| Finding | Value |
| --- | --- |
| Indexed systems | 30 agents |
| Annotated fields | 1,350 total fields |
| Fields without public information | 227 |
| Frontier-autonomy agents disclosing agentic safety evaluations | 4 of 13 |
| Agents disclosing no internal safety results | 25 of 30 |
| Agents with no third-party testing | 23 of 30 |
| Agents supporting MCP for tool integration | 20 of 30 |
| Fully closed-source product-level agents | 23 of 30 |

MIT's web-conduct finding is especially relevant to protocol work: there are no established standards for how agents should behave on the web, and some agents are explicitly designed to bypass anti-bot protections or mimic human browsing. This creates a gap for agent identity, permissions, and traffic-governance standards. [mit-index]

MIT Sloan's 2026 guidance is more cautious about enterprise adoption. Davenport and Bean argue that agentic AI is not ready for prime time because of hallucinations, mistakes, prompt injection, and hijacking risk. They still predict that agents will handle most transactions in many large-scale business processes within five years, but recommend beginning with reusable internal use cases and building internal capabilities to create and test agents. [mit-sloan-2026]

## Other academic and research sources

The Future Internet review "AI Agent Communications in the Future Internet - Paving a Path Toward the Agentic Web" surveys representative agent communication protocols and categorizes them into three groups: inter-agent protocols, context-oriented protocols such as MCP, and user-oriented protocols such as AG-UI. It argues that all three categories are needed in multi-agent systems, while inter-agent protocols are especially important for an Agentic Web spanning heterogeneous organizations, edge devices, cloud systems, and networks. [future-internet-agentic-web]

The same paper identifies key future-internet challenges for agent communication: heterogeneity, massive scalability, environmental dynamism, resource constraints, and security. It also notes the 2025 protocol sequence: AGNTCY and LMOS in March, IBM ACP in March, Google A2A in April, and ANP as a W3C-oriented white paper in May 2025. [future-internet-agentic-web]

The arXiv paper "Security Threat Modeling for Emerging AI-Agent Protocols" provides a comparative security analysis of MCP, A2A, Agora, and ANP. It argues that protocol security remains understudied, introduces twelve protocol-level risks, and emphasizes lifecycle-aware risk assessment across creation, operation, and update phases. [protocol-threat-modeling]

The arXiv paper "A Formal Security Framework for MCP-Based AI Agents" focuses on MCP at ecosystem scale. It reports over 10,000 active MCP servers, 177,000 registered tools, and 97 million monthly SDK downloads as of early 2026. It proposes MCPShield, a framework with 7 threat categories, 23 attack vectors, formal verification models, defense coverage analysis, and a defense-in-depth architecture. [mcp-shield]

## Education and research implications

1. Agent education is moving from prompt engineering to systems architecture: RAG, tool interfaces, memory, workflows, protocols, security, and governance.
2. Academic policy work sees open protocols as a governance surface, not merely a developer convenience.
3. Empirical measurement is still thin. MIT's Index is valuable because it converts agent transparency into countable fields, but it also shows large disclosure gaps.
4. Security research is rapidly catching up with protocol adoption, especially around MCP and A2A, but formal adversary models and empirical cross-protocol testing remain immature.
5. Universities and standards bodies are converging on the same practical controls: agent identity, bounded authority, auditable actions, human oversight, web conduct norms, and secure tool access.

## Limitations noted

- Some Harvard LIL APTT content was available through search excerpts and the Berkman Klein mirror; the Library Innovation Lab article itself timed out during retrieval in this environment.
- Research on 2026 protocols is fast-moving. Some sources are preprints, blog-supported empirical reports, or early public drafts rather than finalized standards.
