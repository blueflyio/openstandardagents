# Security and governance research

Compiled on 2026-05-25.

## Core risk model

Agentic AI changes the security boundary because the system can plan, remember, call tools, write data, delegate to peers, and trigger external workflows. The major risks are prompt injection, excessive permissions, hallucinated actions, memory poisoning, tool poisoning, supply-chain compromise, unsafe delegation, web-conduct ambiguity, and accountability gaps [S17-S20][S48-S52].

Traditional app security assumptions break down when a probabilistic model holds credentials and chooses which tools to invoke. Prompt instructions are not enforceable policy. The safe pattern is to put deterministic controls between the agent's proposed action and every external effect [S50-S52].

## Key statistics

| Finding | Source |
| --- | --- |
| 24 of 30 prominent agents were released or had major agentic updates in 2024-2025. | MIT AI Agent Index [S11] |
| Only 4 of 13 frontier-autonomy agents disclosed agentic safety evaluations. | MIT AI Agent Index [S10][S11] |
| 25 of 30 disclosed no internal safety results; 23 of 30 had no third-party testing information. | MIT AI Agent Index [S10][S11] |
| 16 of 30 had no clear robots.txt, CAPTCHA, or web-access-method statement. | MIT AI Agent Index [S10][S11] |
| 81% of teams are past planning for AI agents, but only 14.4% have full security approval. | Gravitee [S48][S49] |
| 88% of organizations reported confirmed or suspected AI agent security/privacy incidents in the last year. | Gravitee [S48][S49] |
| Only 21.9% to 22% of teams treat agents as independent identities; many still rely on shared API keys. | Gravitee [S48][S49] |
| On average, only 47.1% of an organization's AI agents are actively monitored or secured. | Gravitee [S49] |
| 45.6% of teams still rely on shared API keys for agent-to-agent authentication. | Gravitee [S49] |
| Agentic AI traffic grew 7,851% year over year in 2025; 2.3% of agentic activity was on checkout pages. | HUMAN Security [S53] |

## Prompt injection and tool misuse

Prompt injection is especially damaging for agents because the model can convert malicious instructions into real actions. DEV security guidance identifies prompt injection, excessive permissions, and hallucinated actions as critical risks; hallucinated actions occur when models fabricate API calls or unsafe parameters that execution layers accept [S50].

The recurring mitigation is complete mediation. Every tool call should pass through an authorization gate that evaluates user, agent, task, tool, action, resource, parameters, tenant, risk, and policy before execution [S51][S52]. Tools should be whitelist-based with default deny, granular scopes, no self-escalation, and human approval for high-risk operations [S51].

## Identity and authorization

NIST/NCCoE is scoping a standards-based demonstration for applying existing identity and authorization practices to AI agents. It calls out identification, authentication, authorization, access delegation, auditing, non-repudiation, and prompt-injection mitigation [S13][S14].

The concept paper names standards and technologies that can be composed into an agent identity stack: OAuth 2.0/2.1, OpenID Connect, SPIFFE/SPIRE, SCIM, NGAC, MCP, zero trust, and NIST digital identity guidance [S14]. The main open problem is not whether these primitives exist, but how to apply them to autonomous, delegated, non-human actors at machine scale.

OSSA and DUADP address this gap from a manifest/discovery perspective. OSSA models agent identity, signed manifests, Cedar policy bounds, compliance metadata, audit pointers, and SBOM/provenance. DUADP resolves GAID/WebFinger/DID identity, verifies signatures, assigns trust tiers, and publishes revocation and governance evidence [S1][S2][S5][S6].

## MCP-specific security

MCP has become a high-value security surface because it standardizes tool access. The MCP threat-modeling paper identifies tool poisoning, where malicious instructions are embedded in tool metadata, as a prevalent and impactful client-side vulnerability [S20]. It proposes static metadata analysis, model decision-path tracking, behavioral anomaly detection, and user transparency mechanisms [S20].

A separate survey from 2025 frames "from prompt injections to protocol exploits" as a shift in threat modeling. It explicitly includes MCP, ACP, ANP, and A2A vulnerabilities in host-tool and agent-agent communications [S18].

Recommended MCP controls:

- Pin and inspect tool descriptions and schemas before exposing them to models [S20].
- Filter toolsets aggressively so agents see only the tools needed for the current task [S55].
- Use gateway policy enforcement for authentication, authorization, tenant boundaries, and parameters [S51][S52].
- Instrument per-tool latency, success, error code, output size, and tenant metrics [S55].
- Use sandboxing and human approval for tools with write, delete, payment, email, or production-impacting effects [S50-S52].

## Governance architecture

Harvard JOLT's "Know Your Agent" framing is a useful governance model. It requires agent identity, principal-agent linkage, delegation parameters, revocability, auditability, and behavioral records [S15]. This lines up with NIST's identity/authorization scope and Gravitee's finding that most teams do not yet treat agents as independent identities [S13][S15][S48].

Governance should be layered:

| Layer | Control |
| --- | --- |
| Identity | Unique agent DID/credential; principal linkage; rotation and revocation |
| Contract | Manifest with tools, scopes, risk tier, HITL gates, data classes, budgets |
| Authorization | Runtime policy gate; short-lived scoped credentials; no shared API keys |
| Execution | Sandbox, egress controls, rate limits, timeouts, deterministic validators |
| Observation | Tracing, per-tool metrics, audit logs, evidence retention |
| Response | Kill switch, revocation propagation, incident endpoints, rollback |

## Human-in-the-loop boundaries

MIT Sloan expects human-in-the-loop guardrails to remain necessary because hallucinations and prompt injection reduce trust in autonomous transactions [S12]. Production guidance agrees: simple workflows can be production-ready with validation and monitoring, tool-using agents need guardrails and cost limits, structured multi-agent systems need heavy guardrails and HITL checkpoints, and open-ended multi-agent systems remain too unpredictable for broad unsupervised use [S46].

HITL should be risk-based rather than universal. Low-risk read-only actions can often proceed automatically. Irreversible, high-value, external, or regulated actions should require approval, step-up authentication, or a separate deterministic verifier before execution [S50-S52].

## Recommended baseline controls

1. Give every production agent a unique identity; never share broad API keys across agents [S48][S49].
2. Declare allowed tools, scopes, domains, data classes, autonomy level, and HITL gates in a manifest [S2][S6].
3. Route all tool calls through a default-deny policy gateway [S51][S52].
4. Issue short-lived, audience-bound credentials only after the current action is approved [S51][S52].
5. Pin and review MCP tool metadata; monitor for tool poisoning and schema drift [S20].
6. Sanitize retrieved content and tool results before adding them to agent context [S17][S20].
7. Log the user, agent, task, tool, resource, parameters, policy decision, credential scope, and result for audit [S52].
8. Use per-tool observability, health/readiness endpoints, timeout budgets, circuit breakers, and chaos testing [S55].
9. Add revocation, incident response, and kill-switch paths before public rollout [S1][S5][S48].
10. Treat web conduct as a policy surface: robots.txt behavior, CAPTCHA handling, request signing, and traffic disclosure need explicit decisions [S10][S11].
