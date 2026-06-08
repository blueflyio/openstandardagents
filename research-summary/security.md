# Security and governance research

_Last updated: June 8, 2026._

## Current state of agent security

Security adoption is behind agent adoption. Gravitee's 2026 survey of 919 executives and practitioners reports that 81% of teams are past the planning phase, but only 14.4% have full IT/security approval for their entire agent fleet. It also reports that only 47.1% of an organization's agents are actively monitored or secured on average. [S29]

Incidents are already common. Gravitee reports that 88% of organizations confirmed or suspected an AI agent security or privacy incident in the prior year, rising to 92.7% in healthcare. It identifies missing governance, identity, and runtime policy enforcement as the recurring root causes rather than "rogue models" alone. [S29]

Identity is the central architectural gap. Gravitee reports that only 21.9% of teams treat agents as independent, identity-bearing entities, 45.6% rely on shared API keys for agent-to-agent authentication, and 27.2% use custom hardcoded authorization logic. NIST/NCCoE's February 2026 concept paper similarly focuses on identification, authorization, auditing, non-repudiation, delegation, prompt-injection controls, and the application of OAuth, OpenID Connect, SPIFFE/SPIRE, SCIM, NGAC, zero trust, and MCP. [S12] [S29]

## Main risks

| Risk | What changes with agents | Recommended controls |
|---|---|---|
| Prompt injection and goal hijack | External content can redirect a multi-step workflow, not just one response. | Treat all tool/RAG/web/memory content as untrusted; validate before action; use policy outside the model. [S30] [S31] [S32] |
| Tool misuse and hallucinated actions | The model may fabricate parameters or invoke legitimate tools destructively. | Tool schemas, allowlists, deny-by-default gateways, human approval for high-risk writes. [S30] [S31] [S32] |
| Identity and privilege abuse | Agents inherit broad human/service credentials and can become confused deputies. | Unique agent identity, scoped short-lived tokens, delegation chains, revocation, per-action authorization. [S12] [S29] [S32] |
| Supply-chain/tool poisoning | MCP/tool descriptors and responses become trusted model context. | Manifest signing, descriptor scanning, response validation, sandboxing, provenance. [S31] [S32] |
| Memory/context poisoning | Long-running agents persist corrupted state across sessions. | Memory ACLs, provenance labels, reviewable state, checkpoint audits, reset paths. [S35] |
| Cascading failures/cost loops | Multi-agent loops can fan out at machine speed. | Loop detection, cost budgets, circuit breakers, max-depth/max-call limits. [S27] [S33] |
| Web conduct and impersonation | Agents browse at scale and may mimic humans or bypass bot protections. | Agent request signing, web-conduct policies, KYA credentials, robots/CAPTCHA standards. [S10] [S34] |

## NIST/NCCoE direction

The NIST/NCCoE concept paper, published February 5, 2026 with comments due April 2, 2026, proposes a project to demonstrate how identity standards and best practices can be applied to software and AI agents. It asks about use cases, challenges, standards, technologies, identification, authorization, auditing, non-repudiation, and controls to prevent or mitigate prompt injection. [S12]

The standards under consideration include MCP, OAuth 2.0/2.1 and extensions, OpenID Connect, SPIFFE/SPIRE, SCIM, NGAC, NIST SP 800-207 Zero Trust Architecture, SP 800-63-4 Digital Identity Guidelines, and NISTIR 8587 on protecting tokens and assertions. The most important unresolved pattern is multi-hop delegation: Agent A invokes Agent B, which invokes Agent C, while preserving least privilege and auditability. [S12]

## OWASP and agent-specific threat models

OWASP Top 10 for Agentic Applications 2026 identifies risks specific to agents that plan, act, and make decisions across workflows. Secondary summaries name risks such as Agent Goal Hijack, Tool Misuse and Exploitation, Agent Identity and Privilege Abuse, Agentic Supply Chain Compromise, Unexpected Code Execution, Memory and Context Poisoning, Insecure Inter-Agent Communication, Cascading Agent Failures, Human-Agent Trust Exploitation, and Rogue Agents. [S32]

OWASP-aligned guidance emphasizes "Least Agency": narrower, task-specific permissions, tools, memory, communication scope, and autonomy than ordinary least privilege. This means a human may have permission to delete a record, but an agent acting on that human's behalf may still require approval, narrower scope, or a task-specific token. [S32]

## MCP-specific threats

MCP threat research identifies tool poisoning as an indirect prompt injection attack. A malicious MCP server can make a tool look benign while hiding instructions in the tool description or response; the LLM then treats those instructions as trusted context and may leak data or call privileged internal tools. OWASP community guidance says the root cause is a trust gap between connect-time review and runtime tool output. [S31]

Controls include cryptographic signatures for tool manifests, semantic vetting of descriptors, strict schemas, least privilege, read-only defaults, network isolation, anomaly detection, human approval for high-risk operations, and separation between untrusted external tool outputs and trusted internal tools. [S31]

## Runtime authorization and pre-action gates

The strongest security recommendations move enforcement outside the model. Pre-action authorization runs before every tool call and evaluates tool name, parameters, agent identity, delegation chain, context, and policy. If the policy denies the action, the tool never executes. This remains effective even when prompt injection persuades the model to request a forbidden action. [S30] [S31]

Practical patterns include blocking hooks, policy-as-code, fail-closed behavior, immutable audit logs, scoped credentials, risk-based human approval, deterministic fallbacks, and sandboxed execution. CrewAI tool hooks and OpenAI tool guardrails are examples of framework-level surfaces where these controls can be implemented. [S21] [S23] [S30]

## Governance frameworks

Academic and policy frameworks agree that model-centric governance is insufficient for agents. Berkeley's Agentic AI Profile extends NIST AI RMF to autonomy, authority, tool access, environment, and interaction effects. GovTech Singapore's ARC Framework gives a capability taxonomy, risk register, and controls. ACM's policy brief recommends multi-agent interaction risk assessment and multi-agent-specific cybersecurity audits. [S35]

Harvard JOLT's KYA proposal supplies a governance vocabulary for the open web: cryptographic agent identity, principal-agent linkage, delegated authority scope, revocability, and audit logs. This closely matches the identity/discovery gap that DUADP and OSSA attempt to address with DIDs, GAIDs, signed manifests, and trust tiers. [S01] [S02] [S34]

## How OSSA and DUADP map to the security problem

OSSA provides manifest-level governance: agent identity, capabilities, policies, compliance metadata, HITL points, cost controls, state management, signatures, and export targets. DUADP provides discovery-time trust: GAID lookup, WebFinger resolution, DID documents, Ed25519 signatures, provenance, revocation, trust tiers, federation witnesses, and governance evaluation endpoints. [S01] [S02] [S03] [S07]

These mechanisms are necessary but not sufficient. They should feed a runtime control plane that issues short-lived credentials, checks every tool call against policy, blocks unauthorized actions, logs decisions, and supports emergency revocation. [S12] [S29] [S30] [S31] [S32]
