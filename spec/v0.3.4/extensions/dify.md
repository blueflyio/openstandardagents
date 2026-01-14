# Dify Extension for OSSA v0.3.4

## Overview

The `extensions.dify` schema provides comprehensive integration between OSSA agents and [Dify](https://dify.ai), an open-source LLMOps platform. This extension enables bidirectional mapping between Dify's application types, tools, datasets, and workflows with OSSA's Agent, Task, and Workflow kinds.

## Schema Definition

```yaml
extensions:
  dify:
    type: object
    description: "Dify LLMOps platform integration for OSSA agents"
    properties:
      app_type:
        type: string
        enum: [chat, completion, agent, workflow]
        description: "Dify application type mapping"

      app_id:
        type: string
        format: uuid
        description: "Dify application UUID for API operations"

      dataset_ids:
        type: array
        items:
          type: string
          format: uuid
        description: "Dify Knowledge/Dataset UUIDs for RAG"

      workflow_config:
        type: object
        description: "Dify workflow configuration"
        properties:
          graph:
            type: object
            description: "Workflow DAG definition"
          variables:
            type: object
            description: "Workflow input variables"
          output_variables:
            type: array
            description: "Workflow output variable names"

      api_config:
        type: object
        description: "Dify API integration settings"
        properties:
          base_url:
            type: string
            format: uri
            default: "https://api.dify.ai/v1"
          api_key_ref:
            type: string
            description: "Reference to API key (env var or secret)"
          rate_limits:
            type: object
            properties:
              requests_per_minute:
                type: integer
                default: 60
              tokens_per_minute:
                type: integer
                default: 100000

      conversation_config:
        type: object
        description: "Dify conversation/messaging settings"

      annotation_config:
        type: object
        description: "Dify annotation and observability settings"
```

---

## Bidirectional Mapping Tables

### 1. Dify Apps to OSSA Kinds

| Dify App Type | OSSA Kind | Notes |
|---------------|-----------|-------|
| `chat` | `Agent` | Conversational agent with memory |
| `completion` | `Task` | Single-shot text generation |
| `agent` | `Agent` | Autonomous agent with tool use |
| `workflow` | `Workflow` | Visual workflow composition |

### 2. Dify Tools to OSSA Capabilities

| Dify Tool Category | OSSA Capability Pattern | Example |
|--------------------|-------------------------|---------|
| Built-in Tools | `spec.capabilities[]` | `web_search`, `code_interpreter` |
| Custom Tools | `spec.tools[]` with OpenAPI | Custom API integrations |
| API Tools | `spec.functions[]` | RESTful API calls |
| Workflow Tools | `runtime.bindings{}` | Bound at runtime |

### 3. Dify Knowledge/Datasets to OSSA Resources

| Dify Resource | OSSA Equivalent | Mapping |
|---------------|-----------------|---------|
| Dataset | `extensions.mcp.resources[]` | Knowledge base as MCP resource |
| Document | `spec.state.context[]` | Injected context |
| Segment | N/A (internal chunking) | Handled by Dify |
| Embedding | `extensions.dify.embedding_model` | Model configuration |

### 4. Dify Variables to OSSA Input Schema

| Dify Variable Type | JSON Schema Type | OSSA Location |
|--------------------|------------------|---------------|
| `text` | `string` | `spec.input.properties` |
| `paragraph` | `string` (multiline) | `spec.input.properties` |
| `select` | `string` with `enum` | `spec.input.properties` |
| `number` | `number` | `spec.input.properties` |
| `file` | `object` (file ref) | `spec.input.properties` |
| `file-list` | `array` of file refs | `spec.input.properties` |

### 5. Dify Workflow Nodes to OSSA Workflow Steps

| Dify Node Type | OSSA Step Kind | Description |
|----------------|----------------|-------------|
| Start | `spec.triggers[]` | Workflow entry point |
| LLM | `Agent` (inline/ref) | LLM completion node |
| Knowledge Retrieval | `Task` | RAG retrieval step |
| Code | `Task` | Code execution node |
| Template | `Task` | Jinja2 template processing |
| HTTP Request | `Task` | External API call |
| Tool | `Agent`/`Task` | Tool invocation |
| IF/ELSE | `Conditional` | Branching logic |
| Iterator | `Loop` | Iteration over arrays |
| Parameter Extractor | `Task` | JSON extraction |
| Variable Aggregator | `Task` | Variable collection |
| Answer | Output mapping | Response generation |
| End | `spec.output` | Workflow exit |

### 6. Dify API Endpoints to OSSA OpenAPI

| Dify Endpoint | HTTP Method | OSSA Mapping |
|---------------|-------------|--------------|
| `/chat-messages` | POST | Agent execution with conversation |
| `/completion-messages` | POST | Task execution |
| `/workflows/run` | POST | Workflow execution |
| `/workflows/{id}/run` | POST | Specific workflow by ID |
| `/conversations` | GET | Conversation history retrieval |
| `/messages/{id}/feedbacks` | POST | Annotation submission |
| `/datasets` | GET/POST | Knowledge base CRUD |
| `/datasets/{id}/documents` | GET/POST/PUT | Document CRUD |

### 7. Dify Conversations to OSSA Messaging

| Dify Concept | OSSA Equivalent | Location |
|--------------|-----------------|----------|
| Conversation | `spec.messaging.channels[]` | Agent messaging extension |
| Message | A2A message format | `spec.messaging.message_schema` |
| Memory | `spec.state.memory` | Conversation state |
| Variables | `spec.state.variables` | Session variables |

### 8. Dify Annotations to OSSA Observability

| Dify Feature | OSSA Equivalent | Location |
|--------------|-----------------|----------|
| Message Feedback | `spec.observability.feedback` | Thumbs up/down |
| Suggested Questions | `spec.observability.suggestions` | Follow-up prompts |
| Thought Process | `spec.observability.traces` | CoT logging |
| Token Usage | `spec.observability.metrics` | Usage metrics |
| Logs | `spec.observability.logging` | Execution logs |

---

## Detailed Schema Specification

### app_type

Maps Dify application types to OSSA kinds:

```yaml
extensions:
  dify:
    app_type: agent  # chat | completion | agent | workflow
```

**Behavior by type:**

- **chat**: Creates conversational Agent with memory persistence
- **completion**: Creates stateless Task for single-shot generation
- **agent**: Creates autonomous Agent with tool-use capabilities
- **workflow**: Creates Workflow with visual DAG composition

### dataset_ids

References Dify Knowledge bases for RAG:

```yaml
extensions:
  dify:
    dataset_ids:
      - "550e8400-e29b-41d4-a716-446655440000"  # Product docs
      - "6ba7b810-9dad-11d1-80b4-00c04fd430c8"  # FAQ database

    retrieval_config:
      mode: hybrid          # semantic | keyword | hybrid
      top_k: 5
      score_threshold: 0.7
      rerank_model: cohere-rerank
```

### workflow_config

Defines Dify workflow structure:

```yaml
extensions:
  dify:
    workflow_config:
      graph:
        nodes:
          - id: start
            type: start
            data:
              variables:
                - name: query
                  type: text
                  required: true
          - id: llm_1
            type: llm
            data:
              model: gpt-4
              prompt: "Process: {{#start.query#}}"
          - id: end
            type: end
            data:
              outputs:
                - variable: result
                  value_selector: ["llm_1", "text"]
        edges:
          - source: start
            target: llm_1
          - source: llm_1
            target: end

      variables:
        query:
          type: text
          max_length: 2000
          default: ""

      output_variables:
        - result
        - tokens_used
```

### api_config

Dify API integration settings:

```yaml
extensions:
  dify:
    api_config:
      base_url: "https://api.dify.ai/v1"
      api_key_ref: "DIFY_API_KEY"  # Environment variable

      # Or use secret reference
      api_key_secret:
        vault_path: "secrets/dify/api-key"
        key: "value"

      rate_limits:
        requests_per_minute: 60
        tokens_per_minute: 100000
        concurrent_requests: 10

      retry:
        max_attempts: 3
        backoff: exponential
        initial_delay_ms: 1000

      timeout_seconds: 120

      # OpenAPI spec reference for tool generation
      openapi_spec: "./dify-api.openapi.yaml"
```

### conversation_config

Conversation management settings:

```yaml
extensions:
  dify:
    conversation_config:
      # Conversation persistence
      persistence:
        enabled: true
        ttl_hours: 24
        max_messages: 100

      # Conversation variables
      variables:
        user_preference: string
        session_context: object

      # Suggested responses
      suggested_questions:
        enabled: true
        max_suggestions: 3

      # Streaming configuration
      streaming:
        enabled: true
        chunk_size: 100

      # Memory settings
      memory:
        type: buffer_window
        window_size: 10
        summary_enabled: true
```

### annotation_config

Observability and feedback settings:

```yaml
extensions:
  dify:
    annotation_config:
      # Feedback collection
      feedback:
        enabled: true
        types:
          - like
          - dislike
          - regenerate

      # Thought process logging
      thought_logging:
        enabled: true
        detail_level: comprehensive  # minimal | standard | comprehensive

      # Token usage tracking
      usage_tracking:
        enabled: true
        export_format: prometheus
        labels:
          app_id: "{{app_id}}"
          user_id: "{{user_id}}"

      # Log forwarding
      log_export:
        enabled: true
        destination: opentelemetry
        endpoint: "http://otel-collector:4317"

      # Annotation storage for fine-tuning
      annotation_storage:
        enabled: true
        format: jsonl
        path: "./annotations/{{date}}.jsonl"
```

---

## Example Manifests

### 1. Dify Chat Application as OSSA Agent

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: dify-customer-support
  version: 1.0.0
  labels:
    platform: dify
    type: chat
  description: "Customer support agent powered by Dify"

spec:
  role: |
    You are a helpful customer support agent. Use the knowledge base
    to answer questions about products and services.

  llm:
    model: gpt-4-turbo
    provider: openai
    parameters:
      temperature: 0.7
      max_tokens: 2000

  tools:
    - name: search_knowledge
      type: retrieval
      description: "Search product documentation"

  state:
    memory:
      type: buffer_window
      window_size: 20
    variables:
      customer_id: string
      conversation_topic: string

extensions:
  dify:
    app_type: chat
    app_id: "550e8400-e29b-41d4-a716-446655440000"

    dataset_ids:
      - "6ba7b810-9dad-11d1-80b4-00c04fd430c8"  # Product docs

    api_config:
      base_url: "https://api.dify.ai/v1"
      api_key_ref: "DIFY_API_KEY"

    conversation_config:
      persistence:
        enabled: true
        ttl_hours: 24
      streaming:
        enabled: true

    annotation_config:
      feedback:
        enabled: true
        types: [like, dislike]
      thought_logging:
        enabled: true
```

### 2. Dify Completion as OSSA Task

```yaml
apiVersion: ossa/v0.3.4
kind: Task
metadata:
  name: dify-content-generator
  version: 1.0.0
  labels:
    platform: dify
    type: completion
  description: "Content generation task using Dify"

spec:
  execution:
    type: idempotent
    runtime: dify
    timeout_seconds: 60

  input:
    type: object
    required: [topic, style]
    properties:
      topic:
        type: string
        description: "Content topic"
        maxLength: 500
      style:
        type: string
        enum: [formal, casual, technical]
        description: "Writing style"
      word_count:
        type: integer
        minimum: 100
        maximum: 5000
        default: 500

  output:
    type: object
    properties:
      content:
        type: string
        description: "Generated content"
      tokens_used:
        type: integer
        description: "Total tokens consumed"

  capabilities:
    - text_generation
    - content_formatting

extensions:
  dify:
    app_type: completion
    app_id: "7c9e6679-7425-40de-944b-e07fc1f90ae7"

    api_config:
      base_url: "https://api.dify.ai/v1"
      api_key_ref: "DIFY_API_KEY"
      timeout_seconds: 60

    annotation_config:
      usage_tracking:
        enabled: true
        export_format: prometheus
```

### 3. Dify Agent with Tools as OSSA Agent

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: dify-research-agent
  version: 1.0.0
  labels:
    platform: dify
    type: agent
  description: "Autonomous research agent with tool access"

spec:
  role: |
    You are a research assistant capable of searching the web,
    analyzing documents, and synthesizing information.

  llm:
    model: gpt-4-turbo
    provider: openai
    parameters:
      temperature: 0.3
      max_tokens: 4000

  tools:
    - name: web_search
      type: builtin
      description: "Search the web for information"
      parameters:
        type: object
        properties:
          query:
            type: string
            description: "Search query"
        required: [query]

    - name: document_reader
      type: builtin
      description: "Read and parse documents"

    - name: calculator
      type: builtin
      description: "Perform calculations"

  functions:
    - name: search_web
      description: "Execute a web search"
      parameters:
        type: object
        properties:
          query:
            type: string
          num_results:
            type: integer
            default: 5
        required: [query]

  autonomy:
    level: supervised
    max_iterations: 10
    requires_approval_for:
      - external_api_calls

  constraints:
    allowed_actions:
      - search
      - read
      - analyze
    prohibited_actions:
      - write_files
      - execute_code

extensions:
  dify:
    app_type: agent
    app_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

    dataset_ids:
      - "b5d5b7e5-5d5b-4d5b-8d5b-5d5b5d5b5d5b"  # Research docs

    api_config:
      base_url: "https://api.dify.ai/v1"
      api_key_ref: "DIFY_API_KEY"

    tool_mapping:
      web_search: "dify.builtin.web_search"
      document_reader: "dify.builtin.document_reader"
      calculator: "dify.builtin.calculator"

    annotation_config:
      thought_logging:
        enabled: true
        detail_level: comprehensive
```

### 4. Dify Workflow as OSSA Workflow

```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: dify-content-pipeline
  version: 1.0.0
  labels:
    platform: dify
    type: workflow
  description: "Content generation and review pipeline"

spec:
  triggers:
    - type: webhook
      path: /content/generate

  input:
    type: object
    required: [topic, target_audience]
    properties:
      topic:
        type: string
      target_audience:
        type: string
        enum: [technical, business, general]
      review_required:
        type: boolean
        default: true

  output:
    type: object
    properties:
      final_content:
        type: string
      review_feedback:
        type: string
      status:
        type: string
        enum: [approved, rejected, pending]

  steps:
    - id: generate-draft
      name: "Generate Content Draft"
      kind: Task
      ref: ./tasks/generate-content.yaml
      input:
        topic: "${{ workflow.input.topic }}"
        audience: "${{ workflow.input.target_audience }}"
      output:
        to: draft_content

    - id: check-review
      name: "Check if Review Required"
      kind: Conditional
      condition: "${{ workflow.input.review_required == true }}"
      then:
        - id: human-review
          name: "Human Review"
          kind: Task
          ref: ./tasks/human-review.yaml
          input:
            content: "${{ steps.generate-draft.output.content }}"
          output:
            to: review_result
      else:
        - id: auto-approve
          name: "Auto Approve"
          kind: Task
          inline:
            spec:
              execution:
                type: deterministic
              input:
                type: object
                properties:
                  content:
                    type: string
              output:
                type: object
                properties:
                  status:
                    type: string
                    const: approved
                  feedback:
                    type: string
                    const: "Auto-approved (no review required)"
          input:
            content: "${{ steps.generate-draft.output.content }}"
          output:
            to: review_result

    - id: finalize
      name: "Finalize Content"
      kind: Task
      ref: ./tasks/finalize-content.yaml
      depends_on: [generate-draft]
      input:
        draft: "${{ steps.generate-draft.output.content }}"
        feedback: "${{ steps.review_result.feedback }}"
      output:
        to: final_output

extensions:
  dify:
    app_type: workflow
    app_id: "c3d4e5f6-7890-1234-5678-90abcdef1234"

    workflow_config:
      graph:
        nodes:
          - id: start
            type: start
            data:
              variables:
                - name: topic
                  type: text
                  required: true
                - name: target_audience
                  type: select
                  options: [technical, business, general]
                - name: review_required
                  type: boolean
                  default: true

          - id: generate
            type: llm
            data:
              model: gpt-4-turbo
              prompt: |
                Generate content about {{#start.topic#}}
                for {{#start.target_audience#}} audience.

          - id: check
            type: if-else
            data:
              conditions:
                - comparison_operator: "=="
                  variable_selector: ["start", "review_required"]
                  value: true

          - id: review
            type: human-review
            data:
              reviewer_role: content_editor

          - id: auto
            type: template
            data:
              template: |
                {"status": "approved", "feedback": "Auto-approved"}

          - id: end
            type: end
            data:
              outputs:
                - variable: final_content
                  value_selector: ["generate", "text"]
                - variable: review_feedback
                  value_selector: ["review", "feedback"]

        edges:
          - source: start
            target: generate
          - source: generate
            target: check
          - source: check
            target: review
            condition: true
          - source: check
            target: auto
            condition: false
          - source: review
            target: end
          - source: auto
            target: end

      variables:
        topic:
          type: text
          max_length: 500
        target_audience:
          type: select
          options: [technical, business, general]
        review_required:
          type: boolean
          default: true

      output_variables:
        - final_content
        - review_feedback
        - status

    api_config:
      base_url: "https://api.dify.ai/v1"
      api_key_ref: "DIFY_API_KEY"

    annotation_config:
      thought_logging:
        enabled: true
      usage_tracking:
        enabled: true
```

### 5. Dify RAG Application

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: dify-rag-assistant
  version: 1.0.0
  labels:
    platform: dify
    type: rag
  description: "RAG-powered Q&A assistant"

spec:
  role: |
    You are a knowledgeable assistant that answers questions
    based on the provided documentation. Always cite your sources.

  llm:
    model: gpt-4-turbo
    provider: openai
    parameters:
      temperature: 0.1
      max_tokens: 2000

  tools:
    - name: knowledge_search
      type: retrieval
      description: "Search knowledge base"
      parameters:
        type: object
        properties:
          query:
            type: string
          top_k:
            type: integer
            default: 5
        required: [query]

extensions:
  dify:
    app_type: chat
    app_id: "d4e5f6a7-8901-2345-6789-0abcdef12345"

    dataset_ids:
      - "e5f6a7b8-9012-3456-7890-abcdef123456"  # Primary docs
      - "f6a7b8c9-0123-4567-8901-bcdef1234567"  # Support articles

    retrieval_config:
      mode: hybrid
      top_k: 5
      score_threshold: 0.6
      rerank_model: cohere-rerank-multilingual-v3.0

      # Chunking settings (for document ingestion)
      chunking:
        mode: automatic
        max_tokens: 500
        overlap_tokens: 50

      # Embedding configuration
      embedding:
        model: text-embedding-3-large
        provider: openai
        dimensions: 3072

    conversation_config:
      memory:
        type: buffer_window
        window_size: 10
      suggested_questions:
        enabled: true

    annotation_config:
      feedback:
        enabled: true
        types: [like, dislike, report_error]
      citation_tracking:
        enabled: true
        format: inline
```

---

## Zod Validation Schema

For TypeScript/JavaScript implementations:

```typescript
import { z } from 'zod';

// Dify App Types
const DifyAppType = z.enum(['chat', 'completion', 'agent', 'workflow']);

// Variable Types
const DifyVariableType = z.enum([
  'text',
  'paragraph',
  'select',
  'number',
  'file',
  'file-list'
]);

// Retrieval Modes
const RetrievalMode = z.enum(['semantic', 'keyword', 'hybrid']);

// Workflow Node Types
const WorkflowNodeType = z.enum([
  'start',
  'end',
  'llm',
  'knowledge-retrieval',
  'code',
  'template',
  'http-request',
  'tool',
  'if-else',
  'iterator',
  'parameter-extractor',
  'variable-aggregator',
  'answer',
  'human-review'
]);

// Workflow Edge
const WorkflowEdge = z.object({
  source: z.string(),
  target: z.string(),
  condition: z.union([z.boolean(), z.string()]).optional()
});

// Workflow Node
const WorkflowNode = z.object({
  id: z.string(),
  type: WorkflowNodeType,
  data: z.record(z.unknown()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }).optional()
});

// Workflow Graph
const WorkflowGraph = z.object({
  nodes: z.array(WorkflowNode),
  edges: z.array(WorkflowEdge)
});

// Workflow Variable
const WorkflowVariable = z.object({
  type: DifyVariableType,
  max_length: z.number().optional(),
  default: z.unknown().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional()
});

// Workflow Config
const WorkflowConfig = z.object({
  graph: WorkflowGraph.optional(),
  variables: z.record(WorkflowVariable).optional(),
  output_variables: z.array(z.string()).optional()
});

// Rate Limits
const RateLimits = z.object({
  requests_per_minute: z.number().default(60),
  tokens_per_minute: z.number().default(100000),
  concurrent_requests: z.number().optional()
});

// Retry Config
const RetryConfig = z.object({
  max_attempts: z.number().default(3),
  backoff: z.enum(['fixed', 'exponential', 'linear']).default('exponential'),
  initial_delay_ms: z.number().default(1000),
  max_delay_ms: z.number().optional()
});

// API Config
const ApiConfig = z.object({
  base_url: z.string().url().default('https://api.dify.ai/v1'),
  api_key_ref: z.string().optional(),
  api_key_secret: z.object({
    vault_path: z.string(),
    key: z.string().default('value')
  }).optional(),
  rate_limits: RateLimits.optional(),
  retry: RetryConfig.optional(),
  timeout_seconds: z.number().default(120),
  openapi_spec: z.string().optional()
});

// Conversation Persistence
const ConversationPersistence = z.object({
  enabled: z.boolean().default(true),
  ttl_hours: z.number().default(24),
  max_messages: z.number().default(100)
});

// Streaming Config
const StreamingConfig = z.object({
  enabled: z.boolean().default(true),
  chunk_size: z.number().optional()
});

// Memory Config
const MemoryConfig = z.object({
  type: z.enum(['buffer', 'buffer_window', 'summary', 'conversation_kg']),
  window_size: z.number().optional(),
  summary_enabled: z.boolean().optional()
});

// Conversation Config
const ConversationConfig = z.object({
  persistence: ConversationPersistence.optional(),
  variables: z.record(z.string()).optional(),
  suggested_questions: z.object({
    enabled: z.boolean().default(true),
    max_suggestions: z.number().default(3)
  }).optional(),
  streaming: StreamingConfig.optional(),
  memory: MemoryConfig.optional()
});

// Feedback Types
const FeedbackType = z.enum(['like', 'dislike', 'regenerate', 'report_error']);

// Annotation Config
const AnnotationConfig = z.object({
  feedback: z.object({
    enabled: z.boolean().default(true),
    types: z.array(FeedbackType).optional()
  }).optional(),
  thought_logging: z.object({
    enabled: z.boolean().default(true),
    detail_level: z.enum(['minimal', 'standard', 'comprehensive']).default('standard')
  }).optional(),
  usage_tracking: z.object({
    enabled: z.boolean().default(true),
    export_format: z.enum(['prometheus', 'opentelemetry', 'json']).optional(),
    labels: z.record(z.string()).optional()
  }).optional(),
  log_export: z.object({
    enabled: z.boolean().default(false),
    destination: z.enum(['opentelemetry', 'elasticsearch', 'loki']).optional(),
    endpoint: z.string().optional()
  }).optional(),
  annotation_storage: z.object({
    enabled: z.boolean().default(false),
    format: z.enum(['jsonl', 'parquet', 'csv']).default('jsonl'),
    path: z.string().optional()
  }).optional(),
  citation_tracking: z.object({
    enabled: z.boolean().default(false),
    format: z.enum(['inline', 'footnote', 'endnote']).default('inline')
  }).optional()
});

// Retrieval Config
const RetrievalConfig = z.object({
  mode: RetrievalMode.default('hybrid'),
  top_k: z.number().default(5),
  score_threshold: z.number().min(0).max(1).default(0.7),
  rerank_model: z.string().optional(),
  chunking: z.object({
    mode: z.enum(['automatic', 'custom']).default('automatic'),
    max_tokens: z.number().default(500),
    overlap_tokens: z.number().default(50)
  }).optional(),
  embedding: z.object({
    model: z.string(),
    provider: z.string(),
    dimensions: z.number().optional()
  }).optional()
});

// Main Dify Extension Schema
export const DifyExtension = z.object({
  app_type: DifyAppType,
  app_id: z.string().uuid().optional(),
  dataset_ids: z.array(z.string().uuid()).optional(),
  workflow_config: WorkflowConfig.optional(),
  api_config: ApiConfig.optional(),
  conversation_config: ConversationConfig.optional(),
  annotation_config: AnnotationConfig.optional(),
  retrieval_config: RetrievalConfig.optional(),
  tool_mapping: z.record(z.string()).optional()
});

export type DifyExtensionType = z.infer<typeof DifyExtension>;

// Validation function
export function validateDifyExtension(data: unknown): DifyExtensionType {
  return DifyExtension.parse(data);
}
```

---

## CRUD Operations via OpenAPI

### Create Chat Message (Chat/Agent App)

```yaml
openapi: 3.1.0
paths:
  /chat-messages:
    post:
      operationId: createChatMessage
      summary: Send a message to a chat/agent app
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - query
              properties:
                query:
                  type: string
                  description: User message content
                inputs:
                  type: object
                  additionalProperties: true
                  description: Variable inputs
                response_mode:
                  type: string
                  enum: [streaming, blocking]
                  default: streaming
                conversation_id:
                  type: string
                  format: uuid
                  description: Existing conversation ID for context
                user:
                  type: string
                  description: User identifier
                files:
                  type: array
                  items:
                    type: object
                    properties:
                      type:
                        type: string
                        enum: [image, document]
                      transfer_method:
                        type: string
                        enum: [remote_url, local_file]
                      url:
                        type: string
                        format: uri
      responses:
        '200':
          description: Chat response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatMessageResponse'
            text/event-stream:
              schema:
                $ref: '#/components/schemas/StreamingChatResponse'
```

### Execute Workflow

```yaml
paths:
  /workflows/run:
    post:
      operationId: runWorkflow
      summary: Execute a workflow
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - inputs
              properties:
                inputs:
                  type: object
                  additionalProperties: true
                  description: Workflow input variables
                response_mode:
                  type: string
                  enum: [streaming, blocking]
                  default: blocking
                user:
                  type: string
                files:
                  type: array
                  items:
                    type: object
      responses:
        '200':
          description: Workflow execution result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkflowRunResponse'
```

### Knowledge Base Operations

```yaml
paths:
  /datasets:
    get:
      operationId: listDatasets
      summary: List available datasets
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: List of datasets
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Dataset'
                  has_more:
                    type: boolean

    post:
      operationId: createDataset
      summary: Create a new dataset
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  type: string
                description:
                  type: string
                indexing_technique:
                  type: string
                  enum: [high_quality, economy]
                  default: high_quality
                permission:
                  type: string
                  enum: [only_me, all_team_members]
                  default: only_me
      responses:
        '201':
          description: Dataset created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Dataset'

  /datasets/{dataset_id}/documents:
    post:
      operationId: createDocument
      summary: Add document to dataset
      parameters:
        - name: dataset_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                data:
                  type: object
                  properties:
                    indexing_technique:
                      type: string
                    process_rule:
                      type: object
      responses:
        '201':
          description: Document added
```

### Feedback/Annotation Operations

```yaml
paths:
  /messages/{message_id}/feedbacks:
    post:
      operationId: submitFeedback
      summary: Submit feedback for a message
      parameters:
        - name: message_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - rating
                - user
              properties:
                rating:
                  type: string
                  enum: [like, dislike]
                user:
                  type: string
                content:
                  type: string
                  description: Optional feedback text
      responses:
        '200':
          description: Feedback submitted
```

---

## Migration from Dify to OSSA

### Exporting Dify App to OSSA Manifest

```typescript
// dify-to-ossa.ts
import { DifyExtension } from './schemas/dify';

interface DifyApp {
  id: string;
  name: string;
  mode: 'chat' | 'completion' | 'agent' | 'workflow';
  model_config: {
    model: string;
    provider: string;
    configs: Record<string, unknown>;
  };
  dataset_ids: string[];
  workflow?: Record<string, unknown>;
}

export function convertDifyAppToOSSA(difyApp: DifyApp): Record<string, unknown> {
  const kind = difyApp.mode === 'workflow' ? 'Workflow' :
               difyApp.mode === 'completion' ? 'Task' : 'Agent';

  const base = {
    apiVersion: 'ossa/v0.3.4',
    kind,
    metadata: {
      name: difyApp.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      labels: {
        platform: 'dify',
        type: difyApp.mode
      }
    },
    extensions: {
      dify: {
        app_type: difyApp.mode,
        app_id: difyApp.id,
        dataset_ids: difyApp.dataset_ids,
        api_config: {
          base_url: 'https://api.dify.ai/v1',
          api_key_ref: 'DIFY_API_KEY'
        }
      }
    }
  };

  if (kind === 'Agent') {
    return {
      ...base,
      spec: {
        role: 'Converted from Dify application',
        llm: {
          model: difyApp.model_config.model,
          provider: difyApp.model_config.provider,
          parameters: difyApp.model_config.configs
        }
      }
    };
  }

  if (kind === 'Task') {
    return {
      ...base,
      spec: {
        execution: {
          type: 'idempotent',
          runtime: 'dify'
        },
        input: {
          type: 'object',
          properties: {
            prompt: { type: 'string' }
          }
        }
      }
    };
  }

  // Workflow
  return {
    ...base,
    spec: {
      triggers: [{ type: 'manual' }],
      steps: []  // Would need workflow graph conversion
    },
    extensions: {
      ...base.extensions,
      dify: {
        ...base.extensions.dify,
        workflow_config: {
          graph: difyApp.workflow
        }
      }
    }
  };
}
```

---

## Related Resources

- [Dify Documentation](https://docs.dify.ai)
- [Dify API Reference](https://docs.dify.ai/api-reference)
- [Dify GitHub Repository](https://github.com/langgenius/dify)
- [OSSA Specification](https://openstandardagents.org)
- [MCP Extension](./mcp.md)
- [Drupal Extension](./drupal.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.3.4 | 2025-01 | Initial Dify extension specification |
