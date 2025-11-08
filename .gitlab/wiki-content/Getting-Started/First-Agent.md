# First Agent Creation

Build your first real OSSA agent with capabilities.

## Overview

In this guide, you'll create a complete agent with:
- Multiple tools/capabilities
- LLM configuration
- Observability setup
- Constraints and limits

## Step 1: Choose Your Agent Type

OSSA supports various agent types:

- **chat** - Conversational agent
- **workflow** - Workflow orchestration
- **compliance** - Compliance checking
- **monitoring** - System monitoring
- **worker** - Task processing

For this tutorial, we'll create a **chat** agent with web search capability.

## Step 2: Generate Base Agent

```bash
ossa generate chat \
  --name "Research Assistant" \
  --description "An agent that can search the web and answer questions" \
  --output research-assistant.ossa.yaml
```

## Step 3: Add Tools

Edit `research-assistant.ossa.yaml` to add a web search tool:

```yaml
spec:
  role: |
    You are a research assistant. Your job is to:
    1. Search the web for current information
    2. Synthesize information from multiple sources
    3. Provide accurate, well-sourced answers
    
    Always cite your sources and verify information.
  
  llm:
    provider: openai
    model: gpt-4
    temperature: 0.3  # Lower for factual accuracy
  
  tools:
    - type: http
      name: web_search
      description: Search the web for current information
      endpoint: https://api.search-service.com/search
      config:
        method: POST
        timeout: 10
      auth:
        type: apikey
        credentials: SEARCH_API_KEY
```

## Step 4: Add Observability

Add observability configuration:

```yaml
spec:
  # ... existing config ...
  
  observability:
    tracing:
      enabled: true
      exporter: otlp
      endpoint: http://localhost:4318
    metrics:
      enabled: true
      exporter: prometheus
      endpoint: http://localhost:9090/metrics
    logging:
      level: info
      format: json
```

## Step 5: Add Constraints

Add cost and performance constraints:

```yaml
spec:
  # ... existing config ...
  
  constraints:
    cost:
      maxTokensPerDay: 100000
      maxCostPerDay: 10.00
      currency: USD
    performance:
      maxLatencySeconds: 5.0
      maxConcurrentRequests: 10
      timeoutSeconds: 30
```

## Step 6: Validate

Validate your complete agent:

```bash
ossa validate research-assistant.ossa.yaml --verbose
```

## Complete Example

Your final agent should look like:

```yaml
apiVersion: ossa/v0.2.2
kind: Agent

metadata:
  name: research-assistant
  version: 1.0.0
  description: An agent that can search the web and answer questions
  labels:
    environment: development
    team: research

spec:
  role: |
    You are a research assistant. Your job is to:
    1. Search the web for current information
    2. Synthesize information from multiple sources
    3. Provide accurate, well-sourced answers
    
    Always cite your sources and verify information.
  
  llm:
    provider: openai
    model: gpt-4
    temperature: 0.3
    maxTokens: 2000
  
  tools:
    - type: http
      name: web_search
      description: Search the web for current information
      endpoint: https://api.search-service.com/search
      config:
        method: POST
        timeout: 10
      auth:
        type: apikey
        credentials: SEARCH_API_KEY
  
  constraints:
    cost:
      maxTokensPerDay: 100000
      maxCostPerDay: 10.00
      currency: USD
    performance:
      maxLatencySeconds: 5.0
      maxConcurrentRequests: 10
  
  observability:
    tracing:
      enabled: true
      exporter: otlp
      endpoint: http://localhost:4318
    metrics:
      enabled: true
      exporter: prometheus
    logging:
      level: info
      format: json
```

## Next Steps

1. ✅ First agent created
2. → [Integration Patterns](../Examples/Integration-Patterns) - Connect multiple agents
3. → [Migration Guides](../Examples/Migration-Guides) - Migrate from other frameworks
4. → [Advanced Patterns](../Examples/Advanced-Patterns) - Enterprise patterns

## Related

- [Hello World Tutorial](Hello-World)
- [Schema Reference](../Technical/Schema-Reference)
- [Complete Examples](../Examples/Getting-Started-Examples)

