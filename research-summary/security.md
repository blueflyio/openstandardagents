# Security and Governance (Threats, Identity, Authorization, Controls)

Prepared: March 20, 2026

## 1) Empirical security posture signals (2026)

### Gravitee State of AI Agent Security

Reported survey findings (as published by Gravitee):

- 81% of teams beyond planning
- 14.4% with full security approval
- 88% reporting confirmed or suspected incidents
- ~21.9% treating agents as independent identities
- substantial shared API key usage and custom hardcoded auth logic [R40][R41]

These numbers indicate a governance gap: deployment is scaling faster than formal identity/security controls.

## 2) Threat model convergence

Across requested sources (vendor reporting + engineering guides + academic commentary), three risks repeatedly dominate:

1. **Prompt injection**
2. **Excessive permissions**
3. **Hallucinated actions** (not just hallucinated text) [R32][R45]

MIT Sloan's 2026 executive guidance reinforces that hallucination and prompt-injection issues are still barriers to safe autonomy at scale. [R32]

## 3) Identity and authorization frameworks

### NIST/NCCoE concept work

NIST CSRC's initial public draft on software/AI agent identity and authorization (Feb 5, 2026) explicitly targets:

- identification/authentication of agents
- authorization and delegation
- auditing/non-repudiation
- prompt-injection-aware controls [R42]

This is one of the clearest public governance signals that traditional IAM patterns are being adapted for autonomous software agents.

### Protocol-layer implications

Identity and trust are increasingly being treated as protocol-level concerns, not only app-level concerns:

- DID-style identity in DUADP and ANP narratives [R1][R14]
- contract-layer policy declarations and governance metadata in OSSA [R2][R3]

## 4) University and policy governance perspectives

- MIT AI Agent Index: strong transparency deficits in disclosed safety testing relative to capability claims. [R29][R30][R31]
- Berkman governance argument: shift from occasional review toward continuous governance for autonomous systems. [R38]
- Harvard JOLT commentary: governance conflict between proprietary platform rules and portable protocol-based accountability. [R39]

## 5) Recommended baseline controls (actionable)

### Identity and authz

- Assign unique identities to agents (avoid shared credentials by default).
- Apply least-privilege, task-scoped authorization for every tool call.
- Capture delegations and authority chains as auditable records. [R40][R42]

### Runtime safety

- Mandatory allowlists for tool execution and side-effect boundaries.
- Prompt-injection hardening at input, memory, and tool interfaces.
- Human-in-the-loop gates for irreversible or high-impact actions. [R45]

### Observability and governance

- End-to-end tracing for runs, tool calls, and handoffs.
- Policy checks before execution and post-action audit trails.
- Incident response playbooks specific to autonomous actions. [R21][R40]

## 6) Risk register (concise)

| Risk | Typical failure mode | Mitigation direction |
|---|---|---|
| Prompt injection | Untrusted content steers tool calls | input isolation, contextual sanitization, tool policy gates |
| Excessive privileges | Agent overreaches due to broad credentials | least privilege, scoped tokens, explicit approvals |
| Hallucinated actions | False assertions become executed operations | schema validation, confidence checks, HITL |
| Weak identity model | No accountable principal for actions | unique agent identity + signed action records |
| Low transparency | Unknown safety posture in deployed systems | mandatory disclosures and third-party evaluation pathways |

## 7) Evidence quality notes

- Gravitee statistics are high-value but vendor-survey based; methodology should be reviewed directly in the report artifact before regulatory use. [R40]
- Dev.to and similar blogs are useful for threat taxonomy communication but should not be the sole evidence base for policy decisions. [R45]
