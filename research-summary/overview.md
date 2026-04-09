# Agentic AI, Protocols, Standards, and Security (2026): Overview

**Research reference date for relative-time normalization:** **March 10, 2026**.  
All relative phrases from source materials (for example, "within five years") are normalized to absolute dates where possible.

## Executive Summary

Agentic AI moved from demos to production pilots during 2025-2026, but governance and interoperability remain uneven. University and policy sources describe a fast innovation cycle with missing standards for behavior, transparency, and accountability, while industry protocols are converging on open interfaces for tool access (MCP), agent-to-agent delegation (A2A), and agent-to-UI streaming (AG-UI). [T08][T09][T11][T12][T14][T16][T19]

Security data indicates a control gap: adoption is high, but identity, authorization, and assurance controls are inconsistent. In practice, many deployments still rely on shared credentials, and teams report high incident rates tied to prompt injection, over-privileged agents, and weak runtime controls. [T35][T36][T37][T38][T39]

Within this ecosystem, **OSSA** and **DUADP** form a paired infrastructure model: OSSA provides a portable manifest/contract layer for defining agents and deployment intent, and DUADP provides federated discovery and trust-gated routing built around decentralized identity concepts. [T01][T02][T03][T04][T05][T06]

## What DUADP and OSSA Are

### DUADP (`duadp.org`, `@bluefly/duadp`)

DUADP is positioned as a decentralized discovery protocol for agents, described as "DNS for AI agents." It combines web-native discovery surfaces (for example, `.well-known` and WebFinger-style patterns), federation/gossip patterns, and DID-based trust signaling so agents can be found and filtered by policy and assurance level. [T01][T04]

The npm package `@bluefly/duadp` (v0.1.4 published March 9, 2026) exposes SDK capabilities aligned to discovery, validation, trust, and federation workflows. In local OSSA workspace configuration, DUADP is wired as a discovery node (`https://discover.duadp.org`), which confirms active coupling between spec tooling and discovery infrastructure. [T04][T49][T06]

### OSSA (`openstandardagents.org`, `@bluefly/openstandardagents`)

OSSA is presented as an **agent manifest specification and toolchain**, not a runtime protocol and not a single orchestration framework. Its core claim is "define once, export to many platforms": a YAML contract model that can be validated and emitted into multiple target environments and agent stacks. [T02][T03][T05]

The npm package `@bluefly/openstandardagents` (v0.5.1 published March 28, 2026) includes schema exports, CLI tooling, MCP server integration points, and typed declarations for MCP/A2A/ANP protocol attachments. In local source, OSSA protocol typing explicitly models transport, capabilities, auth schemes, and discovery metadata, which reinforces its role as an interoperability contract layer. [T03][T06][T07]

## 2025-2026 Pattern: Layered Standardization

A practical stack is emerging:

1. **Identity and trust layer** (DIDs, attestations, credentials, policy signals). [T22][T38][T42]  
2. **Protocol transport layer** (MCP, A2A, AG-UI, ANP, Agent Protocol variants). [T14][T16][T19][T22][T23]  
3. **Contract/packaging layer** (OSSA manifests and export adapters). [T02][T03][T05]  
4. **Execution/orchestration layer** (OpenAI Agents SDK, LangGraph, CrewAI, etc.). [T27][T28][T29]

This model reduces point-to-point custom integrations, but only when teams enforce identity-aware authorization and signed supply-chain metadata end-to-end. [T33][T38][T40][T41]

## Major Opportunities

- **Interoperability gains** from protocol standardization and portable manifests can lower integration costs and accelerate environment portability. [T14][T16][T23][T33]  
- **Composable governance** becomes possible when policy, identity, and protocol declarations are machine-readable and independently testable. [T02][T05][T38][T41]  
- **Ecosystem specialization** allows teams to combine best-of-breed runtimes with common discovery and control contracts. [T27][T28][T29][T31]

## Major Risks

- **Prompt injection and tool abuse** remain first-order operational risks in connected agents. [T37][T40]  
- **Identity dilution** (shared keys instead of per-agent identity) weakens accountability and non-repudiation. [T35][T36][T38]  
- **Transparency gaps** make external risk evaluation difficult, especially in multi-vendor chains. [T11][T12]  
- **Protocol composition risk** increases when independently secure layers are combined without formal conformance checks. [T41]

## Key Timeline (Absolute Dates)

| Date | Development | Why it matters |
|---|---|---|
| November 25, 2024 | Anthropic announced MCP | Established open agent-tool integration baseline. [T14] |
| April 9, 2025 | Google announced A2A | Standardized cross-agent discovery/delegation patterns. [T16] |
| July 31, 2025 | A2A upgrades announced (including governance/security enhancements) | Improved interoperability depth and enterprise posture. [T17] |
| February 5, 2026 | NIST NCCoE concept paper on software/AI agent identity and authorization | Signals formalization of agent IAM expectations. [T38] |
| February 23, 2026 | Harvard LIL Agent Protocols Tech Tree post | Frames protocol openness as foundational internet-style governance. [T09] |
| March 9, 2026 | `@bluefly/duadp` v0.1.4 on npm | Confirms active DUADP SDK distribution. [T04] |
| March 28, 2026 | `@bluefly/openstandardagents` v0.5.1 on npm | Confirms active OSSA release cadence. [T03] |

## Limitations and Evidence Quality Notes

- Several high-level industry claims come from vendor or consultancy blogs; they are useful for operational heuristics but should be treated as secondary evidence unless cross-validated. [T33][T34][T36]  
- Some governance content (for example, parts of HBR analysis) may be partially paywalled; key points here rely on accessible excerpts/abstract-level material. [T43][T44]  
- One referenced Agent Protocol OpenAPI URL returned `404 Not Found` at research time, so protocol analysis used alternate canonical docs/repository materials. [T24][T48]
