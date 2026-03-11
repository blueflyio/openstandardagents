# src/ — TypeScript source code

## Task intake (required)

- If a request is ambiguous or truncated, ask one concise clarification question and continue once clarified.
- Minimum required details for any update request: (1) target file/path (or module/component), (2) exact change requested, (3) success criteria/expected result.

## Structure

- `adapters/` — 20+ platform export adapters (BaseAdapter pattern)
- `api/` — Express REST API routes (headless services)
- `cli/` — Commander CLI commands (thin wrappers around services)
- `services/` — Business logic (audit, validation, export orchestration)
- `mcp-server/` — MCP server exposing OSSA tools
- `types/` — Zod schemas and TypeScript type definitions
- `validation/` — Manifest validation engine
- `di-container.ts` — Inversify DI composition root
- `index.ts` — Public API barrel export

## Patterns

- **DI-first**: All services registered in `di-container.ts` with Inversify
- **Thin CLI**: `cli/` commands delegate to services — no business logic in commands
- **Zod boundaries**: All external inputs validated with Zod schemas in `types/`
- **BaseAdapter**: New adapters extend `BaseAdapter` and register in `adapters/index.ts`

## Adding a new adapter

1. Create `adapters/<name>/adapter.ts` extending `BaseAdapter`
2. Implement `export()` and `validate()` methods
3. Register in `adapters/index.ts` via `registry.register(new YourAdapter())`
4. Add tests in `__tests__/adapters/<name>.test.ts`
