# Getting Started with OSSA 1.0

**OSSA: The OpenAPI for AI Agents**

---

## What is OSSA?

OSSA (Open Standard for Smart & Scalable Agents) is a formal specification for defining AI agents - similar to what OpenAPI is for REST APIs.

**Key Benefits:**

-  Standard agent definition format
-  Cloud-agnostic (Docker, K8s, local, serverless)
-  Compliance-first (FedRAMP, SOC2, HIPAA, GDPR)
-  Discoverable and shareable
-  Type-safe with auto-generated code

---

## 5-Minute Quick Start

### 1. Install OSSA CLI

```bash
npm install -g @ossa/cli
```

### 2. Create Your First Agent

```bash
ossa init my-first-agent
```

This creates `my-first-agent.yml`:

```yaml
ossaVersion: '1.0'

agent:
  id: my-first-agent
  name: My First OSSA Agent
  version: 1.0.0
  role: custom

  runtime:
    type: docker
    image: ossa/my-first-agent:1.0.0

  capabilities:
    - name: hello_world
      description: Say hello
      input_schema:
        type: object
        properties:
          name:
            type: string
      output_schema:
        type: object
        properties:
          message:
            type: string
```

### 3. Validate

```bash
ossa validate my-first-agent.yml
```

### 4. Build

```bash
ossa build my-first-agent.yml
```

Generates:

- Dockerfile
- Kubernetes manifests
- Docker Compose file
- Helm chart

### 5. Deploy

```bash
# Deploy to Kubernetes
ossa deploy my-first-agent.yml --target k8s

# Or deploy locally with Docker
ossa deploy my-first-agent.yml --target docker
```

---

## OSSA Manifest Structure

Every OSSA agent manifest has these sections:

### Identity

```yaml
agent:
  id: unique-agent-id # DNS-1123 format
  name: Human Readable Name
  version: 1.0.0 # Semantic versioning
  role: compliance # Agent role/type
  tags: [tag1, tag2] # Discovery tags
```

### Runtime

```yaml
runtime:
  type: k8s # docker|k8s|local|serverless|edge
  image: ossa/agent:1.0.0 # Container image
  resources:
    cpu: '500m'
    memory: '512Mi'
  health_check:
    endpoint: /health
    port: 3000
```

### Capabilities

```yaml
capabilities:
  - name: scan_vulnerabilities
    description: Scan for security vulnerabilities
    input_schema:
      type: object
      properties:
        target:
          type: string
    output_schema:
      type: object
      properties:
        vulnerabilities:
          type: array
```

### Policies

```yaml
policies:
  compliance: [fedramp-moderate, soc2-type2]
  data_residency: [US, CA]
  encryption: true
  audit: true
```

### Integration

```yaml
integration:
  protocol: http
  endpoints:
    base_url: http://agent:3000
    health: /health
  auth:
    type: jwt
```

### Monitoring

```yaml
monitoring:
  traces: true
  metrics: true
  logs: true
  health_check: http://localhost:3000/health
```

---

## Examples

See `/spec/examples/` for complete examples:

- `compliance-agent.yml` - FedRAMP compliance scanner
- `chat-agent.yml` - Customer support chat bot
- `workflow-agent.yml` - Multi-agent orchestration
- `audit-agent.yml` - Security auditing
- `monitoring-agent.yml` - System health monitoring

---

## Next Steps

1. **Read the Specification:** `docs/specification-guide.md`
2. **Browse Examples:** `spec/examples/`
3. **Deploy to K8s:** `docs/kubernetes-deployment.md`
4. **Publish to Registry:** `docs/publishing-agents.md`

---

## Resources

- **Specification:** https://ossa.io/spec
- **Registry:** https://registry.ossa.io
- **Documentation:** https://docs.ossa.io
- **GitHub:** https://github.com/ossa-standard/specification
- **Community:** https://discord.gg/ossa

---

## License

Apache-2.0
