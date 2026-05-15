# Focus Appendix: DUADP, OSSA, and the npm Packages

Prepared: May 15, 2026. Tether citation IDs are defined in
`reading-list.md`.

## One-sentence definitions

- DUADP is a decentralized discovery protocol for publishing, finding,
  validating, and federating AI agents, skills, and tools across domains [T20].
- OSSA is a portable contract specification and toolchain for defining an AI
  agent once and exporting or validating that definition across protocols and
  platforms [T22][T23].
- `@bluefly/duadp` is the TypeScript package for DUADP clients, servers,
  validation, federation, identity, and protocol conformance [T21][T53].
- `@bluefly/openstandardagents` is the OSSA CLI/SDK package for schemas,
  validation, generation, migration, exporters, trust services, and an MCP
  server [T22][T52].

## How they fit together

| Layer | OSSA | DUADP |
| --- | --- | --- |
| Question answered | What is this agent, what may it do, and how is it governed? | Where can I find this agent/skill/tool, and how do I verify it? |
| Primary artifact | YAML/JSON manifest plus schema | GAID/DID-resolved registry resource |
| Protocol relation | References/exports to MCP, A2A, LangChain, CrewAI, Docker, Kubernetes, GitLab, npm, etc. | Finds and publishes OSSA-native resources; exposes REST and MCP discovery tools |
| Security focus | Trust boundaries, Cedar policies, signatures, SBOM/provenance, compliance metadata | DID identity, signatures, trust tiers, federation witnesses, revocation, governance |
| Analogy | OpenAPI-style contract for agents | DNS/WebFinger-style discovery for agents |

## DUADP in detail

DUADP's homepage frames the missing layer directly: "MCP connects tools. A2A
connects agents. DUADP helps them find each other" [T20]. It uses a federated
mesh rather than a central registry. Any domain can host a DUADP node, advertise
it with DNS TXT records, expose a `.well-known` manifest, and join federation
[T20][T21].

Important primitives:

- GAID: a stable lookup handle such as
  `agent://discover.duadp.org/agents/code-reviewer` [T20].
- WebFinger: maps GAIDs to real endpoints [T20].
- DID: supplies cryptographic identity, especially `did:web` in the docs [T20].
- Signatures and provenance: prove what was published and by whom [T20].
- Trust tiers: feed policy decisions, e.g. community to official [T20].
- Federation gossip: nodes exchange registrations and propagate resources
  [T21].
- MCP tools: DUADP exposes discovery/search/publish/validate/federation/governance
  as 17 MCP tools [T20].

Representative REST surface:

- `GET /.well-known/duadp`
- `GET /api/v1/agents`
- `GET /api/v1/skills`
- `GET /api/v1/tools`
- `GET /api/v1/search`
- `POST /api/v1/publish`
- `POST /api/v1/validate`
- federation endpoints
- identity and governance endpoints
- health and metrics endpoints [T20][T21]

## OSSA in detail

OSSA's specification page says the problem is that MCP connects tools and A2A
connects agents, but neither defines "what an agent is, what it may do, or who
is accountable" [T23]. OSSA proposes a vendor-neutral manifest that defines
identity, capabilities, trust boundaries, governance, and platform extensions
[T23].

Important primitives:

- Agent manifest in YAML or JSON.
- JSON Schema validation.
- Metadata and spec fields for agent role, model, tools, and deployment.
- Platform extensions for agent frameworks and runtimes.
- Human-in-the-loop, cost controls, lifecycle/state, compliance, and trust.
- GAID/DID identity and Cedar policy integration for authorization.
- MCP server with 10 OSSA tools in AI IDEs [T22][T23][T24].

Representative commands and package capabilities from the repo/package:

- `ossa`
- `ossa-dev`
- `ossa-version`
- `ossa-validate-all`
- `ossa-mcp`
- schema exports such as `./schema`, `./agent-card-schema`, and
  `./openapi-extensions-schema`
- SDK exports for validation, generation, migration, version management, trust,
  workspace validation, agent cards, and MCP server integration [T52]

## npm metadata

| Package | Version | License | Description summary | Source |
| --- | ---: | --- | --- | --- |
| `@bluefly/openstandardagents` | 0.5.1 | Apache-2.0 | OSSA bridge between MCP/A2A and deployment platforms; define once in YAML and export to many targets | npm metadata, repo package.json [T52] |
| `@bluefly/duadp` | 0.1.4 | Apache-2.0 | TypeScript SDK for Decentralized Universal AI Discovery Protocol | npm metadata [T53] |

Note: the OSSA website showed v0.5.0 during this research, while npm metadata
showed `@bluefly/openstandardagents` v0.5.1 [T22][T52]. This report treats npm
as authoritative for current package version and the site as authoritative for
conceptual positioning.

## What these projects are not

- DUADP is not a replacement for MCP tool execution. It can expose MCP tools and
  discover MCP-compatible tools, but its core role is discovery/federation
  [T20][T21].
- OSSA is not a transport protocol like A2A or MCP. It is a portable manifest
  contract that can reference or export to those transports [T22][T23].
- Neither package, by itself, guarantees safe autonomous execution. They provide
  schemas, identity/discovery metadata, policy hooks, and tooling that still
  require runtime enforcement, monitoring, secrets management, and organizational
  governance [T14][T19][T24].

## Why they matter in the 2026 agent landscape

The broader ecosystem is splitting into specialized layers. MCP and A2A are
gaining traction as transport/protocol standards, but they do not solve every
question about portable contracts, registry discovery, provenance, compliance,
or trust. OSSA and DUADP are attempts to fill those gaps:

- OSSA: make agent definitions portable and auditable.
- DUADP: make those definitions discoverable and verifiable.

That makes them especially relevant for organizations that need multi-platform
deployment, regulated governance metadata, agent catalogs, agent marketplaces,
or federated discovery beyond one vendor's agent runtime.
