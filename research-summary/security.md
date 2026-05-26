# Security and Governance

As of 2026-05-26.

## Executive risk model

Agentic AI changes security because models no longer only generate text; they choose tools, delegate tasks, persist memory, and act across systems. The dominant risk is not simply hallucination. It is loss of control over who can do what, with which tools, on whose behalf, under which policy, and with what audit trail. Gravitee's report states this directly: agent security is an identity and governance problem, not only an AI accuracy problem. [gravitee-2026]

## Gravitee State of AI Agent Security 2026

Gravitee surveyed 919 executives and practitioners and found a structural gap between deployment velocity and governance. [gravitee-2026]

| Metric | Finding |
| --- | --- |
| Technical teams beyond planning | 80.9 percent |
| Teams deploying AI agents | 80.3 percent |
| Average agents managed per organization | 37 |
| Organizations with full IT/security approval for entire agent fleet | 14.4 percent |
| Average share of agents actively monitored or secured | 47.1 percent |
| Organizations reporting confirmed or suspected incidents in the last year | 88 percent |
| Healthcare respondents reporting/suspecting incidents | 92.7 percent |
| Teams treating agents as independent identities | 21.9 percent |
| Agent-to-agent auth using API keys | 45.6 percent |
| Agent-to-agent auth using generic tokens | 44.4 percent |
| Agent-to-agent auth using mTLS | 17.8 percent |
| Organizations using IAM/IdP as auth server for agentic MCP infrastructure | 23.7 percent |
| Teams using custom hardcoded authorization logic | 27.2 percent |
| Organizations with full visibility into agent-to-agent interaction | 24.4 percent |
| Organizations with no formal catalog of agents/MCP servers | 22.5 percent |
| Organizations relying on manual spreadsheets for cataloging | 25.4 percent |
| Organizations auditing agent activity daily | 7.7 percent |

The incident narratives are consistent: over-privileged agents, shared service accounts, prompt injection into agent-to-agent channels, sensitive data egress attempts, lack of audit trails, and human credential reuse. [gravitee-2026]

## NIST/NCCoE identity and authorization concept paper

The NIST/NCCoE concept paper "Accelerating the Adoption of Software and Artificial Intelligence Agent Identity and Authorization" was published on 2026-02-05, with comments closed on 2026-04-02. It proposes a project to demonstrate how existing identity standards and best practices can be applied to software agents and agentic AI applications. [nist-agent-identity]

NIST asks for input on:

- use cases for AI agents;
- new challenges compared with other software;
- current or emerging standards for agent identity and access management;
- technologies used to support agents;
- identification, authorization, auditing, non-repudiation, and controls for prompt injection mitigation. [nist-agent-identity]

Secondary legal and industry analysis identifies likely candidate standards: OAuth 2.0/2.1, OpenID Connect, SCIM, SPIFFE/SPIRE, NGAC, MCP, Zero Trust Architecture guidance, SP 800-63-4 digital identity guidance, and NISTIR 8587 token/assertion protection. [nist-analysis]

The unresolved hard problem is delegation chains. A user may authorize Agent A, which spawns Agent B, which calls Agent C and tools. Security systems must preserve principal-agent linkage, bounded scope, revocation, and auditability across the chain.

## OWASP Top 10 for Agentic Applications

OWASP released the Top 10 for Agentic Applications on 2025-12-09 as part of its Agentic Security Initiative. It positions agentic security as distinct from chatbot security because agents plan, coordinate, use tools, persist memory, and take actions. [owasp-agentic-top10]

| OWASP risk | Meaning |
| --- | --- |
| ASI01 Agent Goal Hijack | Attackers redirect the agent's objectives, often through prompt injection |
| ASI02 Tool Misuse | Legitimate tools are used destructively or beyond intended scope |
| ASI03 Identity and Privilege Abuse | Credentials, identities, or delegated permissions are misused or escalated |
| ASI04 Agentic Supply Chain Vulnerabilities | MCP servers, A2A components, skills, plugins, or tools are poisoned |
| ASI05 Unexpected Code Execution | Natural-language execution paths trigger unsafe code/command execution |
| ASI06 Memory and Context Poisoning | Persistent memory/RAG/context is corrupted for future behavior |
| ASI07 Insecure Inter-Agent Communication | Spoofed or tampered messages misdirect multi-agent systems |
| ASI08 Cascading Failures | False signals propagate through automated pipelines |
| ASI09 Human-Agent Trust Exploitation | Polished outputs mislead operators into approvals or disclosures |
| ASI10 Rogue Agents | Agents exhibit misalignment, concealment, or self-directed unsafe action |

OWASP's examples show that prompt injection is only one entry point. Tool ecosystems, supply chains, memory, inter-agent messaging, and human trust boundaries are equally important. [owasp-agentic-top10]

## MCP and protocol threat models

MCP is a central risk surface because it exposes real tools and data. The MCPShield paper describes MCP as the de facto agent-to-tool standard with more than 10,000 active servers, 177,000 registered tools, and 97 million monthly SDK downloads as of early 2026. It reports that action tools grew from 27 percent to 65 percent of all tools between November 2024 and February 2026, increasing the chance that tool misuse changes external state. [mcp-shield]

MCPShield's taxonomy includes:

- tool poisoning: malicious instructions in tool descriptions, schemas, or return values;
- rug pulls: post-approval mutation, version rollback, capability escalation;
- cross-server leakage: logging exfiltration, context bleed, channel coercion, sampling abuse;
- privilege escalation: capability chaining, consent bypass, role confusion;
- server trust violations: impersonation, supply-chain compromise, dependency hijacking;
- context manipulation: prompt injection through tools, memory poisoning, resource injection;
- protocol vulnerabilities: session hijacking, replay, cross-protocol confusion. [mcp-shield]

The comparative protocol threat modeling paper extends the analysis to MCP, A2A, Agora, and ANP. Its core claim is that protocol-level risk is understudied and that no mature cross-protocol risk assessment framework has yet become standard. It examines trust assumptions, interaction patterns, lifecycle risks, and cross-protocol composition risks. [protocol-threat-modeling]

## Web conduct, AI traffic, and agentic commerce risk

MIT's AI Agent Index found no established standards for agent web conduct. Sixteen of 30 indexed agents provide no clear statement about robots.txt, CAPTCHA handling, or web access methods, and some are designed to bypass anti-bot protections. [mit-index]

HUMAN Security's 2026 report shows why this matters:

- automated traffic grew eight times faster than human traffic in 2025;
- AI-driven monthly traffic grew 187 percent from January to December 2025;
- agentic AI traffic grew 7,851 percent year over year;
- 2.3 percent of agentic activity occurred on checkout pages;
- OpenAI bot identities represented about 69 percent of observed AI-driven traffic, Meta 16 percent, Anthropic about 11 percent. [human-ai-traffic]

The security problem is no longer only blocking bots. Some agents act for legitimate users, while attackers can use agentic browsers for scraping, account abuse, checkout fraud, or carding-like workflows. The needed controls are agent identification, intent and trust verification, scoped permissions, and runtime governance. [human-ai-traffic] [harvard-jolt-agentic-web]

## Identity, delegation, and Know Your Agent

Harvard JOLT's agentic web commentary argues that transparent agent identification is non-negotiable and that delegation and platform permission should be separated. Delegation answers "on whose behalf does the agent act?" Platform permission answers "where is it allowed to act?" [harvard-jolt-agentic-web]

A Know Your Agent standard would minimally require:

1. agent identity through cryptographically verifiable credentials;
2. principal-agent linkage to a human, organization, or system;
3. delegation parameters defining purpose, limits, and revocability;
4. auditability and behavioral record-keeping. [harvard-jolt-agentic-web]

This aligns closely with OSSA/DUADP's GAID, DID, signed manifest, trust-tier, and evidence APIs, and with NIST's emphasis on identification, authorization, auditing, and non-repudiation. [duadp-site] [ossa-site] [nist-agent-identity]

## Governance controls checklist

Use this checklist for production agent programs:

### Identity and access

- Assign every agent a unique identity; avoid shared API keys and personal accounts.
- Bind agent identity to a human/org principal and an explicit delegation record.
- Scope tokens by task, tool, data class, environment, and time.
- Use OAuth/OIDC/SPIFFE/mTLS patterns where practical.
- Support revocation, rotation, and incident quarantine.

### Tool and protocol security

- Inventory all MCP servers, A2A endpoints, AG-UI endpoints, skills, tools, and agent cards.
- Sign and attest tool definitions and agent manifests.
- Pin or verify tool definitions at approval time to prevent rug pulls.
- Filter toolsets aggressively; expose only needed tool groups.
- Enforce allowlists, parameter validation, output validation, and data classification.

### Runtime governance

- Apply per-request, per-task, per-agent, per-user, and per-tenant budgets.
- Set max turns, max tool calls, and loop detection.
- Add circuit breakers for low-quality or high-error subagents.
- Require HITL approval for irreversible, regulated, high-value, or low-confidence actions.
- Stream traces into OpenTelemetry/Langfuse/LangSmith or equivalent.

### Memory and RAG

- Scan before storing memory.
- Separate user, tenant, and global memories.
- Record provenance for memory writes.
- Periodically expire or revalidate long-term memory.
- Treat RAG corpora and vector stores as writable attack surfaces.

### Audit and compliance

- Log every agent decision, prompt version, tool call, data access, delegation, approval, and output.
- Preserve distributed trace IDs across MCP/A2A/AG-UI hops.
- Map controls to SOC 2, HIPAA, GDPR, FedRAMP, NIST AI RMF, or sector requirements.
- Review continuously; monthly audits do not match autonomous execution speed.

## Priority recommendations

1. Treat agent identity as a first-class IAM object before scaling agent fleets.
2. Put policy enforcement in front of tool access, not only in prompts.
3. Use signed manifests and tool definitions for provenance.
4. Add distributed tracing and decision lineage before external rollout.
5. Assume prompt injection can cross agent-to-agent and tool-return channels.
6. Prefer progressive autonomy: start with more human review, then reduce only with evidence.
7. Align with NIST/NCCoE and OWASP now; both are becoming reference language for auditors and security reviewers.
