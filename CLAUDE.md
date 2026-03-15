# AI Assistant Instructions for OSSA

> **OSSA** - Open Standard for Software Agents. YAML manifest format for AI agents.
> Define once, deploy to 22+ platforms (Docker, Kubernetes, LangChain, CrewAI, Claude, OpenAI, etc.)

## Project Overview

- **Package**: `@bluefly/openstandardagents` (v0.4.8, npm public)
- **License**: Apache-2.0
- **Language**: TypeScript (ESM, Node 20+)
- **CLI**: `ossa` (validate, export, wizard, lint, diff, migrate, skills, agents-md)
- **Schema**: JSON Schema at `spec/v0.4/agent.schema.json`
- **Source**: https://gitlab.com/blueflyio/ossa/openstandardagents
- **Spec**: https://openstandardagents.org

## Build & Test

```bash
npm install
npm run build          # tsc + copy assets
npm test               # jest (unit + integration)
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run validate:schema # ajv-cli validates JSON schemas
```

## Key Directories

- `src/cli/` - CLI commands (Commander.js)
- `src/services/` - Core services (validation, export, migration, skills)
- `src/types/` - TypeScript type definitions
- `spec/v0.4/` - JSON Schema files (agent, agent-card, mcp, skill, validator)
- `examples/` - Sample OSSA manifests
- `tests/unit/` - Unit tests (Jest)
- `tests/integration/` - Integration tests
- `bin/` - CLI entry points (`ossa`, `ossa-dev`)
- `templates/` - Export templates for platforms

## Version Management

- `.version.json` - Single source of truth for spec version
- `src/version.ts` - Reads from `.version.json`
- `src/utils/version.ts` - Reads from `package.json` (must stay in sync)
- Both must agree. If bumping version, update both `package.json` and `.version.json`.

## Architecture Notes

- Uses Inversify for DI (`src/di-container.ts`)
- Platform exporters in `src/services/export/<platform>/`
- MCP server at `src/mcp-server/`
- Schema extensions at `spec/v0.4/extensions/`

## Related Files

- [`AGENTS.md`](./AGENTS.md) - Agent context for AI tools
- [`llms.txt`](./llms.txt) - LLM-optimized project summary
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Contribution guide
