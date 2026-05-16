# Agentic AI, Protocols, Standards, and Security - Overview

Current date used for relative-date normalization: May 16, 2026.

## Executive synthesis

The agent ecosystem is converging into layered infrastructure. MCP gives agents a
standard way to use tools and context; A2A and ACP address agent-to-agent task
exchange; AG-UI standardizes agent-to-user application events; ANP and DUADP
focus on discovery, identity, and federation; OSSA defines a portable contract
for what an agent is, what it may access, and how it should be governed
[PROTO-01] [PROTO-02] [PROTO-03] [PROTO-04] [PROTO-08] [PROTO-09].

The central gap is no longer whether agents can be built. Cornell describes the
modern stack as LLM fundamentals, RAG, tools, memory, multi-agent workflows,
protocols, governance, risk, and security [ACAD-01]. Harvard frames agents as
"models using tools in a loop" and argues that open protocols, not centralized
control alone, will shape behavior because the ingredients are easy to recreate
[ACAD-03]. MIT's 2025 AI Agent Index shows deployed agents are already highly
autonomous, but safety disclosures and web-conduct standards remain weak
[ACAD-10].

OSSA and DUADP are Bluefly's answer to two missing layers. OSSA is a manifest
and contract standard: define an AI agent once in YAML or JSON, validate it
against a schema, encode identity/governance/security metadata, and export to
deployment targets such as Docker, Kubernetes, LangChain, CrewAI, MCP, A2A,
Claude/Cursor-style agents, GitLab Duo, and npm [BF-01] [BF-02] [NPM-01].
DUADP is a decentralized discovery protocol: publish and find agents, skills,
and tools via well-known endpoints, DNS TXT records, WebFinger, federated gossip,
GAID/DID identity, signatures, trust tiers, and MCP/REST interfaces [BF-03]
[BF-04] [NPM-02].

Security evidence is sobering. Gravitee's 2026 survey of 919 respondents reports
that 80.9% of technical teams are past planning, but only 14.4% have full IT or
security approval for their agent fleet; 88% report confirmed or suspected
agent security/privacy incidents; only 21.9% treat agents as independent
identity-bearing entities [SEC-01]. NIST/NCCoE, CISA, and OWASP all point to the
same control plane: agent identity, authorization, auditability, prompt-injection
defenses, continuous monitoring, least privilege, and human oversight for risky
actions [SEC-02] [SEC-03] [SEC-04].

## What the ecosystem is becoming

1. Protocol specialization is replacing bespoke integrations. MCP is for
   agent-to-tool/context; A2A and ACP are for agent-to-agent communication;
   AG-UI is for user-facing applications; DUADP/ANP are for discovery and
   decentralized identity; OSSA is the portable agent contract [PROTO-01]
   [PROTO-02] [PROTO-03] [PROTO-06] [PROTO-08] [PROTO-09].
2. Frameworks are becoming execution surfaces. LangGraph, CrewAI, OpenAI Agents
   SDK, LlamaIndex, AutoGen, Parlant, and GitLab Duo Agent Platform provide
   different orchestration models, but all need protocol, identity, evaluation,
   and observability layers [FW-01] [FW-02] [FW-03] [FW-05] [FW-06] [FW-07].
3. Discovery and trust are now first-class problems. A2A Agent Cards advertise
   capabilities, ANP uses DID-based descriptions, DUADP uses GAID/DID and
   federation, and OSSA embeds identity, authorization, signatures, SBOMs, and
   compliance controls in the manifest [PROTO-02] [PROTO-04] [PROTO-08]
   [PROTO-09].
4. Governance is moving from policy documents into runtime enforcement. The
   strongest patterns are signed intents, unique non-human identities, per-action
   policy checks, revocation, kill switches, OpenTelemetry-style traces,
   approval gates, and cost/iteration ceilings [SEC-01] [SEC-02] [BLOG-05].

## Main opportunities

- Standard contracts can reduce the MxN problem. OSSA's claim is that teams
  should maintain one agent manifest rather than separate configuration for each
  framework, deployment target, and governance system [BF-01] [NPM-01].
- Discovery can be decentralized. DUADP combines DNS, WebFinger, federation, and
  DID-based identity to make agents discoverable without one central registry
  [BF-03] [BF-04] [NPM-02].
- Protocols can preserve optionality. Early adoption of MCP, A2A, and AG-UI can
  reduce custom connectors and let teams focus on product behavior, evaluation,
  and reliability [BLOG-01].
- Narrow, well-bounded agents are production-ready sooner than open-ended
  multi-agent systems. 47Billion's production write-up recommends Level 2-3
  workflows before open-ended Level 4 multi-agent systems [BLOG-01].

## Main risks

- Agents can turn prompt injection into real action. They call tools, spend
  money, write data, message other systems, and delegate to other agents
  [SEC-01] [BLOG-05].
- Shared credentials destroy accountability. Gravitee reports widespread API-key
  and generic-token use for agent-to-agent interactions [SEC-01].
- Web conduct norms are unsettled. MIT reports that browser agents often ignore
  robots.txt or bypass anti-bot systems, and only one indexed agent used
  cryptographic request signing [ACAD-11].
- Agent traffic may crowd human traffic. Harvard policy commentary notes bots
  already comprise about half of internet traffic and argues for protocols,
  network upgrades, and next-generation human/agent distinction mechanisms
  [ACAD-15].

## Practical recommendation stack

1. Inventory every agent, MCP server, tool, credential, model, owner, purpose,
   autonomy level, and decommission path [SEC-01] [SEC-05].
2. Assign every agent a unique identity and use short-lived credentials rather
   than shared API keys [SEC-02] [SEC-01].
3. Use MCP for tools/context, A2A or ACP for agent task exchange, AG-UI for
   frontend interaction, and DUADP/ANP-style discovery when agents need to find
   each other across boundaries [PROTO-01] [PROTO-02] [PROTO-03] [PROTO-06]
   [PROTO-08].
4. Use an agent contract layer such as OSSA when portability, compliance,
   manifest validation, platform export, or governance metadata matter [BF-01]
   [NPM-01].
5. Authorize each action at runtime: tool, parameters, resource, data class,
   amount, environment, user delegation, and approval status [SEC-02] [BLOG-05].
6. Build continuous observability: trace prompts, plans, tool calls, policy
   decisions, costs, inter-agent messages, outputs, approvals, and failures
   [SEC-01] [FW-07].

## Deliverables in this folder

- `academia.md`: Cornell, Harvard, MIT, ACM/arXiv, HBR, and MIT Press sources.
- `protocols.md`: Protocol and standard comparisons, including OSSA and DUADP.
- `frameworks.md`: Open-source and product framework analysis.
- `security.md`: Security statistics, threat models, and controls.
- `blogs.md`: Engineering-blog synthesis and caveats.
- `reading-list.md`: Source bibliography with citation keys.
