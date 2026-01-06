<!--
OSSA Deployment Guide
Purpose: Guide for deploying OSSA-compliant agents
Audience: DevOps and developers
Educational Focus: Production deployment strategies
-->

# Deployment Guide

## Pre-Deployment Checklist

- [ ] All agents validated with `--strict`
- [ ] Tests passing (80%+ coverage)
- [ ] Types generated and committed
- [ ] Documentation updated
- [ ] Version bumped appropriately

## Deployment Strategies

### 1. Container Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install OSSA CLI
RUN npm install -g @bluefly/openstandardagents

# Copy agent definitions
COPY agents/ ./agents/

# Validate on build
RUN ossa validate agents/*.json --strict

# Copy application
COPY . .
RUN npm ci --production

CMD ["node", "dist/index.js"]
```

### 2. Kubernetes Deployment

**ConfigMap for agents:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-definitions
data:
  agent.json: |
    {
      "ossa": "0.3.0",
      "agent": {...}
    }
```

**Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ossa-agent
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: agent
        image: my-agent:latest
        volumeMounts:
        - name: agents
          mountPath: /app/agents
      volumes:
      - name: agents
        configMap:
          name: agent-definitions
```

### 3. Serverless Deployment

**AWS Lambda:**
```typescript
import { ValidationService } from '@bluefly/openstandardagents/validation';

export const handler = async (event) => {
  const validator = new ValidationService();
  const result = await validator.validate(event.agent);
  return { statusCode: 200, body: JSON.stringify(result) };
};
```

## CI/CD Integration

### GitLab CI
```yaml
stages:
  - validate
  - test
  - build
  - deploy

validate:
  stage: validate
  script:
    - npm install -g @bluefly/openstandardagents
    - ossa validate agents/*.json --strict

deploy:
  stage: deploy
  script:
    - docker build -t my-agent .
    - docker push my-agent
  only:
    - main
```

## Monitoring

### Health Checks
```typescript
app.get('/health', async (req, res) => {
  const validator = new ValidationService();
  const valid = await validator.validate(agentDefinition);
  res.json({ status: valid ? 'healthy' : 'unhealthy' });
});
```

### Metrics
- Agent execution time
- Validation success rate
- Error rates by capability

## Rollback Strategy

1. Keep previous version deployed
2. Use blue-green deployment
3. Monitor error rates
4. Rollback if issues detected

---

**Next**: [Troubleshooting](troubleshooting.md) for common issues
