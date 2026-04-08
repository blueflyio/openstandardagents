# Agentic AI Ecosystem Research Overview (compiled April 8, 2026)

This summary synthesizes late-2025 to early-2026 developments across:

- academic/policy research,
- open protocols and standards,
- framework/tooling ecosystems,
- and security/governance operations.

Detailed files:

- `academia.md`
- `protocols.md`
- `frameworks.md`
- `security.md`
- `blogs.md`
- `reading-list.md`

## Executive synthesis

### 1) The ecosystem is converging into layers

The most stable 2026 framing is a layered stack:

1. **Tool access**: MCP [R07][R08]
2. **Agent communication**: A2A (+ ACP consolidation path) [R10][R11][R12][R16]
3. **Agent contract/manifest**: OSSA-style definitions [R04][R05][R06]
4. **Discovery/federation**: DUADP and registry patterns [R01][R02][R03]
5. **Agent-to-UI transport**: AG-UI [R13]

Comparative academic work supports this layered interpretation. [R28]

### 2) What `duadp.org` is

DUADP positions itself as a decentralized discovery protocol for agents/skills/tools:

- DNS/WebFinger-style discovery
- federation/gossip replication
- DID-oriented identity metadata
- REST/MCP exposure for discovery/publish flows [R01][R02][R03]

npm snapshot (April 8, 2026):

- `@bluefly/duadp` v0.1.4
- Apache-2.0
- weekly downloads ~165 [R03]

Interpretation: discovery/federation plane, not an agent runtime framework.

### 3) What `openstandardagents.org` is

OSSA positions itself as a portable contract layer:

- schema-validated manifest,
- governance/compliance metadata,
- export/transformation to multiple targets [R04][R05][R06]

npm snapshot (April 8, 2026):

- `@bluefly/openstandardagents` v0.5.1
- Apache-2.0
- weekly downloads ~269 [R06]

Interpretation: contract + packaging layer; complementary to MCP/A2A.

### 4) Adoption is outpacing governance

Evidence across MIT and security surveys:

- rapid deployment velocity,
- persistent transparency/safety disclosure gaps,
- weak standardized web-conduct expectations for agents,
- and high incident/approval gaps in enterprise surveys. [R25][R39][R40]

### 5) Protocol consolidation is accelerating

- MCP moved from launch to Linux Foundation governance context. [R07][R09]
- A2A evolved from launch to expanded ecosystem and toolkit claims. [R10][R11][R12]
- ACP now explicitly points to A2A migration/consolidation. [R16][R17]

### 6) Frameworks are maturing into production stacks

Framework ecosystems now differentiate by orchestration model:

- OpenAI Agents SDK (guardrails/handoffs/tracing) [R32]
- CrewAI (agents/crews/flows) [R33]
- AutoGen (AgentChat/Core/event-driven architecture) [R34]
- LlamaIndex (document-centric agent workflows) [R35]
- Parlant (conversational behavior/control layer) [R36]

Repository activity confirms strong but uneven maturity. [R38]

### 7) Security baseline has shifted

The dominant issue is no longer only model quality; it is identity + authorization + runtime enforcement:

- prompt injection and over-privilege are central concerns,
- shared credentials and weak attribution remain common,
- standards efforts are focusing on non-human identity, delegation, and authorization. [R27][R39][R40][R41][R42][R43]

## Opportunities

1. Layered standardization can reduce bespoke integration burden. [R28]
2. Portable manifests improve migration and compliance consistency. [R05][R06]
3. Discovery + identity metadata can improve interop if tied to strong policy. [R02][R41]

## Risks

1. Ongoing interop fragmentation during rapid protocol evolution. [R28]
2. Security/governance lag creates “shadow agent” exposure. [R39][R40]
3. Concentration risk in upstream model/provider dependencies remains non-trivial. [R25]

## Evidence notes

- Official specs/docs and institutional research were prioritized.
- Vendor/project blogs are used for operational detail and treated as directional unless cross-supported.

