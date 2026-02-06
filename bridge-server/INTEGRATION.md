# OSSA Bridge Server Integration Guide

This guide explains how to integrate the OSSA Bridge Server with various components of the platform.

## Table of Contents

1. [agent-protocol Integration](#agent-protocol-integration)
2. [Drupal Integration](#drupal-integration)
3. [Monitoring & Observability](#monitoring--observability)
4. [Production Deployment](#production-deployment)

---

## agent-protocol Integration

The bridge server delegates all MCP operations to the `agent-protocol` service. You need to implement the connection between these two services.

### Option 1: HTTP API (Recommended for Production)

Update `src/services/agent-runtime.service.ts`:

```typescript
private async executeAgentViaProtocol(
  agentId: string,
  input: Record<string, unknown>,
  context: Record<string, unknown>,
  timeout: number
): Promise<unknown> {
  const agentProtocolUrl = process.env.AGENT_PROTOCOL_URL || 'http://agent-protocol:8080';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${agentProtocolUrl}/api/v1/agents/${agentId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, context }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new BridgeError(
        BridgeErrorCode.AGENT_EXECUTION_FAILED,
        error.message || 'Agent execution failed'
      );
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new BridgeError(BridgeErrorCode.TIMEOUT, 'Agent execution timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async listAgents(): Promise<AgentMetadata[]> {
  const agentProtocolUrl = process.env.AGENT_PROTOCOL_URL || 'http://agent-protocol:8080';
  const response = await fetch(`${agentProtocolUrl}/api/v1/agents`);
  const data = await response.json();
  return data.agents;
}

async getAgent(agentId: string): Promise<AgentMetadata> {
  const agentProtocolUrl = process.env.AGENT_PROTOCOL_URL || 'http://agent-protocol:8080';
  const response = await fetch(`${agentProtocolUrl}/api/v1/agents/${agentId}`);

  if (!response.ok) {
    throw new BridgeError(BridgeErrorCode.AGENT_NOT_FOUND, `Agent not found: ${agentId}`);
  }

  const data = await response.json();
  return data.agent;
}
```

Add environment variable:

```bash
AGENT_PROTOCOL_URL=http://agent-protocol:8080
```

### Option 2: Direct SDK Import

```typescript
import { AgentRuntime, AgentRegistry } from '@bluefly/agent-protocol';

export class AgentRuntimeService {
  private runtime: AgentRuntime;
  private registry: AgentRegistry;

  constructor() {
    this.registry = new AgentRegistry(process.env.OSSA_REGISTRY_PATH);
    this.runtime = new AgentRuntime(this.registry);
  }

  private async executeAgentViaProtocol(
    agentId: string,
    input: Record<string, unknown>,
    context: Record<string, unknown>,
    timeout: number
  ): Promise<unknown> {
    return await this.runtime.execute(agentId, input, { ...context, timeout });
  }

  async listAgents(): Promise<AgentMetadata[]> {
    return await this.registry.listAgents();
  }

  async getAgent(agentId: string): Promise<AgentMetadata> {
    return await this.registry.getAgent(agentId);
  }
}
```

Update `package.json`:

```json
{
  "dependencies": {
    "@bluefly/agent-protocol": "workspace:*"
  }
}
```

---

## Drupal Integration

The bridge server exposes HTTP endpoints for Drupal PHP to consume.

### PHP Client Library

Create a PHP client in your Drupal module:

```php
<?php

namespace Drupal\ai_agents_ossa\Service;

use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;

/**
 * OSSA Bridge Client.
 */
class OssaBridgeClient {

  /**
   * HTTP client.
   */
  protected ClientInterface $httpClient;

  /**
   * Bridge server URL.
   */
  protected string $bridgeUrl;

  /**
   * Constructor.
   */
  public function __construct(ClientInterface $http_client, string $bridge_url) {
    $this->httpClient = $http_client;
    $this->bridgeUrl = rtrim($bridge_url, '/');
  }

  /**
   * Execute an agent.
   *
   * @param string $agent_id
   *   Agent identifier.
   * @param array $input
   *   Input data.
   * @param array $context
   *   Execution context.
   * @param int $timeout
   *   Timeout in milliseconds.
   *
   * @return array
   *   Agent execution result.
   *
   * @throws \Exception
   */
  public function executeAgent(
    string $agent_id,
    array $input = [],
    array $context = [],
    int $timeout = 300000
  ): array {
    try {
      $response = $this->httpClient->post("{$this->bridgeUrl}/api/v1/execute", [
        'json' => [
          'agentId' => $agent_id,
          'input' => $input,
          'context' => $context,
          'timeout' => $timeout,
        ],
        'timeout' => $timeout / 1000, // Convert to seconds
      ]);

      $data = json_decode($response->getBody(), TRUE);

      if (!$data['success']) {
        throw new \Exception($data['error']['message'] ?? 'Agent execution failed');
      }

      return $data;
    }
    catch (GuzzleException $e) {
      throw new \Exception("Bridge server request failed: " . $e->getMessage());
    }
  }

  /**
   * List available agents.
   *
   * @return array
   *   List of agent metadata.
   *
   * @throws \Exception
   */
  public function listAgents(): array {
    try {
      $response = $this->httpClient->get("{$this->bridgeUrl}/api/v1/agents");
      $data = json_decode($response->getBody(), TRUE);

      return $data['agents'] ?? [];
    }
    catch (GuzzleException $e) {
      throw new \Exception("Failed to list agents: " . $e->getMessage());
    }
  }

  /**
   * Get agent metadata.
   *
   * @param string $agent_id
   *   Agent identifier.
   *
   * @return array
   *   Agent metadata.
   *
   * @throws \Exception
   */
  public function getAgent(string $agent_id): array {
    try {
      $response = $this->httpClient->get("{$this->bridgeUrl}/api/v1/agents/{$agent_id}");
      $data = json_decode($response->getBody(), TRUE);

      return $data['agent'] ?? [];
    }
    catch (GuzzleException $e) {
      throw new \Exception("Failed to get agent: " . $e->getMessage());
    }
  }

  /**
   * Check bridge server health.
   *
   * @return bool
   *   TRUE if healthy.
   */
  public function healthCheck(): bool {
    try {
      $response = $this->httpClient->get("{$this->bridgeUrl}/health");
      $data = json_decode($response->getBody(), TRUE);

      return $data['status'] === 'ok';
    }
    catch (GuzzleException $e) {
      return FALSE;
    }
  }

}
```

### Drupal Service Definition

```yaml
# ai_agents_ossa.services.yml
services:
  ai_agents_ossa.bridge_client:
    class: Drupal\ai_agents_ossa\Service\OssaBridgeClient
    arguments:
      - '@http_client'
      - '%ai_agents_ossa.bridge_url%'
```

### Configuration Schema

```yaml
# config/schema/ai_agents_ossa.schema.yml
ai_agents_ossa.settings:
  type: config_object
  label: 'AI Agents OSSA Settings'
  mapping:
    bridge_url:
      type: string
      label: 'Bridge Server URL'
    default_timeout:
      type: integer
      label: 'Default Timeout (ms)'
```

### Usage Example

```php
// In a Drupal controller or service
$bridge = \Drupal::service('ai_agents_ossa.bridge_client');

// Execute agent
$result = $bridge->executeAgent('compliance-checker', [
  'policy' => 'require-approval',
  'resource' => 'node:123',
], [
  'userId' => \Drupal::currentUser()->id(),
]);

// List agents
$agents = $bridge->listAgents();
```

---

## Monitoring & Observability

### OpenTelemetry Setup

#### Using Grafana Tempo

```yaml
# docker-compose.yml
services:
  tempo:
    image: grafana/tempo:latest
    ports:
      - "4318:4318"  # OTLP HTTP
      - "3200:3200"  # Tempo UI
    command: ["-config.file=/etc/tempo.yaml"]
    volumes:
      - ./tempo.yaml:/etc/tempo.yaml
      - tempo-data:/var/tempo

  bridge-server:
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318
```

#### Tempo Configuration

```yaml
# tempo.yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        http:
          endpoint: 0.0.0.0:4318

storage:
  trace:
    backend: local
    local:
      path: /var/tempo/traces
```

### Grafana Integration

Add Tempo as data source in Grafana:

```yaml
datasources:
  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
```

Create dashboard for OSSA metrics:

```json
{
  "dashboard": {
    "title": "OSSA Bridge Server",
    "panels": [
      {
        "title": "Agent Execution Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(agent_execution_time_ms_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      }
    ]
  }
}
```

### Logging

Configure structured logging:

```typescript
// Add to src/server.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

---

## Production Deployment

### Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ossa-bridge-server
  namespace: ossa
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ossa-bridge-server
  template:
    metadata:
      labels:
        app: ossa-bridge-server
    spec:
      containers:
      - name: bridge
        image: registry.gitlab.com/blueflyio/ossa-bridge-server:latest
        ports:
        - containerPort: 9090
          name: http
        env:
        - name: BRIDGE_PORT
          value: "9090"
        - name: OSSA_REGISTRY_PATH
          value: /agents
        - name: AGENT_PROTOCOL_URL
          value: http://agent-protocol:8080
        - name: OTEL_EXPORTER_OTLP_ENDPOINT
          value: http://tempo:4318
        volumeMounts:
        - name: agent-registry
          mountPath: /agents
          readOnly: true
        livenessProbe:
          httpGet:
            path: /health
            port: 9090
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 9090
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
      volumes:
      - name: agent-registry
        configMap:
          name: ossa-agent-registry

---
apiVersion: v1
kind: Service
metadata:
  name: ossa-bridge-server
  namespace: ossa
spec:
  selector:
    app: ossa-bridge-server
  ports:
  - port: 9090
    targetPort: 9090
    name: http
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ossa-bridge-server
  namespace: ossa
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - ossa-bridge.bluefly.io
    secretName: ossa-bridge-tls
  rules:
  - host: ossa-bridge.bluefly.io
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ossa-bridge-server
            port:
              number: 9090
```

### Docker Compose (Simple Production)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  bridge-server:
    image: registry.gitlab.com/blueflyio/ossa-bridge-server:latest
    restart: always
    ports:
      - "9090:9090"
    environment:
      - NODE_ENV=production
      - BRIDGE_PORT=9090
      - AGENT_PROTOCOL_URL=http://agent-protocol:8080
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318
    volumes:
      - /data/ossa/agents:/agents:ro
    networks:
      - ossa-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:9090/health"]
      interval: 30s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - ossa-network
    depends_on:
      - bridge-server

networks:
  ossa-network:
    driver: bridge
```

### Nginx Configuration

```nginx
# nginx.conf
upstream bridge_servers {
  least_conn;
  server bridge-server:9090 max_fails=3 fail_timeout=30s;
}

server {
  listen 80;
  server_name ossa-bridge.bluefly.io;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name ossa-bridge.bluefly.io;

  ssl_certificate /etc/letsencrypt/live/ossa-bridge.bluefly.io/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/ossa-bridge.bluefly.io/privkey.pem;

  location / {
    proxy_pass http://bridge_servers;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # Disable buffering for streaming
    proxy_buffering off;
  }

  location /health {
    proxy_pass http://bridge_servers;
    access_log off;
  }
}
```

### CI/CD Pipeline (.gitlab-ci.yml)

```yaml
stages:
  - build
  - test
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE

test:
  stage: test
  image: node:18-alpine
  script:
    - npm ci
    - npm run type-check
    - npm run lint

deploy-production:
  stage: deploy
  image: alpine/kubectl:latest
  only:
    - main
  script:
    - kubectl set image deployment/ossa-bridge-server bridge=$DOCKER_IMAGE -n ossa
    - kubectl rollout status deployment/ossa-bridge-server -n ossa
```

---

## Security Considerations

### Authentication

Add JWT authentication:

```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### CORS Configuration

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://bluefly.io'],
  methods: ['GET', 'POST'],
  credentials: true,
}));
```

---

## Troubleshooting

### Common Issues

1. **Connection refused to agent-protocol**
   - Check `AGENT_PROTOCOL_URL` environment variable
   - Verify agent-protocol service is running
   - Check network connectivity between services

2. **Tracing not working**
   - Verify `OTEL_EXPORTER_OTLP_ENDPOINT` is correct
   - Check Tempo/Jaeger is running and accessible
   - Review logs for OpenTelemetry errors

3. **High memory usage**
   - Reduce cache size in `agent-runtime.service.ts`
   - Implement cache eviction strategy
   - Monitor with `process.memoryUsage()`

4. **Slow agent execution**
   - Check agent-protocol performance
   - Review trace spans for bottlenecks
   - Increase timeout if legitimate long-running operations

---

## Next Steps

1. Implement agent-protocol integration
2. Add authentication middleware
3. Set up monitoring and alerting
4. Deploy to staging environment
5. Load testing and performance tuning
6. Security audit
7. Production deployment

For questions or support, contact the BlueFly.io platform team.
