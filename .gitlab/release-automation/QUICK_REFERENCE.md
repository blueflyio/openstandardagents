# Release Automation - Quick Reference

## 🎯 After MR Merge

### 1. Run Setup Script
```bash
git checkout development
git pull origin development
./.gitlab/release-automation/setup.sh
```

### 2. Configure GitLab (5 minutes)

**Webhooks** (Settings → Webhooks):
- Milestone events → `https://your-endpoint.com/milestone`
- Push events → `https://your-endpoint.com/push`

**CI/CD Variables** (Settings → CI/CD → Variables):
- `GITLAB_TOKEN` - Project Access Token
- `NPM_TOKEN` - npm automation token
- `GITHUB_TOKEN` - GitHub PAT

**Branch Protection** (Settings → Repository):
- `main`: 2 approvals, no push
- `development`: 1 approval, maintainer push

### 3. Test (10 minutes)

```bash
# Create test milestone
Milestone: v0.2.7-test

# Verify auto-creation
- Tag: v0.2.7-test-dev.0 ✓
- Branch: milestone/v0.2.7-test ✓
- Issue: "Release v0.2.7-test" ✓

# Test dev increment
git checkout -b feat/test development
echo "test" > test.txt
git add test.txt && git commit -m "test"
git push && create MR → merge

# Verify increment
- Tag: v0.2.7-test-dev.1 ✓
- package.json updated ✓

# Test RC creation
Close milestone → verify:
- Tag: v0.2.7-test-rc.1 ✓
- MR: development → main ✓
```

---

## 📋 Daily Workflow

### Creating a Release

```bash
# 1. Create milestone
Milestone: v0.2.7
Due date: 1 week

# 2. Develop features
git checkout -b feat/my-feature milestone/v0.2.7
# ... make changes ...
git push && create MR to development

# 3. Watch automation
- Every merge → dev tag increments
- Track progress in milestone

# 4. Close milestone
- All issues closed
- Close milestone
- RC created automatically
- MR to main created

# 5. Release
- Review MR
- Approve (2 approvals required)
- Merge to main
- Click release buttons:
  🚀 Release to npm
  🐙 Release to GitHub
  🌐 Deploy Website
  📢 Announce
```

---

## 🔧 Common Tasks

### Check Current Version
```bash
cat package.json | grep version
git tag -l | tail -5
```

### View Release Status
```bash
# Check CI pipeline
glab ci view

# Check latest tags
git tag -l "v*-dev*" | tail -5
git tag -l "v*-rc*" | tail -5
```

### Manual Tag Creation (Emergency)
```bash
# Only if automation fails
git tag -a v0.2.7-dev.1 -m "Manual dev tag"
git push origin v0.2.7-dev.1
```

### Rollback Release
```bash
# In GitLab Pipeline
Click "Rollback" button

# Or manual
npm deprecate @bluefly/openstandardagents@0.2.7 "Rolled back"
git revert <commit>
git push origin main
```

---

## 🚨 Troubleshooting

### Webhook Not Triggering
```bash
# Check webhook logs
Settings → Webhooks → Recent Deliveries

# Test manually
curl -X POST https://your-endpoint.com/milestone \
  -H "X-Gitlab-Token: SECRET" \
  -d @test-payload.json
```

### Dev Tag Not Incrementing
```bash
# Check CI logs
CI/CD → Pipelines → increment-dev-tag job

# Verify permissions
Settings → CI/CD → Token Access → Enable
```

### Release Button Not Showing
```bash
# Must be on main branch
# All previous stages must pass
# Must have Maintainer role
```

---

## 📊 Metrics Dashboard

### Key Metrics
- Release frequency: Target 1/week
- Lead time: Target < 1 day
- Deployment success: Target 100%
- Rollback time: Target < 5 min

### Where to Check
- GitLab: Analytics → Value Stream
- npm: Package downloads
- GitHub: Release stats
- Website: Analytics

---

## 🔗 Quick Links

- **Strategy**: `ENTERPRISE_RELEASE_STRATEGY.md`
- **Summary**: `RELEASE_AUTOMATION_SUMMARY.md`
- **Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Roadmap**: `IMPLEMENTATION_ROADMAP.md`
- **Setup**: `setup.sh`

---

## 💡 Tips

- Always work on milestone branches
- Let automation handle versioning
- Review RC MRs carefully
- Monitor first few releases closely
- Document any issues
- Iterate and improve

---

**Questions?** Check `START_HERE.md` or create an issue with label `release-automation`
