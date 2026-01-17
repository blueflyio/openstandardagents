# OSSA Conformance Testing

Conformance testing validates that OSSA agent manifests meet specific requirements defined in conformance profiles.

## Overview

The conformance suite provides:
- **Profiles**: Predefined sets of requirements for different use cases
- **Feature Detection**: Automatic detection of features in manifests
- **Scoring**: Weighted scoring based on required and optional features
- **Constraint Validation**: Enforce specific value constraints
- **Recommendations**: Actionable guidance for improving conformance

## Available Profiles

### Baseline Profile
**ID**: `baseline`
**Purpose**: Minimal OSSA compliance for basic agent manifests

**Required Features** (70% weight):
- `apiVersion`: Must follow `ossa/vX.Y.Z` format
- `kind`: Must be Agent, AgentTeam, or AgentWorkflow
- `metadata.name`: Agent name
- `spec.type`: Agent type (service, workflow, etc.)
- `spec.identity.id`: Unique agent identifier

**Optional Features** (30% weight):
- `metadata.description`: Agent description
- `metadata.labels`: Metadata labels
- `spec.capabilities`: Agent capabilities
- `spec.llm`: LLM configuration
- `spec.instructions`: Agent instructions

**Pass Threshold**: 70%

### Enterprise Profile
**ID**: `enterprise`
**Purpose**: Production-ready requirements for enterprise deployments

Extends baseline profile with additional requirements:

**Required Features** (60% weight):
- All baseline required features
- `metadata.version`: Semantic version
- `spec.llm.provider` & `spec.llm.model`: LLM configuration
- `spec.autonomy.level` & `spec.autonomy.approval_required`: Autonomy settings
- `spec.constraints.cost` & `spec.constraints.performance`: Resource limits
- `spec.observability.*`: Tracing, metrics, logging

**Optional Features** (40% weight):
- `spec.security.*`: Authentication, authorization, data privacy
- `spec.resilience.*`: Retry policies, timeouts, circuit breakers
- `spec.deployment.*`: Environment and scaling configuration

**Pass Threshold**: 80%

### GitLab Kagent Profile
**ID**: `gitlab-kagent`
**Purpose**: Requirements for GitLab Kagent extension compatibility

Extends enterprise profile with Kagent-specific requirements:

**Required Features** (50% weight):
- All enterprise required features
- `extensions.kagent.enabled`: Kagent extension enabled
- `extensions.kagent.gitlab_integration`: GitLab integration config
- `extensions.kagent.kubernetes_native`: Kubernetes native support

**Optional Features** (50% weight):
- `extensions.kagent.gitlab_integration.*`: CI/CD, issues, MRs, pipelines
- `extensions.kagent.kubernetes_native.*`: Deployment, scaling, monitoring
- `extensions.kagent.observability.*`: Traces and metrics
- `extensions.kagent.security.*`: RBAC and secrets management

**Pass Threshold**: 75%

## Usage

### CLI Commands

#### Run Conformance Test
```bash
# Test against baseline profile
ossa conformance run manifest.yaml --profile baseline

# Test against enterprise profile with verbose output
ossa conformance run manifest.yaml --profile enterprise --verbose

# Test with strict validation (fail on validation errors)
ossa conformance run manifest.yaml --profile enterprise --strict

# JSON output for CI/CD integration
ossa conformance run manifest.yaml --profile baseline --output json
```

#### List Available Profiles
```bash
ossa conformance list
```

#### Show Profile Details
```bash
ossa conformance profile baseline
ossa conformance profile enterprise --output json
```

### Programmatic Usage

```typescript
import { ConformanceService } from '@ossa/openstandardagents';
import { container } from '@ossa/openstandardagents/di-container';

const conformanceService = container.get(ConformanceService);

// Run conformance test
const result = await conformanceService.runConformanceTest(
  manifest,
  'enterprise',
  false // strict mode
);

// Generate report
const report = await conformanceService.generateReport(
  manifest,
  'baseline'
);

// Batch test multiple manifests
const results = await conformanceService.batchTest(
  manifests,
  'enterprise'
);

// Get summary statistics
const stats = conformanceService.getSummaryStatistics(results);
```

## Test Fixtures

Test fixtures are organized by profile:

```
spec/v0.3/conformance/tests/
├── baseline/
│   ├── valid/
│   │   ├── minimal-agent.yaml
│   │   └── basic-agent.yaml
│   └── invalid/
│       ├── missing-kind.yaml
│       └── missing-identity.yaml
├── enterprise/
│   ├── valid/
│   │   ├── production-agent.yaml
│   │   └── enterprise-agent.yaml
└── gitlab-kagent/
    └── valid/
        ├── kagent-agent.yaml
        └── kagent-full.yaml
```

## Scoring Algorithm

```
score = (required_present / required_total) * required_weight +
        (optional_present / optional_total) * optional_weight
```

- **Required features** have higher weight (typically 60-70%)
- **Optional features** have lower weight (typically 30-40%)
- **Pass threshold** varies by profile (70-80%)
- **Constraint violations** fail the test regardless of score

## CI/CD Integration

### GitLab CI

The conformance suite includes GitLab CI jobs:

```yaml
# .gitlab-ci.yml
include:
  - local: .gitlab/ci/conformance-jobs.yml

# Runs on MR and main branches
conformance:baseline:
  script:
    - ossa conformance run manifest.yaml --profile baseline
```

See `.gitlab/ci/conformance-jobs.yml` for complete CI configuration.

### GitHub Actions

```yaml
- name: Run conformance tests
  run: |
    npm run ossa -- conformance run manifest.yaml --profile enterprise --output json
```

## Creating Custom Profiles

Create a JSON file in `spec/v0.3/conformance/profiles/`:

```json
{
  "id": "custom",
  "name": "Custom Profile",
  "version": "0.3.5",
  "description": "Custom conformance requirements",
  "extends": "baseline",
  "required": {
    "features": ["apiVersion", "kind"],
    "weight": 0.7
  },
  "optional": {
    "features": ["metadata.description"],
    "weight": 0.3
  },
  "constraints": {
    "apiVersion": {
      "pattern": "^ossa/v[0-9]+\\.[0-9]+\\.[0-9]+$",
      "description": "Must follow ossa/vX.Y.Z format"
    }
  },
  "scoring": {
    "pass_threshold": 0.75,
    "warn_threshold": 0.85
  }
}
```

## Best Practices

1. **Start with baseline**: Ensure baseline conformance before testing higher profiles
2. **Use verbose mode**: Get detailed feature detection results and recommendations
3. **Enable strict mode**: Fail fast on validation errors in production pipelines
4. **Review recommendations**: Follow actionable guidance to improve conformance
5. **Test early**: Run conformance tests during development, not just in CI
6. **Track scores**: Monitor conformance scores over time to ensure quality

## Troubleshooting

### Score too low
- Use `--verbose` flag to see missing features
- Check recommendations section for guidance
- Review profile requirements with `ossa conformance profile <name>`

### Constraint violations
- Check expected vs actual values in error messages
- Review constraint descriptions in profile
- Validate manifest structure with `ossa validate`

### Profile not found
- List available profiles: `ossa conformance list`
- Check profile ID matches exactly (case-sensitive)
- Ensure profiles directory exists and is readable

## Resources

- [OSSA Specification](../../README.md)
- [Example Manifests](../../examples/)
- [Validation Guide](../../../docs/validation.md)
- [CI/CD Integration](../.gitlab/ci/conformance-jobs.yml)
