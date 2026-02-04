# OSSA Agent Security Guide

**Security best practices, hardening, and compliance for production agent deployments**

---

## Table of Contents

- [Security Principles](#security-principles)
- [Authentication & Authorization](#authentication--authorization)
- [Secret Management](#secret-management)
- [Network Security](#network-security)
- [Container Security](#container-security)
- [API Security](#api-security)
- [Data Protection](#data-protection)
- [Compliance](#compliance)
- [Security Monitoring](#security-monitoring)
- [Incident Response](#incident-response)
- [Security Checklist](#security-checklist)

---

## Security Principles

### Defense in Depth

Implement multiple layers of security:

1. **Network Layer**: Firewalls, VPNs, private networks
2. **Application Layer**: Authentication, authorization, input validation
3. **Data Layer**: Encryption at rest and in transit
4. **Infrastructure Layer**: Container security, OS hardening
5. **Monitoring Layer**: Logging, alerting, anomaly detection

### Principle of Least Privilege

- Grant minimum necessary permissions
- Use service accounts with limited scope
- Implement role-based access control (RBAC)
- Regular access reviews

### Security by Design

- Security requirements in early design
- Threat modeling before implementation
- Security testing in CI/CD pipeline
- Regular security audits

---

## Authentication & Authorization

### API Authentication

**Option 1: API Keys** (Simple)

```javascript
// Request header
Authorization: Bearer YOUR_API_KEY

// Implementation
app.use((req, res, next) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  if (!isValidApiKey(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

**Option 2: JWT Tokens** (Recommended)

```javascript
// Request header
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Implementation
const jwt = require('jsonwebtoken');

app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});
```

**Option 3: OAuth 2.0** (Enterprise)

```javascript
// Use OAuth 2.0 provider (Auth0, Okta, Keycloak)
const { auth } = require('express-oauth2-jwt-bearer');

const checkJwt = auth({
  audience: 'https://api.example.com',
  issuerBaseURL: 'https://example.auth0.com/',
});

app.use('/api', checkJwt);
```

### Authorization (RBAC)

```javascript
// Define roles and permissions
const permissions = {
  admin: ['read', 'write', 'delete', 'manage'],
  editor: ['read', 'write'],
  viewer: ['read'],
};

// Authorization middleware
function requirePermission(permission) {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (!permissions[userRole]?.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
app.post('/api/tasks', requirePermission('write'), createTask);
app.delete('/api/tasks/:id', requirePermission('delete'), deleteTask);
```

### Kubernetes RBAC

```yaml
# service-account.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: agent-service-account
  namespace: production

---
# role.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: agent-role
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]

---
# rolebinding.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: agent-rolebinding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: agent-service-account
roleRef:
  kind: Role
  name: agent-role
  apiGroup: rbac.authorization.k8s.io
```

---

## Secret Management

### Never Commit Secrets

**.gitignore**:

```
# Environment files
.env
.env.local
.env.production

# Secret files
secrets/
*.key
*.pem
credentials.json

# Config with secrets
config.production.json
```

### Environment Variables

**Good**:

```bash
# Set via platform
kubectl create secret generic agent-secrets \
  --from-literal=api-key=xxx \
  --from-literal=database-url=postgresql://...
```

**Bad**:

```bash
# Never hardcode
export API_KEY=hardcoded-key-here
```

### Kubernetes Secrets

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: agent-secrets
  namespace: production
type: Opaque
stringData:
  database-url: postgresql://user:pass@db:5432/agents
  api-key: your-api-key-here
  jwt-secret: your-jwt-secret-here
```

**Use in Deployment**:

```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: agent-secrets
        key: database-url
  - name: API_KEY
    valueFrom:
      secretKeyRef:
        name: agent-secrets
        key: api-key
```

### External Secret Management

**Sealed Secrets** (Kubernetes):

```bash
# Install Sealed Secrets
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Create sealed secret
kubeseal --format=yaml < secrets.yaml > sealed-secrets.yaml

# Commit sealed secret (safe)
git add sealed-secrets.yaml
git commit -m "Add sealed secrets"
```

**HashiCorp Vault**:

```javascript
// Fetch secrets from Vault
const vault = require('node-vault')({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

const secrets = await vault.read('secret/data/agent');
process.env.DATABASE_URL = secrets.data.data.database_url;
```

**Cloud Secret Managers**:

```bash
# AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id agent/database-url

# GCP Secret Manager
gcloud secrets versions access latest --secret="database-url"

# Azure Key Vault
az keyvault secret show --vault-name my-vault --name database-url
```

---

## Network Security

### HTTPS/TLS

**Always Use HTTPS**:

```yaml
# Kubernetes Ingress with TLS
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: agent-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - my-agent.example.com
      secretName: agent-tls
  rules:
    - host: my-agent.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-agent
                port:
                  number: 80
```

**Force HTTPS Redirect**:

```javascript
// Express middleware
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }
  next();
});
```

### Network Policies (Kubernetes)

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: agent-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: my-agent
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # Allow from ingress controller
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
  egress:
    # Allow to database
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    # Allow to Redis
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
    # Allow DNS
    - to:
        - namespaceSelector:
            matchLabels:
              name: kube-system
      ports:
        - protocol: UDP
          port: 53
    # Allow HTTPS egress
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 443
```

### Firewall Rules

```bash
# Allow only necessary ports
# HTTP: 80
# HTTPS: 443
# Metrics: 9090 (internal only)
# Health: 3000 (load balancer only)

# Example: GCP firewall rule
gcloud compute firewall-rules create allow-agent-https \
  --allow tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --target-tags agent-server
```

### Private Networking

```bash
# Railway private networking
railway link

# Fly.io private network (6PN)
fly ips private

# Kubernetes internal services
# Use ClusterIP (not LoadBalancer) for internal services
```

---

## Container Security

### Use Official Base Images

```dockerfile
# Good: Official Node.js image
FROM node:18-alpine

# Bad: Random image from Docker Hub
FROM someuser/nodejs
```

### Run as Non-Root User

```dockerfile
# Create user
RUN addgroup -g 1000 agent && \
    adduser -D -u 1000 -G agent agent

# Switch to user
USER agent

# Verify
RUN whoami  # Should output: agent
```

### Multi-Stage Builds

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
RUN addgroup -g 1000 agent && \
    adduser -D -u 1000 -G agent agent
WORKDIR /app
COPY --from=builder --chown=agent:agent /app/dist ./dist
COPY --from=builder --chown=agent:agent /app/node_modules ./node_modules
USER agent
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Scan for Vulnerabilities

```bash
# Trivy
trivy image my-agent:latest

# Snyk
snyk container test my-agent:latest

# Docker Scout
docker scout cves my-agent:latest
```

### Security Context (Kubernetes)

```yaml
securityContext:
  # Pod-level security
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
  seccompProfile:
    type: RuntimeDefault

containers:
  - name: agent
    securityContext:
      # Container-level security
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
          - ALL
    volumeMounts:
      # Writable tmp directory
      - name: tmp
        mountPath: /tmp

volumes:
  - name: tmp
    emptyDir: {}
```

### Image Signing

```bash
# Sign image with Cosign
cosign sign --key cosign.key my-registry.com/my-agent:latest

# Verify signature
cosign verify --key cosign.pub my-registry.com/my-agent:latest
```

---

## API Security

### Input Validation

```javascript
const Joi = require('joi');

// Define schema
const taskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000),
  priority: Joi.string().valid('low', 'medium', 'high'),
  dueDate: Joi.date().iso(),
});

// Validate input
app.post('/api/tasks', (req, res) => {
  const { error, value } = taskSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  // Process validated input
  createTask(value);
});
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// Global rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});

app.use('/api', limiter);

// Endpoint-specific rate limit
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
});

app.post('/api/tasks', createLimiter, createTask);
```

### CORS Configuration

```javascript
const cors = require('cors');

// Restrictive CORS (recommended)
app.use(cors({
  origin: ['https://example.com', 'https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Development only
if (process.env.NODE_ENV === 'development') {
  app.use(cors({ origin: '*' }));
}
```

### Security Headers

```javascript
const helmet = require('helmet');

// Use Helmet for security headers
app.use(helmet());

// Custom headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

### SQL Injection Prevention

```javascript
// Good: Parameterized queries
const result = await db.query(
  'SELECT * FROM tasks WHERE user_id = $1 AND status = $2',
  [userId, status]
);

// Bad: String concatenation
const result = await db.query(
  `SELECT * FROM tasks WHERE user_id = '${userId}'` // VULNERABLE!
);
```

### API Versioning

```javascript
// URL versioning
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// Header versioning
app.use((req, res, next) => {
  const version = req.header('API-Version') || '1';
  req.apiVersion = version;
  next();
});
```

---

## Data Protection

### Encryption at Rest

**Database Encryption**:

```bash
# PostgreSQL
# Enable at database creation
CREATE DATABASE agents WITH ENCRYPTION;

# Or use cloud-managed encryption
# AWS RDS: Enable encryption in console
# GCP Cloud SQL: Enable encryption in console
# Azure Database: Enable encryption in portal
```

**Volume Encryption**:

```yaml
# Kubernetes encrypted volume
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: agent-data
spec:
  storageClassName: encrypted-ssd
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### Encryption in Transit

```javascript
// Database connection with SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
  },
});

// Redis connection with TLS
const redis = new Redis({
  host: 'redis.example.com',
  port: 6380,
  tls: {
    ca: fs.readFileSync('/path/to/ca-certificate.crt'),
  },
});
```

### Data Sanitization

```javascript
// Sanitize user input
const sanitize = require('sanitize-html');

const cleanInput = sanitize(userInput, {
  allowedTags: [],
  allowedAttributes: {},
});

// Remove sensitive data from logs
function sanitizeLog(data) {
  const sanitized = { ...data };
  delete sanitized.password;
  delete sanitized.api_key;
  delete sanitized.token;
  return sanitized;
}

logger.info('User action', sanitizeLog(userData));
```

### PII Protection

```javascript
// Mask sensitive data
function maskEmail(email) {
  const [name, domain] = email.split('@');
  return `${name[0]}***@${domain}`;
}

function maskCreditCard(card) {
  return `****-****-****-${card.slice(-4)}`;
}

// Encrypt PII before storage
const crypto = require('crypto');

function encryptPII(data) {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

---

## Compliance

### GDPR Compliance

**Data Subject Rights**:

```javascript
// Right to access
app.get('/api/user/data', authenticate, async (req, res) => {
  const userData = await getUserData(req.user.id);
  res.json(userData);
});

// Right to deletion
app.delete('/api/user/account', authenticate, async (req, res) => {
  await deleteUserData(req.user.id);
  res.json({ message: 'Account deleted' });
});

// Right to data portability
app.get('/api/user/export', authenticate, async (req, res) => {
  const data = await exportUserData(req.user.id);
  res.attachment('user-data.json');
  res.json(data);
});
```

**Consent Management**:

```javascript
// Track consent
await db.query(
  'INSERT INTO consents (user_id, purpose, granted_at) VALUES ($1, $2, NOW())',
  [userId, 'marketing']
);

// Check consent
const hasConsent = await checkConsent(userId, 'marketing');
if (!hasConsent) {
  throw new Error('User has not consented to marketing');
}
```

### SOC 2 Compliance

**Audit Logging**:

```javascript
// Log all access
function auditLog(action, userId, resource, details) {
  logger.info('Audit log', {
    timestamp: new Date().toISOString(),
    action,
    user_id: userId,
    resource,
    details,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
  });
}

// Usage
auditLog('READ', userId, 'task:123', { query: 'SELECT * FROM tasks' });
```

**Access Control Logs**:

```javascript
// Log authentication attempts
app.post('/auth/login', (req, res) => {
  const success = authenticate(req.body);

  logger.info('Authentication attempt', {
    email: req.body.email,
    success,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  if (!success) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate token
});
```

### HIPAA Compliance

**Access Controls**:

```javascript
// Role-based access for PHI
function requireHIPAAAccess(req, res, next) {
  if (!req.user.roles.includes('healthcare_provider')) {
    auditLog('UNAUTHORIZED_ACCESS_ATTEMPT', req.user.id, 'PHI');
    return res.status(403).json({ error: 'HIPAA access required' });
  }
  next();
}

app.get('/api/patient/:id', requireHIPAAAccess, getPatient);
```

**Encryption**:

```javascript
// Encrypt PHI
function encryptPHI(data) {
  // Use AES-256 encryption
  const cipher = crypto.createCipher('aes-256-gcm', process.env.HIPAA_KEY);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

---

## Security Monitoring

### Security Event Logging

```javascript
// Log security events
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
  ],
});

// Examples
securityLogger.warn('Failed login attempt', {
  email: req.body.email,
  ip: req.ip,
  attempts: failedAttempts,
});

securityLogger.error('Unauthorized access attempt', {
  user_id: req.user?.id,
  resource: req.path,
  method: req.method,
});
```

### Intrusion Detection

```yaml
# Falco rules for Kubernetes
- rule: Unauthorized Process
  desc: Detect unauthorized process execution
  condition: >
    spawned_process and
    container and
    container.image.repository = "my-agent" and
    not proc.name in (node, npm)
  output: >
    Unauthorized process in container
    (user=%user.name command=%proc.cmdline container=%container.name)
  priority: WARNING
```

### Vulnerability Scanning

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: my-agent:latest
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## Incident Response

### Security Incident Response Plan

1. **Detection**: Automated alerts or user reports
2. **Containment**: Isolate affected systems
3. **Eradication**: Remove threat, patch vulnerability
4. **Recovery**: Restore normal operations
5. **Lessons Learned**: Post-incident review

### Immediate Response Actions

```bash
# Compromise detected - immediate actions

# 1. Rotate all credentials immediately
kubectl delete secret agent-secrets
kubectl create secret generic agent-secrets \
  --from-literal=api-key=NEW_KEY \
  --from-literal=database-url=NEW_URL

# 2. Revoke all active sessions
redis-cli FLUSHDB

# 3. Scale down affected pods
kubectl scale deployment my-agent --replicas=0

# 4. Review logs for unauthorized access
kubectl logs -l app=my-agent --since=24h | grep "401\|403\|500"

# 5. Enable maintenance mode
kubectl set env deployment/my-agent MAINTENANCE_MODE=true

# 6. Notify team
# Send alerts via PagerDuty/Slack

# 7. Preserve evidence
kubectl logs -l app=my-agent --since=48h > incident-logs.txt
```

### Post-Incident Actions

```bash
# After incident resolution

# 1. Deploy patched version
kubectl set image deployment/my-agent agent=my-agent:patched

# 2. Verify security controls
# Run security audit
# Review access logs
# Check for lateral movement

# 3. Document incident
# Create post-mortem report
# Update runbooks
# Share lessons learned

# 4. Implement preventive measures
# Update security policies
# Add new alerts
# Conduct security training
```

---

## Security Checklist

### Pre-Deployment

- [ ] Secrets stored securely (not in code)
- [ ] HTTPS/TLS enforced
- [ ] Authentication implemented
- [ ] Authorization (RBAC) configured
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Container runs as non-root
- [ ] Image scanned for vulnerabilities
- [ ] Network policies defined (Kubernetes)
- [ ] Security context configured (Kubernetes)
- [ ] Audit logging enabled
- [ ] Monitoring and alerting configured

### Post-Deployment

- [ ] Penetration testing completed
- [ ] Security audit passed
- [ ] Backup and recovery tested
- [ ] Incident response plan documented
- [ ] Security monitoring active
- [ ] Compliance requirements met
- [ ] Documentation updated
- [ ] Team trained on security procedures

### Ongoing

- [ ] Weekly: Review security logs
- [ ] Weekly: Check for vulnerabilities
- [ ] Monthly: Rotate credentials
- [ ] Monthly: Security training
- [ ] Quarterly: Security audit
- [ ] Quarterly: Penetration testing
- [ ] Yearly: Compliance review

---

## Security Resources

### Tools

- **Trivy**: Container vulnerability scanning
- **Snyk**: Dependency vulnerability scanning
- **Falco**: Runtime security monitoring
- **Vault**: Secret management
- **cert-manager**: Automated certificate management
- **OWASP ZAP**: Web application security testing

### Standards & Frameworks

- **OWASP Top 10**: Web application security risks
- **CIS Benchmarks**: Security configuration guidelines
- **NIST Cybersecurity Framework**: Security best practices
- **ISO 27001**: Information security management
- **SOC 2**: Service organization controls

### Further Reading

- [OWASP Security Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## Next Steps

- **[Operations Guide](./DEPLOYMENT_OPERATIONS.md)** - Monitoring and troubleshooting
- **[Platform Guide](./DEPLOYMENT_PLATFORMS.md)** - Platform-specific deployment
- **[Architecture Guide](./DEPLOYMENT_ARCHITECTURE.md)** - Reference architectures
- **[FAQ](./DEPLOYMENT_FAQ.md)** - Common questions

---

**Last Updated**: 2026-02-04
