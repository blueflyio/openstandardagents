# Security and governance

Research snapshot: May 17, 2026.

## Summary

Agent security is shifting from content filtering to identity, authorization, tool-call enforcement, provenance, and audit. The dominant risk is not merely that an LLM says unsafe text; it is that a system with valid credentials takes an unsafe action through an authorized tool. NIST/NCCoE, MIT, Gravitee, and recent arXiv work all point toward the same controls: first-class agent identities, least privilege, session-aware authorization, human approval for high-risk actions, runtime policy enforcement, tracing, and strong treatment of external tool observations as untrusted data [S20][S35][S36][S37][S38][S39].

## Main risks

| Risk | Why it matters | Representative sources |
| --- | --- | --- |
| Prompt injection | Untrusted content can override or compete with trusted instructions in the agent context | [S38][S39] |
| Indirect prompt injection | Malicious instructions can arrive through websites, documents, logs, RAG, MCP servers, or tool observations | [S38][S39] |
| Excessive permissions | Agents can perform real actions with broad credentials even if the request looks legitimate | [S36][S37] |
| Hallucinated actions | False conclusions can trigger real-world changes if not gated | [S21][S33] |
| Shared credentials | Shared API keys and service accounts break accountability and audit chains | [S36] |
| Safety transparency gaps | Public agents often disclose capabilities more than safety practices | [S20] |
| Web conduct gaps | Browser agents may ignore robots.txt or bypass anti-bot systems without settled norms | [S20] |

## NIST/NCCoE concept paper

NIST's National Cybersecurity Center of Excellence published "Accelerating the Adoption of Software and Artificial Intelligence Agent Identity and Authorization" on February 5, 2026 [S35]. The concept paper asks how identity standards and best practices can apply to software agents, with focus on agentic AI applications that use data and algorithms to autonomously perform tasks [S35].

NIST's framing is important because it treats agents as a new IAM problem. As agents gain access to datasets, tools, and applications, organizations need identification and authorization controls that address the risk of broad system privileges [S35]. NIST requested feedback on use cases, unique challenges, current/emerging IAM standards, technologies, identification, authorization, auditing, non-repudiation, and controls to prevent and mitigate prompt injection [S35].

Implication: organizations should expect agent identity and authorization to become a standards and compliance topic, not just an application-design choice.

## Gravitee State of AI Agent Security 2026

Gravitee surveyed more than 900 executives and technical practitioners and found a major adoption/control gap [S36].

Key statistics:

- 81% of teams are past planning; 80.9% of technical teams are in active testing or production [S36].
- Only 14.4% report full security/IT approval for the entire AI agent fleet [S36].
- 88% of organizations reported confirmed or suspected AI agent security incidents in the previous year; healthcare reached 92.7% [S36].
- Only 21.9% of teams treat agents as independent identity-bearing entities [S36].
- 45.6% use shared API keys for agent-to-agent authentication [S36].
- 27.2% use custom hardcoded authorization logic [S36].
- On average, only 47.1% of an organization's AI agents are actively monitored or secured [S36].

Recommendation: move from periodic manual audits to continuous, identity-aware enforcement, and treat agents as first-class security principals [S36].

## MIT AI Agent Index safety findings

MIT's 2025 AI Agent Index documents a transparency gap between capability and safety disclosure [S20]. Of 13 agents exhibiting frontier autonomy, only 4 disclose agentic safety evaluations. Across the full set of 30 indexed agents, 25 disclose no internal safety results and 23 disclose no third-party testing [S20].

The Index also highlights unsettled web conduct standards: browser agents often ignore robots.txt, and some are designed to bypass anti-bot systems. MIT notes that content hosts cannot reliably verify or control agent access, and only one indexed agent used cryptographic request signing [S20].

Recommendation: require safety disclosures, third-party evaluations for high-autonomy agents, signed agent traffic, and clear web-conduct policies for browser agents.

## Prompt injection research

The arXiv SoK "The Landscape of Prompt Injection Threats in LLM Agents" analyzes 78 papers through October 20, 2025 and argues that prompt injection is a privilege-isolation failure [S38]. Agents place trusted prompts, user prompts, tool observations, RAG data, and sometimes supply-chain data into a single context where the model processes all text semantically [S38]. Untrusted inputs can therefore compete with system instructions and hijack behavior [S38].

Important findings:

- Attack surfaces include direct prompt injection, indirect prompt injection, and supply-chain prompt injection [S38].
- Agent-specific research increasingly focuses on indirect injection because agents consume external data and tool observations [S38].
- Existing defenses face a trilemma: no tested defense simultaneously provides high trustworthiness, high utility, and low latency [S38].
- Many defenses overfit static benchmarks and fail in realistic context-dependent tasks where agents legitimately need environmental observations [S38].

The AdapTools paper focuses on adaptive tool-based indirect prompt injection against agentic LLMs and MCP-like external data services [S39]. It reports that adaptive attacks can improve attack success 2.13x while degrading utility by 1.78x, and that a growing MCP ecosystem with many third-party servers expands the attack surface [S39]. The paper specifically models attacks through external services, malicious observations, and stealthy tool selection [S39].

Recommendation: treat tool observations and retrieved content as untrusted, enforce privilege separation outside the model, and test against adaptive/context-aware attacks rather than static "ignore previous instructions" templates.

## Runtime authorization gap

The Dev.to authorization analysis argues that agent authorization is not the same as traditional user-resource authorization [S37]. Traditional authorization asks: "does this user have access to this resource?" Agent authorization asks: "does this user, in this session, with this behavioral history, have permission to call this specific tool with these exact parameters given the conversation so far?" [S37].

The article argues for five decision types rather than binary allow/deny:

- Allow.
- Deny.
- Modify, such as filtering/redacting output before the model sees it.
- Defer to a human.
- Step-up authentication [S37].

It also distinguishes guardrails from authorization: guardrails ask whether input/output is safe, while authorization asks whether an action is permitted [S37]. The missing layer is a runtime middleware between agent and tools that evaluates each tool call in context [S37].

Recommendation: implement per-tool, per-parameter, session-aware authorization outside the model. Use monotonic trust degradation when suspicious patterns accumulate.

## Governance controls

Minimum controls for production agents:

1. Agent identity: unique identity per agent, not shared API keys or generic service accounts [S35][S36].
2. Least privilege: scope tools, datasets, and actions to the minimal operation set [S37][S38].
3. Per-tool authorization middleware: evaluate the call, parameters, session history, risk, and user/agent identity before execution [S37].
4. Non-binary decisions: allow, deny, redact/modify, defer, step-up [S37].
5. Human-in-the-loop: approval gates before irreversible or regulated actions [S21][S33].
6. Provenance and signatures: verify manifests, DIDs, publisher metadata, and supply-chain evidence where available [S01][S02].
7. Audit logging and tracing: log decisions, tool calls, outputs, approvals, model versions, prompts/config versions, and policy outcomes [S24][S33][S36].
8. Revocation and federation hygiene: propagate revocations for compromised identities in discovery meshes [S01].
9. Web conduct policies: respect robots.txt unless there is a documented, legally reviewed exception; sign agent traffic where possible [S20].
10. Evaluation against realistic attacks: include indirect injection, supply-chain poisoned data, context-dependent tasks, and adaptive attack generation [S38][S39].

## Where OSSA and DUADP help

OSSA can carry the contract: declared identity, capabilities, compliance requirements, human-in-the-loop points, cost controls, state, trust tier, and Cedar policy metadata [S02][S03]. This helps centralize governance information that otherwise gets scattered across framework config, deployment manifests, and prompts.

DUADP can carry discovery and evidence: GAID lookup, WebFinger resolution, DID documents, signature verification, provenance, federation witnesses, revocation state, and trust tiers [S01][S04]. This helps make an agent discoverable and verifiable before another agent connects.

Neither replaces runtime security. A valid OSSA manifest or DUADP DID should be an input to authorization, not the authorization itself. Enforcement still belongs in the runtime path between the agent and tools/actions [S35][S37][S38].
