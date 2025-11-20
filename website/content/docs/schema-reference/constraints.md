---
title: "Constraints"
description: "Cost, performance, and resource constraints configuration"
weight: 7
---

# Constraints Object

The `constraints` object in `spec.constraints` defines operational limits for cost, performance, and resource usage. Constraints prevent runaway costs, ensure SLAs, and manage resource allocation.

## Field Reference

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `cost` | [Cost](#cost-constraints) | No | Cost and token usage limits |
| `performance` | [Performance](#performance-constraints) | No | Latency, concurrency, and timeout settings |
| `resources` | [Resources](#resource-constraints) | No | CPU, memory, and GPU allocation (Kubernetes format) |

## Cost Constraints

Cost constraints prevent excessive LLM API usage and spending.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `maxTokensPerDay` | integer | No | Maximum tokens allowed per day (input + output combined). Minimum: 0 |
| `maxTokensPerRequest` | integer | No | Maximum tokens per individual request. Minimum: 0 |
| `maxCostPerDay` | number | No | Maximum cost per day in specified currency. Minimum: 0 |
| `currency` | string | No | ISO 4217 currency code (3 uppercase letters). Default: `USD` |

### Examples

```yaml
# Moderate daily limits
constraints:
  cost:
    maxTokensPerDay: 1000000      # 1M tokens/day
    maxTokensPerRequest: 10000    # 10K tokens/request
    maxCostPerDay: 50.0          # $50/day
    currency: USD

# High-volume agent
constraints:
  cost:
    maxTokensPerDay: 50000000     # 50M tokens/day
    maxTokensPerRequest: 100000   # 100K tokens/request
    maxCostPerDay: 500.0
    currency: USD

# Experimental/testing
constraints:
  cost:
    maxTokensPerDay: 100000       # 100K tokens/day
    maxCostPerDay: 5.0
    currency: USD

# European deployment
constraints:
  cost:
    maxTokensPerDay: 5000000
    maxCostPerDay: 200.0
    currency: EUR
```

### Cost Calculation

Cost tracking varies by provider:

**OpenAI:**
```yaml
# GPT-4o: $2.50/1M input, $10.00/1M output
constraints:
  cost:
    maxTokensPerDay: 1000000
    maxCostPerDay: 10.0
```

**Anthropic:**
```yaml
# Claude 3.5 Sonnet: $3.00/1M input, $15.00/1M output
constraints:
  cost:
    maxTokensPerDay: 1000000
    maxCostPerDay: 15.0
```

**Note:** Platforms typically estimate cost based on provider pricing. For precise cost control, use both token and cost limits.

## Performance Constraints

Performance constraints ensure latency SLAs and prevent resource exhaustion.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `maxLatencySeconds` | number | No | Maximum acceptable latency per request in seconds. Minimum: 0 |
| `maxConcurrentRequests` | integer | No | Maximum concurrent requests the agent can handle. Minimum: 1 |
| `timeoutSeconds` | number | No | Request timeout in seconds. Minimum: 0 |

### Examples

```yaml
# Low-latency requirements (chatbot)
constraints:
  performance:
    maxLatencySeconds: 3
    maxConcurrentRequests: 100
    timeoutSeconds: 10

# Batch processing
constraints:
  performance:
    maxLatencySeconds: 60
    maxConcurrentRequests: 10
    timeoutSeconds: 300

# High-throughput
constraints:
  performance:
    maxLatencySeconds: 10
    maxConcurrentRequests: 1000
    timeoutSeconds: 30

# Background tasks
constraints:
  performance:
    maxLatencySeconds: 300
    maxConcurrentRequests: 5
    timeoutSeconds: 3600
```

### Latency vs. Timeout

- **maxLatencySeconds:** Expected/desired latency. Platform may log warnings if exceeded.
- **timeoutSeconds:** Hard cutoff. Requests exceeding timeout are terminated.

```yaml
constraints:
  performance:
    maxLatencySeconds: 5      # Warn if response takes > 5s
    timeoutSeconds: 30        # Kill request after 30s
```

## Resource Constraints

Resource constraints define CPU, memory, and GPU allocation. Uses Kubernetes resource format.

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `cpu` | string | No | CPU limit in Kubernetes format. Examples: `100m`, `1`, `2.5` |
| `memory` | string | No | Memory limit in Kubernetes format. Examples: `128Mi`, `1Gi`, `4Gi` |
| `gpu` | string | No | GPU requirement (format varies by platform) |

### CPU Format

**Millicores (`m`):**
```yaml
resources:
  cpu: "100m"    # 0.1 CPU core
  cpu: "500m"    # 0.5 CPU core
  cpu: "1000m"   # 1 CPU core
```

**Cores (integer or decimal):**
```yaml
resources:
  cpu: "1"       # 1 CPU core
  cpu: "2"       # 2 CPU cores
  cpu: "0.5"     # 0.5 CPU core
  cpu: "4.5"     # 4.5 CPU cores
```

### Memory Format

**Mebibytes (`Mi`):**
```yaml
resources:
  memory: "128Mi"   # 128 MiB
  memory: "512Mi"   # 512 MiB
  memory: "1024Mi"  # 1 GiB
```

**Gibibytes (`Gi`):**
```yaml
resources:
  memory: "1Gi"     # 1 GiB
  memory: "2Gi"     # 2 GiB
  memory: "16Gi"    # 16 GiB
```

**Other units:**
```yaml
resources:
  memory: "1000M"   # 1000 MB (decimal)
  memory: "1G"      # 1 GB (decimal)
```

### GPU Requirement

GPU format is platform-specific:

```yaml
# NVIDIA GPU count
resources:
  gpu: "1"

# Specific GPU type
resources:
  gpu: "nvidia-tesla-v100"

# GPU memory
resources:
  gpu: "16Gi"
```

### Resource Examples

```yaml
# Minimal (lightweight agent)
constraints:
  resources:
    cpu: "100m"
    memory: "128Mi"

# Small (chatbot)
constraints:
  resources:
    cpu: "500m"
    memory: "512Mi"

# Medium (code analysis)
constraints:
  resources:
    cpu: "1"
    memory: "2Gi"

# Large (data processing)
constraints:
  resources:
    cpu: "4"
    memory: "8Gi"

# GPU workload
constraints:
  resources:
    cpu: "8"
    memory: "32Gi"
    gpu: "1"
```

## Complete Examples

### Production Chatbot

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: customer-chatbot
  version: 1.0.0
spec:
  role: You are a customer support chatbot.

  llm:
    provider: anthropic
    model: claude-3-5-haiku-20241022
    temperature: 0.7
    maxTokens: 1024

  constraints:
    cost:
      maxTokensPerDay: 10000000      # 10M tokens/day
      maxTokensPerRequest: 2048      # 2K tokens/request
      maxCostPerDay: 100.0
      currency: USD
    performance:
      maxLatencySeconds: 3           # Fast responses
      maxConcurrentRequests: 500     # High throughput
      timeoutSeconds: 10
    resources:
      cpu: "2"
      memory: "4Gi"
```

### Background Data Analyzer

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: data-analyzer
  version: 1.5.0
spec:
  role: You are a data analysis specialist.

  llm:
    provider: openai
    model: gpt-4o
    temperature: 0.2
    maxTokens: 8192

  constraints:
    cost:
      maxTokensPerDay: 50000000      # 50M tokens/day
      maxCostPerDay: 500.0
      currency: USD
    performance:
      maxLatencySeconds: 60          # Not time-critical
      maxConcurrentRequests: 10      # Batch processing
      timeoutSeconds: 600            # 10 minute timeout
    resources:
      cpu: "4"
      memory: "16Gi"
```

### Development/Testing Agent

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: dev-assistant
  version: 0.1.0
spec:
  role: Development and testing assistant.

  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022

  constraints:
    cost:
      maxTokensPerDay: 100000        # Limited for testing
      maxCostPerDay: 5.0
      currency: USD
    performance:
      maxLatencySeconds: 10
      maxConcurrentRequests: 5
      timeoutSeconds: 30
    resources:
      cpu: "500m"
      memory: "1Gi"
```

### High-Performance Code Generator

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: code-generator
  version: 2.0.0
spec:
  role: You are an expert code generator.

  llm:
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.2
    maxTokens: 8192

  constraints:
    cost:
      maxTokensPerDay: 100000000     # 100M tokens/day
      maxTokensPerRequest: 16384     # Long responses
      maxCostPerDay: 1000.0
      currency: USD
    performance:
      maxLatencySeconds: 15
      maxConcurrentRequests: 100
      timeoutSeconds: 60
    resources:
      cpu: "8"
      memory: "32Gi"
```

### Cost-Optimized Agent

```yaml
apiVersion: ossa/v0.2.4
kind: Agent
metadata:
  name: budget-agent
  version: 1.0.0
spec:
  role: Cost-optimized assistant.

  llm:
    provider: anthropic
    model: claude-3-5-haiku-20241022  # Cheapest model
    temperature: 0.5
    maxTokens: 512                    # Short responses

  constraints:
    cost:
      maxTokensPerDay: 500000         # Tight limit
      maxTokensPerRequest: 1024
      maxCostPerDay: 5.0              # Low budget
      currency: USD
    performance:
      maxLatencySeconds: 5
      maxConcurrentRequests: 50
      timeoutSeconds: 15
    resources:
      cpu: "250m"                     # Minimal resources
      memory: "256Mi"
```

## Multi-Currency Support

```yaml
# United States
constraints:
  cost:
    maxCostPerDay: 100.0
    currency: USD

# European Union
constraints:
  cost:
    maxCostPerDay: 90.0
    currency: EUR

# United Kingdom
constraints:
  cost:
    maxCostPerDay: 80.0
    currency: GBP

# Canada
constraints:
  cost:
    maxCostPerDay: 135.0
    currency: CAD
```

**Currency validation:**
- Must be 3 uppercase letters
- Should be valid ISO 4217 code
- Platform converts to provider's billing currency

## Constraint Enforcement

How constraints are enforced varies by platform:

### Cost Constraints
- **Soft limits:** Log warnings, continue operation
- **Hard limits:** Reject new requests when limit reached
- **Reset period:** Typically 24 hours from first request

### Performance Constraints
- **maxLatencySeconds:** Monitoring/alerting threshold
- **maxConcurrentRequests:** Queue or reject excess requests
- **timeoutSeconds:** Hard cutoff, terminate request

### Resource Constraints
- **Kubernetes:** Enforced by kubelet
- **Docker:** Enforced by container runtime
- **Serverless:** Enforced by platform

## Best Practices

1. **Set realistic limits** - Based on expected usage patterns
2. **Monitor regularly** - Track actual usage vs. constraints
3. **Start conservative** - Tighten constraints after observing usage
4. **Account for spikes** - Set limits above normal usage
5. **Use both cost metrics** - Tokens AND currency for better control
6. **Match timeout to task** - Long-running tasks need higher timeouts
7. **Resource padding** - Add 20-30% buffer to resource requests
8. **Test limits** - Validate constraints work as expected
9. **Alert on limits** - Monitor constraint violations
10. **Document choices** - Explain constraint rationale in comments

## Common Constraint Patterns

### High-Volume Low-Cost

```yaml
constraints:
  cost:
    maxTokensPerDay: 100000000
    maxCostPerDay: 100.0
  performance:
    maxConcurrentRequests: 1000
  resources:
    cpu: "4"
    memory: "8Gi"
```

### Low-Volume High-Quality

```yaml
constraints:
  cost:
    maxTokensPerDay: 1000000
    maxCostPerDay: 200.0
  performance:
    maxLatencySeconds: 5
    maxConcurrentRequests: 10
  resources:
    cpu: "2"
    memory: "4Gi"
```

### Batch Processing

```yaml
constraints:
  cost:
    maxTokensPerDay: 50000000
    maxCostPerDay: 500.0
  performance:
    maxLatencySeconds: 300
    timeoutSeconds: 3600
    maxConcurrentRequests: 5
  resources:
    cpu: "8"
    memory: "32Gi"
```

## Validation

All constraint fields are optional.

**Numeric validation:**
- All numeric values must be >= 0
- `maxConcurrentRequests` minimum: 1
- `currency` pattern: `^[A-Z]{3}$`

**Resource format:**
- `cpu`: Kubernetes CPU format
- `memory`: Kubernetes memory format
- `gpu`: Platform-specific format

## Related Objects

- [Agent Spec](./agent-spec.md) - Parent object containing constraints
- [LLM Configuration](./llm-config.md) - Model configuration affecting cost
- [Observability](./observability.md) - Monitoring constraint violations
- [Autonomy](./autonomy.md) - Action limits complement constraints

## See Also

- [Kubernetes Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [LLM Pricing Calculators](https://artificialanalysis.ai/models)
