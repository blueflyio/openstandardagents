# Security and Governance

Report date: 2026-06-04

## Executive security view

Agent security is not only an LLM accuracy problem. It is an identity, authorization, observability, and governance problem. Agents can plan across steps, call tools, mutate systems, spend money, delegate to other agents, and accumulate state. That makes prompt injection and hallucination dangerous because they can become real actions [MIT-SLOAN-2026] [DEV-SECURITY] [ARXIV-SECURITY].

The strongest sources converge on the same control principle: every agent should be treated as a first-class security principal with scoped identity, delegated authorization, deterministic tool-call validation, revocation, and continuous auditability [NIST-NCCOE] [GRAVITEE-REPORT] [DEV-SECURITY].

## Empirical risk indicators

### MIT AI Agent Index

The 2025 AI Agent Index found rapid deployment and weak disclosure among 30 prominent agentic systems [MIT-INDEX]:

- 24 of 30 agents launched or received major agentic updates in 2024-2025 [MIT-INDEX].
- 25 of 30 disclose no internal safety results [MIT-INDEX].
- 23 of 30 have no third-party testing information [MIT-INDEX].
- Among 13 frontier-autonomy agents, only 4 disclose any agentic safety evaluations [MIT-INDEX] [MIT-DETAILS].
- Web conduct standards remain unsettled; browser agents often ignore `robots.txt` and some are explicitly designed to bypass anti-bot systems [MIT-DETAILS].

Implication: voluntary transparency is not enough for high-autonomy systems. Agent-specific system cards, safety evaluations, web-conduct policies, and identity verification need to become standard disclosure artifacts.

### MIT Sloan

MIT Sloan's 2026 decision-maker guidance says agentic AI is not ready for prime time yet because hallucinations, mistakes, prompt injection, and hijacking methods continue to slow adoption [MIT-SLOAN-2026].

MIT Sloan still expects agents to handle most transactions in many large-scale business processes within five years, which makes the near-term governance challenge urgent rather than optional [MIT-SLOAN-2026].

### Gravitee State of AI Agent Security 2026

Gravitee surveyed 919 executives and practitioners and reported a large adoption-control gap [GRAVITEE-REPORT]:

| Metric | Reported value |
| --- | ---: |
| Technical teams past planning | 80.9% |
| Organizations with full IT/security approval for all agents | 14.4% |
| Average agents actively monitored/secured | 47.1% |
| Organizations with confirmed or suspected incidents | 88% |
| Healthcare organizations with confirmed or suspected incidents | 92.7% |
| Teams treating agents as independent identities | 21.9% |
| Teams using shared API keys for agent-to-agent auth | 45.6% |
| Technical teams using hardcoded custom authorization logic | 27.2% |
| Organizations using IAM/IdP as auth server for MCP infrastructure | 23.7% |
| Builders citing insufficient observability as a primary obstacle | 57.4% |

Gravitee's conclusion is that the dominant risk is loss of control: who can do what, with which tools, on whose behalf, and with what audit trail [GRAVITEE-REPORT].

## NIST/NCCoE identity and authorization concept paper

NIST/NCCoE published "Accelerating the Adoption of Software and Artificial Intelligence Agent Identity and Authorization" on 2026-02-05. The concept paper explores how existing identity standards and best practices can apply to software and AI agents, with a focus on agentic AI applications [NIST-NCCOE].

NIST frames the problem as follows: AI agents can improve productivity, efficiency, and decision-making, but those benefits require understanding the risks of giving agents access to diverse data sets, tools, and applications, then applying appropriate identification and authorization controls [NIST-NCCOE].

Feedback areas include:

- Real-world agent use cases [NIST-NCCOE].
- Unique challenges compared with other software [NIST-NCCOE].
- Current and emerging identity/access-management standards [NIST-NCCOE].
- Technologies used to support agents [NIST-NCCOE].
- Identification, authorization, auditing, and non-repudiation of agents [NIST-NCCOE].
- Controls to prevent and mitigate prompt injection [NIST-NCCOE].

Standards mentioned in secondary coverage include OAuth 2.0/2.1 and extensions, OpenID Connect, SPIFFE/SPIRE, SCIM, Next Generation Access Control, Zero Trust Architecture, Digital Identity Guidelines, token/assertion protection guidance, and MCP as an agent communication layer [NIST-SEARCH].

## Threat model

### Prompt injection

Prompt injection occurs when malicious instructions enter the agent context and override or redirect the agent's behavior. Indirect prompt injection is especially dangerous because the malicious content can arrive through web pages, documents, emails, tickets, retrieved chunks, or other environmental data the agent processes [ARXIV-ATTACKS] [DEV-SECURITY].

Mitigation:

- Treat all model inputs and outputs as untrusted until validated [DEV-SECURITY].
- Separate data from instructions where possible.
- Gate tool calls through deterministic validators.
- Require HITL for irreversible or sensitive writes.
- Use allowlisted tools and schemas rather than free-form tool names/arguments.

### Excessive permissions

Agents often inherit service accounts, shared API keys, or human accounts with broad access. A compromised or confused agent can then access data or perform actions outside its intended scope [GRAVITEE-REPORT] [DEV-SECURITY].

Mitigation:

- Unique agent identity per deployed agent/version/instance where practical.
- Least-privilege scopes per task/tool.
- Short-lived credentials and just-in-time delegation.
- Permission reviews that aggregate all grants across the agent fleet.
- Deny-by-default tool access.

### Hallucinated actions and parameters

LLMs can invent tool names, endpoints, parameters, resources, or justifications. If the runtime executes those actions blindly, hallucination becomes an operational incident [DEV-SECURITY].

Mitigation:

- Strict tool schemas.
- Function/tool allowlists.
- Parameter validation with domain constraints.
- Output parsers and typed contracts.
- Refuse or escalate on unknown tool requests.

### No attribution and weak non-repudiation

If logs only show a service account or shared key, incident responders cannot determine which agent, version, user-delegation chain, model, or policy state caused the action [DEV-SECURITY] [GRAVITEE-REPORT].

Mitigation:

- Signed intent envelopes or equivalent structured action metadata.
- Agent IDs bound to deployment/version/provenance.
- User-on-behalf-of claims for delegated actions.
- Immutable audit trails for planning, tool selection, policy decision, execution, and result.

### Replay attacks

Captured requests can be repeated if tool execution lacks nonce/timestamp/replay checks [DEV-SECURITY].

Mitigation:

- Nonces.
- Timestamp windows.
- Proof-of-possession tokens.
- Idempotency keys for write operations.
- Signature verification at execution time.

### Missing kill switch and revocation

Agents need instant or near-instant revocation when compromised. Rotating keys and redeploying services can be too slow [DEV-SECURITY].

Mitigation:

- Revocation registry or cache.
- Policy engine that checks agent status before execution.
- Fleet-wide propagation of revocation decisions.
- Emergency stop rules for high-risk tools.

### Multi-agent and ecosystem threats

Recent security surveys identify higher-layer risks such as covert agent collusion, long-term memory poisoning, MCP supply-chain compromise, and governance-layer failures. These can accumulate across sessions or occur outside normal session boundaries [ARXIV-SECURITY].

Mitigation:

- Memory provenance and periodic memory audits.
- Tool/server provenance and allowlisted MCP registries.
- Cross-agent delegation logs.
- Rate limits and budget caps per agent and per chain of delegation.
- Sandboxes for risky execution.
- Cross-layer monitoring rather than isolated prompt filters.

## Recommended control architecture

### 1. Identity

Each agent should have a stable identity separate from human users and service accounts. Identity can be DID-based, workload-identity based, certificate-based, or IAM-native, but it must support lifecycle management, rotation, revocation, and audit [NIST-NCCOE] [GRAVITEE-REPORT].

OSSA/DUADP relevance:

- OSSA can declare agent identity, trust tier, signature, policy bindings, provenance, and governance metadata [OSSA-WEB] [OSSA-NPM].
- DUADP can resolve GAIDs and DIDs, verify signatures/provenance, and expose revocation/trust evidence [DUADP-WEB] [DUADP-NPM].

### 2. Authorization

Authorization should happen at execution time, not only at initial authentication. OAuth scopes and API keys are often too coarse for dynamic agent behavior [DEV-SECURITY].

Controls:

- Policy-as-code for action/resource/amount/domain/time constraints.
- User-on-behalf-of delegation.
- Rich authorization requests for high-risk actions where supported.
- Human approval for irreversible operations.
- Separate read, write, admin, and external-communication privileges.

### 3. Tool-call verification

Every tool call should pass through an enforcement point before execution:

1. Verify agent identity and revocation status.
2. Validate action is declared in the manifest/passport.
3. Validate schema and parameter constraints.
4. Check delegated user and policy context.
5. Check budget/rate limits.
6. Log decision and execution result.

This is the "chaperone" or verification-layer pattern recommended by security guides and compatible with OSSA policy bindings [DEV-SECURITY].

### 4. Observability and audit

Periodic audits are too slow for autonomous agents. Gravitee reports only 7.7% of organizations audit agent activity daily, while many rely on monthly reviews [GRAVITEE-REPORT].

Minimum logging:

- Agent ID, version, model, runtime.
- User/request/delegation context.
- Prompt/context source identifiers.
- Tool selection, arguments, and policy decision.
- External resources accessed.
- Cost/tokens/latency.
- Result, error, rollback, or HITL decision.

### 5. Progressive autonomy

Production teams should start with bounded workflows and expand autonomy as evaluation confidence grows. 47Billion's production experience recommends simple workflows first, cost monitoring before anything else, HITL for user-facing and regulated output, and progressive rollout from internal pilot to beta to GA [FORTYSEVEN].

Autonomy tiers:

1. Suggestion only.
2. Read-only tool use.
3. Low-risk writes with policy checks.
4. High-risk writes with HITL.
5. Autonomous high-risk writes only after evidence-based approval, monitoring, and rollback.

## Governance requirements

### Documentation

Every agent should have:

- Purpose and owner.
- Manifest/schema version.
- Tools and resources.
- Autonomy level.
- Data classes it can read/write.
- External systems it can contact.
- Cost budget.
- Evaluation evidence.
- Incident response owner.
- Revocation path.

### Human oversight

HITL should be risk-based. Use human checkpoints for:

- Payments/refunds.
- Account or permission changes.
- External email/messages.
- Deletes/overwrites.
- Production infrastructure changes.
- Medical, legal, financial, or employment-impacting recommendations.

### Supply chain

MCP servers, tools, agent cards, OSSA manifests, and DUADP registry entries are supply-chain artifacts. They should be signed, reviewed, versioned, scanned, and revocable.

### Web conduct

For web-facing agents:

- Identify agent traffic honestly.
- Respect published access policies where possible.
- Prefer cryptographic request signing over user-agent strings.
- Log on-behalf-of authorization.
- Avoid CAPTCHA bypass as a default behavior.
- Track emerging Web Bot Auth, SAIP, HAP, CAIP-122, and x402 approaches [TECHPOLICY] [WEB-IDENTITY-SEARCH].

## Minimum actionable checklist

- [ ] Unique agent identity exists.
- [ ] Manifest declares tools, capabilities, risk tier, and policy bindings.
- [ ] Tool calls are denied by default.
- [ ] Tool arguments are schema-validated.
- [ ] Short-lived credentials are used for tool access.
- [ ] HITL gates exist for high-risk actions.
- [ ] Revocation blocks execution before the next tool call.
- [ ] All actions have structured audit logs.
- [ ] Cost and iteration limits are enforced.
- [ ] MCP servers and external tools are allowlisted.
- [ ] Agent-to-agent delegation is logged and visible.
- [ ] Safety evaluations and third-party testing status are documented.
