# Academia and Education Findings (2025-2026)

Date prepared: 2026-03-15

## 1) Cornell University (eCornell): applied architecture track

Cornell’s Agentic AI Architecture certificate is positioned as a practical path from LLM fundamentals to deployable agent systems, with explicit coverage of:
- tool-using agent architectures,
- multi-agent workflow design,
- RAG implementation,
- and governance/risk-aware deployment concerns.[R43][R44]

The curriculum structure is notable because it mirrors what enterprise teams actually need in production: architecture patterns, orchestration methods, and integration choices rather than model theory alone.[R43]

## 2) Harvard ecosystem: protocol governance framing

Harvard Library Innovation Lab’s Agent Protocols Tech Tree (APTT) frames open protocols as the main coordination mechanism for a decentralized agent ecosystem, analogous to how TCP/IP and DNS shaped internet interoperability.[R45][R46]

The associated Berkman Klein context emphasizes that protocol layers make implicit social/technical agreements visible: what agent builders are willing to standardize, and what remains contested.[R47]

Practical takeaway from Harvard sources: if agents are easy to build and hard to centrally regulate, **open protocol governance becomes the enforceable design surface**.[R45]

## 3) MIT: empirical maturity and transparency gaps

MIT’s 2025 AI Agent Index documents material transparency gaps:
- capability details are often documented more than safety evidence,
- third-party evaluation disclosure is uncommon,
- and there is no mature standard for acceptable autonomous web conduct.[R39][R40][R41]

MIT Sloan’s 2026 decision guidance adds an operational caution: organizations should expect rapid utility gains, but hallucinations and prompt-injection risks still block “hands-off” autonomy; human oversight remains necessary in high-impact flows.[R42]

Combined MIT interpretation: deployment momentum is strong, but governance and safety disclosure standards are lagging.

## 4) Other academic and research channels (ACM/arXiv)

Security literature in 2025 shows strong focus on **indirect prompt injection** against tool-using agents:
- AGENTVIGIL (ACL Findings 2025) reports high attack success in black-box settings.[R52]
- MELON proposes provable or semi-formalized defensive mechanisms for trajectory-level detection.[R53]
- RTBAS introduces robust tool-layer controls and reports strong benchmark performance.[R54]

These papers support the same pattern seen in industry: agent risk is often a systems/architecture problem, not solely a foundation-model problem.

## 5) Governance and management literature (HBR and related)

Harvard Business Review coverage in 2025-2026 highlights the organizational side of agent deployment: supervision design, new “agent manager” responsibilities, and operating-model changes.[R48][R49]

**Limitation:** some HBR material is paywalled; conclusions here are based on available summaries and corroborated with accessible primary research and vendor/standards documentation.[R48][R49][R40]

## 6) Academic implications for implementation

1. **Protocol literacy is now a core engineering skill** (MCP/A2A/discovery/identity), not an edge specialization.[R45][R47]  
2. **Evaluation disclosure should be treated as part of product quality**, not optional trust signaling.[R40]  
3. **Human-in-the-loop governance is still required** for consequential actions in 2026 deployments.[R42][R52]  
4. **Education is shifting toward full lifecycle competence**: architecture, orchestration, risk, and compliance.[R43]
