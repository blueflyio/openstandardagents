# AGENTS.md — openstandardagents
**VERSION**: 1.0 | **EFFECTIVE**: 2026-03-21
**Source of truth**: GitLab `https://gitlab.com/blueflyio/ossa/openstandardagents`
**Branch**: `release/v0.5.x` (active), never `main` locally.

---

## What This Repo Is

OSSA (`@bluefly/openstandardagents`) is the **manifest spec, CLI, MCP server, and TypeScript SDK** for the Open Standard for Software Agents. It is:

- The **authoritative source** for `ossa/v0.5.x` schema and all JSON schema extensions
- The **CLI** (`ossa`) for validate, scaffold, export, diff, migrate, workspace
- The **MCP server** (`ossa-mcp`) exposing 10 tools, 5 resources, 4 prompts
- The **TypeScript SDK** (`src/sdks/typescript/`) and Python SDK (`src/sdks/python/`)

It is **NOT** a UI, NOT a Drupal module, NOT a Cedar policy store, NOT a DUADP discovery node.

---

## Ownership Boundaries (from OWNERSHIP.md — do not cross)

| Concern | Owner | Never Here |
|---------|-------|-----------|
| Agent manifest spec (YAML schema) | **this repo** | ContractPlane, Drupal modules |
| Cedar policy bodies | `cedar-policies` | this repo |
| Policy evaluation (PDP) | `compliance-engine` | this repo |
| DUADP discovery logic | `duadp` | this repo |
| UI components | `studio-ui` | this repo |
| OpenAPI shared schemas | `api-schema-registry` | this repo |
| MCP protocol | `agent-protocol` | this repo |

---

## Control Primitives

Full health check (run before merge):
```bash
npm run ci:validate
```

Fast check (typecheck + unit + schema):
```bash
npm run ci:validate:fast
```

Individual validators (run_order):
```bash
npm run validate:schema    # JSON Schema compiles clean
npm run typecheck          # tsc --noEmit
npm run test:unit          # Jest unit tests
npm run validate:deps      # depcheck compliance
npm run validate:examples  # all examples validate against schema
npm run validate:openapi   # Spectral lint on openapi/
npm run validate:versions  # version consistency across files
```

MCP server:
```bash
npm run mcp                # node dist/mcp-server/index.js
npm run test:mcp           # vitest MCP integration tests
```

---

## Source Structure (`src/`)

```
src/
  adapters/       — 20+ platform export adapters (extend BaseAdapter)
  api/            — Express REST routes (thin, delegate to services)
  cli/            — Commander commands (thin wrappers only, no business logic)
  config/         — Config loading and validation
  converters/     — Manifest format converters
  deploy/         — Deployment orchestration
  errors/         — Typed error classes
  interfaces/     — TypeScript interfaces and DI tokens
  mcp-server/     — MCP server (tools, resources, prompts)
  mesh/           — Agent mesh / GKG discovery client
  runtime/        — Runtime adapters (OpenAIAdapter with ToolLoopAgent)
  services/       — All business logic lives here
  types/          — Zod schemas + generated TypeScript types
  validation/     — Manifest validation engine
  version-management/ — Version detection, migration, audit
  di-container.ts — Inversify DI composition root (all bindings here)
  index.ts        — Public API barrel export
  sdk.ts          — SDK entry point
```

---

## Mandatory Patterns

### DI-first (Inversify)
All services MUST be registered in `di-container.ts`. Never `new Service()` outside of tests. Inject via `@inject(TYPES.ServiceName)`.

### Zod at every external boundary
All external inputs (CLI args, MCP tool params, manifest files, API bodies) MUST be validated with Zod schemas in `src/types/`. Never trust unvalidated input inside services.

### Thin CLI / Thin API
`src/cli/` and `src/api/` commands contain ZERO business logic. They parse input, call the appropriate service, and format output. If you find logic in CLI commands, move it to `src/services/`.

### BaseAdapter for all export targets
Every new export adapter MUST extend `BaseAdapter` from `src/adapters/base.adapter.ts` and implement `export()` and `validate()`. Register in `src/adapters/index.ts`. Never add platform-specific logic outside `src/adapters/<name>/`.

### Schema versioning
- Schema files live in `spec/` — do not duplicate in `src/`
- `src/version.ts` and `.version.json` are the single source of version truth
- `npm run version:sync` propagates version changes — never manually edit version strings in multiple places
- Run `npm run validate:versions` before any commit touching version numbers

---

## Prohibitions

- ❌ NO shell scripts (`.sh`, `.bash`) — use `src/dev-cli/` TypeScript commands or `buildkit`
- ❌ NO hardcoded paths — use `process.env.HOME`, `__dirname`, or path utilities
- ❌ NO UI components, React, Next.js, or frontend code — this is a CLI/SDK/MCP repo
- ❌ NO Cedar policy YAML bodies — reference by pack ID via `compliance-engine`
- ❌ NO DUADP discovery implementation — consume `@bluefly/duadp` client only
- ❌ NO symlinks — they break portability and npm packaging
- ❌ NO commits directly to `main` or `release/v*.x` — feature branches only
- ❌ NO `--no-verify` — fix the hook failure instead
- ❌ NO `node-fetch` — use native `fetch` (Node 18+)
- ❌ NO `dd-trace`, `newrelic`, `datadog-metrics` — use OpenTelemetry

---

## GKG Mandate (Global Knowledge Graph)

**Before creating any new function, class, or adding a dependency:**

Query `gkg.blueflyagents.com` to confirm it doesn't already exist across the platform.

```bash
# Via MCP in .mcp.json (gkg server is pre-configured)
# Tools: search_codebase_definitions, get_references, import_usage, repo_map
```

Failure to query GKG before modifying shared code violates workspace AGENTS.md.

---

## Branch + Worktree Policy

```
release/v0.5.x        ← local default, active dev
  └── feat/issue-NNN  ← feature branches from release/v0.5.x
  └── fix/issue-NNN   ← bugfix branches
main                  ← protected, only release/v*.x merges here
```

All work via git worktrees from `__BARE_REPOS/ossa/openstandardagents.git`.
Never work directly in bare repos.

---

## Dependency Standards (from workspace ai.json)

| Package | Required Version |
|---------|-----------------|
| `@modelcontextprotocol/sdk` | `^1.26.0` |
| `zod` | latest declared in package.json |
| `pino` | `^9.5.0` |
| `uuid` | `^11.1.0` |

Validate: `npm run validate:deps`

---

## Subagents (`.agents/`)

This repo ships 10 production subagents registered in `.agents/registry.yaml`:
`compliance-checker`, `docs-generator`, `integration-tester`, `performance-optimizer`,
`platform-exporter`, `release-manager`, `schema-validator`, `security-auditor`,
`test-suite-generator`, `version-migrator`.

These are **Tier 2 (Hands)** agents — discovered and orchestrated by **Tier 1 (Brain)** agents
in `platform-agents` via `discover.duadp.org`. Do not add orchestration logic here.

To add a subagent: `ossa agent init <name>` inside `.agents/` then register in `registry.yaml`.
