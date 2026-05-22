# Security and Governance Research

Prepared on May 22, 2026. Citations use the source IDs in [reading-list.md](reading-list.md).

## Executive findings

Agent security risk is concentrated at the execution layer. Prompt injection, hallucination, compromised tools, malicious peer agents, and poisoned retrieval become damaging when the agent has broad credentials, unmanaged tool access, persistent memory, or autonomy without an external policy gate [S10][S43][S44].

Gravitee's 2026 survey of more than 900 executives and practitioners found that 80.9% of technical teams have moved beyond planning into active testing or production, yet only 14.4% report full security/IT approval for their entire agent fleet [S41]. It also found that 88% of organizations reported confirmed or suspected AI agent security incidents in the previous year, with healthcare at 92.7% [S41]. Only 21.9% treat AI agents as independent identity-bearing entities, while 45.6% still rely on shared API keys for agent-to-agent authentication [S41].

MIT's transparency findings make the governance gap visible from the outside: only 4 of 13 frontier-autonomy agents disclosed any agentic safety evaluations, 25 of 30 disclosed no internal safety results, and 23 of 30 had no third-party testing information [S09].

## Threat model

| Threat | Typical trigger | Failure mode | Controls |
| --- | --- | --- | --- |
| Direct prompt injection | User prompt contains malicious instruction. | Agent ignores role, exfiltrates data, invokes unsafe tool. | Instruction hierarchy, content isolation, action policy gate, audit [S43][S46]. |
| Indirect prompt injection | Web page, email, repo, PDF, or RAG chunk contains hidden instruction. | Agent treats untrusted content as instructions. | Provenance, retrieval source policy, memory gating, sandboxing [S43][S44][S46]. |
| Excessive permissions | Broad API keys, admin OAuth scopes, unrestricted MCP server. | Compromised or hallucinating agent performs high-impact actions. | Least privilege, scoped short-lived credentials, default deny [S42][S43][S46]. |
| Hallucinated actions | LLM invents API calls, parameters, or facts. | Invalid or unsafe operation is executed. | Typed tools, schema validation, capability manifests, output validators [S43][S45]. |
| Tool misuse | Legitimate tools used for destructive or exfiltration goals. | Authorized but unintended action. | Per-action verification, approvals, policy checks on resource/action/parameters [S44][S46]. |
| Identity abuse | Shared keys or generic service accounts. | No accountability, revocation, or chain-of-command audit. | Per-agent identities, DIDs/GAIDs, OAuth/OIDC/SPIFFE, audit logs [S02][S11][S42]. |
| Memory poisoning | Malicious content persists across sessions. | Future behavior shifts long after attack. | Memory provenance, trust labels, review before promotion to long-term memory [S16][S44]. |
| Insecure inter-agent communication | Peer agent spoofing or compromised agent messages. | Multi-agent cascade or misdelegation. | Mutual auth, signed messages/cards, zero-trust inter-agent auth [S15][S18][S42]. |
| Supply-chain compromise | Malicious MCP server, plugin, skill, package, or registry entry. | Agent installs or calls attacker-controlled components. | Signed manifests, SBOMs, registry trust tiers, attestation, revocation [S01][S02][S44]. |

## NIST/NCCoE identity and authorization concept paper

On Feb 5, 2026, NIST/NCCoE published a concept paper on applying identity standards and best practices to software and AI agents [S42]. It asks for input on use cases, agent-specific challenges, identity/access standards, technologies, identification, authorization, auditing, non-repudiation, and prompt-injection controls [S42]. This validates per-agent identifiers, signed manifests, discovery trust tiers, policy-aware routing, and revocation as core security infrastructure [S01][S02][S42].

## Gravitee State of AI Agent Security 2026

| Metric | Value | Meaning |
| --- | ---:| --- |
| Technical teams beyond planning | 80.9% | Agents are active or in testing [S41]. |
| Full security/IT approval for all agents | 14.4% | Most fleets have shadow or partially approved agents [S41]. |
| Average agents actively monitored/secured | 47.1% | More than half may lack oversight/logging [S41]. |
| Confirmed or suspected incidents | 88% | Security failures are common [S41]. |
| Healthcare incidents | 92.7% | Sensitive sectors face amplified exposure [S41]. |
| Treat agents as independent identities | 21.9% | Identity model is immature [S41]. |
| Shared API keys for agent-to-agent auth | 45.6% | Accountability and revocation are weak [S41]. |
| Custom hardcoded authorization | 27.2% | Teams are inventing bespoke policy logic [S41]. |

The practical recommendation is continuous identity-aware enforcement. Periodic audits cannot protect systems where agents interact with production data before security teams know they exist [S41].

## OWASP LLM06 and Agentic Application Top 10

OWASP's LLM06:2025 Excessive Agency describes damaging actions performed in response to unexpected, ambiguous, or manipulated LLM outputs [S43]. Common triggers include hallucination/confabulation, direct or indirect prompt injection, malicious or compromised extensions, and malicious or compromised peer agents [S43]. Mitigations include minimizing available tools, narrowing tool functionality, avoiding open-ended tools, minimizing permissions, requiring user approval, and mediating downstream requests outside the LLM [S43]. The Agentic Applications Top 10 adds goal hijack, tool misuse, identity abuse, supply chain, unexpected code execution, memory poisoning, insecure inter-agent communication, cascading failures, and trust exploitation [S44].

## Governance architectures from research

The Layered Governance Architecture proposes execution sandboxing, intent verification before tool calls, zero-trust inter-agent authorization, and immutable audit logging [S15]. Its reported results show intent verification can help, but only as one layer among several [S15]. The Layered Attack Surface Model argues that agentic security is a distributed-systems problem because agents have memory, tools, peer coordination, ecosystem dependencies, and governance surfaces [S16].

## Security controls checklist

| Control | Minimum implementation |
| --- | --- |
| Inventory | Maintain a registry of agents, tools, MCP servers, skills, models, owners, and environments [S41][S42]. |
| Identity | Assign each agent a unique identity and lifecycle; avoid shared API keys [S41][S42]. |
| Tool minimization | Expose only necessary tools and split read/write/delete/export/send actions [S43][S46]. |
| Runtime authorization | Evaluate every sensitive tool call outside the LLM before execution [S43][S46]. |
| Short-lived credentials | Broker scoped credentials after policy approval, not before [S46]. |
| HITL | Require approval for destructive, financial, external communication, privilege, or data-export actions [S10][S43]. |
| Sandboxing | Run code, tools, and untrusted plugins in restricted environments [S15][S26]. |
| Output validation | Validate schemas, behavioral bounds, and semantic completeness before chaining results [S39][S45]. |
| Memory controls | Tag source trust, block long-term memory writes from untrusted context, review promotion [S16][S44]. |
| Observability | Trace tool calls, handoffs, decisions, errors, approvals, and policy results [S27][S39]. |
| Incident response | Support revocation, kill switches, rollback, and tamper-evident logs [S02][S15][S42]. |

## Governance recommendations

1. Treat agents as first-class security principals [S41][S42].
2. Keep prompts out of the trust boundary; enforce policy at the tool/data/API boundary [S43][S46].
3. Define autonomy levels per use case and increase autonomy only when risk is understood and measured [S10][S12].
4. Use signed, schema-validated manifests for provenance and least-privilege pre-authorization [S01][S03].
5. Use federated discovery only when identity, trust tier, revocation, and audit data are available [S02][S04].
6. Threat-model protocol bridges as a separate asset class [S14][S16].
