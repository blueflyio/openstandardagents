# OSSA Monitoring Stack

Prometheus + Grafana monitoring for OSSA agents and GitLab agent.

## Quick Deploy

```bash
# Deploy everything
./deploy.sh

# Or manually
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-prometheus.yaml
kubectl apply -f 02-grafana.yaml
```

## Access Dashboards

### Prometheus
```bash
kubectl port-forward -n monitoring svc/prometheus 9090:9090
```
Open: http://localhost:9090

### Grafana
```bash
kubectl port-forward -n monitoring svc/grafana 3000:3000
```
Open: http://localhost:3000  
Default: `admin` / `admin`

## What's Monitored

- **GitLab Agent** (gitlab-agent namespace)
- **OSSA Agents** (ossa-agents namespace)
- **Kubernetes Metrics**

## Check Status

```bash
# Pods
kubectl get pods -n monitoring

# Services
kubectl get svc -n monitoring

# Logs
kubectl logs -n monitoring -l app=prometheus
kubectl logs -n monitoring -l app=grafana
```

## Cleanup

```bash
kubectl delete namespace monitoring
```

## Next Steps

1. Deploy agents with metrics annotations:
```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "9090"
    prometheus.io/path: "/metrics"
```

2. Import Grafana dashboards
3. Configure alerts
4. Add Jaeger for tracing

See: `.gitlab/docs/MONITORING-OBSERVABILITY.md`
