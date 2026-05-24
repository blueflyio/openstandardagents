# Academia, Education, and Policy Research

Prepared on May 24, 2026.

## Cornell University and eCornell

Cornell's eCornell Agentic AI Architecture certificate is a practical bridge
from LLM fundamentals to deployed agent systems. The curriculum starts with LLM
behavior, prompting, context engineering, and hallucination failure modes. It
then moves into RAG over private and current data, including Text-to-SQL and
GraphRAG patterns, before teaching tool-using agents with memory and multi-agent
workflows [S14].

The agent course defines agents as LLMs equipped with tools, memory, and
reasoning capabilities that can execute workflows autonomously. It covers prompt
chaining, routing, parallelization, orchestrator-worker designs, reflection
loops, agent communication through protocols and handoffs, and MCP as a
standardized tool interface [S14]. The program ends with AI strategy,
governance, ethics, risk, security, and human oversight, which matches the
production consensus that reliability and control must be designed into the
architecture rather than added after deployment [S14] [S20].

Cornell also offers a workshop on enterprise-ready agents that focuses on
moving from prototypes to dependable systems. The course description emphasizes
explicit LangGraph state machines, small named nodes, structured atomic
workflows, approval gates for high-risk actions, OWASP LLM Top 10 threat
models, and control/risk packs with permission gates and monitoring [S14].

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT), launched on
February 23, 2026, frames protocols as the central governance lever for a
fast-moving agent ecosystem [S15]. The post argues that an open protocol is a
shared language used by multiple projects to interoperate or compete. Protocols
serve as an "x-ray" of what builders care about, what they have implemented, and
where the ecosystem may go next [S15].

The Harvard post explicitly compares today's AI agent ecosystem with the early
internet. TCP/IP, SMTP, DNS, FTP, HTTP, and SSL evolved through "rough consensus
and running code"; similarly, agents are too distributed and easy to reproduce
for a single regulator or company to define every rule [S15]. The article cites
the common definition of agents as "models using tools in a loop" and argues
that because agents are a technique rather than a single service, open
protocols may shape behavior by making some agent designs easier than others
[S15].

APTT is intentionally not authoritative. It is a presentation-quality, evolving
map that starts at inference APIs and moves through tool calling, MCP,
agent-to-agent coordination, commerce, identity, and speculative future layers
[S15]. Its value is pedagogical: it makes wire-level protocol flows visible to
technical users and explains why each standard exists for non-technical policy
audiences [S15].

## MIT AI Agent Index

MIT's 2025 AI Agent Index is one of the most useful empirical baselines for
deployed agent systems. It annotates 30 prominent agents across 45 fields in
six categories: company/accountability, technical capabilities, autonomy and
control, ecosystem interaction, safety/evaluation/impact, and related
dimensions [S16].

Key findings:

| Finding | MIT result |
| --- | --- |
| Rapid deployment | 24/30 agents launched or received major agentic updates in 2024-2025 |
| Autonomy split | Chat agents remain L1-L3; browser agents often L4-L5; enterprise agents may run L3-L5 once deployed |
| Safety transparency | Only 4/13 frontier-autonomy agents disclose agentic safety evaluations |
| Missing safety results | 25/30 disclose no internal safety results; 23/30 disclose no third-party testing |
| Web conduct | No established standards for agent behavior on the web |
| Model concentration | Most agents depend on GPT, Claude, or Gemini model families |

The Index is especially important because it connects agent governance to
ecosystem behavior. Browser agents may ignore robots.txt or mimic human browsing
without shared norms, and only one indexed agent uses cryptographic request
signing [S16]. The Index concludes that model-level safety evaluation is
insufficient because agentic risk depends on downstream context, tools, autonomy
level, and distributed responsibility across multiple actors [S16].

## MIT Sloan guidance for 2026

MIT Sloan's 2026 guidance is cautious but not dismissive. Davenport and Bean
say "agentic AI isn't ready for prime time -- yet" because hallucinations,
mistakes, prompt injection, and other hijacking methods remain blockers [S17].
The same guidance predicts that AI agents may handle most transactions in many
large-scale business processes within five years, making the right response
neither full adoption nor avoidance, but targeted capability building,
guardrails, and reusable enterprise use cases [S17].

MIT Sloan also points to an organizational gap: companies have moved faster on
individual generative AI use than on enterprise workflows and shared
infrastructure [S17]. That is consistent with agent security research: agents
need shared identity, logging, policy, evaluation, and deployment platforms,
not just local prompt experiments [S18] [S19].

## Other university and academic sources

Recent academic work treats agentic systems as distributed, tool-using,
security-critical systems rather than chatbots.

* "The Attack and Defense Landscape of Agentic AI" surveys literature and web
  documents from 2023 through October 2025, building a taxonomy across agent
  components and defenses. It includes prompt injection, memory poisoning,
  tool security, RAG security, isolation, and access control [S21].
* "From Stateless Queries to Autonomous Actions" proposes a seven-layer attack
  surface model covering foundation, cognitive, memory, tool execution,
  multi-agent coordination, ecosystem, and governance layers. It argues that
  agent security must be treated as distributed systems security embedded in an
  adversarial ecosystem [S21].
* MCP security papers identify protocol-specific threats such as tool
  poisoning, installer spoofing, unauthorized access, malicious MCP servers,
  shadowing, and rug-pull descriptor changes [S22].
* Harvard/Belfer and allied policy sources recommend registries, red-team and
  alignment audits, cybersecurity-by-design, progressive deployment,
  least-privilege access, logging, and human oversight for high-impact actions
  [S26].

## Education implications

The education market is converging on a three-part agent curriculum:

1. Technical foundations: LLM behavior, context windows, prompt design,
   structured outputs, tools, and RAG [S14].
2. Architecture: graph/state workflows, tool interfaces, protocols,
   multi-agent handoffs, observability, and cost controls [S10] [S11] [S20].
3. Governance: identity, permissions, human oversight, risk evaluation,
   auditability, and web conduct [S16] [S17] [S18] [S19].

The practical lesson is that agent education cannot stop at how to build a
ReAct loop. It must teach how to bound the loop.
