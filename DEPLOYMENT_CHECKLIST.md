# Deployment Checklist - Enterprise Release Automation

## ✅ Phase 1: Code Deployment (COMPLETE)

- [x] Create release automation scripts
- [x] Integrate with CI/CD pipeline
- [x] Add dependencies
- [x] Run all tests (111 passing)
- [x] Push to GitLab
- [x] Create merge request

**MR URL**: https://gitlab.com/blueflyio/openstandardagents/-/merge_requests/new?merge_request%5Bsource_branch%5D=feat/release-gate-and-0.2.5-rc&merge_request%5Btarget_branch%5D=development

---

## 🔄 Phase 2: Configuration (TODO - After MR Merge)

### Step 1: GitLab Webhooks
Go to: Settings → Webhooks

**Webhook 1: Milestone Events**
```
URL: https://your-webhook-endpoint.com/milestone
Trigger: ☑ Milestone events
Secret Token: [Generate and save securely]
SSL verification: ☑ Enable
```

**Webhook 2: Push Events**
```
URL: https://your-webhook-endpoint.com/push  
Trigger: ☑ Push events (development branch only)
Secret Token: [Generate and save securely]
SSL verification: ☑ Enable
```

### Step 2: CI/CD Variables
Go to: Settings → CI/CD → Variables

```bash
# Required Variables
GITLAB_TOKEN        # Project Access Token (api, write_repository)
NPM_TOKEN           # npm automation token (from npmjs.com)
GITHUB_TOKEN        # GitHub Personal Access Token (repo, workflow)

# Optional Variables
SLACK_WEBHOOK       # Slack webhook URL for notifications
```

**To create GITLAB_TOKEN:**
1. Settings → Access Tokens
2. Name: "Release Automation"
3. Scopes: api, write_repository
4. Expiration: 1 year
5. Create token and save

**To create NPM_TOKEN:**
1. npmjs.com → Account → Access Tokens
2. Generate New Token → Automation
3. Copy token and save

**To create GITHUB_TOKEN:**
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Scopes: repo, workflow
4. Generate and save

### Step 3: Branch Protection
Go to: Settings → Repository → Protected branches

**main branch:**
```
Allowed to merge: Maintainers
Allowed to push: No one
Require approval: 2 approvals
Code owner approval: Required
```

**development branch:**
```
Allowed to merge: Maintainers
Allowed to push: Maintainers
Require approval: 1 approval
```

### Step 4: Enable GitLab Ultimate Features
Go to: Settings → General → Visibility

- ☑ Security Dashboard
- ☑ Compliance Framework
- ☑ Value Stream Analytics
- ☑ GitLab Duo

---

## 🧪 Phase 3: Testing (TODO - After Configuration)

### Test 1: Milestone Creation
```bash
# In GitLab UI:
1. Go to Issues → Milestones
2. Click "New milestone"
3. Title: "v0.2.7-test"
4. Description: "Test milestone for release automation"
5. Start date: Today
6. Due date: 1 week from now
7. Click "Create milestone"

# Verify:
- Tag created: v0.2.7-test-dev.0
- Branch created: milestone/v0.2.7-test
- Issue created: "Release v0.2.7-test"
```

### Test 2: Dev Tag Increment
```bash
# Create test feature
git checkout -b feat/test-automation development
echo "test" > test-automation.txt
git add test-automation.txt
git commit -m "test: release automation"
git push origin feat/test-automation

# Create MR to development
# Merge MR

# Verify:
- CI passes
- Tag incremented: v0.2.7-test-dev.1
- package.json updated
- Commit pushed to development
```

### Test 3: RC Creation
```bash
# In GitLab UI:
1. Close all issues in milestone v0.2.7-test
2. Go to Issues → Milestones → v0.2.7-test
3. Click "Close milestone"

# Verify:
- Tag created: v0.2.7-test-rc.1
- MR created: development → main
- Tracking issue updated
```

### Test 4: Release Buttons
```bash
# In GitLab Pipeline for main branch:
1. Click "🚀 Release to npm"
   - Verify dry-run passes
   - Verify npm publish succeeds
   
2. Click "🐙 Release to GitHub"
   - Verify GitHub release created
   - Verify artifacts uploaded
   
3. Click "🌐 Deploy Website"
   - Verify website deployed
   - Verify smoke tests pass
   
4. Click "📢 Announce Release"
   - Verify announcement issue created
```

---

## 📊 Phase 4: Monitoring (TODO - After Testing)

### Metrics to Track
- Release time (target: < 1 hour)
- Test pass rate (target: 100%)
- Security scan results (target: 0 critical)
- Deployment success rate (target: 100%)

### Alerts to Configure
- Critical: Security vulnerability detected
- Critical: Release failure
- Warning: Test failure rate increasing
- Warning: Performance degradation

---

## 🎯 Phase 5: Production Release (TODO - After Testing)

### First Production Release: v0.2.7
```bash
# 1. Create milestone
Milestone: v0.2.7
Description: First automated release

# 2. Develop features
- Work on milestone/v0.2.7 branch
- Merge features to development
- Watch dev tags increment

# 3. Close milestone
- Verify all issues closed
- Close milestone
- Review RC MR

# 4. Release
- Approve MR
- Merge to main
- Click release buttons
- Monitor deployment

# 5. Verify
- Check npm package
- Check GitHub release
- Check website
- Check announcements
```

---

## 📝 Success Criteria

### Must Pass
- [x] All tests passing (111/111)
- [ ] Webhooks configured and tested
- [ ] CI/CD variables set
- [ ] Branch protection enabled
- [ ] Test milestone cycle complete
- [ ] First production release successful

### Should Have
- [ ] GitLab Ultimate features enabled
- [ ] Monitoring dashboards configured
- [ ] Alerts configured
- [ ] Documentation complete
- [ ] Team trained

---

## 🚨 Rollback Plan

If anything goes wrong:

```bash
# 1. Revert CI changes
git revert <commit-hash>
git push origin development

# 2. Disable webhooks
Settings → Webhooks → Disable

# 3. Remove CI/CD variables
Settings → CI/CD → Variables → Delete

# 4. Use manual release process
Follow old release procedure
```

---

## 📞 Support

### Issues
- Create issue with label: `release-automation`
- Tag: `@maintainers`

### Emergency
- Rollback: Use "Rollback" button in pipeline
- Contact: Release Manager on-call

---

## 🎉 Next Steps

1. **Merge MR**: Review and merge to development
2. **Configure**: Complete Phase 2 configuration
3. **Test**: Run all Phase 3 tests
4. **Deploy**: Execute first production release
5. **Monitor**: Track metrics and iterate

**Let's make this happen!**
