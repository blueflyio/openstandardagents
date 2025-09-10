#!/usr/bin/env python3
"""
OSSA Security Test Suite

This package contains comprehensive security tests for the OSSA platform including:
- Authentication framework security tests
- Trust scoring system security tests  
- Malicious agent protection tests
- Audit trail security with hash-chain verification

Test modules:
- test_authentication_framework.py: Authentication, OAuth2, mTLS, SAML, MFA tests
- test_trust_scoring_system.py: Trust calculation, manipulation resistance, privacy tests
- test_malicious_agent_protection.py: Code injection, resource monitoring, behavior anomaly tests
- test_audit_trail_security.py: Hash-chain verification, immutability, distributed consistency tests
"""

__version__ = "0.1.8"
__author__ = "OSSA Security Team"
__license__ = "Apache-2.0"

from .test_authentication_framework import (
    TestAuthenticationFramework,
    TestAPIKeySecurity,
    TestOAuth2PKCESecurity,
    TestMTLSSecurity,
    TestSAML2Security,
    TestMultiFactorAuthentication,
    TestSessionSecurity,
    TestTokenLifecycleManagement
)

from .test_trust_scoring_system import (
    TestTrustScoringCore,
    TestTrustScoreManipulationResistance,
    TestTrustChainVerification,
    TestTrustDecayMechanisms,
    TestReputationSystemIntegrity,
    TestTrustScorePrivacyProtection
)

from .test_malicious_agent_protection import (
    TestMaliciousCodeInjectionPrevention,
    TestResourceConsumptionMonitoring,
    TestAgentBehaviorAnomalyDetection,
    TestSandboxingAndIsolation,
    TestAgentCommunicationSecurity
)

from .test_audit_trail_security import (
    TestAuditHashChainIntegrity,
    TestAuditSignatureVerification,
    TestAuditLogImmutability,
    TestDistributedAuditLogConsistency,
    TestAuditPerformanceAndScalability
)

__all__ = [
    # Authentication Framework Tests
    "TestAuthenticationFramework",
    "TestAPIKeySecurity", 
    "TestOAuth2PKCESecurity",
    "TestMTLSSecurity",
    "TestSAML2Security",
    "TestMultiFactorAuthentication",
    "TestSessionSecurity",
    "TestTokenLifecycleManagement",
    
    # Trust Scoring System Tests
    "TestTrustScoringCore",
    "TestTrustScoreManipulationResistance",
    "TestTrustChainVerification", 
    "TestTrustDecayMechanisms",
    "TestReputationSystemIntegrity",
    "TestTrustScorePrivacyProtection",
    
    # Malicious Agent Protection Tests
    "TestMaliciousCodeInjectionPrevention",
    "TestResourceConsumptionMonitoring",
    "TestAgentBehaviorAnomalyDetection",
    "TestSandboxingAndIsolation",
    "TestAgentCommunicationSecurity",
    
    # Audit Trail Security Tests
    "TestAuditHashChainIntegrity",
    "TestAuditSignatureVerification", 
    "TestAuditLogImmutability",
    "TestDistributedAuditLogConsistency",
    "TestAuditPerformanceAndScalability"
]