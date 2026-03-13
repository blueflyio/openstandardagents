# 🚀 START HERE: Enterprise Release Automation

## What You Need to Know

This directory contains the **enterprise-grade release automation system** for OSSA.

**Critical**: This system controls releases that affect thousands of projects. Every step is validated, audited, and reversible.

---

## Quick Links

- **Strategy**: `../../ENTERPRISE_RELEASE_STRATEGY.md` - Full strategy document
- **Summary**: `../../RELEASE_AUTOMATION_SUMMARY.md` - Executive summary
- **Roadmap**: `./IMPLEMENTATION_ROADMAP.md` - 20-day implementation plan

---

## How It Works

### 1. Milestone Created → Auto-Tag
```bash
# When you create milestone "v0.2.7" in GitLab:
✅ Creates tag: v0.2.7-dev.0
✅ Creates branch: milestone/v0.2.7
✅ Creates issue: "Release v0.2.7"
```

### 2. Merge to Development → Auto-Increment
```bash
# Every successful merge to development:
✅ Runs full CI pipeline
✅ If pass: v0.2.7-dev.1 → v0.2.7-dev.2 → v0.2.7-dev.N
✅ Updates package.json
✅ Commits and pushes
```

### 3. Milestone Closed → Create RC
```bash
# When all issues resolved and milestone closed:
✅ Creates tag: v0.2.7-rc.1
✅ Creates MR: development → main
✅ Runs all validations
✅ Requires approvals
```

### 4. Release to Production → Manual Buttons
```bash
# In GitLab Pipeline UI:
🚀 Release to npm      (requires: all checks passed, 2 approvals)
🐙 Release to GitHub   (requires: npm released)
🌐 Deploy Website      (requires: GitHub released)
📢 Announce Release    (requires: website deployed)
```

---

## Immediate Setup (Do This First)

### Step 1: Install Dependencies
```bash
npm install --save-dev @gitbeaker/node @octokit/rest
```

### Step 2: Configure GitLab Webhooks
Go to: Settings → Webhooks

**Webhook 1: Milestone Events**
- URL: `https://your-webhook-endpoint.com/milestone`
- Trigger: Milestone events
- Secret Token: (generate and save)

**Webhook 2: Push Events**  
- URL: `https://your-webhook-endpoint.com/push`
- Trigger: Push events (development branch only)
- Secret Token: (generate and save)

### Step 3: Set CI/CD Variables
Go to: Settings → CI/CD → Variables

```bash
GITLAB_TOKEN        # Project Access Token (api, write_repository)
NPM_TOKEN           # npm automation token
GITHUB_TOKEN        # GitHub Personal Access Token
SLACK_WEBHOOK       # Slack webhook URL (optional)
```

### Step 4: Configure Branch Protection
Go to: Settings → Repository → Protected branches

**main branch:**
- Allowed to merge: Maintainers
- Allowed to push: No one
- Require approval: 2 approvals
- Code owner approval: Required

**development branch:**
- Allowed to merge: Maintainers
- Allowed to push: Maintainers  
- Require approval: 1 approval

### Step 5: Enable GitLab Ultimate Features
Go to: Settings → General → Visibility

- ✅ Security Dashboard
- ✅ Compliance Framework
- ✅ Value Stream Analytics
- ✅ GitLab Duo

### Step 6: Replace CI Pipeline
```bash
# Backup current pipeline
cp .gitlab-ci.yml .gitlab-ci.yml.backup

# Use new pipeline
cp .gitlab/release-automation/gitlab-ci-release.yml .gitlab-ci.yml

# Commit and push
git add .gitlab-ci.yml
git commit -m "feat: implement enterprise release pipeline"
git push
```

---

## Testing the System

### Test 1: Milestone Creation
```bash
# In GitLab:
1. Go to Issues → Milestones
2. Create milestone: "v0.2.7-test"
3. Verify:
   - Tag created: v0.2.7-test-dev.0
   - Branch created: milestone/v0.2.7-test
   - Issue created: "Release v0.2.7-test"
```

### Test 2: Dev Tag Increment
```bash
# Create feature branch
git checkout -b feat/test-release development
echo "test" > test.txt
git add test.txt
git commit -m "test: release automation"
git push origin feat/test-release

# Create MR to development
# Merge MR
# Verify:
#   - CI passes
#   - Tag incremented: v0.2.7-test-dev.1
#   - package.json updated
```

### Test 3: RC Creation
```bash
# In GitLab:
1. Close all issues in milestone
2. Close milestone: "v0.2.7-test"
3. Verify:
   - Tag created: v0.2.7-test-rc.1
   - MR created: development → main
   - Tracking issue updated
```

### Test 4: Release Buttons
```bash
# In GitLab Pipeline for main branch:
1. Click "🚀 Release to npm"
2. Verify dry-run passes
3. Verify npm publish succeeds
4. Click "🐙 Release to GitHub"
5. Verify GitHub release created
6. Click "🌐 Deploy Website"
7. Verify website deployed
```

---

## File Structure

```
.gitlab/release-automation/
├── START_HERE.md                    # ← You are here
├── IMPLEMENTATION_ROADMAP.md        # 20-day implementation plan
├── gitlab-ci-release.yml            # Enhanced CI pipeline
├── webhooks/
│   └── milestone-handler.ts         # Milestone automation
├── scripts/
│   ├── release-buttons.ts           # Manual release triggers
│   └── increment-dev-tag.ts         # Auto-increment dev tags
├── agents/                          # OSSA agents (future)
│   ├── release-manager.yaml
│   ├── security-scanner.yaml
│   └── documentation-agent.yaml
└── policies/                        # Security policies (future)
    ├── security-policy.yaml
    └── compliance-policy.yaml
```

---

## Troubleshooting

### Webhook not triggering
```bash
# Check webhook logs
Settings → Webhooks → Recent Deliveries

# Test webhook
curl -X POST https://your-webhook-endpoint.com/milestone \
  -H "Content-Type: application/json" \
  --header "AUTH_HEADER_NAME: AUTH_HEADER_VALUE" \
  -d @test-payload.json
```

### Dev tag not incrementing
```bash
# Check CI logs
CI/CD → Pipelines → Latest pipeline → increment-dev-tag job

# Verify CI_JOB_TOKEN has permissions
Settings → CI/CD → Token Access → Enable
```

### Release button not appearing
```bash
# Verify you're on main branch
# Verify all previous stages passed
# Verify you have Maintainer role
# Check pipeline configuration
```

### Rollback needed
```bash
# In GitLab Pipeline:
1. Click "Rollback" button
2. Verify npm deprecation
3. Verify GitHub revert
4. Verify website rollback
5. Create hotfix branch
6. Fix issue
7. Release hotfix
```

---

## Support

### Documentation
- Strategy: `../../ENTERPRISE_RELEASE_STRATEGY.md`
- Summary: `../../RELEASE_AUTOMATION_SUMMARY.md`
- Roadmap: `./IMPLEMENTATION_ROADMAP.md`

### Issues
- Create issue with label: `release-automation`
- Tag: `@maintainers`

### Emergency
- Rollback: Use "Rollback" button in pipeline
- Contact: Release Manager on-call

---

## Next Steps

1. ✅ Read this document
2. ⬜ Complete "Immediate Setup" steps
3. ⬜ Run "Testing the System" tests
4. ⬜ Review implementation roadmap
5. ⬜ Start Phase 1 (Days 1-3)

---

**Questions? Start with the Executive Summary: `../../RELEASE_AUTOMATION_SUMMARY.md`**

**Ready to implement? Follow the Roadmap: `./IMPLEMENTATION_ROADMAP.md`**

**Need details? Read the Strategy: `../../ENTERPRISE_RELEASE_STRATEGY.md`**
