# OSSA Project Rules for GitLab Duo Chat

## Context
This is the reference implementation of OSSA (Open Standard for Software Agents). It defines a vendor-neutral manifest format for AI agents and provides a CLI/SDK with 30+ export adapters.

## Code Standards
- TypeScript strict mode. No `any` types without justification.
- All new services must use Inversify dependency injection (`@injectable()`).
- All inputs/outputs at service boundaries validated with Zod schemas.
- New export adapters must extend `BaseAdapter` from `src/adapters/base/adapter.interface.ts`.
- Register all adapters in `src/adapters/index.ts` and add to `src/data/platform-matrix.ts`.

## Architecture Rules
- CLI commands are thin wrappers that delegate to DI-bound services in `src/services/`.
- MCP server tools delegate to services, not inline logic.
- REST API routes at `src/api/routes/` use Zod validation middleware.
- Three manifest kinds: Agent, Skill, MCPServer (all apiVersion: ossa/v0.4).

## Prohibited
- No shell scripts (`.sh`, `.bash`). Lefthook blocks them.
- No direct commits to `main` or `release/*` branches.
- No hardcoded file paths. Use relative paths or DI-injected config.
- No `console.log` in library code. Use the injected logger service.

## Testing
- Vitest for all tests. Run with `npm test`.
- New adapters need at least one export test and one `getExample()` test.
- Type-check with `npx tsc --noEmit` before committing.

## OSSA Spec
- Current spec version: ossa/v0.4
- Schema at `spec/v0.4/agent.schema.json`
- Manifest structure: `apiVersion`, `kind`, `metadata`, `spec`, `extensions`
