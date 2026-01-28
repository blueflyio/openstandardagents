# Conformance Profile Reference

Quick reference guide for OSSA conformance profiles.

## Profile Comparison

| Feature | Baseline | Enterprise | GitLab Kagent |
|---------|----------|------------|---------------|
| Pass Threshold | 70% | 80% | 75% |
| Warn Threshold | 85% | 90% | 85% |
| Required Weight | 70% | 60% | 50% |
| Optional Weight | 30% | 40% | 50% |
| Extends | - | baseline | enterprise |

## Feature Checklist

### Baseline Profile

#### Required (70% weight)
- [ ] `apiVersion` (format: `ossa/vX.Y.Z`)
- [ ] `kind` (Agent, AgentTeam, or AgentWorkflow)
- [ ] `metadata.name`
- [ ] `spec.type`
- [ ] `spec.identity.id`

#### Optional (30% weight)
- [ ] `metadata.description`
- [ ] `metadata.labels`
- [ ] `spec.capabilities`
- [ ] `spec.llm`
- [ ] `spec.instructions`

### Enterprise Profile

#### Required (60% weight)
All baseline required features, plus:
- [ ] `metadata.description`
- [ ] `metadata.version`
- [ ] `metadata.labels`
- [ ] `spec.identity.version`
- [ ] `spec.capabilities`
- [ ] `spec.llm.provider`
- [ ] `spec.llm.model`
- [ ] `spec.autonomy.level`
- [ ] `spec.autonomy.approval_required`
- [ ] `spec.constraints.cost`
- [ ] `spec.constraints.performance`
- [ ] `spec.observability.tracing`
- [ ] `spec.observability.metrics`
- [ ] `spec.observability.logging`

#### Optional (40% weight)
- [ ] `spec.security.authentication`
- [ ] `spec.security.authorization`
- [ ] `spec.security.data_privacy`
- [ ] `spec.resilience.retry_policy`
- [ ] `spec.resilience.timeout_ms`
- [ ] `spec.resilience.circuit_breaker`
- [ ] `spec.deployment.environment`
- [ ] `spec.deployment.scaling`

### GitLab Kagent Profile

#### Required (50% weight)
All enterprise required features, plus:
- [ ] `extensions.kagent.enabled`
- [ ] `extensions.kagent.gitlab_integration`
- [ ] `extensions.kagent.kubernetes_native`

#### Optional (50% weight)
- [ ] `extensions.kagent.gitlab_integration.ci_cd`
- [ ] `extensions.kagent.gitlab_integration.issues`
- [ ] `extensions.kagent.gitlab_integration.merge_requests`
- [ ] `extensions.kagent.gitlab_integration.pipelines`
- [ ] `extensions.kagent.kubernetes_native.deployment`
- [ ] `extensions.kagent.kubernetes_native.scaling`
- [ ] `extensions.kagent.kubernetes_native.monitoring`
- [ ] `extensions.kagent.observability.traces`
- [ ] `extensions.kagent.observability.metrics`
- [ ] `extensions.kagent.security.rbac`
- [ ] `extensions.kagent.security.secrets_management`

## Constraint Rules

### Baseline
- `apiVersion`: Must match pattern `^ossa/v[0-9]+\.[0-9]+\.[0-9]+$`
- `kind`: Must be one of: `Agent`, `AgentTeam`, `AgentWorkflow`

### Enterprise
All baseline constraints, plus:
- `spec.autonomy.level`: Must be one of: `none`, `monitored`, `semi_autonomous`, `autonomous`
- `spec.constraints.cost.max_cost_per_task`: Must be number >= 0

### GitLab Kagent
All enterprise constraints, plus:
- `extensions.kagent.enabled`: Must be `true`
- `extensions.kagent.gitlab_integration`: Must be object with `enabled: true`

## Score Interpretation

### Baseline Profile
- **< 70%**: FAIL - Missing critical baseline features
- **70-84%**: PASS with warnings - Consider adding optional features
- **85-100%**: PASS - Good baseline conformance

### Enterprise Profile
- **< 80%**: FAIL - Not production-ready
- **80-89%**: PASS with warnings - Add security and resilience features
- **90-100%**: PASS - Production-ready

### GitLab Kagent Profile
- **< 75%**: FAIL - Missing Kagent requirements
- **75-84%**: PASS with warnings - Add optional Kagent features
- **85-100%**: PASS - Full Kagent integration

## Common Recommendations

### Baseline → Enterprise
1. Add `metadata.version` for versioning
2. Configure `spec.llm` with provider and model
3. Set `spec.autonomy.level` and approval requirements
4. Define `spec.constraints` for cost and performance
5. Enable `spec.observability` (tracing, metrics, logging)

### Enterprise → GitLab Kagent
1. Enable `extensions.kagent`
2. Configure `gitlab_integration` for CI/CD
3. Enable `kubernetes_native` deployment
4. Add Kagent-specific observability
5. Configure RBAC and secrets management

## Quick Commands

```bash
# List all profiles
ossa conformance list

# View profile details
ossa conformance profile baseline
ossa conformance profile enterprise
ossa conformance profile gitlab-kagent

# Test manifest
ossa conformance run manifest.yaml --profile baseline
ossa conformance run manifest.yaml --profile enterprise --verbose
ossa conformance run manifest.yaml --profile gitlab-kagent --strict

# JSON output for automation
ossa conformance run manifest.yaml --profile enterprise --output json
```

## Example Scores

### Minimal Agent (Baseline Profile)
```yaml
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: minimal
spec:
  type: service
  identity:
    id: minimal
```
**Score**: 70% (5/5 required, 0/5 optional) - PASS

### Basic Agent (Baseline Profile)
```yaml
apiVersion: ossa/v0.3.5
kind: Agent
metadata:
  name: basic
  description: Basic agent
  labels:
    env: test
spec:
  type: service
  identity:
    id: basic
  capabilities:
    - name: test
  llm:
    provider: openai
    model: gpt-4
```
**Score**: 100% (5/5 required, 5/5 optional) - PASS

### Production Agent (Enterprise Profile)
Full enterprise-compliant agent with all required features.
**Score**: 85%+ - PASS

## Profile Selection Guide

**Choose Baseline when:**
- Developing new agents
- Creating minimal examples
- Testing basic OSSA compliance
- Building simple proof-of-concepts

**Choose Enterprise when:**
- Deploying to production
- Building multi-agent systems
- Requiring observability and resilience
- Meeting enterprise compliance requirements

**Choose GitLab Kagent when:**
- Deploying on GitLab infrastructure
- Using Kubernetes for agent hosting
- Requiring GitLab CI/CD integration
- Building GitLab-native agents
