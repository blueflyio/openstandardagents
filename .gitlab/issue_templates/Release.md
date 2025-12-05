---
name: Release
about: Track and execute a version release
labels: type::release, priority::must
---

## Release v%{version}

**Milestone:** [v%{version}](%{milestone_url})
**Target Date:** %{due_date}

---

### Pre-Release Checklist

#### Code Complete
- [ ] All milestone issues closed (except this one)
- [ ] All milestone MRs merged to `development`
- [ ] No open blockers or critical bugs

#### Quality Gates
- [ ] CI pipeline passing on `development`
- [ ] Schema validates: `npm run validate:schema`
- [ ] Tests passing: `npm test`
- [ ] No TypeScript errors: `npm run typecheck`

#### Documentation
- [ ] CHANGELOG.md updated
- [ ] README.md version references updated
- [ ] Migration guide (if breaking changes)

---

### Issues Included in This Release

<!--
This section auto-populates when using the release automation.
Or manually list issues:
-->

%{issues_list}

---

### Changelog Preview

```markdown
## [v%{version}] - %{release_date}

### Added
-

### Changed
-

### Fixed
-

### Security
-
```

---

### Release Process

**When all checklist items are complete:**

1. ✅ Close this issue
2. 🤖 Automation triggers:
   - Creates MR: `development` → `main`
   - Assigns milestone `v%{version}`
   - Adds to merge train
3. 🚀 After merge train completes:
   - npm package published
   - Git tag created
   - GitHub mirror synced
   - Milestone closed

---

### Post-Release Verification

- [ ] npm package available: `npm view @bluefly/openstandardagents@%{version}`
- [ ] GitLab release created
- [ ] GitHub release synced
- [ ] Milestone closed
- [ ] Next milestone created

---

/label ~"type::release" ~"priority::must"
/milestone %{milestone}
