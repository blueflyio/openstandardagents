# Security and Governance Findings

## Executive risk picture

The combined evidence points to a structural mismatch:

- deployment velocity is high,
- identity/authorization maturity is low,
- runtime observability is partial,
- incident rates are already significant in production environments. [T56][T57][T13]

## 1) Major attack and failure classes

## Prompt injection and control-plane manipulation

Prompt injection remains a dominant class in public guidance (OWASP LLM01) and practitioner reporting. [T59][T61]  
In agentic systems, injection impact is amplified when the model has tool permissions and can chain actions.

## Excessive permissions / weak principal model

A recurring enterprise failure pattern is granting agents broad shared credentials or service-account privileges, then relying on prompt constraints for control. [T56][T57][T60]

## Hallucinated or mis-scoped actions

Agentic failure is not just “wrong text.” It includes incorrect operational actions in external systems, especially under multi-step autonomy. [T60][T18]

## Transparency and auditability gaps

MIT AI Agent Index findings show strong asymmetry between capability marketing and published safety evidence, with sparse third-party testing visibility. [T13][T14]

## 2) Empirical and survey indicators

## Gravitee 2026 security dataset

Reported highlights include:

- 81% beyond planning phase,
- 14.4% with full security approval,
- 88% with confirmed or suspected incidents,
- low rates of treating agents as independent identity-bearing entities. [T56][T57]

Interpretation: teams are shipping agents faster than they are modernizing IAM and continuous controls.

## MIT AI Agent Index indicators

The index reports low disclosure of safety evaluations for many high-autonomy systems and unresolved web-conduct norms, reinforcing governance uncertainty. [T13][T14]

## 3) Identity, authorization, and governance frameworks

## NIST and NCCoE trajectory

NIST’s CAISI initiative and the NCCoE concept paper center on:

- agent identification/authentication/authorization,
- non-repudiation and auditability,
- delegated authority and human-in-the-loop binding,
- prompt injection controls and impact mitigation. [T62][T63][T64][T65]

The NCCoE concept explicitly treats agentic scale/autonomy growth as requiring updated identity controls and standards-aligned implementation patterns. [T63]

## OpenID and delegated authority research

The OpenID-linked whitepaper and MIT Media Lab work both stress extending existing IAM foundations (OAuth 2.0/OIDC and delegated authority chains) rather than inventing purely separate security worlds for agents. [T24][T20]

## 4) Recommended control baseline (cross-source synthesis)

1. **First-class non-human identities for agents** (no shared generic credentials). [T56][T63]  
2. **Policy-based authorization** (ABAC/Cedar/OpenFGA-style patterns) with scoped entitlements and trust tiers. [T06][T63]  
3. **Continuous runtime monitoring** with actionable logs, not periodic-only audit cycles. [T56]  
4. **Human-in-the-loop for irreversible/high-risk actions**; remove only where empirical reliability and policy assurance justify it. [T15][T61]  
5. **Revocation and kill-switch pathways** for compromised agents and delegated tokens. [T06][T63]  
6. **Protocol-level hardening**: secure auth on MCP/A2A surfaces, input/output validation, constrained tool execution. [T25][T28][T59]

## 5) Governance reality check

The question in early 2026 is no longer “should we deploy agents?”  
It is “how quickly can IAM, policy, and monitoring controls catch up to autonomous behavior in production?”

Current data indicates many organizations are not yet at that point. [T56][T15]
