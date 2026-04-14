# Security and Governance Findings (2025-2026)

This document synthesizes current evidence on agentic AI security risks, governance gaps, and practical controls.

## 1) Threat model baseline for agentic systems

Across OWASP, NIST, and field reports, three threat categories dominate:

1. **Instruction-layer compromise**
   - Prompt injection (direct/indirect, multimodal variants).
   - Jailbreaking and policy override attempts.
2. **Authorization and identity failures**
   - Shared credentials/service accounts for multiple agents.
   - Over-privileged tool access and weak delegation boundaries.
3. **Runtime control and observability deficits**
   - Insufficient audit trails.
   - Delayed/manual security review cycles that miss autonomous actions in real time.

References: [R41][R42][R43][R40]

## 2) Prompt injection and excessive agency are still first-order risks

OWASP's LLM01 (Prompt Injection) and LLM06 (Excessive Agency) remain directly relevant to agent stacks that call tools or trigger external actions.

Key guidance includes:

- constrain role/capability scope,
- validate outputs and enforce deterministic post-processing,
- apply least-privilege access,
- require human approval for high-risk actions,
- continuously test with adversarial scenarios. [R42]

This aligns with production incidents reported in practitioner narratives where agents executed unintended privileged actions through prompt-path manipulation. [R39][R40]

## 3) Identity and authorization: the central governance problem

NIST NCCoE's concept paper explicitly focuses on software/AI agent identity and authorization controls, highlighting authentication, authorization, auditing, non-repudiation, and prompt-injection mitigation as core project areas. [R43]

This is consistent with enterprise survey evidence showing many teams still do not model agents as first-class identities and continue relying on shared keys. [R39][R40]

### Implication

"Model safety" is necessary but insufficient. Agent security posture is increasingly an IAM and policy-enforcement problem.

## 4) Adoption-governance gap (quantitative snapshot)

Gravitee's 2026 survey (vendor report; broad sample claimed) reports:

- 81% beyond planning,
- 14.4% full security/IT approval coverage,
- 88% confirmed or suspected incidents,
- <22% treat agents as independent identities.

Even with vendor-report caveats, these figures are directionally consistent with MIT findings about transparency/safety reporting deficits in deployed agent systems. [R39][R40][R10]

## 5) Web-scale governance context

Policy commentary and bot-traffic reporting indicate substantial automation pressure on web infrastructure:

- "nearly half" web traffic from non-human sources is now a recurring claim in bot studies,
- policy discussions emphasize the need for improved protocol-level handling and human-vs-automation differentiation mechanisms.

References: [R45][R46]

## 6) Protocol-aware security controls (what to implement now)

### 6.1 Identity and trust

- Assign unique agent identities (non-shared credentials).
- Use signed manifests and verifiable metadata where supported.
- Introduce trust-tier gating for discovery and execution pathways.

(Examples: DID/trust constructs in DUADP/ANP/OSSA materials.) [R02][R22][R05]

### 6.2 Authorization and least privilege

- Map tools/actions to fine-grained policy controls.
- Separate low-risk read operations from high-risk write/transaction operations.
- Require human approval for irreversible/high-impact actions.

### 6.3 Input/output controls

- Treat all external context as untrusted by default.
- Sanitize and classify retrieved context prior to model consumption.
- Validate outputs before execution in downstream systems.

### 6.4 Runtime and audit

- Enable trace-level telemetry for generation/tool/handoff lifecycles.
- Maintain immutable event logs for who/what/when decisions.
- Prefer continuous monitoring over periodic audits for autonomous tasks.

## 7) Recommended governance architecture (reference model)

A practical layered governance pattern:

1. **Contract layer**: explicit manifest of capabilities, allowed tools, risk levels.
2. **Discovery layer**: trust-aware registry/discovery controls.
3. **Execution layer**: policy enforcement, runtime mediation, and guardrails.
4. **Assurance layer**: tracing, incident response, evaluation loops, and red-team testing.

This architecture reflects directionality in NIST, OWASP, and ecosystem standards trajectory.

## 8) Known evidence quality constraints

- Security incident percentages are from vendor surveys, not regulator datasets.
- Several high-detail incident examples are narrative rather than independently adjudicated forensic reports.
- Nevertheless, independent sources converge on the same core risk areas, strengthening confidence in priority ordering.

## 9) Bottom line

The highest-leverage security investment in 2026 is not only model hardening; it is:

- identity-aware architecture,
- strict authorization boundaries,
- continuous runtime observability,
- human-governed escalation paths.

Organizations that skip these layers will likely experience scale-up fragility regardless of protocol/framework choice.
