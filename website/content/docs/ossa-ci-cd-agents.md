---
title: "OSSA CI CD Agents"
---

# OSSA CI/CD Agents

**Location:** `.gitlab/agents/`
**Created:** 2025-01-21
**Purpose:** Showcase OSSA schema usage in CI/CD pipelines

## Overview

This directory contains OSSA-compliant agent definitions that demonstrate how to use the OSSA schema for CI/CD automation. These agents can be used directly in GitLab CI pipelines.

## Available Agents

### 1. validation-agent.ossa.yaml
**Purpose:** Validates OSSA agent manifests in CI/CD pipelines

**OSSA v0.2.4 Features Demonstrated:**
- Basic agent structure (apiVersion, kind, metadata, spec)
- Function tools with transport metadata
- Stateless agent configuration
- Observability setup (tracing, metrics, logging)
- Cost and performance constraints

**Usage in CI:**
```yaml
validate:ossa:
  script:
    - ossa run .gitlab/agents/validation-agent.ossa.yaml --input manifest.ossa.yaml
```

### 2. build-agent.ossa.yaml
**Purpose:** Builds and packages OSSA projects

**OSSA v0.2.4 Features Demonstrated:**
- Streaming transport (response streaming for build output)
- Multiple tools for build pipeline
- Resource constraints (CPU, memory)
- Extended timeout for long-running builds

**Usage in CI:**
```yaml
build:dist:
  script:
    - ossa run .gitlab/agents/build-agent.ossa.yaml
```

### 3. test-agent.ossa.yaml
**Purpose:** Runs test suites with coverage reporting

**OSSA v0.2.4 Features Demonstrated:**
- Multiple test execution tools
- Coverage generation and validation
- Resource-intensive configuration
- Extended timeouts for test execution

**Usage in CI:**
```yaml
test:unit:
  script:
    - ossa run .gitlab/agents/test-agent.ossa.yaml --tool run_unit_tests
```

### 4. release-agent.ossa.yaml
**Purpose:** Manages semantic releases and publishing

**OSSA v0.2.4 Features Demonstrated:**
- **State management** (session mode with Redis storage)
- **Security scopes** (OAuth2-like scopes for GitLab, npm, GitHub)
- **Compliance tags** (for audit logging)
- **Context window management** (sliding window strategy)
- Multiple authenticated tools

**Usage in CI:**
```yaml
release:main:minor:
  script:
    - ossa run .gitlab/agents/release-agent.ossa.yaml
```

### 5. documentation-agent.ossa.yaml
**Purpose:** Maintains project documentation

**OSSA v0.2.4 Features Demonstrated:**
- Wiki synchronization
- Documentation generation
- Link validation
- API documentation from OpenAPI specs

**Usage in CI:**
```yaml
pages:
  script:
    - ossa run .gitlab/agents/documentation-agent.ossa.yaml
```

## OSSA v0.2.4 Features Showcased

### Transport Metadata
All agents demonstrate transport configuration:
- Protocol specification (http, grpc, etc.)
- Streaming modes (none, response, bidirectional)
- Timeout configuration

### State Management
Release agent demonstrates state management:
- Session mode for maintaining context
- Redis storage for persistence
- Context window with sliding window strategy

### Security & Compliance
Release agent demonstrates security features:
- OAuth2-like scopes for fine-grained permissions
- Compliance tags for audit logging
- Bearer token authentication

### Observability
All agents include observability:
- OpenTelemetry tracing
- Prometheus metrics
- Structured JSON logging

## Integration with GitLab CI

These agents can be used directly in `.gitlab-ci.yml`:

```yaml
validate:ossa:
  stage: validate
  script:
    - npm install -g @bluefly/openstandardagents
    - ossa run .gitlab/agents/validation-agent.ossa.yaml --input $CI_PROJECT_DIR/**/*.ossa.yaml

build:dist:
  stage: build
  script:
    - ossa run .gitlab/agents/build-agent.ossa.yaml

test:unit:
  stage: test
  script:
    - ossa run .gitlab/agents/test-agent.ossa.yaml --tool run_unit_tests
```

## Validation

Validate these agents using the OSSA CLI:

```bash
# Validate all agents
for agent in .gitlab/agents/*.ossa.yaml; do
  ossa validate "$agent"
done
```

## Schema Version

All agents use `apiVersion: ossa/v0.2.4-dev` to demonstrate v0.2.4 features:
- Transport metadata
- State management
- Security scopes
- Enhanced observability

## Next Steps

1. **Implement agent handlers:** Create actual implementations for the tool handlers
2. **Add to CI pipeline:** Integrate these agents into `.gitlab-ci.yml`
3. **Extend agents:** Add more tools and capabilities as needed
4. **Create custom agents:** Use these as templates for project-specific agents

## Related Documentation

- OSSA Specification: `spec/v0.2.4-dev/ossa-0.2.4-dev.schema.json`
- OSSA CLI: `bin/ossa`
- Examples: `examples/`
- CI/CD Integration: `.gitlab-ci.yml`
- Agent README: `.gitlab/agents/README.md`
