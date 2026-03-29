# Security and Governance Research (2025-2026)

Date prepared: March 29, 2026

## 1) Security posture: adoption outpacing control

One of the strongest quantitative signals in this research set is that deployment is moving faster than governance implementation.

Gravitee's 2026 AI agent security report pages and write-up highlight:

- 81% of teams beyond planning,
- 14.4% full security approval coverage,
- 88% confirmed or suspected incidents,
- roughly 22% treating agents as independent identities. [SRC-GRAVITEE-REPORT] [SRC-GRAVITEE-BLOG]

These numbers should be treated as vendor-sponsored survey data, but they are directionally aligned with broader security commentary from NIST/NCCoE and major enterprise guidance sources.

## 2) Threat model priorities

Across protocol specs and security commentary, the top recurring practical risks are:

1. Prompt injection into tool-using agents.
2. Over-permissioned agents and shared credentials.
3. Weak identity/authorization boundaries between agents and systems.
4. Lack of continuous monitoring and audit trails for autonomous actions. [SRC-MCP-SPEC] [SRC-NIST-NCCOE-2026] [SRC-DEVTO-PROMPT-INJECTION]

### Prompt injection as operational risk

The MCP spec includes trust and safety guidance emphasizing explicit user consent and caution around tool descriptions and invocation controls, but it also notes security cannot be "enforced by protocol alone"; implementors must build consent, access controls, and protections. [SRC-MCP-SPEC]

Practitioner-oriented writeups (for example Dev.to security posts) provide incident-like examples of injection + overprivilege chains. These are useful for failure pattern intuition but should be treated as anecdotal unless independently corroborated. [SRC-DEVTO-PROMPT-INJECTION]

## 3) Identity and authorization frameworks

### NIST/NCCoE concept paper direction

The NCCoE concept paper announcement (Feb 5, 2026) explicitly frames software and AI agent identity + authorization as a needed project area and asks for feedback on:

- identification/authentication,
- authorization,
- auditing/non-repudiation,
- prompt injection controls. [SRC-NIST-NCCOE-2026]

This is important because it shifts policy conversations toward concrete IAM controls for autonomous software actors, not only model behavior.

### Protocol-level identity patterns

Different protocol ecosystems implement identity differently:

- MCP: emphasizes host consent and secure integrations, leaves many identity policy details to implementations. [SRC-MCP-SPEC]
- A2A: uses Agent Cards + standard auth schemes (OAuth2/Bearer etc.) and enterprise security patterns. [SRC-A2A-SPEC] [SRC-A2A-DISCOVERY]
- DUADP/OSSA/ANP ecosystems: emphasize DID-based identity + attestations + trust tiers in varying forms. [SRC-DUADP-HOME] [SRC-DUADP-DOCS] [SRC-OSSA-HOME] [SRC-ANP-README]

## 4) Governance controls recommended across sources

Common control recommendations, synthesized:

1. Treat each agent as a first-class identity principal (not shared service key persona).
2. Use least privilege and scoped credentials per task/context.
3. Gate high-risk actions with explicit policy checks and approvals.
4. Enforce auditability: action logs, tool-call provenance, and incident playbooks.
5. Keep human-in-the-loop for high-impact/irreversible operations.
6. Continuously validate behavior with red-team/prompt-injection testing.

These controls are reflected in enterprise-oriented protocol guidance and security analyses, even when terminology differs. [SRC-MCP-SPEC] [SRC-NIST-NCCOE-2026] [SRC-GRAVITEE-REPORT] [SRC-MIT-SLOAN-2026]

## 5) University and policy discussions relevant to governance

Harvard ecosystem writing (LIL/JOLT/HKS-affiliated publications) emphasizes institutional design and protocol governance as key determinants of agentic-web outcomes:

- open protocols as governance instruments,
- identity/delegation/accountability as infrastructure concerns,
- human-vs-bot traffic and network policy concerns. [SRC-HARVARD-LIL-APTT] [SRC-HARVARD-JOLT-AGENTIC-WEB] [SRC-HKS-POLICY-REVIEW]

These are policy analyses, not implementation standards, but they help frame why protocol-layer governance matters.

## 6) Incident and measurement gaps

MIT AI Agent Index work identifies safety/transparency disclosure gaps among highly autonomous systems and highlights fragmented accountability across model providers, agent builders, and deployment operators. [SRC-MIT-INDEX-DETAILS] [SRC-MIT-INDEX-2025]

This means organizations should not assume vendor-provided assurances alone are sufficient evidence for safe operation in production-specific contexts.

## 7) Security program checklist for 2026 deployments

For practical implementation:

- **Identity**: unique agent identities, no shared long-lived credentials.
- **Authorization**: policy-as-code gates on tool invocations and data classes.
- **Isolation**: sandbox high-risk execution and external content handling.
- **Observation**: centralized logging/tracing + anomaly detection.
- **Testing**: routine adversarial testing including prompt injection scenarios.
- **Governance**: escalation paths and human approvals for critical actions.
- **Interoperability governance**: choose protocol combinations intentionally (MCP + A2A + discovery/contract layers) and define boundaries between them.

---

## Notes on evidence quality

- Strongest evidence: official specs, official announcements, and major measurement projects.
- Moderate evidence: vendor reports with published methods/sample sizes.
- Supplemental evidence: practitioner blog incidents and security narratives, used with caution and explicit labeling.
