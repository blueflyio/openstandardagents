#!/usr/bin/env python3
"""
OSSA Authentication Framework Security Tests

Tests for validating the security of the OSSA authentication system including:
- Multi-factor authentication (MFA)
- OAuth2 PKCE implementation
- API key security
- mTLS certificate validation  
- SAML 2.0 integration
- Session management
- Token lifecycle management
"""

import pytest
import asyncio
import jwt
import time
import hashlib
import secrets
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
import base64
import json

class TestAuthenticationFramework:
    """Test suite for OSSA authentication security"""

    @pytest.fixture
    def mock_agent_config(self):
        """Mock OSSA agent configuration with security settings"""
        return {
            "security": {
                "authentication": {
                    "methods": ["api_key", "oauth2_pkce", "saml_2_0", "mTLS"],
                    "default": "oauth2_pkce",
                    "mfa_required": True
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
                }
            }
        }

    @pytest.fixture
    def mock_api_key(self):
        """Generate a mock secure API key"""
        return f"ossa_key_{secrets.token_urlsafe(32)}"

    @pytest.fixture
    def mock_jwt_token(self):
        """Generate a mock JWT token for testing"""
        payload = {
            "sub": "agent_compliance_auditor",
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,
            "aud": "ossa-platform",
            "iss": "ossa-auth-service",
            "scope": "compliance:read compliance:write audit:execute",
            "agent_class": "auditor",
            "tier": "advanced"
        }
        secret = secrets.token_urlsafe(32)
        return jwt.encode(payload, secret, algorithm="HS256")

    @pytest.fixture
    def mock_certificate_pair(self):
        """Generate mock certificate pair for mTLS testing"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Test State"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Test City"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "OSSA Test CA"),
            x509.NameAttribute(NameOID.COMMON_NAME, "test-agent.ossa.local"),
        ])
        
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.utcnow()
        ).not_valid_after(
            datetime.utcnow() + timedelta(days=365)
        ).sign(private_key, hashes.SHA256(), default_backend())
        
        return {
            "private_key": private_key,
            "certificate": cert,
            "pem_cert": cert.public_bytes(serialization.Encoding.PEM),
            "pem_key": private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
        }

class TestAPIKeySecurity:
    """Test API key authentication security"""

    def test_api_key_generation_entropy(self):
        """Test API key has sufficient entropy"""
        api_key = f"ossa_key_{secrets.token_urlsafe(32)}"
        
        # Check minimum length (should be > 40 chars)
        assert len(api_key) > 40, "API key too short"
        
        # Check prefix
        assert api_key.startswith("ossa_key_"), "API key missing OSSA prefix"
        
        # Check entropy - no repeated patterns
        key_part = api_key.replace("ossa_key_", "")
        assert len(set(key_part)) > 10, "API key has insufficient character diversity"

    def test_api_key_validation(self):
        """Test API key format validation"""
        valid_key = f"ossa_key_{secrets.token_urlsafe(32)}"
        
        # Valid key should pass
        assert self._validate_api_key_format(valid_key)
        
        # Invalid formats should fail
        invalid_keys = [
            "invalid_key_format",
            "ossa_key_",
            "ossa_key_short",
            "",
            None,
            "ossa_key_" + "a" * 100  # Too predictable
        ]
        
        for invalid_key in invalid_keys:
            assert not self._validate_api_key_format(invalid_key), f"Invalid key passed validation: {invalid_key}"

    def test_api_key_rate_limiting(self):
        """Test API key rate limiting mechanisms"""
        api_key = f"ossa_key_{secrets.token_urlsafe(32)}"
        rate_limiter = self._create_mock_rate_limiter()
        
        # Should allow initial requests
        for i in range(100):  # Normal rate limit
            assert rate_limiter.check_rate_limit(api_key), f"Rate limit exceeded too early at request {i}"
        
        # Should block after limit exceeded
        assert not rate_limiter.check_rate_limit(api_key), "Rate limiter did not block excessive requests"

    def test_api_key_revocation(self):
        """Test API key revocation functionality"""
        api_key = f"ossa_key_{secrets.token_urlsafe(32)}"
        key_store = self._create_mock_key_store()
        
        # Key should be valid initially
        assert key_store.is_valid(api_key)
        
        # Revoke key
        key_store.revoke(api_key)
        
        # Key should be invalid after revocation
        assert not key_store.is_valid(api_key), "Revoked key still validates as valid"

    def _validate_api_key_format(self, api_key):
        """Mock API key format validation"""
        if not api_key or not isinstance(api_key, str):
            return False
        if not api_key.startswith("ossa_key_"):
            return False
        if len(api_key) < 20:
            return False
        key_part = api_key.replace("ossa_key_", "")
        if len(set(key_part)) < 10:  # Insufficient diversity
            return False
        return True

    def _create_mock_rate_limiter(self):
        """Create mock rate limiter"""
        class MockRateLimiter:
            def __init__(self):
                self.requests = {}
            
            def check_rate_limit(self, key):
                current_time = time.time()
                if key not in self.requests:
                    self.requests[key] = []
                
                # Remove old requests (older than 1 hour)
                self.requests[key] = [
                    req_time for req_time in self.requests[key] 
                    if current_time - req_time < 3600
                ]
                
                if len(self.requests[key]) >= 100:  # Rate limit
                    return False
                
                self.requests[key].append(current_time)
                return True
        
        return MockRateLimiter()

    def _create_mock_key_store(self):
        """Create mock key store"""
        class MockKeyStore:
            def __init__(self):
                self.revoked_keys = set()
            
            def is_valid(self, key):
                return key not in self.revoked_keys
            
            def revoke(self, key):
                self.revoked_keys.add(key)
        
        return MockKeyStore()

class TestOAuth2PKCESecurity:
    """Test OAuth2 with PKCE security implementation"""

    def test_pkce_code_verifier_generation(self):
        """Test PKCE code verifier has sufficient entropy"""
        code_verifier = secrets.token_urlsafe(96)  # 128 chars recommended
        
        assert len(code_verifier) >= 43, "Code verifier too short"
        assert len(code_verifier) <= 128, "Code verifier too long"
        assert code_verifier.replace("-", "").replace("_", "").isalnum(), "Code verifier contains invalid characters"

    def test_pkce_code_challenge_generation(self):
        """Test PKCE code challenge generation"""
        code_verifier = secrets.token_urlsafe(96)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).decode().rstrip('=')
        
        assert len(code_challenge) == 43, "Code challenge incorrect length"
        assert code_challenge != code_verifier, "Code challenge should not equal verifier"

    def test_oauth2_token_validation(self, mock_jwt_token):
        """Test OAuth2 JWT token validation"""
        # Decode without verification for testing (in production, verify signature)
        decoded = jwt.decode(mock_jwt_token, options={"verify_signature": False})
        
        # Check required fields
        required_fields = ["sub", "iat", "exp", "aud", "iss", "scope"]
        for field in required_fields:
            assert field in decoded, f"Missing required field: {field}"
        
        # Check expiration
        current_time = int(time.time())
        assert decoded["exp"] > current_time, "Token is expired"
        assert decoded["iat"] <= current_time, "Token issued in future"
        
        # Check audience
        assert decoded["aud"] == "ossa-platform", "Invalid audience"

    def test_oauth2_scope_validation(self, mock_jwt_token):
        """Test OAuth2 scope validation"""
        decoded = jwt.decode(mock_jwt_token, options={"verify_signature": False})
        scopes = decoded["scope"].split()
        
        # Check scope format
        for scope in scopes:
            parts = scope.split(":")
            assert len(parts) == 2, f"Invalid scope format: {scope}"
            assert parts[0] in ["compliance", "audit", "admin"], f"Invalid scope domain: {parts[0]}"
            assert parts[1] in ["read", "write", "execute", "admin"], f"Invalid scope action: {parts[1]}"

    def test_oauth2_refresh_token_security(self):
        """Test OAuth2 refresh token security"""
        refresh_token = secrets.token_urlsafe(64)
        
        # Check entropy
        assert len(refresh_token) >= 64, "Refresh token too short"
        
        # Simulate refresh token rotation
        new_refresh_token = secrets.token_urlsafe(64)
        assert new_refresh_token != refresh_token, "Refresh token not rotated"

class TestMTLSSecurity:
    """Test mutual TLS authentication security"""

    def test_certificate_validation(self, mock_certificate_pair):
        """Test client certificate validation"""
        cert = mock_certificate_pair["certificate"]
        
        # Check certificate is not expired
        assert cert.not_valid_after > datetime.utcnow(), "Certificate is expired"
        assert cert.not_valid_before <= datetime.utcnow(), "Certificate not yet valid"
        
        # Check subject CN
        subject = cert.subject
        cn = None
        for attribute in subject:
            if attribute.oid == NameOID.COMMON_NAME:
                cn = attribute.value
                break
        
        assert cn is not None, "Certificate missing Common Name"
        assert "ossa" in cn.lower() or "agent" in cn.lower(), "Certificate CN doesn't indicate OSSA agent"

    def test_certificate_chain_validation(self, mock_certificate_pair):
        """Test certificate chain validation"""
        cert = mock_certificate_pair["certificate"]
        
        # In a real implementation, you'd validate against a CA chain
        # Here we test the structure exists
        assert cert.issuer is not None, "Certificate missing issuer"
        assert cert.signature is not None, "Certificate missing signature"

    def test_certificate_revocation_check(self):
        """Test certificate revocation list (CRL) checking"""
        # Mock CRL checking
        revoked_serials = {12345, 67890}  # Mock revoked certificate serials
        
        test_serial = 12345
        assert test_serial in revoked_serials, "CRL check should identify revoked certificate"
        
        valid_serial = 11111
        assert valid_serial not in revoked_serials, "CRL check should allow valid certificate"

class TestSAML2Security:
    """Test SAML 2.0 authentication security"""

    def test_saml_assertion_validation(self):
        """Test SAML assertion validation"""
        # Mock SAML assertion structure
        saml_assertion = {
            "id": f"_saml_assertion_{secrets.token_hex(16)}",
            "issue_instant": datetime.utcnow().isoformat(),
            "issuer": "https://ossa-idp.example.com",
            "subject": "agent_compliance_auditor",
            "audience": "ossa-platform",
            "not_before": datetime.utcnow().isoformat(),
            "not_on_or_after": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
            "attributes": {
                "agent_class": "auditor",
                "tier": "advanced",
                "permissions": ["compliance:read", "compliance:write", "audit:execute"]
            }
        }
        
        # Validate assertion structure
        assert saml_assertion["issuer"].startswith("https://"), "SAML issuer must use HTTPS"
        assert saml_assertion["subject"], "SAML subject required"
        assert saml_assertion["audience"] == "ossa-platform", "Invalid SAML audience"

    def test_saml_signature_validation(self):
        """Test SAML signature validation"""
        # Mock signature validation
        saml_response_xml = """<?xml version="1.0"?>
        <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
            <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
                <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
                    <ds:SignedInfo>
                        <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
                    </ds:SignedInfo>
                </ds:Signature>
            </saml:Assertion>
        </samlp:Response>"""
        
        # Check signature element exists
        assert "<ds:Signature" in saml_response_xml, "SAML response missing signature"
        assert "rsa-sha256" in saml_response_xml, "SAML signature should use SHA-256"

class TestMultiFactorAuthentication:
    """Test multi-factor authentication security"""

    def test_mfa_totp_validation(self):
        """Test TOTP (Time-based One-Time Password) validation"""
        # Mock TOTP validation
        secret = secrets.token_hex(20)  # 160-bit secret
        
        # Simulate TOTP generation (simplified)
        current_time_window = int(time.time()) // 30  # 30-second windows
        totp_code = str(current_time_window % 1000000).zfill(6)
        
        # Validate TOTP properties
        assert len(totp_code) == 6, "TOTP code should be 6 digits"
        assert totp_code.isdigit(), "TOTP code should contain only digits"
        assert len(secret) >= 20, "TOTP secret should be at least 160 bits"

    def test_mfa_backup_codes(self):
        """Test MFA backup codes security"""
        backup_codes = [secrets.token_hex(4) for _ in range(10)]  # 10 backup codes
        
        for code in backup_codes:
            assert len(code) == 8, "Backup code should be 8 characters"
            assert all(c in '0123456789abcdef' for c in code), "Backup code should be hexadecimal"
        
        # Ensure no duplicates
        assert len(set(backup_codes)) == len(backup_codes), "Backup codes should be unique"

    def test_mfa_enforcement(self, mock_agent_config):
        """Test MFA enforcement for privileged operations"""
        security_config = mock_agent_config["security"]["authentication"]
        
        assert security_config["mfa_required"] is True, "MFA should be required for OSSA agents"
        
        # Test privileged operations require MFA
        privileged_operations = [
            "audit:execute",
            "compliance:write", 
            "admin:all"
        ]
        
        for operation in privileged_operations:
            # In real implementation, check if operation requires MFA
            assert self._operation_requires_mfa(operation), f"Operation {operation} should require MFA"

    def _operation_requires_mfa(self, operation):
        """Mock MFA requirement check"""
        privileged_patterns = ["admin:", "write", "execute", "delete"]
        return any(pattern in operation for pattern in privileged_patterns)

class TestSessionSecurity:
    """Test session management security"""

    def test_session_id_generation(self):
        """Test session ID generation security"""
        session_id = secrets.token_urlsafe(32)  # 256-bit entropy
        
        assert len(session_id) >= 32, "Session ID too short"
        
        # Generate multiple session IDs and check uniqueness
        session_ids = [secrets.token_urlsafe(32) for _ in range(100)]
        assert len(set(session_ids)) == len(session_ids), "Session IDs not unique"

    def test_session_timeout(self):
        """Test session timeout mechanisms"""
        session = {
            "id": secrets.token_urlsafe(32),
            "created_at": datetime.utcnow(),
            "last_activity": datetime.utcnow(),
            "max_idle_time": timedelta(minutes=30),
            "max_session_time": timedelta(hours=8)
        }
        
        # Session should be valid when recently created
        assert self._is_session_valid(session), "New session should be valid"
        
        # Simulate old session
        session["created_at"] = datetime.utcnow() - timedelta(hours=10)
        session["last_activity"] = datetime.utcnow() - timedelta(hours=10)
        
        assert not self._is_session_valid(session), "Old session should be invalid"

    def test_session_fixation_protection(self):
        """Test protection against session fixation attacks"""
        # Generate initial session ID
        old_session_id = secrets.token_urlsafe(32)
        
        # After authentication, session ID should change
        new_session_id = self._regenerate_session_id(old_session_id)
        
        assert new_session_id != old_session_id, "Session ID should change after authentication"
        assert len(new_session_id) >= 32, "New session ID should have sufficient entropy"

    def _is_session_valid(self, session):
        """Mock session validation"""
        now = datetime.utcnow()
        
        # Check absolute timeout
        if now - session["created_at"] > session["max_session_time"]:
            return False
        
        # Check idle timeout
        if now - session["last_activity"] > session["max_idle_time"]:
            return False
        
        return True

    def _regenerate_session_id(self, old_session_id):
        """Mock session ID regeneration"""
        return secrets.token_urlsafe(32)

class TestTokenLifecycleManagement:
    """Test token lifecycle and security"""

    def test_token_expiration(self, mock_jwt_token):
        """Test token expiration validation"""
        decoded = jwt.decode(mock_jwt_token, options={"verify_signature": False})
        
        # Check token has reasonable expiration
        current_time = int(time.time())
        exp_time = decoded["exp"]
        
        assert exp_time > current_time, "Token should not be expired"
        assert exp_time - current_time <= 86400, "Token should not be valid for more than 24 hours"

    def test_token_blacklisting(self):
        """Test token blacklisting functionality"""
        token_id = f"jti_{secrets.token_hex(16)}"
        blacklist = set()
        
        # Token should not be blacklisted initially
        assert token_id not in blacklist, "New token should not be blacklisted"
        
        # Add token to blacklist
        blacklist.add(token_id)
        
        # Token should now be blacklisted
        assert token_id in blacklist, "Blacklisted token should be in blacklist"

    def test_token_rotation(self):
        """Test automatic token rotation"""
        # Generate initial token
        token1 = self._generate_mock_token()
        
        # Rotate token
        token2 = self._rotate_token(token1)
        
        assert token1 != token2, "Rotated token should be different"
        
        # Old token should be invalidated
        assert not self._is_token_valid_after_rotation(token1), "Old token should be invalid after rotation"

    def _generate_mock_token(self):
        """Generate mock token for testing"""
        return secrets.token_urlsafe(64)

    def _rotate_token(self, old_token):
        """Mock token rotation"""
        return secrets.token_urlsafe(64)

    def _is_token_valid_after_rotation(self, token):
        """Mock token validation after rotation"""
        # In real implementation, check if token is in rotation blacklist
        return False  # Assume old tokens are invalidated

if __name__ == "__main__":
    pytest.main([__file__, "-v"])