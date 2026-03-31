# Security and Governance (late-2025 to early-2026)

This memo summarizes major risk themes, governance patterns, and identity/authorization standards relevant to production AI agents. Date references use absolute dates (compiled March 31, 2026).

## 1) Current risk posture: adoption is ahead of controls

Gravitee’s 2026 survey and whitepaper (published February 3-4, 2026) presents a widely cited “governance gap” pattern:

- 80.9% of technical teams are beyond planning.
- 14.4% report full IT/security approval for all agent deployments.
- 88% reported confirmed or suspected incidents in the prior year.
- 21.9% treat agents as independent identities.
- 45.6% use shared API keys for agent-to-agent auth.
- 57.4% cite insufficient logging/audit as a top concern. [S45][S46]

Interpretation: regardless of exact external validity, these numbers align with a recurring field observation: teams deploy agent functionality before achieving mature IAM, policy enforcement, and runtime observability.

## 2) Threat model priorities

### 2.1 Prompt injection and indirect prompt injection

OWASP GenAI 2025 top risks place prompt injection in the top position and explicitly notes both direct and indirect vectors. [S47]

High-impact outcomes in agentic systems include:

- Unauthorized tool invocation.
- Sensitive data exfiltration.
- Privilege misuse via connected APIs.
- Corrupted decision paths in automated workflows. [S47]

Operationally, the highest risk occurs when the same agent simultaneously has:

1. broad tool permissions,
2. access to untrusted content,
3. authority to take irreversible actions.

### 2.2 Excessive permissions and identity collapse

A recurring failure mode in field reports and commentary is over-broad agent/service-account access and shared credentials, which breaks attribution and least privilege. [S45][S46][S52][S53]

### 2.3 Hallucinated or mis-specified actions

MIT Sloan guidance (January 2026) explicitly calls out ongoing hallucinations and prompt-injection susceptibility as blockers to full autonomous deployment, predicting human-in-the-loop controls will remain necessary in the near term. [S29]

## 3) Identity and authorization standards direction

## 3.1 NIST/NCCoE concept paper (official U.S. standards trajectory)

NIST CSRC’s initial public draft (published February 5, 2026; comments due April 2, 2026) asks for practical patterns and standards around:

- identification,
- authorization,
- auditing,
- non-repudiation,
- prompt-injection controls in agent contexts. [S48]

This is notable because it frames agent security as a classic IAM + policy + evidence problem, not solely a model-quality problem.

### 3.2 Protocol-specific governance capabilities

Different protocols cover different pieces of the control surface:

- MCP: transport and capability negotiation for tools/data; requires host-side consent/authorization controls. [S06]
- A2A: agent communication, task lifecycle, and enterprise-ready auth expectations. [S09]
- AG-UI: event streams for agent-user interaction; does not replace IAM but can improve transparency via richer UI event traces. [S11]
- DUADP/OSSA (as-positioned by their maintainers): identity, trust-tier metadata, policy and discovery governance overlays. [S01][S02][S03][S04]

## 4) Governance patterns that appear robust across sources

Across standards, academic discussions, and implementation guidance, these controls recur:

1. Agent identity as first-class principal  
   Avoid shared keys; issue unique identities and credentials per agent/workload. [S45][S46][S48]

2. Least privilege + scoped tool grants  
   Separate read vs write vs high-impact operations with explicit policy gates. [S47][S48]

3. Human-in-the-loop for irreversible actions  
   Keep approvals for payments, destructive updates, legal/HR outcomes, and safety-critical actions. [S29][S39][S44]

4. Runtime observability and audit  
   Log task intents, tool invocations, auth context, and policy decisions; move from periodic to continuous monitoring. [S45][S46]

5. Defense-in-depth against prompt injection  
   Treat external content as untrusted; enforce policy at tool-invocation time, not only prompt filtering. [S47][S53]

6. Progressive autonomy rollout  
   Start with constrained workflows, then increase autonomy as reliability evidence improves. [S29][S30][S49]

## 5) Suggested enterprise baseline controls (practical checklist)

- Identity:
  - unique principal per agent/service;
  - credential rotation and revocation.
- Authorization:
  - policy-as-code (ABAC/RBAC hybrid);
  - explicit action classes (safe, sensitive, destructive).
- Runtime controls:
  - max-iteration, max-spend, max-scope boundaries;
  - circuit breakers and kill switches.
- Content controls:
  - source trust classification;
  - context boundary separation for untrusted inputs.
- Audit and evidence:
  - signed event logs where feasible;
  - traceability from user intent -> agent decision -> tool action.
- Governance:
  - ownership matrix (product, security, legal, compliance);
  - pre-production threat modeling for new agent capabilities.

## 6) Open issues (as of March 31, 2026)

- No single dominant cross-vendor identity framework for all agent protocols.
- Significant gap between developer guidance and measurable compliance evidence.
- Limited public incident taxonomies with standardized severity/scenario labels.
- Uneven maturity in inter-agent authorization for delegated chains of command.

## 7) Reliability and evidence caveats

- Gravitee statistics are useful directional indicators but vendor-produced. [S45][S46]
- Dev.to security posts can provide practical implementation heuristics, but should not be treated as formal standards. [S53]
- NIST/NCCoE work is at concept-paper stage, so requirements are still evolving. [S48]
