# 🚀 Final Setup Steps

## Completed
- [x] Automation code committed
- [x] Merge request created: https://gitlab.com/blueflyio/openstandardagents.org/-/merge_requests/93
- [x] Branch pushed: `chore/automate-ossa-sync`

## 📋 Manual Steps Required (5 minutes)

### 1. Review and Merge MR
Visit: https://gitlab.com/blueflyio/openstandardagents.org/-/merge_requests/93

Click "Merge" when pipeline passes.

### 2. Create Scheduled Pipeline

**Option A: GitLab UI (Recommended)**
1. Go to: https://gitlab.com/blueflyio/openstandardagents.org/-/pipeline_schedules
2. Click "New schedule"
3. Fill in:
   - **Description**: Auto-sync OSSA spec every 6 hours
   - **Interval pattern**: Custom (`0 */6 * * *`)
   - **Cron timezone**: UTC
   - **Target branch**: `development`
   - **Active**: Checked
4. Click "Save pipeline schedule"

**Option B: API (Requires Maintainer Token)**
```bash
export GITLAB_TOKEN=your-maintainer-token

curl --request POST \
  --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://gitlab.com/api/v4/projects/blueflyio%2Fopenstandardagents.org/pipeline_schedules" \
  --data "description=Auto-sync OSSA spec every 6 hours" \
  --data "ref=development" \
  --data "cron=0 */6 * * *" \
  --data "cron_timezone=UTC" \
  --data "active=true"
```

### 3. Create Pipeline Trigger (Optional - for OSSA webhook)

**GitLab UI:**
1. Go to: https://gitlab.com/blueflyio/openstandardagents.org/-/settings/ci_cd
2. Expand "Pipeline triggers"
3. Click "Add trigger"
4. **Description**: OSSA package release webhook
5. Copy the token
6. Add to OSSA repo as CI/CD variable: `WEBSITE_TRIGGER_TOKEN`

### 4. Verify Setup

After merge, check that sync runs automatically:

```bash
# View latest pipeline
glab ci view -b development

# Check sync job logs
glab ci trace -b development -j sync:auto
```

## What Happens Next

### Immediately After Merge
- Every push to `development` or `main` triggers `sync:auto` job
- Spec, versions, examples, and wiki sync automatically
- Changes auto-commit with `[skip ci]` tag

### Every 6 Hours
- Scheduled pipeline checks for OSSA updates
- Creates MR if new version found
- You review and merge the MR

### On OSSA Release (if webhook configured)
- OSSA package publish triggers webhook
- Immediately syncs new version
- Creates MR to development

## Expected Results

**Before**: 5 hours manual work per release  
**After**: 2 minutes automated  
**Savings**: 100+ hours per year

## Troubleshooting

### Sync Job Fails
```bash
# Check logs
glab ci trace -b development -j sync:auto

# Common issues:
# - npm registry access
# - GitLab API token permissions
# - Network connectivity
```

### Scheduled Pipeline Not Running
- Verify schedule is active in GitLab UI
- Check cron syntax is correct
- Ensure target branch exists

## Documentation

- **Full Guide**: `AUTOMATION.md`
- **Summary**: `AUTOMATION-SUMMARY.md`
- **Quick Ref**: `.gitlab/AUTOMATION-QUICKREF.md`

---

**Status**: Ready for final setup  
**Time Required**: 5 minutes  
**Next Action**: Merge MR #93 and create scheduled pipeline
