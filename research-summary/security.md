# Security and governance research

Prepared on 2026-06-05. Citation keys resolve in [reading-list.md](./reading-list.md).

## Executive security findings

Agent security in 2026 is an identity, authorization, and runtime-governance problem, not just a prompt-safety problem. Agents can read, write, transact, browse, invoke tools, spawn other agents, and persist state. That makes the blast radius of a prompt injection or hallucination much larger than in a chatbot [S24], [S25], [S43].

The best available survey data shows a governance gap. Gravitee's State of AI Agent Security 2026 reports that 81% of teams are beyond planning, but only 14.4% have full security approval for their agent fleets. 88% of organizations reported confirmed or suspected AI agent security or privacy incidents in the prior year. Only 21.9% treat agents as independent identity-bearing entities, while 45.6% still use shared API keys for agent-to-agent authentication [S38], [S39].

MIT's 2025 AI Agent Index independently shows a transparency gap: 25 of 30 agents disclosed no internal safety results and 23 of 30 disclosed no third-party testing information [S22], [S23]. NIST/NCCoE is responding at the standards level with a concept paper focused on software and AI agent identity and authorization, including identification, authentication, authorization, auditing, non-repudiation, and prompt-injection controls [S25].

Academic and standards-adjacent security work points in the same direction. ACM Computing Surveys identifies four underlying knowledge gaps in agent security: unpredictable multi-step user inputs, complex internal execution, variable operating environments, and untrusted external interactions [S49]. Cloud Security Alliance's MAESTRO framework and Five Eyes implementation notes recommend agent-specific threat modeling across privilege, design/configuration, behavioral, structural, and accountability risks [S50], [S51].

## Main risk categories

| Risk | Description | Evidence |
| --- | --- | --- |
| Prompt injection / goal hijack | Malicious instructions in user input, documents, websites, RAG content, or tool output redirect agent behavior. | MIT Sloan, Dev.to, OWASP Agentic Top 10 [S24], [S40], [S43] |
| Excessive permissions | Agents inherit broad human/service-account permissions or long-lived API keys. | Gravitee identity stats, NIST identity project [S25], [S38] |
| Hallucinated actions | Model fabricates tools, parameters, or unsafe steps that are executed by permissive runtime code. | Dev.to guide, MIT Sloan [S24], [S40] |
| Tool poisoning | MCP or tool metadata/responses include malicious instructions treated as trusted model context. | Hou et al., OWASP MCP Tool Poisoning [S41], [S42] |
| Agentic supply chain | Malicious tools, MCP servers, plugins, manifests, dependencies, or agent cards enter runtime. | OWASP Agentic Top 10, MCP research [S41], [S43] |
| Identity and privilege abuse | Agent credentials, delegated tokens, cached sessions, or inter-agent trust are abused. | OWASP, NIST, Gravitee [S25], [S38], [S43] |
| Insecure inter-agent communication | Spoofed or tampered messages redirect multi-agent systems. | OWASP Agentic Top 10, A2A security motivation [S08], [S43] |
| Memory and context poisoning | Long-term memory, RAG indexes, or state are poisoned to alter future behavior. | OWASP Agentic Top 10 [S43] |
| Cascading failures | One agent's bad action propagates across workflows, tools, or downstream agents. | OWASP Agentic Top 10 [S43] |
| Web conduct and bot ambiguity | Agents browse or transact without clear standards for identification, robots.txt, CAPTCHAs, and consent. | MIT Agent Index, HTTP Agent Profile [S22], [S45] |

## Prompt injection and hallucinated actions

Prompt injection is more dangerous in agents than in chatbots because the model can take external actions. MIT Sloan says ongoing hallucinations and prompt-injection hijacking have slowed adoption and forced companies to keep human guardrails in the loop [S24]. The Dev.to security guide lists prompt injection, excessive permissions, and hallucinated actions as core production risks [S40].

The core defensive pattern is deterministic enforcement outside the model. Prompts can express policy, but prompts cannot enforce policy. Tool calls should pass through a verification layer that checks declared capabilities, schemas, risk classification, authorization, nonces, timestamps, signatures, revocation status, and human approval requirements before execution [S40].

For irreversible actions - payments, deletes, permission changes, external communications, production deploys, data exports - use action gating. The agent can propose the action, but a separate policy engine or human approval gate should authorize it. This aligns with Cornell's enterprise workshop emphasis on approval gates and monitoring, OWASP's agentic risks, and NIST's identity/authorization direction [S19], [S25], [S43].

## MCP tool poisoning

MCP is powerful because it lets agents discover and call tools through a standard interface. The same feature creates a security boundary problem: tool descriptions and tool outputs are often injected directly into model context [S41], [S42]. OWASP describes MCP Tool Poisoning as an indirect prompt-injection attack in which a malicious MCP server exposes tools that look normal but return hidden instructions. If the agent also has privileged tools, the injected instructions may cause data exfiltration or unauthorized actions [S42].

Hou et al. identify 16 representative MCP threat scenarios across four attacker types, including malicious developers, external attackers, malicious users, and security flaws [S41]. The paper highlights tool poisoning, installer spoofing, unauthorized access, naming attacks, and description manipulation as areas requiring automated scanning, runtime safeguards, and future research [S41].

Recommended controls:

- Require allowlisted MCP servers for production agents.
- Verify server identity and provenance before tool registration.
- Statically scan tool names, descriptions, schemas, and examples for hidden instructions.
- Separate internal privileged tools from untrusted external tools.
- Never rely on the LLM's system prompt as the only boundary for file, database, network, or payment tools.
- Treat tool responses as untrusted external content.
- Log the model decision path, selected tools, parameters, results, and policy decisions for replay [S41], [S42].

## Agent identity and authorization

NIST/NCCoE's concept paper is the clearest government signal that agents need first-class identity and authorization [S25]. It asks how organizations should identify agents, authenticate claims, manage authorization rights, audit actions, support non-repudiation, and mitigate prompt injection [S25]. This maps directly to Gravitee's finding that less than 22% of teams treat agents as independent identities and many still use shared API keys [S38].

In practice, agent identity should include:

- A stable agent identifier distinct from the human user.
- Issuer/publisher identity.
- Version and manifest hash.
- Runtime environment and deployment identifier.
- Declared capabilities and tools.
- Trust tier or assurance level.
- Current credential material and expiration.
- Delegation chain: user -> agent -> sub-agent -> tool.
- Revocation status and incident flags.
- Audit trace IDs for every action.

OSSA and DUADP map naturally to this identity model. OSSA can declare the agent, capabilities, governance, and policy bindings. DUADP can resolve GAIDs, DIDs, signatures, trust tiers, revocation state, and provenance evidence [S01], [S03], [S05].

## OWASP Agentic Top 10

OWASP's Top 10 for Agentic Applications expands beyond the LLM Top 10 to capture autonomy-specific risks [S43]. The listed categories are:

1. Agent Goal Hijack.
2. Tool Misuse and Exploitation.
3. Identity and Privilege Abuse.
4. Agentic Supply Chain Vulnerabilities.
5. Unexpected Code Execution.
6. Memory and Context Poisoning.
7. Insecure Inter-Agent Communication.
8. Cascading Failures.
9. Human-Agent Trust Exploitation.
10. Rogue Agents [S43].

This taxonomy is useful because it treats agents as systems, not prompts. For example, "Tool Misuse" can happen even with valid credentials if the agent chains legitimate tools in an unsafe order. "Human-Agent Trust Exploitation" recognizes that polished explanations can manipulate human approvers. "Cascading Failures" recognizes that multi-agent systems amplify errors through dependencies [S43].

## Web governance and traffic identity

MIT's Index says web conduct standards for agents remain unsettled. Many agents lack clear statements about robots.txt, CAPTCHA handling, or web access methods, and browser agents may be designed to bypass anti-bot systems [S22], [S23]. At the same time, bot-traffic reporting suggests automated traffic now exceeds human traffic: Malwarebytes' summary of Imperva's 2025 Bad Bot Report cites 37% bad bots and 14% good bots, while HUMAN Security reports that automated traffic grew 23.51% year over year in 2025 and AI-driven traffic grew 187% from January to December 2025 [S44], [S46].

The HTTP Agent Profile draft proposes a protocol-level response: authenticate agent traffic with HTTP Message Signatures, keep a privacy-preserving human lane, and enable protocol-level payments for agent access through HTTP 402 [S45]. This is not yet an established standard, but it shows the direction: agent web governance may require signed traffic, attestations, and explicit access policies rather than User-Agent strings, IP blocks, or CAPTCHAs alone [S45].

## Recommended control architecture

1. **Manifest-first registration.** Every agent must have a signed manifest with identity, issuer, version, capabilities, tools, policies, cost limits, HITL requirements, and observability requirements [S01], [S02].
2. **Independent agent identity.** Do not run production agents only as human users or shared service accounts. Use per-agent identities with lifecycle management, credential rotation, scoped tokens, and revocation [S25], [S38].
3. **Policy enforcement before tools.** All tool calls pass through a deterministic policy decision point before execution. Reject unknown tools, malformed parameters, undeclared actions, expired credentials, excessive spend, and high-risk actions without approval [S25], [S40], [S43].
4. **Least privilege by task.** Use short-lived, task-scoped credentials. Avoid broad persistent API keys. Restrict write, delete, payment, email, deployment, and permission-changing tools [S38], [S40].
5. **Trust-aware discovery.** Use DUADP/ANP-like discovery only with identity verification, signed manifests, trust tiers, revocation, and provenance evidence [S03], [S12].
6. **MCP hygiene.** Allowlist production MCP servers, scan metadata, isolate privileged tools, and sanitize external tool responses before they enter the model context [S41], [S42].
7. **Human approval where it matters.** Use HITL gates for high-impact or irreversible operations rather than every step. Approval prompts should show plain-language action summaries, exact parameters, policy result, diff/impact, and rollback plan [S19], [S43].
8. **Audit and replay.** Record trace IDs, prompts, retrieval results, tool calls, policy decisions, model outputs, user approvals, and final side effects so incidents can be reconstructed [S25], [S27].
9. **Runtime containment.** Sandbox code execution, isolate networks, enforce egress controls, set budgets, detect loops, and provide kill switches [S17], [S40], [S43].
10. **Continuous evaluation.** Run adversarial tests for prompt injection, tool poisoning, role confusion, memory poisoning, excessive agency, and inter-agent spoofing before and after deployment [S41], [S42], [S43].
11. **Agent-specific threat modeling.** Use MAESTRO or equivalent layered threat modeling for multi-agent systems, and map risks into privilege, design/configuration, behavioral, structural, and accountability categories before expanding autonomy [S50], [S51].

## Implications for OSSA and DUADP

OSSA should emphasize the agent contract fields that security teams need: agent identity, issuer, signed manifest hash, SBOM/provenance, declared tools, allowed actions, autonomy level, risk class, HITL gates, policy binding, cost controls, observability, and revocation hooks [S01], [S02]. DUADP should emphasize verified discovery: GAID -> DID -> signature proof -> trust tier -> policy result -> endpoint [S03].

The combined OSSA/DUADP value proposition is strong against the 2026 security landscape. Gravitee shows that organizations lack agent identities; NIST is asking for identity and authorization patterns; OWASP identifies identity, supply chain, and inter-agent communication as top risks; MCP research shows that tool metadata must be verified; and MIT shows that transparency is missing [S22], [S25], [S38], [S41], [S43].
