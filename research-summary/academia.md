# Academia, Research, and Education

Prepared on June 1, 2026.

## Cornell and eCornell

Cornell's Agentic AI Architecture certificate is a useful education signal
because it treats agents as an architecture discipline, not a prompting trick.
The program moves from LLM fundamentals and failure modes into RAG, structured
data access, tools, memory, multi-agent workflows, agentic protocols,
governance, risk, security, and human oversight [S07]. The course description
explicitly frames the transition as moving from "AI that chats" to "AI that
acts" [S07].

The companion course on building agents with tools, memory, and agentic
architecture names the core agent components as the model, system prompt,
tools, and memory. It also covers prompt chaining, routing, parallelization,
orchestrator-worker designs, reflection loops, handoffs, and MCP for
standardized tool interfaces [S08]. This curriculum mirrors production
architecture trends: specialized agents, deterministic workflow boundaries,
tool contracts, and explicit governance controls.

Cornell's enterprise-ready workshop material emphasizes the difference between
a working demo and a system that engineering teams, security reviewers, and
auditors can trust. It highlights LangGraph state machines, named nodes,
human approval gates, OWASP LLM Top 10 threat modeling, RAG architecture
patterns, tool permissions, and monitoring plans [S07][S08]. That is aligned
with the broader research theme: agentic reliability is a systems problem.

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard's Agent Protocols Tech Tree is an interactive map of open protocols
supporting AI agents. It is framed as a "video game tech tree" because protocol
development is a path-dependent sequence: each protocol solves a missing layer
and enables the next layer to emerge [S09][S10]. The Harvard writeup argues
that agents are easy to build and hard to regulate, making protocols
especially important because they shape what forms of agent behavior are easy
for builders to implement [S09].

The Agent Protocols Tech Tree is also valuable because it treats open
protocols as evidence. Protocols show what builders agree on, what is gaining
adoption, what messages move across the wire, and which capabilities still
lack social proof [S10]. This is the same reason TCP/IP, DNS, HTTP, and other
internet protocols became policy-relevant: they made certain architectures
natural and others costly.

Harvard Journal of Law & Technology's agentic web analysis adds a governance
frame. It argues for a layered governance architecture: identity through DIDs
and verifiable credentials, delegation/standing through verifiable intent
mandates, and runtime control through monitoring, enforcement constraints, and
adaptive oversight [S15]. The article's "Know Your Agent" framing asks four
questions every agent system must answer: who the agent is, on whose behalf it
acts, what scope of authority it has, and what audit record proves compliance
[S15].

## MIT AI Agent Index

MIT's 2025 AI Agent Index is one of the strongest empirical sources for the
state of deployed agents. It documents 30 prominent deployed agentic systems
across 1,350 fields and finds a persistent transparency gap: developers publish
more capability information than safety, evaluation, and ecosystem-interaction
information [S11][S18].

Key findings:

| Finding | Evidence |
| --- | --- |
| Agent releases are accelerating | 24 of 30 agents were released or had major agentic updates in 2024-2025 [S12]. |
| Autonomy is rising | Browser agents operate at Level 4-5; enterprise agents often deploy at Level 3-5 after low-autonomy design [S12]. |
| Safety disclosure is sparse | Of 13 frontier-autonomy agents, only 4 disclose agentic safety evaluations [S11][S12]. |
| System cards are rare | Only 4 of 30 provide agent-specific system cards [S11][S18]. |
| Internal and third-party testing are missing | 25 of 30 disclose no internal safety results; 23 of 30 disclose no third-party testing [S11][S12]. |
| Web conduct is unsettled | There are no established standards for how agents should behave on the web [S11][S12]. |

The Index also reports protocol adoption signals: MCP is the dominant
interoperability standard among the studied agents, while A2A support is
present but concentrated among enterprise systems [S18]. This supports the
layered-stack view: MCP is nearer production ubiquity for tool access; A2A is
still moving from draft/adoption into broad enterprise use.

## MIT Sloan and management guidance

MIT Sloan's 2026 guidance is cautious. It states that agentic AI is not ready
for prime time because hallucinations, mistakes, prompt injection, and other
hijacking methods have slowed adoption [S13]. At the same time, Thomas
Davenport and Randy Bean predict that agents will handle most transactions in
many large-scale business processes within five years [S13]. The practical
recommendation is to begin building internal capability and reusable use cases
while retaining human-in-the-loop guardrails [S13].

MIT Sloan's explanatory material also stresses governance, data quality, trust,
security, accountability, and robust permission systems. As agents acquire
access to enterprise datasets and workflow systems, organizations need
permanent monitoring, formal strategy, risk frameworks, and clear lines of
responsibility for errors or harm [S14].

## Academic papers and surveys

Recent academic literature is converging on agent communication and security as
first-order research areas. A 2025/2026 survey of LLM-driven AI agent
communication defines agent communication as a foundational pillar and analyzes
protocols including MCP and A2A, their security risks, and defense
countermeasures [S16]. Another security threat-modeling paper compares MCP,
A2A, Agora, and ANP and argues that traditional CIA security concepts must be
reinterpreted for context windows, coordination, and multi-agent systems
[S17].

These surveys identify recurring risks:

- Direct and indirect prompt injection through documents, websites, emails, or
  retrieved context [S16][S17].
- Unauthorized tool execution and tool-chain privilege escalation [S16][S17].
- Context manipulation, data/memory poisoning, and long-context hijacking
  [S16][S17].
- Protocol-layer vulnerabilities in host-to-tool and agent-to-agent
  communication [S16][S17].
- Missing identity, provenance, and runtime authorization controls [S17].

## Education-to-production implication

The education and research sources align on a single point: production agents
need more than model skill. They require explicit state management, tool
contracts, memory boundaries, protocol-aware integration, identity,
authorization, auditability, and human oversight. OSSA/DUADP, NIST's identity
project, OWASP's agentic security guidance, and the MIT Agent Index all point
to the same missing controls [S01][S02][S11][S59][S61].
