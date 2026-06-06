# Security and Governance Research

Date of research: 2026-06-06.

## Executive security posture

Agentic AI changes the security problem from "can a model produce unsafe text?" to "can a probabilistic system perform unsafe actions with real authority?" The central controls are identity, scoped authorization, deterministic mediation, observability, revocation, human approval for high-impact actions, and governance metadata that travels with the agent. [S15] [S16] [S18] [S19]

## Key statistics

| Finding | Source |
| --- | --- |
| 81% of teams are beyond planning, but only 14.4% have full security approval. | Gravitee 2026 report/blog. [S16] |
| 88% of organizations report confirmed or suspected AI agent security or privacy incidents in the previous year. | Gravitee 2026 report/blog. [S16] |
| Average active monitoring/security coverage is only 47.1% of an organization's AI agents. | Gravitee 2026 report/blog. [S16] |
| Fewer than 22% of teams treat agents as independent identities; many still rely on shared API keys. | Gravitee 2026 report/blog. [S16] |
| Of 13 AI agents with frontier autonomy, only 4 disclose agentic safety evaluations. | MIT AI Agent Index. [S12] |
| 25 of 30 indexed agents disclose no internal safety results; 23 of 30 have no third-party testing information. | MIT AI Agent Index. [S12] |
| Automated traffic grew 23.51% year over year in 2025 while human traffic grew 3.10%; agentic AI/browser traffic grew 7,851%. | HUMAN Security 2026 traffic report. [S42] |

## Threat model

### Prompt injection and indirect prompt injection

Prompt injection remains a leading agentic risk because agents consume untrusted content from emails, webpages, files, tickets, chat messages, and tool outputs. In an agent, a successful injection can trigger tool use, data exfiltration, unauthorized messages, database changes, or financial transactions. OWASP lists prompt injection and excessive agency as core LLM risks; ACM and arXiv work similarly frame prompt injection as a bridge from text manipulation to material system compromise. [S18] [S32] [S33]

### Excessive agency

OWASP LLM06:2025 defines Excessive Agency as damaging actions caused by ambiguous, unexpected, manipulated, or hallucinated model output. Root causes include excessive functionality, excessive permissions, and excessive autonomy. This risk is distinctive because it turns other vulnerabilities into side effects: hallucination becomes an incorrect API call; prompt injection becomes data exfiltration; bad output handling becomes code execution. [S18]

### Tool poisoning and MCP-specific risks

MCP expands agent capabilities by standardizing tools, but it also creates new trust boundaries. Research on MCP identifies 16 representative threat scenarios, including tool poisoning, installer spoofing, and unauthorized access. Tool poisoning can hide malicious behavior inside a tool or its metadata while preserving a benign interface, making it difficult for users and models to detect. [S17]

Additional MCP threat modeling work identifies tool poisoning through metadata as a major client-side vulnerability and recommends static metadata analysis, model decision-path tracking, behavioral anomaly detection, and user transparency. [S20]

### Identity confusion and confused deputy risk

Agents often act "on behalf of" a human or team, but shared API keys, broad service accounts, and unclear delegation blur accountability. NIST/NCCoE's concept paper focuses precisely on identification, authorization, auditing, non-repudiation, and prompt injection controls for software and AI agents. [S15]

The HBR/CyberArk sponsored article argues that AI identities inherit challenges from both human and machine identities. Traditional machine identities already outnumber humans heavily, and AI agents add autonomy and runtime decision-making to that identity problem. [S30]

### Web conduct and bot traffic

MIT's AI Agent Index found no established standards for how agents should behave on the web. Some agents omit clear policies for robots.txt, CAPTCHA handling, and anti-bot behavior. HUMAN Security's 2026 traffic findings show automated and agentic traffic growing quickly enough that sites need continuous behavioral validation, not just user-agent strings or IP-based controls. [S12] [S42]

## Identity and authorization frameworks

NIST/NCCoE's 2026 concept paper "Accelerating the Adoption of Software and Artificial Intelligence Agent Identity and Authorization" asks how identity standards and best practices should apply to AI agents. The paper's focus areas include:

- how organizations use or plan to use AI agents;
- what new problems agents create compared with conventional software;
- which current/emerging identity and access standards apply;
- identification, authorization, auditing, non-repudiation, and prompt-injection controls. [S15]

Related security commentary highlights practical standards likely to matter:

- OAuth 2.0 / OpenID Connect for delegated authorization and authentication.
- SCIM for lifecycle management.
- SPIFFE/SPIRE for cryptographic workload identity.
- policy-based/attribute-based authorization for fine-grained action decisions.
- MCP as a communication layer that may carry identity assertions but is not, by itself, a complete security framework. [S15]

## Recommended controls

### 1. First-class agent identities

Create separate identities for agents instead of using shared human/API credentials. Include metadata for purpose, owner, permissible actions, trust tier, model/runtime, and expiry. Support revocation and rotation. [S15] [S16] [S30]

### 2. Just-in-time, task-scoped delegation

Use ephemeral credentials scoped to one task or workflow. A support-ticket agent should not inherit payment, production database, or IAM permissions simply because the invoking human has them. [S15] [S19]

### 3. Deterministic policy enforcement point

Put a policy enforcement point between reasoning and tools. Every tool call should be evaluated before execution using deterministic policy, not an LLM's self-assessment. Policies should default deny, validate parameters, and route high-risk actions to human approval. [S19]

### 4. Human-in-the-loop for irreversible actions

Require explicit approval for deletes, sends, purchases, permission changes, production writes, customer-visible actions, or actions above a monetary/data-risk threshold. Cornell's enterprise workshop, MIT Sloan's guidance, OWASP, and production blogs all converge on this point. [S09] [S13] [S18] [S27]

### 5. Observability and audit

Log the full chain: user request, agent identity, model/runtime, retrieved context, plan, tool call, parameters, policy decision, human approval, result, cost, and downstream side effects. Use OpenTelemetry/W3C trace context where cross-agent hops occur. [S27] [S29]

### 6. Provenance and signed manifests

Use signed manifests, SBOM/provenance metadata, DID documents, and registry-level trust tiers for discoverable agents and tools. DUADP and OSSA explicitly model this trust/discovery layer through DIDs, signatures, GAIDs, trust tiers, and governance metadata. [S05] [S06] [S43] [S44]

### 7. Red-team and evaluate agent behavior

Evaluate not only model output but tool-call accuracy, policy-bypass attempts, prompt-injection resilience, memory poisoning, cost loops, and rollback behavior. MIT's index shows that safety evaluation disclosures are still rare, so internal teams should assume they need their own eval harness. [S12] [S17] [S20]

## Governance model

Minimum production governance should include:

- agent inventory and owner;
- declared manifest/contract;
- identity and credential lifecycle;
- policy binding and enforcement location;
- allowed tools and risk levels;
- human approval boundaries;
- monitoring and audit retention;
- incident response and kill switch;
- change management for prompts, tools, models, and capabilities;
- periodic recertification of agent permissions.

OSSA can carry several of these declarations as manifest metadata. DUADP can help discover, verify, revoke, and federate published resources. Neither replaces runtime enforcement; they provide the contract and discovery evidence needed by enforcement layers. [S05] [S06] [S43] [S44]

## Bottom line

Agents should be onboarded like non-human employees with limited signing authority: identifiable, trained by contract, scoped by role, monitored continuously, and prevented from taking high-impact actions without independent authorization. The best current practice is a zero-trust agent architecture: trust no prompt, no tool description, no registry entry, and no model plan until deterministic controls validate it.
