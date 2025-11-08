# Quick Start: GitLab Migration

Get your GitLab project organized in 5 steps.

## Step 1: Verify Structure ✅

```bash
cd /Users/flux423/Sites/LLM/OSSA
.gitlab/scripts/verify-structure.sh
```

This verifies all files are in place.

## Step 2: Create Labels 🏷️

### Option A: Using Script (Recommended)

```bash
export GITLAB_TOKEN="your-token-here"
export PROJECT_ID="your-project-id"
.gitlab/scripts/create-labels.sh
```

### Option B: Manual Creation

1. Go to: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/labels
2. Click "New label"
3. Create labels from `.gitlab/labels-structure.md`

**Labels to create:**
- 8 Component labels
- 6 Type labels
- 4 Priority labels
- 5 Status labels
- 4 Audience labels

## Step 3: Add Issue Templates 📝

1. Go to: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/settings/templates
2. Upload templates from `.gitlab/issue_templates/`:
   - Bug-Report.md
   - Feature-Request.md
   - Documentation-Improvement.md
   - Migration-Guide-Request.md
   - Example-Request.md

## Step 4: Create/Update Milestones 🎯

### Create v0.2.3 Milestone

1. Go to: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/milestones
2. Click "New milestone"
3. Use content from `.gitlab/milestones/v0.2.3-Documentation-Examples.md`

### Update Existing Milestones

1. Open v0.3.0 milestone
2. Update using `.gitlab/milestones/v0.3.0-Gamma.md`
3. Open v1.0.0 milestone
4. Update using `.gitlab/milestones/v1.0.0-Genesis.md`

### Close Outdated Milestones

Close these Alpha milestones (they don't match actual releases):
- v0.1.0
- v0.1.2
- v0.1.3
- v0.1.4

## Step 5: Migrate Wiki 📚

Follow the detailed guide: `.gitlab/WIKI-MIGRATION-GUIDE.md`

**Quick version:**

1. Go to: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis
2. Create pages from `.gitlab/wiki-content/`:
   - Start with `00-HOME.md` → Create as "Home"
   - Create Getting-Started pages
   - Create For-Audiences pages
   - Create Examples pages
3. Update links to use GitLab wiki format
4. Test navigation

## Step 6: Organize Issues 🔧

1. Go to: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues
2. For each issue:
   - Apply appropriate labels
   - Assign to milestone
   - Link to related wiki/docs
3. Use filters to organize:
   - Filter by component
   - Filter by type
   - Filter by priority

## Verification Checklist

After completing all steps:

- [ ] All labels created (27 total)
- [ ] Issue templates added (5 templates)
- [ ] Milestones created/updated (3 milestones)
- [ ] Wiki pages created (10+ pages)
- [ ] All wiki links work
- [ ] Issues organized with labels
- [ ] Issues assigned to milestones
- [ ] Cross-references verified

## Need Help?

- **Detailed guides**: See `.gitlab/` directory
- **Migration guide**: `.gitlab/WIKI-MIGRATION-GUIDE.md`
- **Cross-references**: `.gitlab/CROSS-REFERENCES.md`
- **Audit summary**: `.gitlab/AUDIT-SUMMARY.md`
- **Complete status**: `.gitlab/IMPLEMENTATION-COMPLETE.md`

## Estimated Time

- Step 1 (Verify): 1 minute
- Step 2 (Labels): 5-10 minutes (script) or 30 minutes (manual)
- Step 3 (Templates): 5 minutes
- Step 4 (Milestones): 10-15 minutes
- Step 5 (Wiki): 30-60 minutes
- Step 6 (Issues): 15-30 minutes

**Total**: ~1.5-2 hours

## Next Steps After Migration

1. Announce new wiki structure
2. Update README links to wiki
3. Train team on new structure
4. Start using issue templates
5. Track milestone progress

---

**Ready to start?** Run the verification script first!

```bash
.gitlab/scripts/verify-structure.sh
```

