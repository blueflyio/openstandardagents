# Security and Governance Research (2025-2026)

## 1) Current security posture: adoption ahead of control

Gravitee’s 2026 report (survey-driven) is one of the clearest quantitative snapshots:

- 81% of teams beyond planning stage,
- only 14.4% with full security approval,
- 88% reporting confirmed/suspected incidents,
- fewer than a quarter treating agents as first-class identities. [R44][R45]

Directionally, this matches broader enterprise caution from MIT/HBR commentary: organizations are deploying faster than governance is stabilizing. [R15][R18]

## 2) Dominant threat categories

### Prompt injection (direct + indirect)

Prompt injection remains the most cited systemic risk because it can redirect tool-enabled agents into unsafe actions. [R46][R51][R52]

### Excessive permissions / weak authorization boundaries

Shared credentials and coarse role boundaries create escalation risk, especially when tool calls are not policy-checked at execution time. [R45][R47][R50]

### Hallucinated actions and unsafe automation

Even without explicit attack, model errors can trigger harmful operations if irreversible tools are not strongly gated.

### Control-flow hijacking and multi-step exploit chains

Recent research shows adversarial chaining can bypass naïve single-step guardrails; runtime policy enforcement and trajectory-aware checks are increasingly necessary. [R51][R52][R53]

## 3) Emerging defense patterns

| Defense pattern | Why it matters | Example references |
|---|---|---|
| Pre-action authorization on every tool call | Blocks unsafe execution even if LLM reasoning is compromised | [R47][R50] |
| Least privilege + agent-specific identity | Reduces blast radius and improves attribution | [R45][R50] |
| Runtime telemetry and conformance checks | Detects drift and policy violations in long workflows | [R54][R55] |
| Human approval for irreversible actions | Adds fail-safe where uncertainty remains high | [R46][R15] |
| Provenance-aware execution and sandboxing | Limits exfiltration and hostile code paths | [R33] |

## 4) Identity and governance framework progress

NIST/NCCoE’s 2026 concept paper is significant because it directly targets software/AI agent identity and authorization in enterprise environments, including delegation accountability and auditable action attribution. [R50]

This indicates a shift from informal “agent keys” toward standards-based identity stacks (OAuth/OIDC/SPIFFE-family patterns where applicable), with enterprise governance as a first-class requirement.

## 5) Web-scale governance context

Imperva’s bot-traffic reporting (49.6% bot share in 2023 traffic) and Harvard policy discussion together point to a macro trend: machine-originated activity is already at parity with human-originated activity in some measurements, and agentic growth could stress current web governance models. [R48][R49][R17]

## 6) Practical security recommendations (actionable)

1. **Treat each agent as an identity principal**, not as a shared API client.
2. **Enforce per-tool, per-action policy checks** before execution.
3. **Segment permissions by workflow stage** and use default-deny posture.
4. **Instrument full traces** (input context, tool calls, outputs, approvals) for auditability.
5. **Require explicit human confirmation** for high-risk actions (finance, auth, destructive ops).
6. **Red-team indirect prompt injection paths** via untrusted documents, email, and API content.
7. **Adopt protocol-level security controls** (transport auth, signed metadata, replay protections).

## 7) Evidence limitations

- Survey statistics (for example Gravitee) are valuable but methodology-dependent; treat as ecosystem indicators.
- Some practical security guidance comes from engineering blog literature rather than peer-reviewed benchmarking; pair with academic evaluations where possible. [R46][R47][R51][R53]
