# Academia and Education: Agentic AI, Protocols, Governance, and Security (2025-2026)

## Cornell

Cornell’s eCornell **Agentic AI Architecture** certificate is a strong indicator of how higher education is packaging agentic AI skills for practitioners, not only researchers. The program is explicitly structured from LLM basics to RAG, then to tool-using agents, and finally to governance, risk, security, and oversight [A01].

Notable curriculum signals from Cornell:

- Agent architecture is taught as **LLM + tools + memory + orchestration patterns**
- Protocol literacy is included (MCP appears in the agent course description)
- Governance and human oversight are treated as a required engineering competency, not only policy content [A01]

This supports a broader trend: universities are treating agentic systems as an applied systems-engineering discipline with security and policy built into the baseline.

## Harvard

Harvard-affiliated work is highly active in protocol mapping and governance framing:

1. **Library Innovation Lab (LIL) Agent Protocols Tech Tree (APTT)** emphasizes protocols as “x-rays” of what builders actually agree on and where the ecosystem is headed [A02].
2. The LIL framing highlights a key governance point: agents are comparatively easy to create (LLM + control loop + tools), so protocol design may shape behavior more effectively than top-down centralized control alone [A02].
3. Harvard student and law-policy analysis around the “agentic web” discusses potential traffic-level disruption and institutional governance choices (platform-gated versus protocol-mediated control) [A06][A07].

The Harvard cluster of sources is especially useful for understanding the **institutional design question**: who defines authority, identity, and accountability for autonomous software acting online?

## MIT

MIT sources add both empirical indexing and pragmatic executive caution:

- The **AI Agent Index** (MIT-hosted) documents fast launch cadence and persistent transparency gaps, especially around safety evaluation and third-party testing [A03][A08].
- MIT Sloan guidance (published January 2026) states that agentic AI is advancing quickly but still constrained by hallucinations and prompt-injection risk in production-critical settings [A04].

Together, MIT’s work suggests that capability disclosure outpaces safety disclosure, and enterprise confidence can exceed actual control maturity.

## NIST/NCCoE and academic-policy bridge

NIST’s February 5, 2026 concept paper (NCCoE) is a major policy signal: identity and authorization for software and AI agents should become an explicit, standardizable security domain [A05].

Important framing from NIST:

- The issue is not only model quality; it is **agent identity, authorization, auditability, and non-repudiation**
- Prompt-injection mitigations are treated as part of identity/access architecture requirements
- The project invites industry and research input for practical standards pathways [A05]

This connects directly to the academic debate on how agent systems become governable at scale.

## Other research (arXiv, ACM, HBR/MIT Press ecosystem)

### arXiv

- Protocol-comparison work surveys MCP/ACP/A2A/ANP and reflects clear protocol specialization by boundary (tools, inter-agent messaging, network identity/discovery) [A08].
- Governance/safety papers in 2026 increasingly propose layered runtime controls, not just prompt-level filtering [A11].

### ACM

- Prompt injection remains a central research focus; recent work (for example DefensiveTokens) explores practical defense mechanisms [A10].
- Access to full ACM text can be paywalled in some environments; this report records the limitation where relevant [A10].

### HBR and MIT Press venues

- HBR commentary from 2025-2026 emphasizes organizational readiness gaps for agentic risk governance [A09].
- MIT Press ecosystem content points toward governance-by-design and red-team/distributed governance concerns, though depth varies by publication format [A10].

## Practical academic takeaways

1. Agentic AI is now taught as a production architecture discipline, not a speculative topic.
2. Protocol literacy is becoming core technical literacy.
3. Safety and governance remain unevenly documented relative to capability claims.
4. Identity + authorization is emerging as the backbone issue for secure autonomous operation.

---

For full source links and citation keys, see `reading-list.md`.
