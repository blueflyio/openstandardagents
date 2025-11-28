# OSSA Development Rules

## Core Principles
1. **OpenAPI-First** - All APIs must be defined in OpenAPI 3.1 specs
2. **TDD-Centric** - Write tests first, then implement, then refactor
3. **Schema-Driven** - OSSA schema is the source of truth
4. **No Vendor Lock-in** - OSSA is a standard, not a framework

## File Organization
- `spec/` - OSSA schema definitions
- `src/` - Source code (TypeScript)
- `tests/` - Test files (unit, integration, e2e)
- `examples/` - Example OSSA manifests
- `openapi/` - OpenAPI specifications
- `docs/` - Documentation

## Code Quality
- **TypeScript** - Strict mode enabled
- **ESLint** - Must pass linting
- **Prettier** - Code formatting
- **Jest** - Test framework
- **95%+ test coverage** required

## OSSA Manifest Validation
- All `.ossa.yaml` and `agent.yml` files must validate
- Run `ossa validate` before committing
- Examples in `examples/` must all validate

## Schema Workflow
1. Update schema JSON in `spec/v0.2.6/`
2. Run `npm run gen:types` to generate TypeScript types
3. Run `npm run gen:zod` to generate Zod validators
4. Run `npm run validate:schema` to validate schema
5. Update examples and tests

## OpenAPI Workflow
1. Define/update OpenAPI spec in `openapi/`
2. Generate types from OpenAPI
3. Implement controller to match spec
4. Run contract tests

## Testing Requirements
- **Unit Tests** - Service logic, utilities
- **Integration Tests** - CLI commands, workflows
- **E2E Tests** - Full validation workflows
- **Schema Validation** - All examples must validate

## Git Workflow
- **Feature branches** - Branch off `development`
- **No direct commits** to `main` or `development`
- **Merge requests** required
- **CI must pass** before merge

## Release Process
- Releases require:
  - Milestone 100% complete and closed
  - `ENABLE_RELEASE=true` CI variable set
- Version sync across:
  - `package.json`
  - Schema files
  - Documentation

## Security
- No hardcoded secrets
- Use environment variables
- Validate all inputs
- Follow OWASP guidelines

## Documentation
- All features must be documented
- OpenAPI specs must be complete
- Examples must be up-to-date
- Website docs must be synced

## Prohibited
- ❌ Direct commits to `main` or `development`
- ❌ Skipping tests
- ❌ Breaking schema without migration
- ❌ Hardcoded secrets
- ❌ Bypassing hooks (`LEFTHOOK=0`)
- ❌ Creating `.md` files (use GitLab Wiki)
- ❌ Creating `.sh` files (use TypeScript/Node scripts)

## Required Before Config Work
- **ALWAYS** run `ddev drush cst` before working with Drupal config
- This is CRITICAL for config integrity

