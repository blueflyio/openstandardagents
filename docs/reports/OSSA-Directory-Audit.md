# OSSA Directory Structure Audit & Cleanup Plan

**Date:** 2025-09-05  
**Directory:** `/Users/flux423/Sites/LLM/OSSA`  
**Status:** NEEDS CLEANUP - Multiple duplicate/redundant directories

## 🔴 Current Issues Identified

### 1. Duplicate Service Directories
- **`/services/`** - Contains microservices.config.json, orchestration-cli.js, TEST_RESULTS.md
- **`/services/src/`** - Has actual service code files  
- **`/src/services/`** - Another set of service implementations (19 items)
- **`/lib/services/`** - Yet another services directory

**Problem:** 4 different locations for services - unclear which is authoritative

### 2. Duplicate Schema Directories  
- **`/schemas/`** - Contains orchestration YAMLs and v0.1.3 subdirectory
- **`/schemas/v0.1.3/`** - Version-specific schemas
- **`/spec/schemas/`** - Contains 20 schema files (seems to be the main one)

**Problem:** Schema files scattered across multiple locations

### 3. Scripts Directory Issues
- **`/scripts/`** - Contains mix of:
  - Shell scripts (generate-readmes.sh, ossa-cleanup.sh) - temporary cleanup scripts
  - JavaScript files (safe-syntax-scanner.js, update-all-roadmaps.js, validate-v0.1.7.js)
  - autonomous-coordinator.js (moved here from wrong location)

**Problem:** Mix of one-off scripts and actual tools, no proper CLI structure

### 4. Reports Directory
- **`/reports/`** - Contains:
  - Configuration files (20-agent-deployment-config.yml, 20-agent-ecosystem-status.json)
  - Actual reports (deployment-report-v0.1.7.md, ossa-compliance-report.md)
  - Documentation (AGENT_INVENTORY.md)

**Problem:** Mix of configs, reports, and docs in one place

### 5. Multiple CLI/Binary Locations
- **`/bin/ossa`** - Main CLI entry point
- **`/cli/`** - CLI source code directory
- **`/lib/cli.js`** - Compiled CLI code

**Status:** This seems properly structured

## 📁 Directory Purpose Analysis

### Core Implementation (KEEP)
```
/src/services/          # Main service implementations
/spec/schemas/          # Official schema specifications
/lib/                   # Compiled/built code
/bin/                   # Binary/executable entry points
/cli/                   # CLI source code
```

### Documentation (KEEP)
```
/docs/                  # Official documentation
/examples/              # Example implementations
/templates/             # Templates for new projects
```

### Build/Test (KEEP)
```
/test/                  # Test files
/node_modules/          # Dependencies
/config/                # Configuration files
```

### Project Structure (KEEP)
```
/.agents/               # OSSA-compliant agent definitions
/.git/                  # Git repository
/.gitlab/               # GitLab CI/CD configuration
```

### Problematic/Duplicate (NEEDS ACTION)
```
/services/              # Duplicate - appears to be old/partial
/schemas/               # Duplicate - mix of files
/scripts/               # Temporary scripts - should be in tools or CLI
/reports/               # Mix of configs and reports
```

## 🎯 Proposed Cleanup Plan

### Phase 1: Consolidate Services
1. **Primary:** Keep `/src/services/` as the main services directory
2. **Action:** 
   - Review `/services/src/` for unique files → merge into `/src/services/`
   - Review `/services/` root files → move configs to `/config/`
   - Remove empty `/services/` directory after consolidation

### Phase 2: Consolidate Schemas  
1. **Primary:** Keep `/spec/schemas/` as the main schemas directory
2. **Action:**
   - Move unique files from `/schemas/` to `/spec/schemas/`
   - Move `/schemas/v0.1.3/` to `/spec/schemas/v0.1.3/`
   - Remove `/schemas/` directory

### Phase 3: Clean Scripts Directory
1. **Action:**
   - Move cleanup scripts (*.sh) to `/__DELETE_LATER/` or remove
   - Move JavaScript tools to `/lib/tools/` or `/cli/src/commands/`
   - Remove `/scripts/` directory

### Phase 4: Organize Reports
1. **Action:**
   - Move config files (*.yml, *.json) to `/config/`
   - Keep actual reports (*.md) in `/docs/reports/`
   - Remove `/reports/` directory

## 📋 File Movement Plan

### From `/services/`:
- `microservices.config.json` → `/config/microservices.config.json`
- `orchestration-cli.js` → `/cli/src/commands/orchestration.js` (if needed)
- `TEST_RESULTS.md` → `/docs/reports/TEST_RESULTS.md`
- `vitest.config.ts` → `/config/vitest.config.ts`
- `/services/src/*` → Merge with `/src/services/`

### From `/schemas/`:
- `agent-orchestration.yml` → `/spec/schemas/agent-orchestration.yml` (check for duplicates)
- `governance-orchestration.yml` → `/spec/schemas/governance-orchestration.yml`
- `orchestration-api-extension.yml` → `/spec/schemas/orchestration-api-extension.yml`
- `/schemas/v0.1.3/*` → `/spec/schemas/v0.1.3/*`

### From `/scripts/`:
- `generate-readmes.sh` → DELETE (temporary cleanup script)
- `ossa-cleanup.sh` → DELETE (temporary cleanup script)
- `safe-syntax-scanner.js` → `/lib/tools/safe-syntax-scanner.js`
- `update-all-roadmaps.js` → `/lib/tools/update-all-roadmaps.js`
- `validate-v0.1.7.js` → `/lib/tools/validate-v0.1.7.js`
- `autonomous-coordinator.js` → `/lib/tools/autonomous-coordinator.js`

### From `/reports/`:
- `20-agent-deployment-config.yml` → `/config/agent-deployment-config.yml`
- `20-agent-ecosystem-status.json` → `/config/agent-ecosystem-status.json`
- `AGENT_INVENTORY.md` → `/docs/reports/AGENT_INVENTORY.md`
- `*.md` (reports) → `/docs/reports/*.md`

## 🎯 Final Structure (After Cleanup)

```
/Users/flux423/Sites/LLM/OSSA/
├── .agents/                 # Agent definitions (KEEP)
├── .git/                    # Git repo (KEEP)
├── .gitlab/                 # GitLab CI/CD (KEEP)
├── __DELETE_LATER/          # Temporary storage (CLEAN LATER)
├── api/                     # API definitions (KEEP)
├── bin/                     # Binary entry points (KEEP)
├── cli/                     # CLI source code (KEEP)
├── config/                  # All configuration files (EXPANDED)
├── docs/                    # Documentation (KEEP)
│   └── reports/            # All reports moved here (NEW)
├── examples/                # Examples (KEEP)
├── lib/                     # Compiled code (KEEP)
│   └── tools/              # JavaScript tools (EXPANDED)
├── node_modules/            # Dependencies (KEEP)
├── spec/                    # Specifications (KEEP)
│   └── schemas/            # All schemas consolidated here
├── src/                     # Source code (KEEP)
│   └── services/           # All services consolidated here
├── templates/               # Templates (KEEP)
└── test/                    # Tests (KEEP)

REMOVED:
- /services/                 # Duplicate directory
- /schemas/                  # Duplicate directory  
- /scripts/                  # Temporary scripts
- /reports/                  # Mixed content directory
```

## ⚠️ Risk Assessment

### Low Risk:
- Moving report files to `/docs/reports/`
- Moving config files to `/config/`
- Deleting temporary shell scripts

### Medium Risk:
- Consolidating schema files (need to check for conflicts)
- Moving JavaScript tools to `/lib/tools/`

### High Risk:
- Merging service directories (need careful review for conflicts)
- Updating any hardcoded paths in code

## 🔍 Pre-Cleanup Checklist

Before executing cleanup:
1. [ ] Check for hardcoded paths to `/services/`, `/schemas/`, `/scripts/`, `/reports/`
2. [ ] Verify no active processes using these directories
3. [ ] Backup current state
4. [ ] Review package.json for any path references
5. [ ] Check .gitlab-ci.yml for path references

## 💡 Recommendation

**DO NOT PROCEED** without:
1. Reviewing this plan
2. Confirming which service/schema directories are authoritative
3. Checking for any build/deployment dependencies on current structure

This audit reveals significant structural issues that need careful consolidation to avoid breaking the OSSA implementation.