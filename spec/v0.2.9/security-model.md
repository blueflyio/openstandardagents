# OSSA Security Model

**Version**: 0.2.9
**Status**: Draft
**Last Updated**: 2025-12-04

This document defines the security model for OSSA-compliant agents, including identity management, authentication, authorization, secrets handling, sandboxing, and audit logging.

## Overview

The OSSA security model operates on **deny-by-default** principles with defense-in-depth:

1. **Identity**: Every agent has a cryptographically verifiable identity
2. **Authentication**: Agents authenticate using mTLS, JWT, or OIDC
3. **Authorization**: RBAC/ABAC policies control agent capabilities
4. **Secrets**: Never embedded in manifests; always externalized
5. **Sandboxing**: Agents run in isolated environments with resource limits
6. **Audit**: All security events are logged in OpenTelemetry-compatible format

```yaml
apiVersion: ossa/v0.2.9
kind: Agent
metadata:
  name: secure-agent
spec:
  security:
    identity:
      urn: ossa:agent:acme:secure-agent:1.0.0
      attestation:
        type: x509
        certificate_ref: ${vault:pki/agent-cert}

    authentication:
      methods:
        - mtls
        - jwt
      jwt:
        issuer: https://auth.acme.com
        audience: ossa-runtime

    authorization:
      rbac:
        role: worker
      policies:
        - allow: tools.read
        - deny: tools.delete

    sandbox:
      isolation: container
      resources:
        memory: 512Mi
        cpu: 1000m
      network:
        egress:
          - https://api.github.com
          - https://api.gitlab.com

    audit:
      enabled: true
      events:
        - agent_started
        - capability_invoked
        - secret_accessed
        - policy_violation
```

---

## Agent Identity

Every OSSA agent MUST have a globally unique identity expressed as a URN.

### URN Format

```
ossa:agent:<organization>:<name>:<version>
```

**Examples**:
- `ossa:agent:acme:code-reviewer:1.2.0`
- `ossa:agent:github:security-scanner:2.0.0`
- `ossa:agent:gitlab:merge-approver:3.1.0`

### Identity Schema

```yaml
spec:
  security:
    identity:
      urn: string                    # Required: Agent URN
      attestation:
        type: x509 | jwt | spiffe    # Required: Attestation type
        certificate_ref?: string     # For x509/SPIFFE
        jwt_ref?: string             # For JWT
        trust_anchor: string         # Trust root CA/issuer

      labels:                        # Optional: Identity labels
        organization: string
        team: string
        environment: dev | staging | prod
```

### Attestation Types

#### X.509 Certificate Attestation

Agents present X.509 certificates signed by a trusted CA.

```yaml
attestation:
  type: x509
  certificate_ref: ${vault:pki/certs/agent-cert}
  trust_anchor: ${vault:pki/ca/root-ca}

  # Optional: Certificate validation rules
  validation:
    require_san: true
    allowed_sans:
      - DNS:secure-agent.acme.com
      - URI:ossa:agent:acme:secure-agent:1.0.0
    check_revocation: true
    ocsp_endpoints:
      - https://ocsp.acme.com
```

**Trust Chain**:
1. Runtime validates certificate against trust anchor
2. Checks SAN matches agent URN
3. Verifies certificate not revoked (OCSP/CRL)
4. Extracts identity from certificate Subject/SAN

#### JWT Attestation

Agents present JWT tokens with OSSA-specific claims.

```yaml
attestation:
  type: jwt
  jwt_ref: ${env:OSSA_AGENT_TOKEN}
  trust_anchor: https://auth.acme.com/.well-known/jwks.json

  # Required JWT claims
  claims:
    iss: https://auth.acme.com
    sub: ossa:agent:acme:secure-agent:1.0.0
    aud: ossa-runtime
    ossa.agent.id: secure-agent
    ossa.agent.version: 1.0.0
```

**JWT Structure**:
```json
{
  "iss": "https://auth.acme.com",
  "sub": "ossa:agent:acme:secure-agent:1.0.0",
  "aud": "ossa-runtime",
  "exp": 1735747200,
  "iat": 1735660800,
  "ossa.agent.id": "secure-agent",
  "ossa.agent.version": "1.0.0",
  "ossa.agent.capabilities": ["code_review", "security_scan"]
}
```

#### SPIFFE SVID Attestation

Agents use SPIFFE Verifiable Identity Documents for zero-trust environments.

```yaml
attestation:
  type: spiffe
  spiffe_id: spiffe://acme.com/agent/secure-agent
  trust_bundle_ref: ${vault:spiffe/bundles/acme}

  workload_api:
    socket_path: unix:///run/spire/agent.sock
```

**SPIFFE Integration**:
- Agent retrieves X.509-SVID from SPIRE Workload API
- SVID contains SPIFFE ID matching agent URN
- Runtime validates against trust bundle

---

## Authentication Methods

OSSA supports multiple authentication methods for different deployment scenarios.

### mTLS (Mutual TLS)

**Use Case**: Service-to-service authentication, Kubernetes, SPIFFE

```yaml
authentication:
  methods:
    - mtls

  mtls:
    client_certificate_ref: ${vault:pki/agent-cert}
    client_key_ref: ${vault:pki/agent-key}
    ca_bundle_ref: ${vault:pki/ca-bundle}

    # Optional: TLS configuration
    min_tls_version: "1.3"
    cipher_suites:
      - TLS_AES_256_GCM_SHA384
      - TLS_CHACHA20_POLY1305_SHA256
```

**Workflow**:
1. Agent presents client certificate during TLS handshake
2. Runtime validates certificate against CA bundle
3. Runtime extracts identity from certificate Subject/SAN
4. Connection established with mutual authentication

### Bearer Token (JWT)

**Use Case**: API authentication, token-based flows

```yaml
authentication:
  methods:
    - jwt

  jwt:
    token_ref: ${vault:secret/agent-jwt}
    issuer: https://auth.acme.com
    audience: ossa-runtime

    # Optional: Token validation
    validation:
      require_expiration: true
      clock_skew_seconds: 300
      required_claims:
        - ossa.agent.id
        - ossa.agent.version
```

**Token Lifecycle**:
- **Issue**: Auth server issues JWT with OSSA claims
- **Present**: Agent includes JWT in `Authorization: Bearer <token>` header
- **Validate**: Runtime validates signature, expiration, claims
- **Rotate**: Agents refresh tokens before expiration

### OIDC (OpenID Connect)

**Use Case**: Federated identity, SSO integration

```yaml
authentication:
  methods:
    - oidc

  oidc:
    issuer: https://auth.acme.com
    client_id: ossa-agent-secure-agent
    client_secret_ref: ${vault:secret/oidc-client-secret}

    scopes:
      - openid
      - profile
      - ossa:agent

    # Optional: Discovery endpoint override
    discovery_url: https://auth.acme.com/.well-known/openid-configuration
```

**Flow**:
1. Agent initiates OIDC authorization code flow
2. User authenticates (if interactive) or client credentials grant
3. Agent exchanges code for ID token + access token
4. Runtime validates ID token signature and claims

### API Key

**Use Case**: Simple authentication, dev/testing environments

```yaml
authentication:
  methods:
    - api_key

  api_key:
    key_ref: ${vault:secret/api-key}
    header_name: X-OSSA-API-Key

    # Optional: Key properties
    scopes:
      - tools.read
      - tools.execute
    rate_limit:
      requests_per_minute: 100
```

**Security Considerations**:
- API keys MUST be scoped to specific capabilities
- API keys MUST be rotatable without downtime
- API keys SHOULD have expiration dates
- API keys MUST NOT be logged in plaintext

---

## Authorization Model

OSSA uses **Role-Based Access Control (RBAC)** with **Attribute-Based Access Control (ABAC)** extensions.

### RBAC Roles

#### Orchestrator

**Capabilities**: Full control over agent lifecycle and delegation

```yaml
authorization:
  rbac:
    role: orchestrator

    permissions:
      - agents.create
      - agents.delete
      - agents.delegate
      - tools.*
      - state.read
      - state.write
```

**Use Case**: Multi-agent orchestrators, workflow engines

#### Worker

**Capabilities**: Execute assigned tasks, read state, invoke tools

```yaml
authorization:
  rbac:
    role: worker

    permissions:
      - tools.read
      - tools.execute
      - state.read
      - state.write  # Own state only
```

**Use Case**: Specialized agents, task executors

#### Auditor

**Capabilities**: Read-only access for compliance and monitoring

```yaml
authorization:
  rbac:
    role: auditor

    permissions:
      - tools.read
      - state.read
      - audit.read
      - metrics.read
```

**Use Case**: Compliance agents, monitoring dashboards

### ABAC Attributes

Extend RBAC with context-aware policies.

```yaml
authorization:
  rbac:
    role: worker

  abac:
    attributes:
      - name: environment
        value: production
      - name: region
        value: us-east-1
      - name: compliance
        value: hipaa

    policies:
      - condition: environment == "production"
        effect: deny
        actions:
          - tools.delete

      - condition: compliance == "hipaa" && tool.type == "external_api"
        effect: allow
        actions:
          - tools.execute
        require_audit: true
```

### Policy Enforcement Points

Policies are enforced at multiple points:

1. **Startup**: Validate agent has required permissions
2. **Runtime**: Check policy before each operation
3. **Tool Invocation**: Enforce per-tool policies
4. **State Access**: Validate read/write permissions

```typescript
interface PolicyEnforcement {
  // Called before agent initialization
  validateStartup(manifest: AgentManifest): PolicyResult;

  // Called before each operation
  enforcePolicy(
    operation: Operation,
    context: SecurityContext
  ): boolean;

  // Called before tool invocation
  checkToolPolicy(
    tool: string,
    action: string,
    context: SecurityContext
  ): boolean;

  // Called before state access
  checkStatePolicy(
    key: string,
    operation: 'read' | 'write',
    context: SecurityContext
  ): boolean;
}
```

### Deny-by-Default

**CRITICAL**: OSSA runtimes MUST implement deny-by-default policies.

- If no policy allows an operation, it is **DENIED**
- Explicit deny ALWAYS overrides allow
- Permissions are additive (multiple roles accumulate)

```yaml
# Example: Default deny policy
authorization:
  default_policy: deny

  policies:
    - effect: allow
      actions:
        - tools.read
      resources:
        - gitlab-api
        - github-api

    - effect: deny
      actions:
        - tools.delete
      resources:
        - "*"  # Deny all deletions
```

---

## Secrets Management

**ABSOLUTE REQUIREMENT**: Secrets MUST NEVER be embedded in agent manifests.

### Prohibited

```yaml
# ❌ NEVER DO THIS
spec:
  tools:
    - name: gitlab-api
      type: http
      config:
        api_key: glpat-supersecretkey123  # NEVER embed secrets!
```

### Required

```yaml
# ✅ ALWAYS DO THIS
spec:
  tools:
    - name: gitlab-api
      type: http
      config:
        api_key_ref: ${vault:secret/gitlab/api-key}
```

### Secret Reference Syntax

Secrets are referenced using provider-specific URIs:

```
${<provider>:<path>[:<key>][?<options>]}
```

**Examples**:
- `${vault:secret/data/gitlab/api-key}`
- `${k8s:secrets/ossa-secrets:gitlab-token}`
- `${env:GITLAB_API_KEY}`
- `${aws:secretsmanager/gitlab-api-key}`
- `${azure:keyvault/gitlab-api-key}`

### Storage Options

#### HashiCorp Vault

```yaml
secrets:
  provider: vault
  config:
    address: https://vault.acme.com
    namespace: ossa-agents
    auth:
      method: kubernetes
      role: ossa-agent

    # Optional: TLS configuration
    tls:
      ca_cert_ref: ${file:/etc/vault/ca.crt}
      client_cert_ref: ${file:/etc/vault/client.crt}
      client_key_ref: ${file:/etc/vault/client.key}
```

**Reference Syntax**:
- KV v2: `${vault:secret/data/path/to/secret:key}`
- PKI: `${vault:pki/issue/agent-role:certificate}`
- Database: `${vault:database/creds/readonly:password}`

#### Kubernetes Secrets

```yaml
secrets:
  provider: kubernetes
  config:
    namespace: ossa-agents
    service_account: ossa-agent-sa
```

**Reference Syntax**:
- `${k8s:secrets/secret-name:key-name}`
- `${k8s:configmaps/config-name:key-name}`

#### Environment Variables

```yaml
secrets:
  provider: env
  config:
    allowed_prefixes:
      - OSSA_
      - AGENT_
```

**Reference Syntax**:
- `${env:OSSA_API_KEY}`
- `${env:AGENT_SECRET_TOKEN}`

**Security Note**: Environment variables are acceptable for dev/testing but NOT recommended for production.

#### AWS Secrets Manager

```yaml
secrets:
  provider: aws
  config:
    region: us-east-1
    auth:
      method: iam_role
      role_arn: arn:aws:iam::123456789012:role/ossa-agent
```

**Reference Syntax**:
- `${aws:secretsmanager/secret-name}`
- `${aws:secretsmanager/secret-name:version-id}`

#### Azure Key Vault

```yaml
secrets:
  provider: azure
  config:
    vault_url: https://ossa-vault.vault.azure.net
    auth:
      method: managed_identity
      client_id: 12345678-1234-1234-1234-123456789012
```

**Reference Syntax**:
- `${azure:keyvault/secret-name}`
- `${azure:keyvault/secret-name:version}`

### Secret Rotation Policy

Secrets MUST support rotation without agent restart.

```yaml
secrets:
  rotation:
    enabled: true
    check_interval: 300s  # Check every 5 minutes

    # Optional: Rotation notifications
    notification:
      webhook: https://alerts.acme.com/secret-rotated
```

**Rotation Flow**:
1. Secret updated in provider (Vault, K8s, etc.)
2. Agent detects change (polling or webhook)
3. Agent reloads secret value
4. Agent uses new secret for subsequent operations
5. Old secret remains valid for grace period

### Secret Lifecycle Events

Agents MUST emit audit events for secret operations:

```yaml
audit:
  events:
    - secret_accessed      # Secret read from provider
    - secret_rotated       # Secret value changed
    - secret_access_denied # Secret access failed
```

---

## Sandboxing Requirements

Agents MUST run in isolated execution environments with resource limits.

### Isolation Levels

#### Process Isolation

**Minimum viable isolation** for dev/testing.

```yaml
sandbox:
  isolation: process

  resources:
    memory: 256Mi
    cpu: 500m

  # Process-level restrictions
  restrictions:
    read_only_filesystem: false
    allow_network: true
    allow_ipc: false
```

**Mechanisms**: Process namespaces, resource limits (cgroups)

#### Container Isolation

**Recommended for production** deployments.

```yaml
sandbox:
  isolation: container

  resources:
    memory: 512Mi
    cpu: 1000m
    ephemeral_storage: 1Gi

  container:
    image: ossa-runtime:latest
    read_only_root: true
    allow_privilege_escalation: false
    run_as_non_root: true
    run_as_user: 1000

    seccomp_profile: runtime/default
    apparmor_profile: ossa-agent
```

**Mechanisms**: Docker, containerd, Podman

#### VM Isolation

**Maximum security** for untrusted agents.

```yaml
sandbox:
  isolation: vm

  resources:
    memory: 2Gi
    cpu: 2000m
    disk: 10Gi

  vm:
    hypervisor: firecracker
    kernel: vmlinux-5.10
    init: /sbin/init

    # Firecracker-specific config
    firecracker:
      vsock: true
      balloon: true
```

**Mechanisms**: Firecracker, gVisor, Kata Containers

### Resource Limits

All isolation levels MUST enforce resource limits.

```yaml
sandbox:
  resources:
    memory: 512Mi              # Max memory
    cpu: 1000m                 # Max CPU (1 core)
    ephemeral_storage: 1Gi     # Max disk usage

    # Optional: Request vs. limit (Kubernetes-style)
    requests:
      memory: 256Mi
      cpu: 500m

    limits:
      memory: 512Mi
      cpu: 1000m
```

**Enforcement**:
- **Memory**: OOM kill if exceeded
- **CPU**: Throttling if exceeded
- **Disk**: Write failure if exceeded

### Syscall Filtering

Restrict syscalls available to agent processes.

```yaml
sandbox:
  syscall_filter:
    default_action: SCMP_ACT_ERRNO

    allowed_syscalls:
      - read
      - write
      - open
      - close
      - stat
      - fstat
      - lstat
      - poll
      - mmap
      - munmap
      - brk
      - rt_sigaction
      - rt_sigprocmask
      - ioctl
      - socket
      - connect
      - sendto
      - recvfrom

    denied_syscalls:
      - ptrace     # Prevent debugging
      - reboot     # Prevent system reboot
      - kexec_load # Prevent kernel loading
```

**Mechanisms**: seccomp-bpf, AppArmor, SELinux

### Network Policy

Control network access with egress/ingress rules.

```yaml
sandbox:
  network:
    # Egress rules (outbound)
    egress:
      - protocol: https
        destinations:
          - api.github.com
          - api.gitlab.com
          - registry.npmjs.org
        ports:
          - 443

      - protocol: http
        destinations:
          - internal-api.acme.com
        ports:
          - 8080

    # Ingress rules (inbound)
    ingress:
      - protocol: http
        sources:
          - 10.0.0.0/8  # Internal network
        ports:
          - 8080

    # Default deny
    default_policy: deny
```

**Enforcement**:
- **iptables**: Linux firewall rules
- **Network Policies**: Kubernetes NetworkPolicy
- **DNS filtering**: Allowed domains only

### Filesystem Restrictions

Control filesystem access with read/write permissions.

```yaml
sandbox:
  filesystem:
    read_only_paths:
      - /usr
      - /lib
      - /lib64
      - /etc

    read_write_paths:
      - /tmp
      - /var/tmp
      - /workspace

    masked_paths:
      - /proc/kcore
      - /proc/latency_stats
      - /sys/firmware

    # Optional: Mount volumes
    volumes:
      - name: workspace
        path: /workspace
        read_only: false
        size: 1Gi
```

---

## Audit Logging

All security-relevant events MUST be logged in **OpenTelemetry-compatible format**.

### Required Events

| Event Type | Description | Required Attributes |
|------------|-------------|---------------------|
| `agent_started` | Agent initialization | `ossa.agent.id`, `ossa.instance.id`, `security.identity.urn` |
| `agent_stopped` | Agent shutdown | `ossa.agent.id`, `ossa.instance.id`, `shutdown_reason` |
| `capability_invoked` | Tool/capability execution | `ossa.capability.name`, `ossa.tool.name`, `security.user.id` |
| `secret_accessed` | Secret retrieved | `secret.provider`, `secret.path`, `access_result` |
| `secret_rotated` | Secret value changed | `secret.provider`, `secret.path`, `rotation_trigger` |
| `policy_violation` | Authorization denied | `policy.id`, `policy.effect`, `violation_reason` |
| `authentication_success` | Auth succeeded | `auth.method`, `auth.principal`, `auth.source_ip` |
| `authentication_failure` | Auth failed | `auth.method`, `auth.principal`, `auth.failure_reason` |
| `authorization_denied` | Authz failed | `authz.action`, `authz.resource`, `authz.principal` |
| `network_connection` | External network call | `network.peer.address`, `network.protocol`, `network.status` |

### Log Format

Audit logs MUST be structured as OpenTelemetry log records.

```json
{
  "timestamp": "2025-12-04T15:30:00.000Z",
  "severity_text": "INFO",
  "severity_number": 9,
  "body": "Capability invoked",
  "attributes": {
    "event.name": "capability_invoked",
    "ossa.agent.id": "secure-agent",
    "ossa.agent.version": "1.0.0",
    "ossa.instance.id": "550e8400-e29b-41d4-a716-446655440000",
    "ossa.session.id": "abc123",
    "ossa.capability.name": "code_review",
    "ossa.tool.name": "gitlab-api",
    "security.user.id": "alice@acme.com",
    "security.source_ip": "192.168.1.100"
  },
  "resource": {
    "service.name": "ossa-runtime",
    "service.version": "0.2.9",
    "deployment.environment": "production"
  },
  "trace_id": "5b8aa5a2d2c872e8321cf37308d69df2",
  "span_id": "051581bf3cb55c13"
}
```

### Retention and Immutability

Audit logs MUST be:

1. **Immutable**: Write-once, tamper-evident storage
2. **Retained**: Per compliance requirements (7 years for FedRAMP)
3. **Encrypted**: At-rest encryption with key rotation
4. **Searchable**: Indexed for compliance queries

```yaml
audit:
  enabled: true

  retention:
    days: 2555  # 7 years
    immutable: true

  storage:
    backend: elasticsearch
    encryption:
      enabled: true
      algorithm: AES-256-GCM
      key_ref: ${vault:secret/audit-encryption-key}

    index_pattern: ossa-audit-logs-%{+YYYY.MM.dd}

  events:
    - agent_started
    - agent_stopped
    - capability_invoked
    - secret_accessed
    - secret_rotated
    - policy_violation
    - authentication_success
    - authentication_failure
    - authorization_denied
    - network_connection
```

### OpenTelemetry Integration

Export audit logs using OpenTelemetry Log Exporter.

```typescript
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

const logExporter = new OTLPLogExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/logs',
  headers: {
    'Authorization': `Bearer ${process.env.OTEL_API_KEY}`
  }
});

const loggerProvider = new LoggerProvider();
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

const logger = loggerProvider.getLogger('ossa-security-audit', '0.2.9');

// Emit audit event
logger.emit({
  severityText: 'INFO',
  body: 'Capability invoked',
  attributes: {
    'event.name': 'capability_invoked',
    'ossa.agent.id': manifest.metadata.name,
    'ossa.capability.name': capability.name,
    'security.user.id': context.userId
  }
});
```

---

## Security Best Practices

### 1. Principle of Least Privilege

Agents SHOULD request minimum permissions required.

```yaml
# ❌ Bad: Request all permissions
authorization:
  rbac:
    role: orchestrator  # Too broad

# ✅ Good: Request specific permissions
authorization:
  rbac:
    role: worker
  policies:
    - allow: tools.execute
      resources:
        - gitlab-api
```

### 2. Defense in Depth

Layer multiple security controls.

```yaml
security:
  # Layer 1: Identity
  identity:
    urn: ossa:agent:acme:secure-agent:1.0.0
    attestation:
      type: x509

  # Layer 2: Authentication
  authentication:
    methods:
      - mtls

  # Layer 3: Authorization
  authorization:
    rbac:
      role: worker

  # Layer 4: Sandboxing
  sandbox:
    isolation: container

  # Layer 5: Network isolation
  network:
    egress:
      - https://api.gitlab.com

  # Layer 6: Audit
  audit:
    enabled: true
```

### 3. Secrets Hygiene

- **NEVER** commit secrets to version control
- **ALWAYS** use secret references
- **ROTATE** secrets regularly
- **LIMIT** secret access to minimum required agents

### 4. Audit Everything

Enable comprehensive audit logging.

```yaml
audit:
  enabled: true
  events:
    - agent_started
    - agent_stopped
    - capability_invoked
    - secret_accessed
    - policy_violation
    - authentication_success
    - authentication_failure
    - authorization_denied
```

### 5. Compliance Mapping

Map security controls to compliance frameworks.

```yaml
metadata:
  annotations:
    compliance.ossa.io/fedramp: AC-2,AC-3,AU-2,AU-9,SC-8,SC-13
    compliance.ossa.io/soc2: CC6.1,CC6.2,C1.1
    compliance.ossa.io/hipaa: 164.308(a)(3),164.312(a)(1),164.312(e)(1)
```

See [compliance-profiles.md](./compliance-profiles.md) for full control mappings.

---

## TypeScript Types

```typescript
export interface SecuritySpec {
  identity: AgentIdentity;
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  secrets?: SecretsConfig;
  sandbox: SandboxConfig;
  audit: AuditConfig;
}

export interface AgentIdentity {
  urn: string;  // ossa:agent:<org>:<name>:<version>
  attestation: AttestationConfig;
  labels?: Record<string, string>;
}

export interface AttestationConfig {
  type: 'x509' | 'jwt' | 'spiffe';
  certificate_ref?: string;
  jwt_ref?: string;
  trust_anchor: string;
  validation?: ValidationRules;
}

export interface AuthenticationConfig {
  methods: ('mtls' | 'jwt' | 'oidc' | 'api_key')[];
  mtls?: MutualTLSConfig;
  jwt?: JWTConfig;
  oidc?: OIDCConfig;
  api_key?: APIKeyConfig;
}

export interface AuthorizationConfig {
  rbac: RBACConfig;
  abac?: ABACConfig;
  policies?: Policy[];
  default_policy?: 'allow' | 'deny';
}

export interface RBACConfig {
  role: 'orchestrator' | 'worker' | 'auditor';
  permissions?: string[];
}

export interface SandboxConfig {
  isolation: 'process' | 'container' | 'vm';
  resources: ResourceLimits;
  network?: NetworkPolicy;
  filesystem?: FilesystemPolicy;
  syscall_filter?: SyscallFilter;
}

export interface ResourceLimits {
  memory: string;      // e.g., "512Mi"
  cpu: string;         // e.g., "1000m"
  ephemeral_storage?: string;
}

export interface AuditConfig {
  enabled: boolean;
  events: AuditEvent[];
  retention?: RetentionPolicy;
  storage?: StorageConfig;
}

export type AuditEvent =
  | 'agent_started'
  | 'agent_stopped'
  | 'capability_invoked'
  | 'secret_accessed'
  | 'secret_rotated'
  | 'policy_violation'
  | 'authentication_success'
  | 'authentication_failure'
  | 'authorization_denied'
  | 'network_connection';
```

---

## Validation CLI

```bash
# Validate security configuration
ossa validate --security manifest.yaml

# Check RBAC permissions
ossa rbac check --agent secure-agent --action tools.execute

# Test secret references
ossa secrets test manifest.yaml

# Audit log query
ossa audit query --event capability_invoked --since 1h

# Generate security report
ossa security-report --format pdf manifest.yaml
```

---

## Runtime Enforcement Pseudo-Code

```typescript
class OSSASecurityRuntime {
  async validateAgent(manifest: AgentManifest): Promise<void> {
    // 1. Validate identity
    await this.validateIdentity(manifest.spec.security.identity);

    // 2. Authenticate agent
    await this.authenticate(manifest.spec.security.authentication);

    // 3. Authorize startup
    await this.authorize(manifest.spec.security.authorization);

    // 4. Initialize sandbox
    await this.initializeSandbox(manifest.spec.security.sandbox);

    // 5. Setup audit logging
    await this.initializeAudit(manifest.spec.security.audit);
  }

  async executeCapability(
    capability: string,
    context: SecurityContext
  ): Promise<void> {
    // 1. Check authorization
    if (!this.isAuthorized(capability, context)) {
      await this.auditEvent('authorization_denied', { capability, context });
      throw new AuthorizationError('Access denied');
    }

    // 2. Audit invocation
    await this.auditEvent('capability_invoked', { capability, context });

    // 3. Execute with sandbox
    try {
      await this.sandbox.execute(capability, context);
    } catch (error) {
      await this.auditEvent('capability_failed', { capability, error });
      throw error;
    }
  }

  async accessSecret(secretRef: string): Promise<string> {
    // 1. Parse secret reference
    const { provider, path } = this.parseSecretRef(secretRef);

    // 2. Check authorization
    if (!this.isAuthorized(`secrets.read.${provider}`, context)) {
      await this.auditEvent('secret_access_denied', { secretRef });
      throw new AuthorizationError('Secret access denied');
    }

    // 3. Retrieve secret
    const value = await this.secretsProvider.get(provider, path);

    // 4. Audit access
    await this.auditEvent('secret_accessed', { provider, path });

    return value;
  }
}
```

---

## References

- [SPIFFE/SPIRE](https://spiffe.io/) - Zero-trust identity framework
- [NIST SP 800-204](https://csrc.nist.gov/publications/detail/sp/800-204/final) - Security Strategies for Microservices
- [OpenTelemetry Logs](https://opentelemetry.io/docs/specs/otel/logs/) - Log data model
- [seccomp-bpf](https://www.kernel.org/doc/html/latest/userspace-api/seccomp_filter.html) - Syscall filtering
- [OSSA Compliance Profiles](./compliance-profiles.md) - Framework mappings
- [OSSA Semantic Conventions](./semantic-conventions.md) - Observability attributes
