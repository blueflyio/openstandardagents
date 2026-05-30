# Security and Governance Research

Prepared as of May 30, 2026.

## Security baseline

Agent security is different from chatbot security because agents can take actions. A chatbot manipulated by prompt injection may produce unsafe text. An agent manipulated by prompt injection may read private data, invoke APIs, write files, modify tickets, approve payments, or delegate work to other agents [S09][S26][S29]. The main security boundary must therefore move outside the prompt and into identity, authorization, sandboxing, runtime policy enforcement, and audit logs [S27][S28][S29].

## Empirical risk signals

| Source | Finding | Why it matters |
|---|---:|---|
| MIT AI Agent Index | 4/13 high-autonomy agents disclose safety evals | Safety transparency is low [S07]. |
| MIT AI Agent Index | 25/30 disclose no internal safety results | Assurance is immature [S08]. |
| Gravitee | 80.9% of technical teams beyond planning | Agents are production infrastructure [S26]. |
| Gravitee | 14.4% have full security approval | Governance lags adoption [S26]. |
| Gravitee | 88% report confirmed or suspected incidents | Incidents are normal, not edge cases [S26]. |
| Gravitee | 21.9% treat agents as identities | Most agents lack first-class identity [S26]. |
| Gravitee | 45.6% use shared API keys | Accountability and revocation break down [S26]. |
| Imperva | 53% of 2025 web traffic automated | The web is already machine-majority [S30]. |
| Imperva | 27% of bot attacks target APIs | Agent traffic hits core systems [S30]. |

## Threat model

The highest-risk pattern is the convergence of sensitive data access, untrusted content ingestion, and external action capability. Security writers often call this the lethal trifecta: an agent can access private data, process untrusted content, and communicate or act externally [S29][S30]. If all three exist in one workflow, indirect prompt injection can become data exfiltration or unauthorized action.

Major risks include:

- Prompt injection and indirect prompt injection: malicious instructions embedded in prompts, pages, documents, tool outputs, or tool descriptions [S09][S29].
- Tool poisoning: MCP tool metadata can contain hidden instructions that the model sees but the user does not [S29].
- Excessive permissions: broad filesystem, API, repository, database, or payment access turns small model errors into large incidents [S26][S29].
- Hallucinated actions: agents may invent tool names, call wrong endpoints, repeat calls, or act on false premises [S09][S24].
- Context bleeding: sensitive data passed between agents or sessions can leak to the wrong model or tool [S24][S29].
- Cross-agent propagation: agents that create or task other agents can spread compromised instructions or permissions [S26][S33].
- Cost/resource abuse: malicious inputs can trigger expensive loops, repeated tool calls, or compute exhaustion [S24][S29].
- Web conduct ambiguity: browser agents can mimic humans, ignore robots directives, or bypass anti-bot controls, leaving sites unable to verify agent intent [S07][S08][S30].

## Identity and authorization

NIST/NCCoE's concept paper is the clearest federal signal: AI agents need identification, authentication, authorization, auditing, non-repudiation, and prompt-injection mitigation using existing and emerging standards [S27]. The paper does not prescribe a final standard; it scopes a demonstration project and asks stakeholders how identity and authorization best practices should apply to agents [S27]. NIST's broader AI Agent Standards Initiative aims to foster industry-led agent standards, open protocol maintenance, research into agent security and identity, and trusted interoperability [S32].

The key design shift is to treat agents as security principals rather than extensions of humans or service accounts. Each agent should have a distinct identity, scoped credentials, task-specific permissions, revocation, attestation where appropriate, and auditable delegation chains [S26][S27][S28]. Harvard JOLT's Know Your Agent framing adds principal-agent linkage and delegation parameters: who authorized the agent, for what purpose, under which limits, and how authority can be revoked [S28].

OSSA and DUADP map directly to this identity need. OSSA can declare agent identity, signatures, SBOM/provenance, Cedar policies, compliance metadata, observability, and trust fields in a manifest [S02][S03]. DUADP can discover agents through GAID/WebFinger/DID resolution and apply trust-tier gating before routing or publishing [S01][S04].

## Runtime control patterns

Recommended controls:

1. Policy gateway before tool execution. Route MCP, API, and code-execution calls through a gateway that validates identity, scope, intent, rate, and risk before execution [S29].
2. Least privilege by default. Scope tools and credentials to the current task; use allowlists for high-impact operations [S26][S27][S29].
3. Human-in-the-loop for consequential actions. Require approval for writes, external posts, destructive operations, payments, credential changes, and sensitive data movement [S09][S24][S29].
4. Sandboxing. Execute code, MCP servers, plugins, and local filesystem access in hardened isolation with network and filesystem restrictions [S29][S33].
5. Credential isolation. Never place API keys or OAuth tokens in prompt-visible context; use resource indicators and scoped token flows [S29].
6. Immutable audit logs. Log tool calls, inputs, policy decisions, outputs, actor identity, delegated authority, and approvals [S26][S27][S28][S33].
7. Budget and iteration caps. Stop repeated tool calls, context explosion, and runaway loops with per-task cost limits and kill policies [S24][S29].
8. Provenance and signing. Verify manifests, tool definitions, Agent Cards, and package sources; alert on mutation of approved tool descriptions [S02][S12][S29].
9. Progressive rollout. Start with internal pilots and shadow mode, then narrow beta, then broader release after reliability and incident data justify it [S24].

## Governance recommendations

- Require a manifest or agent card for every production agent. It should list identity, owner, purpose, tools, data classes, trust tier, autonomy level, approval gates, budget limits, and audit endpoints [S02][S11][S28].
- Build a registry. A local OSSA/DUADP-style registry lets teams discover approved agents and block shadow agents [S01][S04][S26].
- Separate observation from enforcement. Monitoring is necessary but insufficient; high-risk actions must be intercepted before execution [S29][S33].
- Evaluate trajectories, not just final answers. Multi-step agents can reach a correct answer through unsafe behavior, so logs must capture reasoning-independent action traces and policy decisions [S24][S33].
- Treat agent web access as API risk. Imperva's bot data shows automated traffic already exceeds human traffic; APIs and identity systems must govern legitimate and malicious automation by intent and authority, not only by user-agent fingerprint [S30].
