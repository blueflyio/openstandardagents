# Agentic AI landscape (late-2025 to early-2026): overview

Date baseline for this report: **2026-03-10**.

## Executive synthesis

The current agent ecosystem looks like early Internet protocol formation: multiple open standards are emerging at once, with overlapping scopes and incomplete governance. The strongest pattern is a **stack split**:

1. **Agent-to-tool/context protocols** (for capability access), led by MCP. [R15][R16]  
2. **Agent-to-agent protocols** (for delegation/collaboration), led by A2A and related efforts (ACP, ANP). [R17][R18][R22][R24]  
3. **Agent-to-UI event protocols** (for runtime UX and observability), exemplified by AG-UI. [R20][R21]

At the same time, framework ecosystems are consolidating around orchestration and reliability primitives (OpenAI Agents SDK, LangGraph, CrewAI, AutoGen, LlamaIndex), while security evidence shows adoption is faster than governance maturity. [R27][R28][R29][R30][R31][R36]

## What DUADP and Open Standard Agents are (direct answer)

### DUADP (`duadp.org`)

DUADP presents itself as a **Decentralized Universal AI Discovery Protocol** ("DNS for AI agents"), oriented around discovery and federation semantics. Its public metadata describes DNS/WebFinger/federation concepts, and the SDK is distributed as `@bluefly/duadp` with an Apache-2.0 license and CLI entrypoint (`duadp`). [R01][R02]

In practical terms, DUADP is trying to solve the **discovery plane** problem: "How does one agent/system locate another agent capability across organizational boundaries?"

### Open Standard Agents / OSSA (`openstandardagents.org`)

OSSA is positioned as a **vendor-neutral manifest/specification layer** ("OpenAPI for AI agents"), with schema-driven agent definitions, versioned API semantics, migration pathways, and adapter/export tooling. [R03][R04]

Its npm package `@bluefly/openstandardagents` is a large CLI/tooling distribution (Apache-2.0), including commands such as `ossa`, `ossa-validate-all`, and `ossa-mcp`. [R05]

In practical terms, OSSA is trying to solve the **contract plane** problem: "How do we represent an agent consistently across runtimes and protocol ecosystems?"

### NPM package ecosystem around these terms

There are at least two package families in circulation:

- **Bluefly/OSSA family** (`@bluefly/duadp`, `@bluefly/openstandardagents`) tied to duadp.org/openstandardagents.org and GitLab repositories. [R02][R05]
- **`@standardagents/*` family** (`@standardagents/spec`, `@standardagents/openrouter`) with different maintainers, different licensing posture (`MIT` vs `UNLICENSED` for openrouter), and separate release line (`0.12.x`). [R06][R07]

Conclusion: these names are adjacent conceptually but **not a single unified package lineage**. Teams should evaluate provenance and governance model before adoption.

## Where the standards landscape is heading

- **MCP** is becoming the default tool/context integration substrate in many developer workflows. [R15][R16]  
- **A2A** is moving from announcement to ecosystem build-out (v0.3 features, larger partner base, Linux Foundation path). [R17][R18]  
- **AG-UI** addresses a real gap: interoperable front-end event semantics for streaming runs, tool lifecycle, and state deltas. [R20][R21]  
- **ANP/ACP/ATP** show active experimentation in decentralized identity, long-running messaging, and code-first execution patterns. [R22][R24][R26]

## Main risks and governance signal

Two data points define the risk posture:

- Transparency and evaluation are still weak for many deployed agents (MIT AI Agent Index findings). [R10][R11]
- Security operations are lagging deployment in enterprises (Gravitee 2026 data). [R36]

This aligns with NIST/NCCoE direction toward identity, authorization, auditing, and prompt-injection controls for software/AI agents. [R37][R38]

## Recommended interpretation for practitioners

Treat 2026 as the year to standardize your internal architecture around:

1. **Protocol boundaries** (tool vs agent vs UI). [R15][R17][R21]  
2. **Identity-first security** (agent-level identities, scoped authZ, traceability). [R36][R37]  
3. **Portability contracts** (schema/manifest governance, versioning, migration policy). [R04][R05]

If these foundations are skipped, teams accumulate brittle adapters, unclear accountability, and expensive security retrofits.
