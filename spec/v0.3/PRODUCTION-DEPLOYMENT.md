# OSSA v0.3.5 Production Deployment Guide

**Target Audience**: Platform operators, DevOps engineers, infrastructure teams

---

## PREREQUISITES

### Infrastructure Requirements

- **Agent Mesh**: Service discovery and A2A communication (port 3005)
- **Agent Brain**: Checkpoint storage (Qdrant + PostgreSQL)
- **Agent Tracer**: Observability and metrics (OpenTelemetry)
- **Agent Router**: MoE routing and LLM gateway
- **Compliance Engine**: Policy enforcement

### Software Requirements

- Node.js 20+ (for CLI tools)
- Docker/Kubernetes (for agent runtime)
- GitLab CI/CD (for automation)
- PostgreSQL 14+ (for checkpoint storage)
- Qdrant (for vector search)

---

## DEPLOYMENT STEPS

### Step 1: Schema Validation

```bash
# Validate all v0.3.5 manifests
ossa v0.3.5 validate examples/*.ossa.yaml

# Validate with strict mode (fails on warnings)
ossa v0.3.5 validate --strict examples/*.ossa.yaml
```

### Step 2: Feature Detection

```bash
# Check which v0.3.5 features are used
ossa v0.3.5 validate my-agent.ossa.yaml

# Output shows detected features:
# ✅ completion_signals
# ✅ checkpointing
# ✅ moe
# ❌ bat (not used)
```

### Step 3: Infrastructure Setup

#### Checkpoint Storage

```yaml
# docker-compose.yml
services:
  agent-brain:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - checkpoint-storage:/qdrant/storage

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: agent_brain
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

#### Agent Mesh

```yaml
services:
  agent-mesh:
    image: bluefly/agent-mesh:latest
    ports:
      - "3005:3005"
    environment:
      REDIS_URL: redis://redis:6379
      QDRANT_URL: http://agent-brain:6333
```

### Step 4: Agent Deployment

#### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: forward-thinking-reviewer
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: agent
        image: my-registry/forward-thinking-reviewer:latest
        env:
        - name: OSSA_VERSION
          value: "0.3.5"
        - name: AGENT_MESH_ENDPOINT
          value: "http://agent-mesh:3005"
        - name: CHECKPOINT_STORAGE
          value: "s3://checkpoints"
```

#### Docker Compose

```yaml
services:
  forward-thinking-reviewer:
    build: .
    environment:
      OSSA_VERSION: "0.3.5"
      AGENT_MESH_ENDPOINT: "http://agent-mesh:3005"
      CHECKPOINT_STORAGE: "s3://checkpoints"
    depends_on:
      - agent-mesh
      - agent-brain
```

### Step 5: Monitoring Setup

#### MOE Metrics Collection

```yaml
# GitLab Observability integration
observability:
  enabled: true
  metrics:
    - moe.primary.metric
    - moe.secondary.*
    - moe.operational.*
  dashboards:
    - gitlab_observability
    - agent_studio_ui
```

#### Completion Signal Tracking

```yaml
# Track completion signals
tracing:
  enabled: true
  signals:
    - continue
    - complete
    - blocked
    - escalate
    - checkpoint
```

---

## PRODUCTION CHECKLIST

### Pre-Deployment

- [ ] All manifests validated with `ossa v0.3.5 validate`
- [ ] Checkpoint storage configured and tested
- [ ] Agent mesh connectivity verified
- [ ] MOE metrics collection configured
- [ ] Completion signal handlers implemented
- [ ] Expert registry populated
- [ ] BAT framework configured
- [ ] Infrastructure substrate defined

### Deployment

- [ ] Agents deployed with v0.3.5 API version
- [ ] Checkpoint storage accessible
- [ ] Agent mesh registration successful
- [ ] Completion signals working
- [ ] Checkpointing operational
- [ ] MoE routing functional
- [ ] MOE metrics collecting

### Post-Deployment

- [ ] Monitor completion signal patterns
- [ ] Verify checkpoint creation/resume
- [ ] Track MoE expert selection
- [ ] Monitor MOE metrics
- [ ] Review cost optimization
- [ ] Validate session recovery

---

## TROUBLESHOOTING

### Checkpoint Storage Issues

**Problem**: Checkpoints not saving

**Solution**:
```bash
# Verify storage backend
ossa v0.3.5 validate --strict my-agent.ossa.yaml

# Check storage connectivity
curl http://agent-brain:6333/health

# Verify permissions
aws s3 ls s3://checkpoints/
```

### Completion Signal Issues

**Problem**: Signals not being received

**Solution**:
```bash
# Verify signal configuration
grep -A 5 "completion:" my-agent.ossa.yaml

# Check agent mesh connectivity
curl http://agent-mesh:3005/health

# Verify signal handlers
tail -f /var/log/agent-mesh/signals.log
```

### MoE Routing Issues

**Problem**: Expert selection not working

**Solution**:
```bash
# Verify expert registry
ossa v0.3.5 validate my-agent.ossa.yaml | grep moe

# Check expert availability
curl http://agent-router:3000/experts

# Verify selection strategy
grep "selection_strategy" my-agent.ossa.yaml
```

---

## PERFORMANCE TUNING

### Checkpoint Interval Optimization

```yaml
# For cost-sensitive agents
checkpointing:
  interval: iteration
  interval_value: 10  # Checkpoint every 10 iterations

# For reliability-critical agents
checkpointing:
  interval: iteration
  interval_value: 1   # Checkpoint every iteration
```

### MoE Cost Optimization

```yaml
# Use economy experts for high-volume tasks
experts:
  selection_strategy: cost_optimized
  registry:
    - id: speed-expert
      cost_tier: economy
      # Use for 80% of tasks
```

### Completion Signal Optimization

```yaml
# Reduce unnecessary iterations
completion:
  max_iterations: 5  # Lower for faster completion
  signals:
    - signal: complete
      condition: "confidence >= 0.8"  # Higher threshold
```

---

## SECURITY CONSIDERATIONS

### Checkpoint Security

- **Encryption**: Encrypt checkpoints at rest
- **Access Control**: Limit checkpoint access by agent tier
- **Retention**: Enforce checkpoint retention policies
- **Audit**: Log all checkpoint operations

### MoE Security

- **Expert Access**: Control which agents can use which experts
- **Cost Limits**: Enforce per-agent budget limits
- **Audit Trail**: Log all expert invocations

### Completion Signal Security

- **Verification**: Verify signal authenticity
- **Rate Limiting**: Prevent signal flooding
- **Audit**: Log all completion signals

---

## MONITORING & ALERTING

### Key Metrics

- **Completion Signal Rate**: Signals per minute
- **Checkpoint Success Rate**: Successful checkpoints / total attempts
- **MoE Expert Utilization**: Expert usage distribution
- **MOE Primary Metric**: Agent effectiveness score
- **Session Recovery Rate**: Successful resumes / total resumes

### Alert Thresholds

```yaml
alerts:
  - metric: checkpoint_success_rate
    threshold: 0.95
    severity: warning
  
  - metric: moe_primary_metric
    threshold: 0.80
    severity: critical
  
  - metric: completion_signal_timeout
    threshold: 5
    severity: warning
```

---

## ROLLBACK PLAN

If v0.3.5 features cause issues:

1. **Revert API Version**: Change `apiVersion` to `ossa/v0.3.4`
2. **Disable Features**: Comment out v0.3.5 extensions
3. **Restore Checkpoints**: Restore from v0.3.4 checkpoint format
4. **Monitor**: Watch for regressions

**Note**: v0.3.5 agents are backward compatible with v0.3.4 runtimes.

---

## RELATED DOCUMENTS

- [README.md](./README.md) - Feature overview
- [ENHANCEMENT-PLAN.md](./ENHANCEMENT-PLAN.md) - Complete enhancement plan
- [MIGRATION-v0.3.4-to-v0.3.5.md](./MIGRATION-v0.3.4-to-v0.3.5.md) - Migration guide
- [POSITIONING.md](./POSITIONING.md) - Market positioning

---

**OSSA v0.3.5: Production-Ready Agent Specification** 🚀
