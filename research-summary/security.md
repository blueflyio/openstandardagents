# Security and Governance Research

## Summary

Agent security is now an identity, authorization, observability, and governance problem rather than only a model-safety problem. The core production risk is that an LLM-driven process can decide which tools to call at runtime while holding credentials, context, and permissions that were often designed for deterministic services [S39][S42][S43].

## Key statistics

| Finding | Source |
| --- | --- |
| 80.9% of technical teams are past planning and in active testing or production | Gravitee 2026 [S38] |
| Only 14.4% report all agents going live with full security/IT approval | Gravitee 2026 [S38] |
| 88% of organizations report confirmed or suspected AI agent security incidents in the last year | Gravitee 2026 [S38] |
| Only 21.9% treat agents as independent identities | Gravitee 2026 [S38] |
| 45.6% still rely on shared API keys for agent-to-agent authentication | Gravitee 2026 [S38] |
| 47.1% of an organization's agents are actively monitored or secured on average | Gravitee 2026 [S38] |
| 25/30 indexed prominent agents disclose no internal safety results | MIT AI Agent Index [S10][S11] |
| 23/30 indexed prominent agents have no third-party testing information | MIT AI Agent Index [S10][S11] |

## NIST and NCCoE direction

NIST launched an AI Agent Standards Initiative in 2026 to support industry-led standards, community-led protocols, and research into agent authentication and identity infrastructure [S47]. The initiative's strategic pillars are standards, open protocols, and research into authentication, identity, security evaluations, and secure human-agent and multi-agent interactions [S47].

NCCoE's February 5, 2026 concept paper focuses on applying identity standards and best practices to software agents, especially agentic AI applications [S12]. It asks for feedback on use cases, unique agent challenges, current and emerging standards, technologies supporting agents, identification, authorization, auditing, non-repudiation, and prompt-injection controls [S12].

The practical implication is that identity and authorization are becoming formal standards topics. OSSA and DUADP map directly to this direction: OSSA expresses identity, policies, provenance, and governance in manifests; DUADP provides DID-backed discovery, trust tiers, and federation evidence [S01][S03][S12].

## Threat model

ACM's AI agent security survey organizes agent risks around four knowledge gaps [S42]:

1. Unpredictability of multi-step user inputs.
2. Complexity in internal execution.
3. Variability of operating environments.
4. Interaction with untrusted external entities.

The same survey separates agent structure into perception, brain/reasoning/planning, action/tool execution, and interaction with environment, memory, and other agents [S42]. This is useful because controls must exist at multiple points:

- Input filtering and instruction hierarchy at perception.
- Planning constraints, validation, and trace review inside reasoning.
- Tool gateway authorization and sandboxing at action.
- Provenance, isolation, and verification for environment/memory/agent interactions.

The arXiv survey "From Prompt Injections to Protocol Exploits" expands this to four attack domains: input manipulation, model compromise, system and privacy attacks, and protocol vulnerabilities [S43]. It explicitly includes vulnerabilities in MCP, ACP, ANP, and A2A, and catalogs more than 30 attacks [S43].

## Major risk categories

### Prompt injection and goal hijacking

Prompt injection attempts to insert malicious instructions that override the intended system behavior. Agent settings make this more dangerous because successful injection can lead to tool calls, API access, code execution, or irreversible external actions [S39][S42][S43].

Research examples include direct prompt injection, context-ignoring injection, fake completion injection, multimodal injection, jailbreaks, long-context hijacks, and indirect prompt injection from web pages, files, memory, or other agents [S42][S43].

### Excessive permissions and shared credentials

Traditional service accounts assume deterministic behavior. AI agents are non-deterministic actors: the same input class may lead to different tool choices depending on context and model reasoning [S39]. If the agent has broad credentials, the blast radius is its whole permission set [S39].

Gravitee's data shows the field has not caught up: only 21.9% treat agents as independent identities, while 45.6% use shared API keys and 27.2% use custom hardcoded authorization logic [S38].

### Hallucinated or unintended actions

Agents can hallucinate tools, call tools repeatedly, misunderstand scope, or take actions that are technically authorized but operationally wrong [S36][S39]. Production teams should enforce strict tool whitelists, schema validation, maximum iteration/tool-call counts, cost caps, and deterministic fallback paths [S36][S39].

### Multi-agent contagion and untrusted agent interactions

Multi-agent systems create new risks: compromised agents can influence other agents, malicious messages can propagate, and responsibility can fragment across model provider, framework, deployer, tool owner, and downstream user [S10][S42][S43]. The MIT Index calls this "accountability fragmentation" because no single actor controls the full stack [S11].

### Protocol vulnerabilities

Protocols reduce integration sprawl but create shared attack surfaces. Research identifies risks in MCP, ACP, ANP, and A2A, including protocol abuse, malicious tool metadata, weak discovery, credential leakage, unauthorized delegation, and insufficient provenance [S43]. Protocol adoption must be paired with identity, signing, access control, conformance testing, audit logs, and runtime monitoring [S12][S39][S43].

## Controls and recommendations

### Identity

- Give every agent instance a unique identity.
- Avoid shared API keys.
- Use short-lived, scoped credentials.
- Bind credentials to session, agent identity, deployment environment, and allowed tools.
- Record the upstream human, organization, or service that authorized the agent [S12][S38][S39][S44].

DUADP's GAID/DID flow and OSSA's signed manifests are directly relevant here [S01][S03].

### Authorization

- Default-deny tool access.
- Use granular, action-specific scopes.
- Evaluate policy dynamically using user context, time, risk, data sensitivity, and environment.
- Require human approval for high-risk actions such as refunds, account deletion, bulk messaging, code execution, production writes, or PII export [S39].

OSSA's Cedar policy integration is a concrete mechanism for pre-authorized boundaries in the manifest [S01][S04].

### Tool gateway enforcement

All tool calls should pass through a gateway that verifies identity, checks session validity, validates input schema, applies authorization policy, rate-limits, sanitizes parameters, logs the request, and optionally requests human approval before execution [S39].

MCP servers can be used as the tool boundary, but the security decision point should not be left to the LLM. The model can propose an action; the gateway must decide whether it is allowed [S13][S39].

### Human-in-the-loop

Human-in-the-loop is required for high-stakes, irreversible, or low-confidence actions. MIT Sloan states that human guardrails remain necessary because hallucinations and prompt injection still limit autonomous readiness [S45]. 47Billion's production experience likewise treats approval gates, review/edit, escalation, and feedback loops as production patterns rather than afterthoughts [S36].

### Observability and audit

Log agent identity, session ID, triggering user/source, model, prompt version, tool name, sanitized parameters, reasoning summary, policy decision, result, latency, tokens, cost, and trace ID [S39]. Logs should distinguish AI-agent actions from human actions and be immutable enough for forensic reconstruction [S39].

### Web conduct and identification

The MIT Index finds no established standards for how agents should behave on the web and notes that some browser agents are designed to bypass anti-bot systems [S10]. Harvard law scholarship argues that transparent agent identification is a prerequisite for any viable governance model, but that identity could be protocol-based rather than platform-specific [S44].

Emerging controls include signed requests, web bot authentication, Know Your Agent standards, proof-of-personhood for humans, agent credentials, verifiable delegation, and audit traces [S09][S44][S46].

## How OSSA and DUADP address security gaps

OSSA contributes:

- W3C DID-compatible agent identity.
- Signed manifests and provenance/SBOM metadata.
- Cedar policies for access boundaries.
- Compliance metadata and control mappings.
- Human oversight, cost controls, and observability declarations.
- Export fidelity across multiple platforms [S01][S04].

DUADP contributes:

- GAID lookup handles and WebFinger resolution.
- DID document verification.
- Ed25519 signing and verification.
- Federation witnesses, revocation, provenance, trust tiers, and policy-gated discovery.
- MCP/REST interfaces for discovery and governance checks [S03][S06].

Together, they are best viewed as an identity, contract, and discovery guardrail around the protocol stack.

## Residual risks

1. Schema validation is not behavioral validation. A valid manifest can still describe a dangerous agent.
2. Signed provenance proves origin, not correctness.
3. DID-based discovery must still handle revocation, key rotation, compromised publishers, and trust-tier gaming.
4. Human-in-the-loop can become rubber-stamping without good UX, clear risk summaries, and accountability.
5. Protocol conformance does not guarantee secure deployment; runtime policy enforcement remains mandatory.
