# Hardcoded Values Audit Report

**Date**: 2026-01-07
**Status**: Critical Issues Found
**Scope**: Entire codebase

## Executive Summary

Comprehensive audit found **multiple categories** of hardcoded values that should be replaced with environment variables or configuration:

1. **CRITICAL**: Hardcoded project IDs and paths
2. **CRITICAL**: Hardcoded service account emails
3. **HIGH**: Hardcoded platform-agents version
4. **MEDIUM**: Hardcoded URLs and domains
5. **LOW**: Hardcoded Docker image versions (acceptable for CI/CD)
6. **LOW**: Hardcoded localhost URLs (acceptable for examples)

---

## 1. CRITICAL: Hardcoded Project IDs

### Files with Hardcoded Project ID `76265294`:

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `src/tools/gitlab/manage-milestone-mrs.ts` | 15 | `const PROJECT_ID = '76265294'` | Use `process.env.CI_PROJECT_ID` |
| `src/tools/gitlab/create-milestone-issue.ts` | 14 | `process.env.CI_PROJECT_ID \|\| 'blueflyio/openstandardagents'` | Remove fallback |
| `src/tools/gitlab/configure-gitlab-branch-protection.ts` | 9 | `const PROJECT_ID = 'blueflyio/openstandardagents'` | Use `process.env.CI_PROJECT_PATH` |
| `src/tools/gitlab/auto-rebase-mrs.ts` | 10 | `const PROJECT_ID = 'blueflyio/openstandardagents'` | Use `process.env.CI_PROJECT_PATH` |
| `src/tools/generators/unified-config-generator.ts` | 80 | `PROJECT_ID: 'blueflyio/ossa/openstandardagents'` | Use `process.env.CI_PROJECT_PATH` |

**Action Required**: Replace all with `process.env.CI_PROJECT_ID` or `process.env.CI_PROJECT_PATH`

---

## 2. CRITICAL: Hardcoded Service Account Emails

### Files with Hardcoded `@bluefly.io` Emails:

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `.gitlab/agents/extension-development-team.ossa.yaml` | 217 | `email: deployment-service-account@bluefly.io` | Use `${SERVICE_ACCOUNT_EMAIL:-deployment-service-account@${GITLAB_DOMAIN:-bluefly.io}}` |
| `spec/v0.3.3/extensions/agent-identity.yaml` | 525, 579 | Example emails | Keep as examples (OK) |
| `spec/v0.3.3/examples/*.ossa.yaml` | Multiple | Example emails | Keep as examples (OK) |

**Action Required**: Replace in actual agent manifests with environment variables

---

## 3. HIGH: Hardcoded Platform-Agents Version

### Files with Hardcoded Version `v0.1.4-dev8`:

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `.gitlab-ci.yml` | 59 | `ref: 'v0.1.4-dev8'` | Use `${PLATFORM_AGENTS_VERSION:-v0.1.4-dev8}` |

**Action Required**: Make version configurable via CI/CD variable

---

## 4. MEDIUM: Hardcoded URLs and Domains

### Files with Hardcoded GitLab URLs:

| File | Count | Issue | Status |
|------|-------|-------|--------|
| `package.json` | 2 | `https://gitlab.com/blueflyio/ossa/openstandardagents` | ✅ **ACCEPTABLE** - JSON metadata, not runtime config |
| `src/tools/vscode-ossa/package.json` | 2 | Same | ✅ **ACCEPTABLE** - JSON metadata, not runtime config |
| `README.md`, `CONTRIBUTING.md`, etc. | 50+ | Documentation URLs | ✅ **ACCEPTABLE** - Documentation |

**Action**: No action needed - package.json URLs are metadata, not runtime configuration. JSON doesn't support variable substitution.

### Files with Hardcoded API URLs:

| File | Count | Issue | Fix |
|------|-------|-------|-----|
| `openapi/*.yaml` | 20+ | `https://api.llm.bluefly.io` | Use `${OSSA_API_URL:-https://api.llm.bluefly.io}` |
| `docs/openapi/*.md` | 50+ | Same | Acceptable (documentation) |

**Action Required**: Fix in OpenAPI spec files. Documentation is acceptable.

---

## 5. LOW: Hardcoded Docker Image Versions

### Files with Hardcoded Image Tags:

| File | Count | Issue | Status |
|------|-------|-------|--------|
| `.gitlab/ci/*.yml` | 100+ | `node:20-alpine`, `alpine:latest` | ✅ **ACCEPTABLE** - CI/CD images should be pinned |

**Action**: No action needed - Docker image versions should be pinned for reproducibility

---

## 6. LOW: Hardcoded Localhost URLs

### Files with Hardcoded Localhost:

| File | Count | Issue | Status |
|------|-------|-------|--------|
| `openapi/*.yaml` | 10+ | `http://localhost:3000` | ✅ **ACCEPTABLE** - Examples use localhost |
| `examples/*.yaml` | 20+ | Same | ✅ **ACCEPTABLE** - Examples use localhost |
| `docker-compose.yml` | 2 | Same | ✅ **ACCEPTABLE** - Local development |

**Action**: No action needed - Localhost URLs are appropriate for examples and local dev

---

## 7. CRITICAL: Hardcoded API URLs in Code

### Files with Hardcoded API URLs:

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `src/tools/version/enhanced-version-manager.ts` | 30 | `'https://gitlab.com/api/v4'` | Use `process.env.CI_API_V4_URL` |
| `src/tools/gitlab/create-milestone-issue.ts` | 10 | `'https://gitlab.com/api/v4'` | Use `process.env.CI_API_V4_URL` |
| `src/tools/gitlab/create-issue-helper.ts` | 118 | `'https://gitlab.com/api/v4'` | Use `process.env.CI_API_V4_URL` |
| `src/tools/docs/professionalize-content.ts` | 157 | `'https://gitlab.com/api/v4'` | Use `process.env.CI_API_V4_URL` |
| `src/tools/validation/gitlab-ci-validator.ts` | 186 | `"https://gitlab.com/api/v4/ci/lint"` | Use `${CI_API_V4_URL}/ci/lint` |

**Action Required**: Replace all with `process.env.CI_API_V4_URL`

---

## Priority Fix List

### Immediate (CRITICAL):
1. ✅ Fix hardcoded project IDs in `src/tools/gitlab/*.ts`
2. ✅ Fix hardcoded service account emails in agent manifests
3. ✅ Fix hardcoded API URLs in `src/tools/**/*.ts`
4. ✅ Make platform-agents version configurable

### Short-term (HIGH):
5. Fix hardcoded URLs in `package.json` files
6. Fix hardcoded API URLs in OpenAPI specs

### Long-term (MEDIUM):
7. Document acceptable hardcoded values (Docker images, localhost, examples)
8. Add validation to prevent new hardcoded values

---

## Validation Rules

### ✅ ACCEPTABLE Hardcoded Values:
- Docker image versions (for reproducibility)
- Localhost URLs in examples
- Documentation URLs (README, CONTRIBUTING, etc.)
- Example values in spec files
- Test fixtures and mocks

### ❌ FORBIDDEN Hardcoded Values:
- Project IDs or paths
- Service account emails
- API tokens or secrets
- API URLs in source code
- Environment-specific URLs in config files

---

## Next Steps

1. Fix all CRITICAL issues (Priority 1-4)
2. Update CI/CD to validate no new hardcoded values
3. Add pre-commit hook to catch hardcoded values
4. Document acceptable vs. forbidden patterns
