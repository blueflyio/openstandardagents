# Academia and Research Notes (2025-2026)

Prepared: 2026-04-01

## Scope

This document summarizes university and research-center perspectives on:
- autonomous agents and agentic AI deployment,
- protocol and interoperability governance,
- safety and transparency gaps,
- and identity/security architecture for agent ecosystems.

---

## 1) Cornell (eCornell): curriculum-level framing of agentic architecture

eCornell's Agentic AI Architecture certificate explicitly bridges:
- LLM fundamentals and hallucination behavior,
- RAG and context engineering,
- tool/memory-based agent design and agentic protocols,
- governance, risk, security, and human oversight. [T23]

### Why it matters

Cornell's structure is useful because it mirrors what production teams are discovering:
1. model quality alone is insufficient,
2. retrieval and tool integration are practical prerequisites,
3. governance and oversight are first-class design constraints, not "phase 2" add-ons. [T23]

---

## 2) Harvard: protocol governance as internet infrastructure question

### 2.1 Library Innovation Lab (APTT)

Harvard Library Innovation Lab's Agent Protocols Tech Tree frames protocols as "shared languages" that reveal what builders must coordinate on, similar to early internet standards. [T24]

The central claim is that agents are easy to build ("models using tools in a loop"), hard to centrally regulate, and therefore materially shaped by open protocol design choices. [T24]

### 2.2 Harvard legal-policy framing

Harvard Journal of Law & Technology commentary on the "agentic web" frames governance as a contest between:
- proprietary platform permission systems, and
- interoperable protocol-based identity/delegation systems. [T33]

It emphasizes:
- accountable attribution for agent actions,
- portable identity/delegation credentials,
- and protocol-level duty-of-care / oversight structures. [T33]

---

## 3) MIT and MIT-adjacent research signals

### 3.1 MIT AI Agent Index (2025 edition)

The 2025 AI Agent Index provides structured public annotation across 30 deployed agents and 45 fields. [T25][T26][T27]

Key findings:
- release acceleration and rising autonomy,
- transparency asymmetry (capability disclosure > safety disclosure),
- weak third-party testing disclosure,
- unresolved web-conduct norms for browser agents. [T26]

The Index documents that only a minority of high-autonomy systems publicly disclose agentic safety evaluation details. [T26]

### 3.2 MIT Sloan management perspective

MIT Sloan's 2025-2026 guidance is directionally pro-adoption but warns that:
- hallucinations and prompt-injection pathways still block "prime-time" autonomy,
- human-in-the-loop controls remain necessary in many high-impact workflows. [T28][T29]

It also predicts significant growth in agent transaction handling over the next five years, while emphasizing organizational design and governance as bottlenecks. [T29]

---

## 4) Other scholarly references (arXiv/ACL) relevant to protocol and security

### 4.1 Interoperability surveys and protocol taxonomy

An interoperability survey compares MCP, ACP, A2A, and ANP across discovery mode, interaction pattern, and security model, and proposes phased adoption patterns (tool access -> messaging -> delegation -> networked discovery). [T68]

### 4.2 Security analyses for protocol ecosystems

Recent protocol-security papers analyze:
- cross-protocol threat surfaces and lifecycle risks,
- conformance/security-principle gaps,
- and composition risk where individually secure protocols become unsafe when combined. [T65][T66]

### 4.3 Prompt-injection empirical red-teaming

ACL 2025 work (AGENTVIGIL) reports strong black-box attack success on indirect prompt-injection tasks, including transfer to unseen tasks and practical web-agent misuse scenarios. [T77]

Related benchmark work (AgentDojo) is now widely used for evaluating attack/defense performance on realistic agent tasks. [T72]

---

## 5) Practical synthesis for research consumers

Across Cornell/Harvard/MIT and adjacent literature, five stable conclusions emerge:

1. **Protocol literacy is now core AI literacy** for agent builders. [T24][T26]
2. **Autonomy is scaling faster than assurance evidence** in public disclosures. [T26]
3. **Agent security is architecture-dependent**, especially at the instruction/data and tool-boundary layers. [T77][T63]
4. **Identity and authorization for agents are still immature standards domains**, now under active NIST/NCCoE framing. [T30]
5. **Interoperability will likely be multi-protocol**, not winner-take-all: MCP, A2A-class coordination, UI protocols, and discovery/contract layers coexist. [T06][T10][T14][T68]

---

## 6) Gaps and limitations

- Some influential material is policy commentary rather than peer-reviewed empirical evaluation. [T24][T33]
- Several enterprise-facing sources are advisory/editorial and should not be treated as causal impact evidence.
- Some HBR and conference resources are paywalled or partially accessible from public endpoints; where full text was unavailable, metadata-only citation is used. [T70]

