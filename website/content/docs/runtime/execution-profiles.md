---
title: Execution Profiles
description: OSSA v0.3.2 Execution Profiles - fast, balanced, deep, and safe profiles for agent execution configuration
---

# OSSA Execution Profiles

Execution profiles provide pre-configured settings for different agent execution scenarios. They control LLM parameters, validation requirements, and runtime behavior to optimize for speed, thoroughness, or safety.

## Overview

OSSA v0.3.2 defines four standard execution profiles:

| Profile | Use Case | Token Limit | Temperature | Key Features |
|---------|----------|-------------|-------------|--------------|
| `fast` | Quick responses, triage | 4,000 | 0.0-0.3 | Minimal validation |
| `balanced` | Standard operations | 16,000 | 0.1-0.5 | Default profile |
| `deep` | Complex analysis | 32,000+ | 0.0-0.2 | Extended reasoning |
| `safe` | Compliance, security | Variable | 0.0 | Full audit logging |

## Profile Configuration

### Basic Structure

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

spec:
  execution_profile:
    default: balanced
    profiles:
      fast:
        maxTokens: 4000
        temperature: 0.0
        description: "Quick triage and responses"
      balanced:
        maxTokens: 16000
        temperature: 0.1
        description: "Standard operations"
      deep:
        maxTokens: 32000
        temperature: 0.0
        reasoning_enabled: true
        description: "Deep analysis and reasoning"
      safe:
        temperature: 0.0
        validation_required: true
        audit_log: true
        description: "Compliance-grade execution"
```

### Profile Selection

Profiles can be selected at runtime via environment variables:

```yaml
spec:
  llm:
    profile: ${LLM_PROFILE:-balanced}
  
  execution_profile:
    default: ${LLM_PROFILE:-balanced}
```

## Profile Definitions

### Fast Profile

Optimized for quick responses and triage operations.

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

spec:
  execution_profile:
    profiles:
      fast:
        maxTokens: 4000
        temperature: 0.0
        description: "Quick triage and responses"
        
        # Reduced timeouts
        timeout_seconds: 30
        
        # Skip optional validations
        validation_required: false
        
        # Minimal reasoning
        reasoning_enabled: false
        
        # No audit overhead
        audit_log: false
```

**Use Cases:**
- Initial query classification
- Simple Q&A responses
- Status checks and health pings
- Quick data lookups

**Trade-offs:**
- Lower token limits may truncate complex outputs
- No extended reasoning capabilities
- Reduced validation may miss edge cases

### Balanced Profile

Default profile for standard agent operations.

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

spec:
  execution_profile:
    profiles:
      balanced:
        maxTokens: 16000
        temperature: 0.1
        description: "Standard operations"
        
        # Standard timeouts
        timeout_seconds: 300
        
        # Basic validation
        validation_required: true
        
        # Standard reasoning
        reasoning_enabled: false
        
        # Selective audit logging
        audit_log: false
```

**Use Cases:**
- General-purpose agent tasks
- Customer support interactions
- Code assistance and reviews
- Data analysis and reporting

**Trade-offs:**
- Balanced between speed and thoroughness
- Suitable for most production workloads
- May need profile upgrade for complex tasks

### Deep Profile

Extended capabilities for complex analysis and reasoning.

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

spec:
  execution_profile:
    profiles:
      deep:
        maxTokens: 32000
        temperature: 0.0
        description: "Deep analysis and reasoning"
        
        # Extended timeouts
        timeout_seconds: 600
        
        # Strict validation
        validation_required: true
        
        # Enable extended reasoning (chain-of-thought)
        reasoning_enabled: true
        
        # Optional audit for analysis
        audit_log: false
        
        # Additional deep profile settings
        max_iterations: 20
        reflection_enabled: true
```

**Use Cases:**
- Complex problem solving
- Multi-step reasoning tasks
- Threat analysis and security reviews
- Research and deep investigation
- Code architecture analysis

**Trade-offs:**
- Higher token costs
- Longer execution times
- More computational resources

### Safe Profile

Compliance-grade execution with full audit trails.

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

spec:
  execution_profile:
    profiles:
      safe:
        temperature: 0.0
        description: "Compliance-grade execution"
        
        # Deterministic output
        temperature: 0.0
        top_p: 1.0
        
        # All validations required
        validation_required: true
        
        # Full audit logging
        audit_log: true
        
        # Human approval gates
        require_approval: true
        
        # Strict output validation
        output_validation: strict
        
        # No caching (fresh computation)
        cache_enabled: false
```

**Use Cases:**
- Security scanning and compliance
- Financial operations
- Healthcare and regulated industries
- Legal document processing
- Data privacy operations

**Trade-offs:**
- Slowest execution profile
- Highest operational overhead
- May require human-in-the-loop

## Profile Configuration Options

### LLM Parameters

| Parameter | Type | Description | Range |
|-----------|------|-------------|-------|
| `maxTokens` | integer | Maximum output tokens | 1000-200000 |
| `temperature` | number | Randomness (0=deterministic) | 0.0-2.0 |
| `topP` | number | Nucleus sampling | 0.0-1.0 |
| `topK` | integer | Top-K sampling | 1-100 |
| `frequencyPenalty` | number | Repetition penalty | -2.0-2.0 |
| `presencePenalty` | number | Topic diversity | -2.0-2.0 |

### Execution Settings

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| `timeout_seconds` | integer | Execution timeout | 300 |
| `max_iterations` | integer | Max plan-act-reflect cycles | 10 |
| `validation_required` | boolean | Require input/output validation | true |
| `reasoning_enabled` | boolean | Enable extended reasoning | false |
| `reflection_enabled` | boolean | Enable reflection phase | true |
| `cache_enabled` | boolean | Enable response caching | true |

### Audit and Compliance

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| `audit_log` | boolean | Enable audit logging | false |
| `require_approval` | boolean | Require human approval | false |
| `output_validation` | string | Validation level (none, basic, strict) | basic |
| `pii_detection` | boolean | Detect PII in outputs | false |
| `compliance_mode` | string | Compliance standard (ossa, hipaa, sox, pci) | ossa |

## Runtime Profile Selection

### Environment Variables

```bash
# Set default profile
export LLM_PROFILE=balanced

# Override for specific runs
LLM_PROFILE=deep ossa run my-agent
```

### Agent Manifest

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

spec:
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet}
    profile: ${LLM_PROFILE:-balanced}
    
    # Profile-based parameters
    temperature: ${LLM_TEMPERATURE:-0.1}
    maxTokens: ${LLM_MAX_TOKENS:-16000}
```

### Dynamic Profile Switching

Agents can switch profiles during execution based on task requirements:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

spec:
  capabilities:
    - name: security_scan
      type: action
      execution_profile: safe  # Override for this capability
      
    - name: quick_check
      type: query
      execution_profile: fast  # Quick responses
      
    - name: deep_analysis
      type: action
      execution_profile: deep  # Complex analysis
```

## Complete Example

A security scanner agent with profile-aware execution:

```yaml
apiVersion: ossa/v0.3.0
kind: Agent

metadata:
  name: security-scanner
  version: 1.0.0
  description: Security scanner with profile-aware execution

spec:
  # LLM Configuration with Profile
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet}
    profile: ${LLM_PROFILE:-safe}
    
    temperature: ${LLM_TEMPERATURE:-0.0}
    maxTokens: ${LLM_MAX_TOKENS:-16000}
    topP: ${LLM_TOP_P:-0.9}

    # Multi-provider fallback
    fallback_models:
      - provider: ${LLM_FALLBACK_PROVIDER_1:-openai}
        model: ${LLM_FALLBACK_MODEL_1:-gpt-4o}
        condition: on_error
      - provider: ${LLM_FALLBACK_PROVIDER_2:-google}
        model: ${LLM_FALLBACK_MODEL_2:-gemini-2.0-flash}
        condition: on_rate_limit

    retry_config:
      max_attempts: ${LLM_RETRY_ATTEMPTS:-3}
      backoff_strategy: ${LLM_BACKOFF_STRATEGY:-exponential}
      initial_delay_ms: 1000
      max_delay_ms: 30000

  # Execution Profiles
  execution_profile:
    default: ${LLM_PROFILE:-safe}
    profiles:
      fast:
        maxTokens: 4000
        temperature: 0.0
        description: "Quick triage scans"
        timeout_seconds: 30
        validation_required: false
        audit_log: false

      balanced:
        maxTokens: 16000
        temperature: 0.1
        description: "Standard security analysis"
        timeout_seconds: 300
        validation_required: true
        audit_log: false

      deep:
        maxTokens: 32000
        temperature: 0.0
        reasoning_enabled: true
        description: "Deep threat analysis"
        timeout_seconds: 600
        validation_required: true
        reflection_enabled: true
        max_iterations: 20

      safe:
        temperature: 0.0
        validation_required: true
        audit_log: true
        description: "Compliance-grade scanning"
        timeout_seconds: 900
        require_approval: true
        output_validation: strict
        pii_detection: true
        compliance_mode: ossa

  # Runtime Configuration
  runtime:
    type: ${AGENT_RUNTIME:-unified}
    supports:
      - google-a2a
      - gitlab-duo
      - ossa-mesh
      - mcp
      - local-execution

    scheduling:
      strategy: ${AGENT_SCHEDULING:-priority}
      priority: ${AGENT_PRIORITY:-high}
      max_concurrent: ${AGENT_MAX_CONCURRENT:-5}
      timeout_seconds: ${AGENT_TIMEOUT:-600}

    resource_limits:
      memory_mb: ${AGENT_MEMORY_MB:-1024}
      cpu_millicores: ${AGENT_CPU_MILLICORES:-1000}

  # Capabilities with Profile Overrides
  capabilities:
    - name: quick_scan
      type: action
      execution_profile: fast
      description: "Quick security triage"
      timeout_seconds: 30

    - name: standard_scan
      type: action
      execution_profile: balanced
      description: "Standard security analysis"
      timeout_seconds: 300

    - name: deep_scan
      type: action
      execution_profile: deep
      description: "Deep threat investigation"
      timeout_seconds: 600

    - name: compliance_scan
      type: action
      execution_profile: safe
      description: "Compliance-grade security audit"
      timeout_seconds: 900

  # Observability
  observability:
    tracing:
      enabled: true
      exporter: otlp
      endpoint: ${OTEL_EXPORTER_OTLP_ENDPOINT}
    metrics:
      enabled: true
      port: 9090
    logging:
      level: ${LOG_LEVEL:-info}
      format: json
      audit_enabled: true
```

## Profile Recommendations

### By Use Case

| Use Case | Recommended Profile | Rationale |
|----------|---------------------|-----------|
| Chatbots | `balanced` | Good response quality with reasonable latency |
| Code Review | `deep` | Complex analysis benefits from extended reasoning |
| Security Scanning | `safe` | Compliance requirements demand audit trails |
| Quick Lookups | `fast` | Simple queries don't need extended processing |
| Customer Support | `balanced` | Balance between speed and quality |
| Financial Analysis | `safe` | Regulatory compliance requirements |
| Research Tasks | `deep` | Complex multi-step reasoning |

### By Industry

| Industry | Default Profile | Notes |
|----------|-----------------|-------|
| Healthcare | `safe` | HIPAA compliance, PII protection |
| Finance | `safe` | SOX, PCI-DSS requirements |
| E-commerce | `balanced` | Performance with quality |
| Legal | `safe` | Audit trails, document accuracy |
| Software Dev | `deep` | Complex code analysis |

## Related Specifications

- [Memory Model](/docs/runtime/memory-model) - Agent memory management
- [Runtime Specification](/docs/architecture/execution-flow) - Agent lifecycle
- [Access Tiers](/docs/access-tiers/overview) - Permission levels
- [LLM Configuration](/docs/configuration/llm-providers) - Provider setup

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.3.2 | 2025-01 | Added execution profiles with fast, balanced, deep, and safe configurations |
