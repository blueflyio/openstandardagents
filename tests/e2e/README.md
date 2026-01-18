# E2E and Smoke Tests

End-to-end tests and smoke tests for OSSA package validation.

## Smoke Tests

Fast tests validating critical package functionality before releases.

### Available Tests

1. **CLI Smoke Test** (`cli.smoke.spec.ts`)
   - Validates CLI binary and commands
   - Run: `npm run test:smoke:cli`

2. **NPM Pack Smoke Test** (`npm-pack.smoke.spec.ts`)
   - Validates package build and distribution
   - Run: `npm run test:smoke:npm-pack`

3. **Schema Coverage Smoke Test** (`schema-coverage.smoke.spec.ts`)
   - Validates schema loading and validation
   - Run: `npm run test:smoke:schema`

### Running Tests

```bash
npm run test:smoke              # All smoke tests
npm run test:smoke:cli          # CLI only
npm run test:smoke:npm-pack     # Package only
npm run test:smoke:schema       # Schema only
npm run test:e2e                # All E2E tests
```

## When to Run

- Before releases
- After build/schema/CLI changes
- In CI/CD pipelines
- Before pushing to release branches

## Architecture

Tests follow OSSA principles:
- OpenAPI-First: Validate against published schemas
- DRY: Reuse test utilities
- SOLID: Single responsibility per file
- Type-Safe: Full TypeScript + Zod validation
