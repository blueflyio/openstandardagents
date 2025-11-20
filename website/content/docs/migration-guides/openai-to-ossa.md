---
title: "OpenAI to OSSA"
---

# OpenAI Assistants API to OSSA Migration Guide

> **Comprehensive guide for migrating from OpenAI Assistants API to OSSA (Open Source Self-Organizing Agent) Standard**

## Table of Contents

- [Overview](#overview)
- [Key Differences](#key-differences)
- [Migration Mapping](#migration-mapping)
- [Migration Examples](#migration-examples)
  - [Example 1: Simple Assistant](#example-1-simple-assistant)
  - [Example 2: Function Calling Assistant](#example-2-function-calling-assistant)
  - [Example 3: File Search Assistant](#example-3-file-search-assistant)
- [Advanced Features](#advanced-features)
- [Migration Checklist](#migration-checklist)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Overview

This guide provides a complete migration path from OpenAI's Assistants API to the OSSA standard. OSSA provides:

- **Vendor Independence**: Not locked into OpenAI - use any LLM provider
- **Kubernetes Native**: Deploy agents as Kubernetes resources
- **Enhanced Observability**: Built-in tracing, metrics, and logging
- **GitLab Integration**: Native issue tracking and collaboration
- **Multi-Agent Orchestration**: Coordinate multiple agents seamlessly
- **OSSA Compliance**: Standardized agent definitions with validation

### Why Migrate?

| Feature | OpenAI Assistants | OSSA |
|---------|------------------|------|
| **LLM Provider** | OpenAI only | Any (OpenAI, Anthropic, Google, Azure, Ollama, etc.) |
| **Deployment** | Cloud-only | Local, Cloud, Kubernetes |
| **Observability** | Limited | Full tracing, metrics, logs (Prometheus, Jaeger) |
| **Cost Control** | Per-token billing | Configurable cost constraints |
| **Multi-Agent** | Limited | Native orchestration support |
| **Standards** | Proprietary | Open standard (OSSA v0.2.2) |

---

## Key Differences

### Conceptual Mapping

```
OpenAI Assistants API          →    OSSA Standard
═══════════════════════════════════════════════════════════
Assistant                      →    Agent (OSSA Manifest)
Functions                      →    Capabilities
File Search                    →    Data Capabilities + MCP Tools
Code Interpreter               →    Runtime Environment
Vector Stores                  →    Data Sources + Knowledge Bases
Threads                        →    Workflow Sessions
Messages                       →    Task Messages
Runs                          →    Agent Executions
Tools                         →    MCP Tools / Capabilities
Retrieval                     →    Knowledge Retrieval Capability
```

---

## Migration Mapping

### 1. OpenAI Assistant → OSSA Agent

**OpenAI Assistant Definition:**
```python
assistant = client.beta.assistants.create(
    name="Data Analyst",
    instructions="You are a data analyst assistant.",
    model="gpt-4-turbo",
    tools=[{"type": "code_interpreter"}]
)
```

**OSSA Equivalent:**
```yaml
apiVersion: ossa/v0.2.2
kind: Agent
metadata:
  name: data-analyst
  version: 1.0.0
  description: "Data analyst assistant"
  labels:
    type: specialist
    ossa-version: "0.2.2"
spec:
  role: |
    You are a data analyst assistant.
  taxonomy:
    domain: analytics
    subdomain: data_analysis
    capability: data_processing
  llm:
    provider: openai  # Or anthropic, google, azure, etc.
    model: gpt-4-turbo
    temperature: 0.7
    maxTokens: 4096
  runtime:
    type: local
    environment:
      PYTHON_VERSION: "3.11"
    resources:
      cpu: 1000m
      memory: 2Gi
  capabilities:
    - name: code_interpreter
      description: "Execute Python code for data analysis"
      input_schema:
        type: object
        properties:
          code:
            type: string
            description: "Python code to execute"
      output_schema:
        type: object
        properties:
          result:
            type: string
          output:
            type: string
```

### 2. Functions → OSSA Capabilities

**OpenAI Functions:**
```python
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City name"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"]
                }
            },
            "required": ["location"]
        }
    }
}]
```

**OSSA Capabilities:**
```yaml
capabilities:
  - name: get_weather
    description: "Get current weather for a location"
    input_schema:
      type: object
      required:
        - location
      properties:
        location:
          type: string
          description: "City name"
        unit:
          type: string
          enum: [celsius, fahrenheit]
          default: celsius
    output_schema:
      type: object
      properties:
        temperature:
          type: number
        conditions:
          type: string
        humidity:
          type: number
```

### 3. File Search → OSSA Data Capabilities

**OpenAI File Search:**
```python
assistant = client.beta.assistants.create(
    name="Research Assistant",
    instructions="You research papers.",
    model="gpt-4-turbo",
    tools=[{"type": "file_search"}],
    tool_resources={
        "file_search": {
            "vector_store_ids": [vector_store.id]
        }
    }
)
```

**OSSA Data Capabilities:**
```yaml
apiVersion: ossa/v0.2.2
kind: Agent
metadata:
  name: research-assistant
  version: 1.0.0
spec:
  role: "You research papers."
  llm:
    provider: openai
    model: gpt-4-turbo
  tools:
    - type: mcp
      server: filesystem
      capabilities:
        - read_file
        - search_files
    - type: mcp
      server: qdrant  # Vector database
      capabilities:
        - semantic_search
  capabilities:
    - name: search_documents
      description: "Search research papers"
      input_schema:
        type: object
        properties:
          query:
            type: string
          max_results:
            type: integer
            default: 10
      output_schema:
        type: object
        properties:
          results:
            type: array
            items:
              type: object
              properties:
                content:
                  type: string
                score:
                  type: number
                metadata:
                  type: object
  data_sources:
    - type: vector_store
      provider: qdrant
      collection: research_papers
      endpoint: http://qdrant:6333
```

### 4. Code Interpreter → OSSA Runtime

**OpenAI Code Interpreter:**
```python
assistant = client.beta.assistants.create(
    name="Code Helper",
    instructions="Execute Python code",
    tools=[{"type": "code_interpreter"}]
)
```

**OSSA Runtime:**
```yaml
spec:
  runtime:
    type: docker  # or kubernetes, local
    image: python:3.11-slim
    command: ["python", "-u"]
    environment:
      PYTHON_PATH: /app
      PIP_PACKAGES: "pandas numpy matplotlib"
    resources:
      cpu: 2000m
      memory: 4Gi
    security:
      allowNetworkAccess: false
      allowFilesystemWrite: true
      allowedPaths:
        - /tmp
        - /workspace
  capabilities:
    - name: execute_code
      description: "Execute Python code in sandboxed environment"
      input_schema:
        type: object
        properties:
          code:
            type: string
          timeout:
            type: integer
            default: 30
      output_schema:
        type: object
        properties:
          stdout:
            type: string
          stderr:
            type: string
          return_value:
            type: object
          execution_time:
            type: number
```

### 5. Vector Stores → OSSA Data Sources

**OpenAI Vector Store:**
```python
vector_store = client.beta.vector_stores.create(
    name="Knowledge Base"
)

file_batch = client.beta.vector_stores.file_batches.upload_and_poll(
    vector_store_id=vector_store.id,
    files=[open("doc1.pdf", "rb"), open("doc2.pdf", "rb")]
)
```

**OSSA Data Sources:**
```yaml
spec:
  data_sources:
    - type: vector_store
      name: knowledge_base
      provider: qdrant  # or pinecone, weaviate, milvus
      collection: documents
      endpoint: ${QDRANT_URL}
      auth:
        type: apikey
        credentials: ${QDRANT_API_KEY}
      config:
        embedding_model: text-embedding-3-large
        dimension: 1536
        distance_metric: cosine
    - type: filesystem
      name: document_storage
      path: /data/documents
      allowed_extensions: [pdf, txt, md, docx]

  tools:
    - type: mcp
      server: qdrant
      capabilities:
        - insert_vectors
        - search_vectors
        - delete_vectors
```

---

## Migration Examples

### Example 1: Simple Assistant

**Before (OpenAI):**
```python
from openai import OpenAI

client = OpenAI()

# Create assistant
assistant = client.beta.assistants.create(
    name="Math Tutor",
    instructions="You are a helpful math tutor. Guide students step by step.",
    model="gpt-4-turbo"
)

# Create thread
thread = client.beta.threads.create()

# Add message
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="Solve: 3x + 11 = 14"
)

# Run assistant
run = client.beta.threads.runs.create_and_poll(
    thread_id=thread.id,
    assistant_id=assistant.id
)

# Get response
messages = client.beta.threads.messages.list(thread_id=thread.id)
print(messages.data[0].content[0].text.value)
```

**After (OSSA):**

**1. Create Agent Manifest (`math-tutor.ossa.yaml`):**
```yaml
apiVersion: ossa/v0.2.2
kind: Agent
metadata:
  name: math-tutor
  version: 1.0.0
  description: "Helpful math tutor providing step-by-step guidance"
  labels:
    type: specialist
    domain: education
spec:
  role: |
    You are a helpful math tutor. Guide students step by step.
  taxonomy:
    domain: education
    subdomain: mathematics
    capability: tutoring
  llm:
    provider: openai
    model: gpt-4-turbo
    temperature: 0.7
    maxTokens: 2048
  constraints:
    cost:
      maxTokensPerRequest: 2048
  monitoring:
    traces: true
    metrics: true
    logs: true
```

**2. Use with BuildKit:**
```bash
# Create agent from manifest
buildkit agents create math-tutor.ossa.yaml

# Spawn agent instance
buildkit agents spawn math-tutor \
  --message "Solve: 3x + 11 = 14" \
  --wait

# Or use programmatically
```

**3. Use Programmatically:**
```typescript
import { AgentBuilder } from '@bluefly/agent-buildkit';

const agent = await AgentBuilder.fromManifest('math-tutor.ossa.yaml');

const response = await agent.execute({
  message: "Solve: 3x + 11 = 14"
});

console.log(response.result);
```

---

### Example 2: Function Calling Assistant

**Before (OpenAI):**
```python
import json
from openai import OpenAI

client = OpenAI()

# Define function
tools = [{
    "type": "function",
    "function": {
        "name": "get_stock_price",
        "description": "Get current stock price",
        "parameters": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Stock symbol (e.g., AAPL)"
                }
            },
            "required": ["symbol"]
        }
    }
}]

# Create assistant with function
assistant = client.beta.assistants.create(
    name="Stock Assistant",
    instructions="Help with stock prices",
    model="gpt-4-turbo",
    tools=tools
)

# Execute (requires tool call handling)
thread = client.beta.threads.create()
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="What's Apple's stock price?"
)

run = client.beta.threads.runs.create_and_poll(
    thread_id=thread.id,
    assistant_id=assistant.id
)

# Handle tool calls
if run.status == 'requires_action':
    tool_outputs = []
    for tool_call in run.required_action.submit_tool_outputs.tool_calls:
        if tool_call.function.name == "get_stock_price":
            arguments = json.loads(tool_call.function.arguments)
            # Call your function
            price = get_stock_price(arguments["symbol"])
            tool_outputs.append({
                "tool_call_id": tool_call.id,
                "output": json.dumps({"price": price})
            })

    run = client.beta.threads.runs.submit_tool_outputs_and_poll(
        thread_id=thread.id,
        run_id=run.id,
        tool_outputs=tool_outputs
    )
```

**After (OSSA):**

**1. Create Agent Manifest (`stock-assistant.ossa.yaml`):**
```yaml
apiVersion: ossa/v0.2.2
kind: Agent
metadata:
  name: stock-assistant
  version: 1.0.0
  description: "Stock price assistant with real-time data"
spec:
  role: "Help with stock prices"
  taxonomy:
    domain: finance
    subdomain: stock_market
    capability: price_lookup
  llm:
    provider: openai
    model: gpt-4-turbo
  capabilities:
    - name: get_stock_price
      description: "Get current stock price for a symbol"
      input_schema:
        type: object
        required:
          - symbol
        properties:
          symbol:
            type: string
            description: "Stock symbol (e.g., AAPL, GOOGL)"
            pattern: "^[A-Z]{1,5}$"
      output_schema:
        type: object
        properties:
          symbol:
            type: string
          price:
            type: number
          currency:
            type: string
          timestamp:
            type: string
            format: date-time
  tools:
    - type: http
      name: stock_api
      endpoint: https://api.example.com/stocks
      auth:
        type: bearer
        credentials: ${STOCK_API_KEY}
  monitoring:
    traces: true
    metrics: true
```

**2. Implement Capability Handler:**
```typescript
import { AgentBuilder, CapabilityExecutor } from '@bluefly/agent-buildkit';
import axios from 'axios';

// Define capability executor
const getStockPrice: CapabilityExecutor = async (params) => {
  const { symbol } = params;

  const response = await axios.get(
    `https://api.example.com/stocks/${symbol}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.STOCK_API_KEY}`
      }
    }
  );

  return {
    symbol,
    price: response.data.price,
    currency: 'USD',
    timestamp: new Date().toISOString()
  };
};

// Register capability
const agent = await AgentBuilder.fromManifest('stock-assistant.ossa.yaml');
agent.registerCapability('get_stock_price', getStockPrice);

// Execute
const response = await agent.execute({
  message: "What's Apple's stock price?"
});

console.log(response.result);
```

**3. Use with BuildKit CLI:**
```bash
# Deploy agent
buildkit agents create stock-assistant.ossa.yaml

# Spawn with capability handler
buildkit agents spawn stock-assistant \
  --capability-handler ./handlers/stock-price.js \
  --message "What's Apple's stock price?" \
  --wait
```

---

### Example 3: File Search Assistant

**Before (OpenAI):**
```python
from openai import OpenAI

client = OpenAI()

# Create vector store
vector_store = client.beta.vector_stores.create(
    name="Product Documentation"
)

# Upload files
file_paths = ["manual.pdf", "faq.pdf", "guide.pdf"]
file_streams = [open(path, "rb") for path in file_paths]

file_batch = client.beta.vector_stores.file_batches.upload_and_poll(
    vector_store_id=vector_store.id,
    files=file_streams
)

# Create assistant with file search
assistant = client.beta.assistants.create(
    name="Support Assistant",
    instructions="Answer questions using product documentation",
    model="gpt-4-turbo",
    tools=[{"type": "file_search"}],
    tool_resources={
        "file_search": {
            "vector_store_ids": [vector_store.id]
        }
    }
)

# Query
thread = client.beta.threads.create()
message = client.beta.threads.messages.create(
    thread_id=thread.id,
    role="user",
    content="How do I reset my password?"
)

run = client.beta.threads.runs.create_and_poll(
    thread_id=thread.id,
    assistant_id=assistant.id
)

messages = client.beta.threads.messages.list(thread_id=thread.id)
print(messages.data[0].content[0].text.value)
```

**After (OSSA):**

**1. Setup Vector Database (Qdrant):**
```bash
# Start Qdrant via Docker
docker run -p 6333:6333 qdrant/qdrant

# Or use BuildKit
buildkit ecosystem services start qdrant
```

**2. Create Agent Manifest (`support-assistant.ossa.yaml`):**
```yaml
apiVersion: ossa/v0.2.2
kind: Agent
metadata:
  name: support-assistant
  version: 1.0.0
  description: "Support assistant with product documentation search"
spec:
  role: |
    Answer questions using product documentation.
    Always cite sources when providing information.
  taxonomy:
    domain: customer_support
    subdomain: documentation
    capability: knowledge_retrieval
  llm:
    provider: openai
    model: gpt-4-turbo
    temperature: 0.3
  data_sources:
    - type: vector_store
      name: product_docs
      provider: qdrant
      collection: documentation
      endpoint: ${QDRANT_URL:-http://localhost:6333}
      config:
        embedding_model: text-embedding-3-large
        dimension: 1536
        distance_metric: cosine
        search_params:
          hnsw_ef: 128
          exact: false
  tools:
    - type: mcp
      server: qdrant
      namespace: default
      capabilities:
        - search_vectors
        - retrieve_points
    - type: mcp
      server: filesystem
      capabilities:
        - read_file
  capabilities:
    - name: search_documentation
      description: "Search product documentation using semantic search"
      input_schema:
        type: object
        required:
          - query
        properties:
          query:
            type: string
            description: "Search query"
          max_results:
            type: integer
            default: 5
            minimum: 1
            maximum: 20
      output_schema:
        type: object
        properties:
          results:
            type: array
            items:
              type: object
              properties:
                content:
                  type: string
                score:
                  type: number
                source:
                  type: string
                page:
                  type: integer
  monitoring:
    traces: true
    metrics: true
```

**3. Index Documents:**
```typescript
import { QdrantClient } from '@qdrant/js-client-rest';
import { OpenAI } from 'openai';
import fs from 'fs';
import pdf from 'pdf-parse';

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });
const openai = new OpenAI();

// Create collection
await qdrant.createCollection('documentation', {
  vectors: {
    size: 1536,
    distance: 'Cosine'
  }
});

// Index documents
const files = ['manual.pdf', 'faq.pdf', 'guide.pdf'];

for (const file of files) {
  const dataBuffer = fs.readFileSync(file);
  const data = await pdf(dataBuffer);

  // Split into chunks
  const chunks = splitIntoChunks(data.text, 1000);

  for (let i = 0; i < chunks.length; i++) {
    // Generate embedding
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: chunks[i]
    });

    // Insert into Qdrant
    await qdrant.upsert('documentation', {
      points: [{
        id: `${file}-${i}`,
        vector: embedding.data[0].embedding,
        payload: {
          content: chunks[i],
          source: file,
          page: i
        }
      }]
    });
  }
}

function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}
```

**4. Implement Search Capability:**
```typescript
import { AgentBuilder, CapabilityExecutor } from '@bluefly/agent-buildkit';
import { QdrantClient } from '@qdrant/js-client-rest';
import { OpenAI } from 'openai';

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });
const openai = new OpenAI();

const searchDocumentation: CapabilityExecutor = async (params) => {
  const { query, max_results = 5 } = params;

  // Generate query embedding
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: query
  });

  // Search Qdrant
  const searchResults = await qdrant.search('documentation', {
    vector: embedding.data[0].embedding,
    limit: max_results,
    with_payload: true
  });

  return {
    results: searchResults.map(result => ({
      content: result.payload.content,
      score: result.score,
      source: result.payload.source,
      page: result.payload.page
    }))
  };
};

// Create and run agent
const agent = await AgentBuilder.fromManifest('support-assistant.ossa.yaml');
agent.registerCapability('search_documentation', searchDocumentation);

const response = await agent.execute({
  message: "How do I reset my password?"
});

console.log(response.result);
```

**5. Use with BuildKit CLI:**
```bash
# Create agent
buildkit agents create support-assistant.ossa.yaml

# Spawn with auto-capability binding
buildkit agents spawn support-assistant \
  --message "How do I reset my password?" \
  --auto-bind-capabilities \
  --wait

# View traces
buildkit agents traces support-assistant
```

---

## Advanced Features

### Multi-Agent Orchestration

OSSA provides native support for multi-agent orchestration, which OpenAI Assistants doesn't have.

**OSSA Orchestrator Example:**
```yaml
apiVersion: ossa/v0.2.2
kind: Agent
metadata:
  name: research-orchestrator
  version: 1.0.0
spec:
  role: orchestration
  taxonomy:
    domain: orchestration
    subdomain: research
    capability: multi_agent_coordination
  subagents:
    - name: web-researcher
      description: "Search and extract web content"
      prompt: "Search the web and extract relevant information"
      tools: [web_search]
      model: inherit
    - name: data-analyzer
      description: "Analyze and summarize data"
      prompt: "Analyze data and create summaries"
      tools: [data_analysis]
      model: inherit
    - name: report-writer
      description: "Write comprehensive reports"
      prompt: "Write well-structured reports"
      tools: [document_generation]
      model: opus  # Use more powerful model
  orchestration:
    strategy: sequential
    max_concurrent: 3
    timeout_seconds: 300
    aggregation: merge_results
    context_management:
      parent_max_tokens: 8000
      subagent_max_tokens: 4000
      compression: auto
```

### Cost Management

```yaml
spec:
  constraints:
    cost:
      maxTokensPerDay: 100000
      maxTokensPerRequest: 4096
      maxCostPerDay: 50.00
      currency: USD
    performance:
      maxLatencySeconds: 30
      maxConcurrentRequests: 10
      timeoutSeconds: 60
```

### Observability

```yaml
spec:
  observability:
    tracing:
      enabled: true
      exporter: otlp  # OpenTelemetry
      endpoint: ${JAEGER_ENDPOINT}
    metrics:
      enabled: true
      exporter: prometheus
      endpoint: ${PROMETHEUS_ENDPOINT}
    logging:
      level: info
      format: json
```

### GitLab Integration

```yaml
spec:
  gitlab:
    project_id: ${GITLAB_PROJECT_ID}
    canBeAssigned: true
    canCollaborate: true
    auto_issues: true
    ci_integration: true
```

---

## Migration Checklist

### Pre-Migration

- [ ] **Inventory OpenAI Assistants**: List all assistants, their functions, and vector stores
- [ ] **Document Dependencies**: Note external APIs, databases, and integrations
- [ ] **Review Usage Patterns**: Understand token usage, costs, and performance
- [ ] **Choose LLM Provider**: Decide on OpenAI, Anthropic, or multi-provider strategy
- [ ] **Setup Infrastructure**: Install BuildKit, Docker, Kubernetes (optional)

### During Migration

- [ ] **Convert Assistants to OSSA Manifests**: Use mapping guide above
- [ ] **Migrate Functions to Capabilities**: Define input/output schemas
- [ ] **Setup Data Sources**: Migrate vector stores to Qdrant/Pinecone/etc.
- [ ] **Implement Capability Handlers**: Write TypeScript/Python handlers
- [ ] **Configure MCP Tools**: Setup filesystem, database, web tools
- [ ] **Add Observability**: Enable tracing, metrics, logging
- [ ] **Test Each Agent**: Verify functionality matches OpenAI behavior
- [ ] **Setup CI/CD**: Integrate with GitLab CI

### Post-Migration

- [ ] **Monitor Performance**: Track latency, throughput, error rates
- [ ] **Validate Cost Savings**: Compare costs vs OpenAI Assistants
- [ ] **Train Team**: Ensure team understands OSSA workflows
- [ ] **Update Documentation**: Document agent behaviors and capabilities
- [ ] **Implement Guardrails**: Add safety constraints and validation
- [ ] **Setup Alerts**: Configure monitoring alerts for failures

---

## Troubleshooting

### Common Issues

#### Issue: Capability Not Executing

**Symptom**: Agent doesn't call your capability

**Solution**:
```yaml
# Ensure capability is properly defined
capabilities:
  - name: my_capability
    description: "Clear, specific description for LLM"  # Important!
    input_schema:
      type: object
      required: [param1]  # Specify required fields
      properties:
        param1:
          type: string
          description: "Detailed parameter description"
```

#### Issue: Vector Search Not Working

**Symptom**: File search returns no results

**Solution**:
```bash
# Verify Qdrant connection
curl http://localhost:6333/collections/documentation

# Check collection exists and has points
# Re-index if needed

# Verify embedding model matches
# OpenAI uses text-embedding-3-large (1536 dims)
```

#### Issue: High Token Usage

**Symptom**: Unexpected token consumption

**Solution**:
```yaml
spec:
  constraints:
    cost:
      maxTokensPerRequest: 2048  # Limit per request
  llm:
    maxTokens: 1024  # Reduce output tokens
    temperature: 0.5  # Lower temperature = more focused
```

#### Issue: Slow Performance

**Symptom**: Agent responses are slow

**Solution**:
```yaml
spec:
  llm:
    provider: anthropic  # Try faster provider
    model: claude-3-haiku  # Use faster model
  constraints:
    performance:
      maxLatencySeconds: 10
      timeoutSeconds: 30
  runtime:
    resources:
      cpu: 2000m  # Increase resources
      memory: 4Gi
```

---

## FAQ

### Q: Can I use OpenAI models with OSSA?
**A:** Yes! OSSA supports OpenAI as a provider. Just set `spec.llm.provider: openai`.

### Q: How do I migrate my vector stores?
**A:** Export embeddings from OpenAI vector stores and import into Qdrant, Pinecone, or Weaviate. See Example 3 above.

### Q: What about streaming responses?
**A:** OSSA supports streaming via the BuildKit SDK:
```typescript
const stream = await agent.executeStream({ message: "..." });
for await (const chunk of stream) {
  console.log(chunk);
}
```

### Q: Can I mix multiple LLM providers?
**A:** Yes! Use different providers for different agents or capabilities:
```yaml
spec:
  llm:
    provider: anthropic  # Default
    model: claude-3-opus
  subagents:
    - name: fast-responder
      model: haiku  # Faster, cheaper
    - name: deep-thinker
      provider: openai  # Different provider
      model: gpt-4-turbo
```

### Q: How do I handle rate limits?
**A:** OSSA includes built-in rate limiting and backoff:
```yaml
spec:
  constraints:
    performance:
      maxConcurrentRequests: 5
  retry_policy:
    max_attempts: 3
    backoff_multiplier: 2
```

### Q: What about compliance and security?
**A:** OSSA provides compliance validation and security features:
```bash
# Validate OSSA compliance
buildkit ossa validate support-assistant.ossa.yaml

# Security audit
buildkit golden audit --security
```

### Q: Can I deploy to Kubernetes?
**A:** Yes! OSSA agents are Kubernetes-native:
```bash
# Deploy to Kubernetes
buildkit golden deploy --env production

# Scale agent
kubectl scale deployment support-assistant --replicas=3
```

### Q: How do I monitor agents?
**A:** OSSA includes full observability:
```bash
# View metrics
buildkit agents metrics support-assistant

# View traces
buildkit agents traces support-assistant

# Prometheus metrics
curl http://localhost:3000/metrics
```

---

## Additional Resources

- **OSSA Specification**: [https://gitlab.bluefly.io/llm/ossa/-/wikis/home](https://gitlab.bluefly.io/llm/ossa/-/wikis/home)
- **BuildKit Documentation**: [https://gitlab.bluefly.io/llm/documentation/-/wikis/BuildKit-CLI-Reference](https://gitlab.bluefly.io/llm/documentation/-/wikis/BuildKit-CLI-Reference)
- **Agent Examples**: `/Users/flux423/Sites/LLM/agent-buildkit/templates/agents/`
- **OSSA Types**: `/Users/flux423/Sites/LLM/agent-buildkit/src/types/ossa.ts`
- **OpenAPI Spec**: `/Users/flux423/Sites/LLM/agent-buildkit/openapi/ossa-complete-v0.1.2.yaml`

---

## Support

- **Issues**: [https://gitlab.bluefly.io/llm/documentation/-/issues](https://gitlab.bluefly.io/llm/documentation/-/issues)
- **BuildKit Repo**: [https://gitlab.bluefly.io/llm/npm/agent-buildkit](https://gitlab.bluefly.io/llm/npm/agent-buildkit)
- **Wiki**: [https://gitlab.bluefly.io/llm/documentation/-/wikis/home](https://gitlab.bluefly.io/llm/documentation/-/wikis/home)

---

**Version**: 1.0.0
**Last Updated**: 2025-11-10
**OSSA Version**: v0.2.2
**Maintainer**: BuildKit Team
