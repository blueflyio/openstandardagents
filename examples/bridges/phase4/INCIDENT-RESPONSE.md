# AIFlow Social Agent - Incident Response Playbook

## 🚨 Incident Severity Levels

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| **P0 - Critical** | Complete service outage | 15 minutes | All pods down, API unreachable |
| **P1 - High** | Major functionality impaired | 1 hour | 50%+ error rate, BuildKit disconnected |
| **P2 - Medium** | Minor functionality degraded | 4 hours | Elevated latency, occasional timeouts |
| **P3 - Low** | Non-critical issue | 24 hours | Cosmetic bugs, minor performance degradation |

---

## 📋 Incident Response Procedures

### **P0 - Critical Incident Response**

#### **Detection**
- **Automated**: PagerDuty alert fired
- **Manual**: User reports complete outage
- **Monitoring**: All pods showing as `CrashLoopBackOff` or `0/2 Ready`

#### **Immediate Actions** (0-15 minutes)
1. **Acknowledge incident** in PagerDuty
2. **Create incident channel** `#incident-aiflow-YYYYMMDD-NNN`
3. **Check cluster health**:
   ```bash
   kubectl get nodes
   kubectl get pods -n agents-staging
   kubectl describe deployment aiflow-social-agent -n agents-staging
   ```
4. **Check recent deployments**:
   ```bash
   kubectl rollout history deployment/aiflow-social-agent -n agents-staging
   ```

#### **Mitigation** (15-30 minutes)
1. **If recent deployment caused issue**:
   ```bash
   kubectl rollout undo deployment/aiflow-social-agent -n agents-staging
   kubectl rollout status deployment/aiflow-social-agent -n agents-staging
   ```

2. **If infrastructure issue**:
   ```bash
   # Scale up replicas
   kubectl scale deployment aiflow-social-agent --replicas=4 -n agents-staging
   
   # Check node resources
   kubectl top nodes
   kubectl describe nodes
   ```

3. **If configuration issue**:
   ```bash
   # Check ConfigMap/Secret
   kubectl get configmap aiflow-agent-config -n agents-staging -o yaml
   kubectl get secret aiflow-agent-secrets -n agents-staging
   ```

#### **Communication** (Ongoing)
- **Status page**: Update status.agent-buildkit.orb.local
- **Slack**: Post updates every 15 minutes in `#incidents`
- **Email**: Notify stakeholders if outage > 1 hour

#### **Resolution** (30-60 minutes)
1. **Verify health**:
   ```bash
   kubectl get pods -n agents-staging
   kubectl logs -f deployment/aiflow-social-agent -n agents-staging
   curl http://aiflow-social-agent.agents-staging.svc.cluster.local:8000/health
   ```

2. **Run smoke tests**:
   ```bash
   k6 run load-tests/k6-load-test.js --vus 5 --duration 1m
   ```

3. **Monitor metrics** for 30 minutes
4. **Close incident** with postmortem assigned

---

### **P1 - High Severity Incident Response**

#### **Detection**
- Error rate > 10%
- BuildKit heartbeat failures
- Phoenix tracing shows high failure rates

#### **Response** (0-60 minutes)
1. **Investigate logs**:
   ```bash
   kubectl logs --tail=100 -l app=aiflow-social-agent -n agents-staging
   kubectl logs --previous -l app=aiflow-social-agent -n agents-staging  # Check previous pod
   ```

2. **Check dependencies**:
   ```bash
   # BuildKit registry
   kubectl get pods -n agent-buildkit
   curl http://buildkit.agent-buildkit.svc.cluster.local/api/v1/health
   
   # OTEL collector
   kubectl get pods -n observability
   ```

3. **Scale if needed**:
   ```bash
   kubectl scale deployment aiflow-social-agent --replicas=5 -n agents-staging
   ```

4. **Apply hotfix** if identified

---

### **P2 - Medium Severity Incident Response**

#### **Detection**
- P95 latency > 1 second
- Occasional 5xx errors
- Memory/CPU approaching limits

#### **Response** (0-4 hours)
1. **Collect data**:
   ```bash
   # Resource usage
   kubectl top pods -n agents-staging
   
   # HPA status
   kubectl get hpa aiflow-social-agent -n agents-staging
   
   # Recent events
   kubectl get events -n agents-staging --sort-by='.lastTimestamp' | head -20
   ```

2. **Optimize if needed**:
   ```bash
   # Increase resource limits
   kubectl set resources deployment aiflow-social-agent \
     --limits=cpu=2000m,memory=2Gi \
     --requests=cpu=500m,memory=512Mi \
     -n agents-staging
   ```

3. **Schedule fix** for next deployment cycle

---

## 🔍 **Diagnostic Commands**

### **Pod Health**
```bash
# Get pod status
kubectl get pods -n agents-staging -o wide

# Describe pod
kubectl describe pod <pod-name> -n agents-staging

# Check logs
kubectl logs <pod-name> -n agents-staging --tail=100 -f

# Exec into pod
kubectl exec -it <pod-name> -n agents-staging -- /bin/sh

# Check resource usage
kubectl top pod <pod-name> -n agents-staging
```

### **Deployment Health**
```bash
# Get deployment status
kubectl get deployment aiflow-social-agent -n agents-staging

# Check rollout status
kubectl rollout status deployment/aiflow-social-agent -n agents-staging

# View rollout history
kubectl rollout history deployment/aiflow-social-agent -n agents-staging

# Check HPA
kubectl get hpa aiflow-social-agent -n agents-staging
kubectl describe hpa aiflow-social-agent -n agents-staging
```

### **Service Health**
```bash
# Check service endpoints
kubectl get endpoints aiflow-social-agent -n agents-staging

# Test service internally
kubectl run test-pod --rm -it --image=curlimages/curl:latest -- \
  curl http://aiflow-social-agent.agents-staging.svc.cluster.local:8000/health

# Check ingress
kubectl get ingress -n agents-staging
```

### **Metrics & Observability**
```bash
# Prometheus metrics
kubectl port-forward svc/aiflow-social-agent 8000:8000 -n agents-staging
curl localhost:8000/metrics | grep aiflow_

# Phoenix traces
open http://phoenix.agent-buildkit.orb.local:6006/projects/aiflow-social-agents

# Grafana dashboard
open http://grafana.agent-buildkit.orb.local/d/aiflow-dashboard
```

---

## 🔄 **Rollback Procedures**

### **1. Quick Rollback** (< 2 minutes)
```bash
# Rollback to previous version
kubectl rollout undo deployment/aiflow-social-agent -n agents-staging

# Rollback to specific revision
kubectl rollout undo deployment/aiflow-social-agent --to-revision=3 -n agents-staging

# Verify rollback
kubectl rollout status deployment/aiflow-social-agent -n agents-staging
kubectl get pods -n agents-staging
```

### **2. Manual Rollback** (via GitLab CI)
```bash
# Trigger rollback job in GitLab CI
# Navigate to: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/pipelines
# Click: "rollback:production" job → "Play" button
```

### **3. Emergency Manual Deployment**
```bash
# Deploy specific image version
kubectl set image deployment/aiflow-social-agent \
  aiflow-agent=registry.bluefly.io/llm/aiflow-social-agent:<GOOD_VERSION> \
  -n agents-staging

# Wait for rollout
kubectl rollout status deployment/aiflow-social-agent -n agents-staging
```

---

## 📊 **Post-Incident Actions**

### **Immediately After Resolution**
1. ✅ **Update status page** - Mark as resolved
2. ✅ **Close PagerDuty incident**
3. ✅ **Post resolution message** in `#incidents`
4. ✅ **Verify metrics** returned to baseline
5. ✅ **Monitor for 30 minutes** to ensure stability

### **Within 24 Hours**
1. ✅ **Create postmortem document**:
   - **What happened**: Timeline of events
   - **Root cause**: Technical analysis
   - **Impact**: Users affected, duration, error budget consumed
   - **Resolution**: What fixed it
   - **Action items**: Preventive measures

2. ✅ **Create GitLab issues** for action items

3. ✅ **Update runbooks** if new procedures discovered

### **Within 1 Week**
1. ✅ **Postmortem review** meeting with team
2. ✅ **Implement preventive** measures
3. ✅ **Update alerts** if false positive/negative
4. ✅ **Test incident response** procedures

---

## 📞 **Escalation Contacts**

| Role | Contact | Escalation Time |
|------|---------|-----------------|
| **On-Call Engineer** | PagerDuty rotation | Immediate |
| **Team Lead** | Slack: @team-lead | After 30 min |
| **Platform Engineering** | #platform-oncall | Infrastructure issues |
| **BuildKit Team** | #buildkit-support | Registry issues |
| **Security Team** | #security-oncall | Security incidents |

---

## 🧪 **Testing Incident Response**

### **Monthly Drills**
```bash
# Simulate pod failure
kubectl delete pod -l app=aiflow-social-agent -n agents-staging

# Simulate high load
k6 run load-tests/k6-load-test.js --vus 500 --duration 5m

# Simulate configuration error
kubectl patch configmap aiflow-agent-config -n agents-staging \
  --patch '{"data":{"app.yaml":"invalid: yaml"}}'
```

### **Quarterly Game Days**
- **Chaos engineering**: Random pod deletions
- **Network partitions**: Simulate BuildKit unavailability
- **Resource exhaustion**: Limit node resources
- **Rollback drill**: Practice emergency rollbacks

---

## 📚 **Additional Resources**

- **Grafana Dashboard**: http://grafana.agent-buildkit.orb.local/d/aiflow-dashboard
- **Phoenix Traces**: http://phoenix.agent-buildkit.orb.local:6006/projects/aiflow-social-agents
- **GitLab CI/CD**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/pipelines
- **Status Page**: http://status.agent-buildkit.orb.local
- **Documentation**: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis/home

---

**Last Updated**: October 23, 2025  
**Version**: 1.0.0  
**Owner**: AIFlow Team

