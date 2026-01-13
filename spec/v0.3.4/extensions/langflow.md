# LangFlow Extension for OSSA v0.3.4

## Overview

The `extensions.langflow` schema formalizes bidirectional mapping between LangFlow visual workflows and OSSA manifests. LangFlow is a visual flow builder for LangChain that enables low-code AI agent composition.

This extension enables:
- **Import**: Convert LangFlow flow JSON to OSSA Workflow/Agent manifests
- **Export**: Convert OSSA manifests to LangFlow-compatible flow JSON
- **Runtime**: Execute OSSA workflows via LangFlow API
- **Hybrid**: Reference LangFlow flows from OSSA manifests for visual editing

## Schema Definition

```yaml
extensions:
  langflow:
    type: object
    description: "LangFlow visual flow builder integration"
    required:
      - flow_id
    properties:
      flow_id:
        type: string
        format: uuid
        description: "LangFlow flow UUID (from flow URL or API)"
        examples:
          - "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

      components:
        type: array
        description: "LangFlow component mappings to OSSA capabilities"
        items:
          type: object
          required:
            - node_id
            - component_type
          properties:
            node_id:
              type: string
              pattern: "^[A-Za-z]+-[A-Za-z0-9]+$"
              description: "LangFlow node ID (format: ComponentType-UUID)"
              examples:
                - "ChatInput-jFwUm"
                - "OpenAIModel-x7YzP"

            component_type:
              type: string
              description: "LangFlow component type"
              enum:
                - ChatInput
                - ChatOutput
                - TextInput
                - TextOutput
                - OpenAIModel
                - AnthropicModel
                - OllamaModel
                - Agent
                - Tool
                - VectorStore
                - Retriever
                - Memory
                - Prompt
                - Parser
                - Chain
                - Embeddings
                - Document
                - Custom

            ossa_capability:
              type: string
              pattern: "^[a-z][a-z0-9_]*$"
              description: "Mapped OSSA capability identifier"

            config:
              type: object
              description: "Component-specific configuration"
              additionalProperties: true

      tweaks:
        type: object
        description: "Runtime parameter overrides for flow execution"
        additionalProperties:
          oneOf:
            - type: string
            - type: number
            - type: boolean
            - type: object
        examples:
          - parameter_name: "value"
            "OpenAIModel-x7YzP":
              temperature: 0.7
              model_name: "gpt-4"

      api_endpoint:
        type: object
        description: "LangFlow API configuration"
        required:
          - base_url
        properties:
          base_url:
            type: string
            format: uri
            description: "LangFlow server base URL"
            examples:
              - "https://api.langflow.astra.datastax.com"
              - "http://localhost:7860"

          auth_method:
            type: string
            enum:
              - api_key
              - bearer_token
              - none
            default: api_key
            description: "Authentication method"

          api_key_env:
            type: string
            pattern: "^[A-Z][A-Z0-9_]*$"
            description: "Environment variable containing API key"
            default: "LANGFLOW_API_KEY"

          custom_endpoint:
            type: string
            description: "Custom endpoint name (if configured in LangFlow)"

          timeout_seconds:
            type: integer
            minimum: 1
            maximum: 600
            default: 120
            description: "API request timeout"

      execution_mode:
        type: string
        enum:
          - sync
          - async
          - stream
          - batch
        default: sync
        description: "Flow execution mode"

      input_mapping:
        type: object
        description: "Map OSSA input_schema fields to LangFlow inputs"
        properties:
          target_components:
            type: array
            items:
              type: string
            description: "Component IDs to receive input"
            examples:
              - ["ChatInput-jFwUm"]

          field_mappings:
            type: object
            description: "Map OSSA input fields to component parameters"
            additionalProperties:
              type: object
              properties:
                component:
                  type: string
                  description: "Target component ID"
                parameter:
                  type: string
                  description: "Component parameter name"
              required:
                - component
                - parameter

      output_mapping:
        type: object
        description: "Map LangFlow outputs to OSSA output_schema"
        properties:
          source_components:
            type: array
            items:
              type: string
            description: "Component IDs to extract output from"
            examples:
              - ["ChatOutput-abc123"]

          field_mappings:
            type: object
            description: "Map component outputs to OSSA output fields"
            additionalProperties:
              type: object
              properties:
                component:
                  type: string
                output_field:
                  type: string
              required:
                - component

      state_persistence:
        type: object
        description: "Map flow variables to OSSA state"
        properties:
          memory_component:
            type: string
            description: "Memory component ID for conversation history"

          session_id_field:
            type: string
            description: "Input field containing session identifier"
            default: "session_id"

          persist_outputs:
            type: boolean
            default: true
            description: "Persist outputs across invocations"

      openapi_spec:
        type: object
        description: "OpenAPI specification for flow endpoints"
        properties:
          enabled:
            type: boolean
            default: true

          spec_url:
            type: string
            format: uri
            description: "URL to generated OpenAPI spec"

          zod_schema:
            type: boolean
            default: true
            description: "Generate Zod validation schemas from OpenAPI"

      validation:
        type: object
        description: "Runtime validation configuration"
        properties:
          validate_inputs:
            type: boolean
            default: true
            description: "Validate inputs against OSSA input_schema"

          validate_outputs:
            type: boolean
            default: true
            description: "Validate outputs against OSSA output_schema"

          zod_runtime:
            type: boolean
            default: true
            description: "Use Zod for runtime validation"

          openapi_validation:
            type: boolean
            default: false
            description: "Validate against OpenAPI spec"
```

## Bidirectional Mapping Tables

### LangFlow Component Types to OSSA Capabilities

| LangFlow Component | OSSA Capability | OSSA Kind | Description |
|-------------------|-----------------|-----------|-------------|
| `ChatInput` | `receive_input` | Agent/Workflow | Entry point for user messages |
| `ChatOutput` | `send_output` | Agent/Workflow | Output response to user |
| `TextInput` | `receive_text` | Task | Plain text input |
| `TextOutput` | `send_text` | Task | Plain text output |
| `OpenAIModel` | `llm_inference` | Agent | OpenAI LLM invocation |
| `AnthropicModel` | `llm_inference` | Agent | Anthropic LLM invocation |
| `OllamaModel` | `llm_inference` | Agent | Local Ollama model |
| `Agent` | `agentic_loop` | Agent | LangChain agent with tools |
| `Tool` | (custom capability) | Agent | Tool invocation |
| `VectorStore` | `vector_search` | Task | Vector database operations |
| `Retriever` | `retrieve_documents` | Task | Document retrieval |
| `Memory` | `manage_state` | Agent | Conversation memory |
| `Prompt` | `format_prompt` | Task | Prompt templating |
| `Parser` | `parse_output` | Task | Output parsing |
| `Chain` | `execute_chain` | Workflow | Sequential operations |
| `Embeddings` | `generate_embeddings` | Task | Text embeddings |
| `Document` | `process_document` | Task | Document handling |

### LangFlow Execution Modes to OSSA

| LangFlow Mode | OSSA Execution Type | Description |
|--------------|---------------------|-------------|
| Sync (POST /run) | `deterministic` | Blocking execution |
| Async (POST /run async) | `idempotent` | Non-blocking with callback |
| Stream (stream=true) | `transactional` | Server-sent events |
| Batch (multiple inputs) | `batch.enabled=true` | Parallel processing |

### LangFlow Flow JSON to OSSA Manifest

| LangFlow Field | OSSA Field | Notes |
|---------------|------------|-------|
| `name` | `metadata.name` | Kebab-case conversion |
| `description` | `metadata.description` | Direct mapping |
| `id` | `extensions.langflow.flow_id` | UUID reference |
| `data.nodes[]` | `spec.steps[]` (Workflow) | Node to step conversion |
| `data.edges[]` | `spec.steps[].depends_on` | Edge to dependency |
| `data.nodes[].data.node.template` | `spec.input` / capability config | Component parameters |
| `tags[]` | `metadata.labels` | Tag to label conversion |
| `endpoint_name` | `extensions.langflow.api_endpoint.custom_endpoint` | Custom API path |

### OSSA Manifest to LangFlow Flow JSON

| OSSA Field | LangFlow Field | Notes |
|------------|---------------|-------|
| `metadata.name` | `name` | Title-case conversion |
| `metadata.description` | `description` | Direct mapping |
| `extensions.langflow.flow_id` | `id` | UUID reference |
| `spec.steps[]` | `data.nodes[]` | Step to node conversion |
| `spec.steps[].depends_on` | `data.edges[]` | Dependency to edge |
| `spec.input` | Input component template | Schema to component |
| `spec.output` | Output component template | Schema to component |
| `metadata.labels` | `tags[]` | Label to tag conversion |

## Example Manifests

### 1. Basic Chat Agent with LangFlow Backend

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: langflow-chat-agent
  version: 1.0.0
  description: "Chat agent powered by LangFlow visual workflow"
  labels:
    framework: langflow
    category: conversational

spec:
  role: |
    You are a helpful assistant that answers questions using a knowledge base.
    Use the retrieval tools to find relevant information before responding.

  llm:
    provider: openai
    model: gpt-4
    temperature: 0.7

  tools:
    - name: search_knowledge_base
      description: "Search the vector store for relevant documents"

  state:
    persistence: session
    fields:
      conversation_history:
        type: array
        items:
          type: object

extensions:
  langflow:
    flow_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

    components:
      - node_id: "ChatInput-jFwUm"
        component_type: ChatInput
        ossa_capability: receive_input

      - node_id: "OpenAIModel-x7YzP"
        component_type: OpenAIModel
        ossa_capability: llm_inference
        config:
          model_name: "gpt-4"
          temperature: 0.7

      - node_id: "VectorStore-qRsT1"
        component_type: VectorStore
        ossa_capability: vector_search

      - node_id: "ChatOutput-abc123"
        component_type: ChatOutput
        ossa_capability: send_output

    tweaks:
      "OpenAIModel-x7YzP":
        temperature: 0.7
        max_tokens: 2048
      "VectorStore-qRsT1":
        k: 5

    api_endpoint:
      base_url: "http://localhost:7860"
      auth_method: api_key
      api_key_env: "LANGFLOW_API_KEY"
      timeout_seconds: 120

    execution_mode: stream

    input_mapping:
      target_components:
        - "ChatInput-jFwUm"
      field_mappings:
        user_message:
          component: "ChatInput-jFwUm"
          parameter: "input_value"
        session_id:
          component: "ChatInput-jFwUm"
          parameter: "session_id"

    output_mapping:
      source_components:
        - "ChatOutput-abc123"
      field_mappings:
        response:
          component: "ChatOutput-abc123"
          output_field: "message"

    state_persistence:
      memory_component: "Memory-def456"
      session_id_field: "session_id"
      persist_outputs: true

    validation:
      validate_inputs: true
      validate_outputs: true
      zod_runtime: true
```

### 2. RAG Workflow with LangFlow

```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: langflow-rag-workflow
  version: 1.0.0
  description: "RAG workflow with LangFlow visual editor support"
  labels:
    pattern: rag
    framework: langflow

spec:
  input:
    type: object
    required:
      - query
    properties:
      query:
        type: string
        description: "User query"
      session_id:
        type: string
        format: uuid
      filters:
        type: object
        description: "Optional retrieval filters"

  output:
    type: object
    properties:
      answer:
        type: string
      sources:
        type: array
        items:
          type: object
          properties:
            document_id:
              type: string
            relevance_score:
              type: number
      tokens_used:
        type: integer

  steps:
    - name: embed-query
      ref: tasks/embed-query
      kind: Task
      input:
        query: "${{ input.query }}"

    - name: retrieve-documents
      ref: tasks/vector-search
      kind: Task
      depends_on:
        - embed-query
      input:
        embedding: "${{ steps.embed-query.output.embedding }}"
        filters: "${{ input.filters }}"

    - name: generate-response
      ref: agents/rag-responder
      kind: Agent
      depends_on:
        - retrieve-documents
      input:
        query: "${{ input.query }}"
        context: "${{ steps.retrieve-documents.output.documents }}"

    - name: format-output
      ref: tasks/format-rag-output
      kind: Task
      depends_on:
        - generate-response
        - retrieve-documents
      input:
        answer: "${{ steps.generate-response.output.response }}"
        sources: "${{ steps.retrieve-documents.output.documents }}"

  error_handling:
    on_step_failure: retry
    max_retries: 3

extensions:
  langflow:
    flow_id: "b2c3d4e5-f6a7-8901-bcde-f23456789012"

    components:
      - node_id: "TextInput-abc12"
        component_type: TextInput
        ossa_capability: receive_text

      - node_id: "Embeddings-def34"
        component_type: Embeddings
        ossa_capability: generate_embeddings

      - node_id: "VectorStore-ghi56"
        component_type: VectorStore
        ossa_capability: vector_search

      - node_id: "Retriever-jkl78"
        component_type: Retriever
        ossa_capability: retrieve_documents

      - node_id: "Prompt-mno90"
        component_type: Prompt
        ossa_capability: format_prompt

      - node_id: "OpenAIModel-pqr12"
        component_type: OpenAIModel
        ossa_capability: llm_inference

      - node_id: "Parser-stu34"
        component_type: Parser
        ossa_capability: parse_output

      - node_id: "TextOutput-vwx56"
        component_type: TextOutput
        ossa_capability: send_text

    tweaks:
      "Embeddings-def34":
        model: "text-embedding-3-small"
      "VectorStore-ghi56":
        k: 10
        score_threshold: 0.75
      "OpenAIModel-pqr12":
        model_name: "gpt-4-turbo"
        temperature: 0.3
        max_tokens: 4096

    api_endpoint:
      base_url: "https://api.langflow.astra.datastax.com"
      auth_method: bearer_token
      api_key_env: "ASTRA_LANGFLOW_TOKEN"
      custom_endpoint: "rag-workflow"
      timeout_seconds: 180

    execution_mode: async

    openapi_spec:
      enabled: true
      spec_url: "https://api.langflow.astra.datastax.com/openapi.json"
      zod_schema: true

    validation:
      validate_inputs: true
      validate_outputs: true
      zod_runtime: true
      openapi_validation: true
```

### 3. Multi-Agent Orchestration via LangFlow

```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: langflow-multi-agent
  version: 1.0.0
  description: "Multi-agent orchestration with visual composition"
  labels:
    pattern: orchestration
    framework: langflow

spec:
  input:
    type: object
    required:
      - task
    properties:
      task:
        type: string
      context:
        type: object

  output:
    type: object
    properties:
      result:
        type: string
      agent_responses:
        type: array
        items:
          type: object

  steps:
    - name: planner
      ref: agents/task-planner
      kind: Agent
      input:
        task: "${{ input.task }}"

    - name: researcher
      ref: agents/research-agent
      kind: Agent
      depends_on:
        - planner
      input:
        subtasks: "${{ steps.planner.output.research_tasks }}"

    - name: writer
      ref: agents/content-writer
      kind: Agent
      depends_on:
        - researcher
      input:
        research: "${{ steps.researcher.output.findings }}"
        outline: "${{ steps.planner.output.outline }}"

    - name: reviewer
      ref: agents/quality-reviewer
      kind: Agent
      depends_on:
        - writer
      input:
        content: "${{ steps.writer.output.draft }}"

  concurrency:
    max_parallel: 2

extensions:
  langflow:
    flow_id: "c3d4e5f6-a7b8-9012-cdef-345678901234"

    components:
      - node_id: "Agent-planner"
        component_type: Agent
        ossa_capability: agentic_loop
        config:
          agent_type: "openai-functions"

      - node_id: "Agent-researcher"
        component_type: Agent
        ossa_capability: agentic_loop
        config:
          agent_type: "react"
          tools: ["web_search", "document_reader"]

      - node_id: "Agent-writer"
        component_type: Agent
        ossa_capability: agentic_loop

      - node_id: "Agent-reviewer"
        component_type: Agent
        ossa_capability: agentic_loop

    tweaks:
      "Agent-planner":
        temperature: 0.2
        max_iterations: 5
      "Agent-researcher":
        temperature: 0.5
        max_iterations: 10
      "Agent-writer":
        temperature: 0.7
      "Agent-reviewer":
        temperature: 0.1

    api_endpoint:
      base_url: "http://localhost:7860"
      auth_method: api_key
      api_key_env: "LANGFLOW_API_KEY"
      timeout_seconds: 300

    execution_mode: async
```

### 4. Task with LangFlow Component Binding

```yaml
apiVersion: ossa/v0.3.4
kind: Task
metadata:
  name: langflow-embedding-task
  version: 1.0.0
  description: "Generate embeddings using LangFlow component"

spec:
  execution:
    type: deterministic
    runtime: langflow
    entrypoint: "Embeddings-xyz789"
    timeout_seconds: 30

  capabilities:
    - generate_embeddings

  input:
    type: object
    required:
      - text
    properties:
      text:
        type: string
        maxLength: 8000
      model:
        type: string
        default: "text-embedding-3-small"

  output:
    type: object
    properties:
      embedding:
        type: array
        items:
          type: number
      dimensions:
        type: integer
      model:
        type: string

  batch:
    enabled: true
    parallelism: 10
    chunk_size: 100

extensions:
  langflow:
    flow_id: "d4e5f6a7-b8c9-0123-def4-567890123456"

    components:
      - node_id: "Embeddings-xyz789"
        component_type: Embeddings
        ossa_capability: generate_embeddings
        config:
          model: "text-embedding-3-small"
          chunk_size: 1000

    tweaks:
      "Embeddings-xyz789":
        model: "${{ input.model }}"

    api_endpoint:
      base_url: "http://localhost:7860"
      auth_method: none
      timeout_seconds: 30

    execution_mode: batch

    input_mapping:
      field_mappings:
        text:
          component: "Embeddings-xyz789"
          parameter: "input"

    output_mapping:
      field_mappings:
        embedding:
          component: "Embeddings-xyz789"
          output_field: "embeddings"

    validation:
      validate_inputs: true
      validate_outputs: true
      zod_runtime: true
```

## API Integration

### OpenAPI-First Design

The LangFlow extension follows OpenAPI-first design principles:

1. **Spec Discovery**: Fetch OpenAPI spec from LangFlow instance
2. **Schema Generation**: Generate Zod schemas from OpenAPI types
3. **Validation**: Runtime validation using generated schemas
4. **CRUD Patterns**: Standard REST operations for flow management

### LangFlow API Endpoints

| Endpoint | Method | OSSA Operation | Description |
|----------|--------|----------------|-------------|
| `/v1/flows` | GET | List flows | List all available flows |
| `/v1/flows` | POST | Create flow | Create new flow from OSSA |
| `/v1/flows/{flow_id}` | GET | Get flow | Retrieve flow definition |
| `/v1/flows/{flow_id}` | PUT | Update flow | Update flow from OSSA |
| `/v1/flows/{flow_id}` | DELETE | Delete flow | Remove flow |
| `/v1/run/{flow_id}` | POST | Execute workflow | Run flow with inputs |
| `/v1/run/{flow_id}` (stream) | POST | Stream workflow | Run with SSE output |
| `/v1/flows/upload` | POST | Import flow | Import from JSON |
| `/v1/flows/download` | POST | Export flow | Export to JSON |

### Zod Validation Schemas

```typescript
// Generated from OpenAPI spec
import { z } from 'zod';

export const LangFlowInputSchema = z.object({
  input_value: z.string(),
  input_type: z.enum(['chat', 'text', 'any']).optional(),
  output_type: z.enum(['chat', 'text', 'any']).optional(),
  tweaks: z.record(z.unknown()).optional(),
  stream: z.boolean().default(false),
  session_id: z.string().uuid().optional(),
});

export const LangFlowOutputSchema = z.object({
  outputs: z.array(z.object({
    inputs: z.record(z.unknown()),
    outputs: z.array(z.object({
      results: z.record(z.unknown()),
      artifacts: z.record(z.unknown()).optional(),
    })),
  })),
  session_id: z.string().uuid().optional(),
});

export const LangFlowTweaksSchema = z.record(
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.record(z.unknown()),
  ])
);

export const LangFlowComponentSchema = z.object({
  node_id: z.string().regex(/^[A-Za-z]+-[A-Za-z0-9]+$/),
  component_type: z.enum([
    'ChatInput', 'ChatOutput', 'TextInput', 'TextOutput',
    'OpenAIModel', 'AnthropicModel', 'OllamaModel',
    'Agent', 'Tool', 'VectorStore', 'Retriever',
    'Memory', 'Prompt', 'Parser', 'Chain',
    'Embeddings', 'Document', 'Custom'
  ]),
  ossa_capability: z.string().regex(/^[a-z][a-z0-9_]*$/),
  config: z.record(z.unknown()).optional(),
});

export const LangFlowExtensionSchema = z.object({
  flow_id: z.string().uuid(),
  components: z.array(LangFlowComponentSchema).optional(),
  tweaks: LangFlowTweaksSchema.optional(),
  api_endpoint: z.object({
    base_url: z.string().url(),
    auth_method: z.enum(['api_key', 'bearer_token', 'none']).default('api_key'),
    api_key_env: z.string().regex(/^[A-Z][A-Z0-9_]*$/).default('LANGFLOW_API_KEY'),
    custom_endpoint: z.string().optional(),
    timeout_seconds: z.number().min(1).max(600).default(120),
  }),
  execution_mode: z.enum(['sync', 'async', 'stream', 'batch']).default('sync'),
  input_mapping: z.object({
    target_components: z.array(z.string()).optional(),
    field_mappings: z.record(z.object({
      component: z.string(),
      parameter: z.string(),
    })).optional(),
  }).optional(),
  output_mapping: z.object({
    source_components: z.array(z.string()).optional(),
    field_mappings: z.record(z.object({
      component: z.string(),
      output_field: z.string().optional(),
    })).optional(),
  }).optional(),
  state_persistence: z.object({
    memory_component: z.string().optional(),
    session_id_field: z.string().default('session_id'),
    persist_outputs: z.boolean().default(true),
  }).optional(),
  openapi_spec: z.object({
    enabled: z.boolean().default(true),
    spec_url: z.string().url().optional(),
    zod_schema: z.boolean().default(true),
  }).optional(),
  validation: z.object({
    validate_inputs: z.boolean().default(true),
    validate_outputs: z.boolean().default(true),
    zod_runtime: z.boolean().default(true),
    openapi_validation: z.boolean().default(false),
  }).optional(),
});
```

## Runtime Integration

### Execution Flow

```
OSSA Manifest -> OSSA Runtime -> LangFlow Adapter -> LangFlow API -> LangFlow Server
                                        |
                                        v
                            [Input Validation (Zod)]
                                        |
                                        v
                            [Apply Tweaks & Mappings]
                                        |
                                        v
                            [POST /v1/run/{flow_id}]
                                        |
                                        v
                            [Process Response]
                                        |
                                        v
                            [Output Validation (Zod)]
                                        |
                                        v
                            [Return to OSSA Runtime]
```

### Error Handling

| LangFlow Error | OSSA Error Code | Recovery Action |
|---------------|-----------------|-----------------|
| 401 Unauthorized | `AUTH_FAILED` | Refresh API key |
| 404 Flow Not Found | `FLOW_NOT_FOUND` | Re-sync flow |
| 422 Validation Error | `VALIDATION_FAILED` | Check input schema |
| 429 Rate Limited | `RATE_LIMITED` | Exponential backoff |
| 500 Server Error | `RUNTIME_ERROR` | Retry with backoff |
| Timeout | `TIMEOUT` | Increase timeout or optimize flow |

## Conversion Utilities

### LangFlow to OSSA Converter

```typescript
interface ConversionOptions {
  targetKind: 'Agent' | 'Workflow' | 'Task';
  preserveFlowId: boolean;
  generateCapabilities: boolean;
  includeValidation: boolean;
}

async function langflowToOSSA(
  flowJson: LangFlowJSON,
  options: ConversionOptions
): Promise<OSSAManifest> {
  // 1. Parse flow structure
  const { nodes, edges } = flowJson.data;

  // 2. Identify entry/exit points
  const entryNodes = nodes.filter(n =>
    n.data.type === 'ChatInput' || n.data.type === 'TextInput'
  );
  const exitNodes = nodes.filter(n =>
    n.data.type === 'ChatOutput' || n.data.type === 'TextOutput'
  );

  // 3. Build dependency graph from edges
  const dependencies = buildDependencyGraph(edges);

  // 4. Map components to capabilities
  const capabilities = nodes.map(n => mapToCapability(n));

  // 5. Generate OSSA manifest
  return generateManifest(flowJson, dependencies, capabilities, options);
}
```

### OSSA to LangFlow Converter

```typescript
async function ossaToLangflow(
  manifest: OSSAManifest,
  options: { createNew: boolean }
): Promise<LangFlowJSON> {
  // 1. Extract workflow structure
  const steps = manifest.spec.steps || [];

  // 2. Generate nodes from steps
  const nodes = steps.map(step => createNode(step));

  // 3. Generate edges from dependencies
  const edges = createEdges(steps);

  // 4. Add viewport metadata
  const viewport = calculateViewport(nodes);

  // 5. Return LangFlow JSON
  return {
    name: manifest.metadata.name,
    description: manifest.metadata.description,
    data: { nodes, edges, viewport },
    is_component: false,
  };
}
```

## Best Practices

### 1. Flow Design

- Use descriptive node IDs for easier mapping
- Group related components visually
- Document flows with notes (Markdown)
- Keep flows modular and composable

### 2. Tweaks Management

- Define sensible defaults in LangFlow
- Use tweaks for runtime customization only
- Avoid tweaking structural elements
- Document tweak parameters in OSSA manifest

### 3. State Management

- Use Memory components for conversation state
- Map session IDs consistently
- Consider state cleanup policies
- Handle state migration between versions

### 4. Error Handling

- Implement retry logic for transient failures
- Log all API interactions
- Monitor flow execution metrics
- Set appropriate timeouts

### 5. Security

- Store API keys in environment variables
- Use service accounts for production
- Audit flow access patterns
- Validate all inputs and outputs

## Related Resources

- [LangFlow Documentation](https://docs.langflow.org/)
- [LangFlow API Reference](https://docs.langflow.org/api-flows)
- [LangFlow GitHub Repository](https://github.com/langflow-ai/langflow)
- [OSSA Workflow Specification](../UNIFIED-SCHEMA.md)
- [OSSA Runtime Binding](../runtime/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-31 | Initial release for OSSA v0.3.4 |
