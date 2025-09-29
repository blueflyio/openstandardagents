# 📌 Git Branch & Repository Cleanup Standards

## Objective
Standardize all repositories under `/Users/flux423/Sites/LLM` to use:
- **1 permanent branch**: `development`
- **1–5 active working branches**: `feature/*`, `bug/*`, `chore/*`, `docs/*`
- **1 consolidated branch**: `release/YYYYMMDD` (rebased on `development`)

## Rules
- Never commit directly to `main` (local main should be deleted if it exists).
- Always branch from `development`.
- No backup or experimental branches outside the allowed prefixes.
- All changes must be preserved; nothing is deleted without checkpointing.

## Branch Naming Convention

### Permanent Branch
- `development` - Primary development branch (protected)

### Working Branches (Max 5 Active)
- `feature/*` - New features and enhancements
- `bug/*` - Bug fixes
- `chore/*` - Maintenance tasks
- `docs/*` - Documentation updates

### Release Branches
- `release/YYYYMMDD` - Consolidated release branches

## Standardization Process

### Step 1 — Audit
- Enumerate all local repositories
- Identify current branch
- List all local branches
- Classify branches:
  - `protect`: `development`
  - `working`: `feature/*`, `bug/*`, `chore/*`, `docs/*`
  - `merge-into-release`: clean branches ready to merge
  - `manual`: dirty or diverged branches needing review

### Step 2 — Sync Development
- Pull latest `development` from origin
- If `development` missing, create from `main`

### Step 3 — Consolidate
- Create `release/YYYYMMDD` from `development`
- Merge eligible branches into release
- Resolve trivial merges automatically
- Skip conflicts for manual resolution
- Rebase on `development`

### Step 4 — Push
- Push updated `development` to origin
- Push `release/YYYYMMDD` to origin
- Ensure remote tracking is synchronized

### Step 5 — Report
- List of repos processed
- Branches kept and consolidated
- Branches requiring manual attention
- Confirmation of standardization

## Using Agent Build Kit CLI

```bash
# Audit all repositories
agentkit git-management audit --directory /Users/flux423/Sites/LLM

# Consolidate branches (dry run)
agentkit git-management consolidate --dry-run

# Full standardization
agentkit git-management standardize

# Generate report
agentkit git-management audit --format markdown > git-audit.md
```

## Safety Rules
- ✅ Always checkpoint dirty branches before merging
- ✅ Never delete branches automatically
- ✅ Never force-push to `development` or `release/`
- ✅ Report first, then apply changes only after approval

## Compliance Check

Every repository should have:
1. `development` branch (clean, up-to-date)
2. `release/YYYYMMDD` branch (clean, rebased, pushed)
3. 1–5 working branches with proper prefixes
4. No stray or stale branches

## Manual Review Required

Branches requiring manual review:
- Dirty branches with uncommitted changes
- Branches with merge conflicts
- Branches diverged significantly from `development`
- Branches not following naming conventions

## Integration with ROADMAP.md

All active work should be tracked in ROADMAP.md:
- Feature branches should correspond to roadmap tasks
- Bug branches should reference issue numbers
- Release branches should align with version milestones