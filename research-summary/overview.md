# Agentic AI, Protocols, Standards, and Security (2026): Overview

Date of synthesis: 2026-03-25  
Scope emphasis: late-2025 to early-2026 primary sources, plus official docs/blogs and selected research reports.

## Executive summary

The 2025-2026 agent ecosystem is converging on a layered architecture:

1. **Agent-to-tool connectivity** (MCP) [S05][S06]  
2. **Agent-to-agent interoperability** (A2A, ACP lineage, ANP) [S07][S08][S11][S28]  
3. **Agent-to-user interaction protocols** (AG-UI) [S10]  
4. **Agent contract/packaging/deployment layers** (for example OSSA) [S03][S04]  
5. **Discovery and trust overlays** (for example DUADP and DID-based trust claims) [S01][S02]

This resembles early Internet protocol stratification: open interfaces are becoming the key lever for interoperability, portability, and governance. Harvard LIL explicitly frames open protocols as the “x-ray” of what builders are agreeing on in real time. [S19]

## What DUADP and Open Standard Agents are

### DUADP (duadp.org, `@bluefly/duadp`)

DUADP presents itself as a decentralized discovery protocol for agents/skills/tools, with federation and DID-backed identity, positioning itself as “DNS for AI agents.” [S01]  
The npm package `@bluefly/duadp` is a TypeScript SDK (Apache-2.0), published 2026-03-09, with client/server/validation/crypto/DID/conformance surfaces. [S02]

In practical terms, DUADP is trying to solve **agent discovery and federation**, not model orchestration itself. The project claims MCP interoperability, federated search, and governance endpoints. [S01][S02]

### Open Standard Agents / OSSA (openstandardagents.org, `@bluefly/openstandardagents`)

OSSA positions itself as a **portable contract layer** for agents: define once in YAML, export to multiple runtimes/platforms. [S03][S04]  
The npm package `@bluefly/openstandardagents` (Apache-2.0) is at version 0.5.0 (2026-03-15) and exposes CLI/schema/export tooling. [S04]

In practical terms, OSSA attempts to solve **manifest portability, governance metadata, and deployment translation** across heterogeneous frameworks and runtimes. [S03][S04]

## Academia and governance direction

- **Cornell/eCornell** is teaching the stack explicitly from LLM mechanics to RAG to agentic protocols to governance/risk/ethics. [S18]  
- **Harvard LIL/Berkman context** emphasizes protocols as governance-relevant architecture, not just implementation detail. [S19]  
- **MIT AI Agent Index 2025** reports rapid deployment and major transparency gaps in safety disclosure/testing, plus unresolved web conduct norms. [S20]  
- **MIT Sloan (2026 guidance)** argues agentic AI is strategically important but not yet “prime time” because of hallucinations/prompt injection and operational risk. [S21]

## Key security reality

Security and governance are lagging deployment:

- Gravitee’s 2026 survey reports broad deployment progress but weak approval/identity controls and high incident prevalence. [S23][S24]  
- NIST NCCoE’s 2026 concept paper calls for identity/authz standards specifically for software and AI agents, including prompt-injection-aware controls. [S25]  
- Public large-scale red-teaming evidence shows indirect prompt injection remains broadly effective across frontier systems. [S27]

## Adoption signal snapshot

- MCP ecosystem shows large and active OSS footprint (spec + servers + SDKs). [S06]  
- A2A moved from Google launch to Linux Foundation project context with broad partner roster. [S07][S08][S09]  
- AG-UI shows strong OSS traction around frontend-agent event protocols. [S10]  
- Open-source framework ecosystem is growing quickly (for example LangGraph, CrewAI, AutoGen, LlamaIndex, OpenAI Agents SDK). [S15][S16][S36][S37][S38][S39][S40]

## Practical implication for teams

A robust 2026 enterprise architecture generally needs all of:

- **Protocol strategy**: MCP + A2A (or ACP lineage) + optional AG-UI [S05][S07][S10][S28]  
- **Contract/manifest strategy** for portability and governance [S03][S04]  
- **Discovery/identity strategy** for federated environments [S01][S11][S25]  
- **Security controls** at identity, policy, tool-permission, and runtime monitoring layers [S23][S25][S27]

## Limitations

- Some cited material is vendor or consultancy content (not peer-reviewed), useful for implementation insights but should be validated independently. [S31][S32]  
- Some policy/business publications (for example HBR) may be partially paywalled in full-text form. [S41]  
- Metrics like stars/downloads are snapshots as of 2026-03-25 and change continuously. [S02][S04][S30][S36][S37][S38][S39][S40]
