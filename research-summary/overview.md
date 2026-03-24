# Agentic AI Ecosystem Research Overview (as of 2026-03-24)

This package synthesizes late-2025 to early-2026 developments in agentic AI, with emphasis on:

- `https://duadp.org/`
- `https://openstandardagents.org/`
- related npm ecosystems, protocol standards, frameworks, and security/governance research. [S01][S05][S04][S07]

## High-level findings

1. **The stack is converging into layers, not one protocol.**  
   MCP is becoming the dominant agent-to-tool integration standard; A2A/ACP/ANP target agent-to-agent interaction; AG-UI focuses on agent-to-user-interface interaction. [S09][S11][S24][S20][S16]

2. **DUADP and OSSA are proposing missing layers (discovery + contract).**  
   DUADP positions itself as federated discovery/identity/trust infrastructure; OSSA positions itself as a portable agent manifest/contract model across runtimes. [S01][S02][S03][S05][S06]

3. **Adoption is outpacing security operations maturity.**  
   Security reporting from 2026 shows widespread deployment but incomplete approval, weak identity practices, and high incident prevalence. [S36][S37]

4. **Security focus has shifted from “model hallucination only” to “action governance.”**  
   Primary risks are now prompt injection, over-privileged tool access, weak agent identity/authz, and poor runtime observability/revocation controls. [S33][S34][S38][S41]

5. **Framework landscape is mature enough for production pilots, but not uniform.**  
   OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, and LlamaIndex all show substantial ecosystem traction, but differ in orchestration style, control model, and operational ergonomics. [S44][S46][S48][S50][S52]

## What DUADP is

DUADP presents itself as a decentralized/federated AI discovery protocol (“DNS for AI agents”) with:

- DNS/WebFinger-style discovery
- federation and gossip propagation
- DID-oriented identity
- trust tiers and governance endpoints
- MCP-accessible tool surface for discovery operations. [S01][S02][S03]

Its npm package `@bluefly/duadp` is the TypeScript SDK/distribution channel for client/server protocol operations, validation, signing, and conformance utilities. [S04]

## What Open Standard Agents (OSSA) is

OSSA positions itself as an open agent contract/specification layer:

- schema-driven agent manifests
- validation and migration
- “define once, export to many platforms” workflow
- integration points for MCP/A2A ecosystems
- CLI + MCP tooling via npm package `@bluefly/openstandardagents`. [S05][S06][S07]

## What this means strategically

- Teams should treat MCP/A2A/AG-UI as **complementary** rather than mutually exclusive.
- Discovery and portable contract layers are still fluid; DUADP/OSSA are notable entrants but should be evaluated as emerging ecosystem initiatives.
- Security architecture (identity, authorization, runtime controls, auditing, revocation) is now first-order design work, not an afterthought.

## Scope caveats

- Some cited industry and business articles are partially gated/paywalled; this report uses available public text and explicitly flags uncertain claims where needed. [S56]
- Certain highly-circulated claims about “bots becoming most internet traffic” were not consistently confirmed in requested Harvard primary sources; these are treated as directional, not canonical facts. [S28][S57]

## Document map

- `academia.md` — university/research-center findings (Cornell, Harvard, MIT, and research literature)
- `protocols.md` — standards/protocol comparison (MCP, A2A, AG-UI, ANP, Agent Protocol, ACP, ATP, DUADP, OSSA context)
- `frameworks.md` — open-source and platform landscape (OpenAI SDK, LangGraph, CrewAI, AutoGen, LlamaIndex, GitLab Duo, etc.)
- `security.md` — threat landscape, identity/authz, controls, governance
- `blogs.md` — practical implementation insights and caveats from industry engineering writing
- `reading-list.md` — source index and citation keys
