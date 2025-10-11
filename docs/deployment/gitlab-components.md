# GitLab Component Requirements for Golden CI Orchestration

## For the `.gitlab` Component Project (gitlab.bluefly.io/llm/gitlab_components)

This document outlines what needs to be created in the separate GitLab components repository for the Golden CI Orchestration to work across all projects.

### Required Component Structure

The `.gitlab` repository needs to create:

```
.gitlab/
├── components/
│   └── workflow/
│       └── golden/
│           ├── component.yml    # Component definition
│           ├── template.yml     # CI pipeline template
│           └── README.md        # Documentation
```

### 1. Component Definition (`component.yml`)

```yaml
spec:
  inputs:
    stage-names:
      description: "Custom stage names override"
      type: string
      default: "validate build test changelog release"
    node-version:
      description: "Node.js version for JavaScript/TypeScript projects"
      type: string
      default: "20"
    python-version:
      description: "Python version for Python projects"  
      type: string
      default: "3.11"
    enable-tdd:
      description: "Enable TDD compliance checks"
      type: boolean
      default: true
    enable-ossa-compliance:
      description: "Enable OSSA specification compliance"
      type: boolean
      default: false
    enable-auto-merge:
      description: "Auto-merge feature branches to development"
      type: boolean
      default: false
    changelog-preset:
      description: "Conventional changelog preset"
      type: string
      default: "angular"
---
name: golden
description: "Bluefly Golden CI Orchestration - Enforces safe, versioned, tag-and-release flow"
version: "0.1.0"
tags:
  - ci
  - automation
  - release-management
  - changelog
  - versioning
```

### 2. Key Pipeline Features (`template.yml`)

The template must provide:

#### Version Auto-Detection
- Read from `package.json` → `.version`
- Read from component's own `component.yml` → `version:`
- Read from `pyproject.toml` → `project.version`
- Read from `composer.json` → `version`
- Fallback to git tag + patch bump

#### Branch-Specific Behaviors
- **feature/*** and **bug/***:
  - Create pre-release tags: `v<version>-<type>.<slug>+sha.<hash>`
  - Optional auto-merge to development
  
- **development**:
  - Update CHANGELOG using conventional-changelog
  - Integration testing
  - Manual promotion gate to main

- **main**:
  - Manual release job only
  - Create production tag `v<version>`
  - Create GitLab Release with notes

#### Required Jobs
1. `detect:version` - Auto-detect version from project metadata
2. `validate:project` - Lint, test, TDD compliance
3. `build:project` - Build artifacts
4. `test:project` - Run test suites
5. `tag:pre-release` - Create pre-release tags
6. `changelog:update` - Update CHANGELOG on development
7. `merge:to-development` - Optional auto-merge
8. `promote:to-main` - Manual gate from development
9. `release:production` - Manual release on main

### 3. How OSSA Will Use It

Once the component is published to the GitLab component catalog, OSSA's `.gitlab-ci.yml` will change from:

```yaml
# Current (local testing)
include:
  - local: .gitlab/components/workflow/golden/template.yml
```

To:

```yaml
# Production usage
include:
  - component: gitlab.bluefly.io/llm/gitlab_components/workflow/golden@0.1.0

variables:
  ENABLE_OSSA: "true"
  ENABLE_TDD: "true"
  ENABLE_AUTO_MERGE: "false"
```

### 4. OSSA-Specific Extensions

OSSA adds its own jobs on top of the golden workflow:

```yaml
# OSSA-specific validation
validate:ossa-spec:
  stage: validate
  script:
    - npm run api:validate
    - # Verify only specification files exist

# Integration testing with agent-buildkit
test:integration:
  stage: test
  script:
    - # Test Registry Bridge Service
    - # Test UADP protocol

# NPM publishing for specifications
release:ossa-spec:
  stage: release
  script:
    - npm publish --access public
```

### 5. What Needs to Be Done in `.gitlab` Project

1. **Create the component structure** under `.gitlab/components/workflow/golden/`
2. **Copy the template.yml** from OSSA's temporary implementation
3. **Publish to component catalog** at version 0.1.0
4. **Test with a sample project** to verify it works
5. **Update all projects** to use the published component

### 6. Benefits for All Projects

Once published, ANY project can adopt the golden workflow by adding just one line:

```yaml
include:
  - component: gitlab.bluefly.io/llm/gitlab_components/workflow/golden@0.1.0
```

This gives them:
- Automatic version detection
- Pre-release tagging
- CHANGELOG automation
- Controlled release process
- Branch compliance
- No manual CI editing for versions

### 7. Testing the Component

Before publishing, test with:

- **agent_buildkit** (v0.1.0) - Node.js project
- **OSSA** (v0.1.9) - Specification project
- **Python project** - Verify pyproject.toml detection
- **PHP/Drupal module** - Verify composer.json detection

---

## Summary for `.gitlab` Component Project

The `.gitlab` repository needs to:
1. Create the golden workflow component
2. Publish it to the GitLab component catalog
3. Make it available at `gitlab.bluefly.io/llm/gitlab_components/workflow/golden@0.1.0`

Once published, OSSA and all other projects can use it with a single include statement.