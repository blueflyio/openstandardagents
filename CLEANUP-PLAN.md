# OSSA Project Cleanup Plan

## Major Issues Identified

### 1. Duplicate API Files
❌ **Problem**: OpenAPI specs exist in both `/src/api/` and `/public/src/api/`
- Same files duplicated across directories
- Confusion about which is the source of truth
- Build/sync inconsistencies

**Solution**: Consolidate to `/src/api/` only, remove `/public/src/api/`

### 2. Massive .agents Directory Structure
❌ **Problem**: 200+ configuration files in `.agents/` with repetitive structure
- Each agent has identical file structure (package.json, tsconfig.json, etc.)
- Massive duplication of configuration
- Hard to maintain and navigate

**Solution**:
- Consolidate common configs to workspace level
- Keep only agent-specific files in agent directories
- Create shared templates

### 3. Configuration File Sprawl
❌ **Problem**: Multiple config files with overlapping concerns
- `.eslintrc.json`, `.prettierrc.json`, `.lintstagedrc.json`
- Multiple `tsconfig.json` files
- Inconsistent formatting rules

**Solution**: Consolidate into workspace-level configs

### 4. Redundant Documentation Structure
❌ **Problem**: Overlapping documentation
- `/docs/api/` vs `/docs/reference/api/`
- Multiple README files with similar content
- Inconsistent structure

**Solution**: Flatten and reorganize docs structure

### 5. Public Directory Confusion
❌ **Problem**: `/public/` contains both build artifacts and source files
- Source API specs shouldn't be in public
- Mixed concerns (build vs source)

**Solution**: Clean separation of build artifacts vs source

## Cleanup Actions

### Phase 1: Configuration Consolidation
- [ ] Remove duplicate API files from `/public/src/api/`
- [ ] Consolidate `.agents/` configurations
- [ ] Create shared workspace configs
- [ ] Remove redundant config files

### Phase 2: Documentation Reorganization
- [ ] Merge `/docs/api/` and `/docs/reference/api/`
- [ ] Standardize README structure
- [ ] Remove outdated documentation

### Phase 3: Directory Structure Cleanup
- [ ] Clean `/public/` directory
- [ ] Organize `/infrastructure/` properly
- [ ] Standardize naming conventions

### Phase 4: Build Process Optimization
- [ ] Update build scripts to use consolidated configs
- [ ] Fix any broken references
- [ ] Update CI/CD pipelines

## Priority Issues (Clean These First)

1. **Remove `/public/src/api/` duplication** - Immediate
2. **Consolidate agent configurations** - High priority
3. **Fix documentation structure** - Medium priority
4. **Clean build artifacts** - Low priority

## Files to Review/Remove

### Immediate Removal Candidates:
- `/public/src/api/` (duplicate of `/src/api/`)
- Redundant `tsconfig.json` files in agent directories
- Duplicate `package.json` files in agents
- Old backup/temp files

### Consolidation Candidates:
- ESLint/Prettier configs across agents
- OpenAPI specs (keep only in `/src/api/`)
- Documentation READMEs
- GitLab CI components

## Post-Cleanup Benefits

1. **Reduced complexity** - Easier to navigate and understand
2. **Consistent configuration** - One source of truth for configs
3. **Faster builds** - Less files to process
4. **Better maintainability** - Clear ownership and structure
5. **Improved developer experience** - Less confusion about file locations