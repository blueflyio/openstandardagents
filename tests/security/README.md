# OSSA Security Test Suite

Comprehensive security test suite for the Open Standards for Scalable Agents (OSSA) platform, validating authentication, trust scoring, malicious agent protection, and audit trail security.

## Overview

This test suite provides extensive security validation for the OSSA v0.1.8 platform, covering:

- **Authentication Framework**: Multi-factor authentication, OAuth2 PKCE, mTLS, SAML 2.0, API keys, session management
- **Trust Scoring System**: Trust calculation, manipulation resistance, privacy protection, reputation integrity
- **Malicious Agent Protection**: Code injection prevention, resource monitoring, behavior anomaly detection, sandboxing
- **Audit Trail Security**: Hash-chain verification, cryptographic signatures, immutability, distributed consistency

## Test Structure

```
tests/security/
├── __init__.py                           # Package initialization and exports
├── conftest.py                          # Pytest configuration and fixtures
├── pytest.ini                          # Pytest settings and markers
├── requirements.txt                     # Test dependencies
├── README.md                           # This documentation
├── test_authentication_framework.py    # Authentication security tests
├── test_trust_scoring_system.py       # Trust scoring security tests
├── test_malicious_agent_protection.py # Malicious agent protection tests
└── test_audit_trail_security.py       # Audit trail security tests
```

## Quick Start

### Installation

```bash
# Navigate to the security tests directory
cd tests/security

# Install test dependencies
pip install -r requirements.txt

# Or install in a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Running Tests

```bash
# Run all security tests
pytest

# Run specific test categories
pytest -m authentication      # Authentication tests only
pytest -m trust_scoring       # Trust scoring tests only
pytest -m malicious_protection # Malicious agent protection tests
pytest -m audit_trail         # Audit trail tests only

# Run with verbose output
pytest -v

# Run performance tests (may be slow)
pytest -m performance

# Run critical security tests only
pytest -m critical

# Generate coverage report
pytest --cov=../../src --cov-report=html --cov-report=term-missing
```

### Running Specific Tests

```bash
# Authentication framework tests
pytest test_authentication_framework.py -v

# Trust scoring system tests  
pytest test_trust_scoring_system.py -v

# Malicious agent protection tests
pytest test_malicious_agent_protection.py -v

# Audit trail security tests
pytest test_audit_trail_security.py -v

# Run a specific test class
pytest test_authentication_framework.py::TestAPIKeySecurity -v

# Run a specific test method
pytest test_trust_scoring_system.py::TestTrustScoringCore::test_trust_score_calculation_bounds -v
```

## Test Categories

### Authentication Framework Tests

**File**: `test_authentication_framework.py`

- **TestAPIKeySecurity**: API key generation, validation, rate limiting, revocation
- **TestOAuth2PKCESecurity**: PKCE implementation, token validation, scope validation
- **TestMTLSSecurity**: Certificate validation, chain verification, revocation checking
- **TestSAML2Security**: Assertion validation, signature verification
- **TestMultiFactorAuthentication**: TOTP validation, backup codes, MFA enforcement
- **TestSessionSecurity**: Session management, timeout mechanisms, fixation protection
- **TestTokenLifecycleManagement**: Token expiration, blacklisting, rotation

### Trust Scoring System Tests

**File**: `test_trust_scoring_system.py`

- **TestTrustScoringCore**: Score calculation, bounds checking, consistency validation
- **TestTrustScoreManipulationResistance**: Signature validation, version integrity, tampering detection
- **TestTrustChainVerification**: Chain integrity, chronological ordering, hash verification
- **TestTrustDecayMechanisms**: Time-based decay, inactivity penalties, rate limiting
- **TestReputationSystemIntegrity**: Score aggregation, review validation, Sybil resistance
- **TestTrustScorePrivacyProtection**: Anonymization, differential privacy, secure aggregation

### Malicious Agent Protection Tests

**File**: `test_malicious_agent_protection.py`

- **TestMaliciousCodeInjectionPrevention**: Python/JavaScript/SQL/command injection detection
- **TestResourceConsumptionMonitoring**: CPU/memory/network/filesystem monitoring and limits
- **TestAgentBehaviorAnomalyDetection**: Behavior profiling, anomaly detection, unauthorized operations
- **TestSandboxingAndIsolation**: File system isolation, network restrictions, process limits
- **TestAgentCommunicationSecurity**: Message authentication, encryption, replay protection

### Audit Trail Security Tests  

**File**: `test_audit_trail_security.py`

- **TestAuditHashChainIntegrity**: Hash chain creation, verification, tampering detection
- **TestAuditSignatureVerification**: Cryptographic signatures, batch verification, algorithm strength
- **TestAuditLogImmutability**: Write-once semantics, tamper evidence, atomic operations
- **TestDistributedAuditLogConsistency**: Multi-node consistency, partition resilience, consensus
- **TestAuditPerformanceAndScalability**: High-volume ingestion, concurrent operations, memory efficiency

## Test Markers

Tests are organized using pytest markers for easy filtering:

- `@pytest.mark.authentication` - Authentication framework tests
- `@pytest.mark.trust_scoring` - Trust scoring system tests  
- `@pytest.mark.malicious_protection` - Malicious agent protection tests
- `@pytest.mark.audit_trail` - Audit trail security tests
- `@pytest.mark.performance` - Performance and scalability tests
- `@pytest.mark.slow` - Tests that may take more than 10 seconds
- `@pytest.mark.critical` - Critical security tests that must pass
- `@pytest.mark.compliance` - Compliance-related security tests

## Configuration

### Test Configuration

Key configuration options in `pytest.ini`:

```ini
[tool:pytest]
testpaths = .
addopts = -v --tb=short --strict-markers --color=yes --durations=10
markers = authentication, trust_scoring, malicious_protection, audit_trail
timeout = 300  # 5 minute default timeout
asyncio_mode = auto
```

### Fixtures and Utilities

Common fixtures provided in `conftest.py`:

- `mock_config`: Mock OSSA configuration
- `security_test_data`: Common test data and patterns
- `mock_crypto_keys`: Generated cryptographic keys for testing
- `security_event_factory`: Factory for creating test events
- `performance_monitor`: Performance monitoring utilities
- `security_assertion_helpers`: Security-specific assertion helpers

## Security Test Patterns

### Testing Authentication

```python
def test_api_key_security(self, mock_api_key):
    """Test API key security validation"""
    # Test entropy
    assert len(mock_api_key) > 40
    assert mock_api_key.startswith("ossa_key_")
    
    # Test validation
    assert self.validator.validate_key(mock_api_key)
    assert not self.validator.validate_key("invalid_key")
```

### Testing Trust Scores

```python
def test_trust_score_bounds(self, trust_calculator, behavior_metrics):
    """Test trust score stays within bounds"""
    score = trust_calculator.calculate(behavior_metrics)
    assert 0.0 <= score <= 1.0
```

### Testing Malicious Protection

```python
def test_code_injection_detection(self, code_scanner):
    """Test detection of code injection"""
    malicious_code = "import os; os.system('rm -rf /')"
    threat_detected, level = code_scanner.scan(malicious_code)
    assert threat_detected
    assert level >= ThreatLevel.HIGH
```

### Testing Audit Trails

```python
def test_hash_chain_integrity(self, hash_chain_manager, events):
    """Test hash chain integrity"""
    chain = hash_chain_manager.create_chain(events)
    is_valid, error = hash_chain_manager.verify_integrity(chain)
    assert is_valid, f"Chain integrity failed: {error}"
```

## Performance Testing

Performance tests are marked with `@pytest.mark.performance` and `@pytest.mark.slow`:

```bash
# Run only performance tests
pytest -m performance

# Skip slow tests for quick validation
pytest -m "not slow"

# Run with performance monitoring
pytest --benchmark-only
```

### Performance Assertions

```python
def test_high_volume_processing(self, performance_monitor):
    """Test high-volume event processing"""
    performance_monitor.start_monitoring()
    
    # Process large batch of events
    result = system.process_batch(large_event_batch)
    
    # Assert performance within limits
    performance_monitor.assert_performance_limits(
        max_time=10.0,      # 10 seconds
        max_memory_mb=512   # 512 MB
    )
```

## Integration with OSSA Platform

### Running Tests Against Real OSSA Services

```bash
# Set environment variables for real service testing
export OSSA_API_URL="http://localhost:3000"
export OSSA_API_KEY="your-test-api-key"

# Run integration tests
pytest -m integration
```

### Mock vs Real Testing

Tests use mocks by default for fast, isolated testing. For integration testing:

```python
@pytest.mark.integration
def test_real_authentication_service():
    """Test against real authentication service"""
    if os.getenv('OSSA_API_URL'):
        # Test against real service
        pass
    else:
        pytest.skip("Integration testing requires OSSA_API_URL")
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Security Tests
on: [push, pull_request]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          cd tests/security
          pip install -r requirements.txt
      
      - name: Run critical security tests
        run: |
          cd tests/security
          pytest -m critical --junitxml=results.xml
      
      - name: Run all security tests
        run: |
          cd tests/security  
          pytest --junitxml=all-results.xml
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Ensure PYTHONPATH includes OSSA src directory
   export PYTHONPATH="${PYTHONPATH}:../../src"
   pytest
   ```

2. **Timeout Issues**
   ```bash
   # Increase timeout for slow tests
   pytest --timeout=600  # 10 minutes
   ```

3. **Performance Test Failures**
   ```bash
   # Run performance tests in isolation
   pytest -m performance --maxfail=1 -x
   ```

### Debugging Tests

```bash
# Run with debugging output
pytest -s -vvv --tb=long

# Run single test with debugging
pytest test_file.py::test_name -s --pdb

# Capture stdout/stderr
pytest --capture=no
```

## Contributing

### Adding New Security Tests

1. Follow existing test patterns and naming conventions
2. Use appropriate markers (`@pytest.mark.authentication`, etc.)
3. Include performance assertions for scalability-critical tests
4. Add comprehensive docstrings explaining security implications
5. Use fixtures from `conftest.py` for common setup

### Test Coverage Guidelines

- **Authentication**: Cover all authentication methods and edge cases
- **Authorization**: Test all permission models and access patterns
- **Trust Scoring**: Validate all score components and manipulation attempts
- **Audit Trails**: Verify integrity, immutability, and performance
- **Error Handling**: Test security-relevant error conditions
- **Performance**: Ensure security measures don't impact performance excessively

## Security Considerations

### Test Data Security

- Never use real credentials or sensitive data in tests
- Generate mock data with appropriate entropy
- Clean up temporary files and directories
- Use secure random generation for test keys and tokens

### Test Isolation

- Each test should be independent and isolated
- Clean up global state between tests
- Use mocks to prevent external dependencies
- Avoid shared mutable state between test classes

### Performance Impact

- Security tests should validate performance doesn't degrade
- Include load testing for security-critical components
- Monitor memory usage during security operations
- Test concurrent access to security services

## License

Apache 2.0 License - see [LICENSE](../../LICENSE) file for details.

---

**🔒 OSSA Security Test Suite v0.1.8**

Comprehensive security validation for the Open Standards for Scalable Agents platform, ensuring robust authentication, trust management, malicious agent protection, and audit trail integrity.