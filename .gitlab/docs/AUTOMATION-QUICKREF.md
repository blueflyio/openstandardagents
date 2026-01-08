# 🚀 OSSA Automation Quick Reference

## TL;DR

**Everything syncs automatically. You don't need to do anything.**

## What Happens Automatically

| Event | Action | Duration |
|-------|--------|----------|
| Push to dev/main | Sync spec, versions, examples, wiki | 2 min |
| Every 6 hours | Check for OSSA updates, create MR if found | 3 min |
| OSSA release | Immediately sync new version, create MR | 2 min |

## Manual Override (Emergency Only)

```bash
cd website
npm run fetch-spec && npm run fetch-versions && npm run sync-version && npm run fetch-examples && npm run sync-wiki
git add -A && git commit -m "chore: manual sync" && git push
```

## Check Status

```bash
# View latest sync
glab ci view -b development

# View logs
glab ci trace -b development -j sync:auto
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Sync job fails | Check npm registry access, retry pipeline |
| MR not created | Verify CI_JOB_TOKEN permissions |
| Wiki sync fails | Check wiki repo access |

## Setup (One-Time)

```bash
export GITLAB_TOKEN=glpat-xxxxxxxxxxxx
./scripts/setup-automation.sh
```

## Files Changed

- `.gitlab-ci.yml` - Added sync stage
- `.gitlab/ci/scheduled-sync.yml` - Scheduled pipeline
- `.gitlab/ci/webhook-sync.yml` - Webhook pipeline

## Support

📖 Full docs: `AUTOMATION.md`  
🐛 Issues: https://gitlab.com/blueflyio/openstandardagents.org/-/issues
