---
title: "Enforcement Rules"
---

# Enforcement Rules

## Overview

Automated policy enforcement rules that validate and block non-compliant changes.

## Policy Enforcement Rules

### Rule 1: Branch Naming
- **Pattern**: `{type}/{issue#}-{slug}`
- **Validation**: Enforced in `.pre` stage
- **Action**: Block pipeline if invalid

### Rule 2: Commit Message
- **Format**: Conventional commits
- **Validation**: Enforced on push
- **Action**: Warn (non-blocking)

### Rule 3: MR Target
- **Requirement**: Feature → release/*, Release → main
- **Validation**: Enforced in `validate` stage
- **Action**: Block MR merge if invalid

### Rule 4: Issue Linkage
- **Requirement**: MR must link to issue
- **Validation**: Enforced in `validate` stage
- **Action**: Block MR merge if missing

### Rule 5: Milestone Assignment
- **Requirement**: MR must have milestone
- **Validation**: Enforced in `validate` stage
- **Action**: Block MR merge if missing

## Bot-Specific Rules

### bot-ossa-validator
- Validates OSSA manifests
- Blocks MR if non-compliant
- Provides fix suggestions

### bot-policy-enforcer
- Enforces all policies
- Blocks MR on violations
- Provides remediation steps

### bot-security-scanner
- Scans for security issues
- Blocks MR on critical vulnerabilities
- Provides security recommendations

## Enforcement Levels

### Strict
- All rules enforced
- Blocking on violations
- No overrides allowed

### Moderate (Default)
- Critical rules enforced
- Warnings for minor violations
- Override with approval

### Permissive
- Warnings only
- No blocking
- For development branches

## Implementation

### CI/CD Integration
```yaml
validate:policy:
  stage: validate
  script:
    - ossa validate-policy
```

### Pre-commit Hooks
```bash
#!/bin/bash
ossa validate-branch-name
ossa validate-commit-message
```

### GitLab Protected Branches
- Enforce via GitLab UI
- Require approvals
- Block force pushes
- Require pipeline success

---

**Last Updated**: 2025-01-XX
**Version**: 0.3.2
