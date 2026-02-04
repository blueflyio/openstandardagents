# .agents-workspace Standardization Plan
**Branch**: release/v0.4.1
**Date**: 2026-02-02
**Status**: Awaiting approval

---

## 🎯 Objective

Standardize all `.agents-workspace` directories across BlueFly projects to comply with OSSA v0.4.1 specification.

**Why this matters**:
- Ensures consistent workspace structure across all projects
- Enables proper functioning of `ossa workspace` CLI commands
- Required for v0.4.1 release compliance
- Facilitates agent discovery and orchestration

---

## 📊 Current State Analysis

### Workspaces Found (5 total):
1. ✅ `compliance-engine/.agents-workspace` - **REMOVED** (was empty template)
2. 🟢 `openstandardagents/.agents-workspace` - **90% compliant** (easiest)
3. 🟡 `agent-registry/.agents-workspace` - **60% compliant** (medium)
4. 🟡 `platform-agents/.agents-workspace` - **60% compliant** (medium, identical to agent-registry)
5. 🔴 `DEMO_agentdash/.agents-workspace` - **30% compliant** (hardest, v0.1.9-alpha.1 structure)

### OSSA v0.4.1 Standard Structure (Target):
```
.agents-workspace/
├── registry/
│   └── index.yaml              # apiVersion: ossa.dev/v1, kind: AgentRegistry
├── policies/
│   └── tool-allowlist.yaml     # apiVersion: ossa.dev/v1, kind: AgentPolicy
├── orchestration/               # Workflow configurations
├── shared-context/              # Shared documentation and context
│   └── README.md
└── logs/                        # Workspace operation logs
```

**Source**: `src/config/defaults.ts:160-169`

---

## 🚨 Known Issues

### Critical Bug in OSSA CLI
**File**: `src/cli/commands/workspace.command.ts`
**Lines**: 143-146
**Status**: Partially fixed in 396-fix-ci-summary-stage (line 95), line 143 still needs fix

**Problem**: Path concatenation creates nested absolute paths
```typescript
// WRONG (line 143-146):
const policyFilePath = getWorkspacePolicyPath();  // Returns 'policies/tool-allowlist.yaml'
fs.writeFileSync(
  path.join(workspaceDir, policyFilePath),  // Creates nested path if policyFilePath is absolute
  content
);

// CORRECT (how it should be):
const policyPath = path.join(workspaceDir, getWorkspacePolicyPath());
fs.writeFileSync(policyPath, content);
```

**Impact**: `ossa workspace init` command will fail
**Workaround**: Manual workspace creation until fixed

---

## 📋 Execution Plan

### Phase 1: Fix OSSA CLI Bug ⚡ (15 min)

**Goal**: Make `ossa workspace init` command functional

**Steps**:
1. Read `src/cli/commands/workspace.command.ts` to understand current implementation
2. Identify all instances of path concatenation bug (lines 88-91, 143-146)
3. Fix path handling to use correct pattern:
   ```typescript
   const registryPath = path.join(workspaceDir, getWorkspaceRegistryPath());
   const policyPath = path.join(workspaceDir, getWorkspacePolicyPath());
   ```
4. Test fix with: `npx tsx src/cli/index.ts workspace init --name test-workspace --force`
5. Verify created structure matches OSSA v0.4.1 standard

**Success Criteria**:
- ✅ Command completes without errors
- ✅ Creates all 5 required directories
- ✅ Creates `registry/index.yaml` with correct apiVersion
- ✅ Creates `policies/tool-allowlist.yaml` with correct structure

---

### Phase 2: Standardize openstandardagents ✅ (10 min) - EASIEST

**Location**: `/Users/thomas.scola/Sites/blueflyio/_CURRENT_WORK/openstandardagents/.agents-workspace`

**Current State**:
```
✓ registry/index.yaml           # ✅ Correct
✓ policies/tool-allowlist.yaml  # ✅ Correct
✓ orchestration/                # ✅ Correct
✓ shared-context/               # ✅ Correct
✓ logs/                         # ✅ Just created
✗ memory/                       # ❌ Non-standard (should move to shared-context/)
  └── version-management.md
✗ policies/security-tiers.yaml  # ❌ Should merge into tool-allowlist.yaml
```

**Actions**:
1. Check contents of `memory/version-management.md` to verify it's safe to move
2. Move: `memory/version-management.md` → `shared-context/version-management.md`
3. Remove: `memory/` directory
4. Read `policies/security-tiers.yaml` to understand content
5. Merge security tiers into `policies/tool-allowlist.yaml` (add as additional policy sections)
6. Remove: `policies/security-tiers.yaml`
7. Verify structure: `npx tsx src/cli/index.ts workspace list`

**Verification**:
```bash
# Should show:
.agents-workspace/
├── registry/index.yaml
├── policies/tool-allowlist.yaml
├── orchestration/
├── shared-context/
│   ├── README.md
│   └── version-management.md
└── logs/
```

**Success Criteria**:
- ✅ Only 5 standard directories remain
- ✅ All non-standard files moved to appropriate locations
- ✅ `ossa workspace list` runs without errors

---

### Phase 3: Standardize agent-registry & platform-agents 🟡 (60 min total, 30 min each)

**Locations**:
- `/Users/thomas.scola/Sites/blueflyio/_CURRENT_WORK/agent-registry/.agents-workspace`
- `/Users/thomas.scola/Sites/blueflyio/_CURRENT_WORK/platform-agents/.agents-workspace`

**Current State** (identical for both):
```
✗ Missing: policies/, orchestration/, shared-context/, logs/
✓ registry/platform-agents.yaml  # ❌ Should be index.yaml
✗ audit/                         # ❌ Non-standard
  ├── 2026-01-*/
  └── various logs
✗ memory.json                    # ❌ Non-standard
✗ workspace.yaml                 # ❌ Wrong path: /Users/flux423/Sites/LLM
```

**🚨 DECISION NEEDED FROM USER**:
1. **audit/** directory: Contains historical audit logs
   - **Option A**: Move to `logs/audit/` (preserve history)
   - **Option B**: Delete (if obsolete)
   - **Recommendation**: Check if actively used, then decide

2. **memory.json**: Contains agent memory state
   - **Option A**: Move to `shared-context/memory.json`
   - **Option B**: Delete (if ephemeral)
   - **Recommendation**: Inspect content first

**Actions** (for each workspace):
1. **Inspect non-standard files**:
   ```bash
   # Check audit directory
   ls -lR audit/ | head -50

   # Check memory.json content
   cat memory.json
   ```

2. **Create missing directories**:
   ```bash
   mkdir -p policies orchestration shared-context logs
   ```

3. **Rename registry file**:
   ```bash
   mv registry/platform-agents.yaml registry/index.yaml
   ```

4. **Update registry/index.yaml**:
   - Change `apiVersion: ossa.io/v1alpha1` → `apiVersion: ossa.dev/v1`
   - Verify `kind: AgentRegistry`
   - Update any outdated schema references

5. **Create policies/tool-allowlist.yaml**:
   - Copy from openstandardagents as template
   - Adjust for project-specific tools

6. **Create shared-context/README.md**:
   - Use template from `workspace.command.ts:150-167`

7. **Update workspace.yaml**:
   - Change path: `/Users/flux423/Sites/LLM` → `/Users/thomas.scola/Sites/blueflyio`
   - Update any other stale references

8. **Handle non-standard files** (based on user decision):
   - Move or delete `audit/`
   - Move or delete `memory.json`

9. **Verify structure**:
   ```bash
   cd /Users/thomas.scola/Sites/blueflyio/_CURRENT_WORK/agent-registry
   npx ossa workspace list
   ```

**Success Criteria**:
- ✅ All 5 required directories present
- ✅ `registry/index.yaml` uses ossa.dev/v1 apiVersion
- ✅ `policies/tool-allowlist.yaml` exists and valid
- ✅ `workspace.yaml` has correct paths
- ✅ No non-standard directories remain
- ✅ `ossa workspace list` runs without errors

---

### Phase 4: Standardize DEMO_agentdash 🔴 (90 min) - MOST COMPLEX

**Location**: `/Users/thomas.scola/Sites/blueflyio/_CURRENT_WORK/DEMO_agentdash/.agents-workspace`

**Current State**: Uses OSSA v0.1.9-alpha.1 structure (completely different)
```
✗ config.yml                    # Old MCP server config
✗ deployment-manifest.yml       # Old orchestration
✗ registry.yml                  # Old registry format
✗ workspace.yml                 # Old workspace config
✗ coordination/                 # Old orchestration
✗ data/                         # Runtime state (ephemeral)
✗ manifests/                    # Old manifest storage
  └── agent-registry.yml
✗ tokens/                       # API tokens (security risk!)
✗ workflows/                    # Old workflow configs
```

**🚨 SECURITY CONCERN**: `tokens/` directory may contain sensitive data

**🚨 DECISIONS NEEDED FROM USER**:
1. **tokens/** directory:
   - **Option A**: Move to `shared-context/tokens/` (NOT RECOMMENDED - security risk)
   - **Option B**: Convert to environment variables (RECOMMENDED)
   - **Option C**: Move to secure secrets manager

2. **data/** directory:
   - **Option A**: Move to `logs/` (preserve history)
   - **Option B**: Delete (if ephemeral runtime state)
   - **Recommendation**: Likely ephemeral, safe to delete

**Migration Strategy**:
```
Step 1: Backup
  ├─ Create: .agents-workspace.backup/
  └─ Copy all existing files

Step 2: Create new structure
  ├─ Create: NEW-STRUCTURE/{registry,policies,orchestration,shared-context,logs}/

Step 3: Migrate content
  ├─ manifests/agent-registry.yml + registry.yml → NEW-STRUCTURE/registry/index.yaml
  ├─ config.yml (MCP servers) → NEW-STRUCTURE/policies/tool-allowlist.yaml
  ├─ coordination/ + workflows/ → NEW-STRUCTURE/orchestration/
  ├─ Handle tokens/ (based on user decision)
  └─ Handle data/ (based on user decision)

Step 4: Validate
  ├─ Test: ossa workspace list
  └─ Verify all agents discovered

Step 5: Replace (if validation passes)
  ├─ Move: NEW-STRUCTURE/* → .agents-workspace/
  ├─ Delete old structure files
  └─ Keep: .agents-workspace.backup/ (for safety)
```

**Actions**:
1. **Inspect sensitive files**:
   ```bash
   # Check tokens directory
   ls -la tokens/
   # DO NOT cat token files in output!

   # Check data directory
   ls -lR data/ | head -50
   ```

2. **Create backup**:
   ```bash
   cd /Users/thomas.scola/Sites/blueflyio/_CURRENT_WORK/DEMO_agentdash
   cp -r .agents-workspace .agents-workspace.backup
   ```

3. **Create new structure**:
   ```bash
   cd .agents-workspace
   mkdir -p NEW-STRUCTURE/{registry,policies,orchestration,shared-context,logs}
   ```

4. **Migrate registry**:
   ```bash
   # Read and understand old formats
   cat manifests/agent-registry.yml
   cat registry.yml

   # Combine and convert to v0.4.1 format
   # Write to NEW-STRUCTURE/registry/index.yaml
   # apiVersion: ossa.dev/v1
   # kind: AgentRegistry
   ```

5. **Migrate policies**:
   ```bash
   # Extract MCP servers from config.yml
   # Convert to tool-allowlist.yaml format
   # Write to NEW-STRUCTURE/policies/tool-allowlist.yaml
   ```

6. **Migrate orchestration**:
   ```bash
   # Copy coordination and workflows
   cp -r coordination/* NEW-STRUCTURE/orchestration/ 2>/dev/null || true
   cp -r workflows/* NEW-STRUCTURE/orchestration/ 2>/dev/null || true
   ```

7. **Handle tokens** (based on user decision):
   ```bash
   # DECISION NEEDED - do not proceed without approval
   ```

8. **Handle data** (based on user decision):
   ```bash
   # DECISION NEEDED - do not proceed without approval
   ```

9. **Create shared-context/README.md**:
   ```bash
   # Use standard template
   ```

10. **Validate migration**:
    ```bash
    cd NEW-STRUCTURE
    # Test structure
    ```

11. **Replace old structure** (if validation passes):
    ```bash
    cd ..
    # Move NEW-STRUCTURE contents to parent
    # Delete old files
    # Keep backup
    ```

**Success Criteria**:
- ✅ All content successfully migrated
- ✅ Backup preserved in `.agents-workspace.backup/`
- ✅ New structure follows OSSA v0.4.1 standard
- ✅ All agents discovered correctly
- ✅ No sensitive data exposed
- ✅ `ossa workspace list` runs without errors

---

## ✅ Verification & Testing

After each workspace is standardized, run comprehensive tests:

```bash
# From project directory
cd /Users/thomas.scola/Sites/blueflyio/_CURRENT_WORK/[project]

# Test 1: List agents
npx ossa workspace list
# Expected: Shows all agents in registry

# Test 2: Discover agents
npx ossa workspace discover
# Expected: Finds all agent manifests

# Test 3: List policies
npx ossa workspace policy list
# Expected: Shows tool allowlist policies

# Test 4: Validate structure
npx ossa workspace validate
# Expected: No errors, all checks pass
```

**Final Validation**:
```bash
# Verify all workspaces
for project in openstandardagents agent-registry platform-agents DEMO_agentdash; do
  echo "=== Testing $project ==="
  cd /Users/thomas.scola/Sites/blueflyio/_CURRENT_WORK/$project
  npx ossa workspace list || echo "❌ FAILED"
done
```

---

## 🎯 Success Criteria

- [ ] **Phase 1**: OSSA CLI bug fixed and tested
- [ ] **Phase 2**: openstandardagents standardized (5 dirs, no extras)
- [ ] **Phase 3**: agent-registry standardized (5 dirs, ossa.dev/v1)
- [ ] **Phase 3**: platform-agents standardized (5 dirs, ossa.dev/v1)
- [ ] **Phase 4**: DEMO_agentdash standardized (full migration complete)
- [ ] **All**: Every workspace passes `ossa workspace list`
- [ ] **All**: Every workspace uses `apiVersion: ossa.dev/v1`
- [ ] **All**: Every workspace has exactly 5 required directories
- [ ] **All**: No non-standard directories or files remain

---

## ⚠️ Risk Assessment

### Low Risk:
- ✅ openstandardagents (already 90% compliant, minimal changes)
- ✅ CLI bug fix (isolated change, easily testable)

### Medium Risk:
- 🟡 agent-registry (missing directories, path updates)
- 🟡 platform-agents (identical to agent-registry)
- 🟡 Decision on audit/ and memory.json handling

### High Risk:
- 🔴 DEMO_agentdash (complete restructure, old format)
- 🔴 tokens/ directory (sensitive data)
- 🔴 Content migration accuracy

### Mitigation:
- Create backups before any destructive operations
- Test each workspace individually before proceeding
- Preserve `.agents-workspace.backup/` directories
- Get user approval for decisions on sensitive/non-standard files

---

## 🚨 Decisions Required from User

**Before proceeding, I need decisions on**:

1. **agent-registry & platform-agents**:
   - [ ] Keep `audit/` directory? (Move to logs/audit/ or delete)
   - [ ] Keep `memory.json`? (Move to shared-context/ or delete)

2. **DEMO_agentdash**:
   - [ ] How to handle `tokens/` directory? (ENV vars, secrets manager, or move)
   - [ ] Keep `data/` directory? (Move to logs/ or delete as ephemeral)

3. **Execution**:
   - [ ] Proceed with all phases automatically? (Or phase-by-phase approval)
   - [ ] Create git commits after each phase? (For incremental history)

---

## 📝 Commit Strategy

**Option A: Single commit** (after all work complete)
```
feat(workspace): standardize all .agents-workspace to OSSA v0.4.1

- Fix CLI workspace init path concatenation bug
- Standardize openstandardagents workspace structure
- Standardize agent-registry workspace structure
- Standardize platform-agents workspace structure
- Migrate DEMO_agentdash from v0.1.9-alpha.1 to v0.4.1
- Update all apiVersions to ossa.dev/v1
- Remove non-standard directories and files

Closes #XXX
```

**Option B: Incremental commits** (after each phase)
```
fix(cli): fix workspace init path concatenation bug
feat(workspace): standardize openstandardagents workspace
feat(workspace): standardize agent-registry workspace
feat(workspace): standardize platform-agents workspace
feat(workspace): migrate DEMO_agentdash to OSSA v0.4.1
```

**Recommendation**: Option B (incremental) for better git history and easier rollback

---

## 📅 Estimated Timeline

- Phase 1 (CLI fix): **15 minutes**
- Phase 2 (openstandardagents): **10 minutes**
- Phase 3 (agent-registry): **30 minutes**
- Phase 3 (platform-agents): **30 minutes**
- Phase 4 (DEMO_agentdash): **90 minutes**
- Testing & validation: **15 minutes**

**Total**: ~3 hours (or less if decisions are pre-approved)

---

## 🚀 Ready to Execute?

**This plan is ready for your review. Please provide**:
1. Decisions on the items listed in "Decisions Required from User"
2. Approval to proceed (all phases, or phase-by-phase)
3. Preferred commit strategy (single or incremental)

**Once approved, I will execute each phase methodically with verification at each step.**
