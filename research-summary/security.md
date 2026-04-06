# Security, Identity, and Governance (2025-2026)

Date of synthesis: April 6, 2026.

## Executive security signal

Security evidence from 2025-2026 is consistent: **agent deployment is moving faster than identity, authorization, and monitoring controls**.[T28][T29][T48]

## 1) Incident and readiness data

## Gravitee State of AI Agent Security (2026)

The Gravitee survey/report is one of the clearest publicly accessible snapshots:

- 81% of teams past planning phase,
- only 14.4% with full security approval,
- 88% reporting confirmed/suspected incidents,
- under 22% treating agents as independent identities,
- large reliance on shared API keys.[T29]

Interpretation: organizations are generally aware of risk, but operational controls are often partial or reactive.

## 2) Identity and authorization as central gap

## NIST/NCCoE concept paper (Feb 5, 2026)

NIST’s concept paper calls for practical application of identity standards and authorization controls to software/AI agents, explicitly requesting input on identification, authentication, authorization, auditing, non-repudiation, and prompt injection controls.[T21]

This is significant because it frames agent IAM as a policy and engineering priority, not merely a vendor feature.

## Protocol-level identity trends

- A2A and related ecosystems increasingly discuss enterprise-grade auth patterns.[T11][T14]
- Discovery/contract projects (DUADP/OSSA) emphasize DID, signatures, policy tiers, and provenance metadata.[T01][T03][T07]

These approaches vary in maturity and ecosystem penetration, but all indicate movement toward machine identity as first-class infrastructure.

## 3) Prompt injection and tool misuse research

## Research findings (selected)

By late 2025 to early 2026, multiple studies document high-risk attack viability:

- Prompt-injection benchmark/defense framing in RAG-agent setups with substantial baseline vulnerability before layered defense.[T54]
- Coding-assistant ecosystem SoK indicating high attack success for adaptive strategies and weak mitigation from many current defenses.[T55]
- Adaptive indirect prompt injection frameworks improving attack performance against advanced defenses.[T56]
- Multi-agent communication attacks (AiTM) compromising systems by manipulating inter-agent messages.[T57]
- Real-environment offensive studies showing arbitrary code execution/data exfiltration pathways in multi-agent setups.[T53]

These results imply defense-in-depth is mandatory; single-filter defenses are insufficient.

## 4) Practical threat model categories

Based on empirical research and practitioner sources:

1. **Indirect prompt injection** through untrusted content/tool outputs.[T52][T53][T54][T56]  
2. **Over-privileged tool access** enabling high-impact misuse after instruction hijack.[T53][T55]  
3. **Inter-agent message manipulation** in multi-agent topologies.[T57]  
4. **Credential/identity ambiguity** (shared keys, weak non-repudiation) impairing forensics and policy enforcement.[T21][T29]  
5. **Operational blind spots** (insufficient telemetry, partial coverage, weak auditability).[T29][T48]

## 5) Governance and policy framing

## MIT + Harvard-adjacent perspectives

- MIT AI Agent Index reports substantial transparency and standards gaps, especially in agent safety disclosure and web conduct norms.[T26][T27]
- Harvard ecosystem discussions frame protocols as an institutional governance substrate where regulation alone may lag implementation velocity.[T24][T32]

## Business/leadership guidance

- MIT Sloan: maintain human-in-the-loop while reliability/security constraints remain unresolved.[T28]
- HBR framing (paywalled summaries): organizations should redesign operating models and treat agent governance as managerial infrastructure, not ad hoc tooling.[T50][T51]

## 6) Recommended control baseline (2026)

A practical minimum control set, synthesizing sources:

1. **Unique machine identity per agent** (no shared credentials where avoidable).  
2. **Policy enforcement at action/tool boundary** (least privilege, deny-by-default where possible).  
3. **Structured audit trails** for prompts, tool calls, inter-agent messages, and policy decisions.  
4. **Prompt injection resilience stack**: input controls + context compartmentalization + output/action validation.  
5. **Human checkpoints** for high-impact actions (money movement, production changes, legal/security operations).  
6. **Continuous monitoring with rollback/revocation** for compromised agents or malicious tool paths.

## 7) Limitations and evidence quality notes

- Security blog and vendor survey data are useful but may include sampling/marketing bias; treat as directional unless independently replicated.  
- ArXiv and conference papers vary in peer-review status and environmental realism; combine with red-team evidence from your own stack.  
- Paywalled business sources can inform strategy framing but should not be treated as technical validation.

