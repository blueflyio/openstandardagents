# OSSA Compliance Profiles

**Version**: 0.2.9
**Status**: Draft
**Last Updated**: 2025-12-04

This document defines formal compliance profiles for OSSA agents targeting enterprise adoption.

## Overview

Compliance profiles define mandatory agent configurations for regulatory frameworks. When an agent declares a compliance profile, the runtime MUST enforce all profile requirements.

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: healthcare-assistant
spec:
  compliance:
    profiles:
      - hipaa
      - soc2-type2
    audit:
      enabled: true
      retention_days: 2555  # 7 years
```

---

## Profile Schema

```typescript
interface ComplianceProfile {
  id: string;
  name: string;
  framework: 'FedRAMP' | 'SOC2' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'ISO27001';
  level?: string;
  version: string;

  requirements: {
    state?: StateRequirements;
    observability?: ObservabilityRequirements;
    tools?: ToolRequirements;
    security?: SecurityRequirements;
    data?: DataRequirements;
  };

  controls: ControlMapping[];
}

interface ControlMapping {
  id: string;           // Framework control ID (e.g., "AC-2")
  description: string;  // Control description
  mapping: string;      // OSSA spec path
  validation: string;   // Validation rule
}
```

---

## FedRAMP Moderate Profile

**Framework**: FedRAMP (Federal Risk and Authorization Management Program)
**Level**: Moderate (110 controls)
**Use Case**: Federal agency deployments, government contractors

```yaml
id: fedramp-moderate
name: FedRAMP Moderate Baseline
framework: FedRAMP
level: Moderate
version: "2024.1"

requirements:
  state:
    encryption:
      required: true
      algorithm: AES-256-GCM
      key_management: FIPS-140-2
    storage:
      allowed_regions:
        - us-east-1
        - us-west-2
        - us-gov-west-1
      data_residency: US

  observability:
    audit_logging:
      required: true
      retention_days: 2555  # 7 years
      immutable: true
    tracing:
      required: true
      pii_redaction: true

  tools:
    authentication:
      required: true
      types_allowed:
        - mtls
        - oauth2
        - saml
      mfa_required: true
    network:
      egress_filtering: true
      allowed_domains_only: true

  security:
    vulnerability_scanning: required
    penetration_testing: annual
    incident_response: 1h

controls:
  - id: AC-2
    description: Account Management
    mapping: spec.security.authentication
    validation: authentication.required == true

  - id: AC-3
    description: Access Enforcement
    mapping: spec.autonomy.approval_required
    validation: approval_required == true for privileged_tools

  - id: AU-2
    description: Audit Events
    mapping: spec.observability.logging
    validation: logging.level in ['info', 'debug']

  - id: AU-3
    description: Content of Audit Records
    mapping: spec.observability.logging.structured
    validation: structured == true

  - id: AU-9
    description: Protection of Audit Information
    mapping: spec.observability.logging.immutable
    validation: immutable == true

  - id: AU-11
    description: Audit Record Retention
    mapping: spec.observability.logging.retention_days
    validation: retention_days >= 2555

  - id: SC-8
    description: Transmission Confidentiality
    mapping: spec.tools[*].source.tls
    validation: all tools use TLS 1.3

  - id: SC-13
    description: Cryptographic Protection
    mapping: spec.state.encryption
    validation: encryption.algorithm in ['AES-256-GCM', 'ChaCha20-Poly1305']

  - id: SC-28
    description: Protection of Information at Rest
    mapping: spec.state.encryption.at_rest
    validation: at_rest == true
```

---

## SOC 2 Type II Profile

**Framework**: SOC 2 (Service Organization Control 2)
**Type**: Type II (operational effectiveness over time)
**Use Case**: SaaS providers, enterprise B2B

```yaml
id: soc2-type2
name: SOC 2 Type II
framework: SOC2
level: Type II
version: "2024.1"

requirements:
  state:
    encryption:
      required: true
      algorithm: AES-256-GCM
    backup:
      required: true
      frequency: daily
      retention_days: 90

  observability:
    audit_logging:
      required: true
      retention_days: 365
      tamper_evident: true
    monitoring:
      required: true
      alerting: true
    metrics:
      required: true
      availability_tracking: true

  tools:
    authentication:
      required: true
      types_allowed:
        - oauth2
        - api_key
        - jwt
    rate_limiting:
      required: true

  security:
    access_control: rbac
    change_management: required
    incident_response: 4h

  data:
    classification: required
    retention_policy: required
    disposal: secure_delete

controls:
  # Security (Common Criteria)
  - id: CC6.1
    description: Logical and Physical Access Controls
    mapping: spec.security.authentication
    validation: authentication.required == true

  - id: CC6.2
    description: System Access Authorization
    mapping: spec.autonomy.approval_required
    validation: privileged operations require approval

  - id: CC6.3
    description: Access Removal
    mapping: spec.security.session.timeout_seconds
    validation: timeout_seconds <= 3600

  # Availability
  - id: A1.1
    description: System Availability
    mapping: spec.reliability.circuit_breaker
    validation: circuit_breaker.enabled == true

  - id: A1.2
    description: Recovery Procedures
    mapping: spec.reliability.fallback
    validation: fallback defined for critical tools

  # Processing Integrity
  - id: PI1.1
    description: Processing Integrity
    mapping: spec.constraints.validation
    validation: input/output validation enabled

  # Confidentiality
  - id: C1.1
    description: Confidential Information Protection
    mapping: spec.state.encryption
    validation: encryption.required == true

  - id: C1.2
    description: Confidential Information Disposal
    mapping: spec.state.ttl
    validation: ttl defined for sensitive state

  # Privacy
  - id: P1.1
    description: Privacy Notice
    mapping: spec.safety.content_filtering
    validation: pii_detection enabled
```

---

## HIPAA Profile

**Framework**: HIPAA (Health Insurance Portability and Accountability Act)
**Use Case**: Healthcare, PHI handling

```yaml
id: hipaa
name: HIPAA Compliance
framework: HIPAA
version: "2024.1"

requirements:
  state:
    encryption:
      required: true
      algorithm: AES-256-GCM
      phi_specific: true
    storage:
      phi_isolation: true
      access_logging: true
    retention:
      minimum_days: 2190  # 6 years

  observability:
    audit_logging:
      required: true
      retention_days: 2190
      phi_access_logging: true
      immutable: true
    tracing:
      required: true
      phi_redaction: mandatory

  tools:
    authentication:
      required: true
      types_allowed:
        - mtls
        - oauth2
      mfa_required: true
    phi_access:
      minimum_necessary: true
      access_justification: required

  security:
    workforce_training: required
    business_associate_agreement: required
    incident_response: 24h
    breach_notification: 60d

  data:
    phi_detection: required
    de_identification: available
    consent_tracking: required

controls:
  # Administrative Safeguards
  - id: 164.308(a)(1)
    description: Security Management Process
    mapping: spec.security
    validation: security block fully configured

  - id: 164.308(a)(3)
    description: Workforce Security
    mapping: spec.security.authentication
    validation: authentication.mfa_required == true

  - id: 164.308(a)(4)
    description: Information Access Management
    mapping: spec.autonomy.approval_required
    validation: phi_access requires approval

  # Physical Safeguards
  - id: 164.310(d)(1)
    description: Device and Media Controls
    mapping: spec.state.encryption
    validation: encryption.at_rest == true

  # Technical Safeguards
  - id: 164.312(a)(1)
    description: Access Control
    mapping: spec.security.authentication
    validation: unique user identification

  - id: 164.312(b)
    description: Audit Controls
    mapping: spec.observability.logging
    validation: phi_access_logging == true

  - id: 164.312(c)(1)
    description: Integrity
    mapping: spec.observability.logging.immutable
    validation: immutable == true

  - id: 164.312(d)
    description: Person or Entity Authentication
    mapping: spec.security.authentication
    validation: authentication.required == true

  - id: 164.312(e)(1)
    description: Transmission Security
    mapping: spec.tools[*].source.tls
    validation: all tools use TLS 1.2+
```

---

## GDPR Profile

**Framework**: GDPR (General Data Protection Regulation)
**Use Case**: EU citizen data processing

```yaml
id: gdpr
name: GDPR Compliance
framework: GDPR
version: "2024.1"

requirements:
  state:
    encryption:
      required: true
    storage:
      allowed_regions:
        - eu-west-1
        - eu-central-1
        - eu-north-1
      data_residency: EU
    retention:
      purpose_limitation: true
      right_to_erasure: true

  observability:
    audit_logging:
      required: true
      retention_days: 365
      personal_data_logging: minimized
    consent_tracking:
      required: true

  tools:
    data_processing:
      purpose_specification: required
      consent_verification: required
    third_party:
      dpa_required: true
      transfer_mechanism: required

  security:
    data_protection_officer: recommended
    privacy_impact_assessment: required
    breach_notification: 72h

  data:
    personal_data_detection: required
    anonymization: available
    pseudonymization: available
    data_portability: required
    right_to_access: required
    right_to_rectification: required
    right_to_erasure: required

controls:
  # Lawfulness of Processing
  - id: Article 6
    description: Lawfulness of Processing
    mapping: spec.safety.content_filtering
    validation: consent_verification enabled

  # Rights of Data Subject
  - id: Article 15
    description: Right of Access
    mapping: spec.state.export
    validation: data_export capability available

  - id: Article 17
    description: Right to Erasure
    mapping: spec.state.delete
    validation: delete capability available

  - id: Article 20
    description: Right to Data Portability
    mapping: spec.state.export
    validation: standard format export available

  # Data Protection by Design
  - id: Article 25
    description: Data Protection by Design
    mapping: spec.state.encryption
    validation: encryption.required == true

  # Security of Processing
  - id: Article 32
    description: Security of Processing
    mapping: spec.security
    validation: encryption and access control configured

  # Data Breach Notification
  - id: Article 33
    description: Breach Notification
    mapping: spec.observability.alerting
    validation: breach_detection alerting configured

  # Data Protection Impact Assessment
  - id: Article 35
    description: DPIA Required
    mapping: metadata.annotations.dpia_completed
    validation: dpia_completed == true for high-risk processing
```

---

## Validation CLI

```bash
# Validate agent against compliance profile
ossa validate --profile hipaa manifest.yaml

# Validate against multiple profiles
ossa validate --profile hipaa,soc2-type2 manifest.yaml

# Generate compliance report
ossa compliance-report --format pdf manifest.yaml

# List available profiles
ossa profiles list
```

---

## Runtime Enforcement

When an agent declares compliance profiles, the runtime MUST:

1. **Validate at startup**: Check all requirements before agent becomes ready
2. **Enforce at runtime**: Block non-compliant operations
3. **Audit all access**: Log all data access per audit requirements
4. **Report violations**: Emit alerts for compliance violations

```typescript
interface ComplianceEnforcement {
  // Called before agent initialization
  validateCompliance(manifest: AgentManifest): ComplianceResult;

  // Called before each operation
  enforcePolicy(operation: Operation, context: Context): boolean;

  // Called after each operation
  auditOperation(operation: Operation, result: Result): void;

  // Called on violation
  reportViolation(violation: Violation): void;
}
```

---

## References

- [NIST SP 800-53](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final) - FedRAMP control families
- [AICPA SOC 2](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome) - Trust Services Criteria
- [HHS HIPAA](https://www.hhs.gov/hipaa/index.html) - Security and Privacy Rules
- [GDPR](https://gdpr.eu/) - EU Data Protection Regulation
