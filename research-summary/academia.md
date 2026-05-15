# Academia and Research Centers

Prepared: May 15, 2026. Tether citation IDs are defined in
`reading-list.md`.

## Cornell and eCornell

Cornell's Agentic AI Architecture certificate is an applied educational program,
not a research paper, but it is useful because it mirrors the production
learning path for agent builders. The public course page describes a four-course
sequence: LLM intuition and prompt engineering, context engineering with RAG,
agents with tools/memory/architectures, and AI strategy/governance/ethics [T01].

The program explicitly teaches the progression from "AI that chats" to "AI that
acts." It covers multi-agent workflows, protocols and handoffs, and MCP as a
standardized tool interface. It also includes governance, risk, security, and
human oversight as first-class topics, which reinforces the broader pattern that
agent education is no longer only about model prompting [T01].

Notable course details:

| Topic | Cornell framing |
| --- | --- |
| LLM foundations | Transformers, prompt/context engineering, hallucinations |
| Grounding | RAG, GraphRAG, Text-to-SQL, citations |
| Agents | Tools, memory, routing, orchestrator-worker, reflection loops |
| Protocols | Agent handoffs and MCP |
| Governance | Responsible deployment, security, oversight, ethics |

## Harvard and Berkman Klein

Harvard's Library Innovation Lab launched the Agent Protocols Tech Tree (APTT)
in February 2026 as a visual map of the evolving protocol ecosystem [T02]. The
post argues that protocols reveal what builder communities are forced to agree
on, in the same way TCP/IP, DNS, SMTP, FTP, HTTP, and SSL exposed the concerns
of the early internet [T02].

The policy significance is the claim that AI agents are hard to govern through a
single company or state. The post adopts the simple definition of agents as
"models using tools in a loop" and argues that because this recipe is easy to
recreate, protocols may be one of the strongest ways to shape agent behavior
[T02]. The APTT itself is explicitly a work in progress and "not authoritative,"
so it should be used as a map of emerging concerns rather than a standards
reference [T02].

Relevant APTT nodes include inference APIs, tool calling, MCP, agent loops,
AGENTS.md, llms.txt, Agent Cards, A2A, agent identity, web bot authentication,
payments, signed intents, and agent audit traces [T02]. The mix is important:
Harvard is not treating "agent protocols" as only message formats, but as the
full infrastructure around discovery, identity, payments, provenance, and
auditing.

## MIT AI Agent Index

The 2025 AI Agent Index, hosted by MIT and published as an arXiv/ACM FAccT 2026
paper, is the strongest academic-style source in this set [T03][T16]. It
documents 30 deployed agentic systems across 45 fields and 6 categories using
public documentation, demos, governance documents, developer correspondence, and
manual review [T03][T16].

Key findings:

| Finding | Detail |
| --- | --- |
| Acceleration | 24 of 30 indexed agents were released or had major agentic updates in 2024-2025 [T03]. |
| Transparency gap | 227 of 1,350 fields had no public information; safety and ecosystem fields were especially sparse [T03][T16]. |
| Safety disclosure | Of 13 frontier-autonomy agents, only 4 disclosed agentic safety evaluations [T03]. |
| Third-party testing | 23 of 30 had no third-party testing information [T03]. |
| Model concentration | Most agents rely on GPT, Claude, or Gemini model families [T03][T16]. |
| Web conduct | Browser agents often ignore robots.txt or are designed to bypass anti-bot systems; web-conduct standards remain unsettled [T03]. |

The Index is careful about scope. It did not experimentally test agents and only
annotated public information. That makes it useful for transparency and
ecosystem analysis, not for direct safety benchmarking [T03].

## MIT Sloan and MIT Sloan Management Review

MIT Sloan's 2026 decision-maker guidance states that agentic AI "isn't ready for
prime time - yet" because hallucinations, mistakes, and prompt injection still
require human guardrails [T17]. The same article expects that agents will handle
most transactions in many large-scale business processes within five years, so
it recommends building internal capability and reusable use cases now [T17].

MIT Sloan Management Review and BCG's November 2025 "Emerging Agentic
Enterprise" report frames agentic AI as both tool and coworker [T29][T30]. The
report is based on more than 2,000 respondents and executive interviews; BCG's
press release specifies 2,102 executives across 21 industries and 116 countries
[T30].

Important MIT SMR/BCG statistics:

| Statistic | Source-backed value |
| --- | --- |
| Current agentic AI adoption | 35% of organizations have begun using/exploring agentic AI [T30]. |
| Planned deployment | Another 44% plan to deploy agentic AI after November 2025 [T30]. |
| Agent as coworker | 76% of executives view agentic AI more as a coworker than a tool [T29][T30]. |
| Decision authority | 250% more respondents expect AI to have greater decision-making authority within three years [T30]. |

The report identifies four management tensions: scalability versus adaptability,
experience versus expediency, supervision versus autonomy, and retrofit versus
reengineer [T29]. These are management design questions rather than protocol
questions, but they explain why purely technical standards are insufficient.

## NIST, NCCoE, and CAISI

NIST's January 2026 CAISI RFI focuses on distinct security risks that arise when
AI model outputs are connected to software systems, including indirect prompt
injection, insecure/poisoned models, and agents taking harmful actions even
without adversarial inputs [T15]. The RFI asks for methods to constrain and
monitor agent access in deployment environments [T15].

NIST/NCCoE's February 2026 concept paper proposes a project on software and AI
agent identity and authorization. It asks the community for use cases,
standards, technologies, and controls for identification, authorization,
auditing, non-repudiation, and prompt-injection mitigation [T14].

NIST's AI Agent Standards Initiative, announced February 17, 2026, ties those
efforts together around interoperable, secure agent adoption. Its pillars
include industry-led standards, open-source protocol development, and research
on agent security and identity [T15].

## Other research directions to track

The arXiv AI Agent Index paper cites a broad literature on agentic risks,
benchmarks, accountability, loss of control, economic effects, and documentation
frameworks [T16]. It points to a key gap: model cards, system cards, datasheets,
AI incident databases, and safety indexes exist, but agent-specific
documentation frameworks are still immature [T16].

Recommended follow-up areas:

- Agent web conduct and bot authentication.
- Agent transparency cards that disclose autonomy level, tool access, safety
  evaluations, and web behavior.
- Evaluation of trajectories, not only final outputs.
- Identity and authorization models for non-human agent principals.
- Human-in-the-loop design patterns by risk tier.
