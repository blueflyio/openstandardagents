# OSSA Working Directory Strategy

## Directory Purpose & Contents

### 1. __DELETE_LATER/ (47 items)
**Purpose**: Staging area for files to be removed
**Action**: Review and confirm deletion
**Contents**: Legacy files that are no longer needed

### 2. __REBUILD/ (Clean v0.1.9-alpha.1)
**Purpose**: Primary development directory for OSSA v0.1.9-alpha.1
**Status**: Active development following API-first/TDD approach
**Key Files**:
- `01-BRANCHING_STRATEGY.md` - Git workflow rules
- `02-TECHNICAL_PLAN.md` - Implementation blueprint
- `03-SCHEMA-EXAMPLES.md` - Schema definitions
- `openapi.yml` - API specification (needs update to v0.1.9)
- `docs/` - Organized documentation structure
- `ROADMAP.md` - Detailed implementation plan

### 3. Old_use_for_migration/ (Legacy v0.1.8)
**Purpose**: Reference for migration, contains working v0.1.8 code
**Action**: Extract reusable components for __REBUILD
**Valuable Assets**:
- Test suites that can be adapted
- Working CLI implementation
- Docker/K8s configurations
- GraphQL schemas
- Existing documentation

## Migration Strategy

### Phase 1: Preparation (Current)
1.  Identify three working directories
2. ⬜ Audit __DELETE_LATER for any valuable code
3. ⬜ Extract reusable tests from Old_use_for_migration
4. ⬜ Update __REBUILD OpenAPI to v0.1.9-alpha.1

### Phase 2: API-First Development (Week 1)
Following __REBUILD/ROADMAP.md strictly:
1. ⬜ Complete OpenAPI 3.1 specification
2. ⬜ Define OSSA manifest schemas
3. ⬜ Create Agent Capability Description Language (ACDL)
4. ⬜ Validate all specifications

### Phase 3: Test-Driven Development (Week 2)
1. ⬜ Write failing tests for all API endpoints
2. ⬜ Create contract tests from OpenAPI
3. ⬜ Set up CI/CD pipeline
4. ⬜ Achieve 0% passing (all tests must fail initially)

### Phase 4: Implementation (Week 3-4)
1. ⬜ Implement minimal code to pass tests
2. ⬜ Build core orchestration engine
3. ⬜ Create agent registry
4. ⬜ Add MCP protocol support

## File Movement Plan

### From Old_use_for_migration → __REBUILD
```bash
# Useful components to migrate
- src/cli/src/commands/* → Adapt for new API
- tests/* → Rewrite for v0.1.9 specs
- infrastructure/docker/* → Update for new architecture
- infrastructure/kubernetes/* → Adapt for Helm charts
```

### From __DELETE_LATER → Confirm Deletion
```bash
# Review each file before deletion
# Check for any unique implementations
# Document any patterns worth preserving
```

## Git Workflow

### Required for ALL changes:
```bash
# 1. Create feature branch
git checkout -b __REBUILD/{task}-v0.1.9-alpha

# 2. Work in 30-minute intervals
git add -A
git commit -m "WIP: [task description]"
git push origin __REBUILD/{task}-v0.1.9-alpha

# 3. When complete
git checkout development
git merge --no-ff __REBUILD/{task}-v0.1.9-alpha
```

## Success Criteria

### Week 1 Completion
- [ ] OpenAPI spec validates for v0.1.9
- [ ] ACDL schema complete
- [ ] All specifications documented
- [ ] No implementation code written

### Week 2 Completion
- [ ] 100% test coverage for specs
- [ ] All tests failing (no implementation)
- [ ] CI/CD pipeline running
- [ ] Documentation generated from specs

### Week 3-4 Completion
- [ ] Tests passing at 80%+
- [ ] Core modules functional
- [ ] API endpoints responding
- [ ] v0.1.9-alpha.1 ready for release

## Next Immediate Actions

1. **NOW**: Update __REBUILD/openapi.yml version to 0.1.9
2. **TODAY**: Complete ACDL specification in __REBUILD
3. **TODAY**: Write first failing test suite
4. **TOMORROW**: Review Old_use_for_migration for reusable tests
5. **THIS WEEK**: Complete all API specifications

## Protection Against Corruption

### Mandatory Rules:
1. **NO direct implementation** without specs
2. **NO code without failing tests first**
3. **NO commits directly to main/development**
4. **NO work without 30-minute commits**
5. **NO merge without 80% coverage**

### Quality Gates:
- OpenAPI validation must pass
- Test coverage must exceed 80%
- All CI/CD checks must be green
- Documentation must be updated
- Version numbers must be consistent

---

*Last Updated*: September 10, 2024
*Version Target*: v0.1.9-alpha.1
*Primary Directory*: __REBUILD/
*Migration Source*: Old_use_for_migration/
*Cleanup Queue*: __DELETE_LATER/