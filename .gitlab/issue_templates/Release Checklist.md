## Release Checklist for v[VERSION]

**Milestone:** v[VERSION] - [Feature Name]

This checklist ensures all required tasks are completed before releasing a new version.

---

### 📋 Pre-Release Requirements

#### Version & Documentation
- [ ] Update `package.json` version to `[VERSION]`
- [ ] Run `npx tsx scripts/sync-versions.ts --fix` to sync all version references
- [ ] Verify `spec/v[VERSION]/` directory exists with schema files
- [ ] Update README.md with new version references
- [ ] Verify all documentation links point to correct version

#### Code Quality
- [ ] All unit tests passing (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Security audit reviewed (`npm audit`)
- [ ] Build succeeds (`npm run build`)

#### Specification
- [ ] JSON Schema updated in `spec/v[VERSION]/ossa-[VERSION].schema.json`
- [ ] Schema validation tests added/updated
- [ ] Example manifests validated against new schema
- [ ] Breaking changes documented (if any)

#### Website & Documentation
- [ ] Website builds successfully
- [ ] Wiki content synced
- [ ] Changelog/release notes drafted
- [ ] Migration guide written (if breaking changes)

---

### 🚀 Release Process

#### Milestone Completion
- [ ] All issues in milestone closed
- [ ] Milestone marked as **CLOSED**
- [ ] No open issues remaining in milestone

#### CI/CD Validation
- [ ] `validate:version-sync` job passes
- [ ] `validate:docs-consistency` job passes
- [ ] `detect:milestone-version` detects correct version
- [ ] `release:preview` shows expected version

#### Final Steps
- [ ] Review `release:preview` output
- [ ] Trigger `release:main` job (automatic when milestone closed)
- [ ] Verify npm package published
- [ ] Verify git tag created (`v[VERSION]`)
- [ ] Deploy website using `pages` job
- [ ] Verify GitHub mirror synced

---

### ✅ Post-Release

- [ ] Test npm package installation: `npm install @bluefly/openstandardagents@[VERSION]`
- [ ] Verify website live at https://blueflyio.gitlab.io/openstandardagents
- [ ] Create announcement (if needed)
- [ ] Close this issue
- [ ] Create next milestone

---

### 📝 Notes

<!-- Add any version-specific notes, breaking changes, or special considerations here -->

---

**Quick Commands:**
```bash
# Sync versions
npx tsx scripts/sync-versions.ts --fix

# Validate everything
npx tsx scripts/sync-versions.ts --check
npm run build
npm run test
npm run lint

# Check what version will be released
git log --oneline origin/main..HEAD
```