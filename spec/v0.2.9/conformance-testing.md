# OSSA Conformance Testing Specification

**Version**: 0.2.9
**Status**: Draft
**Last Updated**: 2025-12-04

This document defines conformance testing requirements and procedures for OSSA-compliant agents and runtimes.

## Overview

Conformance testing ensures OSSA implementations meet specification requirements. Three conformance levels provide progressive validation from basic schema compliance to enterprise-grade security and compliance.

```bash
# Quick conformance check
ossa validate agent.yml                     # Basic level
ossa validate agent.yml --level=standard    # Standard level
ossa validate agent.yml --level=enterprise  # Enterprise level
```

---

## 1. Conformance Levels

### 1.1 Basic Conformance

**Requirements**:
- ✅ Schema validation passes
- ✅ All required fields present
- ✅ Valid URIs and references
- ✅ Semantic version format

**Validates**:
- YAML/JSON structure
- Data types and enums
- Required vs optional fields
- URI format and reachability

**Time to Validate**: < 1 second

```bash
ossa validate agent.yml --level=basic
```

**Output**:
```
✓ Schema validation passed
✓ All required fields present (apiVersion, kind, metadata, spec)
✓ Valid semantic version: 0.2.9
✓ All capability URIs reachable
✓ Tool schemas valid JSON Schema Draft-07

Basic Conformance: PASSED
```

### 1.2 Standard Conformance

**Requirements**:
- ✅ All Basic requirements
- ✅ Runtime semantics compliance
- ✅ Error handling implemented
- ✅ State management correct
- ✅ Turn lifecycle adherence

**Validates**:
- Turn lifecycle phases (7 phases)
- Error code handling
- State isolation levels
- Tool execution semantics
- Observability emissions

**Time to Validate**: 10-30 seconds (includes runtime tests)

```bash
ossa validate agent.yml --level=standard
```

**Output**:
```
✓ Basic conformance passed
✓ Turn lifecycle: All 7 phases implemented
✓ Error handling: 14/14 error codes handled
✓ State isolation: serializable level supported
✓ Tool execution: Parallel and sequential modes
✓ Observability: OpenTelemetry spans emitted

Standard Conformance: PASSED
```

### 1.3 Enterprise Conformance

**Requirements**:
- ✅ All Standard requirements
- ✅ Security model enforced
- ✅ Compliance profile validated
- ✅ Audit logging complete
- ✅ Encryption at rest/transit

**Validates**:
- FedRAMP/SOC2/HIPAA controls
- Audit log retention
- Encryption algorithms
- Authentication mechanisms
- Data residency compliance

**Time to Validate**: 1-5 minutes (includes security scans)

```bash
ossa validate agent.yml --level=enterprise --profile=fedramp-moderate
```

**Output**:
```
✓ Standard conformance passed
✓ Security: TLS 1.3, AES-256-GCM encryption
✓ Compliance: FedRAMP Moderate (110/110 controls)
✓ Audit logging: Enabled, 7-year retention
✓ Authentication: mTLS configured
✓ Data residency: US regions only

Enterprise Conformance: PASSED (FedRAMP Moderate)
```

---

## 2. Test Categories

### 2.1 Schema Tests

**Purpose**: Validate manifest structure and data types.

```typescript
interface SchemaTest {
  name: string;
  description: string;
  input: string;           // Path to manifest file
  expected: 'pass' | 'fail';
  error_code?: string;
}
```

**Test Cases**:
1. Valid minimal worker agent
2. Valid supervisor with delegation
3. Missing required field (apiVersion)
4. Invalid semantic version
5. Invalid tool schema
6. Unknown capability URI
7. Malformed YAML syntax
8. Invalid enum value
9. Negative timeout value
10. Circular delegation reference

### 2.2 Runtime Tests

**Purpose**: Validate runtime behavior and semantics.

```typescript
interface RuntimeTest {
  name: string;
  description: string;
  agent: string;          // Path to manifest
  scenario: TestScenario;
  assertions: Assertion[];
}

interface TestScenario {
  input: Message[];
  expected_turns: number;
  expected_tool_calls: ToolCall[];
  expected_state_changes: StateChange[];
}
```

**Test Cases**:
1. Single-turn interaction
2. Multi-turn conversation
3. Tool execution with retry
4. State persistence across turns
5. Error recovery (TOOL_ERROR)
6. Circuit breaker activation
7. Max turns limit enforcement
8. Token limit enforcement
9. Delegation handoff
10. Parallel tool execution

### 2.3 Security Tests

**Purpose**: Validate security controls and practices.

```typescript
interface SecurityTest {
  name: string;
  description: string;
  agent: string;
  vulnerability: string;
  expected: 'blocked' | 'detected' | 'logged';
}
```

**Test Cases**:
1. No secrets in manifest
2. Authentication configured for external tools
3. Sandbox escape attempt blocked
4. PII redaction in logs
5. Encryption at rest enabled
6. TLS 1.3 for all connections
7. Content filtering blocks harmful prompts
8. API key rotation enforced
9. RBAC for privileged tools
10. Session timeout enforcement

### 2.4 Interoperability Tests

**Purpose**: Validate cross-framework compatibility.

```typescript
interface InteropTest {
  name: string;
  description: string;
  source_agent: string;
  target_framework: 'langchain' | 'autogen' | 'crewai' | 'anthropic';
  protocol: 'a2a' | 'mcp' | 'rest';
  expected: 'success' | 'graceful_degradation';
}
```

**Test Cases**:
1. A2A protocol handshake
2. Capability negotiation
3. Message format translation
4. Context propagation
5. Error code mapping
6. State isolation across frameworks
7. Observability trace linking
8. Tool schema compatibility
9. Authentication credential passing
10. Graceful degradation on unsupported features

---

## 3. Test Fixtures

Test fixtures are located in `spec/v0.2.9/fixtures/` directory.

### 3.1 Basic Level Fixtures

#### fixtures/basic/valid-worker.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: test-worker
  version: 1.0.0
spec:
  role: "You are a test agent for conformance validation"
  capabilities:
    - urn:ossa:capability:chat
  llm:
    provider: openai
    model: gpt-4o-mini
  tools: []
```

#### fixtures/basic/invalid-missing-version.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: test-invalid
  # version field missing - should fail validation
spec:
  role: "Test agent with missing version"
  capabilities:
    - urn:ossa:capability:chat
  llm:
    provider: openai
    model: gpt-4o-mini
```

#### fixtures/basic/invalid-bad-semver.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: test-bad-version
  version: "1.0"  # Invalid semver - missing patch version
spec:
  role: "Test agent with invalid semantic version"
  capabilities:
    - urn:ossa:capability:chat
  llm:
    provider: openai
    model: gpt-4o-mini
```

#### fixtures/basic/invalid-unknown-capability.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: test-unknown-cap
  version: 1.0.0
spec:
  role: "Test agent with unknown capability"
  capabilities:
    - urn:ossa:capability:unknown:foobar  # Unknown capability
  llm:
    provider: openai
    model: gpt-4o-mini
```

#### fixtures/basic/invalid-malformed-yaml.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: test-malformed
  version: 1.0.0
spec:
  role: "Test agent"
  capabilities:
    - urn:ossa:capability:chat
  llm:
    provider: openai
    model: gpt-4o-mini
  tools:
    - name: test_tool
      description: "Test tool"
      # Missing closing quote - malformed YAML
      input_schema: { "type": "object
```

### 3.2 Standard Level Fixtures

#### fixtures/standard/runtime-compliant.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: runtime-test
  version: 1.0.0
spec:
  role: "Agent for runtime semantics testing"
  capabilities:
    - urn:ossa:capability:chat
    - urn:ossa:capability:tools

  llm:
    provider: openai
    model: gpt-4o
    parameters:
      temperature: 0.7
      max_tokens: 2000

  constraints:
    max_turns: 20
    max_tokens: 100000
    timeout_seconds: 300

  tools:
    - name: calculator
      description: "Perform basic arithmetic"
      input_schema:
        type: object
        properties:
          operation:
            type: string
            enum: [add, subtract, multiply, divide]
          a:
            type: number
          b:
            type: number
        required: [operation, a, b]
      source:
        type: function
        implementation: |
          function calculator(input) {
            const { operation, a, b } = input;
            switch (operation) {
              case 'add': return a + b;
              case 'subtract': return a - b;
              case 'multiply': return a * b;
              case 'divide': return a / b;
              default: throw new Error('Unknown operation');
            }
          }

  state:
    enabled: true
    isolation_level: serializable
    ttl: 3600

  reliability:
    retry:
      enabled: true
      max_attempts: 3
      backoff_ms: 1000
    circuit_breaker:
      enabled: true
      failure_threshold: 5
      timeout_ms: 30000
      half_open_after_ms: 60000

  observability:
    logging:
      enabled: true
      level: info
      structured: true
    tracing:
      enabled: true
      provider: opentelemetry
    metrics:
      enabled: true
      provider: prometheus
```

#### fixtures/standard/error-handling.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: error-handler-test
  version: 1.0.0
spec:
  role: "Agent for error handling validation"
  capabilities:
    - urn:ossa:capability:chat
    - urn:ossa:capability:tools

  llm:
    provider: openai
    model: gpt-4o-mini

  tools:
    - name: flaky_tool
      description: "Tool that fails intermittently"
      input_schema:
        type: object
        properties:
          fail_probability:
            type: number
            minimum: 0
            maximum: 1
        required: [fail_probability]
      source:
        type: function
        implementation: |
          function flaky_tool(input) {
            if (Math.random() < input.fail_probability) {
              throw new Error('TOOL_ERROR: Random failure');
            }
            return { success: true };
          }

  reliability:
    retry:
      enabled: true
      max_attempts: 3
      backoff_ms: 500
    fallback:
      on_error:
        - error_code: TOOL_ERROR
          strategy: retry
          max_retries: 3
        - error_code: TOOL_TIMEOUT
          strategy: fallback
          fallback_value: { error: true, message: "Tool timed out" }
        - error_code: MAX_TURNS_EXCEEDED
          strategy: escalate
          escalation_target: human
```

#### fixtures/standard/state-management.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: state-test
  version: 1.0.0
spec:
  role: "Agent for state management testing"
  capabilities:
    - urn:ossa:capability:chat
    - urn:ossa:capability:stateful

  llm:
    provider: openai
    model: gpt-4o-mini

  state:
    enabled: true
    isolation_level: serializable
    encryption:
      enabled: true
      algorithm: AES-256-GCM
    ttl: 7200
    storage:
      backend: redis
      uri: redis://localhost:6379/0
      key_prefix: "ossa:test:"

  tools:
    - name: get_counter
      description: "Get current counter value"
      input_schema:
        type: object
        properties: {}
      source:
        type: function
        implementation: |
          async function get_counter() {
            const value = await state.get('counter') || 0;
            return { counter: value };
          }

    - name: increment_counter
      description: "Increment counter"
      input_schema:
        type: object
        properties:
          amount:
            type: number
            default: 1
      source:
        type: function
        implementation: |
          async function increment_counter(input) {
            const current = await state.get('counter') || 0;
            const new_value = current + (input.amount || 1);
            await state.set('counter', new_value);
            return { counter: new_value };
          }
```

### 3.3 Enterprise Level Fixtures

#### fixtures/enterprise/fedramp-compliant.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: fedramp-agent
  version: 1.0.0
  annotations:
    compliance.framework: FedRAMP
    compliance.level: Moderate
    dpia.completed: "true"
    dpia.date: "2025-01-15"

spec:
  role: "FedRAMP Moderate compliant agent"
  capabilities:
    - urn:ossa:capability:chat
    - urn:ossa:capability:tools

  compliance:
    profiles:
      - fedramp-moderate
    audit:
      enabled: true
      retention_days: 2555  # 7 years
      immutable: true

  llm:
    provider: openai
    model: gpt-4o
    parameters:
      temperature: 0.7

  security:
    authentication:
      required: true
      type: mtls
      mfa_required: true
    authorization:
      rbac:
        enabled: true
        roles:
          - name: analyst
            permissions: [read, execute]
          - name: admin
            permissions: [read, write, execute, delete]

  state:
    enabled: true
    isolation_level: serializable
    encryption:
      enabled: true
      algorithm: AES-256-GCM
      key_management: FIPS-140-2
      at_rest: true
      in_transit: true
    storage:
      backend: aws-dynamodb
      region: us-gov-west-1
      data_residency: US

  tools:
    - name: query_database
      description: "Query federal database"
      input_schema:
        type: object
        properties:
          query:
            type: string
      source:
        type: http
        uri: https://api.example.gov/query
        method: POST
        tls:
          enabled: true
          min_version: "1.3"
          client_cert_required: true
        authentication:
          type: mtls
          cert_path: /etc/certs/client.pem
          key_path: /etc/certs/client.key
      approval_required: true

  observability:
    logging:
      enabled: true
      level: info
      structured: true
      immutable: true
      pii_redaction: true
      retention_days: 2555
    tracing:
      enabled: true
      provider: opentelemetry
      pii_redaction: true
    metrics:
      enabled: true
      provider: prometheus

  reliability:
    retry:
      enabled: true
      max_attempts: 3
      backoff_ms: 1000
    circuit_breaker:
      enabled: true
      failure_threshold: 3
      timeout_ms: 30000
```

#### fixtures/enterprise/hipaa-compliant.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: healthcare-agent
  version: 1.0.0
  annotations:
    compliance.framework: HIPAA
    baa.signed: "true"
    baa.date: "2025-01-01"
    workforce.training: "completed"

spec:
  role: "HIPAA-compliant healthcare assistant"
  capabilities:
    - urn:ossa:capability:chat
    - urn:ossa:capability:phi

  compliance:
    profiles:
      - hipaa
    audit:
      enabled: true
      retention_days: 2190  # 6 years
      phi_access_logging: true
      immutable: true

  llm:
    provider: openai
    model: gpt-4o
    parameters:
      temperature: 0.3

  security:
    authentication:
      required: true
      type: oauth2
      mfa_required: true
    authorization:
      phi_access:
        minimum_necessary: true
        access_justification: required
        audit_all_access: true

  safety:
    content_filtering:
      enabled: true
      phi_detection: true
      phi_redaction: true

  state:
    enabled: true
    isolation_level: serializable
    encryption:
      enabled: true
      algorithm: AES-256-GCM
      phi_specific: true
      at_rest: true
      in_transit: true
    storage:
      backend: postgresql
      phi_isolation: true
      access_logging: true
    retention:
      minimum_days: 2190

  tools:
    - name: lookup_patient
      description: "Lookup patient information"
      input_schema:
        type: object
        properties:
          patient_id:
            type: string
            pattern: "^[0-9]{8}$"
        required: [patient_id]
      source:
        type: http
        uri: https://ehr.example.com/api/patients
        method: GET
        tls:
          enabled: true
          min_version: "1.2"
        authentication:
          type: oauth2
          token_endpoint: https://auth.example.com/token
      approval_required: true
      phi_handling:
        contains_phi: true
        minimum_necessary: true
        access_justification: required

  observability:
    logging:
      enabled: true
      level: info
      structured: true
      immutable: true
      phi_redaction: mandatory
      phi_access_logging: true
      retention_days: 2190
    tracing:
      enabled: true
      provider: opentelemetry
      phi_redaction: mandatory
```

#### fixtures/enterprise/soc2-compliant.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: soc2-agent
  version: 1.0.0
  annotations:
    compliance.framework: SOC2
    compliance.type: Type-II
    soc2.report.date: "2025-01-01"

spec:
  role: "SOC 2 Type II compliant agent"
  capabilities:
    - urn:ossa:capability:chat
    - urn:ossa:capability:tools

  compliance:
    profiles:
      - soc2-type2
    audit:
      enabled: true
      retention_days: 365
      tamper_evident: true

  llm:
    provider: openai
    model: gpt-4o

  security:
    authentication:
      required: true
      type: oauth2
    authorization:
      rbac:
        enabled: true
    session:
      timeout_seconds: 3600
      require_reauth: true
    change_management:
      enabled: true
      approval_required: true
      track_all_changes: true

  state:
    enabled: true
    encryption:
      enabled: true
      algorithm: AES-256-GCM
    backup:
      enabled: true
      frequency: daily
      retention_days: 90

  reliability:
    retry:
      enabled: true
      max_attempts: 3
    circuit_breaker:
      enabled: true
      failure_threshold: 5
    fallback:
      enabled: true

  observability:
    logging:
      enabled: true
      level: info
      structured: true
      tamper_evident: true
      retention_days: 365
    monitoring:
      enabled: true
      alerting:
        enabled: true
        channels:
          - type: pagerduty
            severity: high
    metrics:
      enabled: true
      availability_tracking: true
      sla_target: 99.9

  data:
    classification:
      enabled: true
      levels: [public, internal, confidential, restricted]
    retention_policy:
      enabled: true
      default_retention_days: 365
    disposal:
      method: secure_delete
      verification: required
```

#### fixtures/enterprise/gdpr-compliant.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: gdpr-agent
  version: 1.0.0
  annotations:
    compliance.framework: GDPR
    dpia.completed: "true"
    dpia.date: "2025-01-10"
    dpo.assigned: "true"

spec:
  role: "GDPR-compliant agent for EU data processing"
  capabilities:
    - urn:ossa:capability:chat
    - urn:ossa:capability:personal-data

  compliance:
    profiles:
      - gdpr
    audit:
      enabled: true
      retention_days: 365
      personal_data_logging: minimized

  llm:
    provider: openai
    model: gpt-4o
    parameters:
      temperature: 0.7

  security:
    authentication:
      required: true
      type: oauth2

  safety:
    content_filtering:
      enabled: true
      personal_data_detection: true

  state:
    enabled: true
    encryption:
      enabled: true
      algorithm: AES-256-GCM
    storage:
      backend: postgresql
      region: eu-west-1
      data_residency: EU
    retention:
      purpose_limitation: true
      right_to_erasure: true
    data_portability:
      enabled: true
      formats: [json, csv, xml]

  tools:
    - name: query_user_data
      description: "Query user personal data"
      input_schema:
        type: object
        properties:
          user_id:
            type: string
        required: [user_id]
      source:
        type: http
        uri: https://api.example.eu/users
        method: GET
        tls:
          enabled: true
          min_version: "1.3"
      data_processing:
        purpose_specification: "User account management"
        consent_verification: required
        legal_basis: consent
      approval_required: true

    - name: export_user_data
      description: "Export user data (Article 20 - Right to Data Portability)"
      input_schema:
        type: object
        properties:
          user_id:
            type: string
          format:
            type: string
            enum: [json, csv, xml]
        required: [user_id, format]
      source:
        type: function
        implementation: |
          async function export_user_data(input) {
            const data = await state.get(`user:${input.user_id}`);
            return formatData(data, input.format);
          }

    - name: delete_user_data
      description: "Delete user data (Article 17 - Right to Erasure)"
      input_schema:
        type: object
        properties:
          user_id:
            type: string
        required: [user_id]
      source:
        type: function
        implementation: |
          async function delete_user_data(input) {
            await state.delete(`user:${input.user_id}`);
            return { deleted: true, user_id: input.user_id };
          }
      approval_required: true

  observability:
    logging:
      enabled: true
      level: info
      personal_data_minimization: true
      retention_days: 365
    consent_tracking:
      enabled: true
      log_all_consent: true

  data:
    personal_data_detection: required
    anonymization:
      enabled: true
      techniques: [k-anonymity, differential-privacy]
    pseudonymization:
      enabled: true
    rights:
      access: enabled
      rectification: enabled
      erasure: enabled
      portability: enabled
      object: enabled
```

### 3.4 Interoperability Fixtures

#### fixtures/interop/a2a-delegation.yml

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: supervisor-a2a
  version: 1.0.0
spec:
  role: "Supervisor agent for A2A protocol testing"
  capabilities:
    - urn:ossa:capability:supervisor
    - urn:ossa:capability:a2a

  llm:
    provider: openai
    model: gpt-4o

  delegation:
    enabled: true
    protocol: a2a
    discovery:
      method: registry
      registry_uri: http://localhost:8080/agents

  tools:
    - name: delegate_to_specialist
      description: "Delegate task to specialist agent"
      input_schema:
        type: object
        properties:
          specialist_capability:
            type: string
          task:
            type: string
        required: [specialist_capability, task]
      source:
        type: delegation
        protocol: a2a
        capability_match: true
        timeout_ms: 30000
```

---

## 4. Certification Badge

### 4.1 Badge Format

Conformant agents MAY display certification badges in their documentation:

```markdown
[![OSSA Conformance](https://ossa.ai/badge/v0.2.9/basic)](https://ossa.ai/certifications/basic/agent-id)
[![OSSA Conformance](https://ossa.ai/badge/v0.2.9/standard)](https://ossa.ai/certifications/standard/agent-id)
[![OSSA Conformance](https://ossa.ai/badge/v0.2.9/enterprise/fedramp)](https://ossa.ai/certifications/enterprise/agent-id)
```

**Badge Levels**:
- ![Basic](https://img.shields.io/badge/OSSA-Basic-green) - Schema valid, basic checks pass
- ![Standard](https://img.shields.io/badge/OSSA-Standard-blue) - Runtime semantics compliant
- ![Enterprise](https://img.shields.io/badge/OSSA-Enterprise-purple) - Security + compliance validated

### 4.2 Certification Metadata

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: certified-agent
  version: 1.0.0
  annotations:
    ossa.ai/conformance-level: enterprise
    ossa.ai/conformance-profile: fedramp-moderate
    ossa.ai/certification-date: "2025-12-04"
    ossa.ai/certification-expiry: "2026-12-04"
    ossa.ai/certification-id: "ossa-cert-abc123"
spec:
  # ... agent spec
```

### 4.3 Certification Expiration

- **Basic**: No expiration (spec version locked)
- **Standard**: 1 year expiration (runtime semantics may evolve)
- **Enterprise**: 1 year expiration (compliance frameworks update annually)

**Re-certification**:
```bash
# Check if certification is still valid
ossa validate agent.yml --check-certification

# Re-certify after updates
ossa certify agent.yml --level=enterprise --profile=fedramp-moderate
```

---

## 5. Validation CLI

### 5.1 Basic Validation

```bash
# Validate schema only
ossa validate agent.yml

# Verbose output
ossa validate agent.yml --verbose

# JSON output for CI/CD
ossa validate agent.yml --format=json
```

**Output** (JSON):
```json
{
  "level": "basic",
  "status": "passed",
  "tests": {
    "schema": "passed",
    "required_fields": "passed",
    "semver": "passed",
    "uris": "passed"
  },
  "timestamp": "2025-12-04T12:00:00Z"
}
```

### 5.2 Standard Validation

```bash
# Standard conformance (requires runtime)
ossa validate agent.yml --level=standard

# Skip slow tests
ossa validate agent.yml --level=standard --skip=performance

# Test specific runtime
ossa validate agent.yml --level=standard --runtime=./path/to/runtime
```

**Output**:
```json
{
  "level": "standard",
  "status": "passed",
  "tests": {
    "basic": "passed",
    "turn_lifecycle": "passed",
    "error_handling": "passed",
    "state_management": "passed",
    "observability": "passed"
  },
  "runtime": {
    "name": "ossa-runtime-typescript",
    "version": "0.2.9"
  },
  "timestamp": "2025-12-04T12:00:00Z",
  "duration_ms": 12345
}
```

### 5.3 Enterprise Validation

```bash
# Enterprise conformance with compliance profile
ossa validate agent.yml --level=enterprise --profile=fedramp-moderate

# Multiple profiles
ossa validate agent.yml --level=enterprise --profile=hipaa,soc2-type2

# Generate compliance report (PDF)
ossa compliance-report agent.yml --profile=fedramp-moderate --format=pdf --output=report.pdf
```

**Output**:
```json
{
  "level": "enterprise",
  "status": "passed",
  "profiles": ["fedramp-moderate"],
  "tests": {
    "standard": "passed",
    "security": "passed",
    "compliance": "passed",
    "audit_logging": "passed",
    "encryption": "passed"
  },
  "controls": {
    "total": 110,
    "passed": 110,
    "failed": 0
  },
  "certification": {
    "id": "ossa-cert-abc123",
    "issued": "2025-12-04T12:00:00Z",
    "expires": "2026-12-04T12:00:00Z"
  }
}
```

### 5.4 List Available Profiles

```bash
# List all compliance profiles
ossa profiles list

# Show profile details
ossa profiles show fedramp-moderate
```

**Output**:
```
Available Compliance Profiles:

  fedramp-moderate   FedRAMP Moderate Baseline (110 controls)
  fedramp-high       FedRAMP High Baseline (325 controls)
  soc2-type2         SOC 2 Type II
  hipaa              HIPAA Security and Privacy Rules
  gdpr               GDPR (EU Data Protection)
  pci-dss-4.0        PCI DSS v4.0
  iso27001-2022      ISO/IEC 27001:2022

Use 'ossa profiles show <profile>' for details.
```

---

## 6. CI/CD Integration

### 6.1 GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - test
  - certify

ossa:validate:
  stage: validate
  image: ossa/cli:latest
  script:
    - ossa validate agents/**/*.yml --level=basic --format=junit
  artifacts:
    reports:
      junit: ossa-validation-report.xml

ossa:test:
  stage: test
  image: ossa/cli:latest
  script:
    - ossa validate agents/**/*.yml --level=standard --format=junit
  artifacts:
    reports:
      junit: ossa-standard-report.xml
  only:
    - merge_requests
    - main

ossa:certify:
  stage: certify
  image: ossa/cli:latest
  script:
    - ossa validate agents/production/*.yml --level=enterprise --profile=$COMPLIANCE_PROFILE
    - ossa certify agents/production/*.yml --level=enterprise --output=certifications/
  artifacts:
    paths:
      - certifications/
  only:
    - tags
  when: manual
```

### 6.2 GitHub Actions

```yaml
# .github/workflows/ossa-conformance.yml
name: OSSA Conformance Testing

on:
  pull_request:
    paths:
      - 'agents/**/*.yml'
  push:
    branches:
      - main

jobs:
  validate-basic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install OSSA CLI
        run: npm install -g @ossa/cli
      - name: Validate Schemas
        run: ossa validate agents/**/*.yml --level=basic --format=json > validation-report.json
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: validation-report
          path: validation-report.json

  test-standard:
    runs-on: ubuntu-latest
    needs: validate-basic
    steps:
      - uses: actions/checkout@v4
      - name: Install OSSA CLI
        run: npm install -g @ossa/cli
      - name: Runtime Tests
        run: ossa validate agents/**/*.yml --level=standard --format=junit
      - name: Publish Test Results
        uses: EnricoMi/publish-unit-test-result-action@v2
        if: always()
        with:
          files: ossa-test-results.xml

  certify-enterprise:
    runs-on: ubuntu-latest
    needs: test-standard
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Install OSSA CLI
        run: npm install -g @ossa/cli
      - name: Enterprise Validation
        run: ossa validate agents/production/*.yml --level=enterprise --profile=${{ secrets.COMPLIANCE_PROFILE }}
      - name: Generate Certification
        run: ossa certify agents/production/*.yml --level=enterprise --output=certifications/
      - name: Upload Certifications
        uses: actions/upload-artifact@v4
        with:
          name: certifications
          path: certifications/
```

### 6.3 Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running OSSA conformance validation..."

# Find all changed YAML files in agents/ directory
changed_files=$(git diff --cached --name-only --diff-filter=ACM | grep 'agents/.*\.yml$')

if [ -z "$changed_files" ]; then
  echo "No agent manifests changed, skipping validation."
  exit 0
fi

# Validate each changed file
for file in $changed_files; do
  echo "Validating $file..."
  ossa validate "$file" --level=basic --quiet

  if [ $? -ne 0 ]; then
    echo "❌ Validation failed for $file"
    echo "Run 'ossa validate $file --verbose' for details"
    exit 1
  fi
done

echo "✅ All agent manifests passed validation"
exit 0
```

---

## 7. Test Execution

### 7.1 Running Test Suites

```bash
# Run all conformance tests
ossa test conformance

# Run specific test category
ossa test conformance --category=schema
ossa test conformance --category=runtime
oss test conformance --category=security

# Run tests for specific fixtures
ossa test conformance --fixtures=fixtures/basic/**
ossa test conformance --fixtures=fixtures/enterprise/fedramp-compliant.yml

# Generate test report
ossa test conformance --report=html --output=conformance-report.html
```

### 7.2 Test Output Format

```bash
# JUnit XML (for CI/CD)
ossa test conformance --format=junit --output=junit-report.xml

# JSON (for programmatic parsing)
ossa test conformance --format=json --output=test-results.json

# HTML (for human review)
ossa test conformance --format=html --output=test-report.html

# TAP (Test Anything Protocol)
ossa test conformance --format=tap
```

### 7.3 Custom Test Suites

```yaml
# custom-tests.yml
name: Custom Conformance Suite
version: 1.0.0
tests:
  - name: Validate Production Agents
    type: schema
    fixtures:
      - agents/production/**/*.yml
    level: enterprise
    profiles:
      - fedramp-moderate

  - name: Runtime Semantics
    type: runtime
    fixtures:
      - fixtures/standard/**/*.yml
    timeout: 300

  - name: Security Baseline
    type: security
    fixtures:
      - agents/**/*.yml
    checks:
      - no_secrets
      - tls_required
      - encryption_at_rest
```

**Run custom suite**:
```bash
ossa test conformance --suite=custom-tests.yml
```

---

## 8. Compliance Requirements

### 8.1 MUST Requirements

1. Runtimes MUST pass Basic conformance for schema validation
2. Runtimes MUST implement all 7 turn lifecycle phases for Standard conformance
3. Runtimes MUST handle all 14 error codes for Standard conformance
4. Runtimes MUST enforce compliance profile requirements when declared
5. Validation tools MUST fail on missing required fields
6. Certification MUST expire after 1 year for Standard/Enterprise levels

### 8.2 SHOULD Requirements

1. Runtimes SHOULD provide validation CLI tools
2. Agents SHOULD display conformance badges in documentation
3. CI/CD pipelines SHOULD include conformance validation
4. Test fixtures SHOULD cover all error conditions
5. Certification reports SHOULD be machine-readable (JSON/XML)

### 8.3 MAY Requirements

1. Runtimes MAY provide custom test suites
2. Agents MAY certify against multiple compliance profiles
3. Tools MAY integrate with third-party security scanners
4. Fixtures MAY include performance benchmarks

---

## 9. References

- [OSSA Schema v0.2.9](./ossa-0.2.9.schema.json)
- [Runtime Semantics](./runtime-semantics.md)
- [Compliance Profiles](./compliance-profiles.md)
- [Semantic Conventions](./semantic-conventions.md)
- [JSON Schema Specification](https://json-schema.org/)
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/)

---

## Appendix A: Full Test Matrix

| Test Category | Basic | Standard | Enterprise |
|---------------|-------|----------|------------|
| Schema Validation | ✅ | ✅ | ✅ |
| Required Fields | ✅ | ✅ | ✅ |
| Semantic Versioning | ✅ | ✅ | ✅ |
| URI Validation | ✅ | ✅ | ✅ |
| Turn Lifecycle | ❌ | ✅ | ✅ |
| Error Handling | ❌ | ✅ | ✅ |
| State Management | ❌ | ✅ | ✅ |
| Tool Execution | ❌ | ✅ | ✅ |
| Observability | ❌ | ✅ | ✅ |
| Security Controls | ❌ | ❌ | ✅ |
| Compliance Profiles | ❌ | ❌ | ✅ |
| Audit Logging | ❌ | ❌ | ✅ |
| Encryption | ❌ | ❌ | ✅ |
| Authentication | ❌ | ❌ | ✅ |

---

## Appendix B: Error Code Reference

For complete error code taxonomy, see [Runtime Semantics - Section 2](./runtime-semantics.md#2-error-handling).

**Quick Reference**:
- `VALIDATION_ERROR` - Invalid input format (abort, 0 retries)
- `TOOL_ERROR` - Tool execution failed (retry, 3 attempts)
- `LLM_ERROR` - LLM provider error (retry, 3 attempts)
- `RATE_LIMITED` - Rate limit exceeded (retry with backoff, 3 attempts)
- `MAX_TURNS_EXCEEDED` - Hit turn limit (escalate, 0 retries)

---

**Document Status**: Draft
**Next Review**: 2025-12-18
**Maintainer**: OSSA Working Group
