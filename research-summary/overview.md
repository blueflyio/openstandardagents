# Agentic AI Ecosystem Research Overview

Prepared on May 27, 2026. Relative dates from source material have been normalized to absolute dates where possible. Citations use tether IDs such as [S01]; see `reading-list.md` for full links and access notes.

## Executive synthesis

The 2025-2026 agent ecosystem is converging on a layered stack, but the layers are still unevenly mature. MCP standardizes agent-to-tool and agent-to-data access; A2A, ACP, ANP, and related projects standardize agent-to-agent coordination; AG-UI standardizes the human-facing event stream; and OSSA plus DUADP propose a contract and discovery layer for defining, verifying, and finding agents [S02][S05][S06][S07][S08][S10].

This matters because agents are becoming production infrastructure before governance is ready. MIT's 2025 AI Agent Index found rapid deployment across 30 prominent agents, rising autonomy, a major transparency gap, and no established standards for web conduct [S14]. Gravitee's 2026 survey found that 80.9% of teams are already past planning, but only 14.4% have full security approval and 88% report confirmed or suspected incidents [S17]. NIST/NCCoE is therefore scoping identity and authorization standards for software and AI agents [S16].

## What DUADP and OSSA are

### DUADP

DUADP, the Decentralized Universal AI Discovery Protocol, is best understood as "DNS plus WebFinger plus federation for AI agents." The site frames the problem as missing universal discovery: MCP connects agents to tools, A2A connects agents to other agents, but agents still need a way to find each other across domains [S01]. DUADP provides:

- Discovery endpoints such as `/.well-known/duadp`, WebFinger resolution, and REST/MCP tools for listing agents, skills, tools, federation peers, governance policies, health, and metrics [S01].
- Federated search and gossip, where nodes share registrations and deduplicate results by content hash [S01].
- DID-backed identity and GAID lookup handles, with signature verification, provenance, revocation, trust tiers, and Cedar policy inputs [S01].
- A TypeScript npm package, `@bluefly/duadp`, version 0.1.4 as of May 27, 2026. The package is Apache-2.0, exposes client/server/validation/crypto/DID/conformance subpaths, and supports 15 core protocol endpoints in the SDK README [S04][S32].

In short: DUADP discovers agents, skills, and tools, and tries to make discovery trustworthy through DIDs, signatures, federation, revocation, and policy-aware trust tiers.

### OSSA

OSSA, the Open Standard for Software Agents, is not positioned as a runtime protocol or an agent framework. It is a portable agent contract layer: a YAML manifest that can be validated, signed, governed, and exported to deployment targets such as Docker, Kubernetes, LangChain, CrewAI, MCP, A2A, GitLab Duo, Claude/Cursor-style skills, and npm packages [S02][S03].

The OSSA site states the gap directly: MCP connects tools and A2A connects agents, but neither defines the portable contract that says what an agent is, what it can access, and what governance rules apply [S02]. OSSA provides:

- Schema-validated manifests for identity, capabilities, tools, autonomy, compliance, human oversight, observability, cost controls, state, team topology, and export targets [S02][S03].
- Agent identity via GAID/DID concepts, cryptographic signatures, SBOM/provenance pointers, Cedar policies, and compliance metadata [S02][S03].
- CLI/MCP tooling. The site advertises MCP tools for validation, scaffolding, conversion, inspection, publishing, diffing, migration, and workspace operations [S02].
- An npm package, `@bluefly/openstandardagents`, version 0.5.1 as of May 27, 2026. The package is Apache-2.0, exposes schemas and runtime/export APIs, and provides CLI binaries such as `ossa`, `ossa-dev`, and `ossa-mcp` [S03][S32].

In short: OSSA defines the agent contract; DUADP discovers and federates those contracts and related resources.

## The emerging protocol stack

| Layer | Main protocols or specs | Primary question answered |
| --- | --- | --- |
| Tools and data | MCP, ATP, OpenAPI bridges | What tools, APIs, files, or databases can the agent use? |
| Agent contract | OSSA, Agent Cards, OASF-style schemas | What is this agent, what is it allowed to do, and how is it deployed? |
| Discovery and identity | DUADP, ANP, DID/WebFinger, KYA proposals | How do agents find and verify each other? |
| Agent-to-agent work | A2A, ACP, ANP, LangChain Agent Protocol | How do agents delegate, coordinate, stream, and track tasks? |
| Human interface | AG-UI, A2UI-style UI specs | How does a user observe, steer, approve, and interrupt agent work? |
| Governance and security | NIST/NCCoE, OAP, LGA, OWASP-style taxonomies | How are identity, authorization, auditability, and blast radius enforced? |

## Key themes

### 1. Standardization is replacing bespoke integration

Anthropic described MCP as a universal, open standard intended to replace fragmented custom integrations with a single protocol for secure, two-way connections between AI systems and data sources [S05]. Google described A2A as an open protocol for agents to communicate, exchange task artifacts, discover capabilities through Agent Cards, and support long-running tasks over existing web standards [S06]. IBM's ACP uses REST over HTTP to make agent-to-agent interaction accessible with ordinary tools like curl and Postman [S10].

The shared direction is clear: avoid one-off connectors, move capabilities into declarative or discoverable surfaces, and let agents interoperate across frameworks and vendors.

### 2. Protocols are complementary, not substitutes

MCP is not A2A, A2A is not AG-UI, and OSSA/DUADP are not replacements for either. MCP answers "what can this agent use?" A2A/ACP answer "who can it work with?" AG-UI answers "how does the user stay in the loop?" OSSA answers "what is the portable, governable definition of this agent?" DUADP answers "how can other systems find and verify it?" [S01][S02][S05][S06][S07][S10].

### 3. Academic and policy institutions emphasize transparency and governance

Cornell's Agentic AI Architecture program moves from LLM fundamentals to RAG, tool-using agents, multi-agent workflows, protocols, governance, risk, security, and human oversight [S12]. Harvard's Agent Protocols Tech Tree argues that open protocols reveal what builder communities are forced to agree on and may shape agent behavior in the way early internet protocols shaped network behavior [S13]. MIT's AI Agent Index makes the governance problem empirical: most agent developers disclose capabilities more readily than safety practices [S14].

### 4. Security is moving outside the prompt

Security guidance is converging around deterministic controls outside the LLM. NIST/NCCoE asks for standards and best practices for identification, authorization, auditing, non-repudiation, and prompt-injection mitigations [S16]. Recent research proposes execution sandboxing, intent verification, zero-trust inter-agent authorization, immutable audit logs, and pre-action authorization hooks that block tool calls before execution [S27][S29]. DEV Community guidance reaches the same engineering conclusion: prompts are not guardrails; infrastructure boundaries, runtime control planes, and policy hooks are [S34].

### 5. Production agents need cost, reliability, and observability controls

Industry blogs emphasize progressive rollout, cost caps, circuit breakers, traceability, and human-in-the-loop gates for high-risk actions [S24][S31]. GitLab's Duo Agent Platform shows how this is becoming productized: context-aware agentic chat, specialist agents, flows, an AI Catalog, MCP client integrations, model selection, group controls, and usage visibility all sit inside the software delivery lifecycle [S18].

## High-confidence recommendations

1. Treat agents as independent, identity-bearing principals. Shared API keys are incompatible with auditability and least privilege [S16][S17].
2. Separate contract, discovery, transport, and runtime concerns. OSSA/DUADP, MCP, A2A/ACP, AG-UI, and framework runtimes solve different layers [S01][S02][S05][S06][S07][S10].
3. Put policy enforcement before tool execution. Use hooks, gateways, or authorization layers that fail closed and produce signed or tamper-evident audit records [S27][S29][S34].
4. Start with low-risk, measurable pilots. Use MCP for tool access first, add A2A/ACP only where multi-agent delegation is needed, then add AG-UI for user-facing control and observability [S24][S31].
5. Document agent behavior as a first-class artifact. MIT's index shows that transparency gaps are a core ecosystem risk, not a documentation nuisance [S14].

## Limitations

- Firecrawl CLI was unavailable because it was not authenticated in this unattended environment, so built-in web search/fetch tools and CLI metadata queries were used instead.
- Gartner and 47Billion pages were partially inaccessible through direct fetch during this run; their summaries are based on search snippets and should be rechecked before publication [S30][S31].
- Several 2026 arXiv/security papers are preprints. They are useful for threat modeling and architecture, but should not be treated as finalized standards [S27][S28][S29].
