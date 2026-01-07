# Fix MR Targets - CRITICAL

## Problem
MRs were incorrectly created targeting `main` branch, which violates our branch protection rules.

## Solution

### Option 1: GitLab CI Job (Recommended)
1. Go to CI/CD → Pipelines
2. Run pipeline with variable: `FIX_MR_TARGETS=true`
3. Manually trigger the `fix:mr-targets` job

### Option 2: Manual Fix via GitLab UI
1. Go to: https://gitlab.com/blueflyio/openstandardagents/-/merge_requests?state=opened&target_branch=main
2. For each MR targeting `main`:
   - Click "Edit"
   - Change target branch from `main` to `release/v0.3.x`
   - Save

## MRs That Need Fixing
Based on the issues created (151-155), these MRs likely need fixing:
- MR !422 (feature/151-schema-lifecycle-environments-dependencies)
- MR !423 (feature/152-registry-mvp)
- MR !424 (feature/153-anthropic-runtime-adapter)
- MR !425 (feature/154-deploy-lifecycle-commands)
- MR !426 (feature/155-test-runner)

## Correct Workflow
- Feature branches → `release/v0.3.x` (NOT main)
- `release/v0.3.x` → `main` (only after milestone completion, with human approval)
