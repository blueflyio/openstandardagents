# OSSA Project Restoration Plan

## Current State Audit

### Issues Found:
1. **src/ directory is EMPTY** - Should contain TypeScript source code
2. **website/ directory exists** - Should be in separate `openstandardagents.org` repo
3. **spec/ directory was restored** - 167 files restored from git history

## What Happened

Commit `6e8d3c6bd3` ("refactor(spec): consolidate OSSA as spec-only repository") deleted:
- All files in `src/` directory
- Moved agent manifests to `spec/examples/reference-agents/`
- Removed packages, tools, bots directories
- Website directory should have been moved to separate repo

## Restoration Plan

### Phase 1: Restore src/ directory
- Restore from commit before `6e8d3c6bd3` (commit `6e8d3c6bd3^`)
- Command: `git checkout '6e8d3c6bd3^' -- src/`
- Verify all TypeScript source files restored

### Phase 2: Remove website/ directory
- Check if website/ should be here or in separate repo
- If wrong location: Remove from this repo
- If needed here: Keep but verify it's correct

### Phase 3: Verify project structure
- Ensure all critical directories present:
  - src/ (TypeScript source)
  - spec/ (OSSA specifications) ✅ RESTORED
  - tests/ (test files)
  - package.json, tsconfig.json, etc.

### Phase 4: Production Readiness
- Verify all CI/CD jobs work
- Ensure all dependencies resolve
- Run tests to verify functionality
- Check build process

## Commands to Execute (ONLY AFTER APPROVAL)

```bash
# 1. Restore src/ directory
git checkout '6e8d3c6bd3^' -- src/

# 2. Check website/ status
git ls-files website/ | wc -l
# If > 0, check if it should be here or moved

# 3. Verify restoration
find src -type f | wc -l
git status --short

# 4. Commit restoration
git add src/
git commit -m "fix: Restore src/ directory with all TypeScript source files"
```

## DO NOT EXECUTE UNTIL APPROVED
