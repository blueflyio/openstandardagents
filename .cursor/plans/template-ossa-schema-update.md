# OSSA Schema Update Plan

## Schema Version
**Current Version:** [Current]
**Target Version:** [Target]
**Breaking Changes:** [Yes/No]

## Changes Overview
- Change 1: Description
- Change 2: Description

## Migration Strategy
### Backward Compatibility
- [ ] Maintain backward compatibility: [Yes/No]
- [ ] Migration path: [Description]

### Breaking Changes
- [ ] Breaking change 1: [Description]
- [ ] Migration guide: [Location]

## Implementation Steps

### Phase 1: Schema Update
- [ ] Update `spec/v0.2.6/ossa-0.2.6.schema.json`
- [ ] Validate schema JSON: `npm run validate:schema`
- [ ] Update schema version in all references

### Phase 2: Type Generation
- [ ] Generate TypeScript types: `npm run gen:types`
- [ ] Generate Zod validators: `npm run gen:zod`
- [ ] Review generated types for correctness

### Phase 3: Service Updates
- [ ] Update validation service
- [ ] Update generation service
- [ ] Update migration service (if version change)

### Phase 4: Examples & Tests
- [ ] Update example manifests
- [ ] Update test fixtures
- [ ] Run validation on all examples: `npm run validate:examples`

### Phase 5: Documentation
- [ ] Update schema documentation
- [ ] Update migration guides
- [ ] Update website docs
- [ ] Update CHANGELOG.md

### Phase 6: Version Sync
- [ ] Sync versions: `npm run sync-versions` (if script exists)
- [ ] Update package.json version
- [ ] Update all schema references

## Files to Modify
- `spec/v0.2.6/ossa-0.2.6.schema.json`
- `src/services/validation.service.ts`
- `src/services/generation.service.ts`
- `src/services/migration.service.ts` (if version change)
- `examples/**/*.yml`
- `tests/**/*.ts`

## Validation Checklist
- [ ] Schema JSON is valid
- [ ] All examples validate against new schema
- [ ] All tests pass
- [ ] Migration service handles version changes
- [ ] CLI validation works with new schema

## Rollout Plan
1. Feature branch: `feat/schema-v[version]`
2. Update schema and generate types
3. Update all examples and tests
4. Merge to `development`
5. CI validation
6. Merge to `main`
7. Release (milestone + ENABLE_RELEASE)

