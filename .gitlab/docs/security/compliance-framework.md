# Security & Compliance Framework

Comprehensive security model and compliance mappings for OSSA agents in regulated environments.

## Security Model

### Defense in Depth

```
┌─────────────────────────────────────────┐
│  Layer 1: Network Security             │
│  - Firewalls, Network Policies          │
├─────────────────────────────────────────┤
│  Layer 2: Authentication                │
│  - API Keys, OAuth, mTLS                │
├─────────────────────────────────────────┤
│  Layer 3: Authorization                 │
│  - RBAC, ABAC, Policy Engine            │
├─────────────────────────────────────────┤
│  Layer 4: Data Protection               │
│  - Encryption, Tokenization             │
├─────────────────────────────────────────┤
│  Layer 5: Audit & Monitoring            │
│  - Logging, Alerting, SIEM              │
└─────────────────────────────────────────┘
```

## Authentication Methods

### 1. API Key Authentication

```typescript
// api-key-auth.ts
export class APIKeyAuth {
  async validate(apiKey: string): Promise<boolean> {
    const hash = await this.hashKey(apiKey);
    const stored = await this.getStoredKey(hash);
    
    if (!stored || stored.revoked) {
      return false;
    }
    
    // Check expiration
    if (stored.expiresAt < Date.now()) {
      return false;
    }
    
    // Rate limiting
    await this.checkRateLimit(stored.userId);
    
    return true;
  }
}
```

### 2. OAuth 2.0

```typescript
// oauth-config.ts
export const oauthConfig = {
  authorizationURL: 'https://auth.company.com/oauth/authorize',
  tokenURL: 'https://auth.company.com/oauth/token',
  clientID: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  scope: ['ossa:read', 'ossa:write', 'ossa:admin'],
};
```

### 3. Mutual TLS (mTLS)

```yaml
# mtls-config.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ossa-mtls-certs
type: kubernetes.io/tls
data:
  ca.crt: <base64-encoded-ca-cert>
  tls.crt: <base64-encoded-client-cert>
  tls.key: <base64-encoded-client-key>
```

## Authorization

### Role-Based Access Control (RBAC)

```typescript
// rbac.ts
export enum Role {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

export const permissions = {
  [Role.ADMIN]: ['*'],
  [Role.OPERATOR]: [
    'agent:read',
    'agent:write',
    'capability:invoke',
  ],
  [Role.VIEWER]: [
    'agent:read',
  ],
};
```

### Attribute-Based Access Control (ABAC)

```typescript
// abac-policy.ts
export interface Policy {
  subject: {
    role: string;
    department: string;
  };
  resource: {
    type: string;
    classification: string;
  };
  action: string;
  environment: {
    time: string;
    location: string;
  };
}

export function evaluatePolicy(policy: Policy): boolean {
  // Policy evaluation logic
  return (
    policy.subject.role === 'admin' ||
    (policy.resource.classification === 'public' &&
     policy.action === 'read')
  );
}
```

## Data Protection

### Encryption at Rest

```typescript
// encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class DataEncryption {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  encrypt(data: string): EncryptedData {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }
}
```

### Encryption in Transit

```yaml
# tls-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: tls-config
data:
  tls.conf: |
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
```

### Data Masking

```typescript
// masking.ts
export function maskPII(data: any): any {
  const masked = { ...data };
  
  // Mask email
  if (masked.email) {
    masked.email = masked.email.replace(/(.{2}).*(@.*)/, '$1***$2');
  }
  
  // Mask phone
  if (masked.phone) {
    masked.phone = masked.phone.replace(/\d(?=\d{4})/g, '*');
  }
  
  // Mask SSN
  if (masked.ssn) {
    masked.ssn = masked.ssn.replace(/\d(?=\d{4})/g, '*');
  }
  
  return masked;
}
```

## Compliance Mappings

### SOC 2 Type II

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| CC6.1 | Logical access controls | RBAC, API keys, OAuth |
| CC6.6 | Encryption | TLS 1.3, AES-256-GCM |
| CC6.7 | System operations | Audit logging, monitoring |
| CC7.2 | System monitoring | Prometheus, alerts |
| CC8.1 | Change management | GitLab CI/CD, approvals |

### FedRAMP Moderate

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| AC-2 | Account Management | User provisioning, deprovisioning |
| AC-3 | Access Enforcement | RBAC policies |
| AU-2 | Audit Events | Comprehensive audit logging |
| AU-3 | Audit Record Content | Structured logs with metadata |
| IA-2 | Identification & Authentication | MFA, OAuth 2.0 |
| SC-7 | Boundary Protection | Network policies, firewalls |
| SC-8 | Transmission Confidentiality | TLS 1.3 |
| SC-13 | Cryptographic Protection | FIPS 140-2 validated modules |
| SI-4 | Information System Monitoring | SIEM integration |

### HIPAA

| Requirement | Implementation |
|-------------|----------------|
| §164.308(a)(3) | Workforce Security | Role-based access, training |
| §164.308(a)(4) | Information Access Management | RBAC, audit logs |
| §164.312(a)(1) | Access Control | Unique user IDs, emergency access |
| §164.312(a)(2)(i) | Encryption | AES-256, TLS 1.3 |
| §164.312(b) | Audit Controls | Comprehensive logging |
| §164.312(c)(1) | Integrity | Hash verification, digital signatures |
| §164.312(d) | Person/Entity Authentication | MFA, certificates |
| §164.312(e)(1) | Transmission Security | TLS, VPN |

### GDPR

| Article | Requirement | Implementation |
|---------|-------------|----------------|
| Art. 5 | Data Minimization | Collect only necessary data |
| Art. 17 | Right to Erasure | Data deletion APIs |
| Art. 25 | Data Protection by Design | Privacy-first architecture |
| Art. 32 | Security of Processing | Encryption, access controls |
| Art. 33 | Breach Notification | Incident response plan |

## Security Controls

### Input Validation

```typescript
// validation.ts
import { z } from 'zod';

export const AgentRequestSchema = z.object({
  capability: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/),
  parameters: z.record(z.unknown()).optional(),
  timeout: z.number().min(1).max(300).optional(),
});

export function validateInput(data: unknown) {
  return AgentRequestSchema.parse(data);
}
```

### Rate Limiting

```typescript
// rate-limiter.ts
import { RateLimiterRedis } from 'rate-limiter-flexible';

export const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'ossa_rl',
  points: 100, // requests
  duration: 60, // per 60 seconds
  blockDuration: 60, // block for 60 seconds if exceeded
});
```

### SQL Injection Prevention

```typescript
// Use parameterized queries
const result = await db.query(
  'SELECT * FROM agents WHERE id = $1',
  [agentId]
);
```

### XSS Prevention

```typescript
// Sanitize output
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
  });
}
```

## Incident Response

### Incident Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| P0 | Data breach, system compromise | Immediate |
| P1 | Service outage, security vulnerability | 1 hour |
| P2 | Degraded performance | 4 hours |
| P3 | Minor issues | 24 hours |

### Response Procedures

1. **Detection**: Automated alerts, user reports
2. **Containment**: Isolate affected systems
3. **Eradication**: Remove threat, patch vulnerabilities
4. **Recovery**: Restore services, verify integrity
5. **Post-Incident**: Review, document, improve

## Audit Requirements

### Audit Log Format

```json
{
  "timestamp": "2025-11-26T13:41:49.854Z",
  "event_type": "authentication",
  "user_id": "user-123",
  "ip_address": "192.168.1.100",
  "action": "login",
  "result": "success",
  "resource": "ossa-agent",
  "metadata": {
    "user_agent": "Mozilla/5.0...",
    "session_id": "sess-456"
  }
}
```

### Retention Requirements

- **Authentication logs**: 1 year
- **Authorization logs**: 1 year
- **Data access logs**: 7 years (HIPAA)
- **Configuration changes**: 7 years

## Penetration Testing

### Annual Testing Requirements

- External penetration test
- Internal vulnerability assessment
- Social engineering assessment
- Physical security review

### Remediation Timeline

| Severity | Remediation Deadline |
|----------|---------------------|
| Critical | 7 days |
| High | 30 days |
| Medium | 90 days |
| Low | 180 days |

## Security Checklist

### Pre-Deployment
- [ ] Security scan completed (SAST, DAST)
- [ ] Dependencies scanned for vulnerabilities
- [ ] Secrets rotated
- [ ] TLS certificates valid
- [ ] Firewall rules configured
- [ ] Audit logging enabled

### Post-Deployment
- [ ] Penetration test scheduled
- [ ] Incident response plan tested
- [ ] Security training completed
- [ ] Compliance audit passed

## References

- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Controls](https://www.cisecurity.org/controls)
- [SOC 2 Requirements](https://www.aicpa.org/soc)
