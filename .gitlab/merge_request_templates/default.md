## Description

<!-- Provide a clear and concise description of the changes -->

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Configuration change
- [ ] Refactoring (no functional changes)
- [ ] Test improvements
- [ ] CI/CD changes

## Related Issues

<!-- Link related issues below. Use "Closes #XXX" to auto-close on merge -->
Closes #

## Agent Assistance

<!-- Agents are automatically invoked based on file changes. Check additional agents as needed -->

### Enabled by Default
- [x] `@bot-mr-reviewer` - Code review and quality checks

### Optional Agents
- [ ] `@bot-ossa-validator` - Validate OSSA manifest schemas
- [ ] `@bot-gitlab-ci-fixer` - CI/CD pipeline validation and fixes
- [ ] `@bot-docs-sync` - Documentation synchronization

### Manual Commands
```
/review full          - Request comprehensive code review
/review security      - Security-focused review
/validate --strict    - Strict schema validation
/fix pipeline         - Auto-fix CI pipeline issues
```

## Checklist

### Author
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

### Reviewer
- [ ] Code quality meets project standards
- [ ] No security vulnerabilities introduced
- [ ] Test coverage is adequate
- [ ] Documentation is updated if needed

## Screenshots/Demo

<!-- If applicable, add screenshots or screen recordings to demonstrate the changes -->

## Additional Notes

<!-- Any additional information that reviewers should know -->

/label ~needs-review ~agent-assisted
/assign_reviewer @bot-mr-reviewer
