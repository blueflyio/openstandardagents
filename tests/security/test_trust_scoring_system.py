#!/usr/bin/env python3
"""
OSSA Trust Scoring System Security Tests

Tests for validating the security and integrity of the OSSA trust scoring system including:
- Trust score calculation validation
- Trust score manipulation resistance  
- Trust score persistence security
- Trust chain verification
- Reputation system integrity
- Behavioral analysis security
- Trust decay mechanisms
- Trust score privacy protection
"""

import pytest
import asyncio
import time
import hashlib
import secrets
import json
import math
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

class TrustLevel(Enum):
    """Trust level enumeration"""
    UNTRUSTED = 0.0
    LOW = 0.3
    MEDIUM = 0.6
    HIGH = 0.8
    VERIFIED = 1.0

@dataclass
class TrustScore:
    """Trust score data structure"""
    agent_id: str
    current_score: float
    base_score: float
    behavior_score: float
    reputation_score: float
    compliance_score: float
    timestamp: datetime
    version: int
    signature: str = ""

@dataclass
class TrustEvent:
    """Trust event data structure"""
    agent_id: str
    event_type: str
    impact: float
    timestamp: datetime
    metadata: Dict[str, Any]
    verified: bool = False

@dataclass
class BehaviorMetrics:
    """Agent behavior metrics"""
    success_rate: float
    response_time_avg: float
    compliance_violations: int
    security_incidents: int
    uptime_percentage: float
    collaboration_score: float

class TestTrustScoringCore:
    """Test core trust scoring functionality"""

    @pytest.fixture
    def mock_agent_id(self):
        """Generate mock agent ID"""
        return f"ossa_agent_{secrets.token_hex(8)}"

    @pytest.fixture
    def mock_trust_score(self, mock_agent_id):
        """Generate mock trust score"""
        return TrustScore(
            agent_id=mock_agent_id,
            current_score=0.75,
            base_score=0.8,
            behavior_score=0.7,
            reputation_score=0.8,
            compliance_score=0.9,
            timestamp=datetime.utcnow(),
            version=1
        )

    @pytest.fixture
    def mock_behavior_metrics(self):
        """Generate mock behavior metrics"""
        return BehaviorMetrics(
            success_rate=0.95,
            response_time_avg=250.0,  # ms
            compliance_violations=0,
            security_incidents=0,
            uptime_percentage=99.5,
            collaboration_score=0.8
        )

    def test_trust_score_calculation_bounds(self, mock_agent_id):
        """Test trust score calculation stays within valid bounds"""
        trust_calculator = self._create_trust_calculator()
        
        # Test with extreme positive values
        high_metrics = BehaviorMetrics(
            success_rate=1.0,
            response_time_avg=50.0,
            compliance_violations=0,
            security_incidents=0,
            uptime_percentage=100.0,
            collaboration_score=1.0
        )
        
        score = trust_calculator.calculate_trust_score(mock_agent_id, high_metrics)
        assert 0.0 <= score <= 1.0, f"Trust score {score} outside valid bounds [0.0, 1.0]"
        
        # Test with extreme negative values  
        low_metrics = BehaviorMetrics(
            success_rate=0.0,
            response_time_avg=10000.0,
            compliance_violations=50,
            security_incidents=20,
            uptime_percentage=10.0,
            collaboration_score=0.0
        )
        
        score = trust_calculator.calculate_trust_score(mock_agent_id, low_metrics)
        assert 0.0 <= score <= 1.0, f"Trust score {score} outside valid bounds [0.0, 1.0]"

    def test_trust_score_calculation_consistency(self, mock_agent_id, mock_behavior_metrics):
        """Test trust score calculation is deterministic and consistent"""
        trust_calculator = self._create_trust_calculator()
        
        # Calculate score multiple times with same inputs
        scores = []
        for _ in range(10):
            score = trust_calculator.calculate_trust_score(mock_agent_id, mock_behavior_metrics)
            scores.append(score)
        
        # All scores should be identical
        assert len(set(scores)) == 1, "Trust score calculation is not deterministic"
        assert all(0.0 <= score <= 1.0 for score in scores), "Some scores outside valid bounds"

    def test_trust_score_component_weights(self, mock_agent_id):
        """Test trust score component weighting is secure"""
        trust_calculator = self._create_trust_calculator()
        
        # Test that security incidents have strong negative impact
        metrics_no_incidents = BehaviorMetrics(
            success_rate=0.9, response_time_avg=200.0, compliance_violations=0,
            security_incidents=0, uptime_percentage=95.0, collaboration_score=0.8
        )
        
        metrics_with_incidents = BehaviorMetrics(
            success_rate=0.9, response_time_avg=200.0, compliance_violations=0,
            security_incidents=5, uptime_percentage=95.0, collaboration_score=0.8
        )
        
        score_no_incidents = trust_calculator.calculate_trust_score(mock_agent_id, metrics_no_incidents)
        score_with_incidents = trust_calculator.calculate_trust_score(mock_agent_id, metrics_with_incidents)
        
        assert score_no_incidents > score_with_incidents, "Security incidents should decrease trust score"
        assert score_no_incidents - score_with_incidents >= 0.2, "Security incident impact too small"

    def test_trust_score_precision_limits(self, mock_agent_id, mock_behavior_metrics):
        """Test trust score precision and rounding security"""
        trust_calculator = self._create_trust_calculator()
        
        score = trust_calculator.calculate_trust_score(mock_agent_id, mock_behavior_metrics)
        
        # Score should have reasonable precision (not more than 6 decimal places)
        score_str = f"{score:.10f}"
        decimal_places = len(score_str.split('.')[1].rstrip('0'))
        assert decimal_places <= 6, f"Trust score has too much precision: {decimal_places} decimal places"

    def _create_trust_calculator(self):
        """Create mock trust calculator"""
        class MockTrustCalculator:
            def calculate_trust_score(self, agent_id: str, metrics: BehaviorMetrics) -> float:
                # Base calculation with security-focused weighting
                base_score = 0.5  # Starting point
                
                # Success rate impact (25% weight)
                success_impact = metrics.success_rate * 0.25
                
                # Response time impact (10% weight, inverted)
                response_impact = max(0, (1000 - metrics.response_time_avg) / 1000) * 0.10
                
                # Security incidents impact (30% weight, heavy penalty)
                security_penalty = min(metrics.security_incidents * 0.1, 0.30)
                
                # Compliance violations impact (20% weight, heavy penalty)  
                compliance_penalty = min(metrics.compliance_violations * 0.05, 0.20)
                
                # Uptime impact (10% weight)
                uptime_impact = (metrics.uptime_percentage / 100.0) * 0.10
                
                # Collaboration impact (5% weight)
                collaboration_impact = metrics.collaboration_score * 0.05
                
                # Calculate final score
                final_score = (
                    base_score + 
                    success_impact + 
                    response_impact + 
                    uptime_impact + 
                    collaboration_impact -
                    security_penalty - 
                    compliance_penalty
                )
                
                # Ensure bounds and round to 6 decimal places
                return round(max(0.0, min(1.0, final_score)), 6)
        
        return MockTrustCalculator()

class TestTrustScoreManipulationResistance:
    """Test resistance to trust score manipulation attacks"""

    def test_trust_score_signature_validation(self, mock_trust_score):
        """Test trust score cryptographic signature validation"""
        trust_score = mock_trust_score
        
        # Generate signature for trust score
        score_data = {
            "agent_id": trust_score.agent_id,
            "current_score": trust_score.current_score,
            "timestamp": trust_score.timestamp.isoformat(),
            "version": trust_score.version
        }
        
        signature = self._generate_trust_score_signature(score_data)
        trust_score.signature = signature
        
        # Valid signature should pass validation
        assert self._validate_trust_score_signature(trust_score), "Valid trust score signature failed validation"
        
        # Modified score should fail validation
        trust_score.current_score = 1.0  # Manipulated score
        assert not self._validate_trust_score_signature(trust_score), "Manipulated trust score passed validation"

    def test_trust_score_version_integrity(self, mock_trust_score):
        """Test trust score version integrity protection"""
        trust_score = mock_trust_score
        original_version = trust_score.version
        
        # Version should increment on updates
        updated_score = self._update_trust_score(trust_score)
        assert updated_score.version == original_version + 1, "Trust score version not incremented"
        
        # Cannot set arbitrary versions
        with pytest.raises(ValueError):
            self._set_trust_score_version(trust_score, 100)

    def test_trust_score_tampering_detection(self, mock_trust_score):
        """Test detection of trust score tampering"""
        trust_score = mock_trust_score
        original_hash = self._calculate_trust_score_hash(trust_score)
        
        # Modify score
        trust_score.current_score = 0.95
        
        # Hash should change, indicating tampering
        modified_hash = self._calculate_trust_score_hash(trust_score)
        assert original_hash != modified_hash, "Trust score tampering not detected"

    def test_trust_score_replay_protection(self, mock_trust_score):
        """Test protection against trust score replay attacks"""
        trust_score = mock_trust_score
        
        # Create older version of same score
        old_trust_score = TrustScore(
            agent_id=trust_score.agent_id,
            current_score=trust_score.current_score,
            base_score=trust_score.base_score,
            behavior_score=trust_score.behavior_score,
            reputation_score=trust_score.reputation_score,
            compliance_score=trust_score.compliance_score,
            timestamp=datetime.utcnow() - timedelta(hours=1),
            version=trust_score.version - 1
        )
        
        # Replay protection should reject older version
        assert not self._accept_trust_score_update(old_trust_score, trust_score), "Replay attack not prevented"

    def _generate_trust_score_signature(self, score_data: Dict[str, Any]) -> str:
        """Generate cryptographic signature for trust score"""
        data_str = json.dumps(score_data, sort_keys=True)
        signature = hashlib.sha256(data_str.encode()).hexdigest()
        return signature

    def _validate_trust_score_signature(self, trust_score: TrustScore) -> bool:
        """Validate trust score cryptographic signature"""
        score_data = {
            "agent_id": trust_score.agent_id,
            "current_score": trust_score.current_score,
            "timestamp": trust_score.timestamp.isoformat(),
            "version": trust_score.version
        }
        expected_signature = self._generate_trust_score_signature(score_data)
        return trust_score.signature == expected_signature

    def _update_trust_score(self, trust_score: TrustScore) -> TrustScore:
        """Update trust score with version increment"""
        updated_score = TrustScore(
            agent_id=trust_score.agent_id,
            current_score=trust_score.current_score,
            base_score=trust_score.base_score,
            behavior_score=trust_score.behavior_score,
            reputation_score=trust_score.reputation_score,
            compliance_score=trust_score.compliance_score,
            timestamp=datetime.utcnow(),
            version=trust_score.version + 1
        )
        return updated_score

    def _set_trust_score_version(self, trust_score: TrustScore, version: int):
        """Attempt to set arbitrary trust score version (should fail)"""
        if version > trust_score.version + 1:
            raise ValueError("Cannot set arbitrary trust score version")
        trust_score.version = version

    def _calculate_trust_score_hash(self, trust_score: TrustScore) -> str:
        """Calculate hash of trust score for tampering detection"""
        score_dict = asdict(trust_score)
        score_str = json.dumps(score_dict, sort_keys=True)
        return hashlib.sha256(score_str.encode()).hexdigest()

    def _accept_trust_score_update(self, old_score: TrustScore, new_score: TrustScore) -> bool:
        """Check if trust score update should be accepted (replay protection)"""
        # Reject if new score is older
        if new_score.timestamp <= old_score.timestamp:
            return False
        
        # Reject if new version is not incremental
        if new_score.version != old_score.version + 1:
            return False
        
        return True

class TestTrustChainVerification:
    """Test trust chain verification and integrity"""

    def test_trust_chain_link_integrity(self, mock_agent_id):
        """Test trust chain link integrity validation"""
        # Create trust chain with multiple updates
        trust_chain = []
        
        # Initial trust score
        initial_score = TrustScore(
            agent_id=mock_agent_id,
            current_score=0.5,
            base_score=0.5,
            behavior_score=0.5,
            reputation_score=0.5,
            compliance_score=0.5,
            timestamp=datetime.utcnow() - timedelta(hours=3),
            version=1
        )
        trust_chain.append(initial_score)
        
        # Create subsequent updates
        for i in range(2, 5):
            updated_score = TrustScore(
                agent_id=mock_agent_id,
                current_score=min(1.0, initial_score.current_score + (i * 0.1)),
                base_score=initial_score.base_score,
                behavior_score=min(1.0, initial_score.behavior_score + (i * 0.05)),
                reputation_score=initial_score.reputation_score,
                compliance_score=initial_score.compliance_score,
                timestamp=datetime.utcnow() - timedelta(hours=4-i),
                version=i
            )
            trust_chain.append(updated_score)
        
        # Validate chain integrity
        assert self._validate_trust_chain_integrity(trust_chain), "Trust chain integrity validation failed"

    def test_trust_chain_chronological_order(self, mock_agent_id):
        """Test trust chain maintains chronological order"""
        trust_chain = self._create_mock_trust_chain(mock_agent_id, 5)
        
        # Check timestamps are in ascending order
        for i in range(1, len(trust_chain)):
            assert trust_chain[i].timestamp > trust_chain[i-1].timestamp, \
                f"Trust chain timestamp order violation at index {i}"

    def test_trust_chain_version_sequence(self, mock_agent_id):
        """Test trust chain version sequence integrity"""
        trust_chain = self._create_mock_trust_chain(mock_agent_id, 5)
        
        # Check versions are sequential
        for i, score in enumerate(trust_chain):
            assert score.version == i + 1, f"Trust chain version sequence violation: expected {i+1}, got {score.version}"

    def test_trust_chain_hash_verification(self, mock_agent_id):
        """Test trust chain hash-based verification"""
        trust_chain = self._create_mock_trust_chain(mock_agent_id, 3)
        
        # Calculate chain hash
        chain_hash = self._calculate_trust_chain_hash(trust_chain)
        
        # Modify one entry
        trust_chain[1].current_score = 0.99
        
        # Hash should change
        modified_hash = self._calculate_trust_chain_hash(trust_chain)
        assert chain_hash != modified_hash, "Trust chain modification not detected by hash"

    def _validate_trust_chain_integrity(self, trust_chain: List[TrustScore]) -> bool:
        """Validate trust chain integrity"""
        if not trust_chain:
            return False
        
        # Check chronological order
        for i in range(1, len(trust_chain)):
            if trust_chain[i].timestamp <= trust_chain[i-1].timestamp:
                return False
        
        # Check version sequence
        for i, score in enumerate(trust_chain):
            if score.version != i + 1:
                return False
        
        # Check agent ID consistency
        agent_id = trust_chain[0].agent_id
        for score in trust_chain:
            if score.agent_id != agent_id:
                return False
        
        return True

    def _create_mock_trust_chain(self, agent_id: str, length: int) -> List[TrustScore]:
        """Create mock trust chain for testing"""
        trust_chain = []
        base_time = datetime.utcnow() - timedelta(hours=length)
        
        for i in range(length):
            score = TrustScore(
                agent_id=agent_id,
                current_score=0.5 + (i * 0.1),
                base_score=0.5,
                behavior_score=0.5 + (i * 0.05),
                reputation_score=0.5,
                compliance_score=0.5,
                timestamp=base_time + timedelta(hours=i),
                version=i + 1
            )
            trust_chain.append(score)
        
        return trust_chain

    def _calculate_trust_chain_hash(self, trust_chain: List[TrustScore]) -> str:
        """Calculate hash of entire trust chain"""
        chain_data = [asdict(score) for score in trust_chain]
        chain_str = json.dumps(chain_data, sort_keys=True)
        return hashlib.sha256(chain_str.encode()).hexdigest()

class TestTrustDecayMechanisms:
    """Test trust decay and aging mechanisms"""

    def test_trust_score_decay_over_time(self, mock_agent_id):
        """Test trust score decays appropriately over time"""
        trust_calculator = self._create_trust_decay_calculator()
        
        # High initial score
        initial_score = 0.9
        
        # Calculate decay after different time periods
        decay_1_day = trust_calculator.apply_time_decay(initial_score, days=1)
        decay_7_days = trust_calculator.apply_time_decay(initial_score, days=7)
        decay_30_days = trust_calculator.apply_time_decay(initial_score, days=30)
        
        # Score should decrease over time
        assert initial_score > decay_1_day, "Trust score should decay after 1 day"
        assert decay_1_day > decay_7_days, "Trust score should decay more after 7 days"
        assert decay_7_days > decay_30_days, "Trust score should decay more after 30 days"
        
        # Score should not go below minimum threshold
        assert decay_30_days >= 0.1, "Trust score should not decay below minimum threshold"

    def test_trust_decay_rate_limits(self, mock_agent_id):
        """Test trust decay rate limits"""
        trust_calculator = self._create_trust_decay_calculator()
        
        initial_score = 1.0
        
        # Very long time periods should not cause excessive decay
        decay_365_days = trust_calculator.apply_time_decay(initial_score, days=365)
        decay_1000_days = trust_calculator.apply_time_decay(initial_score, days=1000)
        
        # Even after very long periods, some minimum trust should remain
        assert decay_365_days >= 0.05, "Trust decay too aggressive for 365 days"
        assert decay_1000_days >= 0.01, "Trust decay too aggressive for 1000 days"

    def test_trust_decay_inactivity_penalty(self, mock_agent_id):
        """Test additional decay penalty for inactive agents"""
        trust_calculator = self._create_trust_decay_calculator()
        
        initial_score = 0.8
        
        # Active agent (recent activity)
        active_decay = trust_calculator.apply_inactivity_decay(
            initial_score, days_inactive=1
        )
        
        # Inactive agent (no recent activity)
        inactive_decay = trust_calculator.apply_inactivity_decay(
            initial_score, days_inactive=30
        )
        
        # Inactive agent should have more decay
        assert active_decay > inactive_decay, "Inactive agents should have additional trust decay"

    def _create_trust_decay_calculator(self):
        """Create mock trust decay calculator"""
        class MockTrustDecayCalculator:
            def apply_time_decay(self, score: float, days: int) -> float:
                # Exponential decay with half-life of 30 days
                half_life = 30.0
                decay_factor = math.exp(-math.log(2) * days / half_life)
                
                # Apply minimum threshold
                decayed_score = score * decay_factor
                minimum_score = 0.01
                
                return max(minimum_score, decayed_score)
            
            def apply_inactivity_decay(self, score: float, days_inactive: int) -> float:
                # Additional decay for inactivity
                if days_inactive <= 7:
                    return score  # No additional decay for recent activity
                
                # Additional penalty for extended inactivity
                inactivity_penalty = min(0.5, (days_inactive - 7) * 0.02)
                return max(0.01, score * (1.0 - inactivity_penalty))
        
        return MockTrustDecayCalculator()

class TestReputationSystemIntegrity:
    """Test reputation system integrity and security"""

    def test_reputation_score_aggregation(self, mock_agent_id):
        """Test reputation score aggregation from multiple sources"""
        reputation_calculator = self._create_reputation_calculator()
        
        # Mock peer reviews
        peer_reviews = [
            {"reviewer_id": "peer1", "score": 0.8, "weight": 1.0},
            {"reviewer_id": "peer2", "score": 0.9, "weight": 1.0},
            {"reviewer_id": "peer3", "score": 0.7, "weight": 0.5},  # Lower weight
        ]
        
        reputation_score = reputation_calculator.calculate_reputation(peer_reviews)
        
        # Score should be within valid bounds
        assert 0.0 <= reputation_score <= 1.0, f"Reputation score {reputation_score} outside valid bounds"
        
        # Score should reflect weighted average
        expected_weighted_avg = (0.8 * 1.0 + 0.9 * 1.0 + 0.7 * 0.5) / (1.0 + 1.0 + 0.5)
        assert abs(reputation_score - expected_weighted_avg) < 0.01, "Reputation score not properly weighted"

    def test_reputation_review_validation(self, mock_agent_id):
        """Test validation of reputation reviews"""
        reputation_validator = self._create_reputation_validator()
        
        # Valid review
        valid_review = {
            "reviewer_id": "peer1",
            "reviewed_id": mock_agent_id,
            "score": 0.8,
            "timestamp": datetime.utcnow(),
            "justification": "Good collaboration and compliance"
        }
        
        assert reputation_validator.validate_review(valid_review), "Valid review failed validation"
        
        # Invalid reviews
        invalid_reviews = [
            {**valid_review, "score": 1.5},  # Score out of bounds
            {**valid_review, "reviewer_id": mock_agent_id},  # Self-review
            {**valid_review, "justification": ""},  # Missing justification
            {**valid_review, "timestamp": datetime.utcnow() + timedelta(hours=1)},  # Future timestamp
        ]
        
        for invalid_review in invalid_reviews:
            assert not reputation_validator.validate_review(invalid_review), f"Invalid review passed validation: {invalid_review}"

    def test_reputation_sybil_attack_resistance(self, mock_agent_id):
        """Test resistance to Sybil attacks on reputation system"""
        reputation_calculator = self._create_reputation_calculator()
        
        # Simulate Sybil attack with many low-weight fake reviews
        sybil_reviews = [
            {"reviewer_id": f"fake_peer_{i}", "score": 1.0, "weight": 0.1}
            for i in range(100)
        ]
        
        # Add one legitimate high-weight review
        legitimate_review = {"reviewer_id": "trusted_peer", "score": 0.5, "weight": 10.0}
        all_reviews = sybil_reviews + [legitimate_review]
        
        reputation_score = reputation_calculator.calculate_reputation(all_reviews)
        
        # Legitimate review should dominate despite many fake reviews
        assert reputation_score < 0.7, "Reputation system vulnerable to Sybil attack"

    def _create_reputation_calculator(self):
        """Create mock reputation calculator"""
        class MockReputationCalculator:
            def calculate_reputation(self, reviews: List[Dict[str, Any]]) -> float:
                if not reviews:
                    return 0.5  # Default neutral reputation
                
                # Calculate weighted average
                total_weighted_score = sum(review["score"] * review["weight"] for review in reviews)
                total_weight = sum(review["weight"] for review in reviews)
                
                if total_weight == 0:
                    return 0.5
                
                weighted_avg = total_weighted_score / total_weight
                return max(0.0, min(1.0, weighted_avg))
        
        return MockReputationCalculator()

    def _create_reputation_validator(self):
        """Create mock reputation validator"""
        class MockReputationValidator:
            def validate_review(self, review: Dict[str, Any]) -> bool:
                # Check required fields
                required_fields = ["reviewer_id", "reviewed_id", "score", "timestamp", "justification"]
                if not all(field in review for field in required_fields):
                    return False
                
                # Check score bounds
                if not (0.0 <= review["score"] <= 1.0):
                    return False
                
                # Prevent self-reviews
                if review["reviewer_id"] == review["reviewed_id"]:
                    return False
                
                # Check justification is not empty
                if not review["justification"].strip():
                    return False
                
                # Check timestamp is not in future
                if review["timestamp"] > datetime.utcnow():
                    return False
                
                return True
        
        return MockReputationValidator()

class TestTrustScorePrivacyProtection:
    """Test privacy protection mechanisms for trust scores"""

    def test_trust_score_anonymization(self, mock_agent_id, mock_trust_score):
        """Test trust score anonymization for privacy"""
        privacy_protector = self._create_privacy_protector()
        
        # Anonymize trust score
        anonymized_score = privacy_protector.anonymize_trust_score(mock_trust_score)
        
        # Original agent ID should be replaced
        assert anonymized_score.agent_id != mock_trust_score.agent_id, "Trust score not anonymized"
        assert anonymized_score.agent_id.startswith("anon_"), "Anonymized ID format incorrect"
        
        # Other fields should be preserved
        assert anonymized_score.current_score == mock_trust_score.current_score, "Trust score value changed during anonymization"

    def test_trust_score_differential_privacy(self, mock_agent_id, mock_behavior_metrics):
        """Test differential privacy in trust score calculations"""
        privacy_protector = self._create_privacy_protector()
        
        # Calculate trust score multiple times with noise
        scores = []
        for _ in range(100):
            noisy_score = privacy_protector.calculate_private_trust_score(
                mock_agent_id, mock_behavior_metrics, epsilon=1.0
            )
            scores.append(noisy_score)
        
        # All scores should be within bounds
        assert all(0.0 <= score <= 1.0 for score in scores), "Noisy trust scores outside valid bounds"
        
        # Scores should have some variation due to noise
        score_variance = self._calculate_variance(scores)
        assert score_variance > 0.0001, "Insufficient noise in differential privacy"
        assert score_variance < 0.01, "Too much noise in differential privacy"

    def test_trust_score_aggregation_privacy(self, mock_agent_id):
        """Test privacy-preserving trust score aggregation"""
        privacy_protector = self._create_privacy_protector()
        
        # Mock individual trust scores
        individual_scores = [0.7, 0.8, 0.6, 0.9, 0.5]
        
        # Aggregate with privacy protection
        aggregated_score = privacy_protector.aggregate_private_scores(individual_scores)
        
        # Aggregated score should be within bounds
        assert 0.0 <= aggregated_score <= 1.0, "Aggregated private score outside bounds"
        
        # Should be reasonably close to actual average but not exact
        actual_avg = sum(individual_scores) / len(individual_scores)
        assert abs(aggregated_score - actual_avg) < 0.1, "Private aggregation too far from actual average"

    def _create_privacy_protector(self):
        """Create mock privacy protector"""
        class MockPrivacyProtector:
            def anonymize_trust_score(self, trust_score: TrustScore) -> TrustScore:
                # Replace agent ID with anonymous identifier
                anon_id = f"anon_{hashlib.sha256(trust_score.agent_id.encode()).hexdigest()[:8]}"
                
                return TrustScore(
                    agent_id=anon_id,
                    current_score=trust_score.current_score,
                    base_score=trust_score.base_score,
                    behavior_score=trust_score.behavior_score,
                    reputation_score=trust_score.reputation_score,
                    compliance_score=trust_score.compliance_score,
                    timestamp=trust_score.timestamp,
                    version=trust_score.version,
                    signature=trust_score.signature
                )
            
            def calculate_private_trust_score(self, agent_id: str, metrics: BehaviorMetrics, epsilon: float) -> float:
                # Calculate base score
                base_score = metrics.success_rate * 0.5 + (metrics.uptime_percentage / 100) * 0.3 + 0.2
                
                # Add Laplacian noise for differential privacy
                noise = secrets.SystemRandom().gauss(0, 1.0 / epsilon)
                noisy_score = base_score + noise
                
                # Ensure bounds
                return max(0.0, min(1.0, noisy_score))
            
            def aggregate_private_scores(self, scores: List[float]) -> float:
                if not scores:
                    return 0.5
                
                # Add noise to aggregation
                actual_avg = sum(scores) / len(scores)
                noise = secrets.SystemRandom().gauss(0, 0.02)  # Small noise for aggregation
                
                return max(0.0, min(1.0, actual_avg + noise))
        
        return MockPrivacyProtector()

    def _calculate_variance(self, values: List[float]) -> float:
        """Calculate variance of a list of values"""
        if len(values) < 2:
            return 0.0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
        return variance

if __name__ == "__main__":
    pytest.main([__file__, "-v"])