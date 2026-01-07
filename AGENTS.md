# OSSA (Open Standard for Scalable AI Agents)

## Project Overview

OSSA is a vendor-neutral, open specification for defining, deploying, and orchestrating AI agents across platforms. Think OpenAPI for REST APIs, but for AI agents.

This repository contains:
- OSSA specification schemas (JSON Schema, OpenAPI)
- CLI tooling (`ossa` commands)
- TypeScript and Python SDKs
- Reference examples (100+ examples)
- Migration tools and guides

## Setup Commands

- Install dependencies: `npm install` or `pnpm install`
- Build project: `npm run build`
- Run tests: `npm test`
- Validate all manifests: `npm run validate:all`
- Generate types: `npm run generate:all`

## Code Style

- **TypeScript strict mode** - All code must pass strict type checking
- **Single quotes** - Use single quotes for strings
- **No semicolons** - Semicolons are optional, prefer without
- **Functional patterns** - Prefer functional programming where possible
- **SOLID principles** - Single Responsibility, Dependency Injection
- **DRY** - Don't Repeat Yourself, use shared utilities
- **Zod validation** - All inputs/outputs validated with Zod schemas
- **OpenAPI-first** - All APIs defined in OpenAPI 3.1 specs

## File Organization

- `src/` - Primary source directory (TypeScript)
- `spec/` - OSSA specification schemas (JSON Schema, YAML)
- `examples/` - Reference examples (OSSA manifests)
- `openapi/` - OpenAPI specifications
- `tests/` - Test suite (unit, integration, e2e)
- `docs/` - Documentation

**CRITICAL RULES:**
- ❌ NO `scripts/` folders (use `src/` instead)
- ❌ NO shell scripts (`.sh` files) - use TypeScript
- ❌ NO `.md` files in root (use GitLab Wiki)
- ✅ All code in `src/`
- ✅ All configs follow SOLID/DRY/Zod/OpenAPI/CRUD

## Testing Instructions

- Run all tests: `npm test`
- Run specific test suite: `npm run test:unit` or `npm run test:integration`
- Run E2E tests: `npm run test:e2e`
- Check coverage: Tests should maintain 95%+ coverage
- Validate manifests: `npm run validate:all` before committing
- Fix all lint errors: `npm run lint`

**Test Requirements:**
- All new features must include tests
- Tests must pass before committing
- Coverage must not decrease
- Integration tests for CLI commands
- E2E tests for full workflows

## Build Process

- TypeScript compilation: `npm run build`
- Generate types from schemas: `npm run generate:types`
- Generate Zod validators: `npm run generate:zod`
- Validate schemas: `npm run validate:all`

**Build Output:**
- Compiled code goes to `dist/`
- Types generated to `dist/` with `.d.ts` files
- Schemas remain in `spec/` directory

## Version Management

**CRITICAL**: Never manually update version numbers!

- Single source of truth: `.version.json`
- Use `npm run version:sync` to sync versions
- Use `{{VERSION}}` placeholders in files
- CI replaces `{{VERSION}}` during build
- Version validator enforces this: `npm run prevent-hardcoded-versions`

## Migration System

- Check migrations needed: `npm run migrate:check`
- Dry run: `npm run migrate:dry`
- Apply migrations: `npm run migrate`
- Auto-runs on `npm install` via `postinstall` hook

## Git Workflow

- Feature branches branch off `development`
- NO direct commits to `main` or `development`
- Create Merge Request (MR) for all changes
- Use `git worktree` for feature branches
- Follow Conventional Commits format

**Branch Policy:**
- `main` - Production (protected, no direct commits)
- `development` - Integration branch (MRs only)
- `feature/*` - Feature branches (your work)
- `release/*` - Release branches

## PR Instructions

- **Title format**: `type(scope): description`
  - Examples: `feat(cli): add validate command`, `fix(schema): correct trigger validation`
- **Description**: Include context, changes, and testing notes
- **Checklist**:
  - [ ] All tests pass
  - [ ] Linting passes
  - [ ] Documentation updated
  - [ ] Examples updated (if schema changed)
  - [ ] Migration guide added (if breaking change)
- **CI must pass** before merge
- **No hardcoded versions** - use `{{VERSION}}` placeholders

## Architecture Principles

- **SOLID**: Single Responsibility, Dependency Injection
- **DRY**: Shared utilities, no duplication
- **Zod**: Runtime validation throughout
- **OpenAPI**: Types align with OpenAPI spec
- **CRUD**: Full Create/Read/Update/Delete operations

## Common Tasks

### Adding a New CLI Command

1. Create command in `src/cli/commands/`
2. Register in `src/cli/index.ts`
3. Add OpenAPI spec in `openapi/cli-commands.openapi.yaml`
4. Add tests in `tests/cli/`
5. Update documentation

### Adding a New SDK Feature

1. Add to shared utilities in `src/sdks/shared/`
2. Implement in `src/sdks/typescript/` or `src/sdks/python/`
3. Export from `src/sdks/index.ts`
4. Add validation with Zod
5. Add tests

### Updating OSSA Schema

1. Update schema JSON in `spec/v0.3.3/`
2. Run `npm run generate:types`
3. Run `npm run generate:zod`
4. Run `npm run validate:schema`
5. Update examples
6. Create migration guide if breaking change

## Security Considerations

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate all inputs with Zod schemas
- Follow security guidelines in `SECURITY.md`
- Report vulnerabilities via security@openstandardagents.org

## Debugging

- Use TypeScript source maps for debugging
- Check `dist/` for compiled output
- Run `npm run typecheck` to find type errors
- Use `npm run validate:all` to check manifests
- Check CI logs for detailed error messages

## Resources

- **Specification**: https://openstandardagents.org
- **Documentation**: `docs/` directory
- **Examples**: `examples/` directory
- **OpenAPI Specs**: `openapi/` directory
- **GitLab Issues**: https://gitlab.com/blueflyio/ossa/openstandardagents/-/issues

## Important Notes

- This is an **open source project** for the **community**
- Code should be clean, well-documented, and maintainable
- Follow existing patterns and conventions
- Ask questions if unsure - we're here to help!
- Remember: OSSA = Standard, not implementation
