---
title: "Security & Compliance"
description: "OAuth2-like scopes, compliance tags, and fine-grained permissions"
weight: 17
---

# Security & Compliance

OSSA v0.2.4 introduces comprehensive security and compliance features for enterprise deployments, including OAuth2-like scopes, compliance tags, and per-capability permission overrides.

## Overview

Security features in OSSA v0.2.4:

- **OAuth2-like scopes** - Fine-grained permission scopes for capabilities
- **Compliance tags** - Regulatory framework tags (HIPAA, GDPR, FedRAMP, etc.)
- **Per-capability scopes** - Tool-level permission customization
- **Scope inheritance** - Default scopes with capability-level overrides

## Security Scopes

### Scope Format

Scopes follow OAuth2 conventions: `action:resource` or `action:resource:identifier`.

```yaml
tools:
  - type: http
    name: database-api
    auth:
      type: bearer
      credentials: secret:db-api-key
      scopes:
        - read:data
        - write:data
        - execute:query
```

### Common Scopes

#### Data Access
- `read:data` - Read data from the capability
- `write:data` - Write data to the capability
- `delete:data` - Delete data
- `read:users` - Read user information
- `write:users` - Modify user information

#### Administrative
- `admin:system` - System administration
- `admin:users` - User management
- `admin:config` - Configuration management

#### Execution
- `execute:code` - Execute code
- `execute:query` - Execute queries
- `execute:command` - Execute system commands

#### Custom Scopes
You can define custom scopes for your specific use case:

```yaml
scopes:
  - custom:action:resource
  - project:read:documents
  - team:write:reports
```

## Compliance Tags

Compliance tags indicate regulatory requirements and data handling constraints.

### Supported Compliance Frameworks

#### PII (Personally Identifiable Information)
```yaml
compliance_tags:
  - pii
```

**Requirements**:
- Data encryption at rest and in transit
- Access logging and audit trails
- Data retention policies
- Right to deletion

#### HIPAA (Health Insurance Portability and Accountability Act)
```yaml
compliance_tags:
  - hipaa
```

**Requirements**:
- PHI (Protected Health Information) handling
- Access controls and authentication
- Audit logging
- Business Associate Agreements (BAA)

#### GDPR (General Data Protection Regulation)
```yaml
compliance_tags:
  - gdpr
```

**Requirements**:
- Right to access
- Right to erasure
- Data portability
- Privacy by design
- Data breach notification

#### FedRAMP (Federal Risk and Authorization Management Program)
```yaml
compliance_tags:
  - fedramp
```

**Requirements**:
- Federal cloud security standards
- Continuous monitoring
- Incident response procedures
- Security controls documentation

#### SOC 2 (Service Organization Control 2)
```yaml
compliance_tags:
  - soc2
```

**Requirements**:
- Security controls
- Availability controls
- Processing integrity
- Confidentiality controls
- Privacy controls

#### PCI-DSS (Payment Card Industry Data Security Standard)
```yaml
compliance_tags:
  - pci-dss
```

**Requirements**:
- Payment card data protection
- Network security
- Access controls
- Regular security testing

### Multiple Compliance Tags

Agents can have multiple compliance requirements:

```yaml
tools:
  - type: http
    name: healthcare-api
    compliance_tags:
      - pii
      - hipaa
      - gdpr
```

## Per-Capability Scopes

Capabilities within a tool can have their own scopes, overriding tool-level defaults.

```yaml
tools:
  - type: http
    name: user-management-api
    auth:
      type: bearer
      credentials: secret:api-key
      scopes:
        - read:users
        - write:users
    capabilities:
      - name: get_user_profile
        scopes:
          - read:users
          - read:profile
      - name: delete_user
        scopes:
          - admin:users
          - delete:users
        compliance_tags:
          - pii
          - gdpr
```

## Complete Example

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: healthcare-assistant
spec:
  role: |
    You are a healthcare assistant that helps patients with medical questions.
    You must comply with HIPAA and GDPR regulations.
  
  tools:
    - type: http
      name: patient-records-api
      endpoint: https://api.healthcare.example.com/v1
      auth:
        type: bearer
        credentials: secret:healthcare-api-key
        scopes:
          - read:patient_records
          - read:medical_history
      compliance_tags:
        - pii
        - hipaa
        - gdpr
      capabilities:
        - name: get_patient_info
          scopes:
            - read:patient_records
          compliance_tags:
            - pii
            - hipaa
        - name: update_medical_history
          scopes:
            - write:patient_records
            - write:medical_history
          compliance_tags:
            - pii
            - hipaa
            - gdpr
    
    - type: http
      name: payment-processing
      endpoint: https://api.payments.example.com/v1
      auth:
        type: bearer
        credentials: secret:payment-api-key
        scopes:
          - read:payments
          - write:payments
      compliance_tags:
        - pci-dss
        - pii
      capabilities:
        - name: process_payment
          scopes:
            - write:payments
          compliance_tags:
            - pci-dss
```

## Scope Validation

OSSA implementations should validate scopes before executing capabilities:

1. **Check tool-level scopes** - Verify agent has required scopes
2. **Check capability-level scopes** - Verify capability-specific scopes
3. **Check compliance tags** - Ensure compliance requirements are met
4. **Log access** - Record scope usage for audit trails

## Best Practices

1. **Principle of least privilege** - Grant minimum required scopes
2. **Scope inheritance** - Use tool-level defaults, override at capability level
3. **Compliance tagging** - Tag all capabilities that handle regulated data
4. **Audit logging** - Log all scope usage for compliance
5. **Regular reviews** - Periodically review and update scopes
6. **Documentation** - Document scope requirements in agent descriptions

## Framework Integration

### OAuth2 Providers

```yaml
auth:
  type: oauth2
  credentials: secret:oauth-client-id
  scopes:
    - read:data
    - write:data
  config:
    authorization_url: https://auth.example.com/authorize
    token_url: https://auth.example.com/token
```

### API Key with Scopes

```yaml
auth:
  type: apikey
  credentials: secret:api-key
  scopes:
    - read:data
    - execute:query
```

### mTLS with Scopes

```yaml
auth:
  type: mtls
  credentials: secret:client-cert
  scopes:
    - admin:system
    - execute:command
```

## Related Documentation

- [Tools](./tools.md) - Tool definitions with security configuration
- [Transport](./transport.md) - Secure transport configuration
- [State Management](./state.md) - Secure state storage
- [Migration Guide: v0.2.3 to v0.2.4](/docs/migration-guides/v0.2.3-to-v0.2.4) - Migration instructions

