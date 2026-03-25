# Security and Governance (2025-2026)

Date of synthesis: 2026-03-25

## Core security narrative

The ecosystem signal is consistent across standards bodies, surveys, and technical red-teaming:

1. Agent deployment is accelerating,  
2. identity/authz/governance controls are lagging,  
3. prompt-injection and over-privileged action risks are already operational.

## Empirical state of practice

### Gravitee 2026 security survey (enterprise deployment maturity gap)

Gravitee reports:

- 81% of teams are beyond planning,  
- only 14.4% report full security approval coverage,  
- 88% report confirmed/suspected incidents,  
- only about 22% treat agents as first-class identities.

It also reports common reliance on shared API keys and partial monitoring coverage, with many orgs still doing periodic/manual auditing versus continuous control. [S23][S24]

Interpretation: many organizations have built “agentic functionality” faster than “agentic IAM and runtime enforcement.”

### Technical attack evidence

- **AGENTVIGIL (ACL Findings 2025)** shows automatic black-box indirect prompt injection can reach high success rates on benchmarked agent settings and transfer across setups. [S42]  
- **Large public competition paper (arXiv 2026)** reports vulnerabilities across 13 frontier models and thousands of successful attacks in tool/coding/computer-use settings. [S27]

Interpretation: indirect prompt injection is not a niche threat. It is a broad class of architectural risk for any agent that consumes untrusted external content and can act via tools.

## Governance and standards response

### NIST NCCoE concept paper (2026)

NIST NCCoE’s concept paper explicitly calls for input on:

- agent identification/authentication/authorization standards,  
- auditing and non-repudiation,  
- controls to prevent/mitigate prompt injection.

This is a strong policy signal that conventional IAM patterns need extension for autonomous software actors. [S25]

### MIT and Harvard governance framing

- MIT AI Agent Index highlights transparency/safety disclosure gaps and weak web-conduct norms. [S20]  
- Harvard LIL/JOLT framing emphasizes that protocol-layer decisions will shape practical accountability and authority boundaries. [S19][S44]

## Threat model synthesis (practical)

### High-probability risks

1. **Indirect prompt injection** from retrieved docs/web/email/code contexts. [S27][S42]  
2. **Excessive permissions** (shared tokens, broad service-account scopes). [S23][S24]  
3. **Unclear agent identity and attribution** (poor non-repudiation). [S23][S25]  
4. **Shadow deployments** outside centralized governance. [S24]  
5. **Blind spots in runtime observability** (periodic audits instead of continuous checks). [S23]

### Cross-protocol risk surface

- MCP solves tool connectivity, but not by itself organizational policy correctness. [S05][S06]  
- A2A/ACP solve inter-agent communication, but identity and delegation governance still require local policy/IAM design. [S07][S08][S28]  
- Discovery/federation layers increase reach and composability, but also increase trust-boundary management complexity. [S01][S11]

## Control recommendations (actionable)

1. **First-class machine identities for agents**  
   Avoid shared keys; issue per-agent credentials with bounded lifecycle. [S23][S25]

2. **Fine-grained authorization at tool boundary**  
   Enforce least privilege per action/resource, not just coarse project-level scopes.

3. **Policy evaluation before irreversible side effects**  
   Add human-in-the-loop for high-risk paths (financial transfer, production changes, legal/compliance actions). [S21]

4. **Prompt-injection-aware architecture**  
   Treat all external content as hostile by default; separate instruction channels from untrusted context where feasible.

5. **Continuous audit and traceability**  
   Prefer real-time telemetry and incident pipeline over periodic compliance-only reviews. [S23]

6. **Protocol + governance co-design**  
   Select protocols (MCP/A2A/etc.) together with identity, policy, and monitoring model, not as isolated implementation choices.

## Sector notes

- **Regulated domains** (finance, healthcare, gov) should treat agent identity and delegation logs as compliance artifacts from day one.  
- **Developer tooling orgs** should add secure defaults for agent auth, action gating, and replay-resistant execution tokens.

## Residual unknowns

- Incident taxonomies are not yet standardized across vendors/surveys, reducing cross-study comparability.  
- There is no globally accepted “agent assurance profile” equivalent to mature software security certification regimes.

---

## Security source map

- [S19] Harvard LIL: Launching Agent Protocols Tech Tree (2026)  
- [S20] MIT AI Agent Index 2025 (method + findings)  
- [S21] MIT Sloan: Action items for AI decision makers in 2026  
- [S23] Gravitee State of AI Agent Security report page (2026)  
- [S24] Gravitee companion blog (2026)  
- [S25] NIST NCCoE concept paper on software/AI agent identity and authorization (2026)  
- [S44] Harvard JOLT: On the institutional origins of the agentic web (2026)  
- [S27] arXiv 2603.15714 (large-scale indirect prompt injection competition, 2026)  
- [S42] ACL Findings EMNLP 2025: AGENTVIGIL
