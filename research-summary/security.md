# Security and Governance in Agentic AI (2025-2026)

Date prepared: 2026-03-15

## 1) Macro risk signal: adoption is outrunning controls

The Gravitee State of AI Agent Security 2026 findings indicate a structural mismatch:
- 81% of teams are beyond planning,
- only 14.4% report full security/IT approval for the full fleet,
- 88% report confirmed or suspected incidents,
- fewer than 22% treat agents as independent identities.[R33][R34]

This implies “agent sprawl” without identity-grade governance is already common in production environments.

## 2) Threat model: top practical failure modes

| Threat | What happens | Why it is hard | Evidence |
|---|---|---|---|
| Prompt injection (direct/indirect) | Untrusted content overrides agent intent | Instructions + data share channels; architecture-level issue | [R36][R52][R53] |
| Excessive permissions | Agent can perform actions beyond least privilege | Shared service keys and coarse scopes | [R35][R34] |
| Hallucinated actions | Agent executes unsafe/unfounded operations | Weak action validation and policy gating | [R35][R42] |
| Identity ambiguity | No per-agent identity or auditability | Legacy key-sharing model persists | [R34][R37] |
| Web-scale bot abuse | Autonomous traffic overwhelms human-centric controls | Existing bot controls were not designed for autonomous agents | [R50][R51] |

## 3) Identity and authorization frameworks

NIST NCCoE’s 2026 concept paper centers the next phase of governance on:
- agent identification/authentication/authorization,
- auditability/non-repudiation,
- controls for prompt injection exposure,
- practical use of identity standards (OAuth/OIDC and adjacent patterns) in software + AI agents.[R37]

NIST’s AI Agent Standards Initiative further signals institutional movement toward interoperable trust baselines and measurable controls.[R38]

## 4) Transparency and evaluation gaps

MIT AI Agent Index analysis shows limited public safety-evaluation disclosure compared to capability disclosures, with sparse third-party testing evidence across many deployed agents.[R40][R41]

Operational implication: procurement and governance teams should require safety evidence artifacts, not just feature claims.

## 5) Defense architecture recommendations (synthesized)

## Identity and access
- Use **per-agent identity** (no shared API keys) with least-privilege authorization boundaries.[R34][R37]
- Separate “can call endpoint” from “can perform specific action” using policy engines and scoped tool permissions.[R35]

## Prompt-injection resilience
- Treat injection as a **system architecture** issue; enforce layered controls:
  - input sanitization,
  - instruction/data separation where possible,
  - tool-call policy checks,
  - output and side-effect verification,
  - blast-radius containment.[R36][R52][R53]

## Runtime governance
- Continuous monitoring, event logging, and traceability should be default before high-autonomy rollout.[R34][R42]
- Add human approval gates for irreversible or high-impact actions.[R42][R35]

## Internet-facing controls
- Prepare for bot-heavy traffic assumptions and adopt verifiable-bot trust approaches (agent trust signals, stronger anti-abuse controls, modern challenge frameworks where needed).[R50][R51]

## 6) Security KPIs to track per agent fleet

Recommended baseline KPIs:
1. % agents with unique non-human identity  
2. % tool calls policy-evaluated before execution  
3. prompt-injection detection/blocked rate  
4. incident MTTD/MTTR for agent-driven events  
5. % high-impact actions requiring human approval  
6. % agents covered by continuous telemetry and audit logs

These KPIs directly map to observed gaps in current 2026 reports.[R34][R40]

## 7) Governance maturity model (practical)

- **Level 0: Prototype** — shared credentials, sparse logs  
- **Level 1: Controlled pilot** — scoped creds + core telemetry  
- **Level 2: Production managed** — policy-gated tool calls + incident process  
- **Level 3: Federated trust-ready** — interoperable identity, attestations, external auditability

Given current incident and approval metrics, many organizations appear between Level 0 and Level 2 today.[R34]
