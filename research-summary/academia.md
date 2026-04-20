# Academic and University Research Notes (2025-2026)

Date prepared: April 20, 2026

## 1) Cornell / eCornell: practical curriculum for agentic AI implementation

Cornell's Agentic AI Architecture certificate (eCornell) is one of the clearest examples of university-backed, applied training that explicitly spans:
- LLM foundations and prompt/context engineering
- RAG and database-grounded retrieval patterns
- agent/tool architecture and agentic protocols (including MCP references)
- governance, risk, security, and human oversight for production deployment

The public program description (April 2026 intake pages) emphasizes moving from "AI that chats" to "AI that acts" and includes explicit treatment of hallucinations, risk controls, and organizational rollout concerns. [T08]

### Why this matters

This curriculum mirrors what production teams are discovering in practice: model quality alone is insufficient without retrieval architecture, protocol integration, and governance controls. Cornell's framing is useful because it combines technical execution with organizational controls in one pathway. [T08]

## 2) Harvard: protocol-centric governance framing

Harvard Library Innovation Lab's Agent Protocols Tech Tree (APTT), published February 23, 2026, argues that open protocols are a key "x-ray" for understanding where agent ecosystems are headed. The core policy point is that agents are simple to build and distributed, so protocol design is one of the strongest practical levers for shaping behavior. [T09]

Berkman Klein's linked summary (updated March 2, 2026) reinforces that APTT is intended as a practical map for technical and non-technical audiences following protocol evolution in near real time. [T10]

### Why this matters

Harvard's contribution is less about one specific technical stack and more about institutional design: in fast-moving ecosystems, shared protocol agreements can become de facto governance before formal law catches up. [T09]

## 3) MIT AI Agent Index (2025): transparency and conduct gaps

MIT's 2025 AI Agent Index provides structured annotations on 30 systems and reports several findings relevant to standards and governance:
- 24/30 systems were released or significantly updated during 2024-2025
- frontier autonomy is rising, especially for browser/enterprise classes
- safety disclosure is sparse relative to capability disclosure
- web-conduct norms for agents remain unsettled

The "Further Details" page calls out transparency asymmetries (e.g., internal and third-party safety evidence often undisclosed) and accountability fragmentation across model builders, framework layers, and deployed products. [T11][T12]

### Why this matters

MIT's index provides one of the most useful structured, cross-vendor snapshots of the deployment-versus-governance gap in late 2025 and helps ground policy discussion in comparable metadata fields. [T12]

## 4) MIT Sloan / MIT SMR direction (2026): cautious acceleration

MIT Sloan's "Action items for AI decision makers in 2026" (published by MIT Sloan on January 15, 2026 page context) states directly that agentic AI was not yet "ready for prime time" due to hallucination/error and prompt-injection exposure, while still projecting substantial transaction automation growth over a five-year horizon. [T13]

### Why this matters

This is a pragmatic "both/and" signal from a mainstream management outlet: adoption pressure is real, but organizations should pair expansion with human-in-the-loop controls and stronger operational governance. [T13]

## 5) HBR and related management-policy commentary

Harvard Business Review's March 30, 2026 article ("AI Agents Act a Lot Like Malware...") is partially paywalled but publicly visible sections frame risk in terms of autonomous behavior and containment needs. Because full text is restricted, this should be treated as directional rather than fully auditable evidence in this research set. [T36]

## 6) Recent research papers and surveys (arXiv-focused)

### Protocol surveys
- **arXiv:2504.16736** ("A Survey of AI Agent Protocols") proposes protocol taxonomies (context-oriented vs inter-agent; general-purpose vs domain-specific) and compares security/scalability/latency dimensions. [T40]
- **arXiv:2505.02279** surveys MCP/ACP/A2A/ANP and proposes phased adoption patterns for enterprises. [T39]

### Security and prompt-injection research
- **arXiv:2602.05746** ("Learning to Inject") describes automated prompt-injection optimization via reinforcement learning against contemporary agent systems. [T41]
- **arXiv:2601.17548** presents a systematic analysis of prompt injection vulnerabilities in coding assistants and tool/protocol ecosystems. [T42]

### Why this matters

The research trajectory indicates that:
1. protocol interoperability is advancing quickly,
2. but adversarial capabilities are also industrializing,
3. making identity, authorization, and runtime controls central research and engineering priorities. [T39][T41][T42]

## 7) Key academic synthesis

Across Cornell, Harvard, MIT, and current paper streams, the strongest common themes are:
- open protocols are becoming structural infrastructure, not optional glue [T09][T39]
- deployment is outpacing assurance evidence and evaluation transparency [T12]
- the next hard problem is operational governance (identity, policy, auditability), not just model capability [T13][T35]

## 8) Limits and evidence quality notes

- Several high-profile business publications are partly paywalled (notably HBR), limiting full-text validation. [T36]
- Survey papers are high-signal for synthesis but should be complemented with protocol specs and implementation docs for production decisions. [T39][T40]
- University and policy pages are strongest for framing and trend direction; they are not substitutes for system-level conformance testing.
