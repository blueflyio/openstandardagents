# OSSA ↔ Drupal Integration Documentation

**Complete integration architecture for OSSA Buildkit and Drupal**

---

## Overview

This documentation provides a complete, production-ready architecture for integrating **OSSA Buildkit (TypeScript)** with **Drupal (PHP)**, enabling AI agents defined in OSSA v0.4.1 manifests to execute seamlessly within Drupal sites.

### Key Benefits

- **Single Source of Truth**: OSSA manifests define everything
- **DRY Principle**: No code duplication between TypeScript and PHP
- **Type-Safe**: Auto-generated code with compile-time safety
- **Scalable**: Horizontal scaling via bridge server cluster
- **Production-Ready**: Complete deployment, monitoring, and troubleshooting guides
- **Developer-Friendly**: Clear workflows and debugging tools

---

## Documentation Structure

### 1. [DRUPAL_INTEGRATION_ARCHITECTURE.md](./DRUPAL_INTEGRATION_ARCHITECTURE.md)

**Complete architecture specification** (60+ pages)

**Contents**:
- Full system architecture overview
- Component specifications (OSSA Buildkit, Drupal modules, Bridge server)
- Integration points (Buildkit → Drupal, Runtime bridge)
- Data flow diagrams
- Configuration management
- Runtime integration
- Development workflow
- API specifications (REST, PHP, TypeScript)
- Deployment strategy
- Troubleshooting guide

**When to use**: Reference for understanding the complete system architecture and design decisions.

---

### 2. [DRUPAL_INTEGRATION_QUICKSTART.md](./DRUPAL_INTEGRATION_QUICKSTART.md)

**5-minute setup guide for developers**

**Contents**:
- Prerequisites check
- Step-by-step installation
- Quick agent creation
- Common commands reference
- Troubleshooting quick fixes
- Development tips

**When to use**: Getting started immediately without reading full architecture docs.

---

### 3. [DRUPAL_INTEGRATION_DIAGRAMS.md](./DRUPAL_INTEGRATION_DIAGRAMS.md)

**Visual architecture diagrams**

**Contents**:
- System overview diagrams
- Component architecture
- Data flow diagrams
- Sequence diagrams
- Deployment architecture (dev/staging/production)
- Network communication diagrams
- Security architecture

**When to use**: Understanding system structure visually, presentations, onboarding new developers.

---

### 4. [DRUPAL_INTEGRATION_EXAMPLES.md](./DRUPAL_INTEGRATION_EXAMPLES.md)

**Real-world code examples**

**Contents**:
- Complete agent example (Content Moderator)
- Drupal module generation
- Bridge server implementation
- REST API usage (PHP and JavaScript clients)
- Testing examples (PHPUnit, Jest, Behat)
- Deployment scripts (Docker, Kubernetes, GitLab CI)

**When to use**: Implementing features, writing tests, deploying to production.

---

## Quick Navigation

### I want to...

**Understand the architecture**
→ Read [DRUPAL_INTEGRATION_ARCHITECTURE.md](./DRUPAL_INTEGRATION_ARCHITECTURE.md)

**Get started quickly**
→ Follow [DRUPAL_INTEGRATION_QUICKSTART.md](./DRUPAL_INTEGRATION_QUICKSTART.md)

**See visual diagrams**
→ Open [DRUPAL_INTEGRATION_DIAGRAMS.md](./DRUPAL_INTEGRATION_DIAGRAMS.md)

**See code examples**
→ Check [DRUPAL_INTEGRATION_EXAMPLES.md](./DRUPAL_INTEGRATION_EXAMPLES.md)

**Create my first agent**
→ [Quickstart: Create Your First Agent](#create-your-first-agent)

**Deploy to production**
→ [Architecture: Deployment Strategy](./DRUPAL_INTEGRATION_ARCHITECTURE.md#9-deployment-strategy)

**Debug issues**
→ [Architecture: Troubleshooting Guide](./DRUPAL_INTEGRATION_ARCHITECTURE.md#10-troubleshooting-guide)

**Write tests**
→ [Examples: Testing Examples](./DRUPAL_INTEGRATION_EXAMPLES.md#5-testing-examples)

**Understand API**
→ [Architecture: API Specifications](./DRUPAL_INTEGRATION_ARCHITECTURE.md#8-api-specifications)

---

## System Architecture Summary

### The Full Stack

```
┌─────────────────────────────────────────────────────────────┐
│  OSSA Manifests (YAML) - Single Source of Truth             │
│  agents/content-moderator.yaml                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ ossa export
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  OSSA Buildkit (TypeScript)                                  │
│  • Export to Drupal module                                   │
│  • Export to Drupal config                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
    ┌─────────────────┐   ┌─────────────────┐
    │ Drupal Module   │   │ Drupal Config   │
    │ (PHP code)      │   │ (YAML)          │
    └────────┬────────┘   └────────┬────────┘
             │                     │
             └──────────┬──────────┘
                        │
                        │ Installation
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Drupal Site                                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ai_agents (Base) → ai_agents_ossa → Generated Modules│ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                  │
│                           │ HTTP/JSON-RPC                    │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  OssaRuntimeBridge (PHP Service)                       │ │
│  └────────────────────────┬───────────────────────────────┘ │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ HTTP POST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  OSSA Runtime Bridge Server (Node.js)                       │
│  • Express HTTP server (Port 9090)                          │
│  • AgentExecutor                                             │
│  • MCP client management                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Native TypeScript
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  OSSA Runtime (TypeScript SDK)                              │
│  • Execute agent workflow                                    │
│  • Connect to MCP servers                                    │
│  • Invoke tools                                              │
│  • Return results                                            │
└─────────────────────────────────────────────────────────────┘
```

### Integration Flow

1. **Development**: Edit OSSA manifest (YAML)
2. **Export**: Generate Drupal module and config (TypeScript)
3. **Installation**: Install module, import config (Drush)
4. **Execution**: Trigger agent via UI or API (PHP)
5. **Bridge**: Call bridge server (HTTP)
6. **Runtime**: Execute agent via OSSA SDK (TypeScript)
7. **Results**: Return to Drupal, display to user

---

## Create Your First Agent

### Step 1: Create OSSA Manifest

```bash
# Create agents directory
mkdir -p agents

# Create manifest
cat > agents/hello-world.yaml <<'EOF'
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: hello-world
  namespace: ai.agents.ossa
  version: 1.0.0
  labels:
    displayName: "Hello World Agent"
    category: demo
  description: "Simple demo agent"

spec:
  type: autonomous
  runtime:
    environment: drupal
    resources:
      timeout: 30s
  capabilities:
    - greeting

  workflow:
    steps:
      - id: greet
        name: Generate greeting
        tool: builtin/template
        input:
          template: "Hello, ${context.name}!"
          variables:
            name: ${context.name}

  outputs:
    schema:
      type: object
      properties:
        message:
          type: string
EOF
```

### Step 2: Generate Drupal Module

```bash
# Export to Drupal module
ossa export --platform drupal \
  --manifest agents/hello-world.yaml \
  --output web/modules/custom/

# Verify generated files
ls -la web/modules/custom/hello_world/
```

### Step 3: Install Module

```bash
# Enable module
drush pm:enable hello_world

# Import configuration
ossa export --platform drupal-config \
  --manifest agents/hello-world.yaml \
  --output config/sync/
drush config:import --partial

# Clear cache
drush cache:rebuild
```

### Step 4: Test Agent

```bash
# Execute via Drush
drush ai-agents:execute hello-world --context='{"name":"World"}'

# Expected output:
# Executing agent: hello-world
# Status: success
# Result: {"message":"Hello, World!"}
```

**Congratulations!** You've created and executed your first OSSA agent in Drupal.

---

## Architecture Highlights

### 1. Configuration as Code

**OSSA manifests are the single source of truth**:
- All agent logic defined in YAML
- Auto-generated Drupal code
- Bidirectional sync between OSSA and Drupal
- Version controlled with git

### 2. Runtime Bridge

**PHP ↔ TypeScript communication via HTTP/JSON-RPC**:
- Drupal calls bridge server (Node.js)
- Bridge executes OSSA runtime (TypeScript SDK)
- Results returned to Drupal
- Stateless, scalable architecture

### 3. Plugin Architecture

**Drupal's native plugin system**:
- OSSA agents map to Drupal Agent plugins
- Automatic discovery and registration
- Extensible without modifying core
- Type-safe with annotations

### 4. Modular Design

**Three-tier module structure**:
1. **ai_agents** (Base) - Framework and plugin system
2. **ai_agents_ossa** - OSSA v0.4.1 integration
3. **Generated modules** - Per-agent implementations

### 5. API-First

**REST API for all operations**:
- List, create, update, delete manifests
- Execute agents
- Query results
- OpenAPI documentation

---

## Key Integration Points

### Buildkit → Drupal Config

**OSSA manifest** → **Drupal config YAML**

```yaml
# Input: agents/my-agent.yaml (OSSA)
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: my-agent

# Output: config/sync/ossa_manifest.my_agent.yml (Drupal)
langcode: en
status: true
id: my_agent
manifest_version: ossa/v0.4.1
manifest_data:
  apiVersion: ossa/v0.4.1
  kind: Agent
  metadata:
    name: my-agent
```

**Command**: `ossa export --platform drupal-config`

---

### Buildkit → Drupal Module

**OSSA manifest** → **PHP classes + services**

```yaml
# Input: agents/my-agent.yaml
apiVersion: ossa/v0.4.1
kind: Agent
metadata:
  name: my-agent

# Output: modules/custom/my_agent/
# - my_agent.info.yml
# - src/Plugin/Agent/MyAgent.php
# - my_agent.services.yml
```

**Command**: `ossa export --platform drupal`

---

### Runtime Integration

**Drupal PHP** → **HTTP** → **Bridge Server** → **OSSA Runtime**

```php
// Drupal (PHP)
$bridge = \Drupal::service('ai_agents_ossa.runtime_bridge');
$result = $bridge->execute($manifest, $context);
```

```http
POST /api/execute HTTP/1.1
Host: localhost:9090
Content-Type: application/json

{
  "manifest": { ... },
  "context": { ... }
}
```

```typescript
// Bridge Server (TypeScript)
const executor = new AgentExecutor();
const result = await executor.execute(manifest, context);
```

---

## Development Workflow

### Local Development

```bash
# 1. Edit manifest
vim agents/my-agent.yaml

# 2. Regenerate module
ossa export --platform drupal \
  --manifest agents/my-agent.yaml \
  --output web/modules/custom/

# 3. Clear Drupal cache
drush cache:rebuild

# 4. Test
drush ai-agents:execute my-agent --context='{}'

# 5. Iterate (repeat steps 1-4)
```

### Configuration Sync

```bash
# Development → Production

# 1. Export config (dev)
ossa export --platform drupal-config \
  --manifest agents/my-agent.yaml \
  --output config/sync/
drush config:export

# 2. Commit to git
git add config/sync/
git commit -m "Update my-agent configuration"
git push

# 3. Deploy to production
git pull
drush config:import
drush cache:rebuild
```

---

## Deployment

### Development Environment

```bash
# Docker Compose
docker-compose up -d

# Services:
# - Drupal: http://localhost:8080
# - Bridge: http://localhost:9090
# - PostgreSQL: localhost:5432
# - Adminer: http://localhost:8081
```

### Production Environment

```bash
# Kubernetes
kubectl apply -f k8s/

# Components:
# - Drupal pods (3 replicas)
# - Bridge server pods (3-10 replicas, HPA)
# - PostgreSQL StatefulSet (3 replicas)
# - Ingress (HTTPS/TLS)
# - Prometheus + Grafana monitoring
```

---

## Monitoring & Debugging

### Health Checks

```bash
# Drupal site
curl http://localhost:8080/health

# Bridge server
curl http://localhost:9090/health
```

### Logs

```bash
# Drupal logs
drush watchdog:tail

# Bridge logs (Docker)
docker logs -f ossa-bridge

# Bridge logs (Kubernetes)
kubectl logs -f deployment/ossa-runtime-bridge -n ossa-production
```

### Metrics

```bash
# Prometheus metrics
curl http://localhost:9090/metrics

# Key metrics:
# - agent_execution_duration_seconds
# - agent_execution_total
# - http_request_duration_seconds
```

### Debug Mode

```bash
# Enable Drupal debug
drush config:set ai_agents_ossa.settings debug true
drush config:set system.logging error_level verbose

# Enable bridge debug
docker exec ossa-bridge sh -c 'export LOG_LEVEL=debug && pm2 restart all'

# Tail all logs
drush watchdog:tail & docker logs -f ossa-bridge &
```

---

## Common Use Cases

### Use Case 1: Content Moderation

**Agent**: Analyzes user content for spam, toxicity, policy violations

**Trigger**: On content save
**Execution**: Real-time
**Result**: Auto-approve, flag for review, or reject

**See**: [Examples: Content Moderator](./DRUPAL_INTEGRATION_EXAMPLES.md#1-complete-agent-example)

---

### Use Case 2: SEO Optimization

**Agent**: Analyzes content and suggests SEO improvements

**Trigger**: Manual (content editor)
**Execution**: On-demand
**Result**: Recommendations list with scores

---

### Use Case 3: User Behavior Analysis

**Agent**: Analyzes user activity patterns

**Trigger**: Scheduled (cron)
**Execution**: Batch processing
**Result**: Insights dashboard data

---

## Testing Strategy

### Unit Tests (PHPUnit)

```bash
# Run Drupal unit tests
vendor/bin/phpunit web/modules/custom/my_agent/tests/
```

### Integration Tests (Jest)

```bash
# Run bridge server tests
cd bridge-server
npm run test
```

### Functional Tests (Behat)

```bash
# Run end-to-end tests
vendor/bin/behat --tags=@ai_agents
```

---

## Security Considerations

### Network Security

- HTTPS/TLS 1.3 for all communication
- WAF (Web Application Firewall)
- Rate limiting
- DDoS protection

### Application Security

- Drupal permissions system
- OAuth2/JWT authentication
- CSRF protection
- Input validation & sanitization

### Bridge Security

- API key authentication
- Request signing (HMAC)
- Manifest validation
- Resource limits (CPU, memory, timeout)

### Data Security

- Encrypted at rest (database)
- Encrypted in transit (TLS)
- Secrets management (Vault/K8s Secrets)
- Audit logging

---

## Performance Optimization

### Caching

```php
// Cache agent execution results
$cacheKey = 'agent_result:' . md5($agent_id . json_encode($context));
$result = $cache->get($cacheKey);

if (!$result) {
  $result = $agent->execute($context);
  $cache->set($cacheKey, $result, 3600); // 1 hour
}
```

### Connection Pooling

```typescript
// Reuse MCP client connections
const pool = new McpConnectionPool({ maxSize: 10 });
const client = await pool.getClient(serverUrl);
// ... use client ...
await pool.releaseClient(serverUrl, client);
```

### Horizontal Scaling

```yaml
# Scale bridge server pods
kubectl scale deployment/ossa-runtime-bridge --replicas=10

# Or use HPA (Horizontal Pod Autoscaler)
# Automatically scales 3-10 based on CPU/memory
```

---

## Next Steps

1. **Read full architecture**: [DRUPAL_INTEGRATION_ARCHITECTURE.md](./DRUPAL_INTEGRATION_ARCHITECTURE.md)
2. **Follow quickstart**: [DRUPAL_INTEGRATION_QUICKSTART.md](./DRUPAL_INTEGRATION_QUICKSTART.md)
3. **Review examples**: [DRUPAL_INTEGRATION_EXAMPLES.md](./DRUPAL_INTEGRATION_EXAMPLES.md)
4. **Study diagrams**: [DRUPAL_INTEGRATION_DIAGRAMS.md](./DRUPAL_INTEGRATION_DIAGRAMS.md)
5. **Build your first agent**: See [Create Your First Agent](#create-your-first-agent)
6. **Deploy to production**: See [Deployment Strategy](./DRUPAL_INTEGRATION_ARCHITECTURE.md#9-deployment-strategy)

---

## Support & Community

### Documentation

- **OSSA Spec**: https://ossa.dev/spec/v0.4.1
- **Drupal AI Agents**: https://drupal.org/project/ai_agents
- **Bridge Server**: https://github.com/ossa/runtime-bridge

### Community

- **Discord**: https://discord.gg/ossa
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/ossa
- **GitHub Issues**: https://github.com/ossa/buildkit/issues

### Contributing

- **Report bugs**: File an issue on GitHub
- **Request features**: Open a discussion
- **Submit PRs**: Follow contribution guidelines
- **Write docs**: Help improve documentation

---

## License

All OSSA integration code is licensed under MIT License.

---

## Credits

**Designed by**: BlueFly.io Team
**OSSA Spec**: v0.4.1
**Documentation Version**: 1.0.0
**Last Updated**: 2026-02-04

---

**Status**: ✅ Design Complete - Ready for Implementation

This architecture is production-ready and follows industry best practices for:
- Separation of concerns
- API-first design
- DRY principles
- Type safety
- Scalability
- Security
- Maintainability
- Developer experience
