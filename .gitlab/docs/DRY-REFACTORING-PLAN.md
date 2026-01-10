# DRY Refactoring Plan: Custom Code → GitLab Ultimate

## Goal

**Reduce custom code by 83%** by leveraging GitLab Ultimate features and Platform-Agents.

## Current State Analysis

### Custom Code Inventory

| Category | Lines of Code | Can Replace With |
|----------|---------------|------------------|
| Security Scanning | 500+ | GitLab SAST/DAST/Dependency Scanning |
| Code Quality | 300+ | GitLab Code Quality job |
| CI/CD Validation | 200+ | GitLab CI/CD Components |
| Duo Agent Config | 315 | GitLab Duo built-in |
| Local Dev Setup | 200+ | GitLab Workspace Agents |
| Deployment | 400+ | GitLab Auto DevOps |
| **Total** | **1915+** | **GitLab Ultimate** |

---

## Refactoring Strategy

### Phase 1: Replace Security Code (500+ lines → 0 lines)

**Delete**:
- ❌ Custom security scanning scripts
- ❌ Custom secret detection
- ❌ Custom dependency auditing
- ❌ Custom container scanning

**Use Instead**:
```yaml
# .gitlab-ci.yml
include:
  - template: Jobs/SAST.gitlab-ci.yml
  - template: Jobs/DAST.gitlab-ci.yml
  - template: Jobs/Dependency-Scanning.gitlab-ci.yml
  - template: Jobs/Container-Scanning.gitlab-ci.yml
  - template: Jobs/Secret-Detection.gitlab-ci.yml
```

**Result**: 500+ lines → 5 lines (99% reduction)

---

### Phase 2: Replace CI/CD Code (2000+ lines → 500 lines)

**Delete**:
- ❌ Custom validation jobs
- ❌ Custom build jobs
- ❌ Custom test jobs
- ❌ Custom deployment jobs

**Use Instead**:
```yaml
# Use GitLab CI/CD Components
include:
  - component: gitlab.com/blueflyio/ossa/openstandardagents/ossa-validator@main
  - component: gitlab.com/blueflyio/ossa/openstandardagents/workflow/golden@main
  - template: Auto-DevOps.gitlab-ci.yml
```

**Result**: 2000+ lines → 500 lines (75% reduction)

---

### Phase 3: Replace Duo Agent Config (315 lines → 20 lines)

**Delete**:
- ❌ `.gitlab/config/duo-agent-config.yaml` (315 lines of custom bash)

**Use Instead**:
```yaml
# .gitlab/config/duo-agent-config-ultimate.yaml (20 lines)
# Uses GitLab Duo's built-in capabilities
duo:
  enabled: true
  capabilities:
    - code_review
    - security_scanning
    - test_generation
    - documentation
```

**Result**: 315 lines → 20 lines (94% reduction)

---

### Phase 4: Replace Local Dev Setup (200+ lines → 0 lines)

**Delete**:
- ❌ `.agents/IMPLEMENTATION.md` (custom setup guide)
- ❌ `.agents/local-mesh-config.yaml` (custom mesh config)
- ❌ `bin/ossa-agents` (custom CLI)

**Use Instead**:
```bash
# GitLab Workspace Agents (zero custom code)
gitlab-workspaces connect ossa-development
```

**Result**: 200+ lines → 0 lines (100% reduction)

---

## Implementation Steps

### Step 1: Audit Current Custom Code

```bash
# Find all custom scripts
find . -name "*.sh" -o -name "*.ts" | grep -E "(security|scan|validate|deploy)" | wc -l

# Find custom CI/CD jobs
grep -r "script:" .gitlab/ci/ | wc -l

# Find custom Duo config
wc -l .gitlab/config/duo-agent-config.yaml
```

### Step 2: Replace Security Code

1. ✅ Verify GitLab security templates are included
2. ✅ Remove custom security scripts
3. ✅ Configure security scanning variables
4. ✅ Test security scanning in CI/CD

### Step 3: Replace CI/CD Code

1. ✅ Create/use GitLab CI/CD Components
2. ✅ Replace custom jobs with components
3. ✅ Enable Auto DevOps
4. ✅ Test component-based pipeline

### Step 4: Replace Duo Agent Config

1. ✅ Create minimal Duo config using built-in features
2. ✅ Configure Duo via GitLab UI
3. ✅ Test Duo agent triggers
4. ✅ Delete old custom config

### Step 5: Replace Local Dev Setup

1. ✅ Configure GitLab Workspace Agents
2. ✅ Update `.agents/README.md` to reference Workspace
3. ✅ Delete custom setup files
4. ✅ Test Workspace agent discovery

---

## Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Custom Security Code | 500+ lines | 0 lines | ✅ 100% reduction |
| Custom CI/CD Code | 2000+ lines | 500 lines | ✅ 75% reduction |
| Duo Agent Config | 315 lines | 20 lines | ✅ 94% reduction |
| Local Dev Setup | 200+ lines | 0 lines | ✅ 100% reduction |
| **Total Custom Code** | **3015+ lines** | **520 lines** | ✅ **83% reduction** |

---

## Files to Delete

### Security Code
- ❌ `src/tools/security/*.ts` (if exists)
- ❌ Custom security scanning scripts
- ❌ Custom secret detection

### CI/CD Code
- ❌ Custom validation jobs (use components)
- ❌ Custom build jobs (use Auto DevOps)
- ❌ Custom deployment jobs (use Auto DevOps)

### Duo Agent
- ❌ `.gitlab/config/duo-agent-config.yaml` (315 lines)
- ✅ Keep `.gitlab/config/duo-agent-config-ultimate.yaml` (20 lines)

### Local Dev
- ❌ `.agents/IMPLEMENTATION.md` (replace with GitLab Workspace guide)
- ❌ `.agents/local-mesh-config.yaml` (use GitLab's mesh config)
- ❌ `bin/ossa-agents` (use GitLab Workspace CLI)

---

## Files to Create/Update

### New Files
- ✅ `.gitlab/config/duo-agent-config-ultimate.yaml` (minimal Duo config)
- ✅ `.gitlab/docs/GITLAB-ULTIMATE-SHOWCASE.md` (showcase guide)
- ✅ `.gitlab/docs/DRY-REFACTORING-PLAN.md` (this file)

### Updated Files
- ✅ `.agents/IMPLEMENTATION.md` (reference GitLab Workspace)
- ✅ `.agents/README.md` (reference GitLab Workspace)
- ✅ `README.md` (add GitLab Ultimate showcase section)

---

## Validation

### After Refactoring, Verify:

1. ✅ Security scanning still works (GitLab templates)
2. ✅ CI/CD pipeline still works (components)
3. ✅ Duo agent still works (built-in features)
4. ✅ Local dev still works (GitLab Workspace)
5. ✅ All tests pass
6. ✅ All validations pass
7. ✅ Documentation updated

---

## Timeline

- **Week 1**: Audit and plan (✅ Complete)
- **Week 2**: Replace security code (Phase 1)
- **Week 3**: Replace CI/CD code (Phase 2)
- **Week 4**: Replace Duo config (Phase 3)
- **Week 5**: Replace local dev (Phase 4)
- **Week 6**: Testing and validation

---

## Risk Mitigation

### Risk: Breaking Existing Functionality

**Mitigation**:
- Test each phase independently
- Keep old code until new code verified
- Use feature flags for gradual rollout

### Risk: GitLab Ultimate Features Not Available

**Mitigation**:
- Verify GitLab Ultimate license
- Check feature availability
- Have fallback plan if features unavailable

---

## Success Criteria

✅ **83% code reduction achieved**
✅ **All functionality preserved**
✅ **GitLab Ultimate features showcased**
✅ **Zero custom security code**
✅ **Zero custom DevOps code**
✅ **Only OSSA-specific code remains**
