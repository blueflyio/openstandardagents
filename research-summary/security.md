# Security and governance (threats, controls, identity, standards)

Date compiled: April 3, 2026

## Executive security picture

Across sources, the most consistent finding is that deployment maturity is ahead of governance maturity. Many teams run agents in production while identity, authorization, and observability controls are partial. [SRC-GRAVITEE-REPORT-PORTAL-2026] [SRC-GRAVITEE-BLOG-2026] [SRC-NIST-NCCOE-2026]

## Reported statistics and what they mean

Gravitee's 2026 report portal and companion blog report:
- 80%+ teams past planning,
- only 14.4% with full security/IT approval,
- 88% confirmed/suspected incidents,
- only about 22% treating agents as independent identities,
- widespread shared-key patterns. [SRC-GRAVITEE-REPORT-PORTAL-2026] [SRC-GRAVITEE-BLOG-2026]

Interpretation: the control gap is not conceptual; it is operational execution (identity modeling, policy enforcement, and continuous monitoring).

Note on provenance: these figures are vendor-published survey results, not peer-reviewed population estimates. They are still useful as directional signals because the same pattern appears in independent academic and policy sources. [SRC-GRAVITEE-REPORT-PORTAL-2026] [SRC-MIT-AGENT-INDEX-2025] [SRC-NIST-NCCOE-2026]

## Primary technical threat classes

### 1) Prompt injection (direct + indirect)

Prompt injection remains the dominant class because agents consume untrusted external content and can act through tools. [SRC-OWASP-LLM01-2025] [SRC-DEVTO-WAXELL-2026]

### 2) Excessive agency / over-permission

OWASP categorizes excessive agency as a core risk where agents have too much functional scope, too much permission scope, or too much autonomy scope. [SRC-OWASP-LLM06-2025]

### 3) Hallucinated or unauthorized actions

Even when output text looks plausible, underlying tool invocations can be wrong or risky if not constrained by policy and approval boundaries. [SRC-MIT-SLOAN-2026] [SRC-OWASP-LLM06-2025]

## Research evidence on defense limits

Adaptive-attack work shows current indirect prompt-injection defenses can be bypassed at high rates, suggesting detection-only defenses are insufficient. [SRC-ARXIV-ADAPTIVE-IPI-2025]

Implication: teams need architecture-level controls (policy at tool-call boundary, provenance tracking, least privilege), not only model-level prompt hardening.

## Identity and authorization frameworks

### NIST/NCCoE direction

NIST NCCoE's concept paper explicitly asks for practical identity, authorization, auditing, and prompt-injection mitigation patterns for software/AI agents. [SRC-NIST-NCCOE-2026]

### Authenticated delegation research

Delegation research proposes extending OAuth/OIDC with agent-specific credentials/metadata and auditable scoping of permissions. [SRC-ARXIV-AUTH-DELEGATION-2025]

### Runtime governance architecture

Recent frameworks (SAGA, MI9) focus on:
- agent lifecycle governance,
- continuous authorization monitoring,
- drift/conformance checks,
- containment pathways. [SRC-ARXIV-SAGA-2025] [SRC-ARXIV-MI9-2025]

## Recommended control baseline (practical)

| Control domain | Minimum baseline |
| --- | --- |
| Identity | unique identity per agent (no shared generic keys) |
| Authorization | least-privilege permissions, explicit scope boundaries |
| Tool safety | policy checks on tool invocation, not only output filtering |
| Human control | approvals for high-impact actions |
| Observability | full run/tool-call logging + anomaly detection |
| Governance | agent inventory/registry + periodic access review |

Sources supporting this baseline: [SRC-NIST-NCCOE-2026] [SRC-GRAVITEE-REPORT-PORTAL-2026] [SRC-OWASP-LLM06-2025] [SRC-DEVTO-WAXELL-2026]

## Governance takeaway

Agentic AI security is converging with zero-trust service security principles:
- strong identity,
- explicit authorization,
- continuous telemetry,
- resilient containment.

What changes in agentic systems is the speed and autonomy of actions, which compresses detection-response windows and makes pre-authorization design critical.
