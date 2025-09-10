# Stop → Figure Out → Fix Plan

- What happened: <tests missing>
- Current state: <harness stubs>
- Impact: <unknown regressions>
- Remediation: <incremental test plan>
- Verification: <coverage, CI pass>

## Testing Strategy

- Unit: Fast, isolated, no I/O
- API: Contract-first with OpenAPI examples
- E2E: Playwright (optional), behind feature flags

## Commands

- Lint OpenAPI: `npx @redocly/openapi-cli lint __REBUILD/openapi.yml --fail-on-error | cat`
- Render HTML: `npx redoc-cli bundle __REBUILD/openapi.yml --output __REBUILD/openapi.html`
