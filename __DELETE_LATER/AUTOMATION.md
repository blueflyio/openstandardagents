# OSSA Website Automation

## Overview

All OSSA spec, schema, version, and example syncing is **fully automated** in CI/CD. No manual intervention required.

## Automated Sync Triggers

### 1. On Every Push (development/main)
- Runs `sync:auto` job in CI
- Fetches latest OSSA spec from npm
- Syncs versions, examples, and wiki
- Auto-commits changes with `[skip ci]` tag
- **Duration**: ~2 minutes

### 2. Scheduled (Every 6 Hours)
- Checks for new OSSA package versions
- Creates MR if updates found
- **Schedule**: 00:00, 06:00, 12:00, 18:00 UTC
- **Branch**: `chore/auto-sync-YYYYMMDD-HHMMSS`

### 3. Webhook (OSSA Release)
- Triggered by OSSA package publish
- Immediately syncs new version
- Creates MR to development
- **Branch**: `chore/sync-ossa-{version}`

## What Gets Synced

| Item | Source | Destination | Script |
|------|--------|-------------|--------|
| OSSA Spec | `@bluefly/ossa` npm | `public/spec/` | `fetch-spec.js` |
| Versions | npm registry | `public/versions.json` | `fetch-versions.js` |
| Version in UI | `package.json` | `src/config/version.ts` | `sync-version.js` |
| Examples | OSSA repo | `public/examples/` | `fetch-examples.js` |
| Wiki | GitLab wiki | `content/wiki/` | `sync-wiki.ts` |

## CI/CD Pipeline Stages

```
sync → validate → test → build → security → quality → deploy → release
```

### Sync Stage (NEW)
- **Job**: `sync:auto`
- **Runs on**: development, main branches
- **Duration**: ~2 minutes
- **Failure**: Blocks pipeline

## Setup Instructions

### 1. Enable Scheduled Pipeline

```bash
# In GitLab UI: CI/CD → Schedules → New schedule
# Or via API:
curl --request POST \
  --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents.org/pipeline_schedules" \
  --data "description=Auto-sync OSSA spec" \
  --data "ref=development" \
  --data "cron=0 */6 * * *" \
  --data "cron_timezone=UTC" \
  --data "active=true"
```

### 2. Configure Webhook (Optional)

In OSSA package repo, add webhook:

```bash
# Webhook URL
https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents.org/trigger/pipeline

# Trigger token (create in GitLab UI: Settings → CI/CD → Pipeline triggers)
# Add to OSSA repo's .gitlab-ci.yml:

notify:website:
  stage: .post
  image: alpine:latest
  script:
    - |
      curl --request POST \
        --form "token=${WEBSITE_TRIGGER_TOKEN}" \
        --form "ref=development" \
        --form "variables[OSSA_VERSION]=${CI_COMMIT_TAG}" \
        "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents.org/trigger/pipeline"
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/
```

### 3. Required CI/CD Variables

| Variable | Description | Scope |
|----------|-------------|-------|
| `CI_JOB_TOKEN` | Auto-provided by GitLab | All jobs |
| `GITLAB_TOKEN` | Personal access token (optional) | Protected |
| `WEBSITE_TRIGGER_TOKEN` | Pipeline trigger token | Protected |

## Manual Sync (Emergency)

If automation fails, run locally:

```bash
cd website
npm run fetch-spec
npm run fetch-versions
npm run sync-version
npm run fetch-examples
npm run sync-wiki
git add -A
git commit -m "chore: manual sync"
git push
```

## Monitoring

### Check Sync Status

```bash
# Latest sync job
glab ci view --branch development

# Scheduled pipelines
glab ci list --status scheduled
```

### Logs

```bash
# View sync job logs
glab ci trace -b development -j sync:auto
```

## Troubleshooting

### Sync Job Fails

1. Check npm registry access
2. Verify `@bluefly/ossa` package exists
3. Check GitLab API token permissions
4. Review job logs: `glab ci trace`

### MR Not Created

1. Verify `CI_JOB_TOKEN` has API access
2. Check branch protection rules
3. Ensure no duplicate MRs exist

### Wiki Sync Fails

1. Check wiki repository access
2. Verify wiki exists and has content
3. Review `sync-wiki.ts` script logs

## Benefits

✅ **Zero manual work** - Everything syncs automatically  
✅ **Fast releases** - No 5-hour sync process  
✅ **Audit trail** - All changes via MRs  
✅ **Rollback ready** - Git history preserved  

## Migration from Manual Process

**Before**: 5 hours per release  
**After**: 2 minutes automated  
**Savings**: 4h 58m per release  
**ROI**: 100+ hours saved per year (assuming 20 releases)
