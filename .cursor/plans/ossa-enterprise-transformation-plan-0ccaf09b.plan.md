<!-- 0ccaf09b-7f4d-4214-b67a-df52fb223782 8c04fcd7-2d58-4707-a5a4-c51db90f0a76 -->
# Open Standard Agents (OSA) — Enterprise Transformation Plan

## CRITICAL FOCUS: OSSA Schema Enhancement for v0.2.3 Release

The schema is THE GOLD. It must be bulletproof, comprehensive, and integrate seamlessly with all major agent platforms before v0.2.3 release.

## GitLab Issue → MR → Worktree Workflow (Sequential)

### Pre-Setup: Sync All Branches

**TODO: Pull latest from all branches before starting**

- [ ] **Fetch all remote branches**:
  ```bash
  git fetch --all --prune
  ```

- [ ] **Pull latest from main branch**:
  ```bash
  git checkout main
  git pull origin main
  ```

- [ ] **Pull latest from development branch**:
  ```bash
  git checkout development
  git pull origin development
  ```

- [ ] **Pull latest from all feature branches**:
  ```bash
  git branch -r | grep -v '\->' | while read remote; do git branch --track "${remote#origin/}" "$remote" 2>/dev/null || true; done
  git fetch --all
  git pull --all
  ```


### Worktree Setup (Sequential - Each Phase Builds on Previous)

#### Phase 1 Worktree Setup

**TODO: Create Phase 1 worktree with all latest changes merged**

- [ ] **Create GitLab Issue #1**: "Phase 1: OSSA Schema Deep Analysis & Enhancement"
  - Include all Phase 1 TODOs
  - Assign to milestone: v0.2.4
  - Add labels: `schema`, `enhancement`, `critical`, `v0.2.3`
- [ ] **Click "Create merge request"** on Issue #1
  - GitLab creates branch: `issue-1-phase-1-ossa-schema-deep-analysis-enhancement`
  - Target branch: `development`
- [ ] **Set up Phase 1 worktree**:
  ```bash
  # Fetch the new branch
  git fetch origin issue-1-phase-1-ossa-schema-deep-analysis-enhancement
  
  # Create worktree with all latest changes merged
  git worktree add ~/.cursor/worktrees/open-standard-agents/issue-1-phase-1-ossa-schema-deep-analysis-enhancement issue-1-phase-1-ossa-schema-deep-analysis-enhancement
  
  # Switch to worktree
  cd ~/.cursor/worktrees/open-standard-agents/issue-1-phase-1-ossa-schema-deep-analysis-enhancement
  
  # Merge latest from development
  git merge origin/development
  
  # Merge latest from main (if needed)
  git merge origin/main --no-edit || true
  
  # Push merged branch
  git push origin issue-1-phase-1-ossa-schema-deep-analysis-enhancement
  ```

- [ ] **Work in Phase 1 worktree**: `~/.cursor/worktrees/open-standard-agents/issue-1-phase-1-ossa-schema-deep-analysis-enhancement`

#### Phase 2 Worktree Setup (Branches from Phase 1)

**TODO: Create Phase 2 worktree branching from Phase 1**

- [ ] **Create GitLab Issue #2**: "Phase 2: Schema Testing & Validation Infrastructure"
  - Include all Phase 2 TODOs
  - Assign to milestone: v0.2.5
  - Add labels: `testing`, `validation`, `critical`, `v0.2.3`
  - Set dependency: Depends on Issue #1
- [ ] **Click "Create merge request"** on Issue #2
  - GitLab creates branch: `issue-2-phase-2-schema-testing-validation-infrastructure`
  - Target branch: `issue-1-phase-1-ossa-schema-deep-analysis-enhancement` (branches from Phase 1!)
- [ ] **Set up Phase 2 worktree**:
  ```bash
  # Fetch Phase 2 branch
  git fetch origin issue-2-phase-2-schema-testing-validation-infrastructure
  
  # Create worktree branching from Phase 1 worktree
  cd ~/.cursor/worktrees/open-standard-agents/issue-1-phase-1-ossa-schema-deep-analysis-enhancement
  git worktree add -b issue-2-phase-2-schema-testing-validation-infrastructure ~/.cursor/worktrees/open-standard-agents/issue-2-phase-2-schema-testing-validation-infrastructure
  
  # Switch to Phase 2 worktree
  cd ~/.cursor/worktrees/open-standard-agents/issue-2-phase-2-schema-testing-validation-infrastructure
  
  # Ensure it's based on Phase 1
  git merge issue-1-phase-1-ossa-schema-deep-analysis-enhancement --no-edit
  
  # Push Phase 2 branch
  git push origin issue-2-phase-2-schema-testing-validation-infrastructure
  ```

- [ ] **Work in Phase 2 worktree**: `~/.cursor/worktrees/open-standard-agents/issue-2-phase-2-schema-testing-validation-infrastructure`

#### Phase 3 Worktree Setup (Branches from Phase 2)

**TODO: Create Phase 3 worktree branching from Phase 2**

- [ ] **Create GitLab Issue #3**: "Phase 3: Complete Rebranding (OSSA → OSA)"
  - Include all Phase 3 TODOs
  - Assign to milestone: v0.2.4
  - Add labels: `rebranding`, `chore`, `high`, `v0.2.3`
- [ ] **Click "Create merge request"** on Issue #3
  - GitLab creates branch: `issue-3-phase-3-complete-rebranding`
  - Target branch: `issue-2-phase-2-schema-testing-validation-infrastructure` (branches from Phase 2!)
- [ ] **Set up Phase 3 worktree**:
  ```bash
  # Create worktree branching from Phase 2 worktree
  cd ~/.cursor/worktrees/open-standard-agents/issue-2-phase-2-schema-testing-validation-infrastructure
  git worktree add -b issue-3-phase-3-complete-rebranding ~/.cursor/worktrees/open-standard-agents/issue-3-phase-3-complete-rebranding
  
  cd ~/.cursor/worktrees/open-standard-agents/issue-3-phase-3-complete-rebranding
  git merge issue-2-phase-2-schema-testing-validation-infrastructure --no-edit
  git push origin issue-3-phase-3-complete-rebranding
  ```


#### Phase 4-7 Worktree Setup (Each Branches from Previous)

**TODO: Continue sequential worktree pattern**

- [ ] **Phase 4**: Branch from Phase 3
- [ ] **Phase 5**: Branch from Phase 4
- [ ] **Phase 6**: Branch from Phase 5
- [ ] **Phase 7**: Branch from Phase 6

### Worktree Directory Structure

```
~/.cursor/worktrees/
└── open-standard-agents/
    ├── issue-1-phase-1-ossa-schema-deep-analysis-enhancement/  (base)
    ├── issue-2-phase-2-schema-testing-validation-infrastructure/  (branches from #1)
    ├── issue-3-phase-3-complete-rebranding/  (branches from #2)
    ├── issue-4-phase-4-cli-enhancement/  (branches from #3)
    ├── issue-5-phase-5-website-development/  (branches from #4)
    ├── issue-6-phase-6-testing-infrastructure/  (branches from #5)
    └── issue-7-phase-7-gitlab-cicd-project-management/  (branches from #6)
```

### Workflow Script

**TODO: Create automated worktree setup script**

- [ ] Create `.gitlab/scripts/setup-sequential-worktree.sh`:
  ```bash
  #!/bin/bash
  # Usage: ./setup-sequential-worktree.sh <ISSUE_NUMBER> [PARENT_WORKTREE_PATH]
  # Sets up worktree branching from previous phase
  
  ISSUE_NUM=$1
  PARENT_WORKTREE=$2  # Optional: path to parent worktree
  
  # Fetch all branches first
  git fetch --all --prune
  
  # Get issue details from GitLab API
  # Create branch name
  # Create worktree branching from parent
  # Merge latest changes
  ```


## Phase 1: OSSA Schema Deep Analysis & Enhancement (WEEK 1 - CRITICAL)

[All Phase 1 detailed TODOs - schema audit, platform integration, validation, documentation]

## Phase 2: Schema Testing & Validation Infrastructure (WEEK 2 - CRITICAL)

[All Phase 2 detailed TODOs - test suite, validation service enhancement]

## Phase 3: Complete Rebranding (WEEK 1-2)

[All Phase 3 detailed TODOs - repository updates, codebase rebranding]

## Phase 4: CLI Enhancement (WEEK 3)

[All Phase 4 detailed TODOs - CLI commands implementation]

## Phase 5: Website Development (WEEK 4-5)

[All Phase 5 detailed TODOs - schema explorer, documentation]

## Phase 6: Testing Infrastructure (WEEK 6)

[All Phase 6 detailed TODOs - test coverage expansion]

## Phase 7: GitLab CI/CD & Project Management (WEEK 7)

[All Phase 7 detailed TODOs - GitLab setup, CI/CD pipeline]

## Success Metrics

- ✅ All worktrees set up sequentially
- ✅ Each phase builds on previous phase
- ✅ All branches synced before starting
- ✅ MRs auto-close issues when merged
- ✅ Schema is bulletproof for v0.2.3 release

## Deployment Steps: GitLab and GitHub Mirroring Setup

**NOTE: Do NOT deploy to GitHub yet - these are setup instructions for future deployment**

### Step 1: Commit and Push to GitLab

```bash
# Commit all changes
git add .
git commit -m "chore: setup GitHub mirroring and clean project structure"

# Push to GitLab
git push origin development
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/BlueflyCollective
2. Click "New repository"
3. Repository name: `OSSA` (or your preferred name)
4. Description: "OSSA - Open Standard for Scalable AI Agents"
5. Visibility: Public
6. Do NOT initialize with README, .gitignore, or license
7. Click "Create repository"

### Step 3: Generate GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `GitLab Mirror - OSSA`
4. Expiration: Set appropriate expiration (or no expiration)
5. Scopes: Check `repo` (Full control of private repositories)
6. Click "Generate token"
7. Copy the token immediately (you won't see it again)

### Step 4: Configure GitLab Push Mirroring

1. Go to your GitLab project: `https://github.com/blueflyio/openstandardagents/settings/repository`
2. Scroll to "Mirroring repositories"
3. Expand "Push to a remote repository"
4. Configure:

   - **Git repository URL**: `https://github.com/BlueflyCollective/OSSA.git`
   - **Mirror direction**: Push
   - **Authentication method**: Password
   - **Password**: Paste your GitHub PAT (not your GitHub password)
   - **Branch filter**: `^(main|development)$`
   - **Only mirror protected branches**: Unchecked
   - **Keep divergent refs**: Unchecked

5. Click "Mirror repository"
6. Click "Trigger" button to perform initial sync

### Step 5: Configure GitLab CI/CD Variables

1. Go to: `https://github.com/blueflyio/openstandardagents/settings/ci_cd`
2. Expand "Variables"
3. Click "Add variable"
4. Add these variables:

**Variable 1:**

   - Key: `GITHUB_MIRROR_TOKEN`
   - Value: Your GitHub PAT
   - Type: Variable
   - Environment scope: All
   - Flags: ✅ Protected, ✅ Masked
   - Click "Add variable"

**Variable 2 (Optional):**

   - Key: `GITHUB_ORG`
   - Value: `BlueflyCollective`
   - Type: Variable
   - Flags: ✅ Protected
   - Click "Add variable"

**Variable 3 (Optional):**

   - Key: `GITHUB_REPO`
   - Value: `OSSA` (or your repo name)
   - Type: Variable
   - Flags: ✅ Protected
   - Click "Add variable"

### Step 6: Initial Sync of Existing Branches and Tags

Run these commands locally:

```bash
# Add GitHub as a remote
git remote add github https://github.com/BlueflyCollective/OSSA.git

# Push main branch
git push github main

# Push development branch
git push github development

# Push all tags
git push github --tags
```

### Step 7: Verify Setup

1. Check GitLab mirror status:

   - Go to: Settings → Repository → Mirroring repositories
   - Verify status shows "Success" or "Running"

2. Verify GitHub repository:

   - Go to: https://github.com/BlueflyCollective/OSSA
   - Verify `main` and `development` branches exist
   - Verify tags are present

3. Test automatic mirroring:

   - Make a small commit to `development` branch
   - Push to GitLab: `git push origin development`
   - Wait 30-60 seconds
   - Check GitHub - the commit should appear automatically

4. Test release synchronization:

   - Create a tag in GitLab: `git tag v0.2.4 -m "Test release"`
   - Push tag: `git push origin v0.2.4`
   - The CI/CD pipeline will automatically create a GitHub release

### Step 8: Monitor and Maintain

- GitLab mirror status: Check periodically in Settings → Repository → Mirroring repositories
- CI/CD logs: Check pipeline logs for `mirror:github` job
- GitHub releases: Verify releases are created automatically when tags are pushed

## How It Works

1. Branch mirroring: GitLab push mirroring automatically syncs `main` and `development` branches to GitHub on every push
2. Tag mirroring: All tags are automatically synced via GitLab push mirroring
3. Release synchronization: The CI/CD `mirror:github` job creates GitHub releases when tags are created, syncing release notes from GitLab releases or CHANGELOG.md

## Troubleshooting

- Mirror not syncing: Check mirror status in GitLab, verify GitHub PAT has correct permissions, click "Trigger" to manually sync
- CI job failing: Check `GITHUB_MIRROR_TOKEN` is set correctly, verify GitHub repository exists, check CI/CD job logs
- Releases not syncing: Verify tag exists on GitHub, check CI/CD job logs, ensure GitLab release exists (if using GitLab releases)

The project is now set up for automated mirroring between GitLab and GitHub.

### To-dos

- [ ] Resolve v1.0 vs v0.2.3 conflict, merge forward-compatible features, create migration path
- [ ] Create .agents/ and .cursor/ directories, migrate assets/ and openapi/ to public/, reorganize docs/
- [ ] Add init, export, import, schema, docs, examples commands with framework support
- [ ] Create comprehensive examples for Cursor, BuildKit, CrewAI, LangChain, Langflow, OpenAI, Anthropic, MCP, AutoGen, LangGraph, Vercel AI SDK, LlamaIndex
- [ ] Expand test coverage to 95%+, add framework compatibility tests, integration tests, contract tests
- [ ] Enhance GitLab CI/CD with quality gates, components, security scanning, performance benchmarks
- [ ] Build comprehensive Next.js website with schema explorer, docs, examples gallery, playground
- [ ] Create technical documentation with parameter breakdowns, framework guides, migration guides, troubleshooting
- [ ] Migrate assets/ and openapi/ to public/, organize schemas and examples for public access
- [ ] Final code quality review, documentation accuracy check, security audit, performance optimization