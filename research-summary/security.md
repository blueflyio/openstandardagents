# Security and Governance (2025-2026)

## 1) Empirical security posture snapshot

Gravitee’s 2026 report and companion write-up (surveying 900+ practitioners/executives) indicate a clear adoption-vs-control imbalance:
- 81% of teams beyond planning stage,
- 14.4% with full security approval,
- 88% reporting confirmed or suspected incidents,
- and low rates of treating agents as independent identities. [S37][S38]

These numbers should be interpreted as industry-report survey data (not a universal baseline), but they align with broader field observations: deployment speed is outpacing governance maturity.

## 2) Threat model focus areas

Across practitioner guidance and research, three recurring operational risks dominate:
1. **Prompt injection** (direct and indirect),
2. **Excessive permissions / over-scoped credentials**,
3. **Hallucinated or unsafe actions with real-world side effects**. [S26][S30][S39]

Dev-focused security guides from 2026 increasingly frame agent risk as "action risk" rather than "text risk": the danger is not just wrong output, but wrong output connected to privileged tools. [S39]

## 3) Identity and authorization as the center of gravity

NIST/NCCoE’s concept paper explicitly calls for identity, authentication, authorization, auditing, and non-repudiation patterns that are specific to software and AI agents. [S34]

NIST’s broader AI Agent Standards Initiative reinforces this direction with strategic emphasis on secure interoperability and trust infrastructure. [S35][S36]

Implication:
- Agent deployments should stop treating autonomous actors as generic service accounts and instead issue distinct identities with auditable delegated authority chains.

## 4) Protocol-level security implications

| Layer | Typical risk | Recommended controls |
|---|---|---|
| Discovery/federation | impersonation, poisoned registries, untrusted peers | signed metadata, DID/PKI-backed identity, trust-tier gating, revocation flows [S03][S16] |
| Agent-to-tool | over-broad tool grants, data exfiltration via tool misuse | least-privilege tool scopes, policy engine checks, runtime approvals for high-impact actions [S09][S34][S39] |
| Agent-to-agent | opaque delegation chains, trust leakage across domains | signed task provenance, explicit inter-agent auth context, bounded delegation depth [S11][S13][S34] |
| Agent-to-UI | event spoofing/injection, unsafe user-triggered escalation | typed events, authenticated sessions, action confirmation for destructive operations [S14][S15][S39] |

## 5) Governance controls that appear repeatedly

Practical controls that show up across standards, reports, and production guidance:
- unique machine identities per agent instance/workflow,
- policy-as-code authorization for every high-risk tool call,
- immutable audit/event trails for who/what/why at action time,
- human-in-the-loop gates for irreversible or compliance-sensitive actions,
- default-deny behavior when confidence/validation checks fail. [S34][S35][S38][S39]

## 6) Internet-scale policy context

Harvard policy work on the "agentic web" highlights institutional concerns around accountability and protocol governance as automation traffic grows. [S28]

Imperva’s bot-traffic reporting context is directionally relevant to this debate: automated traffic pressure is no longer niche and has become central to platform governance design. [S40]

## 7) Recommended baseline security architecture for 2026 deployments

1. **Identity-first**: issue cryptographically verifiable agent identities and rotate short-lived credentials. [S34][S36]
2. **Action authorization**: evaluate policy at execution time, not just at login/session creation. [S34][S39]
3. **Bounded autonomy**: enforce policy budgets (tool limits, spend limits, time limits, delegation depth). [S26][S27]
4. **Protocol observability**: trace every run/handoff/tool call with tamper-evident logs. [S41][S47]
5. **Incident readiness**: include kill-switch and rapid revocation pathways in runtime architecture. [S03][S38]
