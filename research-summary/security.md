# Security and Governance Research

Prepared on March 14, 2026.

## 1) Current risk state: adoption is ahead of control

The Gravitee 2026 report paints the clearest quantitative picture in this source set:

- 81% of teams are beyond planning,
- only 14.4% report full security approval,
- 88% report confirmed/suspected incidents,
- under 22% treat agents as independent identities. [T23]

This indicates a classic adoption-governance gap: deployment accelerated faster than identity, authorization, and monitoring maturity.

## 2) Dominant technical attack vectors

Practitioner and research sources converge on three high-frequency classes:

1. **Prompt injection / context override** (direct and indirect),
2. **Excessive permissions and tool misuse** (authorization gaps),
3. **Hallucinated or unsafe actions** under autonomous execution loops. [T24][T38]

Systematic research further argues that patchwork filters are insufficient; architectural controls are required (policy gates, runtime checks, provenance, and containment). [T37][T38]

## 3) Identity and authorization are becoming the control center

NIST/NCCoE’s February 2026 concept paper explicitly frames software and AI agents as identity-bearing actors requiring improved identification, authentication, authorization, auditing, and non-repudiation practices. [T22]

Operational implication: shared API keys and “anonymous automation” models are not viable at agent scale. Agent-specific credentials and policy enforcement must become default controls.

## 4) Governance signals from academia and policy

- MIT Agent Index shows weak public safety transparency and no accepted web conduct standards. [T20]
- Harvard protocol/governance work argues that open protocol infrastructure will shape accountability in the agentic web. [T19][T25][T40]
- MIT Sloan guidance recommends guarded deployment sequencing and persistent human oversight for high-impact workflows. [T21]

## 5) Recommended control baseline for production teams

## Identity and access
- Assign unique identities to each agent instance/workload.
- Use short-lived credentials where possible.
- Enforce least privilege by tool/action/data domain. [T22][T23][T24]

## Runtime safety
- Add policy checks before execution of sensitive tools.
- Separate planning from execution and require approvals for destructive actions.
- Keep human-in-the-loop checkpoints for financial, legal, and production change paths. [T21][T24][T37]

## Observability and forensics
- End-to-end tracing for model calls, tool invocations, handoffs, and policy decisions.
- Immutable/replayable logs and run-level provenance metadata.
- Incident drills for prompt-injection, poisoned memory, and delegated-action abuse. [T23][T29][T37]

## Protocol and supply-chain hygiene
- Prefer open, documented protocols with conformance tests.
- Sign manifests/artifacts and verify provenance for tools/connectors.
- Minimize custom “glue” code that bypasses central policy enforcement. [T06][T22][T35]

## 6) Residual unknowns

- Many protocols and frameworks are still evolving rapidly; backward compatibility and security semantics may shift quickly.
- Cross-protocol trust mapping (e.g., MCP identity to A2A identity to discovery identity) remains immature in most implementations.
