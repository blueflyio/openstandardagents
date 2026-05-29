# Academia and research: autonomous agents, protocols, governance, and risk

Generated: 2026-05-29.

## Cornell: agentic AI as an architecture and governance discipline

Cornell's eCornell Agentic AI Architecture certificate frames agents as the
move from "AI that chats" to "AI that acts." The curriculum starts with LLM
fundamentals, hallucinations, context limits, prompt/context engineering, and
RAG, then extends into tools, memory, agentic architectures, multi-agent
workflows, and protocols such as MCP [S06]. The program explicitly includes
governance, risk, security, and human oversight, which signals that universities
are treating agent building as an operational discipline rather than only a
modeling topic [S06].

The notable educational pattern is end-to-end: teach model failure modes, then
grounding, then tool use, then agent protocols, then governance. This aligns
with production lessons from security reports: the hardest problems occur when
tool-using agents leave the safe boundary of a chat transcript [S06][S49].

## Harvard: protocols as the policy surface of the agentic web

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT) maps the
protocol stack behind agents as a visual "tech tree." It argues that open
protocols are an "x-ray" of an emerging technology because they reveal what
builders agree must interoperate [S07][S08]. The blog compares the agentic
moment with the early internet: agents are easy to build, distributed, and hard
to regulate, so the protocols that make some behaviors easy and others hard may
shape the ecosystem more effectively than after-the-fact policy alone [S07].

The APTT source repository emphasizes educational transparency: each protocol
has metadata, raw messages, diagrams, and detail pages so non-technical viewers
can understand the purpose while technical viewers inspect wire-level payloads
[S08]. This matters for governance because agent standards are still being
defined; the tool helps policymakers see how MCP, A2A, identity, commerce, and
other standards sit in relation to one another [S07][S08].

Harvard Journal of Law and Technology's "On the Institutional Origins of the
Agentic Web" adds the legal/governance dimension. It argues that the key
question is how agents identify themselves: through proprietary platform
mechanisms or portable protocol-based credentials. The article describes Know
Your Agent (KYA) as a minimum identity/accountability layer requiring agent
identity, principal-agent linkage, delegation parameters, and auditability [S11].

## MIT: deployment is accelerating faster than disclosure

The 2025 MIT AI Agent Index catalogues 30 prominent deployed agentic systems
across product overview, accountability, technical capabilities, autonomy and
control, ecosystem interaction, evaluation, and safety [S09]. Its strongest
governance finding is the transparency gap. Developers disclose capabilities
more often than safety practices; among 13 high-autonomy agents, only 4
disclosed agentic safety evaluations; 25 of 30 disclosed no internal safety
results; and 23 of 30 disclosed no third-party testing information [S09].

The Index also reports that web-conduct standards remain unsettled. Most agents
do not clearly explain robots.txt, CAPTCHA, or web access behavior, and browser
agents may ignore or bypass anti-bot systems. Only one indexed agent used
cryptographic request signing [S09]. This is directly relevant to DUADP, ANP,
KYA, and NIST-style identity work because the web cannot govern agent traffic
without reliable attribution and delegated authority [S01][S11][S12][S25].

MIT Sloan's 2026 decision-maker guidance is more cautious about near-term
enterprise deployment. Davenport and Bean say agentic AI is not ready for prime
time due to hallucinations, mistakes, prompt injection, and unresolved liability
issues, while still predicting that agents will handle most transactions in
many large-scale business processes within five years [S10]. The practical
message is to build internal capability and reusable use cases now, but keep
humans in the loop where risk is material [S10].

## Academic security research

Recent academic work increasingly treats agents as systems rather than models.
"Design Patterns for Securing LLM Agents against Prompt Injections" proposes
security patterns whose common principle is that once an LLM has ingested
untrusted input, it must be constrained from triggering consequential actions
that could violate integrity or confidentiality [S13]. This supports a
plan/execute or mediation architecture: use isolation, sandboxes, restricted
tools, and human confirmation rather than relying only on prompt filters [S13].

"A Survey on Autonomy-Induced Security Risks in Large Model-Based Agents"
frames risk as a function of autonomy, memory, tool use, planning, and
multi-agent coordination. It recommends module governance through contract-based
invocation, runtime validation, and integrity auditing [S14]. This aligns with
manifest-driven systems such as OSSA, where capabilities and policies are
declared before execution [S02][S03].

The 2026 arXiv survey "The Attack and Defense Landscape of Agentic AI" documents
incidents including prompt-injection access to private repositories, remote code
execution, data exfiltration through documents and email forwarding, exposed
credential data, and banking-account risks from web agents [S16]. A companion
SoK maps the attack surface across prompt injection, RAG poisoning, tool/plugin
exploits, protocol vulnerabilities, and multi-agent emergent threats [S17].

ACM AISec 2025 includes an "Achieving a Secure AI Agent Ecosystem" focus and
papers on prompt injection, jailbreak evaluation, AI/ML security, trust,
reputation, and access control [S15]. The research direction is clear: agentic
security is moving from model jailbreaks toward runtime traces, tool mediation,
graph/topology defenses, and policy enforcement across multi-agent systems
[S15][S16][S17].

## Governance research implications

1. Treat agents as accountable actors, not only as model outputs. MIT, Harvard,
   NIST, and security surveys all converge on identity, delegation, and audit
   trails [S09][S11][S12][S49].
2. Make agent behavior observable. Transparency gaps are large enough that
   voluntary disclosure appears insufficient for high-impact uses [S09].
3. Use technical controls to implement policy. Human oversight, revocation,
   trust tiers, and permission boundaries must be enforced below the prompt
   layer [S12][S13][S49].
4. Prefer structured agent contracts. A manifest or passport can bind identity,
   capability, tools, cost limits, HITL thresholds, and compliance metadata in a
   way that framework-specific configuration cannot [S02][S03][S11].

## Gaps and unavailable sources

Harvard Business Review and MIT Press were not included because no accessible
primary 2025-2026 protocol/security source was found during this run. The
report therefore relies on directly accessible university, policy, arXiv, ACM,
NIST, and official project sources.
