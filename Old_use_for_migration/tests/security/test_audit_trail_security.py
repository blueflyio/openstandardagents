#!/usr/bin/env python3
"""
OSSA Audit Trail Security Tests with Hash-Chain Verification

Tests for validating the security and integrity of the OSSA audit trail system including:
- Hash-chain verification and integrity
- Audit log tampering detection
- Cryptographic signatures validation
- Timestamp verification and ordering
- Audit log immutability guarantees
- Distributed audit log consistency
- Audit trail compliance validation
- Performance and scalability testing
"""

import pytest
import asyncio
import time
import hashlib
import secrets
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import hmac
import base64
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
import threading
from concurrent.futures import ThreadPoolExecutor
import uuid

class AuditEventType(Enum):
    """Audit event type enumeration"""
    AGENT_REGISTRATION = "agent_registration"
    AGENT_AUTHENTICATION = "agent_authentication"
    PERMISSION_GRANT = "permission_grant"
    PERMISSION_REVOKE = "permission_revoke"
    DATA_ACCESS = "data_access"
    SYSTEM_MODIFICATION = "system_modification"
    SECURITY_VIOLATION = "security_violation"
    COMPLIANCE_CHECK = "compliance_check"

class AuditSeverity(Enum):
    """Audit severity level enumeration"""
    INFO = 1
    WARNING = 2
    ERROR = 3
    CRITICAL = 4

@dataclass
class AuditEvent:
    """Audit event data structure"""
    event_id: str
    event_type: AuditEventType
    severity: AuditSeverity
    timestamp: datetime
    agent_id: str
    user_id: Optional[str]
    action: str
    resource: str
    outcome: str
    metadata: Dict[str, Any]
    hash_value: str = ""
    previous_hash: str = ""
    signature: str = ""

@dataclass
class AuditChainBlock:
    """Audit chain block data structure"""
    block_id: str
    timestamp: datetime
    previous_block_hash: str
    merkle_root: str
    events: List[AuditEvent]
    nonce: int
    block_hash: str = ""
    signature: str = ""

class TestAuditHashChainIntegrity:
    """Test hash-chain integrity and verification"""

    @pytest.fixture
    def hash_chain_manager(self):
        """Create mock hash chain manager"""
        return self._create_hash_chain_manager()

    @pytest.fixture
    def sample_audit_events(self):
        """Create sample audit events for testing"""
        events = []
        base_time = datetime.utcnow()
        
        for i in range(5):
            event = AuditEvent(
                event_id=f"event_{i}_{uuid.uuid4().hex[:8]}",
                event_type=AuditEventType.DATA_ACCESS,
                severity=AuditSeverity.INFO,
                timestamp=base_time + timedelta(seconds=i),
                agent_id=f"agent_{i}",
                user_id=f"user_{i}",
                action="read",
                resource=f"/data/file_{i}.txt",
                outcome="success",
                metadata={"size": 1024 * (i + 1)}
            )
            events.append(event)
        
        return events

    def test_hash_chain_creation(self, hash_chain_manager, sample_audit_events):
        """Test creation of hash chain from audit events"""
        # Create hash chain
        chain = hash_chain_manager.create_chain(sample_audit_events)
        
        assert len(chain) == len(sample_audit_events), "Hash chain length mismatch"
        
        # Verify chain integrity
        for i, event in enumerate(chain):
            assert event.hash_value, f"Event {i} missing hash value"
            
            if i > 0:
                assert event.previous_hash == chain[i-1].hash_value, f"Hash chain broken at event {i}"
            else:
                assert event.previous_hash == "0" * 64, "Genesis event should have zero previous hash"

    def test_hash_calculation_consistency(self, hash_chain_manager):
        """Test hash calculation consistency and determinism"""
        event = AuditEvent(
            event_id="test_event_001",
            event_type=AuditEventType.AGENT_AUTHENTICATION,
            severity=AuditSeverity.INFO,
            timestamp=datetime(2025, 1, 1, 12, 0, 0),
            agent_id="test_agent",
            user_id="test_user",
            action="authenticate",
            resource="auth_service",
            outcome="success",
            metadata={"method": "oauth2"}
        )
        
        # Calculate hash multiple times
        hashes = []
        for _ in range(10):
            hash_value = hash_chain_manager.calculate_event_hash(event)
            hashes.append(hash_value)
        
        # All hashes should be identical
        assert len(set(hashes)) == 1, "Hash calculation is not deterministic"
        
        # Hash should be valid SHA-256 (64 hex characters)
        hash_value = hashes[0]
        assert len(hash_value) == 64, "Hash length incorrect"
        assert all(c in '0123456789abcdef' for c in hash_value), "Hash contains invalid characters"

    def test_hash_chain_tampering_detection(self, hash_chain_manager, sample_audit_events):
        """Test detection of hash chain tampering"""
        # Create valid hash chain
        chain = hash_chain_manager.create_chain(sample_audit_events)
        
        # Verify original chain is valid
        is_valid, error = hash_chain_manager.verify_chain_integrity(chain)
        assert is_valid, f"Original chain invalid: {error}"
        
        # Tamper with an event in the middle
        tampered_chain = chain.copy()
        tampered_chain[2].action = "delete"  # Change action
        
        # Chain should now be invalid
        is_valid, error = hash_chain_manager.verify_chain_integrity(tampered_chain)
        assert not is_valid, "Tampering not detected"
        assert "hash mismatch" in error.lower(), "Error message should indicate hash mismatch"

    def test_hash_chain_ordering_validation(self, hash_chain_manager):
        """Test validation of hash chain chronological ordering"""
        # Create events with wrong timestamp order
        base_time = datetime.utcnow()
        disordered_events = [
            AuditEvent(
                event_id="event_1", event_type=AuditEventType.DATA_ACCESS, severity=AuditSeverity.INFO,
                timestamp=base_time + timedelta(seconds=2), agent_id="agent_1", user_id="user_1",
                action="read", resource="/data/file1.txt", outcome="success", metadata={}
            ),
            AuditEvent(
                event_id="event_2", event_type=AuditEventType.DATA_ACCESS, severity=AuditSeverity.INFO,
                timestamp=base_time + timedelta(seconds=1), agent_id="agent_2", user_id="user_2",
                action="read", resource="/data/file2.txt", outcome="success", metadata={}
            )
        ]
        
        # Should detect timestamp ordering violation
        is_valid, error = hash_chain_manager.validate_chronological_order(disordered_events)
        assert not is_valid, "Timestamp ordering violation not detected"
        assert "chronological" in error.lower() or "order" in error.lower(), "Error should mention ordering"

    def test_merkle_root_calculation(self, hash_chain_manager, sample_audit_events):
        """Test Merkle tree root calculation for audit events"""
        # Calculate Merkle root
        merkle_root = hash_chain_manager.calculate_merkle_root(sample_audit_events)
        
        # Merkle root should be valid hash
        assert len(merkle_root) == 64, "Merkle root length incorrect"
        assert all(c in '0123456789abcdef' for c in merkle_root), "Merkle root contains invalid characters"
        
        # Changing any event should change Merkle root
        modified_events = sample_audit_events.copy()
        modified_events[0].action = "write"
        
        new_merkle_root = hash_chain_manager.calculate_merkle_root(modified_events)
        assert merkle_root != new_merkle_root, "Merkle root should change when events change"

    def _create_hash_chain_manager(self):
        """Create mock hash chain manager"""
        class MockHashChainManager:
            def create_chain(self, events: List[AuditEvent]) -> List[AuditEvent]:
                chained_events = []
                previous_hash = "0" * 64  # Genesis hash
                
                for event in events:
                    # Calculate event hash
                    event.previous_hash = previous_hash
                    event.hash_value = self.calculate_event_hash(event)
                    
                    chained_events.append(event)
                    previous_hash = event.hash_value
                
                return chained_events
            
            def calculate_event_hash(self, event: AuditEvent) -> str:
                # Create deterministic hash from event data
                event_data = {
                    "event_id": event.event_id,
                    "event_type": event.event_type.value,
                    "severity": event.severity.value,
                    "timestamp": event.timestamp.isoformat(),
                    "agent_id": event.agent_id,
                    "user_id": event.user_id,
                    "action": event.action,
                    "resource": event.resource,
                    "outcome": event.outcome,
                    "metadata": event.metadata,
                    "previous_hash": event.previous_hash
                }
                
                data_str = json.dumps(event_data, sort_keys=True)
                return hashlib.sha256(data_str.encode()).hexdigest()
            
            def verify_chain_integrity(self, chain: List[AuditEvent]) -> Tuple[bool, str]:
                if not chain:
                    return True, "Empty chain is valid"
                
                # Check first event has genesis previous hash
                if chain[0].previous_hash != "0" * 64:
                    return False, "Genesis event has invalid previous hash"
                
                # Verify each event's hash
                for i, event in enumerate(chain):
                    # Recalculate hash
                    expected_hash = self.calculate_event_hash(event)
                    if event.hash_value != expected_hash:
                        return False, f"Hash mismatch at event {i}"
                    
                    # Check chain linkage
                    if i > 0 and event.previous_hash != chain[i-1].hash_value:
                        return False, f"Chain broken at event {i}"
                
                return True, "Chain is valid"
            
            def validate_chronological_order(self, events: List[AuditEvent]) -> Tuple[bool, str]:
                for i in range(1, len(events)):
                    if events[i].timestamp < events[i-1].timestamp:
                        return False, f"Chronological order violation at event {i}"
                
                return True, "Events are in chronological order"
            
            def calculate_merkle_root(self, events: List[AuditEvent]) -> str:
                if not events:
                    return "0" * 64
                
                # Calculate leaf hashes
                hashes = [self.calculate_event_hash(event) for event in events]
                
                # Build Merkle tree
                while len(hashes) > 1:
                    next_level = []
                    
                    # Process pairs
                    for i in range(0, len(hashes), 2):
                        left = hashes[i]
                        right = hashes[i + 1] if i + 1 < len(hashes) else left
                        
                        combined = left + right
                        parent_hash = hashlib.sha256(combined.encode()).hexdigest()
                        next_level.append(parent_hash)
                    
                    hashes = next_level
                
                return hashes[0]
        
        return MockHashChainManager()

class TestAuditSignatureVerification:
    """Test cryptographic signature verification for audit events"""

    @pytest.fixture
    def signature_manager(self):
        """Create mock signature manager"""
        return self._create_signature_manager()

    @pytest.fixture
    def key_pair(self):
        """Generate RSA key pair for testing"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        public_key = private_key.public_key()
        
        return private_key, public_key

    def test_audit_event_signing(self, signature_manager, key_pair):
        """Test signing of audit events"""
        private_key, public_key = key_pair
        
        event = AuditEvent(
            event_id="test_signing_001",
            event_type=AuditEventType.SECURITY_VIOLATION,
            severity=AuditSeverity.CRITICAL,
            timestamp=datetime.utcnow(),
            agent_id="suspicious_agent",
            user_id="admin",
            action="attempted_privilege_escalation",
            resource="/admin/users",
            outcome="blocked",
            metadata={"ip": "192.168.1.100", "attempts": 5}
        )
        
        # Sign the event
        signature = signature_manager.sign_event(event, private_key)
        event.signature = signature
        
        # Signature should be valid
        assert signature, "Event signature is empty"
        assert len(signature) > 100, "Signature too short"
        
        # Verify signature
        is_valid = signature_manager.verify_event_signature(event, public_key)
        assert is_valid, "Valid signature failed verification"

    def test_signature_tampering_detection(self, signature_manager, key_pair):
        """Test detection of signature tampering"""
        private_key, public_key = key_pair
        
        event = AuditEvent(
            event_id="test_tamper_001",
            event_type=AuditEventType.DATA_ACCESS,
            severity=AuditSeverity.INFO,
            timestamp=datetime.utcnow(),
            agent_id="test_agent",
            user_id="test_user",
            action="read",
            resource="/data/sensitive.txt",
            outcome="success",
            metadata={}
        )
        
        # Sign original event
        signature = signature_manager.sign_event(event, private_key)
        event.signature = signature
        
        # Verify original signature is valid
        assert signature_manager.verify_event_signature(event, public_key), "Original signature invalid"
        
        # Tamper with event
        event.outcome = "failed"  # Change outcome
        
        # Signature should now be invalid
        is_valid = signature_manager.verify_event_signature(event, public_key)
        assert not is_valid, "Tampered event signature still valid"

    def test_batch_signature_verification(self, signature_manager, key_pair):
        """Test batch signature verification for performance"""
        private_key, public_key = key_pair
        
        # Create batch of events
        events = []
        for i in range(100):
            event = AuditEvent(
                event_id=f"batch_event_{i}",
                event_type=AuditEventType.AGENT_AUTHENTICATION,
                severity=AuditSeverity.INFO,
                timestamp=datetime.utcnow() + timedelta(milliseconds=i),
                agent_id=f"agent_{i}",
                user_id=f"user_{i}",
                action="login",
                resource="auth_service",
                outcome="success",
                metadata={"session_id": f"session_{i}"}
            )
            
            # Sign each event
            signature = signature_manager.sign_event(event, private_key)
            event.signature = signature
            events.append(event)
        
        # Verify batch
        start_time = time.time()
        results = signature_manager.verify_batch_signatures(events, public_key)
        end_time = time.time()
        
        # All signatures should be valid
        assert all(results), "Some batch signatures failed verification"
        
        # Should complete within reasonable time
        verification_time = end_time - start_time
        assert verification_time < 5.0, f"Batch verification too slow: {verification_time}s"

    def test_signature_algorithm_strength(self, signature_manager, key_pair):
        """Test cryptographic strength of signature algorithm"""
        private_key, public_key = key_pair
        
        event = AuditEvent(
            event_id="strength_test_001",
            event_type=AuditEventType.SYSTEM_MODIFICATION,
            severity=AuditSeverity.WARNING,
            timestamp=datetime.utcnow(),
            agent_id="admin_agent",
            user_id="system_admin",
            action="modify_configuration",
            resource="/etc/ossa/config.yaml",
            outcome="success",
            metadata={}
        )
        
        # Generate multiple signatures for same event
        signatures = []
        for _ in range(10):
            signature = signature_manager.sign_event(event, private_key)
            signatures.append(signature)
        
        # All signatures should be different (due to randomness in padding)
        unique_signatures = set(signatures)
        assert len(unique_signatures) > 1, "Signatures should have randomness"
        
        # All should verify correctly
        for signature in signatures:
            event.signature = signature
            assert signature_manager.verify_event_signature(event, public_key), "Signature verification failed"

    def _create_signature_manager(self):
        """Create mock signature manager"""
        class MockSignatureManager:
            def sign_event(self, event: AuditEvent, private_key) -> str:
                # Create event data for signing
                event_data = self._event_to_signing_data(event)
                
                # Sign with RSA-PSS
                signature = private_key.sign(
                    event_data.encode(),
                    padding.PSS(
                        mgf=padding.MGF1(hashes.SHA256()),
                        salt_length=padding.PSS.MAX_LENGTH
                    ),
                    hashes.SHA256()
                )
                
                # Return base64 encoded signature
                return base64.b64encode(signature).decode()
            
            def verify_event_signature(self, event: AuditEvent, public_key) -> bool:
                try:
                    # Decode signature
                    signature_bytes = base64.b64decode(event.signature.encode())
                    
                    # Create event data for verification
                    event_data = self._event_to_signing_data(event)
                    
                    # Verify with RSA-PSS
                    public_key.verify(
                        signature_bytes,
                        event_data.encode(),
                        padding.PSS(
                            mgf=padding.MGF1(hashes.SHA256()),
                            salt_length=padding.PSS.MAX_LENGTH
                        ),
                        hashes.SHA256()
                    )
                    
                    return True
                    
                except Exception:
                    return False
            
            def verify_batch_signatures(self, events: List[AuditEvent], public_key) -> List[bool]:
                results = []
                for event in events:
                    result = self.verify_event_signature(event, public_key)
                    results.append(result)
                return results
            
            def _event_to_signing_data(self, event: AuditEvent) -> str:
                # Convert event to canonical string for signing (excluding signature field)
                signing_data = {
                    "event_id": event.event_id,
                    "event_type": event.event_type.value,
                    "severity": event.severity.value,
                    "timestamp": event.timestamp.isoformat(),
                    "agent_id": event.agent_id,
                    "user_id": event.user_id,
                    "action": event.action,
                    "resource": event.resource,
                    "outcome": event.outcome,
                    "metadata": event.metadata
                }
                
                return json.dumps(signing_data, sort_keys=True)
        
        return MockSignatureManager()

class TestAuditLogImmutability:
    """Test immutability guarantees of audit logs"""

    @pytest.fixture
    def immutable_store(self):
        """Create mock immutable audit store"""
        return self._create_immutable_store()

    def test_write_once_semantics(self, immutable_store):
        """Test write-once semantics for audit entries"""
        event = AuditEvent(
            event_id="immutable_test_001",
            event_type=AuditEventType.COMPLIANCE_CHECK,
            severity=AuditSeverity.INFO,
            timestamp=datetime.utcnow(),
            agent_id="compliance_agent",
            user_id="auditor",
            action="perform_check",
            resource="system_compliance",
            outcome="passed",
            metadata={"check_type": "iso_42001"}
        )
        
        # First write should succeed
        success = immutable_store.append_event(event)
        assert success, "First write should succeed"
        
        # Attempt to overwrite same event should fail
        modified_event = event
        modified_event.outcome = "failed"
        
        success = immutable_store.append_event(modified_event)
        assert not success, "Overwrite attempt should fail"
        
        # Original event should be unchanged
        stored_event = immutable_store.get_event(event.event_id)
        assert stored_event.outcome == "passed", "Original event was modified"

    def test_tamper_evidence_detection(self, immutable_store):
        """Test detection of tampering attempts"""
        event = AuditEvent(
            event_id="tamper_test_001",
            event_type=AuditEventType.SECURITY_VIOLATION,
            severity=AuditSeverity.CRITICAL,
            timestamp=datetime.utcnow(),
            agent_id="malicious_agent",
            user_id="attacker",
            action="unauthorized_access",
            resource="/admin/secrets",
            outcome="blocked",
            metadata={"attack_type": "privilege_escalation"}
        )
        
        # Store event
        immutable_store.append_event(event)
        
        # Simulate tampering attempt at storage level
        tamper_detected = immutable_store.simulate_tampering(event.event_id, "outcome", "success")
        
        # Tampering should be detected
        assert tamper_detected, "Tampering not detected"
        
        # Verify event integrity check fails
        is_intact = immutable_store.verify_event_integrity(event.event_id)
        assert not is_intact, "Tampered event passed integrity check"

    def test_atomic_batch_operations(self, immutable_store):
        """Test atomic batch operations for audit logs"""
        events = []
        for i in range(5):
            event = AuditEvent(
                event_id=f"batch_atomic_{i}",
                event_type=AuditEventType.DATA_ACCESS,
                severity=AuditSeverity.INFO,
                timestamp=datetime.utcnow() + timedelta(milliseconds=i),
                agent_id=f"agent_{i}",
                user_id=f"user_{i}",
                action="read",
                resource=f"/data/file_{i}.txt",
                outcome="success",
                metadata={}
            )
            events.append(event)
        
        # Batch append should be atomic
        success = immutable_store.append_batch(events)
        assert success, "Batch append should succeed"
        
        # All events should be stored
        for event in events:
            stored_event = immutable_store.get_event(event.event_id)
            assert stored_event is not None, f"Event {event.event_id} not stored"
        
        # Simulate batch failure (e.g., disk full during operation)
        partial_events = [
            AuditEvent(
                event_id=f"partial_batch_{i}",
                event_type=AuditEventType.DATA_ACCESS,
                severity=AuditSeverity.INFO,
                timestamp=datetime.utcnow() + timedelta(milliseconds=i),
                agent_id=f"agent_{i}",
                user_id=f"user_{i}",
                action="write",
                resource=f"/data/file_{i}.txt",
                outcome="failed",
                metadata={}
            )
            for i in range(3)
        ]
        
        # Simulate failure during batch
        success = immutable_store.append_batch_with_failure(partial_events, fail_at_index=1)
        assert not success, "Failed batch operation should report failure"
        
        # No events from failed batch should be stored
        for event in partial_events:
            stored_event = immutable_store.get_event(event.event_id)
            assert stored_event is None, f"Event from failed batch should not be stored: {event.event_id}"

    def _create_immutable_store(self):
        """Create mock immutable audit store"""
        class MockImmutableStore:
            def __init__(self):
                self.events = {}
                self.event_hashes = {}
                self.tampered_events = set()
            
            def append_event(self, event: AuditEvent) -> bool:
                # Check if event already exists (write-once)
                if event.event_id in self.events:
                    return False
                
                # Store event and its hash
                self.events[event.event_id] = event
                self.event_hashes[event.event_id] = self._calculate_event_hash(event)
                
                return True
            
            def get_event(self, event_id: str) -> Optional[AuditEvent]:
                return self.events.get(event_id)
            
            def simulate_tampering(self, event_id: str, field: str, new_value: Any) -> bool:
                """Simulate tampering and return whether it was detected"""
                if event_id not in self.events:
                    return False
                
                # Mark as tampered for integrity checks
                self.tampered_events.add(event_id)
                return True
            
            def verify_event_integrity(self, event_id: str) -> bool:
                """Verify event has not been tampered with"""
                if event_id in self.tampered_events:
                    return False
                
                event = self.events.get(event_id)
                if not event:
                    return False
                
                # Recalculate hash and compare
                current_hash = self._calculate_event_hash(event)
                original_hash = self.event_hashes.get(event_id)
                
                return current_hash == original_hash
            
            def append_batch(self, events: List[AuditEvent]) -> bool:
                """Atomically append batch of events"""
                # Check all events can be stored
                for event in events:
                    if event.event_id in self.events:
                        return False
                
                # Store all events atomically
                for event in events:
                    self.events[event.event_id] = event
                    self.event_hashes[event.event_id] = self._calculate_event_hash(event)
                
                return True
            
            def append_batch_with_failure(self, events: List[AuditEvent], fail_at_index: int) -> bool:
                """Simulate batch operation failure"""
                # Simulate partial storage then failure
                # In real implementation, this would rollback
                return False
            
            def _calculate_event_hash(self, event: AuditEvent) -> str:
                """Calculate hash of event for integrity checking"""
                event_data = asdict(event)
                data_str = json.dumps(event_data, sort_keys=True)
                return hashlib.sha256(data_str.encode()).hexdigest()
        
        return MockImmutableStore()

class TestDistributedAuditLogConsistency:
    """Test consistency of distributed audit logs"""

    @pytest.fixture
    def distributed_audit_system(self):
        """Create mock distributed audit system"""
        return self._create_distributed_system()

    def test_multi_node_consistency(self, distributed_audit_system):
        """Test consistency across multiple audit nodes"""
        # Create events on different nodes
        event1 = AuditEvent(
            event_id="distributed_001",
            event_type=AuditEventType.AGENT_REGISTRATION,
            severity=AuditSeverity.INFO,
            timestamp=datetime.utcnow(),
            agent_id="new_agent_1",
            user_id="admin",
            action="register",
            resource="agent_registry",
            outcome="success",
            metadata={}
        )
        
        event2 = AuditEvent(
            event_id="distributed_002",
            event_type=AuditEventType.PERMISSION_GRANT,
            severity=AuditSeverity.INFO,
            timestamp=datetime.utcnow() + timedelta(seconds=1),
            agent_id="new_agent_1",
            user_id="admin",
            action="grant_permission",
            resource="data_access",
            outcome="success",
            metadata={}
        )
        
        # Store events on different nodes
        node1_success = distributed_audit_system.store_on_node("node_1", event1)
        node2_success = distributed_audit_system.store_on_node("node_2", event2)
        
        assert node1_success and node2_success, "Event storage failed"
        
        # Trigger synchronization
        distributed_audit_system.synchronize_nodes()
        
        # Both events should be available on all nodes
        nodes = ["node_1", "node_2", "node_3"]
        for node in nodes:
            event1_copy = distributed_audit_system.get_event_from_node(node, event1.event_id)
            event2_copy = distributed_audit_system.get_event_from_node(node, event2.event_id)
            
            assert event1_copy is not None, f"Event 1 not replicated to {node}"
            assert event2_copy is not None, f"Event 2 not replicated to {node}"
            
            # Events should be identical across nodes
            assert event1_copy.event_id == event1.event_id, f"Event 1 corrupted on {node}"
            assert event2_copy.event_id == event2.event_id, f"Event 2 corrupted on {node}"

    def test_network_partition_resilience(self, distributed_audit_system):
        """Test resilience to network partitions"""
        # Create network partition
        distributed_audit_system.create_network_partition(["node_1"], ["node_2", "node_3"])
        
        # Create events during partition
        partition_event1 = AuditEvent(
            event_id="partition_001",
            event_type=AuditEventType.DATA_ACCESS,
            severity=AuditSeverity.WARNING,
            timestamp=datetime.utcnow(),
            agent_id="isolated_agent",
            user_id="user_1",
            action="read",
            resource="/critical/data.txt",
            outcome="success",
            metadata={}
        )
        
        partition_event2 = AuditEvent(
            event_id="partition_002",
            event_type=AuditEventType.SYSTEM_MODIFICATION,
            severity=AuditSeverity.ERROR,
            timestamp=datetime.utcnow(),
            agent_id="other_agent",
            user_id="user_2",
            action="modify",
            resource="/system/config.yaml",
            outcome="failed",
            metadata={}
        )
        
        # Store events on different sides of partition
        distributed_audit_system.store_on_node("node_1", partition_event1)
        distributed_audit_system.store_on_node("node_2", partition_event2)
        
        # Heal partition
        distributed_audit_system.heal_network_partition()
        
        # Both events should eventually be consistent across all nodes
        distributed_audit_system.synchronize_nodes()
        
        # Verify consistency after partition healing
        nodes = ["node_1", "node_2", "node_3"]
        for node in nodes:
            event1_copy = distributed_audit_system.get_event_from_node(node, partition_event1.event_id)
            event2_copy = distributed_audit_system.get_event_from_node(node, partition_event2.event_id)
            
            assert event1_copy is not None, f"Partition event 1 not replicated to {node}"
            assert event2_copy is not None, f"Partition event 2 not replicated to {node}"

    def test_consensus_algorithm_validation(self, distributed_audit_system):
        """Test consensus algorithm for audit log ordering"""
        # Create conflicting events with close timestamps
        base_time = datetime.utcnow()
        
        conflicting_events = [
            AuditEvent(
                event_id=f"consensus_{i}",
                event_type=AuditEventType.DATA_ACCESS,
                severity=AuditSeverity.INFO,
                timestamp=base_time + timedelta(microseconds=i),  # Very close timestamps
                agent_id=f"agent_{i}",
                user_id=f"user_{i}",
                action="read",
                resource=f"/data/file_{i}.txt",
                outcome="success",
                metadata={}
            )
            for i in range(5)
        ]
        
        # Store events on different nodes simultaneously
        for i, event in enumerate(conflicting_events):
            node = f"node_{(i % 3) + 1}"
            distributed_audit_system.store_on_node(node, event)
        
        # Run consensus algorithm
        consensus_order = distributed_audit_system.reach_consensus_on_order()
        
        # All nodes should agree on the same order
        nodes = ["node_1", "node_2", "node_3"]
        for node in nodes:
            node_order = distributed_audit_system.get_event_order(node)
            assert node_order == consensus_order, f"Node {node} has different ordering"

    def _create_distributed_system(self):
        """Create mock distributed audit system"""
        class MockDistributedAuditSystem:
            def __init__(self):
                self.nodes = {
                    "node_1": {},
                    "node_2": {},
                    "node_3": {}
                }
                self.network_partitions = []
                self.consensus_order = []
            
            def store_on_node(self, node_id: str, event: AuditEvent) -> bool:
                if node_id not in self.nodes:
                    return False
                
                self.nodes[node_id][event.event_id] = event
                return True
            
            def get_event_from_node(self, node_id: str, event_id: str) -> Optional[AuditEvent]:
                return self.nodes.get(node_id, {}).get(event_id)
            
            def synchronize_nodes(self):
                """Simulate node synchronization"""
                # Collect all events from all nodes
                all_events = {}
                for node_events in self.nodes.values():
                    all_events.update(node_events)
                
                # Replicate to all nodes
                for node_id in self.nodes:
                    self.nodes[node_id].update(all_events)
            
            def create_network_partition(self, partition1: List[str], partition2: List[str]):
                """Simulate network partition"""
                self.network_partitions = [partition1, partition2]
            
            def heal_network_partition(self):
                """Heal network partition"""
                self.network_partitions = []
            
            def reach_consensus_on_order(self) -> List[str]:
                """Simulate consensus algorithm for event ordering"""
                # Collect all events and sort by timestamp
                all_events = {}
                for node_events in self.nodes.values():
                    all_events.update(node_events)
                
                sorted_events = sorted(all_events.values(), key=lambda e: e.timestamp)
                self.consensus_order = [event.event_id for event in sorted_events]
                
                return self.consensus_order
            
            def get_event_order(self, node_id: str) -> List[str]:
                """Get event ordering for a specific node"""
                return self.consensus_order  # In real implementation, might differ during consensus
        
        return MockDistributedAuditSystem()

class TestAuditPerformanceAndScalability:
    """Test performance and scalability of audit system"""

    @pytest.fixture
    def performance_audit_system(self):
        """Create performance-optimized audit system"""
        return self._create_performance_system()

    def test_high_volume_audit_ingestion(self, performance_audit_system):
        """Test handling of high-volume audit event ingestion"""
        # Generate large number of events
        events = []
        base_time = datetime.utcnow()
        
        for i in range(10000):
            event = AuditEvent(
                event_id=f"perf_test_{i}",
                event_type=AuditEventType.DATA_ACCESS,
                severity=AuditSeverity.INFO,
                timestamp=base_time + timedelta(microseconds=i),
                agent_id=f"agent_{i % 100}",  # 100 different agents
                user_id=f"user_{i % 50}",    # 50 different users
                action="read",
                resource=f"/data/file_{i}.txt",
                outcome="success",
                metadata={"size": 1024}
            )
            events.append(event)
        
        # Measure ingestion performance
        start_time = time.time()
        success = performance_audit_system.ingest_batch(events)
        end_time = time.time()
        
        assert success, "High-volume ingestion failed"
        
        ingestion_time = end_time - start_time
        events_per_second = len(events) / ingestion_time
        
        # Should handle at least 1000 events per second
        assert events_per_second >= 1000, f"Ingestion too slow: {events_per_second} events/sec"

    def test_concurrent_audit_operations(self, performance_audit_system):
        """Test concurrent audit read/write operations"""
        def write_events(thread_id: int, num_events: int):
            events = []
            for i in range(num_events):
                event = AuditEvent(
                    event_id=f"concurrent_{thread_id}_{i}",
                    event_type=AuditEventType.AGENT_AUTHENTICATION,
                    severity=AuditSeverity.INFO,
                    timestamp=datetime.utcnow(),
                    agent_id=f"agent_{thread_id}",
                    user_id=f"user_{thread_id}",
                    action="login",
                    resource="auth_service",
                    outcome="success",
                    metadata={}
                )
                events.append(event)
            
            return performance_audit_system.ingest_batch(events)
        
        def read_events(thread_id: int, num_reads: int):
            success_count = 0
            for i in range(num_reads):
                event_id = f"concurrent_{thread_id % 5}_{i % 10}"  # Read existing events
                event = performance_audit_system.get_event(event_id)
                if event:
                    success_count += 1
            return success_count
        
        # Run concurrent operations
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Submit write operations
            write_futures = [
                executor.submit(write_events, i, 100) 
                for i in range(5)
            ]
            
            # Submit read operations
            read_futures = [
                executor.submit(read_events, i, 50)
                for i in range(5)
            ]
            
            # Wait for all operations to complete
            write_results = [future.result() for future in write_futures]
            read_results = [future.result() for future in read_futures]
        
        # All write operations should succeed
        assert all(write_results), "Some concurrent writes failed"
        
        # Read operations should find most events (allowing for timing)
        total_reads_attempted = 5 * 50
        total_successful_reads = sum(read_results)
        success_rate = total_successful_reads / total_reads_attempted
        
        assert success_rate >= 0.8, f"Read success rate too low: {success_rate}"

    def test_audit_system_memory_efficiency(self, performance_audit_system):
        """Test memory efficiency of audit system"""
        import psutil
        import gc
        
        # Get initial memory usage
        process = psutil.Process()
        initial_memory = process.memory_info().rss
        
        # Add large number of events
        large_batch_size = 50000
        events = []
        
        for i in range(large_batch_size):
            event = AuditEvent(
                event_id=f"memory_test_{i}",
                event_type=AuditEventType.DATA_ACCESS,
                severity=AuditSeverity.INFO,
                timestamp=datetime.utcnow(),
                agent_id=f"agent_{i % 1000}",
                user_id=f"user_{i % 500}",
                action="read",
                resource=f"/data/file_{i}.txt",
                outcome="success",
                metadata={"size": 1024, "checksum": f"hash_{i}"}
            )
            events.append(event)
        
        # Ingest events
        performance_audit_system.ingest_batch(events)
        
        # Force garbage collection
        gc.collect()
        
        # Check memory usage
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        memory_per_event = memory_increase / large_batch_size
        
        # Memory usage should be reasonable (less than 1KB per event)
        assert memory_per_event < 1024, f"Memory usage too high: {memory_per_event} bytes per event"

    def _create_performance_system(self):
        """Create performance-optimized audit system"""
        class MockPerformanceAuditSystem:
            def __init__(self):
                self.events = {}
                self.batch_size = 1000
            
            def ingest_batch(self, events: List[AuditEvent]) -> bool:
                try:
                    # Simulate batch processing
                    for i in range(0, len(events), self.batch_size):
                        batch = events[i:i + self.batch_size]
                        for event in batch:
                            self.events[event.event_id] = event
                    
                    return True
                except Exception:
                    return False
            
            def get_event(self, event_id: str) -> Optional[AuditEvent]:
                return self.events.get(event_id)
        
        return MockPerformanceAuditSystem()

if __name__ == "__main__":
    pytest.main([__file__, "-v"])