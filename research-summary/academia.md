# Academia (Cornell, Harvard, MIT, and related research)

Date compiled: April 3, 2026

## Cornell (eCornell): curriculum-level operationalization of agentic AI

eCornell's Agentic AI Architecture certificate explicitly sequences training from:
- LLM fundamentals and hallucination handling,
- RAG/context engineering,
- tool-and-memory agents and multi-agent workflows,
- governance/risk/security/human oversight. [SRC-ECORNELL-AGENTIC-2026]

This is notable because it mirrors the production stack: model behavior, retrieval grounding, workflow orchestration, and governance controls in one program.

## Harvard: protocol governance framing

Harvard Berkman Klein / Library Innovation Lab's Agent Protocols Tech Tree (APTT) frames open protocols as the architectural mechanism most likely to shape agent behavior in a distributed ecosystem where centralized control is weak. [SRC-HARVARD-BKC-APTT-2026] [SRC-HARVARD-LIL-APTT-2026]

The argument is historical and institutional: internet-scale systems were steered by protocol consensus as much as by law or platform policy, and agents likely follow a similar trajectory. [SRC-HARVARD-LIL-APTT-2026]

Related Harvard policy commentary on the "agentic web" emphasizes traffic-scale concerns, including a world where bots are already a large share of internet traffic and may grow further as agents coordinate with other agents. [SRC-HKS-REVIEW-AGENTIC-WEB-2026]

## MIT: empirical transparency and readiness caution

### MIT AI Agent Index (2025)

MIT's index/paper documents 30 major agents and reports:
- acceleration of releases/major updates in 2024-2025,
- substantial transparency gaps in safety reporting,
- concentration on a few foundation model families,
- no established standards for web conduct by agents. [SRC-MIT-AGENT-INDEX-2025] [SRC-ARXIV-AGENT-INDEX-2026]

### MIT Sloan guidance

MIT Sloan's 2026 guidance states agentic AI is not yet "prime time" for broad autonomy due to hallucination and prompt-injection security issues, while still expecting significant transaction automation within about five years. [SRC-MIT-SLOAN-2026]

## Broader academic/security research (2025-2026) relevant to governance

- Comparative protocol survey (MCP/ACP/A2A/ANP) identifies interoperability need and phased adoption paths. [SRC-ARXIV-PROTOCOL-SURVEY-2025]
- Authenticated delegation work extends OAuth/OIDC logic to AI agents with auditable scope constraints. [SRC-ARXIV-AUTH-DELEGATION-2025]
- Runtime governance architectures (for example SAGA, MI9) highlight lifecycle policy enforcement, continuous authorization, and containment as necessary for production. [SRC-ARXIV-SAGA-2025] [SRC-ARXIV-MI9-2025]
- Adaptive prompt-injection research demonstrates current defenses can be bypassed at high rates, reinforcing the need for architecture-level controls. [SRC-ARXIV-ADAPTIVE-IPI-2025]

## Synthesis for academia section

Academic and education sources are converging on the same message:
1. Agent capability is scaling fast.
2. Governance and security controls are lagging.
3. Open protocol and identity standards are a practical policy lever.

This supports a "build + govern together" posture rather than feature-first deployment.
