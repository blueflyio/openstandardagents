# Security and Governance Research

Research current as of 2026-06-10. Source keys refer to `reading-list.md`.

## Security state of the ecosystem

Agent adoption is ahead of security governance. Gravitee’s 2026 report is the clearest quantitative snapshot:

| Metric | Reported value | Source |
| --- | ---: | --- |
| Technical teams beyond planning | 80.9% | [S39] |
| Teams with full IT/security approval for the entire agent fleet | 14.4% | [S38], [S39] |
| Average share of agents actively monitored or secured | 47.1% | [S39] |
| Organizations with confirmed or suspected incidents in the last year | 88% | [S38], [S39] |
| Healthcare organizations with confirmed or suspected incidents | 92.7% | [S39] |
| Teams treating agents as independent identities | 21.9% | [S38], [S39] |
| Teams using shared API keys for agent-to-agent authentication | 45.6% | [S38], [S39] |
| Technical teams using custom, hardcoded authorization logic | 27.2% | [S39] |

The central conclusion is that many incidents are not caused by “rogue models.” They are caused by missing governance, identity, authorization, logging, and runtime policy enforcement [S38], [S39].

## Major threat classes

| Threat | Description | Why agents amplify it |
| --- | --- | --- |
| Prompt injection and goal hijack | Malicious instructions in user input, documents, websites, emails, tool outputs, or peer-agent messages alter the agent's goal. | The agent can act, not just answer; a hijacked plan can trigger API calls, emails, transactions, or deployments [S40], [S42]. |
| Excessive agency | Too much functionality, permission, or autonomy. | Hallucinations or injected instructions become damaging actions when broad tools and credentials are available [S41]. |
| Tool poisoning | Malicious tool descriptions, metadata, or outputs steer the model toward unsafe calls. | Agents often trust tool metadata as instruction-like context [S13], [S41]. |
| Identity and privilege abuse | Shared keys, inherited user credentials, generic service accounts, or agent impersonation. | Accountability and revocation fail when multiple agents share credentials [S15], [S38]. |
| Memory and context poisoning | Persistent or retrieved content carries malicious instructions or false data. | Poisoning can persist across sessions and propagate through RAG or memory systems [S13], [S42]. |
| Insecure inter-agent communication | Spoofed, tampered, or untrusted peer-agent messages. | Multi-agent systems create trust chains and cascading failure modes [S13], [S42]. |
| Unexpected code execution | Agents generate or run commands/code without adequate sandboxing. | Coding agents and ATP-like systems need strict execution isolation [S14], [S26], [S42]. |
| Cascading failures | Small errors propagate through planning, delegation, retries, or agent teams. | Multi-agent systems can amplify a bad assumption or unbounded loop [S13], [S42]. |

## NIST/NCCoE identity and authorization framework

NIST/NCCoE’s 2026 concept paper proposes a project to demonstrate how identity standards and best practices can be applied to software agents, with emphasis on agentic AI applications. It asks for community input on identification, authorization, auditing, non-repudiation, prompt injection controls, and standards for agent identity and access management [S15].

Technologies and standards under consideration include:

- OAuth 2.0/2.1 and extensions;
- OpenID Connect;
- SPIFFE/SPIRE workload identity;
- SCIM lifecycle management;
- NGAC policy models;
- Model Context Protocol;
- NIST SP 800-207 zero trust;
- NIST SP 800-63-4 digital identity;
- token and assertion protection guidance [S15].

The core governance shift is to treat agents as identity-bearing actors. An agent should not borrow a broad human credential or generic API key. It should have a distinct identity, task-scoped delegated authority, revocable credentials, and audit trails tying actions to the user, agent, policy decision, and tool [S15], [S40].

## OWASP and agentic-specific risks

OWASP LLM Top 10 2025 expanded Excessive Agency because agent architectures grant models more autonomy. Excessive Agency is caused by excessive functionality, excessive permissions, or excessive autonomy. Common triggers include hallucination, direct prompt injection, indirect prompt injection, compromised extensions, and malicious peer agents [S41].

The agentic-specific OWASP risk taxonomy adds risks that ordinary LLM applications do not fully cover:

- ASI01 Agent Goal Hijack;
- ASI02 Tool Misuse and Exploitation;
- ASI03 Identity and Privilege Abuse;
- ASI04 Agentic Supply Chain Vulnerabilities;
- ASI05 Unexpected Code Execution;
- ASI06 Memory and Context Poisoning;
- ASI07 Insecure Inter-Agent Communication;
- ASI08 Cascading Failures;
- ASI09 Human-Agent Trust Exploitation;
- ASI10 Rogue Agents [S42].

These categories align with the academic layered attack-surface model: defenses must cover memory, tools, multi-agent coordination, ecosystem, and governance layers, not only prompts [S13].

## Research-backed defensive architecture

The strongest pattern is layered, deterministic enforcement around a probabilistic agent.

| Control | Purpose | Sources |
| --- | --- | --- |
| Distinct agent identity | Separate humans, agents, services, and workloads; enable audit and revocation. | [S15], [S38], [S40] |
| Short-lived, scoped credentials | Reduce blast radius and prevent shared-key sprawl. | [S15], [S40] |
| Tool allowlists and capability manifests | Prevent agents from discovering or invoking tools outside their role. | [S03], [S40], [S41] |
| Schema validation and typed outputs | Stop hallucinated parameters and malformed side effects. | [S36], [S40] |
| Human-in-the-loop gates | Require explicit approval for irreversible or high-impact actions. | [S05], [S10], [S40], [S41] |
| Sandboxing and isolation | Contain code execution, browser actions, and untrusted plugins. | [S14], [S26], [S42] |
| Runtime intent verification | Check proposed actions against the original user goal and policy. | [S14], [S40], [S42] |
| Zero-trust inter-agent authorization | Do not trust peer agents by default; authenticate, authorize, and scope every delegation. | [S14], [S15], [S42] |
| Immutable audit logging | Reconstruct what the agent saw, decided, and did. | [S14], [S40] |
| Observability and SLOs | Trace steps, tool calls, costs, latency, and failures. | [S36] |

The Layered Governance Architecture paper operationalizes this as four layers: execution sandboxing, intent verification, zero-trust inter-agent authorization, and immutable audit logging. In its benchmark, combining layers performed better than relying on a single judge or prompt-level defense [S14].

## Prompt injection is not solvable by prompts alone

Security sources converge on a hard lesson: prompts are not enforceable security boundaries. Instructions can be overridden, untrusted content can be interpreted as instruction, and peer-agent messages or tool outputs can carry injection payloads [S40], [S41], [S42].

Recommended posture:

1. Treat all external content as data, not authority.
2. Strip identity and scope parameters out of agent-controlled schemas.
3. Evaluate every tool call before execution.
4. Require human approval for high-impact writes.
5. Use policy-as-code at the execution layer.
6. Log and replay complete action traces [S40], [S41].

## Web conduct, bot traffic, and the agentic web

MIT’s AI Agent Index finds no established standards for how agents should behave on the web. Many systems do not disclose robots.txt behavior, CAPTCHA handling, web access methods, or whether they identify themselves as AI agents [S09], [S11].

External web-traffic reporting suggests why this matters. HUMAN Security data cited by CNBC reported automated traffic growing almost eight times faster than human activity in 2025, and agentic traffic from autonomous AI agents growing nearly 8,000% over the prior year [S43]. Fastly frames 2026 infrastructure as a near 50/50 human/bot traffic split, requiring intent-based treatment of “wanted bots” rather than blunt blocking [S44].

Emerging responses include:

- Know Your Agent-style identity and accountability standards [S08];
- HTTP Agent Profile for cryptographic agent traffic authentication and human/agent lane separation [S45];
- agent-specific discovery and policy manifests;
- DUADP/ANP-style identity and discovery layers [S01], [S21].

## Governance recommendations

For any production agent deployment:

1. **Inventory all agents.** Include shadow agents, prototypes, external agents, and departmental automations.
2. **Assign owners.** Each agent needs a business owner, technical owner, risk tier, and incident contact.
3. **Give each agent a unique identity.** Avoid shared API keys and inherited human credentials [S15], [S38].
4. **Define a capability manifest.** Declare allowed tools, data domains, actions, budgets, and human approval thresholds [S03], [S04].
5. **Use delegated authorization.** Bind an agent action to the user, purpose, scope, time, and policy decision [S15], [S40].
6. **Gate dangerous actions.** Deletes, payments, permission changes, production deploys, bulk messages, and external writes require HITL or multi-party approval [S40], [S41].
7. **Trace every run.** Record prompts, tool calls, arguments, outputs, policy decisions, cost, and final side effects.
8. **Test adversarially.** Include direct/indirect prompt injection, tool poisoning, memory poisoning, peer-agent spoofing, and runaway cost scenarios [S13], [S14], [S42].
9. **Decommission deliberately.** Revoke credentials, remove discovery records, expire memory/state, and preserve audit logs.

## Security implications for OSSA and DUADP

OSSA and DUADP directly address several gaps:

- OSSA can declare identity, capabilities, tools, governance metadata, policy bindings, budgets, human oversight, and export targets [S03], [S04].
- DUADP can publish and resolve agents, tools, and skills with GAIDs, DID identity, signatures, trust tiers, federation witnesses, and revocation-oriented discovery [S01], [S02].

Neither is sufficient alone. They should be paired with runtime enforcement, OAuth/OIDC/SPIFFE-style identity, policy engines such as Cedar/NGAC, tracing, HITL, and secure tool gateways [S15], [S40].
