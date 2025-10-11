# Project Standardization Process

**Learned from**: agent-tracer complete cleanup  
**Date**: September 13, 2025  
**Ready for replication across all common_npm projects**

## Git Branching Strategy

### 1. **Feature Branches for Standardization**
```bash
# Create feature branch from current work
git checkout -b feature/project-standardization

# Commit with descriptive message
git commit -m "feat: complete project standardization and cleanup"
```

### 2. **Branch Naming Convention**
- `feature/project-standardization` - For cleanup work
- `feature/architecture-restructuring` - For code organization  
- `bugfix/syntax-fixes` - For critical syntax issues
- `hotfix/critical-issue` - For urgent production fixes

## Standardization Process (8 Steps)

### Step 1: Audit Current State
```bash
# Check branch and file counts
git branch --show-current
ls -la *.md | wc -l  # Count MD files
ls -la *.json | wc -l  # Count JSON files
find . -maxdepth 1 -type f | wc -l  # Total root files
```

### Step 2: Create Documentation Structure
```bash
mkdir -p docs/{specifications,reports,legacy,integrations,technical,configurations,testing,api,rebuild-recovery}
mkdir -p tools
mkdir -p tests/{unit,integration,api,e2e,fixtures}
```

### Step 3: Identify Standard Files (Keep in Root)
**ALWAYS KEEP:**
- README.md
- ROADMAP.md  
- CONTRIBUTING.md
- LICENSE
- CHANGELOG.md
- package.json, package-lock.json
- tsconfig.json
- .gitignore
- .gitlab-ci.yml
- .npmrc
- .env files (current)
- .claude-policies.json
- lefthook.yml
- Test configs (playwright.config.ts, jest.config.js)

### Step 4: Organize Files by Purpose
**Documentation Files:**
```bash
# Specifications & API docs
mv *SPEC*.md docs/specifications/
mv api-*.md docs/specifications/
mv *.json docs/specifications/  # (except package.json)

# Reports & audits  
mv *REPORT*.md docs/reports/
mv *AUDIT*.md docs/reports/
mv *SUMMARY*.md docs/reports/

# Legacy/historical docs
mv *EXTRACTION*.md docs/legacy/
mv *OLD*.md docs/legacy/

# Integration docs
mv *INTEGRATION*.md docs/integrations/
mv *DROIT*.md docs/integrations/

# Technical fixes
mv *FIX*.md docs/technical/
mv AUTHENTICATION.md docs/technical/

# Configurations
mv docker-compose*.yml docs/configurations/
mv .env.*.bak* docs/configurations/
```

### Step 5: Consolidate Duplicate Directories
**Test Directories:**
```bash
# Merge all test dirs into tests/
cp -r test/* tests/ 2>/dev/null
cp -r unit/* tests/unit/ 2>/dev/null  
cp api/* tests/api/ 2>/dev/null
rm -rf test unit api  # Remove duplicates
```

**API Directories:**
```bash
# Keep src/api/ for source, tests/api/ for tests
# Remove duplicate root /api/ if it exists
```

### Step 6: Extract TODOs to ROADMAP
```bash
# Find all TODOs
grep -r "\[\s*\]|\[ \]|TODO|FIXME" *.md

# Add new phase to ROADMAP.md:
# Phase X: Technical Debt & Refactoring  PRIORITY
```

### Step 7: Update Legacy References
```bash
# Find old project names
grep -r "old-project-name" . --include="*.md" --include="*.json"

# Update systematically (document count for later)
```

### Step 8: Commit and Verify
```bash
# Commit with proper message
git add -A
git commit -m "feat: complete project standardization and cleanup

- Consolidated X+ MD files from root to organized /docs/ structure  
- [detailed change list]"

# Verify clean state
ls -la | grep -v "^d" | wc -l  # Should be ~10-15 files
```

## Expected Results Per Project

###  Clean Root Directory (10-15 files)
- Only standard project files
- No stray documentation
- No duplicate configs
- No old scripts/reports

###  Organized /docs/ Structure
- `/docs/specifications/` - API specs, JSON schemas
- `/docs/reports/` - Status reports, audits  
- `/docs/legacy/` - Historical documentation
- `/docs/integrations/` - Integration docs
- `/docs/technical/` - Fix instructions, guides
- `/docs/configurations/` - Docker, environment files
- `/docs/testing/` - Test documentation
- `/docs/api/` - OpenAPI specs, API docs

###  Consolidated Tests  
- Single `/tests/` directory
- `/tests/unit/`, `/tests/integration/`, `/tests/api/`, `/tests/e2e/`
- No duplicate test directories

### 📋 Updated ROADMAP
- All extracted TODOs added
- Technical debt prioritized
- Clear action items

## Quality Checklist

- [ ] Root has only standard files (≤15 files)
- [ ] All documentation in /docs/ subdirectories
- [ ] No duplicate directories (/api, /test, /unit)  
- [ ] ROADMAP updated with extracted TODOs
- [ ] Legacy naming references documented
- [ ] Proper git branch created
- [ ] Descriptive commit message
- [ ] All content preserved (no data loss)

## Replication Strategy

1. **High Priority**: Projects with syntax errors or architecture issues
2. **Medium Priority**: Projects with mixed concerns
3. **Low Priority**: Already clean projects (quick audit)

**Next Target**: agent-router (high priority - architecture issues)

## Success Metrics from agent-tracer

 **32+ root files** → **12 clean files**  
 **42 files** organized in /docs/  
 **All duplicates** removed (/api, /test, /unit)  
 **8 TODOs** extracted to ROADMAP Phase 7  
 **Professional structure** achieved  
 **Zero data loss** during cleanup