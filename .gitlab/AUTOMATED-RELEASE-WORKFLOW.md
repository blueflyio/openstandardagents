# Automated Milestone-Based Release Workflow

## Overview

This project uses **GitLab Milestones** as the source of truth for releases. The release button (`release:main`) is automatically enabled/disabled based on milestone completion status.

## How It Works

### 1. Milestone Setup

Create a milestone with:
- **Title format:** `v0.2.4 - Feature Name` (must include version)
- **Assign issues** to the milestone as you work
- **Track progress** via GitLab's milestone completion percentage

### 2. Development Phase

- Work happens in `development` branch
- Issues are created and assigned to milestone
- As issues are closed, milestone completion increases
- `spec/v0.2.X-dev/` directory is automatically created for active milestones

### 3. Milestone Completion Check

**Every pipeline runs `check:milestone-ready` job** which:
- ✅ Checks all milestones with version in title
- ✅ Validates that all issues are closed (100% complete)
- ✅ Passes if ready, fails if not ready

### 4. Release Button Availability

The `release:main` job button is **only enabled** when:
- ✅ `check:milestone-ready` job passes
- ✅ At least one milestone has all issues closed
- ✅ Milestone has version in title

**If milestone is not ready:**
- ❌ `check:milestone-ready` fails
- ❌ `release:main` button is disabled (dependency failed)
- 📋 Job output shows which issues are still open

### 5. Release Process

When you click the `release:main` button:
1. **Double-checks** milestone readiness
2. **Prepares** stable spec directory (`spec/v0.2.X/` from `spec/v0.2.X-dev/`)
3. **Runs** semantic-release (creates tag, release, NPM package)
4. **Mirrors** to GitHub
5. **Deploys** website

## CI/CD Pipeline Flow

```
┌─────────────────────────────────────┐
│  Feature Branch → development       │
│  (Development work)                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  check:milestone-ready              │
│  (Validates milestone completion)   │
│  ✅ Pass = All issues closed        │
│  ❌ Fail = Open issues exist        │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
     ✅ Pass      ❌ Fail
        │             │
        ▼             ▼
┌──────────────┐  ┌──────────────┐
│ release:main │  │ Button       │
│ (Available)  │  │ Disabled    │
└──────────────┘  └──────────────┘
```

## Manual Scripts

### Check Milestone Readiness

```bash
export GITLAB_PUSH_TOKEN="glpat-..."
export CI_PROJECT_ID="1553"
./.gitlab/scripts/check-milestone-ready.sh "v0.2.4 - Transport & Security"
```

### Auto-Close Milestone

When all issues are closed, you can auto-close the milestone:

```bash
./.gitlab/scripts/auto-close-milestone.sh "v0.2.4 - Transport & Security"
```

**Note:** The milestone doesn't need to be closed for release - as long as all issues are closed, the release button will be available.

## Webhook Integration (Optional)

You can set up a GitLab webhook to auto-close milestones when the last issue is closed:

1. Go to **Settings → Webhooks**
2. Add webhook URL (your automation endpoint)
3. Trigger on **Issue events**
4. When issue closes, check if milestone is 100% complete
5. If yes, call `auto-close-milestone.sh` or GitLab API

## Benefits

✅ **No manual tracking** - Milestone completion drives releases  
✅ **Clear visibility** - See exactly what's blocking release  
✅ **Prevents premature releases** - Can't release until all issues done  
✅ **Automated validation** - CI checks milestone status on every pipeline  
✅ **Self-documenting** - Milestone shows what's in the release  

## Troubleshooting

### Release button is disabled

1. Check `check:milestone-ready` job output
2. Look for open issues in the milestone
3. Close all issues to enable release

### Milestone shows 100% but release button still disabled

1. Check if milestone has version in title (e.g., "v0.2.4")
2. Verify `check:milestone-ready` job passed
3. Check job dependencies in pipeline

### Multiple milestones ready

The system will use the **most recent** milestone with all issues closed. If you have multiple ready milestones, close the older ones or rename them to remove the version.

## Future Enhancements

- [ ] Auto-close milestone when last issue closes (webhook)
- [ ] Scheduled job to check milestone status daily
- [ ] Slack/email notifications when milestone is ready
- [ ] Automatic MR creation from development → main when milestone ready
- [ ] Release notes generation from milestone issues

