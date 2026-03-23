# Security and Governance for Agentic AI (2026)

Date baseline used for relative references: **March 10, 2026**.

## 1) Security posture snapshot

Multiple sources indicate the same pattern: **deployment velocity > governance velocity**.

- Gravitee's 2026 survey summary reports that most teams are beyond planning, but only a minority have full security approval for all agents; incident prevalence is high; identity handling is immature in many orgs. [T28]
- MIT Sloan guidance similarly states that security and reliability constraints (especially prompt injection and hallucinated behavior) are major reasons agentic AI is not yet fully "prime time" for high-stakes autonomy. [T36][T37]

## 2) Dominant risk classes

## Prompt injection (direct and indirect)

This remains the top practical exploit class:

- instruction/data boundary confusion,
- malicious payloads in untrusted content,
- tool-chain escalation from injected context. [T31][T32][T41]

## Excessive permissions and poor action scoping

Many incidents are architecture failures rather than model failures:

- broad service-account credentials,
- no per-action authorization check,
- no runtime kill switch/revocation,
- weak attribution/audit trails. [T31][T32]

## Hallucinated or misapplied actions

Even when intent is benign, action generation can be incorrect (wrong parameters, wrong tool, wrong target), which is materially riskier than ordinary answer hallucinations. [T31][T36][T37]

## 3) Identity and authorization: where standards are moving

NIST/NCCoE's concept paper and CAISI initiative make identity and authorization explicit priorities for software and AI agents, including:

- stronger identification,
- agent authorization boundaries,
- auditable non-repudiation,
- controls against prompt-injection-mediated abuse,
- and public-comment-driven standardization paths. [T26][T27]

This is one of the clearest official signals that agent security is being treated as an IAM redesign problem, not only an LLM safety tuning problem.

## 4) Governance controls that now look mandatory

Across enterprise and practitioner sources, a minimum viable control set is converging:

1. **Least privilege by default** (task-scoped credentials, short-lived tokens). [T26][T27][T31]
2. **Action gating** before irreversible operations (human approval and/or secondary policy engine). [T31][T32]
3. **Input/output filtering with segmentation** for untrusted context paths. [T32]
4. **Continuous auditability** (who/what/when/why for every tool action). [T26][T28]
5. **Fast revocation and kill switches** for compromised agent identities/sessions. [T31]
6. **Human-in-the-loop for high-risk actions** until reliability and controls are demonstrably mature. [T36][T37]

## 5) Threat model shorthand: "lethal combination"

A useful operational shorthand from practitioner analysis is the high-risk combination of:

- tool execution authority,
- untrusted input ingestion,
- and sensitive data/system access.

When all three are present, injection risk and blast radius are highest; architecture, not prompting alone, must carry security responsibility. [T32]

## 6) Security incident and governance metrics (reported)

The Gravitee 2026 security-report blog cites:

- broad post-planning adoption,
- partial full-fleet approval,
- high incident prevalence,
- limited treatment of agents as first-class identities,
- and large monitoring blind spots in deployed fleets. [T28]

For this research package, these values are used as directional enterprise indicators and should be cross-validated against full report artifacts when available to your team.

## 7) Protocol-security research signals

Research surveys and evaluations reinforce that protocol interoperability alone does not ensure secure operations:

- vulnerabilities may emerge from optional security features,
- implementation defaults often matter more than spec intent,
- and comparative protocol analyses still find significant unresolved risks. [T40][T41][T42]

## 8) Recommended security roadmap (practical)

## Phase 1 (immediate)

- Establish per-agent identity and scoped credentials.
- Add hard action policies and approval gates.
- Instrument full audit logging and anomaly alerts.

## Phase 2 (next)

- Introduce trust tiers, signed manifests, and provenance checks for discovered/imported agents.
- Standardize policy bundles across MCP/A2A/agent-runtime surfaces.

## Phase 3 (maturity)

- Cross-org identity federation and interoperable trust assertions.
- Formal control testing and independent red-team/regression suites.

## 9) Bottom line

The biggest misconception in 2026 is that agent security is mostly a model-quality problem. The evidence points to a different conclusion: it is primarily a **systems security and governance problem** (identity, authorization, control-plane policy, observability, and response operations), with model behavior as one important component.

Citations: [T26][T27][T28][T31][T32][T36][T37][T40][T41][T42]
