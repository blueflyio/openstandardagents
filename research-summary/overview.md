# Agentic AI, Protocols, Standards, and Security (2026): Overview

## Executive synthesis

Agentic AI has moved from experimentation to early production, but the ecosystem is still pre-standardization in many critical areas. The strongest pattern across sources is a split between:

1. **Fast protocol/framework innovation**, and  
2. **Lagging identity, governance, and safety controls**.  

MIT's 2025 AI Agent Index documents this directly: rapid releases and rising autonomy, but weak safety disclosure and no established norms for web conduct [[R16]][[R17]][[R55]]. Industry security data points to the same gap: high adoption velocity with incomplete security approvals and identity controls [[R46]][[R47]].

## What `openstandardagents.org` and `duadp.org` are

### `openstandardagents.org` (OSSA)

OSSA positions itself as a **vendor-neutral manifest/spec layer** for AI agents, not as a runtime protocol and not as a single execution framework. Its role is to define an agent contract once (YAML/JSON schema), then export to multiple runtimes/platforms (for example Docker, Kubernetes, LangChain, CrewAI) [[R01]][[R02]][[R03]][[R06]].

From package metadata and repo docs:
- npm package: `@bluefly/openstandardagents` (Apache-2.0) [[R04]][[R05]].
- Focus: identity/governance contract layer, schema validation, and deployment translation across protocol/runtime ecosystems [[R02]][[R06]].

### `duadp.org` (DUADP)

DUADP positions itself as a **federated discovery protocol** ("DNS for AI agents"), focused on finding, publishing, verifying, and federating agents/skills/tools across nodes [[R07]][[R08]]. In OSSA architecture language: OSSA defines the contract; DUADP handles discovery/federation [[R06]][[R11]].

From package metadata and docs:
- npm package: `@bluefly/duadp` (Apache-2.0), TypeScript SDK/client-server tooling [[R09]][[R10]].
- Discovery primitives include `.well-known` node manifests, agent/skill listing endpoints, and federation/peer exchange patterns in the draft spec [[R11]].

## npm package perspective (requested)

As of March 12, 2026:
- `@bluefly/openstandardagents` latest npm version: **0.4.9** [[R04]].
- `@bluefly/duadp` latest npm version: **0.1.4** [[R09]].

Practical reading:
- **OSSA package** = contract/schema/export tooling for portability.
- **DUADP package** = discovery/federation SDK for network-level agent lookup/publication.

Together they map to a layered model: contract/identity -> discovery/trust -> runtime execution [[R06]][[R11]].

## 2026 landscape themes

## 1) Protocol stack is converging by interface boundary
- **MCP**: agent <-> tools/context [[R20]][[R21]][[R22]].
- **A2A**: agent <-> agent task exchange, capability discovery via Agent Cards [[R23]][[R24]][[R25]].
- **AG-UI**: agent <-> user interface event streams [[R26]].
- **ANP / ACP / Agent Protocol / ATP**: alternate or complementary approaches for discovery, negotiation, inter-agent messaging, and execution control [[R27]][[R28]][[R30]][[R32]].

## 2) Framework layer is highly active
OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, and LlamaIndex all continue fast iteration, large community growth, and increasing enterprise positioning [[R34]][[R35]][[R37]][[R38]][[R39]][[R40]].

## 3) Security maturity remains the bottleneck
Frequent issues include prompt injection, over-privileged tooling, weak agent identity models, and incomplete monitoring [[R47]][[R48]][[R54]]. NIST's 2026 standards initiative and concept paper indicate identity/authorization for agents is now a formal standards priority [[R49]][[R50]][[R51]].

## 4) Governance and web-conduct norms are underdefined
MIT AI Agent Index explicitly highlights transparency deficits and absent web behavior standards [[R17]]. Harvard-centered protocol discourse emphasizes that open protocols can shape ecosystem behavior similarly to early internet standards [[R14]][[R15]][[R53]].

## Major opportunities

- **Interoperability by design**: reduce bespoke integrations by standardizing protocol boundaries early [[R20]][[R23]][[R26]][[R43]].
- **Contract-first deployment**: use manifest/spec layers to reduce runtime lock-in and improve auditability [[R01]][[R02]][[R06]].
- **Identity-first security**: treat agents as first-class principals, not shared API-key clients [[R47]][[R49]][[R50]].

## Major risks

- Autonomous execution without action-level authorization and policy checks [[R47]][[R48]][[R54]].
- Rapid deployment without transparent safety evidence [[R17]].
- Closed, siloed agent ecosystems that limit portability and external scrutiny [[R16]][[R53]].

## Scope and limitations

- This report focuses on **late-2025 to early-2026** material.
- Some pages were anti-bot blocked in direct fetch from this environment; where that occurred, official URLs are still cited and corroborated with adjacent official publications or source repositories [[R41]][[R50]].
- Where vendor or blog claims were not independently benchmarked, they are marked as source-reported rather than treated as universal fact.
