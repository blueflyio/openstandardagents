# Security and Governance Research (2025-2026)

Prepared: 2026-04-01

## Executive security takeaways

1. **Prompt injection remains the dominant and unsolved class** of agent attacks in deployed systems. [T63][T75]
2. **Identity and authorization models are underdeveloped** relative to deployment scale, especially agent-as-principal patterns. [T31][T30]
3. **Protocol composition introduces new risk** even when individual protocols are evaluated in isolation. [T65][T66]
4. **Operational control gaps are widespread** (monitoring coverage, approval governance, shared credential patterns). [T31]

---

## 1) Threat categories and attack mechanics

## Prompt injection (direct + indirect)

OWASP 2025 classifies prompt injection as LLM01 and explicitly notes robust prevention remains difficult due to model semantics (instruction/data ambiguity). [T75]

Impact channels include:
- sensitive data disclosure,
- system prompt leakage,
- unauthorized function/tool use,
- manipulation of decision flows. [T75]

Recent attack literature:
- AGENTVIGIL (ACL Findings 2025) reports high success in black-box indirect prompt-injection scenarios and transferability across tasks. [T77]
- AgentDojo benchmark/evaluation environment is widely used for red-team/defense comparisons on realistic tasks. [T72]

## Excessive permissions / agency risk

OWASP's LLM Top 10 also flags excessive agency (LLM06) as a first-class risk in autonomous systems. [T75]

In practice this appears as:
- over-scoped API keys,
- weak action approval boundaries,
- and opaque tool invocation rights.

## Hallucinated actions and unsafe automation

MIT Sloan guidance repeatedly ties current "not ready for prime time" concerns to hallucination + injection + control failures in autonomous execution. [T29]

---

## 2) Identity and authorization: emerging governance baseline

The NIST/NCCoE concept paper (initial public draft, 2026-02-05) requests concrete community input on:
- AI/software-agent identification,
- authorization and non-repudiation controls,
- auditing,
- and prompt-injection mitigation controls. [T30]

This is significant because it frames agent IAM not as optional policy overlay but as foundational infrastructure.

### Field evidence from enterprise security surveying

Gravitee's 2026 report signals large deployment/governance mismatch:
- 81%+ beyond planning,
- 14.4% with full security/IT approval,
- 88% reporting suspected or confirmed incidents,
- only about 22% treating agents as independent identities. [T31]

Even allowing for vendor-survey bias, the direction is consistent with independent academic and management guidance: deployment speed is outpacing control design.

---

## 3) Protocol-layer security research

## Comparative threat modeling

A 2026 comparative analysis across MCP/A2A/Agora/ANP identifies protocol-level and lifecycle risk surfaces, including trust-assumption fragility in composed environments. [T65]

## Security design principles + conformance checks

AgentRFC (2026) proposes:
- an agent protocol stack model,
- formalized security principles,
- and protocol conformance checking pipeline,
while emphasizing **composition safety** as a distinct principle. [T66]

## Additional framework proposals

The Aegis protocol paper proposes DID + PQC + ZK-based controls for autonomous agent networks and provides simulation-based evaluation. [T67]

Use with caution:
- useful for design ideas,
- but current validation is simulation-first and not a substitute for large production evidence.

---

## 4) Governance patterns that currently appear robust

Based on cross-source alignment, the most defensible near-term control pattern is:

1. **Least privilege at tool boundary**
   - short-lived credentials,
   - action-scoped permissions,
   - strict API allowlists.
2. **Instruction/data boundary hardening**
   - external content isolation,
   - strong input/output validation,
   - anti-injection filtering and semantic checks.
3. **Human-in-the-loop for high-risk actions**
   - approval gates for side effects (financial, security, irreversible operations).
4. **Continuous observability**
   - traceable task lifecycle,
   - structured audit logs,
   - policy violation alerting.
5. **Identity-first architecture**
   - agent-level identities (not shared service secrets),
   - explicit delegation chains and accountable provenance.

These patterns are reflected (with varying terminology) across OWASP, MIT Sloan, NIST/NCCoE prompt, and protocol-security literature. [T75][T29][T30][T65]

---

## 5) Security relevance of specific protocols and layers

| Layer | Security upside | Security caveat |
|---|---|---|
| MCP | standard tool interface + schema discipline | weak deployment can still expose over-privileged tools |
| A2A | formal task/delegation model + capability cards | federation trust and auth profile consistency are hard |
| AG-UI | structured run/tool/state events for auditability | UI channel security and event integrity must be enforced |
| Discovery layers (DUADP/ANP class) | identity/provenance-friendly discovery models | verification quality depends on real-world trust operations |
| Contract layers (OSSA class) | policy/identity metadata can be made portable | export portability does not guarantee runtime enforcement |

---

## 6) Immediate recommendations (2026 implementation baseline)

For teams operating production agents now:

1. Treat prompt injection as **assumed breach**, not rare edge case.
2. Move from shared keys to **agent-scoped identity and authz**.
3. Add **mandatory approval checkpoints** for high-impact operations.
4. Require **runtime telemetry + post-hoc forensics** before scaling autonomy.
5. Evaluate protocol conformance and composition risks as part of architecture review.

---

## 7) Limitations and evidence notes

- OWASP and NIST provide normative/security guidance, not empirical prevalence measurements.
- Vendor reports (e.g., Gravitee) may have sampling biases, but still provide directional operational indicators.
- Some protocol-security papers are recent preprints; incorporate as "emerging evidence," not settled doctrine.

