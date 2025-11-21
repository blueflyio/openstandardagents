# OSSA Test Agent

## Purpose

Runs test suites for OSSA projects. Executes unit, integration, and e2e tests with coverage reporting.

## Capabilities

- **Unit Testing** - Runs unit tests using Jest
- **Integration Testing** - Executes integration test suites
- **E2E Testing** - Runs end-to-end tests
- **Coverage Generation** - Generates test coverage reports
- **Coverage Validation** - Validates coverage meets thresholds

## Usage

### In GitLab CI

```yaml
test:unit:
  script:
    - ossa run .gitlab/agents/test-agent/agent.ossa.yaml --tool run_unit_tests
```

### Standalone

```bash
ossa run .gitlab/agents/test-agent/agent.ossa.yaml --tool run_unit_tests
```

## Tools

- `run_unit_tests` - Runs unit tests in tests/unit/
- `run_integration_tests` - Runs integration tests in tests/integration/
- `run_e2e_tests` - Runs end-to-end tests in tests/e2e/
- `generate_coverage` - Generates coverage reports
- `validate_coverage` - Validates coverage thresholds

## Configuration

- **LLM**: OpenAI GPT-4 Turbo
- **State**: Stateless (24h retention for test history)
- **Resources**: 2000m CPU, 4Gi memory
- **Performance**: Max 1200s latency (for long test suites)

## Related

- [Test Configuration](../../../jest.config.ts)
- [Test Suites](../../../tests/)

