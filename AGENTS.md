<!-- Generated from OSSA manifest - DO NOT EDIT MANUALLY -->

<!-- To update, modify the OSSA manifest and regenerate -->



# Dev environment tips

- Review the OSSA manifest for tool configurations
- Ensure all required dependencies are installed
- Configure environment variables as needed

# Testing instructions

- Run all tests before committing: `npm test`
- Ensure code coverage meets project standards
- Validate against OSSA schema: `ossa validate manifest.yaml`

# PR instructions

- Follow conventional commit format
- Include tests for new features
- Update documentation as needed
- Ensure CI passes before requesting review

## Cursor Cloud specific instructions

### Project overview

OSSA (Open Standard for Software Agents) is a CLI toolkit and SDK for defining, validating, exporting, and deploying AI agents. It is a single npm package (`@bluefly/openstandardagents`) at the root with sub-packages in `sdk/` and `src/sdks/`. No external services (databases, Redis, LLM APIs) are needed for the core test suite; all tests use mocked dependencies.

### Running the project

Standard commands are documented in the `scripts` section of `package.json`:

- **Build**: `npm run build` (runs `tsc` then copies spec assets to `dist/`)
- **Dev watch**: `npm run dev` (runs `tsc --watch`)
- **Unit tests**: `npm run test:unit` (Jest, ~1300 tests)
- **Integration tests**: `npm run test:integration`
- **Lint**: `npm run lint` (ESLint; existing codebase has known lint warnings/errors)
- **Typecheck**: `npm run typecheck`
- **CLI**: `node bin/ossa <command>` (after build)

### Non-obvious caveats

- **ESLint exits with code 1** due to pre-existing lint errors in the codebase (mostly unused-vars warnings and import style issues). This does not indicate a setup problem.
- **Integration tests**: Some integration tests fail due to ESM compatibility issues with `@modelcontextprotocol/sdk` in Jest, and a test regex that does not account for `v0.5`. These are pre-existing codebase issues, not environment problems.
- **Cedar WASM**: The `ossa export` command may be slow (~15-30s) on first run due to WebAssembly compilation of the Cedar policy engine. Node deprecation warnings about `punycode` and `ExperimentalWarning` about WASM imports are expected and harmless.
- **Lefthook**: Git hooks are installed automatically by `npm install` via the `prepare` script. The `pre-commit` hook runs `tsc --noEmit` which requires a successful build environment.
- **Node version**: The `.nvmrc` specifies `v20`, and `volta` pins `22.19.0`. Any Node >= 20 works. The environment ships with Node 22, which is compatible.
- **No shell scripts allowed**: The repo enforces TypeScript-only tooling via a lefthook pre-commit hook that blocks `.sh` files.