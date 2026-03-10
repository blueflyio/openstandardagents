# Academia and Education (2025-2026)

## 1) Cornell (eCornell): practitioner education path for agent systems

Cornell’s Agentic AI Architecture certificate and related course material focus on moving teams from LLM basics to workflow engineering: multi-agent orchestration, RAG-centered design, and production implementation patterns. [R09][R10]

Observed emphasis:

- designing collaborative agent workflows,
- integrating retrieval and grounding,
- balancing autonomy with control in applied settings.

This is notable because Cornell’s curriculum framing closely matches enterprise implementation concerns (architecture and operations), not only model internals.

## 2) Harvard: protocols as governance primitives

Harvard Library Innovation Lab’s Agent Protocols Tech Tree and companion post frame open protocols as the practical governance mechanism for a decentralized agent ecosystem, drawing parallels to early internet protocol formation (e.g., TCP/IP, DNS, HTTP). [R11][R12]

Key insight from the Harvard framing:

- agent construction is becoming democratized,
- centralized control is weak,
- protocol design choices become de facto policy and market structure.

Harvard policy commentary also highlights the macro-governance challenge of explosive AI growth and argues for systems-level institutional responses rather than only model-level fixes. [R17]

## 3) MIT: capability acceleration vs transparency/security lag

MIT’s AI Agent Index (2025) documents rapid release velocity and significant transparency gaps in public safety disclosures. It specifically highlights weak standardization around acceptable autonomous web behavior. [R13][R14]

MIT Sloan writing presents a dual message:

- near-term caution due to hallucinations, prompt-injection risk, and operational fragility,
- medium-term expectation that agents will handle a large share of enterprise transactions as reliability improves. [R15][R16]

This tension (fast capability, incomplete governance) is consistent with the wider ecosystem findings in protocols and security reports.

## 4) Other scholarly work (ACM/ACL/ICML/arXiv) on security and governance

Recent papers strengthen the argument that agent security is a systems problem:

- **Attack research**: optimized attacks and black-box indirect prompt injection show high success rates in realistic multi-agent setups. [R51][R52]
- **Defensive methods**: MELON-style masked re-execution and related runtime checks improve resilience but do not eliminate tradeoffs. [R53]
- **Runtime governance**: proposals such as MI9 and AgentGuardian move toward continuous authorization and behavior-constrained execution. [R54][R55]

## 5) Takeaways for academic-to-industry transfer

1. University work is converging on **architecture-level controls** (identity, authorization, observability), not only better prompts.
2. “Human in the loop” is shifting from manual approval of everything to **risk-tiered intervention** and policy gating.
3. Protocol literacy is now a core competency for AI engineering teams, similar to API and security architecture literacy.

## 6) Coverage limitations

- Some high-value business/governance sources (for example selected HBR pieces) are partially paywalled, so this summary relies on accessible excerpts and corroborating public sources where possible. [R18]
- “MIT Press” references in public discourse are less standardized than official MIT sites for this topic; this report prioritizes official MIT pages and peer-reviewed venues.
