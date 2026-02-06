# OSSA Bridge Server - Next Steps Checklist

This document outlines the steps needed to move from the current implementation to production deployment.

---

## Phase 1: Local Testing ✅ (Ready Now)

### Installation

- [ ] Navigate to bridge-server directory
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Review environment variables

### Basic Testing

- [ ] Run `npm run dev`
- [ ] Verify server starts on port 9090
- [ ] Test health endpoint: `curl http://localhost:9090/health`
- [ ] Run test script: `./test-api.sh`
- [ ] Verify all 8 tests pass

### Type Safety

- [ ] Run `npm run type-check`
- [ ] Fix any TypeScript errors (should be none)
- [ ] Run `npm run lint`
- [ ] Fix any ESLint warnings

### Documentation Review

- [ ] Read [README.md](./README.md)
- [ ] Read [QUICKSTART.md](./QUICKSTART.md)
- [ ] Read [INTEGRATION.md](./INTEGRATION.md)
- [ ] Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

**Estimated Time**: 30 minutes

---

## Phase 2: agent-protocol Integration 🔄 (Next Priority)

### Option A: HTTP API Integration (Recommended)

**File to Update**: `src/services/agent-runtime.service.ts`

- [ ] Deploy agent-protocol service (if not already running)
- [ ] Get agent-protocol URL (e.g., `http://agent-protocol:8080`)
- [ ] Add `AGENT_PROTOCOL_URL` to `.env`
- [ ] Update `executeAgentViaProtocol()` method:
  ```typescript
  const response = await fetch(`${agentProtocolUrl}/api/v1/agents/${agentId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, context }),
  });
  ```
- [ ] Update `listAgents()` method
- [ ] Update `getAgent()` method
- [ ] Test with real agents
- [ ] Handle agent-protocol errors gracefully

**Reference**: [INTEGRATION.md - Option 1](./INTEGRATION.md#option-1-http-api-recommended-for-production)

### Option B: Direct SDK Integration

**File to Update**: `src/services/agent-runtime.service.ts`, `package.json`

- [ ] Add `@bluefly/agent-protocol` to dependencies
- [ ] Import `AgentRuntime` and `AgentRegistry`
- [ ] Initialize runtime in constructor
- [ ] Update execution methods to use SDK
- [ ] Test with real agents

**Reference**: [INTEGRATION.md - Option 2](./INTEGRATION.md#option-2-direct-sdk-import)

### Testing

- [ ] Execute real OSSA agent via bridge
- [ ] Verify agent results are correct
- [ ] Test error cases (agent not found, timeout, etc.)
- [ ] Verify caching works with real agents
- [ ] Check trace spans in Tempo/Jaeger

**Estimated Time**: 4-6 hours

---

## Phase 3: Drupal Integration 🔄

### PHP Client Implementation

- [ ] Copy PHP client from [INTEGRATION.md](./INTEGRATION.md#php-client-library)
- [ ] Add to Drupal module: `src/Service/OssaBridgeClient.php`
- [ ] Create service definition in `ai_agents_ossa.services.yml`
- [ ] Add configuration schema in `config/schema/ai_agents_ossa.schema.yml`
- [ ] Create settings form for bridge URL
- [ ] Test service injection in controller

### Configuration

- [ ] Set `ai_agents_ossa.bridge_url` in Drupal config
- [ ] Set default timeout value
- [ ] Test configuration saving/loading

### Testing from Drupal

- [ ] Test `healthCheck()` method
- [ ] Test `listAgents()` method
- [ ] Test `getAgent()` method
- [ ] Test `executeAgent()` method
- [ ] Verify errors are handled gracefully
- [ ] Check logs for issues

### UI Integration

- [ ] Display available agents in Drupal UI
- [ ] Create agent execution form
- [ ] Show agent results
- [ ] Handle errors in UI

**Reference**: [INTEGRATION.md - Drupal Integration](./INTEGRATION.md#drupal-integration)

**Estimated Time**: 6-8 hours

---

## Phase 4: Observability Setup 🔄

### OpenTelemetry Tracing

- [ ] Deploy Grafana Tempo or Jaeger
  ```bash
  docker run -d -p 4318:4318 -p 3200:3200 grafana/tempo
  ```
- [ ] Set `OTEL_EXPORTER_OTLP_ENDPOINT` in `.env`
- [ ] Restart bridge server
- [ ] Execute test agents
- [ ] Verify traces appear in Tempo UI (`http://localhost:3200`)
- [ ] Review trace spans and timing

### Grafana Dashboards

- [ ] Deploy Grafana (if not already running)
- [ ] Add Tempo as data source
- [ ] Create dashboard for bridge server metrics
- [ ] Add panels for:
  - Request rate
  - Agent execution time (p50, p95, p99)
  - Error rate
  - Cache hit rate
- [ ] Set up alerts for errors

### Logging

- [ ] Configure structured logging (winston or pino)
- [ ] Set up log aggregation (Loki, ELK, etc.)
- [ ] Create log-based alerts
- [ ] Document log format

**Reference**: [INTEGRATION.md - Monitoring](./INTEGRATION.md#monitoring--observability)

**Estimated Time**: 4-6 hours

---

## Phase 5: Security Hardening 🔐 (Before Production)

### Authentication

- [ ] Decide on auth strategy (JWT, API keys, etc.)
- [ ] Implement auth middleware
- [ ] Update all endpoints to require auth
- [ ] Add auth documentation
- [ ] Test authenticated requests

**Reference**: [INTEGRATION.md - Authentication](./INTEGRATION.md#authentication)

### Rate Limiting

- [ ] Install `express-rate-limit`
- [ ] Configure rate limits per endpoint
- [ ] Test rate limiting behavior
- [ ] Document rate limits in API docs

**Reference**: [INTEGRATION.md - Rate Limiting](./INTEGRATION.md#rate-limiting)

### CORS Restriction

- [ ] Update CORS config to whitelist specific origins
- [ ] Add `ALLOWED_ORIGINS` to environment variables
- [ ] Test CORS from Drupal
- [ ] Verify blocked from unauthorized origins

### Input Validation

- [x] Already implemented with Zod ✅
- [ ] Review schemas for completeness
- [ ] Add additional validation rules if needed

### TLS/HTTPS

- [ ] Set up TLS termination (Nginx, Ingress, etc.)
- [ ] Obtain SSL certificate (Let's Encrypt)
- [ ] Configure HTTPS redirect
- [ ] Test HTTPS access
- [ ] Update Drupal config to use `https://`

### Security Audit

- [ ] Run `npm audit`
- [ ] Fix any vulnerabilities
- [ ] Review Docker image for security issues
- [ ] Scan with Trivy or similar
- [ ] Review code for common vulnerabilities (SQL injection, XSS, etc.)

**Estimated Time**: 6-8 hours

---

## Phase 6: Staging Deployment 🚀

### Docker Deployment

- [ ] Build Docker image
  ```bash
  docker build -t ossa-bridge-server:staging .
  ```
- [ ] Push to registry
  ```bash
  docker tag ossa-bridge-server:staging registry.gitlab.com/blueflyio/ossa-bridge-server:staging
  docker push registry.gitlab.com/blueflyio/ossa-bridge-server:staging
  ```
- [ ] Deploy to staging environment
- [ ] Verify health check
- [ ] Test all endpoints

### Kubernetes Deployment (Optional)

- [ ] Create Kubernetes manifests (see [INTEGRATION.md](./INTEGRATION.md#kubernetes-deployment))
- [ ] Create namespace: `kubectl create namespace ossa-staging`
- [ ] Apply manifests: `kubectl apply -f k8s/staging/`
- [ ] Verify deployment: `kubectl get pods -n ossa-staging`
- [ ] Expose service (Ingress or LoadBalancer)
- [ ] Test external access

### Configuration

- [ ] Set production environment variables
- [ ] Configure agent-protocol URL (staging)
- [ ] Configure OTLP endpoint (staging)
- [ ] Set resource limits (CPU, memory)
- [ ] Configure health checks

### Testing

- [ ] Smoke test all endpoints
- [ ] Execute real agents from Drupal staging
- [ ] Load test with Apache Bench or k6
- [ ] Verify traces in Tempo
- [ ] Check logs for errors
- [ ] Monitor resource usage

**Reference**: [INTEGRATION.md - Production Deployment](./INTEGRATION.md#production-deployment)

**Estimated Time**: 4-6 hours

---

## Phase 7: Load Testing & Optimization ⚡

### Load Testing

- [ ] Install load testing tool (k6, Apache Bench, etc.)
- [ ] Create load test scenarios:
  - Execute agent endpoint
  - List agents endpoint
  - Health check endpoint
- [ ] Run tests with increasing load
- [ ] Document results (RPS, latency, errors)
- [ ] Identify bottlenecks

### Performance Optimization

Based on load test results:

- [ ] Optimize cache strategy (consider Redis)
- [ ] Implement connection pooling to agent-protocol
- [ ] Enable gzip compression
- [ ] Optimize Docker image size
- [ ] Tune Node.js memory limits
- [ ] Add CDN for static responses (if applicable)

### Scaling

- [ ] Test horizontal scaling (2, 4, 8 replicas)
- [ ] Verify load balancing works
- [ ] Test failover scenarios
- [ ] Document scaling guidelines

**Estimated Time**: 6-8 hours

---

## Phase 8: Production Deployment 🎉

### Pre-Production Checklist

- [ ] All staging tests pass
- [ ] Security audit complete
- [ ] Load testing results acceptable
- [ ] Documentation complete
- [ ] Monitoring and alerts configured
- [ ] Runbook created for operations team
- [ ] Backup and disaster recovery plan
- [ ] Rollback plan documented

### Production Deployment

- [ ] Build production Docker image
  ```bash
  docker build -t ossa-bridge-server:v0.1.0 .
  ```
- [ ] Push to production registry
- [ ] Create production namespace (if Kubernetes)
- [ ] Apply production manifests
- [ ] Configure production environment variables
- [ ] Enable HTTPS/TLS
- [ ] Verify health checks
- [ ] Test all endpoints

### Post-Deployment

- [ ] Smoke test production endpoints
- [ ] Verify traces and logs
- [ ] Monitor for errors (first 24 hours)
- [ ] Update Drupal production to use new URL
- [ ] Announce to team
- [ ] Update project documentation

### Monitoring Setup

- [ ] Set up uptime monitoring (Pingdom, UptimeRobot, etc.)
- [ ] Configure alerts:
  - High error rate
  - High latency
  - Service down
  - High memory usage
- [ ] Create on-call rotation
- [ ] Document incident response procedures

**Estimated Time**: 4-6 hours (plus monitoring)

---

## Phase 9: Post-Production Enhancements 🚀

### Future Features

- [ ] Streaming responses for long-running agents
- [ ] WebSocket support for real-time updates
- [ ] Batch execution (multiple agents in one request)
- [ ] Result webhooks (notify Drupal when complete)
- [ ] Agent versioning support
- [ ] Prometheus metrics endpoint
- [ ] GraphQL API (alternative to REST)
- [ ] Admin UI for monitoring

### Maintenance

- [ ] Schedule regular dependency updates
- [ ] Plan quarterly security audits
- [ ] Review and optimize cache strategy
- [ ] Performance tuning based on production metrics
- [ ] Update documentation based on lessons learned

**Estimated Time**: Ongoing

---

## Quick Reference Commands

```bash
# Development
npm install && npm run dev

# Testing
./test-api.sh
npm run type-check
npm run lint

# Build
npm run build

# Docker
docker build -t ossa-bridge-server .
docker run -p 9090:9090 ossa-bridge-server

# Deploy
docker-compose up -d
kubectl apply -f k8s/

# Monitor
curl http://localhost:9090/health
kubectl logs -f deployment/ossa-bridge-server
```

---

## Estimated Total Time

| Phase | Time Estimate |
|-------|---------------|
| 1. Local Testing | 30 minutes |
| 2. agent-protocol Integration | 4-6 hours |
| 3. Drupal Integration | 6-8 hours |
| 4. Observability Setup | 4-6 hours |
| 5. Security Hardening | 6-8 hours |
| 6. Staging Deployment | 4-6 hours |
| 7. Load Testing | 6-8 hours |
| 8. Production Deployment | 4-6 hours |
| **Total** | **35-48 hours** |

---

## Priority Order (Recommended)

1. **Phase 1** - Local Testing (Start here)
2. **Phase 2** - agent-protocol Integration (Critical for functionality)
3. **Phase 3** - Drupal Integration (Enables end-to-end testing)
4. **Phase 4** - Observability Setup (Important for debugging)
5. **Phase 5** - Security Hardening (Required before production)
6. **Phase 6** - Staging Deployment (Test in realistic environment)
7. **Phase 7** - Load Testing (Validate performance)
8. **Phase 8** - Production Deployment (Go live)
9. **Phase 9** - Enhancements (Continuous improvement)

---

## Support & Resources

- **Documentation**: [README.md](./README.md), [INTEGRATION.md](./INTEGRATION.md)
- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **GitLab Issues**: https://gitlab.com/blueflyio/openstandardagents/-/issues
- **BlueFly Platform Team**: Contact for questions

---

## Success Metrics

Track these metrics to measure success:

- **Uptime**: >99.9%
- **Latency**: p95 < 100ms (excluding agent execution)
- **Error Rate**: <0.1%
- **Cache Hit Rate**: >60%
- **Request Rate**: Handle 1000+ req/sec
- **Time to First Byte**: <50ms

---

**Status**: 🟢 Phase 1 Ready
**Next Action**: Complete Phase 1 (Local Testing)
**Last Updated**: 2026-02-04
