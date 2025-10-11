# Branch Consolidation Plan

## Current Status
- **Current Branch**: consolidation/v0.1.9-20250910
- **Based on**: archive/feature-0.1.8-WORKING-CLI (with voice agent support)
- **Safety Backup**: backup/safety-20250910-192408

## Branch Analysis

### Active Development Branches (Keep)
1. **archive/feature-0.1.8-WORKING-CLI** 
   - Latest: Voice agent support implementation
   - Status: Most current work, already pushed to remote
   - Action: This is our main branch

2. **development** 
   - Status: Main development branch
   - Action: Will merge consolidated work here

### Archive Branches (Review for unique commits)
3. **archive/feature-agent-orchestration-migration-100**
   - Contains: Worktree improvements
   - Conflicts: Heavy rename conflicts with current structure
   - Action: Skip - conflicts too complex

4. **archive/feature-0.1.8-clean-folder-structure**
   - Contains: Clean folder structure implementation
   - Action: Already incorporated in WORKING-CLI

5. **archive/feature-0.1.8-100-agent-ossa-migration**
   - Contains: OSSA agent structure compliance
   - Action: Check for unique work

### Recovery/Backup Branches (Can be deleted after verification)
- archive/feature-0.1.8-old
- archive/feature-0.1.8-production-recovery
- archive/feature-0.1.8-real-recovery
- archive/feature-0.1.8-recovery
- archive/feature-0.1.8-recovery-working
- archive/feature-0.1.8-sync
- backup/pre-worktree-merge
- recovery-from-cleanup-disaster-20250908

## Consolidation Strategy

### Phase 1: Verify Current State 
- Created backup branch: backup/safety-20250910-192408
- Created consolidation branch: consolidation/v0.1.9-20250910

### Phase 2: Identify Unique Work
```bash
# Check what's unique in each branch
git log --oneline --no-merges development..archive/feature-0.1.8-WORKING-CLI
git log --oneline --no-merges development..archive/feature-0.1.8-100-agent-ossa-migration
```

### Phase 3: Safe Merging
1. Stay on consolidation/v0.1.9-20250910
2. The branch already has all work from WORKING-CLI
3. Check for any critical commits in other branches
4. Document what's being preserved vs discarded

### Phase 4: Testing
```bash
# Verify the build works
npm test
npm run build
```

### Phase 5: Final Merge to Development
```bash
git checkout development
git merge consolidation/v0.1.9-20250910 --no-ff
git push origin development
```

### Phase 6: Cleanup (Only after verification)
```bash
# Delete local redundant branches
git branch -d archive/feature-0.1.8-old
git branch -d archive/feature-0.1.8-recovery
# etc...
```

## What We're Preserving

### From WORKING-CLI (Current):
-  Voice agent implementation
-  ACDL test infrastructure  
-  Platform integration layer
-  Workflow schemas
-  Registry and orchestration implementations
-  Infrastructure migration to __REBUILD

### Unique Features to Check:
- Any OSSA compliance work from 100-agent-migration branch
- Any production configs from production-recovery branch

## Commands to Execute

```bash
# 1. Verify we have everything important
git diff development..consolidation/v0.1.9-20250910 --stat

# 2. Run tests
cd __REBUILD && npm test

# 3. If all good, prepare for merge
git checkout development
git pull origin development
git merge consolidation/v0.1.9-20250910 --no-ff -m "feat: Consolidate v0.1.9 development with voice agents and platform integration"

# 4. Push to remote
git push origin development

# 5. Clean up old branches (after verification)
# List branches that can be deleted
git branch --merged | grep archive/

# 6. Delete merged branches
git branch -d [branch-name]
```

## Risk Mitigation
- All work backed up in: backup/safety-20250910-192408
- Remote has: origin/archive/feature-0.1.8-WORKING-CLI
- Can always recover with: `git checkout backup/safety-20250910-192408`