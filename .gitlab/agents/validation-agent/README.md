# OSSA Validation Agent

## Purpose

Validates OSSA agent manifests against the OSSA schema. Used in CI/CD pipelines to ensure all agent definitions are compliant with the OSSA specification.

## Capabilities

- **Manifest Validation** - Validates OSSA manifest structure, required fields, and schema compliance
- **Schema Version Checking** - Verifies apiVersion format and compatibility
- **Linting** - Performs best practice checks on manifest structure

## Usage

### In GitLab CI

```yaml
validate:ossa:
  script:
    - ossa validate .gitlab/agents/validation-agent/agent.ossa.yaml
```

### Standalone

```bash
ossa validate path/to/agent.ossa.yaml
```

## Tools

- `validate_manifest` - Validates manifest against OSSA schema
- `check_schema_version` - Validates apiVersion format
- `lint_manifest` - Performs linting checks

## Configuration

- **LLM**: OpenAI GPT-4 Turbo
- **State**: Stateless (no memory required)
- **Performance**: Max 10s latency, 30s timeout

## Related

- [OSSA Specification](../../../spec/v0.2.4/README.md)
- [Validation Service](../../../src/services/validation.service.ts)

