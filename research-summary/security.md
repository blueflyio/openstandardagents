# Security, Identity, and Governance for Agentic AI (2025-2026)

Date: 2026-04-08

## 1) Current state: deployment is ahead of control

Security datasets and institutional analysis point to the same conclusion: enterprise agent deployment is accelerating faster than practical governance.

- Gravitee’s 2026 survey reports:
  - 81% of teams beyond planning,
  - 14.4% with full security approval,
  - 88% with confirmed or suspected incidents,
  - low rates of agent-as-identity treatment [R40][R39].
- MIT AI Agent Index reports low safety disclosure and limited third-party safety testing across leading agents [R25].

Operational implication: treat “agent in production” as a high-risk state until identity, authorization, and observability controls are demonstrably in place.

## 2) Top threat classes

### 2.1 Prompt injection (direct and indirect)

Core issue: untrusted content can alter agent behavior and trigger unintended tools/actions.

- Discussed by MIT SMR in enterprise risk framing [R27].
- Repeated in practical security guidance and incident anecdotes [R39][R42][R43].

Controls:

- strict tool argument validation,
- input/output filtering and policy gates,
- high-risk action confirmation steps (human-in-the-loop),
- tool-level allowlists and deny-by-default policies.

### 2.2 Excessive permissions

Core issue: agents often inherit broad service-account privileges.

Result: compromised instructions can execute high-impact operations.

Evidence:

- practitioner and survey examples cite over-privilege and shared credentials [R40][R39][R42].

Controls:

- least privilege per agent role,
- short-lived credentials,
- per-action policy checks at execution time.

### 2.3 Hallucinated or unverifiable actions

Core issue: agent can produce plausible but invalid action plans.

Controls:

- strongly typed tool schemas,
- execution receipts,
- post-action verification and reconciliation,
- multi-step approval for destructive operations.

### 2.4 Attribution and audit gaps

Core issue: logs often identify only shared accounts, not agent instance/version/intent chain.

Controls:

- unique agent identities,
- signed action envelopes,
- trace IDs across A2A/MCP/tool boundaries,
- tamper-evident audit trails.

## 3) Identity and authorization are the critical control plane

NIST NCCoE’s concept paper is explicit: the key near-term gap is applying identity and authorization standards to software/AI agents as first-class non-human principals [R41].

Important concepts in that paper:

- identification, authentication, authorization for agents,
- delegation (“on behalf of”),
- human-in-the-loop binding,
- prompt injection mitigation and post-incident containment [R41].

Referenced standards/components:

- OAuth/OIDC,
- SPIFFE/SPIRE,
- SCIM,
- NGAC,
- zero-trust guidance [R41].

## 4) Governance model recommendations (actionable baseline)

### 4.1 Establish agent principal model

Every production agent should have:

- a unique non-human identity,
- scoped entitlements,
- owner/team assignment,
- lifecycle metadata (version, environment, revocation status).

### 4.2 Enforce policy at runtime, not only in design docs

Adopt policy checks before tool execution:

- ABAC/RBAC + context constraints,
- monetary/record-impact limits,
- data classification aware controls,
- automatic block + explainable reject reason.

### 4.3 Instrument continuous monitoring

Minimum telemetry:

- tool invocation stream,
- decision + action trace,
- failed policy checks,
- anomaly alerts (rate, scope, target drift),
- incident replay capability.

### 4.4 Build revocation and kill-switch pathways

- fast credential revocation,
- denylist propagation,
- emergency disable for specific agents/tool paths,
- post-incident forensic bundle generation.

### 4.5 Add human oversight where risk warrants it

High-risk categories should require explicit approval:

- financial transfer and refunds above threshold,
- production infra mutation,
- privileged data export,
- legal/compliance-sensitive outbound actions.

## 5) Security posture maturity checklist

### Level 0: experimental

- shared credentials,
- minimal logs,
- no runtime policy checks.

### Level 1: controlled pilot

- unique agent IDs,
- scoped credentials,
- baseline logging and alerting.

### Level 2: governed production

- policy gate at execution time,
- full traceability,
- incident response runbooks.

### Level 3: audited enterprise

- independent testing/red teaming,
- formal attestation,
- compliance mapping,
- continuous control verification.

## 6) Residual risks to keep explicit

Even with strong controls:

- protocol-level interoperability does not ensure semantic safety,
- upstream model behavior changes can alter action selection,
- third-party tool compromise can bypass local assumptions,
- identity systems can fail if key lifecycle governance is weak.

## 7) Summary

Security for agentic systems in 2026 is not mainly a model-quality problem; it is an identity, authorization, and operational governance problem.

Organizations that treat agents as first-class identities with runtime policy enforcement and continuous visibility will materially reduce risk. Organizations that rely on shared keys and periodic audits will not.

