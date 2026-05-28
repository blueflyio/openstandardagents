# Academia, research, and education

Research compiled as of 2026-05-28.

## Cornell: practical agent architecture curriculum

Cornell's eCornell Agentic AI Architecture certificate is a useful signal of how universities are packaging agent engineering for practitioners. It starts with LLM behavior, prompt engineering, context engineering, and hallucination modes, then moves to RAG over documents, relational data, and GraphRAG. The agent course covers the core components of agents: model, system prompt, tools, and memory [T08].

The agent course also teaches architectural patterns that now recur across production frameworks: prompt chaining, routing, parallelization, orchestrator-worker systems, reflection loops, protocols, handoffs, and MCP as a standardized tool interface [T08]. The final governance course moves from implementation into opportunity evaluation, ethics, workforce impacts, risk, security, and human oversight [T08].

The educational framing is important: Cornell treats agentic AI as an architecture discipline, not only a prompting discipline. The curriculum expects students to produce artifacts such as RAG pipelines, natural-language-to-SQL patterns, agentic workflows, and strategic implementation plans that weigh value, feasibility, responsible use, governance, and security [T08].

## Harvard: protocols as the governance surface

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT) frames protocols as an "x-ray" of an emerging technology. Open protocols show what builders care about, what they have working, and what they are forced to agree on [T09].

The Harvard post explicitly compares agent protocols to early internet standards. TCP/IP, DNS, SMTP, HTTP, FTP, and SSL were not imposed by one central actor; they emerged through builder consensus and running code. The same pattern is emerging for AI agents because the ingredients are simple: a model, a loop, and tools [T09].

The policy implication is direct. Since agents are easy to recreate and hard to regulate centrally, protocols may shape behavior by making some agent designs easier than others. That makes protocol design a governance lever, not merely an engineering convenience [T09].

## MIT AI Agent Index: transparency gaps and web conduct

MIT's 2025 AI Agent Index documents 30 prominent agents across 45 fields and six categories. Its headline finding is acceleration: 24 of 30 agents were released or received major agentic updates in 2024-2025 [T10].

The index shows that autonomy varies by category. Chat agents tend to sit at autonomy levels 1-3, browser agents at levels 4-5 with limited intervention, and enterprise agents often move from low-autonomy design-time configuration to higher-autonomy event-triggered deployment [T10].

The strongest governance warning is transparency. Of 13 agents with frontier levels of autonomy, only 4 disclose any agentic safety evaluations. MIT also found no public information for 227 of 1,350 annotated fields; 25 of 30 agents disclose no internal safety results, and 23 of 30 provide no third-party testing information [T10].

MIT also documents the absence of web-conduct standards. Some agents are designed to bypass anti-bot protections or mimic human browsing, while content hosts have limited ability to verify whether traffic is human, delegated by a user, or malicious automation [T10].

## MIT Sloan: 2026 caution and management guidance

MIT Sloan's 2026 decision-maker guidance calls agentic AI "not ready for prime time" because hallucinations, mistakes, prompt injection, and hijacking risk have slowed adoption. The guidance expects human-in-the-loop guardrails to remain necessary, even though they reduce the promised productivity gains of full autonomy [T11].

The same guidance is not anti-agent. Davenport and Bean predict that AI agents will handle most transactions in many large-scale business processes within five years. The recommended action is to build internal capabilities, test reusable use cases, and redesign work thoughtfully rather than chase unconstrained autonomy [T11].

MIT Sloan's broader agentic-AI management guidance emphasizes that organizations must manage agents more like semi-autonomous coworkers than static tools. Governance should define when agents can act alone, when humans intervene, and how oversight adapts to risk context [T11].

## NIST/NCCoE: identity and authorization standards for agents

NIST NCCoE's 2026 concept paper proposes work on applying identity standards and best practices to software and AI agents. The paper focuses on identification, authentication, authorization, auditing, non-repudiation, and prompt-injection controls for agentic AI systems [T12].

The key governance shift is treating agents as distinct non-human actors. Existing IAM models were designed for humans and static services, but agents can access tools, databases, code execution, and APIs autonomously at machine speed. NIST's concept paper therefore asks how standards such as OAuth, OIDC, ABAC, delegation, and audit mechanisms should apply to agent principals [T12].

This aligns closely with OSSA/DUADP's GAID, DID, signature, trust-tier, and policy claims. OSSA encodes identity and governance in manifests, while DUADP resolves and verifies identities at discovery time [T01][T02][T04].

## Academic security literature

Recent academic surveys converge on the same threat categories. ACM Computing Surveys identifies knowledge gaps around unpredictable multi-step inputs, complex internal execution, variable operational environments, and interaction with untrusted external entities [T13]. arXiv SoK work maps attacks across prompt injection, knowledge-base poisoning, tool/plugin exploits, RAG poisoning, and cross-agent manipulation [T15]. Another arXiv survey adds protocol vulnerabilities across MCP, ACP, ANP, and A2A [T16].

The defensive direction is also converging: isolate capabilities, enforce authorization outside the model, validate tool schemas and structured outputs, sandbox code execution, monitor runtime behavior, and keep auditable traces of tool calls and reasoning-relevant context [T13][T14][T15][T16].

## Additional governance literature

Harvard Journal of Law & Technology's "agentic web" framing argues for lifecycle governance: identity, principal-agent linkage, delegated authority, and auditability. Its Know Your Agent framing resembles Know Your Customer, but for autonomous digital actors: who the agent is, on whose behalf it acts, what authority it has, and how its behavior is recorded [T17].

HBR-related reporting shows an enterprise trust gap. A secondary Workato summary of an HBR Analytic Services report states that only 6% of companies fully trust agents to autonomously run core business processes, while 86% plan to increase agentic AI investment over the next two years [T43]. Because the full HBR report appears gated, this statistic should be treated as a secondary-source summary until the original can be accessed.

## Implications for the OSSA/DUADP stack

1. The academic direction supports a contract-plus-discovery stack. OSSA's manifest captures identity, capabilities, tools, governance, cost, and trust; DUADP publishes and verifies discoverable resources [T01][T02][T04][T05].
2. A NIST-aligned agent identity story is not optional. Agents need unique identities, scoped authorization, delegation records, revocation, and non-repudiable audit trails [T12][T17][T38].
3. Protocol design is policy design. If protocols encode identity, authority, provenance, and safety metadata, they can shift the cost of unsafe agent behavior earlier in the lifecycle [T09][T12][T14].
