# Squash Merge Policy

**Issue**: #95
**Status**: Active
**Effective Date**: 2025-12-03

## Overview

This project **encourages squash merging** for feature branches to maintain a clean, linear git history that makes it easier to:
- Understand project evolution
- Perform git bisect operations
- Generate accurate changelogs
- Review historical changes

## Configuration

### GitLab Settings (Manual Configuration Required)

**Location**: Settings → Merge Requests → Squash commits when merging

**Recommended Setting**: **Encourage**

This setting:
- ✅ Pre-selects the squash checkbox on new merge requests
- ✅ Allows contributors to disable if needed (for special cases)
- ✅ Provides clear guidance without being overly restrictive

### Alternative Options (Not Recommended)

- `default_on`: Squash checkbox is checked by default but can be unchecked (weaker than "encourage")
- `default_off`: Squash checkbox is unchecked by default (not recommended)
- `always`: Force squashing on all MRs (too restrictive)
- `do_not_allow`: Prevent squashing (opposite of our goal)

## When to Squash

### Always Squash (Encouraged)

- ✅ Feature branches (`feat/*`)
- ✅ Bug fix branches (`fix/*`)
- ✅ Refactoring branches (`refactor/*`)
- ✅ Chore branches (`chore/*`)
- ✅ Documentation branches with multiple WIP commits (`docs/*`)

### Consider Preserving History (Case-by-Case)

- ⚠️ Major architectural changes with significant historical value
- ⚠️ Merge commits from long-lived release branches
- ⚠️ Contributions with co-authors requiring attribution

## Best Practices

### 1. Squash Commit Message Format

Follow conventional commits format for the squash commit:

```
<type>(<scope>): <summary of all changes>

<detailed description of changes>
- Change 1
- Change 2
- Change 3

<footer with issue references>
Closes #123
Co-authored-by: Name <email>
```

### 2. Pre-Merge Checklist

Before squashing and merging:

- [ ] Review all commits being squashed
- [ ] Verify the squash commit message accurately summarizes all changes
- [ ] Ensure issue references are included (`Closes #123`)
- [ ] Include co-author credits if applicable
- [ ] Confirm the commit type is correct for semantic versioning

### 3. Writing Good Squash Commit Messages

**Bad Example** (too vague):
```
fix: various fixes
```

**Good Example** (clear and detailed):
```
fix(validation): resolve schema validation edge cases

- Fix null handling in CrewAI extension validator
- Add validation for missing required fields
- Improve error messages for invalid enum values
- Add regression tests for all edge cases

Closes #456, Closes #457
```

## Benefits of Squash Merging

### For Developers

- **Cleaner history**: One commit per feature/fix instead of dozens of WIP commits
- **Easier review**: Reviewers see the final result, not the messy development process
- **Better documentation**: Each commit message is a comprehensive summary

### For Project Maintenance

- **Accurate changelogs**: Automated tools (semantic-release) work better with clean history
- **Easier bisecting**: Each commit is a complete, working change
- **Simpler reverts**: Reverting a feature reverts all related changes at once

### For Versioning

- **Reliable semantic versioning**: Each commit clearly indicates version impact
- **Better release notes**: Squashed commits provide clear, concise release descriptions

## Implementation

### Configuration Files

- **`.gitlab/merge-request-settings.yml`**: Contains `squash_option: encourage`
- **`.gitlab/merge_request_templates/Default.md`**: Includes squash reminder in checklist
- **`CONTRIBUTING.md`**: Documents squash merge workflow and best practices

### Manual Configuration Steps

Since GitLab merge request settings are not fully automatable via YAML, the following must be configured manually:

1. Navigate to: **Settings → Merge Requests**
2. Find: **Squash commits when merging**
3. Select: **Encourage**
4. Click: **Save changes**

## Exceptions

Squashing can be disabled for specific merge requests when:

1. **Historical preservation is critical**: Major architectural changes requiring detailed history
2. **Multiple authors need credit**: Preserving individual commit authorship
3. **Merge from release branch**: Preserving release branch history

**Note**: Exceptions require explicit justification in the MR description.

## Enforcement

- **Manual**: Reviewers should remind contributors to enable squash if forgotten
- **Soft enforcement**: The "encourage" setting makes squashing the default choice
- **No hard requirement**: Allows flexibility for exceptional cases

## Related Documentation

- [CONTRIBUTING.md](../../../CONTRIBUTING.md) - Squash Merge Workflow section
- [.gitlab/merge-request-settings.yml](../../merge-request-settings.yml) - Configuration file
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit message format
- [Semantic Versioning](https://semver.org/) - Version numbering strategy

## References

- GitLab Docs: [Squash and merge](https://docs.gitlab.com/ee/user/project/merge_requests/squash_and_merge.html)
- Issue #95: Configure Squash Merge as Default for Feature Branches
