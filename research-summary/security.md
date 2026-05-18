# Security and Governance

Research snapshot compiled on May 18, 2026.

## Current risk picture

Agent adoption is moving faster than security approval. Gravitee's 2026 report surveyed more than 900 executives and technical practitioners and found that 80.9 percent of technical teams had moved past planning into active testing or production, while only 14.4 percent reported full security/IT approval for all agents going live [R39].

The incident baseline is already high. Gravitee reports that 88 percent of organizations confirmed or suspected AI agent security incidents in the last year, rising to 92.7 percent in healthcare [R39]. On average, only 47.1 percent of an organization's agents are actively monitored or secured, leaving more than half without security oversight or logging [R39].

Identity is the weakest control. Gravitee found that only 21.9 percent of teams treat AI agents as independent identity-bearing entities; 45.6 percent still rely on shared API keys for agent-to-agent authentication, and 27.2 percent use custom hardcoded authorization logic [R39].

MIT's AI Agent Index shows a parallel transparency problem. Of 13 agents with frontier autonomy, only 4 disclose any agentic safety evaluations; 25 of 30 indexed agents disclose no internal safety results, and 23 of 30 disclose no third-party testing information [R23].

## Major threat classes

### Prompt injection and indirect prompt injection

Indirect prompt injection occurs when malicious instructions are hidden in content that the agent reads, such as emails, documents, web pages, RAG records, or API responses. The agent may treat the hidden instruction as part of the legitimate task and then execute tools on the attacker's behalf [R40].

Ferrag et al. classify prompt injection under a broader input-manipulation domain that includes direct prompt injection, compositional prompt injection, adaptive hijacks, long-context jailbreaks, and multimodal adversarial perturbations [R31].

### Tool misuse and excessive permission

Agents turn language-model compromise into real-world action because they can invoke tools. The DEV security guide highlights tool inversion, privilege escalation, and data exfiltration through legitimate tools used in unintended ways [R40].

Excessive permissions convert model uncertainty into operational damage. Generic tools such as `execute_sql(query)` are dangerous because an agent can generate arbitrary actions. Safer patterns use narrow wrappers such as `get_customer_record(id)` or `update_order_status(id, status)`, with strict argument validation before execution [R40].

### Hallucinated actions

MIT Sloan identifies hallucinations and mistakes as a reason agentic AI is not yet ready for prime time [R24]. In agents, hallucination is not only an incorrect answer; it can become an invented tool call, an unauthorized workflow, a mistaken deletion, an invalid financial action, or an incorrect delegation.

### Protocol exploits

Ferrag et al. argue that plugins, connectors, and inter-agent protocols have outpaced security practices. Their taxonomy includes protocol vulnerabilities in MCP, ACP, ANP, and A2A interactions, alongside attacks such as Prompt-to-SQL injection and Toxic Agent Flow in a GitHub MCP server [R31].

The practical implication is that protocol adoption alone does not guarantee security. Protocols make integration standard; implementers still need authentication, authorization, schema validation, provenance, sandboxing, and revocation [R31].

### Multi-agent emergent threats

Schroeder de Witt et al. introduce multi-agent security because multi-agent systems are non-compositional: individually safe agents can interact into unsafe systems. Threats include secret collusion, coordinated swarm attacks, cascading failures, privacy breach propagation, jailbreak propagation, data poisoning, stealth optimization, and adversarial manipulation of shared environments [R30].

## Identity and authorization frameworks

NIST/NCCoE's February 5, 2026 concept paper proposes a project on applying identity standards and best practices to software and AI agents. It asks for feedback on use cases, challenges, standards, technologies, identification, authorization, auditing, non-repudiation, and controls to prevent or mitigate prompt injection [R28].

The NIST framing matches the direction of DUADP and OSSA. DUADP uses DID-based node identity, GAID-style handles, DNS/WebFinger resolution, signature verification, federation witnesses, revocation, trust tiers, and governance evaluation endpoints [R01] [R02]. OSSA defines agent identity, signed manifests, Cedar policies, compliance metadata, human oversight points, and provenance/SBOM pointers inside a portable manifest [R05] [R06] [R08].

Harvard JOLT's "Know Your Agent" framing points to the same minimum identity fields: agent identity, principal-agent linkage, delegation parameters, revocability, auditability, and behavioral record keeping [R27].

## Governance controls

### Least privilege by design

Agents should get scoped credentials per role and task, not shared user tokens or broad service accounts. Each tool should be allowlisted, typed, validated, and policy-checked before execution [R40].

### Runtime policy enforcement

Guardrails must sit between the model's planned action and execution. Tool-use validators check authorization; semantic checkers compare planned action to high-level goal; human-in-the-loop gates interrupt high-risk operations; runtime protection logs and blocks violations before irreversible side effects [R40].

### Human-in-the-loop boundaries

Cornell, MIT Sloan, 47Billion, and DEV sources all treat human oversight as a production requirement for high-risk operations [R20] [R24] [R37] [R40]. HITL should be used for financial transactions, security changes, data deletion, external messaging, compliance-sensitive outputs, and low-confidence or high-novelty actions.

### Observability and audit

Production agents need logs for prompts, tool calls, inputs, outputs, policy decisions, user approvals, model versions, memory changes, and costs. GitLab Duo's platform message emphasizes usage/activity visibility and governance over agents acting across the software lifecycle [R36]. Agent Protocol's runs, threads, history, store, and streaming primitives also show how auditability becomes an API concern [R15].

### Provenance and supply chain

OSSA and DUADP include signatures, SBOM/provenance pointers, DID identities, and trust tiers [R01] [R05] [R08]. ATP goes further inside tool execution with provenance tracking and policies to prevent data exfiltration [R19]. Ferrag et al. identify cryptographic provenance tracking as a core mitigation direction for protocol-level agent threats [R31].

## Recommended baseline for secure agents

1. Unique agent identity: every agent has its own identity, not a shared key [R28] [R39].
2. Principal-agent delegation: record who or what authorized the agent, for what scope, and with what revocation path [R27].
3. Least-privilege credentials: scoped per agent, per task, and per environment [R40].
4. Narrow tool wrappers: avoid generic shell, SQL, HTTP, or code execution tools unless sandboxed and policy-gated [R19] [R40].
5. Default-deny authorization: policy check every tool call and external action before execution [R40].
6. Runtime guardrails: validate planned action, arguments, data origin, and goal alignment [R19] [R40].
7. Human approval: require explicit approval for irreversible, regulated, external, costly, or ambiguous actions [R24] [R37].
8. Audit and replay: log tool calls, policy decisions, approvals, outputs, and costs; retain enough context for incident response [R15] [R36].
9. Red-team continuously: test goal hijacking, tool inversion, data exfiltration, multi-step prompt injection, and protocol abuse [R31] [R40].
10. Monitor the agent fleet: inventory all agents, credentials, tools, scopes, owners, and runtime status [R39].

## Governance open questions

- How should web services distinguish user-authorized agents from bots, crawlers, scrapers, and impersonators [R23] [R27]?
- Which agent identity standards should converge around OAuth/OIDC, SPIFFE, DIDs, SCIM, NGAC, or new agent-specific profiles [R28]?
- How should liability be assigned when an agent delegates to another agent, uses a third-party tool, or acts through a platform wrapper [R27] [R30]?
- What safety disclosures should be mandatory for high-autonomy public agents [R23]?
- How can protocols support privacy-preserving auditability, where agents are accountable without leaking proprietary memory or reasoning [R12] [R27]?
