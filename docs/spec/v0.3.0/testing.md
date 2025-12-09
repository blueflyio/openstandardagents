# OSSA Testing Framework

## Overview

OSSA v0.3.0 introduces `AgentTest` - a declarative testing resource for validating agent behavior, task execution, and workflow orchestration.

## AgentTest Resource

```yaml
apiVersion: ossa/v0.3.0
kind: AgentTest
metadata:
  name: test-customer-support-agent
  description: Test suite for customer support agent
spec:
  target:
    kind: Agent
    name: customer-support-agent
    version: v1.0.0
  
  tests:
    - name: handles-greeting
      description: Agent responds appropriately to greetings
      input:
        message: "Hello, I need help"
      assertions:
        - type: response_contains
          value: ["help", "assist"]
        - type: response_time_ms
          operator: less_than
          value: 2000
    
    - name: escalates-complex-issues
      description: Agent escalates when unable to resolve
      input:
        message: "I need to speak to a manager about billing"
      assertions:
        - type: action_triggered
          value: escalate_to_human
        - type: metadata_set
          key: escalation_reason
          value: billing_dispute
```

## Test Types

### Unit Tests
Test individual agent capabilities in isolation.

```yaml
tests:
  - name: unit-sentiment-analysis
    type: unit
    input:
      text: "This product is terrible"
    assertions:
      - type: capability_output
        capability: sentiment_analysis
        expected:
          sentiment: negative
          confidence: ">0.8"
```

### Integration Tests
Test agent interactions with external systems.

```yaml
tests:
  - name: integration-database-query
    type: integration
    setup:
      - action: seed_database
        data: test_customers.json
    input:
      query: "Find customer by email"
      email: "test@example.com"
    assertions:
      - type: tool_called
        tool: database_query
      - type: response_matches_schema
        schema: customer_schema.json
    teardown:
      - action: cleanup_database
```

### Property-Based Tests
Test universal properties across many inputs.

```yaml
tests:
  - name: property-idempotency
    type: property
    description: Same input always produces same output
    generator:
      type: random_text
      count: 100
      constraints:
        min_length: 10
        max_length: 500
    property:
      type: idempotent
      tolerance: 0.95
```

### End-to-End Tests
Test complete workflows.

```yaml
tests:
  - name: e2e-order-fulfillment
    type: e2e
    workflow:
      - step: create_order
        input: { product_id: "123", quantity: 2 }
      - step: process_payment
        input: { amount: 50.00 }
      - step: ship_order
    assertions:
      - type: workflow_completed
        max_duration_ms: 30000
      - type: all_steps_succeeded
      - type: state_matches
        expected:
          order_status: shipped
```

## Assertion Types

| Type | Description | Example |
|------|-------------|---------|
| `response_contains` | Response includes text | `value: ["hello", "hi"]` |
| `response_matches_regex` | Response matches pattern | `pattern: "^Order #\\d+"` |
| `response_time_ms` | Response time constraint | `operator: less_than, value: 1000` |
| `action_triggered` | Specific action was called | `value: send_email` |
| `tool_called` | Tool was invoked | `tool: web_search` |
| `capability_output` | Capability returned value | `capability: translate, expected: {...}` |
| `metadata_set` | Metadata key has value | `key: user_id, value: "123"` |
| `state_matches` | Final state matches | `expected: {...}` |
| `workflow_completed` | Workflow finished | `max_duration_ms: 5000` |
| `error_thrown` | Expected error occurred | `error_type: ValidationError` |

## Running Tests

### CLI
```bash
ossa test run test-suite.yaml
ossa test run --filter "integration-*"
ossa test run --watch
```

### Programmatic
```typescript
import { OSSATestRunner } from '@ossa/testing';

const runner = new OSSATestRunner();
const results = await runner.run('test-suite.yaml');

console.log(`Passed: ${results.passed}/${results.total}`);
```

## Coverage Requirements

Recommended coverage targets:
- **Unit tests**: 90%+ of capabilities
- **Integration tests**: 80%+ of tool integrations
- **Property tests**: 100 iterations minimum
- **E2E tests**: All critical user journeys

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Deterministic**: Avoid flaky tests with timeouts
3. **Fast Feedback**: Unit tests < 100ms, integration < 1s
4. **Clear Assertions**: One logical assertion per test
5. **Property Coverage**: Test edge cases with generators

## CI/CD Integration

```yaml
# .gitlab-ci.yml
test:agent:
  stage: test
  script:
    - ossa test run tests/**/*.test.yaml
    - ossa test coverage --min 80
  artifacts:
    reports:
      junit: test-results.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
```
