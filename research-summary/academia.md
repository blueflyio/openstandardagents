# Agentic AI in Academia (2025-2026)

Date completed: April 2, 2026

## Scope

This document summarizes university and research-center material relevant to autonomous agents, protocols, governance, and security, with emphasis on Cornell, Harvard, MIT, and recent open-access papers.

---

## 1) Cornell (education-to-practice pipeline)

eCornell's Agentic AI Architecture certificate explicitly sequences:

- LLM fundamentals and prompt/context engineering.
- RAG and advanced variants (including Text-to-SQL and GraphRAG).
- Agentic architecture and multi-agent communication patterns.
- Governance, risk, security, and human oversight for responsible deployment. [SRC-29]

Why this matters: Cornell's curriculum is one of the clearest examples of a formal program translating "chatbot literacy" into production architecture and governance literacy in one track.

---

## 2) Harvard (protocol-first framing)

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT), published February 23, 2026, argues that open protocols are the most practical lens for understanding and shaping agent ecosystems, especially when agents are easy to build and hard to centrally regulate. [SRC-27]

Key takeaway from Harvard's framing:

- Protocols reveal what builders are actually standardizing now (not just what roadmaps claim).
- "Models using tools in a loop" implies governance leverage sits in tool/protocol architecture as much as in model policy. [SRC-27]

---

## 3) MIT (measurement + risk realism)

### MIT AI Agent Index (2025 edition)

MIT's 2025 Index tracks 30 deployed agentic systems and documents several structural findings:

- Releases and autonomy increased rapidly through 2024-2025.
- Safety transparency lags capability transparency.
- Many high-autonomy systems disclose little or no internal/third-party safety testing.
- Web conduct standards for agents remain unsettled. [SRC-23][SRC-24][SRC-25]

### MIT Sloan / MIT SMR

MIT Sloan Management Review's 2026 analysis (published January 5, 2026) describes agentic AI as promising but not yet fully "prime-time" due to error rates and security issues (including prompt-injection concerns), while still projecting substantial transaction automation in coming years. [SRC-26]

---

## 4) Other academic and quasi-academic literature

Recent open publications broaden the governance/security evidence base:

- **Protocol landscape survey** comparing MCP/ACP/A2A/ANP and proposing phased adoption paths. [SRC-36]
- **SAGA** architecture for governing inter-agent communication with policy and token mechanisms. [SRC-35]
- Prompt-injection benchmark and defense studies quantifying reductions in attack success through layered defenses. [SRC-34]
- NIST NCCoE concept paper (public draft) soliciting practical standards input on identity, authorization, auditing, and prompt-injection controls for AI/software agents. [SRC-30]

---

## 5) Synthesis: academic consensus trajectory

The strongest cross-institution alignment in 2026:

1. **Interoperability is necessary** (agents must connect to tools, peers, and enterprise systems).
2. **Governance must be built into architecture** (identity, policy, audit, and oversight cannot be afterthoughts).
3. **Transparency and safety evidence still lag deployment speed** in real-world systems. [SRC-23][SRC-24][SRC-26][SRC-27][SRC-29][SRC-30]

---

## 6) Practical implications for practitioners

- Treat protocol choice as a governance decision, not just an integration decision.
- Build training pathways that combine architecture and policy (Cornell-style sequencing is a useful model).
- Use index-style external measurement (MIT-style) to avoid self-assessment blind spots.
- Expect regulatory and standards acceleration around identity/authorization for autonomous agents.

---

## Notes on source access limitations

- Some management publications (for example, selected HBR items) are partially paywalled; when full text was unavailable, this report used open institutional, standards, and technical sources to substantiate core claims.
