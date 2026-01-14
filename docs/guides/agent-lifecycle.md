# Agent Lifecycle Management

Complete guide to managing agents from registration to retirement.

## Agent Lifecycle States

```
┌──────────────┐
│   Pending    │ ← Initial registration
└──────┬───────┘
       │
       ↓
┌──────────────┐
│    Active    │ ← Available for discovery and execution
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Deprecated  │ ← Scheduled for retirement
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   Archived   │ ← Removed from active registry
└──────────────┘
```

## Phase 1: Registration

### Create and Validate Manifest

```bash
# Validate before registration
curl -X POST https://api.llm.bluefly.io/ossa/v1/specification/validate \
  -H "X-API-Key: $OSSA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @agent-manifest.json
```

### Register Agent

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/agents \
  -H "X-API-Key: $OSSA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @agent-manifest.json
```

## Phase 2: Activation

Activate a pending agent:

```bash
curl -X PATCH https://api.llm.bluefly.io/ossa/v1/agents/{agentId}/status \
  -H "X-API-Key: $OSSA_API_KEY" \
  -d '{"status": "active"}'
```

## Phase 3: Updates

### Version Updates

Update to new version:

```bash
curl -X PUT https://api.llm.bluefly.io/ossa/v1/agents/{agentId} \
  -H "X-API-Key: $OSSA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": { "version": "2.0.0" },
    "spec": { ... }
  }'
```

### Configuration Updates

Update LLM settings:

```bash
curl -X PATCH https://api.llm.bluefly.io/ossa/v1/agents/{agentId} \
  -H "X-API-Key: $OSSA_API_KEY" \
  -d '{
    "spec": {
      "llm": {
        "temperature": 0.5
      }
    }
  }'
```

## Phase 4: Monitoring

### Health Checks

Monitor agent health:

```bash
curl https://api.llm.bluefly.io/ossa/v1/agents/{agentId} \
  -H "X-API-Key: $OSSA_API_KEY"
```

### Metrics

Track performance metrics:

```bash
curl https://api.llm.bluefly.io/ossa/v1/agents/{agentId}/metrics \
  -H "X-API-Key: $OSSA_API_KEY"
```

## Phase 5: Deprecation

Mark agent for retirement:

```bash
curl -X PATCH https://api.llm.bluefly.io/ossa/v1/agents/{agentId}/status \
  -H "X-API-Key: $OSSA_API_KEY" \
  -d '{
    "status": "deprecated",
    "reason": "Replaced by v2.0",
    "replacement": "agt_new_version"
  }'
```

## Phase 6: Archival

Remove from active registry:

```bash
curl -X DELETE https://api.llm.bluefly.io/ossa/v1/agents/{agentId} \
  -H "X-API-Key: $OSSA_API_KEY"
```

## Best Practices

1. **Validate before register** - Always validate manifests
2. **Use semantic versioning** - Follow SemVer for versions
3. **Monitor health** - Track agent performance
4. **Graceful deprecation** - Provide migration path
5. **Document changes** - Maintain changelog

## See Also

- [Agent Registry API](../openapi/agents.md)
- [Getting Started Guide](getting-started.md)
- [API Examples](../api-reference/examples.md)
