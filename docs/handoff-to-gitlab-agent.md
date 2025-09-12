# 📋 Handoff to GitLab Agent: Golden CI Orchestration Component

## Context
OSSA has created and tested a Golden CI Orchestration component locally. This needs to be implemented in the central GitLab components repository for all projects to use.

## Source Files Location (in OSSA)
```
/Users/flux423/Sites/LLM/OSSA/.gitlab/components/workflow/golden/
├── component.yml    # Component definition with inputs
├── template.yml     # Full CI pipeline template (400+ lines)
└── README.md        # Complete documentation
```

## Target Repository
- **Repository**: `gitlab.bluefly.io/llm/gitlab_components`
- **Path**: `/Users/flux423/Sites/LLM/.gitlab` (local)

## Implementation Tasks for GitLab Agent

### 1. Create Component Structure
```bash
cd /Users/flux423/Sites/LLM/.gitlab
mkdir -p components/workflow/golden
```

### 2. Copy Files from OSSA
Copy these three files from OSSA:
- `/Users/flux423/Sites/LLM/OSSA/.gitlab/components/workflow/golden/component.yml`
- `/Users/flux423/Sites/LLM/OSSA/.gitlab/components/workflow/golden/template.yml`
- `/Users/flux423/Sites/LLM/OSSA/.gitlab/components/workflow/golden/README.md`

### 3. Key Features to Verify

The component provides:
- **Version auto-detection** from package.json, component.yml, pyproject.toml, composer.json
- **Pre-release tagging** for feature/bug branches: `v<version>-<type>.<slug>+sha.<hash>`
- **CHANGELOG automation** on development branch
- **Manual release gate** on main branch
- **Branch compliance** enforcement (≤5 active per type)
- **Multi-language support** (Node.js, Python, PHP, GitLab components)

### 4. Component Metadata
```yaml
name: golden
version: "0.1.0"
description: "Bluefly Golden CI Orchestration - Enforces safe, versioned, tag-and-release flow"
```

### 5. Testing Requirements

Test the component with:
1. **Self-test**: The `.gitlab` project itself should use the golden workflow
2. **Node.js project**: Test with package.json version detection
3. **Python project**: Test with pyproject.toml detection
4. **Component project**: Test with component.yml version detection

### 6. Publishing Steps

1. **Tag the component**: Create tag `v0.1.0` in the gitlab_components repo
2. **Publish to catalog**: Ensure it appears at `https://gitlab.bluefly.io/explore/catalog`
3. **Verify availability**: Component should be usable as:
   ```yaml
   include:
     - component: gitlab.bluefly.io/llm/gitlab_components/workflow/golden@0.1.0
   ```

### 7. Projects Waiting to Adopt

Once published, these projects will immediately adopt it:
- **OSSA** (v0.1.9) - Will switch from local include to component include
- **agent_buildkit** (v0.1.0) - Needs golden workflow for Registry Bridge Service
- **common_npm/** packages - Various agent implementations
- **all_drupal_custom/modules/** - Drupal agent modules

### 8. Success Criteria

✅ Component published to GitLab catalog at v0.1.0  
✅ Available at `gitlab.bluefly.io/llm/gitlab_components/workflow/golden@0.1.0`  
✅ Self-validates version detection from component.yml  
✅ Creates pre-release tags on feature branches  
✅ Updates CHANGELOG on development  
✅ Manual release gate works on main  

### 9. Notes for Implementation

- The `template.yml` is large (400+ lines) but fully self-contained
- All version detection logic is automated - no manual CI edits needed
- The component works with GitLab v17.6.2-ee (current Bluefly version)
- Uses `rules:` instead of `only:/except:` for modern GitLab compatibility
- No `when: never` blockers - uses positive rules only

### 10. Validation Script

OSSA includes a validation script at `.gitlab/validate-golden.sh` that can be adapted to verify the component is working correctly in the `.gitlab` project.

---

## Handoff Complete

The GitLab agent now has all information needed to:
1. Implement the golden workflow component in `.gitlab` repository
2. Publish it to the GitLab component catalog
3. Make it available for all Bluefly projects to adopt

Once published, notify OSSA to switch from local include to the published component.