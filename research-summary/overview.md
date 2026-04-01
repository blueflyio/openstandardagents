# Agentic AI Ecosystem Research Overview (Late 2025 to Early 2026)

Prepared: 2026-04-01

## Executive summary

The agent ecosystem in 2025-2026 is converging toward a multi-layer architecture:

1. **Agent-to-tool protocols** (for tool/data access), led by MCP. [T06][T07]
2. **Agent-to-agent protocols** (for delegation and coordination), led by A2A, with ACP converging into A2A governance. [T10][T11][T12][T19][T20]
3. **Agent-to-UI protocols** (for frontend event streams), led by AG-UI. [T14][T15]
4. **Contract/packaging layers** (portable agent manifests and deployment translation), represented by OSSA/Open Standard Agents. [T03][T04][T05]
5. **Discovery/federation layers** (cross-domain agent lookup and trust), represented by DUADP. [T01][T02]

The core trend is clear: organizations are moving from ad hoc integrations to protocolized systems, but security and governance maturity still lags deployment velocity. [T26][T28][T31]

---

## What DUADP and Open Standard Agents are

### DUADP (`duadp.org`, `@bluefly/duadp`)

DUADP describes itself as a **decentralized AI discovery protocol** ("DNS for AI agents"), with federated discovery, WebFinger/DNS hooks, and trust-oriented identity metadata. [T01][T02]

In practical terms, DUADP is trying to be the **discovery/index layer**:
- publish/list/search agents, skills, tools
- federate across peer registries
- attach identity/provenance/trust metadata
- expose both REST and MCP-facing interfaces [T01][T02]

Package status (as of 2026-04-01):
- npm package: `@bluefly/duadp`
- version: `0.1.4`
- license: Apache-2.0
- last-week downloads: 76 (2026-03-25 to 2026-03-31). [T02][T61]

### Open Standard Agents (`openstandardagents.org`, `@bluefly/openstandardagents`)

Open Standard Agents (OSSA) positions itself as a **portable manifest and deployment contract** for agents ("define once, export everywhere"). [T03][T04][T05]

In practical terms, OSSA is trying to be the **contract layer** between protocols and runtimes:
- YAML manifest for identity/capabilities/policies
- validation and migration tooling
- export adapters (Docker, Kubernetes, LangChain, CrewAI, MCP packaging, etc.)
- integration points for MCP/A2A and DUADP-style discovery [T03][T04][T05]

Package status (as of 2026-04-01):
- npm package: `@bluefly/openstandardagents`
- version: `0.5.1`
- license: Apache-2.0
- last-week downloads: 199 (2026-03-25 to 2026-03-31). [T04][T61]

---

## Big ecosystem signals

- **MCP** established strong early standardization momentum for model-to-tool interfaces. [T06][T07]
- **A2A** accelerated enterprise positioning and claims broad ecosystem participation, with a formalized evolving spec line now published under Linux Foundation stewardship. [T11][T12][T13]
- **ACP** has publicly announced convergence into A2A governance, reducing protocol fragmentation at the A2A/ACP layer. [T19][T20]
- **Agent UI standardization** is maturing in parallel (AG-UI event model and transport-agnostic architecture). [T14][T15]
- **Security debt remains high** relative to adoption speed (incident rates, identity maturity gaps, incomplete approvals). [T31]

---

## Governance and risk synthesis

Three independent streams align on the same warning:

1. **Academic/measurement**: transparency and safety reporting are weak relative to agent capability acceleration. [T25][T26][T27]
2. **Enterprise/management**: agents are strategically important, but hallucination and prompt-injection risk still blocks full autonomy. [T28][T29]
3. **Security operators**: implementation reality shows identity, authorization, and observability gaps at scale. [T31]

Complementary policy pressure is now visible:
- NIST/NCCoE is explicitly soliciting input on AI/software-agent identity and authorization controls (identification, non-repudiation, prompt-injection mitigations). [T30]
- Legal-policy analysis from Harvard-affiliated writing frames protocol governance as a structural internet-level issue (platform control vs interoperable protocol governance). [T33]

---

## Opportunities and near-term implications

### Opportunities
- **Interoperability moat**: teams that normalize on open protocol + contract layers can reduce custom integration burden.
- **Governance-by-design**: manifest-level policy and identity metadata can be attached before runtime.
- **Composable stack strategy**: MCP + A2A + AG-UI + contract/discovery layers can be combined rather than treated as mutually exclusive.

### Immediate constraints
- **Security posture still uneven** (identity granularity, authz design, incident handling).
- **Protocol maturity asymmetry** (MCP and A2A trajectories are stronger than many newer protocol proposals).
- **Evidence quality variance** across blog/marketing vs peer-reviewed/official specs.

---

## Deliverables in this folder

- `academia.md`: university and research findings
- `protocols.md`: protocol-by-protocol comparison
- `frameworks.md`: open-source framework/repo analysis
- `security.md`: threat and governance findings
- `blogs.md`: production engineering and industry commentary synthesis
- `reading-list.md`: full citation key map and links

