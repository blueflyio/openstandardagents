# OpenAI Assistants API Extension for OSSA v0.3.4

## Overview

The `extensions.openai_assistants` schema provides bidirectional mapping between OpenAI's Assistants API and OSSA manifests. OpenAI Assistants API is OpenAI's managed agent runtime that provides stateful conversations, built-in tools, and file handling capabilities.

This extension enables:
- Converting OSSA agents to OpenAI Assistants
- Importing OpenAI Assistants as OSSA manifests
- Mapping OpenAI concepts to OSSA equivalents
- Runtime integration with OpenAI's managed infrastructure

## Schema Definition

```yaml
extensions:
  openai_assistants:
    type: object
    description: "OpenAI Assistants API integration for OSSA agents"
    properties:
      assistant_id:
        type: string
        pattern: "^asst_[a-zA-Z0-9]+$"
        description: "OpenAI Assistant ID (e.g., asst_abc123)"

      model:
        type: string
        enum:
          - gpt-4o
          - gpt-4o-mini
          - gpt-4-turbo
          - gpt-4-turbo-preview
          - gpt-4
          - gpt-3.5-turbo
          - gpt-3.5-turbo-16k
        description: "OpenAI model to use for this assistant"

      instructions:
        type: string
        maxLength: 256000
        description: "System instructions for the assistant (maps to spec.prompts.system)"

      tools:
        type: array
        description: "OpenAI tools configuration"
        items:
          $ref: "#/definitions/OpenAITool"

      tool_resources:
        type: object
        description: "Resources for tools (file_search, code_interpreter)"
        properties:
          code_interpreter:
            type: object
            properties:
              file_ids:
                type: array
                items:
                  type: string
                  pattern: "^file-[a-zA-Z0-9]+$"
                maxItems: 20
                description: "File IDs for code interpreter (max 20)"

          file_search:
            type: object
            properties:
              vector_store_ids:
                type: array
                items:
                  type: string
                  pattern: "^vs_[a-zA-Z0-9]+$"
                maxItems: 1
                description: "Vector store IDs for file search (max 1)"

      file_ids:
        type: array
        items:
          type: string
          pattern: "^file-[a-zA-Z0-9]+$"
        description: "Legacy file IDs (deprecated, use tool_resources)"

      thread_config:
        type: object
        description: "Thread configuration for conversation state"
        properties:
          auto_create:
            type: boolean
            default: true
            description: "Automatically create threads for new conversations"

          retention_days:
            type: integer
            minimum: 1
            maximum: 365
            default: 30
            description: "Thread retention period in days"

          metadata_schema:
            type: object
            description: "JSON Schema for thread metadata"
            additionalProperties: true

          initial_messages:
            type: array
            description: "Initial messages to populate new threads"
            items:
              $ref: "#/definitions/OpenAIMessage"

      run_config:
        type: object
        description: "Run execution configuration"
        properties:
          max_prompt_tokens:
            type: integer
            minimum: 256
            description: "Maximum prompt tokens per run"

          max_completion_tokens:
            type: integer
            minimum: 256
            description: "Maximum completion tokens per run"

          truncation_strategy:
            type: object
            properties:
              type:
                type: string
                enum: [auto, last_messages]
                default: auto
              last_messages:
                type: integer
                minimum: 1
                description: "Number of recent messages to keep"

          response_format:
            oneOf:
              - type: string
                enum: [auto, text]
              - type: object
                properties:
                  type:
                    type: string
                    enum: [json_object, json_schema]
                  json_schema:
                    type: object
                    description: "JSON Schema for structured output"

          parallel_tool_calls:
            type: boolean
            default: true
            description: "Allow parallel tool execution"

          timeout_seconds:
            type: integer
            minimum: 1
            maximum: 600
            default: 300
            description: "Run execution timeout"

      streaming:
        type: object
        description: "SSE streaming configuration"
        properties:
          enabled:
            type: boolean
            default: true
            description: "Enable streaming responses"

          events:
            type: array
            items:
              type: string
              enum:
                - thread.created
                - thread.run.created
                - thread.run.queued
                - thread.run.in_progress
                - thread.run.requires_action
                - thread.run.completed
                - thread.run.incomplete
                - thread.run.failed
                - thread.run.cancelling
                - thread.run.cancelled
                - thread.run.expired
                - thread.run.step.created
                - thread.run.step.in_progress
                - thread.run.step.delta
                - thread.run.step.completed
                - thread.run.step.expired
                - thread.message.created
                - thread.message.in_progress
                - thread.message.delta
                - thread.message.completed
                - thread.message.incomplete
                - error
                - done
            description: "Events to stream"

          buffer_size:
            type: integer
            default: 4096
            description: "SSE buffer size in bytes"

      api_config:
        type: object
        description: "OpenAI API configuration"
        properties:
          base_url:
            type: string
            format: uri
            default: "https://api.openai.com/v1"
            description: "OpenAI API base URL"

          api_version:
            type: string
            pattern: "^v[0-9]+(\\.[0-9]+)?$"
            description: "OpenAI API version"

          organization_id:
            type: string
            pattern: "^org-[a-zA-Z0-9]+$"
            description: "OpenAI organization ID"

          project_id:
            type: string
            description: "OpenAI project ID"

          timeout_ms:
            type: integer
            default: 60000
            description: "API request timeout in milliseconds"

          retry:
            type: object
            properties:
              max_retries:
                type: integer
                default: 3
              backoff_factor:
                type: number
                default: 2

      observability:
        type: object
        description: "Run steps and observability configuration"
        properties:
          trace_run_steps:
            type: boolean
            default: true
            description: "Enable run step tracing"

          step_types:
            type: array
            items:
              type: string
              enum:
                - message_creation
                - tool_calls
            description: "Step types to trace"

          include_usage:
            type: boolean
            default: true
            description: "Include token usage in traces"

          otel_exporter:
            type: string
            enum: [otlp, console, none]
            default: otlp
            description: "OpenTelemetry exporter type"

definitions:
  OpenAITool:
    type: object
    description: "OpenAI tool definition"
    required: [type]
    properties:
      type:
        type: string
        enum:
          - code_interpreter
          - file_search
          - function
        description: "Tool type"

      function:
        type: object
        description: "Function tool definition (when type=function)"
        required: [name]
        properties:
          name:
            type: string
            pattern: "^[a-zA-Z_][a-zA-Z0-9_]*$"
            maxLength: 64
            description: "Function name"

          description:
            type: string
            maxLength: 1024
            description: "Function description"

          parameters:
            type: object
            description: "JSON Schema for function parameters"

          strict:
            type: boolean
            default: false
            description: "Enable strict mode for structured outputs"

  OpenAIMessage:
    type: object
    description: "OpenAI message definition"
    required: [role, content]
    properties:
      role:
        type: string
        enum: [user, assistant]
        description: "Message role"

      content:
        oneOf:
          - type: string
          - type: array
            items:
              $ref: "#/definitions/OpenAIContentPart"
        description: "Message content"

      attachments:
        type: array
        items:
          type: object
          properties:
            file_id:
              type: string
            tools:
              type: array
              items:
                type: object
                properties:
                  type:
                    type: string
                    enum: [code_interpreter, file_search]
        description: "File attachments"

      metadata:
        type: object
        additionalProperties:
          type: string
        maxProperties: 16
        description: "Message metadata (max 16 key-value pairs)"

  OpenAIContentPart:
    type: object
    description: "Content part for multimodal messages"
    required: [type]
    properties:
      type:
        type: string
        enum: [text, image_url, image_file]

      text:
        type: string
        description: "Text content (when type=text)"

      image_url:
        type: object
        properties:
          url:
            type: string
            format: uri
          detail:
            type: string
            enum: [auto, low, high]
        description: "Image URL (when type=image_url)"

      image_file:
        type: object
        properties:
          file_id:
            type: string
          detail:
            type: string
            enum: [auto, low, high]
        description: "Image file (when type=image_file)"
```

## Concept Mapping

### OpenAI Assistant to OSSA Agent

| OpenAI Concept | OSSA Equivalent | Notes |
|----------------|-----------------|-------|
| Assistant | `kind: Agent` | Primary resource mapping |
| Assistant ID | `extensions.openai_assistants.assistant_id` | External reference |
| Assistant Name | `metadata.name` | Required field |
| Assistant Description | `metadata.description` | Optional field |
| Instructions | `spec.prompts.system` | System prompt |
| Model | `spec.model.name` | LLM model selection |
| Tools | `spec.capabilities` + extension tools | Capability mapping |
| Metadata | `metadata.annotations` | Key-value pairs |

### OpenAI Thread to OSSA Conversation State

| OpenAI Thread | OSSA Equivalent | Notes |
|---------------|-----------------|-------|
| Thread | `messaging.subscribes[].channel` | Conversation channel |
| Thread ID | Message correlation ID | Session tracking |
| Thread Messages | OSSA message history | State persistence |
| Thread Metadata | Message metadata | Context propagation |

### OpenAI Run to OSSA Execution

| OpenAI Run | OSSA Equivalent | Notes |
|------------|-----------------|-------|
| Run | Task execution | Single agent invocation |
| Run Status | Task status | Lifecycle states |
| Run Steps | `observability.trace_run_steps` | Execution tracing |
| Required Actions | `messaging.commands` | Tool call handling |
| Run Metadata | Execution context | Runtime data |

### OpenAI Tools to OSSA Capabilities

| OpenAI Tool | OSSA Capability | Notes |
|-------------|-----------------|-------|
| `code_interpreter` | `code_execution` | Sandboxed code execution |
| `file_search` | `retrieval` + `file_access` | Vector search over files |
| `function` | `tool_use` + MCP tools | Custom function calling |

### OpenAI Files to OSSA Resources

| OpenAI Files | OSSA Equivalent | Notes |
|--------------|-----------------|-------|
| File ID | Resource URI | `file://` or custom scheme |
| File Purpose | Resource type annotation | Purpose-based classification |
| Vector Store | MCP resource | Indexed document collection |

### OpenAI Messages to OSSA Messaging

| OpenAI Message | OSSA Messaging | Notes |
|----------------|----------------|-------|
| User Message | Inbound message | User input |
| Assistant Message | Outbound message | Agent response |
| Message Content | Message payload | Text/multimodal content |
| Message Attachments | Resource references | File associations |
| Message Annotations | Metadata | Citations, references |

### OpenAI Run Steps to OSSA Observability

| OpenAI Run Step | OSSA Observability | Notes |
|-----------------|-------------------|-------|
| Step Type | Span type | Operation classification |
| Step Status | Span status | Completion state |
| Step Details | Span attributes | Execution details |
| Usage | Token metrics | Cost tracking |

### OpenAI Streaming to OSSA SSE Protocol

| OpenAI Streaming | OSSA SSE | Notes |
|------------------|----------|-------|
| Stream Events | SSE events | Real-time updates |
| Event Types | Event classification | Typed event handling |
| Delta Updates | Incremental content | Token-by-token streaming |
| Done Event | Stream termination | Completion signal |

## Bidirectional Mapping Tables

### Status Mapping

| OpenAI Run Status | OSSA Task Status | Direction |
|-------------------|------------------|-----------|
| `queued` | `pending` | Bidirectional |
| `in_progress` | `running` | Bidirectional |
| `requires_action` | `awaiting_input` | Bidirectional |
| `cancelling` | `cancelling` | Bidirectional |
| `cancelled` | `cancelled` | Bidirectional |
| `failed` | `failed` | Bidirectional |
| `completed` | `completed` | Bidirectional |
| `incomplete` | `incomplete` | Bidirectional |
| `expired` | `timeout` | Bidirectional |

### Tool Type Mapping

| OpenAI Tool Type | OSSA Capability | Reverse Mapping |
|------------------|-----------------|-----------------|
| `code_interpreter` | `code_execution: { sandbox: true }` | Auto-detect sandbox |
| `file_search` | `retrieval: { type: vector }` | Check retrieval config |
| `function` | MCP tool definition | Export as function |

### Model Mapping

| OpenAI Model | OSSA Model Reference | Notes |
|--------------|---------------------|-------|
| `gpt-4o` | `openai/gpt-4o` | Latest GPT-4 Omni |
| `gpt-4o-mini` | `openai/gpt-4o-mini` | Smaller, faster |
| `gpt-4-turbo` | `openai/gpt-4-turbo` | GPT-4 Turbo |
| `gpt-4` | `openai/gpt-4` | Base GPT-4 |
| `gpt-3.5-turbo` | `openai/gpt-3.5-turbo` | GPT-3.5 |

## Example Manifests

### 1. Code Assistant with Interpreter

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: code-assistant
  version: 1.0.0
  description: "Python code execution assistant with file analysis"
  labels:
    domain: development
    tier: tier_2_write_limited

spec:
  model:
    name: gpt-4o
    provider: openai
    parameters:
      temperature: 0.7
      max_tokens: 4096

  prompts:
    system: |
      You are a Python code assistant. You can:
      - Execute Python code in a sandboxed environment
      - Analyze uploaded files
      - Generate visualizations
      - Help debug code issues

  capabilities:
    - code_execution
    - file_access
    - retrieval

  inputs:
    - name: user_query
      type: string
      required: true
    - name: files
      type: array
      items:
        type: file
      required: false

  outputs:
    - name: response
      type: string
    - name: generated_files
      type: array
      items:
        type: file

extensions:
  openai_assistants:
    assistant_id: asst_abc123xyz
    model: gpt-4o
    instructions: |
      You are a Python code assistant. Execute code safely and explain results clearly.

    tools:
      - type: code_interpreter

    tool_resources:
      code_interpreter:
        file_ids:
          - file-abc123
          - file-def456

    thread_config:
      auto_create: true
      retention_days: 30

    run_config:
      max_completion_tokens: 4096
      parallel_tool_calls: true
      timeout_seconds: 120

    streaming:
      enabled: true
      events:
        - thread.message.delta
        - thread.run.step.delta
        - thread.run.completed

    observability:
      trace_run_steps: true
      include_usage: true
```

### 2. RAG Research Assistant

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: research-assistant
  version: 1.0.0
  description: "Research assistant with document retrieval"
  labels:
    domain: documentation
    tier: tier_1_read

spec:
  model:
    name: gpt-4o
    provider: openai

  prompts:
    system: |
      You are a research assistant with access to a knowledge base.
      Always cite your sources using the provided documents.
      If information is not in the documents, say so clearly.

  capabilities:
    - retrieval

  inputs:
    - name: query
      type: string
      required: true

  outputs:
    - name: answer
      type: string
    - name: citations
      type: array
      items:
        type: object
        properties:
          source:
            type: string
          quote:
            type: string

extensions:
  openai_assistants:
    model: gpt-4o
    instructions: |
      Research assistant with document retrieval. Cite sources accurately.

    tools:
      - type: file_search

    tool_resources:
      file_search:
        vector_store_ids:
          - vs_research_docs

    run_config:
      max_prompt_tokens: 50000
      max_completion_tokens: 4096
      truncation_strategy:
        type: auto

    streaming:
      enabled: true
```

### 3. Function-Calling Agent

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: booking-agent
  version: 1.0.0
  description: "Travel booking agent with external API integration"
  labels:
    domain: backend
    tier: tier_2_write_limited

spec:
  model:
    name: gpt-4o-mini
    provider: openai

  prompts:
    system: |
      You are a travel booking assistant. Use the available functions
      to search for flights, hotels, and make reservations.

  capabilities:
    - tool_use

  inputs:
    - name: request
      type: string
      required: true
    - name: user_preferences
      type: object
      required: false

  outputs:
    - name: response
      type: string
    - name: booking_confirmation
      type: object

extensions:
  mcp:
    enabled: true
    tools:
      - name: search_flights
        description: "Search for available flights"
        input_schema:
          type: object
          properties:
            origin:
              type: string
              description: "Departure airport code"
            destination:
              type: string
              description: "Arrival airport code"
            date:
              type: string
              format: date
          required: [origin, destination, date]

      - name: book_flight
        description: "Book a flight"
        input_schema:
          type: object
          properties:
            flight_id:
              type: string
            passenger_info:
              type: object
          required: [flight_id, passenger_info]

  openai_assistants:
    model: gpt-4o-mini
    instructions: |
      Travel booking assistant. Search and book flights, hotels, and cars.

    tools:
      - type: function
        function:
          name: search_flights
          description: "Search for available flights"
          parameters:
            type: object
            properties:
              origin:
                type: string
                description: "Departure airport code (IATA)"
              destination:
                type: string
                description: "Arrival airport code (IATA)"
              date:
                type: string
                format: date
                description: "Travel date (YYYY-MM-DD)"
            required: [origin, destination, date]
          strict: true

      - type: function
        function:
          name: book_flight
          description: "Book a selected flight"
          parameters:
            type: object
            properties:
              flight_id:
                type: string
                description: "Flight identifier from search results"
              passenger_info:
                type: object
                properties:
                  first_name:
                    type: string
                  last_name:
                    type: string
                  email:
                    type: string
                required: [first_name, last_name, email]
            required: [flight_id, passenger_info]
          strict: true

    run_config:
      response_format:
        type: json_schema
        json_schema:
          name: booking_response
          schema:
            type: object
            properties:
              status:
                type: string
                enum: [success, pending, failed]
              confirmation_number:
                type: string
              message:
                type: string
            required: [status, message]
      parallel_tool_calls: false
```

### 4. Multimodal Vision Agent

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: vision-analyst
  version: 1.0.0
  description: "Image analysis agent with vision capabilities"
  labels:
    domain: content
    tier: tier_1_read

spec:
  model:
    name: gpt-4o
    provider: openai
    parameters:
      max_tokens: 4096

  prompts:
    system: |
      You are a vision AI that analyzes images. Provide detailed
      descriptions, identify objects, extract text, and answer
      questions about visual content.

  capabilities:
    - vision
    - file_access

  inputs:
    - name: image
      type: file
      accept: ["image/png", "image/jpeg", "image/gif", "image/webp"]
      required: true
    - name: question
      type: string
      required: false

  outputs:
    - name: analysis
      type: string
    - name: extracted_text
      type: string
    - name: objects_detected
      type: array
      items:
        type: string

extensions:
  openai_assistants:
    model: gpt-4o
    instructions: |
      Vision analyst. Analyze images in detail, extract text, identify objects.

    tools:
      - type: code_interpreter

    thread_config:
      auto_create: true
      initial_messages:
        - role: assistant
          content: "I'm ready to analyze images. Upload an image and ask me anything about it."

    run_config:
      max_completion_tokens: 4096

    streaming:
      enabled: true
      events:
        - thread.message.delta
        - thread.run.completed
```

## Zod Validation Schema

```typescript
import { z } from 'zod';

// OpenAI Tool Schema
const OpenAIFunctionSchema = z.object({
  name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/).max(64),
  description: z.string().max(1024).optional(),
  parameters: z.record(z.unknown()).optional(),
  strict: z.boolean().default(false).optional(),
});

const OpenAIToolSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('code_interpreter'),
  }),
  z.object({
    type: z.literal('file_search'),
  }),
  z.object({
    type: z.literal('function'),
    function: OpenAIFunctionSchema,
  }),
]);

// Tool Resources Schema
const ToolResourcesSchema = z.object({
  code_interpreter: z.object({
    file_ids: z.array(z.string().regex(/^file-[a-zA-Z0-9]+$/)).max(20),
  }).optional(),
  file_search: z.object({
    vector_store_ids: z.array(z.string().regex(/^vs_[a-zA-Z0-9]+$/)).max(1),
  }).optional(),
}).optional();

// Thread Config Schema
const ThreadConfigSchema = z.object({
  auto_create: z.boolean().default(true),
  retention_days: z.number().min(1).max(365).default(30),
  metadata_schema: z.record(z.unknown()).optional(),
  initial_messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.union([
      z.string(),
      z.array(z.object({
        type: z.enum(['text', 'image_url', 'image_file']),
        text: z.string().optional(),
        image_url: z.object({
          url: z.string().url(),
          detail: z.enum(['auto', 'low', 'high']).optional(),
        }).optional(),
        image_file: z.object({
          file_id: z.string(),
          detail: z.enum(['auto', 'low', 'high']).optional(),
        }).optional(),
      })),
    ]),
    metadata: z.record(z.string()).optional(),
  })).optional(),
}).optional();

// Run Config Schema
const RunConfigSchema = z.object({
  max_prompt_tokens: z.number().min(256).optional(),
  max_completion_tokens: z.number().min(256).optional(),
  truncation_strategy: z.object({
    type: z.enum(['auto', 'last_messages']).default('auto'),
    last_messages: z.number().min(1).optional(),
  }).optional(),
  response_format: z.union([
    z.enum(['auto', 'text']),
    z.object({
      type: z.enum(['json_object', 'json_schema']),
      json_schema: z.object({
        name: z.string(),
        description: z.string().optional(),
        schema: z.record(z.unknown()),
        strict: z.boolean().optional(),
      }).optional(),
    }),
  ]).optional(),
  parallel_tool_calls: z.boolean().default(true),
  timeout_seconds: z.number().min(1).max(600).default(300),
}).optional();

// Streaming Config Schema
const StreamingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  events: z.array(z.enum([
    'thread.created',
    'thread.run.created',
    'thread.run.queued',
    'thread.run.in_progress',
    'thread.run.requires_action',
    'thread.run.completed',
    'thread.run.incomplete',
    'thread.run.failed',
    'thread.run.cancelling',
    'thread.run.cancelled',
    'thread.run.expired',
    'thread.run.step.created',
    'thread.run.step.in_progress',
    'thread.run.step.delta',
    'thread.run.step.completed',
    'thread.run.step.expired',
    'thread.message.created',
    'thread.message.in_progress',
    'thread.message.delta',
    'thread.message.completed',
    'thread.message.incomplete',
    'error',
    'done',
  ])).optional(),
  buffer_size: z.number().default(4096),
}).optional();

// API Config Schema
const APIConfigSchema = z.object({
  base_url: z.string().url().default('https://api.openai.com/v1'),
  api_version: z.string().regex(/^v[0-9]+(\.[0-9]+)?$/).optional(),
  organization_id: z.string().regex(/^org-[a-zA-Z0-9]+$/).optional(),
  project_id: z.string().optional(),
  timeout_ms: z.number().default(60000),
  retry: z.object({
    max_retries: z.number().default(3),
    backoff_factor: z.number().default(2),
  }).optional(),
}).optional();

// Observability Config Schema
const ObservabilityConfigSchema = z.object({
  trace_run_steps: z.boolean().default(true),
  step_types: z.array(z.enum(['message_creation', 'tool_calls'])).optional(),
  include_usage: z.boolean().default(true),
  otel_exporter: z.enum(['otlp', 'console', 'none']).default('otlp'),
}).optional();

// Main OpenAI Assistants Extension Schema
export const OpenAIAssistantsExtensionSchema = z.object({
  assistant_id: z.string().regex(/^asst_[a-zA-Z0-9]+$/).optional(),
  model: z.enum([
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4-turbo-preview',
    'gpt-4',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
  ]),
  instructions: z.string().max(256000).optional(),
  tools: z.array(OpenAIToolSchema).optional(),
  tool_resources: ToolResourcesSchema,
  file_ids: z.array(z.string().regex(/^file-[a-zA-Z0-9]+$/)).optional(),
  thread_config: ThreadConfigSchema,
  run_config: RunConfigSchema,
  streaming: StreamingConfigSchema,
  api_config: APIConfigSchema,
  observability: ObservabilityConfigSchema,
});

export type OpenAIAssistantsExtension = z.infer<typeof OpenAIAssistantsExtensionSchema>;
```

## CRUD Operations

### Create Assistant from OSSA Manifest

```typescript
import OpenAI from 'openai';

async function createAssistantFromOSSA(
  manifest: OSSAManifest,
  client: OpenAI
): Promise<OpenAI.Beta.Assistant> {
  const ext = manifest.extensions?.openai_assistants;

  // Map OSSA capabilities to OpenAI tools
  const tools: OpenAI.Beta.AssistantTool[] = [];

  if (manifest.spec.capabilities?.includes('code_execution')) {
    tools.push({ type: 'code_interpreter' });
  }

  if (manifest.spec.capabilities?.includes('retrieval')) {
    tools.push({ type: 'file_search' });
  }

  // Add function tools from MCP extension
  if (manifest.extensions?.mcp?.tools) {
    for (const mcpTool of manifest.extensions.mcp.tools) {
      tools.push({
        type: 'function',
        function: {
          name: mcpTool.name,
          description: mcpTool.description,
          parameters: mcpTool.input_schema || mcpTool.inputSchema,
        },
      });
    }
  }

  // Add explicit OpenAI tools
  if (ext?.tools) {
    tools.push(...ext.tools);
  }

  const assistant = await client.beta.assistants.create({
    name: manifest.metadata.name,
    description: manifest.metadata.description,
    model: ext?.model || manifest.spec.model?.name || 'gpt-4o',
    instructions: ext?.instructions || manifest.spec.prompts?.system,
    tools,
    tool_resources: ext?.tool_resources,
    metadata: manifest.metadata.annotations,
  });

  return assistant;
}
```

### Read/Import Assistant to OSSA Manifest

```typescript
async function importAssistantToOSSA(
  assistantId: string,
  client: OpenAI
): Promise<OSSAManifest> {
  const assistant = await client.beta.assistants.retrieve(assistantId);

  // Map OpenAI tools to OSSA capabilities
  const capabilities: string[] = [];
  const mcpTools: MCPTool[] = [];

  for (const tool of assistant.tools || []) {
    switch (tool.type) {
      case 'code_interpreter':
        capabilities.push('code_execution');
        break;
      case 'file_search':
        capabilities.push('retrieval');
        break;
      case 'function':
        mcpTools.push({
          name: tool.function.name,
          description: tool.function.description,
          input_schema: tool.function.parameters,
        });
        capabilities.push('tool_use');
        break;
    }
  }

  const manifest: OSSAManifest = {
    apiVersion: 'ossa/v0.3.4',
    kind: 'Agent',
    metadata: {
      name: assistant.name || assistantId,
      version: '1.0.0',
      description: assistant.description || undefined,
      annotations: assistant.metadata as Record<string, string>,
    },
    spec: {
      model: {
        name: assistant.model,
        provider: 'openai',
      },
      prompts: {
        system: assistant.instructions || undefined,
      },
      capabilities: [...new Set(capabilities)],
    },
    extensions: {
      openai_assistants: {
        assistant_id: assistant.id,
        model: assistant.model as OpenAIModel,
        instructions: assistant.instructions || undefined,
        tools: assistant.tools,
        tool_resources: assistant.tool_resources,
      },
      ...(mcpTools.length > 0 && {
        mcp: {
          enabled: true,
          tools: mcpTools,
        },
      }),
    },
  };

  return manifest;
}
```

### Update Assistant from OSSA Manifest

```typescript
async function updateAssistantFromOSSA(
  manifest: OSSAManifest,
  client: OpenAI
): Promise<OpenAI.Beta.Assistant> {
  const ext = manifest.extensions?.openai_assistants;

  if (!ext?.assistant_id) {
    throw new Error('assistant_id required for update');
  }

  // Build tools array (same logic as create)
  const tools = buildToolsFromManifest(manifest);

  const assistant = await client.beta.assistants.update(ext.assistant_id, {
    name: manifest.metadata.name,
    description: manifest.metadata.description,
    model: ext.model || manifest.spec.model?.name,
    instructions: ext.instructions || manifest.spec.prompts?.system,
    tools,
    tool_resources: ext.tool_resources,
    metadata: manifest.metadata.annotations,
  });

  return assistant;
}
```

### Delete Assistant

```typescript
async function deleteAssistant(
  assistantId: string,
  client: OpenAI
): Promise<void> {
  await client.beta.assistants.del(assistantId);
}
```

## Thread and Run Management

### Create Thread with OSSA Context

```typescript
async function createThread(
  manifest: OSSAManifest,
  initialContext?: Record<string, unknown>,
  client: OpenAI
): Promise<OpenAI.Beta.Thread> {
  const ext = manifest.extensions?.openai_assistants;
  const threadConfig = ext?.thread_config;

  const messages: OpenAI.Beta.ThreadCreateParams.Message[] = [];

  // Add initial messages from config
  if (threadConfig?.initial_messages) {
    messages.push(...threadConfig.initial_messages);
  }

  const thread = await client.beta.threads.create({
    messages,
    metadata: {
      ossa_agent: manifest.metadata.name,
      ossa_version: manifest.metadata.version,
      ...initialContext,
    },
  });

  return thread;
}
```

### Create Run with OSSA Configuration

```typescript
async function createRun(
  threadId: string,
  manifest: OSSAManifest,
  additionalInstructions?: string,
  client: OpenAI
): Promise<OpenAI.Beta.Run> {
  const ext = manifest.extensions?.openai_assistants;

  if (!ext?.assistant_id) {
    throw new Error('assistant_id required for run creation');
  }

  const runConfig = ext.run_config || {};

  const run = await client.beta.threads.runs.create(threadId, {
    assistant_id: ext.assistant_id,
    additional_instructions: additionalInstructions,
    max_prompt_tokens: runConfig.max_prompt_tokens,
    max_completion_tokens: runConfig.max_completion_tokens,
    truncation_strategy: runConfig.truncation_strategy,
    response_format: runConfig.response_format,
    parallel_tool_calls: runConfig.parallel_tool_calls,
  });

  return run;
}
```

### Stream Run with OSSA Events

```typescript
async function* streamRun(
  threadId: string,
  manifest: OSSAManifest,
  client: OpenAI
): AsyncGenerator<OSSAStreamEvent> {
  const ext = manifest.extensions?.openai_assistants;

  if (!ext?.assistant_id) {
    throw new Error('assistant_id required for streaming');
  }

  const stream = client.beta.threads.runs.stream(threadId, {
    assistant_id: ext.assistant_id,
  });

  for await (const event of stream) {
    // Map OpenAI events to OSSA events
    yield mapOpenAIEventToOSSA(event);
  }
}

function mapOpenAIEventToOSSA(event: OpenAI.Beta.AssistantStreamEvent): OSSAStreamEvent {
  return {
    type: event.event,
    timestamp: new Date().toISOString(),
    data: event.data,
  };
}
```

## OpenAPI Specification

```yaml
openapi: 3.1.0
info:
  title: OSSA OpenAI Assistants Extension API
  version: 0.3.4
  description: API for managing OpenAI Assistants through OSSA manifests

paths:
  /agents/{agentName}/assistant:
    post:
      summary: Create OpenAI Assistant from OSSA agent
      operationId: createAssistant
      parameters:
        - name: agentName
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateAssistantRequest'
      responses:
        '201':
          description: Assistant created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AssistantResponse'

    get:
      summary: Get OpenAI Assistant for OSSA agent
      operationId: getAssistant
      parameters:
        - name: agentName
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Assistant details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AssistantResponse'

    put:
      summary: Update OpenAI Assistant from OSSA agent
      operationId: updateAssistant
      parameters:
        - name: agentName
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateAssistantRequest'
      responses:
        '200':
          description: Assistant updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AssistantResponse'

    delete:
      summary: Delete OpenAI Assistant
      operationId: deleteAssistant
      parameters:
        - name: agentName
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Assistant deleted

  /agents/{agentName}/threads:
    post:
      summary: Create conversation thread
      operationId: createThread
      parameters:
        - name: agentName
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateThreadRequest'
      responses:
        '201':
          description: Thread created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ThreadResponse'

  /agents/{agentName}/threads/{threadId}/runs:
    post:
      summary: Create and execute run
      operationId: createRun
      parameters:
        - name: agentName
          in: path
          required: true
          schema:
            type: string
        - name: threadId
          in: path
          required: true
          schema:
            type: string
        - name: stream
          in: query
          schema:
            type: boolean
            default: false
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateRunRequest'
      responses:
        '200':
          description: Run result or stream
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RunResponse'
            text/event-stream:
              schema:
                type: string
                description: SSE event stream

  /import/assistant/{assistantId}:
    post:
      summary: Import OpenAI Assistant as OSSA manifest
      operationId: importAssistant
      parameters:
        - name: assistantId
          in: path
          required: true
          schema:
            type: string
            pattern: '^asst_[a-zA-Z0-9]+$'
      responses:
        '200':
          description: OSSA manifest
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OSSAManifest'
            application/yaml:
              schema:
                type: string

components:
  schemas:
    CreateAssistantRequest:
      type: object
      properties:
        model:
          type: string
        instructions:
          type: string
        additional_tools:
          type: array
          items:
            $ref: '#/components/schemas/OpenAITool'

    AssistantResponse:
      type: object
      properties:
        assistant_id:
          type: string
        name:
          type: string
        model:
          type: string
        created_at:
          type: integer
        tools:
          type: array
          items:
            $ref: '#/components/schemas/OpenAITool'

    OpenAITool:
      type: object
      required: [type]
      properties:
        type:
          type: string
          enum: [code_interpreter, file_search, function]
        function:
          $ref: '#/components/schemas/FunctionDefinition'

    FunctionDefinition:
      type: object
      required: [name]
      properties:
        name:
          type: string
        description:
          type: string
        parameters:
          type: object
        strict:
          type: boolean

    CreateThreadRequest:
      type: object
      properties:
        messages:
          type: array
          items:
            $ref: '#/components/schemas/Message'
        metadata:
          type: object

    ThreadResponse:
      type: object
      properties:
        id:
          type: string
        created_at:
          type: integer
        metadata:
          type: object

    CreateRunRequest:
      type: object
      properties:
        additional_instructions:
          type: string
        max_completion_tokens:
          type: integer

    RunResponse:
      type: object
      properties:
        id:
          type: string
        status:
          type: string
          enum: [queued, in_progress, requires_action, cancelling, cancelled, failed, completed, incomplete, expired]
        usage:
          type: object
          properties:
            prompt_tokens:
              type: integer
            completion_tokens:
              type: integer
            total_tokens:
              type: integer

    Message:
      type: object
      required: [role, content]
      properties:
        role:
          type: string
          enum: [user, assistant]
        content:
          oneOf:
            - type: string
            - type: array
              items:
                $ref: '#/components/schemas/ContentPart'

    ContentPart:
      type: object
      required: [type]
      properties:
        type:
          type: string
          enum: [text, image_url, image_file]
        text:
          type: string
        image_url:
          type: object
          properties:
            url:
              type: string
            detail:
              type: string
        image_file:
          type: object
          properties:
            file_id:
              type: string
            detail:
              type: string

    OSSAManifest:
      type: object
      required: [apiVersion, kind, metadata]
      properties:
        apiVersion:
          type: string
        kind:
          type: string
        metadata:
          type: object
        spec:
          type: object
        extensions:
          type: object
```

## Related

- [OpenAI Assistants API Documentation](https://platform.openai.com/docs/assistants/overview)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference/assistants)
- [OSSA v0.3.4 Specification](../ossa-0.3.4.schema.json)
- [MCP Extension](../extensions/drupal.md)
- [OSSA Messaging Extension](../../extensions/a2a-messaging.md)
