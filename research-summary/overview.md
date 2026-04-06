# Agentic AI Landscape (2025-2026): Executive Overview

Date of synthesis: April 6, 2026.

## Direct answer: what are DUADP and OpenStandardAgents?

### DUADP (`duadp.org`, `@bluefly/duadp`)

DUADP (Decentralized Universal AI Discovery Protocol) is positioned as a **discovery/federation layer** for agents, skills, and tools. In plain terms: it is trying to be “DNS for agents,” so one node can publish an agent and other nodes can discover it through standardized endpoints, DNS/WebFinger patterns, federation, and trust metadata.[T01][T02][T03]

The npm package `@bluefly/duadp` is a TypeScript SDK/server toolkit for running or consuming DUADP nodes. Current npm metadata at research time:

- Version: **0.1.4**
- Weekly downloads: **65**
- License: **Apache-2.0**
- Published: **March 9, 2026**[T03]

### OpenStandardAgents / OSSA (`openstandardagents.org`, `@bluefly/openstandardagents`)

OSSA (Open Standard for Software Agents) is positioned as a **contract/specification and deployment layer** for agent definitions, centered on a YAML manifest plus validation/export tooling.[T04][T05][T06]

In plain terms: OSSA’s pitch is “define an agent once, export to many runtimes/frameworks.” It is intentionally framed as neither a tool protocol (like MCP) nor an agent-to-agent transport protocol (like A2A), but as the “middle contract layer.”[T04][T05][T06]

The npm package `@bluefly/openstandardagents` is the CLI/SDK implementation. Current npm metadata at research time:

- Version: **0.5.1**
- Weekly downloads: **269**
- License: **Apache-2.0**
- Published: **March 28, 2026**[T06]

## How DUADP + OSSA fit the broader protocol stack

A practical mental model from the sources:

1. **MCP**: agent-to-tool/data connectivity.[T08][T10]  
2. **A2A**: agent-to-agent task exchange/interoperability.[T11][T13][T14]  
3. **AG-UI**: agent-to-user-interface event protocol.[T15][T16]  
4. **OSSA**: agent contract/manifest definition and export layer.[T04][T05][T06]  
5. **DUADP**: decentralized discovery/federation layer.[T01][T02][T03]

This is coherent with how most 2025-2026 ecosystem players are converging: communication and tool protocols are being standardized, while contract/governance and discovery are still more fragmented.[T24][T26][T27][T29]

## High-confidence ecosystem themes

1. **Standardization is accelerating quickly**  
   MCP, A2A, AG-UI, and other protocol work moved from draft-stage to broad ecosystem activity during 2025-2026.[T08][T09][T11][T12][T13][T15]

2. **Adoption is outrunning governance and security controls**  
   Survey and policy sources repeatedly show deployment ahead of identity, authorization, and incident-readiness maturity.[T29][T48]

3. **Security risk is structural, not edge-case**  
   Prompt injection and tool misuse are now empirically documented across agentic settings (single-agent and multi-agent).[T51][T52][T53][T54][T55][T56][T57]

4. **Organizations are shifting from “chat assistants” to workflow agents**  
   Industry and enterprise guidance increasingly centers on autonomous workflow execution, interoperability, and agent lifecycle management.[T12][T40][T41][T50]

## Critical caveats and limitations

- **Some ecosystem claims are self-reported** (especially project websites/blogs). Adoption and security claims should be validated against neutral telemetry where possible.  
- **HBR and some analyst content are partially paywalled**; this synthesis uses accessible summaries/snippets and should be treated as directional where full text is unavailable.[T50][T51]  
- **“Parlay” framework reference**: no authoritative primary repository/docs were confidently identified in this run; included as a gap for follow-up.

## Bottom line

If you are evaluating this space in 2026, treat DUADP + OSSA as part of a broader move toward:

- open connectivity standards (MCP),
- open inter-agent standards (A2A),
- and still-evolving identity/discovery/governance standards.

They are best understood as **infrastructure-layer projects** attempting to fill gaps that mainstream agent frameworks still leave partially unstandardized.
