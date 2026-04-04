# Security and Governance Findings

## Executive summary

The strongest 2025–2026 signal is that deployment is outpacing controls:
- Agent adoption is moving into production quickly,
- identity and authorization models remain underdeveloped,
- and prompt-injection plus over-privileged execution paths remain dominant failure modes. [T11][T14][T43][T44]

## Key risk categories

## 1) Prompt injection (direct and indirect)

Prompt injection has moved from isolated demos into workflow-level exploit scenarios:
- malicious instructions embedded in external content,
- indirect control over agent actions through untrusted inputs,
- and data exfiltration via over-broad tool permissions. [T47][T43]

Academic and benchmark work also shows high attack success across frontier agents under realistic red-team conditions. [T13]

## 2) Excessive permissions and weak identity boundaries

Repeated pattern:
- shared API/service credentials,
- agent access not scoped to task intent,
- opaque delegation chains among agents,
- poor provenance/auditability for agent-originated actions. [T43][T44]

This is where most enterprise incident narratives now cluster. [T43]

## 3) Hallucinated or unintended high-impact actions

Even when models are improving, autonomous task execution creates action risk:
- wrong tool/action selection,
- misapplied business logic,
- and non-deterministic behavior in critical paths without human review. [T14][T15]

## Empirical indicators

From Gravitee’s 2026 survey reporting:
- 81% past planning,
- 14.4% full security approval,
- 88% confirmed or suspected incidents,
- ~22% treating agents as independent identities. [T43][T44]

From MIT AI Agent Index:
- strong capability growth,
- weaker safety transparency and sparse standardized web-conduct controls. [T11][T12]

## Governance and standards direction

### NIST/NCCoE trajectory

NIST NCCoE’s 2026 concept paper explicitly centers:
- agent identification,
- authorization,
- auditing/non-repudiation,
- and controls for prompt injection mitigation. [T16]

This indicates policy and standards work is now shifting from abstract AI ethics to concrete IAM and control-plane implementation for agents.

### Protocol-layer implication

Security posture increasingly depends on combining:
- protocol-level interoperability (MCP/A2A/etc.),
- explicit contract metadata (OSSA-like patterns),
- identity/discovery and trust layering (DUADP/ANP-like patterns),
- and enforceable runtime policy gates (authz, approvals, rate limits). [T02][T04][T24][T30][T43]

## Recommended control model (practical)

1. **First-class agent identity**
   - unique agent principals, no shared generic service accounts where avoidable.
2. **Least-privilege tool entitlements**
   - capability/task-scoped authorization and expiring credentials.
3. **Runtime policy enforcement**
   - pre-execution checks, allow/deny policies, and high-risk action approvals.
4. **End-to-end auditability**
   - immutable event traces linking user intent, agent reasoning boundary, tools called, and outputs.
5. **Injection-aware I/O boundaries**
   - explicit separation of trusted control instructions vs. untrusted content payloads.
6. **Progressive autonomy rollout**
   - move from supervised to semi-autonomous only after measured policy compliance.

These controls align with the direction of NIST’s identity/authorization emphasis and with observed failure modes from production surveys. [T16][T43][T44]
