# OpenAI Swarm Integration Guide

Complete guide for integrating OpenAI Swarm patterns with OSSA v0.3.6.

## Table of Contents

- [Overview](#overview)
- [Why Integrate?](#why-integrate)
- [Architecture Comparison](#architecture-comparison)
- [Core Concepts Mapping](#core-concepts-mapping)
- [Migration Guide](#migration-guide)
- [Integration Patterns](#integration-patterns)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Overview

**OpenAI Swarm** is an experimental, educational framework for building lightweight multi-agent systems. It excels at demonstrating agent orchestration patterns but lacks production-ready features.

**OSSA (Open Standard for Secure Agents)** is a production-ready specification that provides:
- Declarative agent configuration
- Cross-platform deployment
- Enterprise security and governance
- Built-in observability and compliance
- Vendor-neutral architecture

This guide shows how to migrate Swarm agents to OSSA while gaining enterprise capabilities.

## Why Integrate?

### OpenAI Swarm Strengths

- **Simple API**: Easy to understand and get started
- **Lightweight**: Minimal overhead for simple use cases
- **Educational**: Great for learning multi-agent concepts
- **Python-native**: Familiar to Python developers

### OpenAI Swarm Limitations

| Limitation | Impact | OSSA Solution |
|------------|--------|---------------|
| **Experimental status** | Not production-ready | Production-ready specification |
| **Python-only** | Can't deploy to other runtimes | Deploy to 10+ platforms |
| **Code-based config** | Hard to version control | Declarative YAML/JSON |
| **No authentication** | Manual auth implementation | Built-in OAuth2, JWT, etc. |
| **No observability** | Manual metrics/tracing | Built-in OpenTelemetry |
| **No cost controls** | Unlimited token usage | Token efficiency optimization |
| **No governance** | Manual compliance | Built-in policies |
| **Limited deployment** | Local/custom only | Kubernetes, Docker, Serverless |

### OSSA Benefits

**For Developers**:
- Keep using Swarm patterns you know
- Add enterprise features without code changes
- Version control agent configurations (GitOps)
- Test and validate agents automatically

**For Operations**:
- Deploy to any platform (Anthropic, OpenAI, Azure, GCP, AWS)
- Monitor agents with built-in observability
- Control costs with token efficiency
- Enforce security and compliance policies

**For Business**:
- Optimize LLM costs through intelligent token management
- Meet compliance requirements (SOC 2, GDPR, HIPAA)
- Scale agents across multiple providers
- Avoid vendor lock-in

## Architecture Comparison

### OpenAI Swarm Architecture

```python
# Code-based configuration
agent = Agent(
    name="Sales Agent",
    instructions="You are a sales agent...",
    functions=[transfer_to_support, place_order]
)

# Run agent
response = client.run(
    agent=agent,
    messages=messages,
    context_variables={"user_id": "123"}
)
```

**Characteristics**:
- Imperative (how to do it)
- Code-based (Python only)
- Runtime-specific (Swarm client required)
- Manual orchestration

### OSSA Architecture

```yaml
# Declarative configuration
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: sales-agent
spec:
  role: "You are a sales agent..."
  capabilities:
    - name: place_order
  handoffs:
    - target_agent: support-agent
```

**Characteristics**:
- Declarative (what to do)
- Config-based (YAML/JSON)
- Runtime-agnostic (deploy anywhere)
- Automatic orchestration

## Core Concepts Mapping

### 1. Agents

**Swarm Agent**:
```python
agent = Agent(
    name="Customer Service Agent",
    instructions="You help customers...",
    functions=[func1, func2]
)
```

**OSSA Agent**:
```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: customer-service-agent
  version: 1.0.0
spec:
  role: "You help customers..."
  capabilities:
    - name: func1
    - name: func2
```

### 2. Functions (Tools)

**Swarm Function**:
```python
def get_weather(location: str) -> str:
    """Get weather for a location."""
    return f"Weather in {location}: Sunny, 72°F"

agent = Agent(
    name="Weather Agent",
    functions=[get_weather]
)
```

**OSSA Capability**:
```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: weather-agent
spec:
  capabilities:
    - name: get_weather
      description: "Get weather for a location"
      input_schema:
        type: object
        properties:
          location:
            type: string
            description: "City or location name"
        required: [location]
      output_schema:
        type: object
        properties:
          weather:
            type: string
          temperature:
            type: number
```

**Key Differences**:
- OSSA uses JSON Schema for validation
- OSSA separates schema from implementation
- OSSA supports output schema validation

### 3. Handoffs (Transfer Functions)

**Swarm Handoff**:
```python
def transfer_to_sales():
    """Transfer to sales agent."""
    return sales_agent

triage_agent = Agent(
    name="Triage",
    functions=[transfer_to_sales, transfer_to_support]
)
```

**OSSA Handoff**:
```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: triage-agent
spec:
  handoffs:
    - name: route_to_sales
      target_agent: sales-agent
      condition: "intent == 'purchase'"
      trigger: automatic

    - name: route_to_support
      target_agent: support-agent
      condition: "intent == 'help'"
      trigger: automatic
```

**Key Differences**:
- OSSA uses declarative conditions (not code)
- OSSA supports automatic vs manual triggers
- OSSA tracks handoff metrics automatically

### 4. Context Variables

**Swarm Context**:
```python
response = client.run(
    agent=agent,
    messages=messages,
    context_variables={
        "user_id": "123",
        "session_id": "abc",
        "user_tier": "premium"
    }
)
```

**OSSA Context**:
```yaml
apiVersion: ossa/v0.3.6
kind: AgentExecution
metadata:
  name: customer-session
spec:
  agent: customer-service-agent
  context:
    user_id: "123"
    session_id: "abc"
    user_tier: "premium"

  # Control context propagation
  context_propagation:
    mode: selective
    allowed_fields: [user_id, session_id, user_tier]
    sensitive_fields: [payment_info, ssn]
```

**Key Differences**:
- OSSA provides context propagation controls
- OSSA supports sensitive field encryption
- OSSA validates context schemas

### 5. Streaming

**Swarm Streaming**:
```python
stream = client.run(
    agent=agent,
    messages=messages,
    stream=True
)

for chunk in stream:
    print(chunk)
```

**OSSA Streaming**:
```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: streaming-agent
spec:
  runtime:
    streaming:
      enabled: true
      chunk_size: 512
      buffer_mode: line  # or "token" or "sentence"
      backpressure_strategy: buffer  # or "drop" or "block"
```

**Key Differences**:
- OSSA configures streaming declaratively
- OSSA supports multiple buffer modes
- OSSA handles backpressure automatically

## Migration Guide

### Step 1: Inventory Your Swarm Agents

Create a list of all Swarm agents:

```bash
# Find all Agent definitions
grep -r "Agent(" your_swarm_code/

# Find all transfer functions
grep -r "def transfer_to" your_swarm_code/

# Find all tool functions
grep -r "def [a-z_]+.*:" your_swarm_code/ | grep -v "transfer_to"
```

Create migration checklist:

```markdown
## Agent Migration Checklist

- [ ] Triage Agent
  - [ ] Functions: transfer_to_sales, transfer_to_support
  - [ ] Context: user_id, session_id

- [ ] Sales Agent
  - [ ] Functions: place_order, get_product_info
  - [ ] Context: user_id, cart_items
```

### Step 2: Create Agent Manifests

For each Swarm agent, create an OSSA manifest:

```bash
# Create directory structure
mkdir -p .agents/customer-service/{triage,sales,support}

# Create triage agent manifest
cat > .agents/customer-service/triage/manifest.yaml
```

### Step 3: Map Functions to Capabilities

**Swarm Function**:
```python
def place_order(product_id: str, quantity: int = 1) -> dict:
    """Place an order for a product."""
    return {
        "order_id": f"ORD-{product_id}",
        "status": "confirmed",
        "quantity": quantity
    }
```

**OSSA Capability**:
```yaml
capabilities:
  - name: place_order
    description: "Place an order for a product"
    input_schema:
      type: object
      properties:
        product_id:
          type: string
          pattern: "^[A-Z0-9-]+$"
        quantity:
          type: integer
          minimum: 1
          maximum: 100
          default: 1
      required: [product_id]
    output_schema:
      type: object
      properties:
        order_id:
          type: string
        status:
          type: string
          enum: [confirmed, pending, failed]
        quantity:
          type: integer
      required: [order_id, status]
```

### Step 4: Convert Handoffs

**Swarm Transfer Functions**:
```python
def transfer_to_sales():
    return sales_agent

def transfer_to_support():
    return support_agent
```

**OSSA Handoffs**:
```yaml
handoffs:
  - name: route_to_sales
    target_agent: sales-agent
    description: "Route to sales for purchases"
    condition: |
      intent == 'purchase' or
      intent == 'product_inquiry'
    trigger: automatic
    context_transfer: full

  - name: route_to_support
    target_agent: support-agent
    description: "Route to support for help"
    condition: "intent == 'help' or intent == 'issue'"
    trigger: automatic
    context_transfer: selective
    context_fields: [user_id, issue_type]
```

### Step 5: Add Enterprise Features

OSSA provides features that Swarm lacks:

#### Authentication

```yaml
spec:
  identity:
    provider: oauth2
    authentication:
      method: oauth2
      scopes: [read:user, write:orders]
      token_source:
        env_var: OAUTH_TOKEN
```

#### Observability

```yaml
spec:
  observability:
    metrics:
      enabled: true
      export_interval: 30s
      metrics:
        - request_count
        - response_time
        - handoff_rate
    tracing:
      enabled: true
      sampler: always_on
    logging:
      level: info
      structured: true
```

#### Cost Control

```yaml
spec:
  token_efficiency:
    enabled: true
    target_savings: 0.7  # Optimize token usage
    context_management:
      strategy: adaptive
      pruning:
        enabled: true
        threshold: 0.3
    caching:
      enabled: true
      strategy: semantic
      ttl: 3600
```

#### Rate Limiting

```yaml
spec:
  constraints:
    rate_limits:
      requests_per_minute: 100
      requests_per_hour: 1000
      tokens_per_day: 500000
    max_conversation_turns: 50
    timeout_seconds: 30
```

### Step 6: Create Tests

```yaml
apiVersion: ossa/v0.3.6
kind: AgentTest
metadata:
  name: test-triage-agent
spec:
  agent: triage-agent

  test_cases:
    - name: "Route to sales for purchase"
      input:
        message: "I want to buy a product"
      expected:
        handoff_to: sales-agent
        confidence: 0.8

    - name: "Route to support for help"
      input:
        message: "I need help with my order"
      expected:
        handoff_to: support-agent
        confidence: 0.8
```

### Step 7: Deploy

Deploy to your target platform:

```bash
# Deploy to Anthropic Claude
ossa build .agents/customer-service/ \
  --platform anthropic \
  --output dist/anthropic/

# Deploy to OpenAI (maintain compatibility)
ossa build .agents/customer-service/ \
  --platform openai \
  --output dist/openai/

# Deploy to Kubernetes
ossa build .agents/customer-service/ \
  --platform kubernetes \
  --output k8s/

kubectl apply -f k8s/
```

## Integration Patterns

### Pattern 1: Swarm + OSSA Hybrid

Run Swarm agents locally, OSSA agents in production:

```python
# local_dev.py - Use Swarm for development
from swarm import Swarm, Agent

agent = Agent(name="Dev Agent", instructions="...")
response = client.run(agent=agent, messages=messages)
```

```yaml
# production.ossa.yaml - Deploy OSSA to production
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: production-agent
spec:
  role: "..."  # Same as Swarm agent
```

### Pattern 2: Gradual Migration

Migrate one agent at a time:

```yaml
# Week 1: Migrate triage agent
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: triage-agent
spec:
  # ... OSSA config

  # Still handoff to Swarm agents
  handoffs:
    - target_agent: swarm-sales-agent  # Still in Swarm
      external: true
      adapter: swarm
```

### Pattern 3: OSSA Wrapper for Swarm

Wrap Swarm agents in OSSA for observability:

```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: swarm-agent-wrapper
spec:
  adapter:
    type: swarm
    agent_file: swarm_agent.py
    agent_name: SalesAgent

  # Add OSSA observability
  observability:
    metrics:
      enabled: true
    tracing:
      enabled: true
```

## Best Practices

### 1. Declarative Over Imperative

**Avoid** (Swarm style):
```python
def complex_routing_logic(context):
    if context["tier"] == "premium" and context["order_total"] > 1000:
        return vip_agent
    elif context["issue_type"] == "technical":
        return tech_support_agent
    else:
        return general_support_agent
```

**Prefer** (OSSA style):
```yaml
handoffs:
  - target_agent: vip-agent
    condition: "tier == 'premium' and order_total > 1000"

  - target_agent: tech-support-agent
    condition: "issue_type == 'technical'"

  - target_agent: general-support-agent
    condition: "default"  # Catch-all
```

### 2. Schema Validation

Always define input/output schemas:

```yaml
capabilities:
  - name: process_payment
    input_schema:
      type: object
      properties:
        amount:
          type: number
          minimum: 0.01  # Prevent $0 payments
          maximum: 100000  # Prevent excessive charges
      required: [amount]
```

### 3. Context Isolation

Don't leak sensitive data:

```yaml
context_propagation:
  mode: selective
  allowed_fields:
    - user_id
    - session_id
  sensitive_fields:
    - credit_card
    - ssn
    - password
```

### 4. Observability First

Enable observability from day one:

```yaml
observability:
  metrics:
    enabled: true
  tracing:
    enabled: true
    trace_all_handoffs: true
  logging:
    level: info
    include_context: true
```

### 5. Test Coverage

Create comprehensive tests:

```yaml
test_cases:
  # Positive cases
  - name: "successful_handoff"
    input: {...}
    expected: {...}

  # Negative cases
  - name: "invalid_input"
    input: {...}
    expected_error: "validation_failed"

  # Edge cases
  - name: "max_handoff_depth"
    input: {...}
    expected_error: "max_depth_exceeded"
```

## Examples

### Example 1: Simple Triage Agent

See: `examples/migrations/swarm-to-ossa/before-triage-agent.py`
See: `examples/migrations/swarm-to-ossa/after-triage-agent.ossa.yaml`

**Before (Swarm)**: 80 lines of Python
**After (OSSA)**: 35 lines of YAML

**Benefits**:
- 50% less code
- Declarative configuration
- Built-in observability
- Deploy to any platform

### Example 2: Advanced Handoffs

See: `examples/migrations/swarm-to-ossa/before-handoffs.py`
See: `examples/migrations/swarm-to-ossa/after-handoffs.ossa.yaml`

**Swarm Limitations Solved**:
- ✅ Declarative handoff rules
- ✅ Conditional handoffs with expressions
- ✅ Handoff observability
- ✅ Handoff policies (max depth, timeout, rollback)
- ✅ Automatic context propagation

### Example 3: E-commerce Workflow

Complete customer service workflow:

```yaml
# See: examples/migrations/swarm-to-ossa/after-handoffs.ossa.yaml
apiVersion: ossa/v0.3.6
kind: Workflow
metadata:
  name: order-processing-workflow
spec:
  steps:
    - name: triage
      agent: triage-agent
    - name: sales
      agent: sales-agent
      when: "{{ steps.triage.outputs.intent == 'purchase' }}"
    - name: payment
      agent: payment-agent
    - name: fulfillment
      agent: fulfillment-agent
```

## API Reference

### Agent Manifest Schema

```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: string                # Required
  version: string             # Required (semver)
  description: string         # Optional
  labels: object              # Optional
  catalog: object             # Optional

spec:
  role: string                # Required
  llm: object                 # Required
  capabilities: array         # Optional
  handoffs: array             # Optional
  context_propagation: object # Optional
  identity: object            # Optional
  observability: object       # Optional
  constraints: object         # Optional
  token_efficiency: object    # Optional
```

### Handoff Schema

```yaml
handoffs:
  - name: string              # Required
    target_agent: string      # Required
    description: string       # Optional
    condition: string         # Optional (expression)
    trigger: enum             # automatic | manual | conditional
    context_transfer: enum    # full | selective | none
    context_fields: array     # Optional
    requires_approval: bool   # Optional
    metadata: object          # Optional
```

### Capability Schema

```yaml
capabilities:
  - name: string              # Required
    description: string       # Optional
    input_schema: object      # Required (JSON Schema)
    output_schema: object     # Required (JSON Schema)
```

## Troubleshooting

### Issue: Context not propagating

**Symptom**: Context variables not available in target agent

**Swarm (automatic)**:
```python
# Context automatically passed
response = client.run(agent=agent, context_variables=ctx)
```

**OSSA (explicit)**:
```yaml
# Must configure context propagation
spec:
  context_propagation:
    mode: selective
    allowed_fields: [user_id, session_id]
```

**Solution**: Add `context_propagation` configuration.

### Issue: Handoffs not triggering

**Symptom**: Agent doesn't transfer to target agent

**Check**:
1. Target agent exists: `ossa list agents`
2. Condition syntax: Verify expression is valid
3. Trigger mode: Set to `automatic` for immediate handoff
4. Context fields: Ensure required fields are present

**Solution**:
```yaml
handoffs:
  - target_agent: sales-agent
    condition: "intent == 'purchase'"  # Valid expression
    trigger: automatic                 # Auto trigger
    context_fields: [intent]           # Required field
```

### Issue: Capabilities not being called

**Symptom**: Agent doesn't call defined capabilities

**Swarm (implicit)**:
```python
# Functions automatically available
agent = Agent(functions=[func1, func2])
```

**OSSA (explicit schema required)**:
```yaml
capabilities:
  - name: func1
    input_schema:           # MUST define schema
      type: object
      properties: {}
```

**Solution**: Define complete JSON schemas for all capabilities.

### Issue: High token usage

**Symptom**: OSSA agent uses more tokens than Swarm

**Solution**: Enable token efficiency:
```yaml
spec:
  token_efficiency:
    enabled: true
    target_savings: 0.7  # Optimize token usage
    context_management:
      pruning:
        enabled: true
```

## Resources

- **Migration Examples**: `examples/migrations/swarm-to-ossa/`
- **OSSA Specification**: `spec/v0.3.6/`
- **API Reference**: `docs/OSSA-TECHNICAL-REFERENCE.md`
- **OpenAI Swarm Repo**: https://github.com/openai/swarm

## Support

- **GitHub Issues**: https://github.com/blueflyio/openstandardagents/issues
- **Discussions**: https://github.com/blueflyio/openstandardagents/discussions
- **Discord**: Coming soon

## Next Steps

1. Review the migration examples
2. Try migrating a simple Swarm agent
3. Add enterprise features (auth, observability)
4. Deploy to your target platform
5. Share your experience with the community!
