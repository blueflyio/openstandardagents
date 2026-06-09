# Academic research and education

Compiled on June 9, 2026.

## Cornell and eCornell

Cornell's Agentic AI Architecture certificate is a useful signal that agent
education has moved from "prompting" to systems architecture. The certificate
starts with how LLMs work and why they fail, including hallucinations and
context limits. It then moves through RAG, structured data access, tools,
memory, multi-agent workflows, agentic protocols, and responsible deployment
[S08].

The program's agent course frames agents as LLMs equipped with a model, system
prompt, tools, memory, and reasoning loop. It covers prompt chaining, routing,
parallelization, orchestrator-worker designs, reflection loops, protocols,
handoffs, and MCP as a standardized tool interface [S08]. The RAG course adds
chunking, query transformation, citations, relational-database RAG, and GraphRAG
as practical reliability controls for grounding model outputs [S08].

The governance component is especially relevant for production agents. Cornell
asks learners to produce a strategic AI implementation plan that weighs value,
feasibility, responsible use, governance, and security trade-offs [S08]. This
mirrors the production lesson from security reports: agent architecture and
governance cannot be separated.

## Harvard: protocols, governance, and the agentic web

Harvard Library Innovation Lab's Agent Protocols Tech Tree is an opinionated map
of open protocols used by AI-agent builders [S09]. Its core argument is that
open protocols provide an "x-ray" of emerging technology: they show what
builders care about, what is running, what has adoption, and what is coming next
[S09]. The project deliberately compares the agent protocol moment to the early
internet, where TCP/IP, DNS, HTTP, and adjacent standards shaped the network by
making some architectures easier to build than others [S09].

The Berkman Klein Center workshop "Towards an Internet Ecosystem for Sane
Autonomous Agents" was held on February 9, 2026. It focused on legal,
technical, and societal challenges created by agents that can plan, execute,
iterate, and interact with the outside world with limited supervision [S10].
The questions listed by the workshop are the same questions that recur in
protocol research: Can identification and interchange standards emerge from
industry or regulation? What oversight mechanisms let humans comprehend,
monitor, and supervise agent behavior? What technical interventions should
bound operational agency [S10]?

Harvard JOLT's "On the Institutional Origins of the Agentic Web" frames agents
as autonomous delegates that act, decide, and transact on behalf of principals
[S37]. It argues that the agentic web will be governed either by proprietary
platform rules or by open protocols supporting portable identity, verifiable
delegation, and accountable behavior [S37]. Its Know Your Agent model includes
agent identity, principal-agent linkage, delegation parameters, and auditability
[S37].

Harvard Business Review's 2025 articles add a business-risk perspective. HBR
describes agents as AI systems that can execute series of tasks without
specific instructions, while warning that organizations are not ready for the
risk surface [S13]. A related HBR trust discussion frames agents as a layer on
top of LLMs that can collect data, make decisions, take action, and adapt based
on results [S13]. Some HBR material is gated, so this report uses HBR for
high-level framing and relies on MIT, NIST, arXiv, ACM, and security reports
for detailed technical claims.

## MIT and adjacent research

The 2025 AI Agent Index from MIT and collaborators documents 30 prominent
deployed agents across 1,350 fields. Its key finding is a transparency gap:
developers disclose far more about capabilities than safety practices [S11].
Only 4 of 30 agents provide agent-specific system cards, 25 of 30 disclose no
internal safety results, and 23 of 30 provide no third-party testing disclosures
[S11]. Web conduct is also under-specified: the Index notes no established
standards for how agents should behave on the web, and many agents do not
clearly disclose robots.txt, CAPTCHA, or web-access practices [S11].

MIT Sloan's 2026 decision-maker guidance warns that agentic AI is not ready for
prime time because hallucinations, mistakes, prompt injection, and other
hijacking methods remain unresolved [S12]. At the same time, Davenport and Bean
expect agents to handle most transactions in many large-scale business
processes within five years [S12]. The near-term recommendation is pragmatic:
build internal capabilities, test reusable use cases, and keep humans in the
loop for guardrails [S12].

MIT Sloan's risk guidance also highlights "autonomy creep": once agents can
access multiple tools and data sources, organizations may lose visibility into
what data is flowing where and what decisions agents make independently [S12].
The recommended controls are inventorying every generative-AI tool and solution,
documenting foundation models, prompts, connected data assets, permission
structures, human-review points, and audit trails [S12].

## W3C, arXiv, ACM, and broader research

The W3C WebAgents Community Group report states that LLM-based agents renewed
interest in autonomous agents on the web and that new protocols are emerging to
let agents discover tools or interact with other agents [S16]. It identifies
the main problem as unclear alignment among MCP, A2A, ANP, Eclipse LMOS, and
other frameworks that explicitly build on web standards [S16].

"Towards a Science of AI Agent Reliability" argues that single accuracy scores
do not capture production readiness [S14]. The authors propose 12 metrics
across consistency, robustness, predictability, and safety. Evaluating 15 models
across two benchmarks, they find that recent capability gains brought only small
reliability improvements; more accurate models can remain inconsistent,
brittle, poorly calibrated, and unsafe under perturbation [S14].

"How are AI agents used? Evidence from 177,000 MCP tools" is one of the most
important empirical studies for governance. It analyzes 177,436 public MCP
tools created between November 2024 and February 2026, categorizing them as
perception, reasoning, or action tools [S15]. Software development accounts for
67% of all tools and 90% of MCP server downloads, while action-tool usage grew
from 27% to 65% over the sampled period [S15]. The policy implication is clear:
governments and enterprises should monitor the tool layer, not only model
outputs [S15].

Hou et al.'s MCP landscape and security paper, published through arXiv and ACM
TOSEM, defines an MCP server lifecycle with creation, deployment, operation,
and maintenance phases, then maps 16 threat scenarios across malicious
developers, external attackers, malicious users, and inherent security flaws
[S38]. This is a primary source for MCP-specific threat modeling.

Communications of the ACM's "Guardians of the Agents" argues that prompt
instructions alone cannot enforce safety for agents with irreversible tools
[S39]. The proposed pattern is "generate, verify, then execute": generate a
workflow, formally verify it against preconditions, postconditions, and
invariants, then execute only if it passes [S39]. This aligns with runtime
policy and admission-control proposals such as Agent Control Protocol [S42].

Agent Security Bench, accepted at ICLR 2025, formalizes attacks and defenses
for LLM agents across 10 scenarios, more than 400 tools, 27 attack/defense
methods, and 7 metrics [S40]. It reports severe vulnerabilities across system
prompt handling, user prompt handling, tool usage, and memory retrieval [S40].

## Academic themes

1. **Agents are systems, not prompts.** Academic and training sources define
   agents as model-plus-tools-plus-memory-plus-control-loop systems that must be
   evaluated at the workflow and action layers [S08][S14][S15].
2. **Transparency is missing.** The AI Agent Index shows that agent-specific
   safety disclosures, system cards, web-conduct statements, and third-party
   tests are rare [S11].
3. **Reliability is multi-dimensional.** Consistency, robustness,
   predictability, and bounded safety matter more than mean benchmark accuracy
   in production [S14].
4. **Protocol governance is institutional design.** Harvard JOLT and W3C both
   frame protocols as governance machinery: identity, authorization,
   delegation, auditability, and interoperability determine how the agentic web
   will behave [S16][S37].
5. **Tool-layer monitoring is essential.** The 177,436-tool study shows that
   agents increasingly modify environments, so model-output monitoring is
   insufficient [S15].
