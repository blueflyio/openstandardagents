# GitLab CI Scripts

Scripts for automating GitLab CI/CD workflows and milestone management.

## Spec Directory Management

### sync-spec-to-milestone.sh
**Purpose:** Sync spec directory structure with GitLab milestones

**What it does:**
- Checks active GitLab milestones
- Creates `spec/v0.2.X-dev/` directories for milestones with versions
- Creates basic README and CHANGELOG files
- Ensures directory structure exists for active development

**Usage:**
```bash
export GITLAB_PUSH_TOKEN="your-token"
export CI_PROJECT_ID="123"
./.gitlab/scripts/sync-spec-to-milestone.sh
```

**When it runs:**
- Automatically in CI: `prepare:spec-structure` job
- Can be run manually to sync directories

### prepare-spec-from-milestone.sh
**Purpose:** Prepare stable spec directory from dev when milestone is closed

**What it does:**
- Checks for closed milestones with version in title
- Creates `spec/v0.2.X/` from `spec/v0.2.X-dev/` when milestone closes
- Renames schema files (removes -dev suffix)
- Updates schema contents to remove -dev references
- Updates README to mark as stable

**Usage:**
```bash
export GITLAB_PUSH_TOKEN="your-token"
export CI_PROJECT_ID="123"
./.gitlab/scripts/prepare-spec-from-milestone.sh
```

**When it runs:**
- Automatically in CI: `release:main` job (before release)
- Can be run manually to prepare release structure

## Integration with GitLab CI

### prepare:spec-structure Job
- **Stage:** validate
- **Purpose:** Ensure spec directories exist for active milestones
- **Runs:** Always (non-blocking)
- **Creates:** `spec/v0.2.X-dev/` directories for active milestones

### release:main Job Enhancement
- **Enhancement:** Calls `prepare-spec-from-milestone.sh` before release
- **Purpose:** Create stable spec directory when milestone closes
- **Result:** `spec/v0.2.X/` created from `spec/v0.2.X-dev/` automatically

## Workflow

1. **Milestone Created** → `sync-spec-to-milestone.sh` creates `spec/v0.2.X-dev/`
2. **Development** → Work happens in `spec/v0.2.X-dev/`
3. **Milestone Closed** → `prepare-spec-from-milestone.sh` creates `spec/v0.2.X/`
4. **Release** → Semantic-release uses stable `spec/v0.2.X/` directory

## Manual Usage

### Sync directories with milestones
```bash
cd /Users/flux423/Sites/LLM/openstandardagents
export GITLAB_PUSH_TOKEN="glpat-..."
export CI_PROJECT_ID="1553"
./.gitlab/scripts/sync-spec-to-milestone.sh
```

### Prepare release structure
```bash
./.gitlab/scripts/prepare-spec-from-milestone.sh
```

## Requirements

- `curl` - For GitLab API calls
- `jq` - For JSON parsing
- `bash` or `sh` - Shell interpreter
- GitLab API token with read access to milestones

