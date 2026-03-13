# Security, Identity, and Governance

Reference date for relative time normalization: **March 10, 2026**.

## 1) Threat model consensus in 2026

Across standards bodies, university commentary, and engineering reports, the recurring risk set is:

1. **Prompt injection** (direct + indirect)
2. **Excessive permissions / over-privileged agents**
3. **Hallucinated or unsafe autonomous actions**
4. **Weak identity and non-repudiation for non-human actors**
5. **Insufficient runtime monitoring and policy enforcement** [SRC-25][SRC-26][SRC-29][SRC-31][SRC-33]

## 2) Empirical security posture signals

Gravitee's 2026 report (survey-based) highlights an adoption-control mismatch:

- 81% past planning
- 14.4% full security approval
- 88% confirmed/suspected incidents
- fewer than ~22% treating agents as independent identities [SRC-31][SRC-32]

Even as absolute values vary by sample and method, the directional signal is strong: deployment speed is outpacing identity/authorization maturity.

## 3) Identity and authorization: where standards are moving

NIST/NCCoE concept paper focus areas include:

- agent identification/authentication/authorization
- auditing and non-repudiation
- controls for prompt-injection mitigation
- applying/extending existing IAM standards where possible [SRC-29]

NIST CAISI's initiative also frames identity and secure interoperability as strategic priorities for the next phase of agent standardization. [SRC-30]

## 4) Protocol-specific security implications

| Layer | Common failure mode | Typical control pattern |
|---|---|---|
| Contract/manifest layer (OSSA-like) | Ambiguous agent capability boundaries | Schema validation, explicit capability declaration, compliance metadata [SRC-03] |
| Discovery/federation layer (DUADP-like) | Untrusted registry entries / spoofed identities | DID/signatures, trust tiers, provenance checks [SRC-01][SRC-04] |
| Agent-tool layer (MCP/ATP) | Tool misuse, data exfiltration, prompt-injected tool calls | Least privilege, tool allowlists, policy gateways, sandbox controls [SRC-08][SRC-19][SRC-29] |
| Agent-agent layer (A2A/ACP/ANP) | Delegation confusion and trust boundary drift | Capability discovery + authn/authz + signed identity metadata [SRC-10][SRC-15][SRC-17] |
| Agent-user layer (AG-UI) | UI spoofing/state desync and action ambiguity | Signed events/session controls + explicit approval checkpoints [SRC-14] |

## 5) Academic evidence on attacks/defenses

Recent literature and benchmark efforts (AGENTVIGIL, MELON, WASP) support three conclusions:

- realistic prompt-injection attack surfaces remain high
- black-box and multimodal attacks are practical
- defensive layering can improve resilience but does not remove governance needs [SRC-41][SRC-42][SRC-43]

## 6) Recommended baseline controls for 2026 programs

1. **Identity-first architecture**: each agent is a first-class principal.
2. **Policy enforcement at every boundary**: user->agent, agent->agent, agent->tool.
3. **HITL checkpoints** for irreversible/high-impact actions.
4. **Full traceability** (who delegated what, when, with which credentials).
5. **Progressive autonomy rollout** with explicit rollback criteria.

These controls align with NIST direction, MIT operational caution, and industry incident patterns. [SRC-26][SRC-29][SRC-31]
