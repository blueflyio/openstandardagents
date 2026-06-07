# Security and governance research

## Executive security thesis

Agentic AI changes the security model because agents can choose tools, call APIs, write files, browse, delegate, remember, and act across systems. The main risk is not only bad text. It is unauthorized action at machine speed. The security model therefore has to move from chatbot content filtering to workload identity, authorization, tool governance, sandboxing, observability, and incident response [S48][S49][S50].

## Adoption versus control

Gravitee's State of AI Agent Security 2026 report surveyed more than 900 executives and technical practitioners and found a gap between deployment and governance [S48]:

| Metric | Finding |
| --- | --- |
| Teams beyond planning | 80.9% of technical teams moved into active testing or production |
| Full security approval | Only 14.4% report all AI agents go live with full security/IT approval |
| Incidents | 88% reported confirmed or suspected AI agent security incidents in the survey period reported on February 4, 2026 |
| Healthcare incidents | 92.7% reported confirmed or suspected incidents |
| Monitored/secured coverage | Average organization actively monitors/secures only 47.1% of AI agents |
| Independent agent identities | Only 21.9% treat agents as independent identity-bearing entities |
| Shared API keys | 45.6% still rely on shared API keys for agent-to-agent authentication |
| Custom hardcoded auth logic | 27.2% of technical teams reverted to custom/hardcoded authorization logic |

The main governance conclusion is that many organizations cannot answer "which agent did what, under whose authority, and with what approval?" Shared API keys and generic service accounts break auditability [S48].

## NIST/NCCoE concept paper

NIST/NCCoE published an initial public draft on February 5, 2026 for "Accelerating the Adoption of Software and Artificial Intelligence Agent Identity and Authorization" [S49]. It focuses on applying identity standards and best practices to software agents and AI agents.

The concept paper asks for feedback on:

- AI agent use cases.
- New and unique AI agent security challenges.
- Current and emerging identity/access standards for agents.
- Technologies for supporting agents.
- Identification, authorization, auditing, non-repudiation, and prompt-injection controls [S49].

The important shift is treating agents as identifiable security principals. If an agent can access diverse data sets, tools, and applications, then its identity, authorization context, delegation chain, and audit evidence must be first-class architecture components [S49].

## Core threat model

### 1. Prompt injection and context poisoning

Prompt injection is broader in agents than in chatbots because untrusted content can affect tool use. The DEV security model describes malicious pull requests, poisoned `.cursorrules` files, backdoored MCP server responses, and external RAG/web content as ways to turn an agent into an attacker proxy [S50].

Mitigations:

- Treat all user input, web pages, RAG results, tool responses, and MCP descriptions as untrusted.
- Wrap external data with explicit delimiters and instructions that it is data, not instructions.
- Use policy checks outside the LLM, not only system prompts.
- Reject or route suspicious instructions for review.
- Use allowlisted tools and constrained arguments [S26][S50].

### 2. Excessive permissions

Agents often receive broad API tokens, filesystem access, or database credentials because it is easier during prototyping. This becomes a production vulnerability when the agent can autonomously choose calls or loop [S48][S50].

Mitigations:

- Give each agent a unique workload identity.
- Use least-privilege OAuth/OBO or capability tokens.
- Never pass raw secrets directly into prompts or tool outputs.
- Scope tools by task and resource.
- Require approval for production, money movement, PII, destructive operations, broad writes, deploys, and external messaging [S48][S49][S50].

### 3. Tool poisoning and MCP-specific attacks

MCP's specification warns that tool behavior descriptions and annotations should be considered untrusted unless obtained from a trusted server [S26]. MCPShield expands this into a formal taxonomy of 7 threat categories and 23 attack vectors [S18].

MCPShield threat categories:

| Category | Example attack vectors |
| --- | --- |
| Tool poisoning | Description injection, schema manipulation, return value poisoning, tool shadowing |
| Rug pull and mutation | Post-approval mutation, version rollback, capability escalation |
| Cross-server leakage | Exfiltration via logging, context bleed, channel coercion, sampling abuse |
| Privilege escalation | Capability chaining, consent bypass, role confusion |
| Server trust violations | Impersonation, supply chain compromise, dependency hijacking |
| Context manipulation | Prompt injection via tool, memory poisoning, resource injection |
| Protocol-level vulnerabilities | Session hijacking, replay attacks, cross-protocol confusion |

MCPShield reports that no single defense covers more than 34% of the identified threat landscape, while an integrated defense architecture could theoretically cover 91% [S18]. The security implication is direct: do not rely on one guardrail.

### 4. Cross-agent and cross-organization trust

Agent-to-agent protocols enable delegation across organizations and runtimes. The arXiv communication survey identifies risks such as privacy leakage, agent spoofing, bullying/coercion, denial of service, and malicious interaction across user-agent, agent-agent, and agent-environment communication [S17].

Mitigations:

- Verify agent identity and publisher provenance.
- Sign messages or artifacts where possible.
- Use explicit delegation scopes.
- Preserve principal-agent chains.
- Apply rate limits and circuit breakers.
- Record task state, artifacts, and approvals [S17][S27][S49].

### 5. Web conduct and bot identity

MIT's AI Agent Index found no established standards for how agents should behave on the web, and noted that some agents are explicitly designed to bypass anti-bot protections and mimic human browsing [S12]. This creates policy risks around consent, robots policies, fraud, impersonation, and website load.

Mitigations:

- Require clear agent identification where appropriate.
- Respect robots/agent policy mechanisms as they emerge.
- Bind agent actions to principals and delegation limits.
- Audit web actions separately from text outputs [S12][S20].

## Five-layer production security model

The DEV production security guide proposes a practical five-layer defense model [S50]:

1. Network egress controls. Default-deny outbound connections; allowlist required domains; block exfiltration destinations.
2. Workspace filesystem isolation. Block reads/writes outside the workspace and protect dotfiles, credentials, IDE/agent rules, package manifests, and shell configuration.
3. Input sanitization and prompt-injection defense. Detect common injection patterns and clearly wrap external data.
4. Tool execution guardrails. Register tools, enforce schemas, cap calls, require approval for dangerous categories, and validate arguments.
5. Audit logging and tamper-evident trails. Log structured events with trace IDs, tool names, inputs, outputs, reasoning depth, token/cost metadata, and hashes [S50].

This model maps well to NIST/Gravitee concerns. Layers 1-2 reduce blast radius; layers 3-4 prevent unsafe action; layer 5 supports accountability, incident response, and non-repudiation [S48][S49][S50].

## Identity and authorization architecture

Recommended identity model:

| Entity | Identity needed | Notes |
| --- | --- | --- |
| Human principal | User/org identity | The person or organization delegating authority |
| Agent definition | Manifest/publisher identity | OSSA-style manifest ID, version, signature, policy metadata [S03] |
| Runtime workload | Workload/service identity | The running process/container/agent instance |
| Tool/server | Tool publisher/server identity | MCP server or API identity; verify provenance and version [S18] |
| Delegation | Capability or OBO token | Scoped authority, expiry, audience, and approvals [S49] |

Key rule: a prompt should not be the authority boundary. Authorization decisions should happen outside the model in policy code, API gateways, identity providers, or policy engines such as Cedar/OPA-style systems [S48][S49].

## OSSA/DUADP governance implications

OSSA is relevant because it gives agents a structured contract: identity, role, tools, capabilities, governance metadata, policy bindings, discovery metadata, and schema validation [S03]. That does not enforce safety by itself, but it creates a stable document that policy engines and registries can inspect.

DUADP is relevant because discovery needs trust. Its homepage describes GAID handles, WebFinger resolution, DID documents, signature verification, provenance, federation witnesses, revocation state, and trust-tier policy decisions [S01]. Those features align with the identity and authorization problems raised by Gravitee and NIST [S48][S49].

Recommended use:

- Require signed OSSA manifests for published agents.
- Version-pin tool and policy declarations.
- Publish agent metadata through DUADP or a similar registry only after validation.
- Include revocation and incident endpoints in registry design.
- Treat trust tier as one policy input, not as a complete authorization decision [S01][S03].

## Governance operating model

Minimum governance checklist:

- Inventory all agents, tools, registries, and MCP/A2A/AG-UI endpoints.
- Assign owners for each agent definition, runtime instance, and tool server.
- Require security review before production access to sensitive data or writes.
- Define action categories: read-only, write, destructive, external communication, financial, PII, production deploy, security remediation.
- Require approvals for high-risk action categories.
- Use per-agent identities and scoped credentials.
- Log every attempted and executed tool call.
- Monitor reasoning loops, tool-call counts, token/cost budgets, and abnormal egress.
- Test prompt injection, malicious tool descriptions, tool mutation, credential leakage, and cross-server exfiltration.
- Keep a revocation process for compromised agents, tools, and manifests.

## Open security gaps

- Standardized agent identity is still unsettled: DIDs, workload identity, OAuth/OBO, certificates, signed manifests, and registries are all active patterns.
- Web conduct standards are immature.
- Safety evaluation disclosure is sparse, especially for deployed products [S12][S13].
- Cross-protocol trust semantics are weak: MCP, A2A, AG-UI, OSSA, and DUADP each carry different assumptions.
- Tool ecosystems are growing faster than security review capacity [S18].

## Bottom line

Production agents should be secured like autonomous workload fleets, not like chat widgets. The minimum production bar is unique identity, scoped authorization, tool gating, network and filesystem isolation, human approval for risky actions, full audit logs, and continuous monitoring [S48][S49][S50].
