# Bot Policy Enforcer

## Purpose
Automated enforcement of project policies and standards via GitLab bots and CI/CD.

## Policies Enforced

1. **Branch Naming**: Must follow `<type>/<issue#>-<slug>` format
2. **No Direct Commits**: All changes via MRs
3. **Documentation**: No .md files in root (use GitLab Wiki)
4. **Code Quality**: 95%+ test coverage required
5. **Standards**: TypeScript strict, no `any` types

## Implementation
- Pre-commit hooks (Lefthook)
- CI/CD validation jobs
- Automated MR comments
- Policy violation blocking

Closes #349
