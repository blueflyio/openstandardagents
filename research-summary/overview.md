# Agentic AI, Protocols, Standards, and Security (Research Snapshot)

Prepared: March 20, 2026

## Executive synthesis

Agent ecosystems are converging into a layered stack:

1. **Tool/data connectivity** (for example MCP) [R7][R8]  
2. **Agent-to-agent coordination** (for example A2A) [R9][R11]  
3. **Agent-to-UI interaction** (for example AG-UI) [R12][R13]  
4. **Contract/manifest + packaging** (OSSA / `@bluefly/openstandardagents`) [R2][R3][R4]  
5. **Discovery and federation** (DUADP / `@bluefly/duadp`) [R1][R5]

The ecosystem is still pre-standardized in behavior and governance, but standardization pressure is high due to enterprise adoption, rising complexity, and mounting security incidents. [R29][R30][R40][R41]

## What DUADP and Open Standard Agents are

- **DUADP** (`duadp.org`) is positioned as a decentralized discovery layer ("DNS for AI agents"), with identity and discovery primitives (GAID, DID, WebFinger) and federated discovery/federation operations. [R1][R5]  
- **Open Standard Agents / OSSA** (`openstandardagents.org`, npm package `@bluefly/openstandardagents`) is positioned as a vendor-neutral manifest/contract layer: define agent identity/capabilities/governance once, then validate/export across runtimes. [R2][R3][R4]
- In this repository itself, `package.json` confirms this project is `@bluefly/openstandardagents`, and DUADP is used as a dependency (`@bluefly/duadp`) in the toolchain. [R4][R5]

## Current directional signals (late 2025 to early 2026)

- **Protocol momentum**: MCP remains central for tool connectivity; A2A has expanded ecosystem support and stronger formalization; AG-UI fills frontend interaction gaps. [R8][R10][R11][R12]
- **Enterprise operationalization**: GitLab Duo Agent Platform moved to GA in January 2026 with foundational agents and catalog governance patterns. [R27][R28]
- **Transparency gap remains**: MIT's AI Agent Index shows deployment speed outpacing disclosed safety evidence and third-party validation. [R29][R30][R31]
- **Security lag is material**: Gravitee's 2026 findings indicate high adoption but low mature security approval and high incident prevalence. [R40][R41]
- **Identity and authorization are becoming first-class controls**: NIST/NCCoE concept work explicitly targets agent identity, delegation, authorization, and auditing models. [R42]

## High-confidence opportunities

- Standardize by **layer**, not by vendor lock-in: pair MCP + A2A + AG-UI with explicit manifest/discovery choices (OSSA/DUADP or equivalents). [R1][R3][R8][R11][R12]
- Move from shared credentials to **agent identities** and policy-based authorization (least privilege, pre-execution checks, auditable delegation chains). [R40][R41][R42]
- Treat observability and evaluation as deployment prerequisites: tracing, guardrails, human-in-the-loop boundaries, and rollback paths. [R21][R22][R29]

## Highest-priority risks

- Prompt injection leading to unintended tool execution. [R45]  
- Excessive permissions and over-broad service account usage. [R40][R45]  
- Hallucinated actions in autonomous loops. [R32][R45]  
- Cross-agent trust ambiguity (who is acting for whom, with what delegated authority). [R39][R42]

## Scope and evidence notes

- This snapshot prioritizes **primary sources** (official docs, specs, university publications, vendor reports) plus selected engineering blogs where requested.
- Some sources are paywalled or not fully reproducible via public metadata; these are flagged in the reading list. [R48]
- All relative timing language was normalized to explicit dates where available.
