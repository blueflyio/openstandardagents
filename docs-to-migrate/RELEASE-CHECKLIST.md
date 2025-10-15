# OSSA v1.0.0 Release Checklist

## Pre-Release: Add NPM_TOKEN to GitLab

### Get Your npm Token

```bash
# Login to npm
npm login

# Generate an automation token
npm token create --read-only=false
```

Copy the token (starts with `npm_...`)

### Add to GitLab CI/CD Variables

1. Go to: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/settings/ci_cd
2. Expand "Variables"
3. Click "Add variable"
   - **Key**: `NPM_TOKEN`
   - **Value**: Your npm token (paste it)
   - **Type**: Variable
   - **Environment scope**: All
   - **Protect variable**: ✅ Yes
   - **Mask variable**: ✅ Yes
4. Click "Add variable"

## Local Testing

```bash
cd /Users/flux423/Sites/LLM/OSSA

# Install dependencies
npm install

# Run tests
npm test

# Validate examples
npm run validate:examples

# Test CLI
./cli/bin/ossa --version
./cli/bin/ossa validate examples/compliance-agent.yml
```

## Git Commit & Push

```bash
git status
git add .
git commit -m "feat: OSSA v1.0.0 - Enterprise-ready specification standard

BREAKING CHANGE: Package renamed to @bluefly/open-standards-scalable-agents

Major Changes:
- Add Apache 2.0 LICENSE for enterprise legal review
- Reduce dependencies from 8 to 4 (removed runtime services: qdrant, redis, pg, zod)
- Clean up documentation from 119 to 6 core files (95% reduction)
- Add npm publishing pipeline with manual approval
- Unify version to 1.0.0 across all files
- Professional documentation matching Google/GitLab/OpenAI standards
- Fix package naming consistency
- Add comprehensive transformation plan and roadmap

Technical Improvements:
- Package size reduced from 12MB+ to ~1MB
- Restored 'lightweight standard' positioning
- Clear separation: OSSA = standard, agent-buildkit = implementation
- Production-ready publishing pipeline

Documentation:
- 113 files staged for GitLab Wiki migration (docs-to-migrate/)
- New getting-started.md with clear technical quickstart
- Updated README with correct badges and npm package references
- Comprehensive CHANGELOG with migration notes

This release positions OSSA as the industry standard for AI agents,
comparable to OpenAPI for REST APIs."

git push origin main
```

## GitLab Pipeline Release

### 1. Watch Pipeline

- Go to: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/pipelines
- Wait for pipeline to complete all stages:
  - ✅ validate
  - ✅ test
  - ✅ build
  - ✅ pages

### 2. Create GitLab Release (Manual)

When pipeline is green, click "▶️" next to `release:gitlab` job

This creates:

- GitLab Release v1.0.0
- Git tag v1.0.0
- Release notes from CHANGELOG

### 3. Publish to npm (Manual)

After GitLab release succeeds, click "▶️" next to `release:npm` job

This publishes to: https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents

### 4. Verify Publication

```bash
# Check npm
npm view @bluefly/open-standards-scalable-agents

# Install globally
npm install -g @bluefly/open-standards-scalable-agents

# Test CLI
ossa --version  # Should show: 1.0.0
ossa --help
ossa validate examples/minimal/minimal-agent.yaml
```

## Post-Release Tasks

### Immediate

- [ ] Verify npm package is public and installable
- [ ] Test all CLI commands work
- [ ] Check GitLab release notes look good
- [ ] Monitor for immediate issues

### This Week

- [ ] Start migrating docs-to-migrate/ content to GitLab Wiki
- [ ] Create SECURITY.md policy
- [ ] Create 10 GitLab Issues from transformation plan
- [ ] Update agent-buildkit to reference OSSA v1.0.0

### This Month

- [ ] Write 3 Wiki blog posts
- [ ] Design OSSA Certification Program
- [ ] Create backwards compatibility policy
- [ ] Launch community calls

## Rollback (If Needed)

### If npm publish fails:

```bash
# Unpublish (within 72 hours only)
npm unpublish @bluefly/open-standards-scalable-agents@1.0.0

# Or deprecate
npm deprecate @bluefly/open-standards-scalable-agents@1.0.0 "Deprecated due to [issue]"
```

### If GitLab release has issues:

```bash
# Delete tag locally and remotely
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Fix issues, then create v1.0.1
```

## Success Criteria

✅ **Technical**

- [ ] npm package published successfully
- [ ] CLI commands work globally after `npm install -g`
- [ ] All examples validate
- [ ] No critical bugs reported in first 24 hours

✅ **Documentation**

- [ ] README displays correctly on npm
- [ ] GitLab Wiki migration started
- [ ] Release notes are comprehensive

✅ **Positioning**

- [ ] Package description is clear
- [ ] "OpenAPI for AI Agents" messaging consistent
- [ ] Links to GitLab, Wiki, and docs working

---

**Status**: Ready for Release  
**Prepared**: October 14, 2025  
**Version**: 1.0.0
