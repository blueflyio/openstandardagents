# Academic Research and Education

Compiled on May 19, 2026.

## Cornell University and eCornell

Cornell's Agentic AI Architecture certificate is a professional education
program that explicitly bridges LLM fundamentals to production agent design.
The program starts with LLM behavior, prompt engineering, context engineering,
and hallucination mitigation; then moves to RAG over private and current data;
then to tools, memory, multi-agent workflows, and agentic protocols; and closes
with governance, risk, security, and human oversight [S12].

The curriculum is notable because it treats agentic AI as an architecture and
governance problem, not only a prompting problem. It includes practical patterns
such as prompt chaining, routing, parallelization, orchestrator-worker designs,
reflection loops, MCP-based standardized tool interfaces, natural-language to
SQL, GraphRAG, and implementation planning that evaluates value, feasibility,
responsible use, governance, and security trade-offs [S12].

Cornell's framing mirrors the current enterprise problem: reliable agents need
grounding, state, tools, oversight, and governance. The course description also
emphasizes when autonomous AI should and should not be used, which is consistent
with the broader literature's emphasis on bounded autonomy and human review
[S12][S27][S31].

## Harvard Library Innovation Lab and Berkman Klein Center

Harvard's Library Innovation Lab launched the Agent Protocols Tech Tree (APTT)
in February 2026 after a Berkman Klein Center workshop on "The Role of
Protocols in the Agents Ecosystem" [S13]. APTT maps the evolving stack from
inference APIs, tool calling, MCP, standard tools, agent loops, context
management, AGENTS.md, llms.txt, skills, agent cards, A2A, registries, agent
identity, web bot authentication, commerce, signed intent mandates, and audit
traces [S14].

The central insight is sociotechnical: open protocols reveal what builders
actually care about, what they are forced to agree on, and what is likely to
come next. Harvard compares this to the early internet, where protocols such as
TCP/IP, SMTP, DNS, FTP, HTTP, and SSL created shared languages through rough
consensus and running code rather than central command [S13].

The Library Innovation Lab also argues that AI agents are hard to regulate
because the recipe is simple: a model, a control loop, and tools. Because the
ingredients are widely available, protocols become a practical governance lever
that can make some agent behaviors easier to build than others [S13].

## Harvard Journal of Law and Technology

Harvard JOLT's 2026 commentary on the institutional origins of the agentic web
frames autonomous agents as delegates that act, decide, and transact for users.
It argues that the core governance choice is whether agent authority will be
defined by proprietary platform rules or by open protocols for portable
identity, verifiable delegation, and accountable behavior [S18].

The Amazon-Perplexity dispute is used as a case study. Amazon alleged that
Perplexity's Comet shopping agent evaded bot-blocking systems and falsely
identified itself as Google Chrome, while Perplexity argued that the agent was
an authorized user representative. Harvard's conclusion is that transparent
agent identification is non-negotiable, but the locus of authority could be
protocol-based rather than platform-only [S18].

The article proposes "Know Your Agent" style requirements: cryptographically
verifiable agent identity, linkage to a principal, delegation parameters,
revocability, auditability, and behavioral record keeping. That aligns closely
with the identity and authorization themes in NIST/NCCoE, DUADP, ANP, and OSSA
[S02][S09][S18][S20].

## MIT: 2025 AI Agent Index

The 2025 AI Agent Index documents 30 prominent deployed agentic systems across
six categories: product overview, company and accountability, technical
capabilities, autonomy and control, ecosystem interaction, and safety,
evaluation, and impact [S15][S16].

The key findings are sobering:

- 24 of 30 agents launched or received major agentic updates in 2024-2025
  [S15].
- Browser agents operate at Level 4-5 autonomy with limited mid-execution
  intervention, while enterprise agents often move from low autonomy during
  design to Level 3-5 when deployed [S15][S16].
- Of 13 frontier-autonomy agents, only 4 disclose any agentic safety
  evaluations [S15][S16].
- 25 of 30 disclose no internal safety results, and 23 of 30 have no
  third-party testing information [S15][S16].
- 20 of 30 support MCP, and most agents depend on GPT, Claude, or Gemini model
  families [S15].
- The Index found no established standards for how agents should behave on the
  web; browser agents often ignore robots.txt and some are designed to bypass
  anti-bot systems [S15][S16].

The Index also emphasizes accountability fragmentation. Agentic applications
often combine foundation models, scaffolding, tools, memory, user interfaces,
and deployment-specific policies. A single developer may control only part of
that chain, so model-level safety testing does not fully measure downstream
agentic risk [S16].

## MIT Sloan

MIT Sloan's 2026 guidance from Thomas Davenport and Randy Bean takes a cautious
enterprise stance. It says agentic AI is not ready for prime time because
ongoing hallucinations, mistakes, prompt injection, and hijacking risks have
slowed adoption and forced human-in-the-loop guardrails [S17].

At the same time, the guidance predicts that AI agents will handle most
transactions in many large-scale business processes within five years. The
recommended action is to begin identifying reusable agent use cases, build
internal capabilities to create and test agents, and maintain human oversight
while reliability and security mature [S17].

## arXiv and cross-university protocol research

The arXiv survey "A Survey of Agent Interoperability Protocols" examines MCP,
ACP, A2A, and ANP as four complementary standards for LLM-powered autonomous
agents [S19]. It describes the current problem as fragmented, ad-hoc
interoperability that is difficult to scale, secure, and generalize across
domains [S19].

The survey's taxonomy is useful:

- MCP: JSON-RPC client-server interface for tools, resources, prompts, and
  typed data exchange [S19].
- ACP: RESTful HTTP protocol for MIME-typed messages, synchronous and
  asynchronous interactions, session management, message routing, and discovery
  [S08][S19].
- A2A: peer-to-peer task delegation using Agent Cards and long-running task
  management [S04][S19].
- ANP: decentralized open-network discovery and collaboration using W3C DIDs
  and semantic-web style descriptions [S09][S19].

The paper proposes a phased roadmap: start with MCP for tool access, add ACP
for structured multimodal messaging and session-aware interaction, add A2A for
collaborative task execution, and extend to ANP for decentralized agent
marketplaces [S19].

## Education and research implications

1. Agentic AI education is converging on architecture: tools, memory, RAG,
   protocols, state, evaluation, and governance.
2. Academic documentation projects are filling transparency gaps that vendors
   do not yet fill themselves.
3. Protocol literacy is becoming a core agent engineering skill, similar to web
   protocol literacy in the early internet.
4. Identity, delegation, and auditability are research priorities, not just
   enterprise security details.

## Limitations

Some university and workshop materials are living resources rather than
peer-reviewed publications. The Harvard APTT explicitly describes itself as a
work-in-progress whiteboard sketch [S13]. MIT's 2025 AI Agent Index is a
snapshot as of December 31, 2025, and may omit qualifying systems or later
updates [S16].
