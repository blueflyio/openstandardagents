# Test Generator for OSSA Exports

Comprehensive test suite generation for all OSSA export formats.

## Overview

The Test Generator automatically creates production-grade test suites for exported agents, including:

- **Unit tests**: Individual component testing with mocked dependencies
- **Integration tests**: End-to-end agent execution tests
- **Load tests**: Performance and scalability testing
- **Security tests**: Input validation, injection prevention, safety checks
- **Cost tests**: Token counting, budget limits, cost optimization

## Supported Platforms

### LangChain (Python + pytest)

Generates comprehensive pytest test suites:

- `tests/unit/test_agent.py` - Agent initialization and execution
- `tests/unit/test_tools.py` - Tool validation and execution
- `tests/unit/test_memory.py` - Memory backends testing
- `tests/unit/test_callbacks.py` - Cost tracking and observability
- `tests/integration/test_agent_execution.py` - End-to-end execution
- `tests/integration/test_error_handling.py` - Retry, circuit breaker, fallback
- `tests/load/test_performance.py` - Throughput and concurrency
- `tests/security/test_input_validation.py` - Injection prevention
- `tests/cost/test_budget_limits.py` - Budget enforcement

### KAgent (Kubernetes)

Generates K8s manifest validation tests:

- `tests/test_manifests.py` - Manifest validity checks
- Resource limit validation
- Health check verification
- Security context validation

### Drupal (PHPUnit)

Generates Drupal module tests:

- `tests/src/Kernel/{Module}Test.php` - Kernel tests (service testing)
- `tests/src/Functional/{Module}FunctionalTest.php` - Functional tests (UI/API)
- `phpunit.xml` - PHPUnit configuration

### Temporal (Workflow Replay)

Generates workflow replay tests:

- `tests/workflow_test.py` - Determinism validation
- Activity testing
- Error handling

### N8N (Workflow Execution)

Generates N8N workflow tests:

- `tests/workflow_test.js` - Workflow validation
- Node connection testing

## Usage

### Basic Usage

```typescript
import { TestGenerator } from './services/export/testing';

const generator = new TestGenerator();

// Generate LangChain tests
const testSuite = generator.generateLangChainTests(manifest, {
  includeUnit: true,
  includeIntegration: true,
  includeLoad: true,
  includeSecurity: true,
  includeCost: true,
});

// Files, configs, and fixtures
console.log(testSuite.files);      // Test files
console.log(testSuite.configs);    // pytest.ini, conftest.py
console.log(testSuite.fixtures);   // test_data.json
```

### CLI Usage

```bash
# Export with tests
ossa export agent.yaml --platform langchain --include-tests

# This generates:
# - agent.py
# - tools.py
# - server.py
# - tests/ (comprehensive test suite)
# - pytest.ini
# - requirements.txt (with test dependencies)
```

### Customization

```typescript
// Custom test options
const testSuite = generator.generateLangChainTests(manifest, {
  includeUnit: true,          // Unit tests
  includeIntegration: true,   // Integration tests
  includeLoad: false,         // Skip load tests
  includeSecurity: true,      // Security tests
  includeCost: true,          // Cost tracking tests
  mockLLM: true,             // Mock LLM by default
  framework: 'pytest',        // Test framework
});
```

## Test Types

### Unit Tests

**Purpose**: Test individual components in isolation

**Features**:
- Mocked LLM calls (no API keys required)
- Fast execution (< 1s per test)
- High coverage of edge cases

**Example**:
```python
def test_agent_creation():
    """Test agent can be created"""
    agent = create_agent()
    assert agent is not None
    assert agent.tools is not None
```

### Integration Tests

**Purpose**: Test end-to-end agent behavior

**Features**:
- Real or mocked LLM execution
- Tool usage validation
- Memory persistence testing
- Cost tracking verification

**Example**:
```python
def test_agent_execution(agent_fixture):
    """Test agent execution"""
    response = run("Test input")

    assert response['success'] is True
    assert 'output' in response
    assert response['cost']['total_tokens'] > 0
```

### Load Tests

**Purpose**: Test performance under load

**Features**:
- Throughput measurement
- Concurrent request handling
- Sustained load testing
- Memory leak detection

**Example**:
```python
def test_concurrent_load():
    """Test concurrent request handling"""
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(make_request, i) for i in range(50)]
        results = [f.result() for f in futures]

    success_rate = sum(1 for r in results if r['success']) / len(results)
    assert success_rate >= 0.8  # 80% success rate
```

### Security Tests

**Purpose**: Test input validation and safety

**Features**:
- SQL injection prevention
- Command injection prevention
- XSS prevention
- Prompt injection handling
- Sensitive data redaction

**Example**:
```python
def test_sql_injection_attempt():
    """Test SQL injection is prevented"""
    malicious_input = "'; DROP TABLE users; --"

    response = run(malicious_input)

    # Should handle safely without executing SQL
    assert response is not None
```

### Cost Tests

**Purpose**: Test cost tracking and budget limits

**Features**:
- Token counting accuracy
- Cost calculation verification
- Budget limit enforcement
- Cost optimization validation

**Example**:
```python
def test_budget_limit_enforced():
    """Test cost limit is enforced"""
    tracker = get_cost_tracker()
    tracker.set_cost_limit(0.10)  # $0.10 limit

    # Make many requests
    for i in range(50):
        response = run(f"Request {i}")
        summary = tracker.get_summary()
        if summary['total_cost'] >= 0.10:
            break

    # Should not exceed limit significantly
    assert tracker.get_summary()['total_cost'] <= 0.12
```

## Running Tests

### LangChain (pytest)

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-mock

# Run all tests
pytest tests/ -v

# Run specific test type
pytest tests/unit/ -v              # Unit tests only
pytest tests/integration/ -v       # Integration tests
pytest tests/load/ -v              # Load tests
pytest tests/security/ -v          # Security tests

# Run with coverage
pytest tests/ --cov=. --cov-report=html

# Run with real LLM (requires API keys)
pytest tests/ --use-real-llm

# Run tests requiring Redis/Postgres
pytest tests/ --redis --postgres

# Skip slow tests
pytest tests/ -m "not slow"
```

### Drupal (PHPUnit)

```bash
# Run all tests
phpunit

# Run kernel tests
phpunit --testsuite kernel

# Run functional tests
phpunit --testsuite functional

# Run with coverage
phpunit --coverage-html coverage/
```

### Temporal (pytest)

```bash
# Run workflow tests
pytest tests/workflow_test.py -v
```

### N8N (Jest)

```bash
# Run workflow tests
npm test
```

## Test Data

The generator creates test fixtures automatically:

**`tests/fixtures/test_data.json`**:
```json
{
  "agent_metadata": {
    "name": "my-agent",
    "version": "1.0.0"
  },
  "sample_prompts": [
    "Hello, what can you help me with?",
    "Tell me about your capabilities"
  ],
  "tools": [
    {
      "tool_name": "search",
      "sample_inputs": [{"query": "test"}]
    }
  ],
  "test_scenarios": [
    {
      "name": "basic_conversation",
      "steps": [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi!"}
      ]
    }
  ]
}
```

## pytest Configuration

**`pytest.ini`**:
```ini
[pytest]
# Test discovery
python_files = test_*.py
python_classes = Test*
python_functions = test_*

# Output options
addopts = -v --tb=short --strict-markers

# Markers
markers =
    unit: Unit tests
    integration: Integration tests
    load: Load tests
    security: Security tests
    cost: Cost tests
    slow: Slow tests
```

**`tests/conftest.py`**:
- Shared fixtures
- Mock LLM by default
- Test data loading
- Environment setup

## Best Practices

### 1. Mock by Default

Tests use mocked LLM calls by default:
- No API keys required
- Fast execution
- Deterministic results

```python
# Use real LLM only when needed
pytest tests/ --use-real-llm
```

### 2. Test Isolation

Each test is isolated:
- Fresh agent instance
- Clean environment
- Reset cost tracker

### 3. Error Handling

Tests verify error handling:
- Invalid input
- Network failures
- Rate limiting
- Budget exceeded

### 4. Cost Awareness

Tests track costs:
- Token counting
- Budget limits
- Cost optimization
- Warning thresholds

### 5. Security First

Tests validate security:
- Input sanitization
- Injection prevention
- Data redaction
- Access control

## Extending

### Add Custom Tests

Create custom test file:

```python
# tests/custom/test_my_feature.py
import pytest
from agent import run

def test_my_custom_feature():
    """Test my custom feature"""
    response = run("Custom test")
    assert response['success']
```

### Add Custom Fixtures

Extend conftest.py:

```python
# tests/conftest.py
@pytest.fixture
def my_fixture():
    """Custom fixture"""
    return {"data": "value"}
```

### Add Custom Markers

Extend pytest.ini:

```ini
markers =
    unit: Unit tests
    custom: My custom tests
```

Run with:
```bash
pytest tests/ -m custom
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests
        run: pytest tests/ -v --cov=.

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### GitLab CI

```yaml
test:
  stage: test
  image: python:3.11

  script:
    - pip install -r requirements.txt
    - pytest tests/ -v --cov=. --cov-report=xml

  coverage: '/TOTAL.*\s+(\d+%)$/'

  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
```

## Architecture

### DRY Principles

- Reusable test templates
- Shared fixtures
- Common utilities
- Parameterized tests

### SOLID Principles

- **Single Responsibility**: Each test tests one thing
- **Open/Closed**: Extend via fixtures and markers
- **Liskov Substitution**: Mock and real LLM interchangeable
- **Interface Segregation**: Test options configurable
- **Dependency Inversion**: Tests depend on interfaces, not implementations

## Performance

### Optimization

- Mocked LLM calls (10-100x faster)
- Parallel test execution
- Fixture caching
- Minimal setup/teardown

### Benchmarks

| Test Type | Count | Duration | Speed |
|-----------|-------|----------|-------|
| Unit      | 50+   | ~5s      | Fast  |
| Integration | 20+ | ~30s     | Medium |
| Load      | 10+   | ~60s     | Slow  |
| Security  | 30+   | ~10s     | Fast  |
| Cost      | 15+   | ~15s     | Fast  |

**Total**: 125+ tests in ~2 minutes (with mocks)

## Troubleshooting

### Tests Fail with "No API Key"

**Solution**: Use mocked LLM (default):
```bash
pytest tests/  # Uses mocks by default
```

### Slow Tests

**Solution**: Skip slow tests:
```bash
pytest tests/ -m "not slow"
```

### Redis/Postgres Tests Fail

**Solution**: Skip infrastructure tests:
```bash
pytest tests/  # Skips by default
pytest tests/ --redis --postgres  # Enable explicitly
```

### Import Errors

**Solution**: Install in development mode:
```bash
pip install -e .
```

## License

MIT License - See LICENSE file

## Contributing

1. Add tests for new features
2. Maintain > 80% coverage
3. Follow pytest conventions
4. Document fixtures
5. Use type hints

## Support

- Documentation: `/docs/testing.md`
- Issues: GitHub Issues
- Examples: `/examples/testing/`
