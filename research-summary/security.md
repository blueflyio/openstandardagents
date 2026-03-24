# Security and Governance in Agentic AI (2025-2026)

## Why this section matters

The central risk transition in agentic systems is from “model says wrong thing” to “model performs wrong action with real permissions.” That means identity, authorization, runtime policy, and observability have become first-class requirements. [S34][S36][S38]

## 1) Threat model highlights

### Prompt injection

Prompt injection remains a primary exploitation path because LLM agents often blend untrusted content with instruction channels and then invoke tools with high authority. [S36][S38][S69]

### Excessive permissions

Many deployments still grant broad service-account credentials rather than narrowly scoped, agent-specific identities and rights, increasing blast radius. [S36][S37][S38]

### Hallucinated or policy-violating actions

Even without external adversaries, autonomous action loops can produce tool calls or parameterizations outside business intent unless bounded by policy and human checkpoints. [S12][S33][S38]

### Weak auditability and delayed incident detection

Periodic/manual review patterns are too slow for autonomous systems; security coverage gaps allow “shadow agents” and unlogged actions. [S37]

## 2) Empirical signals from 2026 reports

Gravitee’s 2026 survey/report package (919 respondents) is one of the clearest public snapshots:

- 81%+ moved beyond planning
- only 14.4% had full security approval
- 88% reported confirmed/suspected incidents
- only ~22% treated agents as independent identities
- heavy reliance on shared API keys and hardcoded auth logic persists [S36][S37]

Interpretation: adoption is not blocked by awareness, but by execution maturity in IAM, authorization, runtime control, and governance operations.

## 3) Identity and authorization direction (NIST/NCCoE)

NIST NCCoE’s February 2026 concept paper frames software/AI agent identity and authorization as a dedicated engineering problem, soliciting practical guidance around:

- identification and authentication
- authorization patterns for agent workflows
- auditing and non-repudiation
- prompt-injection mitigation controls [S34]

This indicates standardization is still formative, but heading toward explicit machine identities, stronger authorization semantics, and implementation playbooks.

## 4) University and index evidence on safety disclosure gaps

MIT’s AI Agent Index reports a large mismatch between autonomy levels and disclosed safety evaluation:

- only 4 of 13 frontier-autonomy systems disclosed agentic safety evaluations
- most systems disclosed no internal or third-party testing signals [S31]

That transparency gap complicates buyer due diligence, especially for high-impact domains.

## 5) Practical governance controls (operational checklist)

Across MIT Sloan, NIST, and security-practitioner sources, a common baseline emerges:

1. **Agent-specific identities** (not shared keys) [S34][S36]  
2. **Least privilege + action scoping** at tool/resource layer [S36][S38]  
3. **Policy enforcement before execution** (risk-tier + capability constraints) [S34][S37][S38]  
4. **Human-in-the-loop gates** for irreversible/high-risk actions [S12][S20][S33]  
5. **Continuous monitoring and audit trails** (not monthly/quarterly-only review) [S37]  
6. **Revocation and kill-switch capability** for compromised agents [S37][S38]  
7. **Prompt-injection hardening and input trust boundaries** [S33][S38][S69]

## 6) Protocol-layer implications

- MCP and A2A add interoperability value but do not eliminate governance responsibility by themselves; secure deployment still depends on IAM and policy architecture around them. [S09][S11][S34]
- Protocol projects increasingly add security-oriented features (e.g., signed artifacts/cards, auth profiles), but production outcomes still depend on operator discipline and platform controls. [S12][S14][S15]

## 7) Security posture recommendations by deployment stage

### Pilot stage
- Keep scope narrow, data sensitivity low, and actions reversible.
- Require explicit user confirmation for high-impact operations.
- Implement baseline logging and incident triage process.

### Expansion stage
- Migrate to agent-specific identities and scoped credentials.
- Add policy engines/gates for tool access and action classes.
- Introduce automated anomaly detection and retry/circuit-breaker policies.

### Enterprise stage
- Treat agents as first-class IAM principals with lifecycle management.
- Enforce continuous assurance (runtime policy checks + audit + revocation).
- Align controls to sector obligations (SOC2/HIPAA/GDPR/FedRAMP as applicable).

## 8) Limitations and caveats

- Some security data points come from vendor-led reports/blogs; use as directional evidence and corroborate with internal telemetry.
- Several practitioner write-ups are not peer-reviewed but remain useful for operational anti-pattern detection.

