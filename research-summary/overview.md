# Agentic AI Landscape (2026): Executive Overview

This report summarizes the 2025-2026 agentic AI ecosystem with emphasis on standards, production engineering, and security governance. It is anchored on DUADP and OSSA, then positioned against adjacent protocols (MCP, A2A, AG-UI, ANP, Agent Protocol, ATP) and widely used framework stacks. Citations are provided as tether IDs (for example, `[T01]`).

Date normalization note: all timeline references are written with absolute dates, treating **March 10, 2026** as the report "current date."

## 1) What DUADP and OSSA are, in one page

### DUADP (`duadp.org`)
DUADP (Decentralized Universal AI Discovery Protocol) is a discovery and federation layer for agents, tools, and skills. Conceptually, it behaves like a "DNS-like control plane" for agent identity, routing, registry lookups, and federation health. Its model combines DNS records, well-known manifests, trust tiers, and federated synchronization patterns (including gossip-style propagation) so organizations can discover and verify agents across domains. `[T01]`

### OSSA (`openstandardagents.org`)
OSSA (Open Standard for Software Agents) is a contract/manifest specification layer. It standardizes how an agent is packaged and declared: identity, role, model settings, tools, transport bindings, and policy metadata. OSSA is not a transport protocol itself; instead, it composes with protocols like MCP (tool connectivity) and A2A (agent-to-agent messaging). `[T02]`

## 2) NPM package snapshot (as of March 10, 2026 framing; registry snapshots collected April 2026)

| Package | What it represents | Latest observed version | Published date | Weekly downloads (observed) |
| --- | --- | --- | --- | --- |
| `@bluefly/duadp` | DUADP implementation/distribution package | `0.1.4` | March 9, 2026 | 165 |
| `@bluefly/openstandardagents` | OSSA implementation/tooling package | `0.5.1` | March 28, 2026 | 269 |
| `@openai/agents` | OpenAI JS/TS Agents SDK | `0.8.3` | April 6, 2026 | 468.9K |

These numbers indicate that DUADP/OSSA are early-stage but active, while the broader agent framework market already has high-volume SDK adoption. `[T03][T04][T05]`

## 3) Standards stack in practice

| Layer | Main job | Example standards |
| --- | --- | --- |
| Discovery/identity/governance | Locate and trust agents across org boundaries | DUADP, DID-oriented identity in ANP |
| Agent contract/packaging | Describe what an agent is and how it should run | OSSA |
| Agent-to-tool | Connect model runtime to tools/data | MCP, ATP |
| Agent-to-agent | Delegate work between agents | A2A, (ACP lineage/convergence discussions) |
| Agent-to-UI | Stream events/results to applications | AG-UI |

This layered view reduces "protocol wars": most standards are complementary, not mutually exclusive. `[T01][T02][T06][T07][T08][T09][T11]`

## 4) Core findings

1. **DUADP + OSSA is a credible paired architecture**: DUADP handles decentralized discovery/trust, OSSA handles portable contract definition. `[T01][T02]`
2. **Interoperability is consolidating around a small protocol core**: MCP for tools, A2A for inter-agent messaging, AG-UI for frontend streaming. `[T06][T07][T08]`
3. **Production adoption is ahead of governance maturity**: enterprise teams are shipping agents, but identity, approval workflows, and policy controls lag. `[T15][T16][T17]`
4. **Security posture remains the largest blocker**: prompt injection, excessive permissions, and hallucinated tool actions are still primary incident classes. `[T17][T20]`

## 5) 2025-2026 timeline anchors

| Date | Event |
| --- | --- |
| November 25, 2024 | Anthropic announces MCP publicly |
| April 9, 2025 | Google announces A2A protocol |
| July 2025 | A2A `v0.3` communication/security enhancements reported |
| 2025 report cycle | MIT AI Agent Index highlights transparency/accountability gaps |
| January 15, 2026 | GitLab Duo Agent Platform announced generally available |
| February 3, 2026 | Gravitee State of AI Agent Security 2026 published |
| February 5, 2026 | NIST NCCoE publishes software and AI agent adoption concept paper |
| March 9, 2026 | `@bluefly/duadp` version `0.1.4` published |
| March 28, 2026 | `@bluefly/openstandardagents` version `0.5.1` published |

`[T03][T04][T06][T07][T14][T16][T17][T27]`

## Tether citations used in this file

| ID | Source |
| --- | --- |
| T01 | DUADP homepage/spec overview — https://duadp.org/ |
| T02 | Open Standard Agents (OSSA) overview/spec — https://openstandardagents.org/ |
| T03 | npm package `@bluefly/duadp` — https://www.npmjs.com/package/@bluefly/duadp |
| T04 | npm package `@bluefly/openstandardagents` — https://www.npmjs.com/package/@bluefly/openstandardagents |
| T05 | npm package `@openai/agents` — https://www.npmjs.com/package/@openai/agents |
| T06 | Anthropic MCP announcement (November 25, 2024) — https://www.anthropic.com/news/model-context-protocol/ |
| T07 | Google A2A announcement (April 9, 2025) — https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/ |
| T08 | AG-UI introduction/docs — https://docs.ag-ui.com/introduction |
| T09 | Agent Network Protocol README — https://raw.githubusercontent.com/agent-network-protocol/AgentNetworkProtocol/main/README.md |
| T11 | Agent Tool Protocol site — https://agenttoolprotocol.com/ |
| T14 | MIT AI Agent Index 2025 — https://aiagentindex.mit.edu/2025 and /2025/further-details |
| T15 | MIT Sloan action guide (2026) — https://mitsloan.mit.edu/ideas-made-to-matter/action-items-ai-decision-makers-2026 |
| T16 | NIST NCCoE concept paper (February 5, 2026) — https://csrc.nist.gov/pubs/other/2026/02/05/accelerating-the-adoption-of-software-and-ai-agent/ipd |
| T17 | Gravitee State of AI Agent Security 2026 — https://www.gravitee.io/state-of-ai-agent-security |
| T20 | Dev.to prompt-injection security article — https://dev.to/the_seventeen/your-ai-agent-is-one-prompt-injection-away-from-losing-all-your-api-keys-36cc |
| T27 | GitLab Duo Agent Platform GA — https://about.gitlab.com/blog/gitlab-duo-agent-platform-is-generally-available |
