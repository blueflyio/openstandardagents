# OpenAI Swarm to OSSA Migration Guide

Complete guide for migrating OpenAI Swarm agents to OSSA v0.3.6 specification.

## Why Migrate to OSSA?

**OpenAI Swarm** is a powerful experimental framework for lightweight multi-agent orchestration, but it's:
- Python-only (no cross-language support)
- Not production-ready (experimental status)
- Lacks enterprise features (authentication, observability, governance)
- No declarative configuration
- Limited deployment options

**OSSA** provides:
- **Cross-platform**: Deploy to any runtime (Anthropic Claude, OpenAI, LangChain, CrewAI, AutoGen, etc.)
- **Production-ready**: Enterprise features, security, observability built-in
- **Declarative**: YAML/JSON manifests enable version control, CI/CD, GitOps
- **Vendor-neutral**: Not locked to a single LLM provider or runtime
- **Standards-based**: Open specification with ecosystem support

## Migration Patterns

### 1. Triage Agent Pattern

**Swarm Concept**: Entry point agent that routes requests to specialized agents.

**Migration**: Swarm's triage agent → OSSA agent with handoff capabilities.

**Before (Swarm)**:
```python
# See: before-triage-agent.py
triage_agent = Agent(
    name="Triage Agent",
    instructions="Determine which department should handle the request...",
    functions=[transfer_to_sales, transfer_to_refunds]
)
```

**After (OSSA)**:
```yaml
# See: after-triage-agent.ossa.yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: customer-service-triage
spec:
  role: "Triage customer requests and route to appropriate department"
  handoffs:
    - target_agent: sales-agent
      condition: "intent == 'purchase' or intent == 'product_info'"
    - target_agent: refunds-agent
      condition: "intent == 'refund' or intent == 'return'"
```

### 2. Handoff Pattern

**Swarm Concept**: Agents transfer control to other agents using transfer functions.

**Migration**: Swarm's `transfer_to_*` functions → OSSA handoffs with conditions.

**Before (Swarm)**:
```python
# See: before-handoffs.py
def transfer_to_sales_agent():
    return sales_agent

sales_agent = Agent(
    name="Sales Agent",
    functions=[execute_order, transfer_to_triage_agent]
)
```

**After (OSSA)**:
```yaml
# See: after-handoffs.ossa.yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: sales-agent
spec:
  handoffs:
    - target_agent: order-processing-agent
      condition: "action == 'execute_order'"
    - target_agent: customer-service-triage
      condition: "request_type == 'escalate'"
      context_transfer: "full"  # Transfer conversation history
```

### 3. Function Calling Pattern

**Swarm Concept**: Agents have functions they can call.

**Migration**: Swarm functions → OSSA capabilities with JSON schemas.

**Before (Swarm)**:
```python
def process_refund(item_id: str, reason: str) -> str:
    """Process a refund for an item."""
    # Implementation
    return f"Refund processed for {item_id}"

refund_agent = Agent(
    name="Refund Agent",
    functions=[process_refund]
)
```

**After (OSSA)**:
```yaml
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: refund-agent
spec:
  capabilities:
    - name: process_refund
      description: "Process a refund for an item"
      input_schema:
        type: object
        properties:
          item_id:
            type: string
            description: "Item identifier"
          reason:
            type: string
            description: "Reason for refund"
        required: [item_id, reason]
      output_schema:
        type: object
        properties:
          status:
            type: string
            enum: [success, failed]
          refund_id:
            type: string
          message:
            type: string
```

### 4. Context Variables Pattern

**Swarm Concept**: Pass context between agents using dictionaries.

**Migration**: Swarm context_variables → OSSA execution context.

**Before (Swarm)**:
```python
response = client.run(
    agent=triage_agent,
    messages=[{"role": "user", "content": "I want a refund"}],
    context_variables={
        "user_id": "123",
        "account_type": "premium"
    }
)
```

**After (OSSA)**:
```yaml
apiVersion: ossa/v0.3.6
kind: AgentExecution
metadata:
  name: customer-service-session
spec:
  agent: customer-service-triage
  input:
    message: "I want a refund"
  context:
    user_id: "123"
    account_type: "premium"
    session_id: "session-xyz"
  context_propagation:
    mode: selective  # or "full" or "none"
    allowed_fields: [user_id, account_type, session_id]
```

### 5. Streaming Pattern

**Swarm Concept**: Stream agent responses.

**Migration**: Swarm stream → OSSA runtime streaming configuration.

**Before (Swarm)**:
```python
stream = client.run(
    agent=agent,
    messages=messages,
    stream=True
)

for chunk in stream:
    print(chunk)
```

**After (OSSA)**:
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
  llm:
    provider: anthropic
    model: claude-sonnet-4-5
```

## Step-by-Step Migration

### Step 1: Analyze Your Swarm

Identify all components:

```bash
# List all agents
grep -r "Agent(" your_swarm_code/

# List all transfer functions
grep -r "def transfer_to" your_swarm_code/

# List all tool functions
grep -r "@agent.function" your_swarm_code/
```

### Step 2: Create OSSA Agents

For each Swarm agent, create an OSSA manifest:

```bash
# Create agent directory
mkdir -p .agents/customer-service/

# Create manifest
cat > .agents/customer-service/manifest.yaml <<EOF
apiVersion: ossa/v0.3.6
kind: Agent
metadata:
  name: customer-service-triage
  version: 1.0.0
spec:
  role: "Your agent role here"
  llm:
    provider: openai  # Keep using OpenAI if desired
    model: gpt-4
EOF
```

### Step 3: Map Functions to Capabilities

Convert each Swarm function to an OSSA capability:

**Swarm Function**:
```python
def get_weather(location: str, units: str = "celsius") -> str:
    """Get weather for a location."""
    return f"Weather in {location}: 20°{units[0].upper()}"
```

**OSSA Capability**:
```yaml
capabilities:
  - name: get_weather
    description: "Get weather for a location"
    input_schema:
      type: object
      properties:
        location:
          type: string
          description: "City or location name"
        units:
          type: string
          enum: [celsius, fahrenheit]
          default: celsius
      required: [location]
    output_schema:
      type: object
      properties:
        weather:
          type: string
```

### Step 4: Convert Handoffs

Map Swarm transfer functions to OSSA handoffs:

**Swarm Transfers**:
```python
def transfer_to_sales():
    return sales_agent

def transfer_to_refunds():
    return refunds_agent
```

**OSSA Handoffs**:
```yaml
spec:
  handoffs:
    - target_agent: sales-agent
      condition: "intent == 'sales'"
      trigger: automatic  # or "manual" or "conditional"
    - target_agent: refunds-agent
      condition: "intent == 'refund'"
      trigger: automatic
```

### Step 5: Define Context Propagation

Configure how context flows between agents:

```yaml
spec:
  context_propagation:
    mode: selective
    allowed_fields:
      - user_id
      - session_id
      - account_type
    sensitive_fields:  # These require encryption
      - credit_card
      - ssn
```

### Step 6: Add Enterprise Features

OSSA provides features that Swarm lacks:

```yaml
spec:
  # Authentication & Authorization
  identity:
    provider: oauth2
    scopes: [read:user, write:actions]

  # Observability
  observability:
    metrics:
      enabled: true
      export_interval: 30s
    tracing:
      enabled: true
      sampler: always_on
    logging:
      level: info
      structured: true

  # Rate Limiting
  constraints:
    rate_limits:
      requests_per_minute: 100
      tokens_per_day: 1000000

  # Cost Control
  token_efficiency:
    enabled: true
    target_savings: 0.7  # 70% reduction
```

### Step 7: Test Your Migration

Create test cases:

```yaml
# tests/customer-service-test.yaml
apiVersion: ossa/v0.3.6
kind: AgentTest
metadata:
  name: test-triage-to-sales-handoff
spec:
  agent: customer-service-triage
  test_cases:
    - name: "Sales inquiry routes to sales agent"
      input:
        message: "I want to buy your product"
      expected:
        handoff_to: sales-agent
        confidence: 0.8
    - name: "Refund request routes to refunds agent"
      input:
        message: "I want a refund"
      expected:
        handoff_to: refunds-agent
        confidence: 0.8
```

### Step 8: Deploy

OSSA agents can deploy anywhere:

```bash
# Deploy to Anthropic Claude
ossa build manifest.yaml --platform anthropic --output claude-agent/

# Deploy to OpenAI (maintain compatibility)
ossa build manifest.yaml --platform openai --output openai-agent/

# Deploy to LangChain
ossa build manifest.yaml --platform langchain --output langchain-agent/

# Deploy to Kubernetes
ossa build manifest.yaml --platform kubernetes --output k8s/
kubectl apply -f k8s/
```

## Migration Checklist

- [ ] **Analyze Swarm code**: List all agents, functions, transfers
- [ ] **Create OSSA manifests**: One manifest per agent
- [ ] **Map functions → capabilities**: Convert with JSON schemas
- [ ] **Map transfers → handoffs**: Define conditions and triggers
- [ ] **Configure context propagation**: Control data flow between agents
- [ ] **Add authentication**: Define identity providers and scopes
- [ ] **Add observability**: Enable metrics, tracing, logging
- [ ] **Add constraints**: Rate limits, cost controls, security policies
- [ ] **Create tests**: Validate behavior matches Swarm
- [ ] **Deploy to target platform**: Choose runtime (Anthropic, OpenAI, etc.)
- [ ] **Monitor in production**: Use OSSA observability features

## Common Migration Patterns

### Pattern: Simple Customer Service Bot

**Swarm (80 lines Python)**:
```python
# See: before-triage-agent.py (full example)
```

**OSSA (35 lines YAML)**:
```yaml
# See: after-triage-agent.ossa.yaml (full example)
```

**Benefits**:
- 50% less code
- Declarative configuration
- Version control friendly
- CI/CD ready
- Deploy to any platform

### Pattern: Multi-Agent Workflow

**Swarm**: Sequential function calls with manual state management.

**OSSA**: Declarative workflow with automatic orchestration.

```yaml
apiVersion: ossa/v0.3.6
kind: Workflow
metadata:
  name: order-processing-workflow
spec:
  steps:
    - name: triage
      agent: customer-service-triage
      outputs: [intent, user_id]

    - name: process_order
      agent: sales-agent
      when: "{{ steps.triage.outputs.intent == 'purchase' }}"
      inputs:
        user_id: "{{ steps.triage.outputs.user_id }}"

    - name: process_refund
      agent: refunds-agent
      when: "{{ steps.triage.outputs.intent == 'refund' }}"
      inputs:
        user_id: "{{ steps.triage.outputs.user_id }}"
```

## Advanced Features (Not in Swarm)

### 1. Composite Identity (GitLab Duo Style)

```yaml
spec:
  identity:
    composite:
      enabled: true
      primary_identity:
        username: bot-agent
        roles: [service_account]
      secondary_identity:
        user_id: $GITLAB_USER_ID
        inherit_permissions: true
```

### 2. Token Efficiency (95% Cost Reduction)

```yaml
spec:
  token_efficiency:
    enabled: true
    context_management:
      strategy: adaptive
      pruning:
        enabled: true
        threshold: 0.3
    caching:
      strategy: semantic
      ttl: 3600
    compression:
      enabled: true
      algorithm: zstd
```

### 3. Knowledge Graph Integration

```yaml
spec:
  knowledge_graph:
    enabled: true
    graph_store:
      provider: neo4j
      uri: bolt://localhost:7687
    entity_extraction:
      enabled: true
      min_confidence: 0.7
```

### 4. Decentralized Identity

```yaml
metadata:
  decentralized_identity:
    did: did:ossa:customer-service:abc123
    public_key: ed25519:key-xyz
    reputation:
      credit_score: 850
      trust_network: [did:ossa:supervisor]
```

### 5. Agent Lifecycle

```yaml
metadata:
  lifecycle_stages:
    current_stage: mature
    birth:
      timestamp: 2025-01-01T00:00:00Z
      birth_type: created
    growth:
      tasks_completed: 5000
      skills_acquired: [refund_processing, escalation_handling]
```

## Comparison Matrix

| Feature | OpenAI Swarm | OSSA |
|---------|-------------|------|
| **Language** | Python only | Any (via adapters) |
| **Configuration** | Code-based | Declarative YAML/JSON |
| **Production Ready** | Experimental | Yes |
| **Multi-Platform** | No | Yes (10+ runtimes) |
| **Authentication** | Manual | Built-in OAuth2, JWT, etc. |
| **Observability** | Manual | Built-in metrics/tracing |
| **Cost Control** | No | Token efficiency (95% savings) |
| **Knowledge Graph** | No | Built-in Neo4j support |
| **DID/Identity** | No | Decentralized identity |
| **Lifecycle Mgmt** | No | Birth, growth, career stages |
| **GitOps** | No | Native CI/CD support |
| **Version Control** | No | Native Git support |
| **Testing** | Manual | Built-in test framework |
| **Governance** | No | Built-in compliance |

## Examples

### Complete Examples

1. **Triage Agent**: `before-triage-agent.py` → `after-triage-agent.ossa.yaml`
2. **Handoffs**: `before-handoffs.py` → `after-handoffs.ossa.yaml`

### Real-World Use Cases

```yaml
# E-commerce customer service
examples/migrations/swarm-to-ossa/use-cases/ecommerce/

# Technical support routing
examples/migrations/swarm-to-ossa/use-cases/support/

# Sales qualification workflow
examples/migrations/swarm-to-ossa/use-cases/sales/
```

## Troubleshooting

### Issue: Context variables not propagating

**Swarm**:
```python
context_variables = {"user_id": "123"}
# Variables automatically passed
```

**OSSA**: Must explicitly configure:
```yaml
spec:
  context_propagation:
    mode: selective
    allowed_fields: [user_id]
```

### Issue: Handoffs not working

**Check**:
1. Target agent exists: `ossa list agents`
2. Condition syntax: Use valid expression syntax
3. Trigger mode: Set to `automatic` for immediate handoff

### Issue: Functions not being called

**Swarm functions** → **OSSA capabilities** with proper schemas:
```yaml
capabilities:
  - name: your_function
    input_schema:
      type: object
      properties: {}  # Must define schema
```

## Migration Tools

### Automated Migration (Future)

```bash
# Planned: Automatic converter
ossa migrate swarm_agent.py --output agent.ossa.yaml
```

### Validation

```bash
# Validate OSSA manifest
ossa validate agent.ossa.yaml

# Test agent behavior
ossa test agent.ossa.yaml

# Dry-run deployment
ossa deploy agent.ossa.yaml --dry-run
```

## Resources

- **OSSA Specification**: `spec/v0.3.6/`
- **API Reference**: `docs/OSSA-TECHNICAL-REFERENCE.md`
- **More Examples**: `examples/v0.3.6/`
- **Integration Guide**: `docs/integrations/openai-swarm.md`

## Get Help

- **Issues**: https://github.com/blueflyio/openstandardagents/issues
- **Discussions**: https://github.com/blueflyio/openstandardagents/discussions
- **Discord**: https://discord.gg/ossa (coming soon)

## Next Steps

1. Review the example files in this directory
2. Read the full integration guide: `docs/integrations/openai-swarm.md`
3. Try migrating a simple Swarm agent
4. Join the community and share your experience!
