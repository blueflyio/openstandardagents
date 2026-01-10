# OSSA CI/CD Components Registry

**Last Updated:** January 7, 2026
**Status:** Available but Not Actively Used

---

## Overview

This directory contains reusable GitLab CI/CD components for the OSSA project and potentially other Bluefly projects. Components provide a way to share CI/CD configuration across projects with versioning and reusability.

**Current Status:**
- **Components Available:** 8
- **Components with Specs:** 8 (100%)
- **Components Used in Main Pipeline:** 0 (0%)
- **Migration Status:** Components created but not adopted

---

## Component Inventory

### 1. OSSA Validator

**Location:** `.gitlab/components/ossa-validator/`
**Type:** Component
**Version:** 0.1.0
**Spec Status:** ✅ Has spec

**Purpose:** Validates OSSA agent manifests against schema

**Usage:**
```yaml
include:
  - component: gitlab.com/blueflyio/ossa/openstandardagents/ossa-validator@main

validate:ossa:
  extends: .ossa-validator
  variables:
    manifest_path: ".gitlab/agents"
    schema_version: "0.3.3"
```

**Inputs:**
- `manifest_path` (default: `.agents`) - Path to agent manifests
- `schema_version` (default: `0.1.9`) - OSSA schema version
- `strict_mode` (default: `true`) - Enable strict validation

---

### 2. Workflow Golden

**Location:** `.gitlab/components/workflow/golden/`
**Type:** Component
**Version:** 0.1.0
**Spec Status:** ✅ Has spec

**Purpose:** Bluefly Golden CI Orchestration - Enforces safe, versioned, tag-and-release flow

**Usage:**
```yaml
include:
  - component: gitlab.com/blueflyio/ossa/openstandardagents/workflow/golden@main

.golden-workflow:
  extends: .golden
  variables:
    project_version: "0.3.3"
    node-version: "20"
```

**Inputs:**
- `project_version` (default: auto-detected) - Override project version
- `stage-names` (default: `validate build test changelog release`) - Custom stage names
- `node-version` (default: `20`) - Node.js version
- `enable-tdd` (default: `true`) - Enable TDD compliance checks
- `enable-ossa-compliance` (default: `false`) - Enable OSSA specification compliance

---

### 3. Spec Validation

**Location:** `.gitlab/components/spec-validation/`
**Type:** Component
**Version:** 0.1.0
**Spec Status:** ✅ Has spec

**Purpose:** Validates OpenAPI specifications and JSON schemas

**Usage:**
```yaml
include:
  - component: gitlab.com/blueflyio/ossa/openstandardagents/spec-validation@main

validate:specs:
  extends: .spec-validation
  variables:
    spec_directory: "openapi"
    node_version: "20"
    validate_openapi: true
    validate_schemas: true
```

**Inputs:**
- `spec_directory` (default: `src/api`) - Directory containing specification files
- `node_version` (default: `20`) - Node.js version
- `validate_openapi` (default: `true`) - Whether to validate OpenAPI specifications
- `validate_schemas` (default: `true`) - Whether to validate JSON schemas

---

### 4. Version Management

**Location:** `.gitlab/components/version-management/`
**Type:** Component (version-bump-agent.yml)
**Version:** 0.1.0
**Spec Status:** ✅ Has spec

**Purpose:** GitLab CI/CD job component that uses the version-manager GitLab agent to automate version bumping

**Usage:**
```yaml
include:
  - component: gitlab.com/blueflyio/ossa/openstandardagents/version-management/version-bump-agent@main

bump:version:
  extends: .version-bump-agent
  variables:
    BUMP_TYPE: "patch"  # major, minor, patch, rc, release
    TARGET_BRANCH: "development"
```

**Inputs:**
- `BUMP_TYPE` - Version bump type (major, minor, patch, rc, release)
- `TARGET_BRANCH` - Target branch for version bump

---

### 5. Security Scanner

**Location:** `.gitlab/components/security-scanner/`
**Type:** Template
**Version:** 0.1.9-alpha.1
**Spec Status:** ✅ Has spec

**Purpose:** OSSA Security Scanner - Centralizes security scanning across projects

**Usage:**
```yaml
include:
  - component: gitlab.com/blueflyio/ossa/openstandardagents/security-scanner@main

scan:security:
  extends: .security-scanner
  variables:
    scan_type: "full"  # quick, full, compliance
    threshold: "medium"  # low, medium, high, critical
    include_dependencies: true
```

**Inputs:**
- `scan_type` (default: `full`) - Scan type (quick, full, compliance)
- `threshold` (default: `medium`) - Security threshold (low, medium, high, critical)
- `include_dependencies` (default: `true`) - Include dependency scanning

---

### 6. Agent Validator

**Location:** `.gitlab/components/agent-validator/`
**Type:** Template
**Version:** 0.1.9-alpha.1
**Spec Status:** ✅ Has spec

**Purpose:** OSSA Agent Validator - Validates OSSA agents in specified path

**Usage:**
```yaml
include:
  - component: gitlab.com/blueflyio/ossa/openstandardagents/agent-validator@main

validate:agents:
  extends: .agent-validator
  variables:
    manifest_path: ".gitlab/agents"
    schema_version: "0.3.3"
    strict_mode: true
```

**Inputs:**
- `manifest_path` (default: `.agents`) - Path to agent manifests
- `schema_version` (default: `0.1.9`) - OSSA schema version to validate against
- `strict_mode` (default: `true`) - Enable strict validation mode

---

### 7. MCP Tester

**Location:** `.gitlab/components/mcp-tester/`
**Type:** Template
**Version:** 0.1.9-alpha.1
**Spec Status:** ✅ Has spec

**Purpose:** OSSA MCP Tester - Tests MCP compliance at specified endpoint

**Usage:**
```yaml
include:
  - component: gitlab.com/blueflyio/ossa/openstandardagents/mcp-tester@main

test:mcp:
  extends: .mcp-tester
  variables:
    endpoint: "http://localhost:3000"
    test_suite: "conformance"  # conformance, performance, security
    timeout: 300
```

**Inputs:**
- `endpoint` (default: `http://localhost:3000`) - MCP endpoint to test
- `test_suite` (default: `conformance`) - Test suite to run (conformance, performance, security)
- `timeout` (default: `300`) - Test timeout in seconds

---

### 8. Value Stream Analytics (VSA)

**Location:** `.gitlab/components/vsa/`
**Type:** Component
**Version:** 0.1.0
**Spec Status:** ✅ Has spec

**Purpose:** Value Stream Analytics - Track and measure software delivery performance metrics

**Usage:**
```yaml
include:
  - component: gitlab.com/blueflyio/ossa/openstandardagents/vsa@main

track:vsa:
  extends: .vsa
  variables:
    enable_vsa: true
    track_lead_time: true
    track_cycle_time: true
    track_deployment_frequency: true
    track_mttr: true
    track_change_failure_rate: true
    vsa_report_format: "json"  # json, html, markdown
```

**Inputs:**
- `enable_vsa` (default: `true`) - Enable Value Stream Analytics tracking
- `track_lead_time` (default: `true`) - Track lead time metrics (commit to deploy)
- `track_cycle_time` (default: `true`) - Track cycle time metrics (start to finish)
- `track_deployment_frequency` (default: `true`) - Track deployment frequency metrics
- `track_mttr` (default: `true`) - Track Mean Time To Recovery metrics
- `track_change_failure_rate` (default: `true`) - Track change failure rate
- `vsa_report_format` (default: `json`) - Output format for VSA reports (json, html, markdown)

---

## Migration Strategy

### Current State
- Components exist but are not used in main pipeline
- Main pipeline uses local includes (`.gitlab/ci/*.yml`)
- Components have specs but no versioning strategy

### Target State
- Migrate local includes to components
- Add component versioning
- Enable cross-project component sharing
- Reduce duplication

### Migration Phases

#### Phase 1: Pilot (Weeks 1-2)
1. Choose one low-risk CI file (e.g., `guardrails.yml`)
2. Create component version
3. Update CI file to use component
4. Test thoroughly
5. Measure impact

#### Phase 2: Expand (Weeks 3-4)
1. Migrate medium-risk files (review-apps, extension-development)
2. Add component versioning
3. Document usage patterns
4. Create migration guide

#### Phase 3: Complete (Weeks 5-8)
1. Migrate high-risk files (release-workflow, post-release)
2. Create component library repository
3. Enable cross-project sharing
4. Continuous improvement

---

## Component Versioning

**Current Status:** No versioning strategy implemented

**Recommendation:**
- Use Git tags for component versions (e.g., `v0.1.0`, `v0.1.1`)
- Pin component versions in CI files
- Document breaking changes
- Provide migration guides

**Example:**
```yaml
include:
  - component: gitlab.com/blueflyio/ossa/openstandardagents/ossa-validator@v0.1.0
```

---

## Best Practices

1. **Version Components:** Always version components using Git tags
2. **Pin Versions:** Pin component versions in CI files for stability
3. **Document Changes:** Document breaking changes in component README
4. **Test Thoroughly:** Test components in isolation before adoption
5. **Measure Impact:** Track component usage and performance
6. **Share Knowledge:** Document usage patterns and lessons learned

---

## References

- [GitLab CI/CD Components Documentation](https://docs.gitlab.com/ee/ci/components/)
- [Component Specification](https://docs.gitlab.com/ee/ci/components/#component-specification)
- [Component Versioning](https://docs.gitlab.com/ee/ci/components/#component-versioning)

---

*This registry will be updated as components are adopted and new components are created.*
