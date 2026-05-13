# Security and Governance

Prepared: 2026-05-13.

## State of adoption and governance

Gravitee's State of AI Agent Security 2026 report surveyed more than 900 executives and technical practitioners. Its core finding is an adoption-control gap: 80.9% of technical teams are past planning and into testing or production, but only 14.4% report full security/IT approval for their entire agent fleet [S72].

Key statistics from Gravitee [S72]:

| Finding | Value |
|---|---:|
| Technical teams past planning | 80.9% |
| Full security/IT approval | 14.4% |
| Confirmed or suspected incidents | 88% |
| Healthcare incident rate | 92.7% |
| Agents actively monitored/secured | 47.1% average |
| Teams treating agents as independent identities | 21.9% |
| Teams relying on shared API keys | 45.6% |
| Teams using custom hardcoded authorization | 27.2% |
| Deployed agents able to create/task another agent | 25.5% |

This reinforces a central conclusion: agents must become first-class security principals. If agents share human credentials or generic service accounts, audit chains break when agents delegate tasks, create sub-agents, or trigger cross-system actions [S72].

## NIST/NCCoE identity and authorization direction

NIST/NCCoE released an initial public concept paper on 2026-02-05, "Accelerating the Adoption of Software and Artificial Intelligence Agent Identity and Authorization" [S21]. It asks for feedback on use cases, challenges, standards, technologies, identification, authorization, auditing, non-repudiation, and prompt injection mitigation for software and AI agents [S21].

The important point is not a finished standard, but a formal shift in scope: identity and access management must account for autonomous software agents that access tools, datasets, and applications. Existing building blocks such as OAuth, OpenID Connect, SCIM, SPIFFE, NGAC, NIST SP 800-207 zero trust, and NIST SP 800-63-4 digital identity are candidates, but agent-specific delegation and audit patterns are still being worked out.

## Major threat classes

Recent academic surveys and security guides converge on six recurring threat classes [S19, S20, S73]:

| Threat class | Description | Common controls |
|---|---|---|
| Prompt abuse | Direct injection, jailbreaks, goal hijacking | Instruction/content separation; prompt hardening |
| Environment injection | Malicious webpages, emails, docs, UI elements | Untrusted-content labeling; retrieval filters |
| Memory attacks | Persistent poisoning or leakage | Memory ACLs; expiry; inspection; provenance |
| Toolchain abuse | Tool inversion, malicious tool outputs, unsafe chains | Least privilege; tool policies; mediation |
| Model tampering | Backdoors and hidden triggers | Model provenance; evals; supply-chain review |
| Agent network attacks | Injection propagation across agents | Identity; delegation constraints; traceability |

"From Prompt Injections to Protocol Exploits" argues that brittle plugin APIs and protocol adapters often rely on ad-hoc authentication, inconsistent schemas, and weak validation. It catalogs more than 30 attack techniques across input manipulation, model compromise, system/privacy attacks, and protocol vulnerabilities [S19].

"From Secure Agentic AI to Secure Agentic Web" argues that web-scale agents escalate local failures into ecosystem risks through cross-domain delegation chains, heterogeneous service agents, and protocol-mediated interactions [S20].

## Prompt injection and tool misuse

The DEV security guide highlights why agent prompt injection is worse than chatbot prompt injection: agents can act. Indirect prompt injection can hide instructions inside tickets, documents, emails, or webpages; tool inversion can make legitimate tools perform illegitimate actions; multi-step reasoning can gather, synthesize, and exfiltrate sensitive data [S73].

Controls should be enforced in code and infrastructure, not only in prompts [S73]:

- Use least privilege for each agent and each tool.
- Avoid generic high-power tools such as unrestricted SQL execution.
- Wrap tools around narrow operations with validated schemas.
- Treat tool arguments emitted by the model as untrusted input.
- Require human approval for high-impact actions.
- Intercept planned tool calls and validate them against policy.
- Red-team multi-step attacks, not only single prompts.

## Identity, authorization, and trust tiers

DUADP, OSSA, ANP, NIST, and Gravitee point toward the same direction: identity must be native to agent systems [S01, S02, S03, S36, S37, S72].

Important primitives:

- GAID or agent URI as stable lookup handle [S01, S02].
- DID as cryptographic identity document [S01, S02, S36, S37].
- Signature verification for manifests and resource integrity [S01, S02, S03].
- Trust tiers as policy inputs, not marketing labels [S01, S02, S03].
- Explicit authorization before tool context reaches the model [S03].
- Revocation and incident endpoints for compromised agents [S01].
- Audit logs and provenance chains [S01, S03, S72].

OSSA embeds Cedar policy concepts and compliance metadata into manifests; DUADP uses trust-tier gating, DID-verified nodes, and signed registries; ANP's did:wba specification uses Ed25519 key binding, HTTP Message Signatures, and Content-Digest for cross-platform authentication [S01, S03, S37].

## Governance controls

Recommended controls across sources [S10, S14, S16, S19, S20, S70, S72, S73]:

1. **Agent inventory.** Maintain a registry of all agents, owners, credentials, data access, tools, models, and deployment status.
2. **Identity per agent.** Use unique agent identities rather than shared keys.
3. **Least-privilege tools.** Grant only task-specific operations.
4. **Pre-authorization.** Evaluate policy before the LLM receives sensitive context or can execute an action.
5. **Human checkpoints.** Require approval for irreversible, financial, security-sensitive, or external-communication actions.
6. **Cost limits.** Cap iterations, tokens, tool calls, and spend per task.
7. **Traceability.** Log prompts, tool calls, decisions, approvals, memory writes, and delegation chains.
8. **Red teaming.** Test direct injection, indirect injection, tool inversion, memory poisoning, and cross-agent propagation.
9. **Kill switches and revocation.** Disable compromised agents, credentials, or peer nodes quickly.
10. **Continuous monitoring.** Move from periodic audits to identity-aware runtime enforcement.

## Security architecture pattern

Recommended reference pattern:

1. **Manifest layer:** OSSA manifest declares identity, tools, autonomy, policy, observability, compliance, and export target [S03, S04].
2. **Discovery layer:** DUADP or ANP resolves agent identity, trust tier, endpoints, capabilities, and revocation state [S01, S02, S36].
3. **Protocol gateway:** MCP/A2A/ACP/AG-UI gateways authenticate callers, enforce scopes, and log events [S30, S32, S34, S39].
4. **Policy engine:** Cedar/OPA/NGAC-style checks evaluate tool use, data access, delegation, and approval requirements.
5. **Runtime guardrails:** Validate input/output, mediate tools, sandbox code, watch costs, and require HITL for sensitive actions [S41, S73].
6. **Audit and response:** Store traces, provenance, signatures, approvals, and incident response events [S01, S03, S72].

## Residual risks

- Model behavior remains stochastic; deterministic policy must sit outside the model.
- Cross-agent delegation can propagate malicious context through otherwise trusted agents.
- Tool ecosystems resemble software supply chains; third-party MCP/ATP/OpenAPI connectors need provenance and patching.
- Browser agents remain a weak point until web conduct, bot authentication, and proof-of-personhood mechanisms mature [S13, S15].
- Security metrics are still immature. Teams should evaluate trajectories, not only final answers [S19, S20, S70].
