# Security and governance (2025-2026)

## 1) Current risk picture

The strongest quantitative signal in this run is the Gravitee 2026 report: rapid adoption with weak control maturity.

- 81% beyond planning
- 14.4% with full security approval
- 88% reporting confirmed/suspected incidents
- only ~22% treating agents as independent identities
- 45.6% still relying on shared API keys in agent-to-agent authentication contexts [S1][S2]

This is consistent with MIT’s transparency concerns and MIT Sloan’s warning that current systems are not yet reliably safe for unconstrained autonomy. [A5][A6]

## 2) Threat model baseline for agentic systems

Across sources, three high-priority vectors repeat:

1. **Prompt injection** from untrusted external inputs (documents, web pages, user fields, tickets, etc.).
2. **Excessive permissions / broad credentials** (especially shared keys and unconstrained tool access).
3. **Hallucinated actions** crossing from text generation into real-world side effects (payments, data writes, destructive operations). [S3][S4][A6]

DEV practitioner writeups provide concrete narratives (shipping-address injection and hallucinated wire-transfer scenario), useful for communicating blast-radius risks to engineering and security leadership. [S3][S4]

## 3) Identity and authorization as the missing control plane

NIST/CAISI and NCCoE material in early 2026 directly focuses on software/AI-agent identity and authorization, including public requests for input and a concept paper on practical adoption of identity/authorization controls for agents. [S5][S6]

Core implication: organizations should stop treating agents as generic service accounts and move to **agent-level principal identities** with auditable policy enforcement.

## 4) Minimum controls for production deployments

A practical minimum control set for 2026 deployments:

1. **Per-agent identity** (no shared API keys for meaningful actions). [S2][S6]
2. **Least-privilege tool policies** mapped to task scopes and risk tiers. [S2][S3]
3. **Action gating** for high-impact operations (approval checks, policy contracts, non-repudiation logs). [S4]
4. **Continuous monitoring** (event-level telemetry, anomaly detection, policy drift alerts), not periodic audits only. [S2]
5. **Human-in-the-loop checkpoints** for high-risk autonomy boundaries during current maturity phase. [A6]

## 5) Governance and standards alignment

Protocol adoption alone is not enough. Teams need governance mapping across:

- protocol layer (MCP/A2A/AG-UI behavior),
- contract layer (manifest, provenance, capability boundaries),
- identity/policy layer (authn/authz + audit),
- operational layer (monitoring, incident response, kill switches). [P2][P8][D6][S6]

## 6) Residual risk notes

- Public incident datasets for agent-specific breaches are still thin and uneven.
- Security metrics are often self-reported (survey bias risk).
- Some Federal Register/public-inspection pages had session/access variability during this run; NIST primary pages were accessible and used as anchor sources. [S5][S6][S7]
