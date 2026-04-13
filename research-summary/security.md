# Security and Governance (Updated: April 13, 2026)

## Security posture of the current agent ecosystem

Multiple sources show a consistent pattern: adoption speed is high, while security controls remain partial and uneven.

### Enterprise security signals (Gravitee 2026)

Survey data from 900+ executives and practitioners indicates:
- 81% of teams are beyond planning,
- only 14.4% report full security approval coverage,
- 88% report confirmed or suspected incidents,
- only ~22% treat agents as independent identities,
- shared credentials remain common for agent-to-agent authentication. [S32][S33]

This strongly supports an **identity-and-authorization gap** thesis rather than a pure model-quality issue.

### Public web automation pressure (Imperva 2025)

Imperva reports automated traffic at 51% of web traffic and bad bots at 37% in 2024, with AI lowering attacker barriers and increasing bot sophistication/evasion pressure. [S47]

This context matters for agent governance discussions: the external environment agents operate in is increasingly adversarial and automated.

## Core threat classes

### 1) Prompt injection (direct and indirect)

Prompt injection remains a top operational risk category in academic and industry analyses:
- injection in untrusted input channels,
- instruction override and context contamination,
- cross-context propagation via tools/plugins/memory layers. [S41][S42][S43]

### 2) Excessive permissions and credential sprawl

Operational writeups repeatedly show over-privileged agents and broad credential exposure as common failure modes:
- shared API keys,
- flat privilege models,
- tool access beyond task necessity. [S32][S33][S34]

### 3) Agent-to-agent trust ambiguity

As multi-agent patterns expand, weak identity proofing and authorization delegation create opaque command chains and accountability blind spots. [S16][S19][S32][S33][S34]

### 4) Monitoring and audit blind spots

Periodic/manual audits and partial runtime coverage are not aligned with autonomous, high-frequency agent actions. [S33]

## Governance and standards responses

## NIST/NCCoE direction (identity and authorization)

NIST NCCoE’s 2026 concept paper explicitly targets software/AI agent identity and authorization adoption, with focus on:
- identification and authorization controls,
- audit/non-repudiation,
- prompt-injection mitigation controls,
- practical implementation guidance via standards-aligned reference work. [S34]

This aligns with market findings that agent security failures are mostly control-plane failures rather than only model misbehavior.

### Linux Foundation and protocol governance

MCP under AAIF and A2A under Linux Foundation governance indicate an industry move toward neutral stewardship for core interoperability layers. [S15][S18]

Governance maturity is increasing, but control implementation maturity across enterprises is still lagging.

### Harvard policy/legal framing

Harvard-affiliated legal analysis emphasizes:
- portable identity and verifiable delegation,
- institutional accountability in the agentic web,
- protocol-level governance as an alternative to closed platform-only control. [S35][S36]

## Recommended control model (derived synthesis)

### Identity
- Assign each agent a distinct machine identity (no shared keys by default). [S32][S33][S34]
- Support cryptographic attestation/signature where feasible. [S01][S04][S19]

### Authorization
- Enforce least privilege at tool/resource boundary.
- Separate discovery identity from execution authorization.
- Apply policy-as-code (for example Cedar-style ABAC where supported). [S01][S02][S04][S15]

### Runtime safety
- Treat prompt injection as expected, not exceptional.
- Gate sensitive actions with approval workflows/human checkpoints.
- Add deterministic policy checks before side effects. [S13][S28][S33]

### Audit and observability
- Continuous telemetry for agent/tool/agent-to-agent actions.
- Tamper-evident action traces with principal linkage.
- Alerting on anomalous delegation, privilege escalation, and unusual tool call patterns. [S32][S33]

### Deployment governance
- Staged rollout with security baselines as go-live gate.
- Regular red-team exercises specific to agent toolchains and memory layers.
- Security ownership model spanning platform, application, and model operations.

## Security conclusion

The strongest evidence across institutions and industry is that **agentic risk is currently dominated by identity, authorization, and runtime governance gaps**. Model improvements alone will not close this gap. Organizations that operationalize identity-aware enforcement, policy-driven tool access, and continuous audit will be better positioned to scale agent systems safely in 2026.

## Citation keys

Full references are in `reading-list.md`.
