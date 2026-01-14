# Microsoft Semantic Kernel Extension for OSSA v0.3.4

**Version:** 0.3.4
**Status:** Stable
**Last Updated:** 2025-12-31

## Overview

This document describes the Microsoft Semantic Kernel extension for OSSA manifests. Semantic Kernel is Microsoft's open-source AI orchestration SDK that enables developers to build AI agents with plugins, planners, and memory. This extension provides bidirectional mapping between Semantic Kernel concepts and OSSA primitives.

## Core Concept Mapping

### Semantic Kernel to OSSA Mapping Table

| Semantic Kernel Concept | OSSA Equivalent | Notes |
|------------------------|-----------------|-------|
| `Kernel` | `runtime` | Runtime configuration and service container |
| `Plugin` | `spec.capabilities` | Capability groupings with functions |
| `KernelFunction` (Native) | `kind: Task` | Deterministic code-based functions |
| `KernelFunction` (Semantic) | `kind: Agent` (single-turn) | Prompt-based functions with LLM |
| `SequentialPlanner` | `kind: Workflow` (sequential) | Linear task composition |
| `StepwisePlanner` | `kind: Workflow` (dag) + `kind: Agent` | Agentic reasoning with tool use |
| `ActionPlanner` | `kind: Agent` with single tool | Single-action selection |
| `HandlebarsPlannerOptions` | `spec.prompts.planner` | Planner prompt templates |
| `ISemanticTextMemory` | `spec.state.memory` | Vector/semantic memory storage |
| `IChatCompletionService` | `spec.llm` | LLM provider configuration |
| `ITextEmbeddingGenerationService` | `runtime.bindings.embeddings` | Embedding service binding |
| `FunctionFilter` | `spec.safety.filters` | Pre/post function execution filters |
| `PromptFilter` | `spec.safety.prompt_filters` | Prompt modification filters |
| `AutoFunctionInvocationFilter` | `spec.safety.auto_invoke_filters` | Auto-invocation guards |
| `KernelAgent` | `kind: Agent` | Full agentic loop with LLM |
| `AgentGroupChat` | `kind: Workflow` + `messaging` | Multi-agent orchestration |

### OSSA to Semantic Kernel Mapping Table

| OSSA Concept | Semantic Kernel Equivalent | Notes |
|-------------|---------------------------|-------|
| `apiVersion: ossa/v0.3.4` | Kernel configuration | Version compatibility |
| `kind: Agent` | `ChatCompletionAgent` or `OpenAIAssistantAgent` | Agentic LLM loops |
| `kind: Task` | `KernelFunction` (native) | Deterministic execution |
| `kind: Workflow` | `Planner` output or `AgentGroupChat` | Composition patterns |
| `spec.llm.provider` | `IChatCompletionService` implementation | Azure OpenAI, OpenAI, etc. |
| `spec.tools` | `KernelPlugin` with `KernelFunction` methods | Tool definitions |
| `spec.capabilities` | Plugin groupings | Abstract capability mapping |
| `spec.state` | `ISemanticTextMemory` | State persistence |
| `spec.constraints` | Planner settings + filters | Execution limits |
| `spec.safety` | `IFunctionFilter`, `IPromptFilter` | Safety guardrails |
| `spec.observability` | OpenTelemetry integration | Tracing and metrics |
| `extensions.semanticKernel` | Native SK configuration | Direct passthrough |

## Schema Definition

```yaml
extensions:
  semanticKernel:
    type: object
    description: "Microsoft Semantic Kernel integration for OSSA agents"
    properties:
      enabled:
        type: boolean
        default: true
        description: "Enable Semantic Kernel runtime"

      plugins:
        type: array
        description: "Semantic Kernel plugins to load"
        items:
          type: object
          required: [name]
          properties:
            name:
              type: string
              description: "Plugin name"
            type:
              enum: [native, semantic, openapi, grpc]
              description: "Plugin type"
            source:
              type: string
              description: "Plugin source (assembly, directory, URL)"
            functions:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                  description:
                    type: string
                  parameters:
                    type: object
                  returnType:
                    type: string

      planner_type:
        enum: [sequential, stepwise, action, handlebars, function_calling, none]
        description: "Planner strategy for goal decomposition"
        default: "function_calling"

      planner_options:
        type: object
        description: "Planner-specific configuration"
        properties:
          max_iterations:
            type: integer
            default: 10
          max_tokens:
            type: integer
            default: 4096
          allow_loops:
            type: boolean
            default: false
          excluded_plugins:
            type: array
            items:
              type: string
          excluded_functions:
            type: array
            items:
              type: string
          semantic_memory_config:
            type: object
            properties:
              relevance_threshold:
                type: number
                minimum: 0
                maximum: 1
                default: 0.7
              max_results:
                type: integer
                default: 5

      memory_store:
        type: object
        description: "Semantic memory configuration"
        properties:
          type:
            enum: [volatile, azure_cognitive_search, qdrant, chroma, pinecone, redis, postgres, sqlite]
            description: "Memory store backend"
            default: "volatile"
          collection:
            type: string
            description: "Memory collection/index name"
          connection:
            type: object
            properties:
              endpoint:
                type: string
                format: uri
              api_key_ref:
                type: string
                description: "Reference to secret containing API key"
              options:
                type: object
                additionalProperties: true

      connectors:
        type: object
        description: "Service connectors for AI services"
        properties:
          chat_completion:
            type: object
            properties:
              service_id:
                type: string
                default: "default"
              provider:
                enum: [azure_openai, openai, huggingface, ollama, anthropic, google, mistral]
              model_id:
                type: string
              endpoint:
                type: string
                format: uri
              api_key_ref:
                type: string
              deployment_name:
                type: string
                description: "Azure OpenAI deployment name"
              options:
                type: object
                properties:
                  temperature:
                    type: number
                  max_tokens:
                    type: integer
                  top_p:
                    type: number
          text_embedding:
            type: object
            properties:
              service_id:
                type: string
                default: "default"
              provider:
                enum: [azure_openai, openai, huggingface, ollama]
              model_id:
                type: string
              endpoint:
                type: string
                format: uri
              api_key_ref:
                type: string
              dimensions:
                type: integer
                description: "Embedding vector dimensions"
          image_generation:
            type: object
            properties:
              service_id:
                type: string
              provider:
                enum: [azure_openai, openai, dall_e]
              model_id:
                type: string
          audio_to_text:
            type: object
            properties:
              service_id:
                type: string
              provider:
                enum: [azure_openai, openai, whisper]
              model_id:
                type: string
          text_to_audio:
            type: object
            properties:
              service_id:
                type: string
              provider:
                enum: [azure_openai, openai, elevenlabs]
              model_id:
                type: string

      filters:
        type: object
        description: "Semantic Kernel filter configuration"
        properties:
          function_filters:
            type: array
            description: "Pre/post function execution filters"
            items:
              type: object
              required: [name]
              properties:
                name:
                  type: string
                type:
                  enum: [pre, post, both]
                  default: "both"
                handler:
                  type: string
                  description: "Filter handler reference"
                config:
                  type: object
                  additionalProperties: true
          prompt_filters:
            type: array
            description: "Prompt rendering filters"
            items:
              type: object
              required: [name]
              properties:
                name:
                  type: string
                type:
                  enum: [pre_render, post_render, both]
                  default: "both"
                handler:
                  type: string
          auto_invoke_filters:
            type: array
            description: "Auto function invocation filters"
            items:
              type: object
              required: [name]
              properties:
                name:
                  type: string
                handler:
                  type: string
                terminate_on_match:
                  type: boolean
                  default: false

      agent_config:
        type: object
        description: "Semantic Kernel Agent configuration (for ChatCompletionAgent)"
        properties:
          type:
            enum: [chat_completion, openai_assistant, azure_assistant]
            default: "chat_completion"
          instructions:
            type: string
            description: "Agent system instructions"
          name:
            type: string
          description:
            type: string
          execution_settings:
            type: object
            properties:
              max_iterations:
                type: integer
                default: 10
              enable_code_interpreter:
                type: boolean
                default: false
              enable_file_search:
                type: boolean
                default: false
              tool_choice:
                enum: [auto, required, none]
                default: "auto"

      telemetry:
        type: object
        description: "OpenTelemetry configuration for SK"
        properties:
          enabled:
            type: boolean
            default: true
          activity_source_name:
            type: string
            default: "Microsoft.SemanticKernel"
          meter_name:
            type: string
            default: "Microsoft.SemanticKernel"
          log_function_invocations:
            type: boolean
            default: true
          log_prompt_template_content:
            type: boolean
            default: false
          log_function_results:
            type: boolean
            default: false
```

## Plugin to OSSA Capability Mapping

### Native Function Plugin to OSSA Task

Semantic Kernel native function:

```csharp
public class MathPlugin
{
    [KernelFunction, Description("Adds two numbers")]
    public double Add(double a, double b) => a + b;

    [KernelFunction, Description("Multiplies two numbers")]
    public double Multiply(double a, double b) => a * b;
}
```

Equivalent OSSA Task manifest:

```yaml
apiVersion: ossa/v0.3.4
kind: Task
metadata:
  name: math-add
  version: 1.0.0
  description: "Adds two numbers"
  labels:
    plugin: math
    function: add

spec:
  execution:
    type: deterministic
    runtime: dotnet
    entrypoint: "MathPlugin::Add"
    timeout_seconds: 5

  capabilities:
    - compute_arithmetic

  input:
    type: object
    required: [a, b]
    properties:
      a:
        type: number
        description: "First number"
      b:
        type: number
        description: "Second number"

  output:
    type: number
    description: "Sum of a and b"

extensions:
  semanticKernel:
    enabled: true
    plugins:
      - name: Math
        type: native
        functions:
          - name: Add
            description: "Adds two numbers"
            parameters:
              a: { type: number }
              b: { type: number }
            returnType: number
```

### Semantic Function to OSSA Agent

Semantic Kernel semantic function:

```yaml
# SummarizePlugin/Summarize/skprompt.txt
Summarize the following text in {{$style}} style:

{{$input}}

Summary:
```

Equivalent OSSA Agent manifest:

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: summarizer
  version: 1.0.0
  description: "Summarizes text in specified style"
  labels:
    plugin: summarize
    function: summarize

spec:
  role: |
    You are a text summarization agent. Summarize the provided text
    according to the specified style.

  prompts:
    system:
      template: |
        Summarize the following text in {{style}} style:

        {{input}}

        Summary:
      version: "1.0.0"

  llm:
    provider: azure_openai
    model: gpt-4
    temperature: 0.3

  autonomy:
    level: tool_assist
    max_iterations: 1

extensions:
  semanticKernel:
    enabled: true
    plugins:
      - name: Summarize
        type: semantic
        source: "./prompts/Summarize"
        functions:
          - name: Summarize
            description: "Summarizes text in specified style"
            parameters:
              input: { type: string }
              style: { type: string, default: "concise" }
```

## Planner to OSSA Workflow Mapping

### Sequential Planner to OSSA Workflow

Semantic Kernel sequential plan:

```csharp
var planner = new SequentialPlanner(kernel);
var plan = await planner.CreatePlanAsync("Write a poem about AI and email it");
```

Generated plan steps:
1. `WriterPlugin.WritePoem` - Generate poem
2. `EmailPlugin.SendEmail` - Send email

Equivalent OSSA Workflow:

```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: poem-email-workflow
  version: 1.0.0
  description: "Write a poem and email it"

spec:
  type: sequential

  input:
    type: object
    properties:
      topic:
        type: string
        description: "Poem topic"
      recipient:
        type: string
        format: email

  steps:
    - id: write-poem
      name: "Write Poem"
      ref: agents/writer
      input:
        topic: "${{ input.topic }}"
        style: "poetic"

    - id: send-email
      name: "Send Email"
      ref: tasks/email-sender
      input:
        to: "${{ input.recipient }}"
        subject: "A Poem About ${{ input.topic }}"
        body: "${{ steps.write-poem.output.content }}"
      depends_on:
        - write-poem

  output:
    poem: "${{ steps.write-poem.output.content }}"
    email_sent: "${{ steps.send-email.output.success }}"

extensions:
  semanticKernel:
    enabled: true
    planner_type: sequential
    planner_options:
      max_iterations: 5
      excluded_functions:
        - "FilePlugin.*"
```

### Stepwise Planner to OSSA Agent with Workflow

Semantic Kernel stepwise planner (ReAct-style):

```csharp
var planner = new StepwisePlanner(kernel, new StepwisePlannerConfig
{
    MaxIterations = 10,
    MinIterationTimeMs = 0
});
var result = await planner.ExecuteAsync("Research and summarize recent AI news");
```

Equivalent OSSA Agent with tools:

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: research-agent
  version: 1.0.0
  description: "Research and summarize using ReAct-style reasoning"

spec:
  role: |
    You are a research agent that gathers information and provides summaries.
    Think step by step, use available tools to gather information, and
    synthesize your findings into a coherent summary.

  llm:
    provider: azure_openai
    model: gpt-4
    temperature: 0.7

  tools:
    - name: web_search
      description: "Search the web for information"
      input_schema:
        type: object
        properties:
          query: { type: string }

    - name: summarize
      description: "Summarize text content"
      input_schema:
        type: object
        properties:
          text: { type: string }
          max_length: { type: integer, default: 200 }

  autonomy:
    level: full_auto
    max_iterations: 10
    requires_approval: false

  constraints:
    max_iterations: 10
    timeout_seconds: 300

extensions:
  semanticKernel:
    enabled: true
    planner_type: stepwise
    planner_options:
      max_iterations: 10
      allow_loops: true
      semantic_memory_config:
        relevance_threshold: 0.75
        max_results: 3
```

## Memory Store Configuration

### Semantic Memory to OSSA State

Semantic Kernel memory usage:

```csharp
var memory = new MemoryBuilder()
    .WithAzureCognitiveSearchMemoryStore(endpoint, apiKey)
    .WithAzureOpenAITextEmbeddingGeneration(deploymentName, endpoint, apiKey)
    .Build();

await memory.SaveInformationAsync("documents", "AI is transforming software", "doc1");
var results = await memory.SearchAsync("documents", "machine learning", limit: 5);
```

Equivalent OSSA configuration:

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: knowledge-agent
  version: 1.0.0

spec:
  role: "Knowledge assistant with semantic memory"

  llm:
    provider: azure_openai
    model: gpt-4

  state:
    type: semantic
    memory:
      backend: azure_cognitive_search
      collection: documents
      embedding_model: text-embedding-ada-002
      retrieval:
        relevance_threshold: 0.75
        max_results: 5

extensions:
  semanticKernel:
    enabled: true
    memory_store:
      type: azure_cognitive_search
      collection: documents
      connection:
        endpoint: "${AZURE_SEARCH_ENDPOINT}"
        api_key_ref: azure-search-key
        options:
          index_name: "ossa-knowledge"
          semantic_config: "default"
    connectors:
      text_embedding:
        provider: azure_openai
        model_id: text-embedding-ada-002
        endpoint: "${AZURE_OPENAI_ENDPOINT}"
        api_key_ref: azure-openai-key
        dimensions: 1536
```

### Vector Store Options

```yaml
extensions:
  semanticKernel:
    memory_store:
      # Qdrant
      type: qdrant
      collection: "agent-memory"
      connection:
        endpoint: "http://localhost:6333"
        options:
          vector_size: 1536
          distance: Cosine

      # Chroma
      type: chroma
      collection: "agent-memory"
      connection:
        endpoint: "http://localhost:8000"

      # Pinecone
      type: pinecone
      collection: "agent-memory"
      connection:
        api_key_ref: pinecone-key
        options:
          environment: "us-east1-gcp"
          index_name: "ossa-index"

      # Redis
      type: redis
      collection: "agent-memory"
      connection:
        endpoint: "redis://localhost:6379"
        options:
          prefix: "ossa:memory:"

      # PostgreSQL with pgvector
      type: postgres
      collection: "agent_memory"
      connection:
        endpoint: "postgresql://localhost:5432/ossa"
        options:
          schema: "semantic_kernel"
          table: "embeddings"
```

## Filter Configuration

### Function Filters for Safety

Semantic Kernel filters:

```csharp
public class SafetyFilter : IFunctionFilter
{
    public async Task OnFunctionInvokedAsync(FunctionInvokedContext context)
    {
        // Log invocation
        // Check result safety
    }

    public async Task OnFunctionInvokingAsync(FunctionInvokingContext context)
    {
        // Validate inputs
        // Check permissions
    }
}
```

OSSA equivalent:

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: safe-agent
  version: 1.0.0

spec:
  role: "Agent with safety filters"

  llm:
    provider: azure_openai
    model: gpt-4

  safety:
    guardrails:
      enabled: true
      policies:
        - name: input_validation
          type: pre_execution
          config:
            max_input_length: 10000
            prohibited_patterns:
              - "password"
              - "secret"
        - name: output_safety
          type: post_execution
          config:
            content_filter: true
            pii_detection: true

extensions:
  semanticKernel:
    enabled: true
    filters:
      function_filters:
        - name: safety-filter
          type: both
          handler: "SafetyFilters.SafetyFilter"
          config:
            log_invocations: true
            validate_inputs: true
            check_permissions: true

        - name: rate-limiter
          type: pre
          handler: "SafetyFilters.RateLimiter"
          config:
            max_calls_per_minute: 60

      prompt_filters:
        - name: content-filter
          type: post_render
          handler: "SafetyFilters.ContentFilter"

      auto_invoke_filters:
        - name: dangerous-function-guard
          handler: "SafetyFilters.DangerousFunctionGuard"
          terminate_on_match: true
```

## Connector Configuration

### Multi-Service Connectors

```yaml
extensions:
  semanticKernel:
    enabled: true
    connectors:
      chat_completion:
        service_id: "primary"
        provider: azure_openai
        model_id: gpt-4
        endpoint: "${AZURE_OPENAI_ENDPOINT}"
        deployment_name: "gpt-4-deployment"
        api_key_ref: azure-openai-key
        options:
          temperature: 0.7
          max_tokens: 4096
          top_p: 0.95

      text_embedding:
        service_id: "embeddings"
        provider: azure_openai
        model_id: text-embedding-ada-002
        endpoint: "${AZURE_OPENAI_ENDPOINT}"
        api_key_ref: azure-openai-key
        dimensions: 1536

      image_generation:
        service_id: "images"
        provider: azure_openai
        model_id: dall-e-3
        options:
          size: "1024x1024"
          quality: "hd"

      audio_to_text:
        service_id: "transcription"
        provider: azure_openai
        model_id: whisper

      text_to_audio:
        service_id: "speech"
        provider: azure_openai
        model_id: tts-1
```

## Agent Configuration (ChatCompletionAgent)

### Single Agent

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: code-assistant
  version: 1.0.0

spec:
  role: "Expert coding assistant"

  llm:
    provider: azure_openai
    model: gpt-4

  tools:
    - name: execute_code
      description: "Execute Python code"
    - name: search_docs
      description: "Search documentation"

extensions:
  semanticKernel:
    enabled: true
    agent_config:
      type: chat_completion
      name: "CodeAssistant"
      instructions: |
        You are an expert coding assistant. Help users write,
        debug, and optimize code. Use tools when needed.
      execution_settings:
        max_iterations: 10
        tool_choice: auto
```

### Agent Group Chat (Multi-Agent)

```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: review-workflow
  version: 1.0.0
  description: "Multi-agent code review"

spec:
  type: dag

  agents:
    - ref: agents/code-analyzer
      role: analyzer
    - ref: agents/security-reviewer
      role: security
    - ref: agents/summarizer
      role: reporter

  orchestration:
    type: round_robin
    max_turns: 10
    termination:
      type: consensus
      required_agreement: 2

extensions:
  semanticKernel:
    enabled: true
    agent_config:
      type: chat_completion
      execution_settings:
        max_iterations: 10
    planner_type: none  # Agents coordinate via chat
```

## Complete Example

### Full-Featured OSSA Agent with Semantic Kernel

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: enterprise-assistant
  version: 1.0.0
  description: "Enterprise AI assistant with full Semantic Kernel integration"
  labels:
    team: platform
    environment: production
    tier: tier_2_write_limited

spec:
  role: |
    You are an enterprise AI assistant with access to company knowledge,
    document generation, and workflow automation capabilities.

  type: worker

  llm:
    provider: azure_openai
    model: gpt-4
    temperature: 0.7
    max_tokens: 4096

  tools:
    - name: search_knowledge
      description: "Search company knowledge base"
      input_schema:
        type: object
        properties:
          query: { type: string }
          collection: { type: string, default: "general" }

    - name: create_document
      description: "Generate business documents"
      input_schema:
        type: object
        properties:
          type: { enum: [report, memo, proposal] }
          content: { type: string }

    - name: send_notification
      description: "Send team notification"
      input_schema:
        type: object
        properties:
          channel: { type: string }
          message: { type: string }

  autonomy:
    level: supervised
    max_iterations: 15
    requires_approval: true
    approval_timeout_seconds: 300

  constraints:
    max_iterations: 15
    timeout_seconds: 600
    max_tokens_per_turn: 4096

  state:
    type: semantic
    memory:
      backend: azure_cognitive_search
      collection: enterprise_knowledge
      embedding_model: text-embedding-ada-002

  safety:
    guardrails:
      enabled: true
      max_tool_calls: 20
      policies:
        - name: pii_filter
          type: post_execution
        - name: content_moderation
          type: pre_execution

  access:
    tier: tier_2_write_limited
    permissions:
      - read_code
      - read_docs
      - write_docs
      - create_issues

  observability:
    tracing:
      enabled: true
      sampler: always
    metrics:
      enabled: true
      interval: 60
    logging:
      level: info
      format: json

extensions:
  semanticKernel:
    enabled: true

    plugins:
      - name: Knowledge
        type: native
        source: "EnterprisePlugins.KnowledgePlugin"
        functions:
          - name: Search
            description: "Search knowledge base"
          - name: Store
            description: "Store new knowledge"

      - name: Documents
        type: native
        source: "EnterprisePlugins.DocumentPlugin"
        functions:
          - name: Generate
            description: "Generate document"
          - name: Template
            description: "Apply template"

      - name: Summarize
        type: semantic
        source: "./prompts/Summarize"

    planner_type: function_calling
    planner_options:
      max_iterations: 15
      max_tokens: 4096
      excluded_plugins:
        - "AdminPlugin"
      semantic_memory_config:
        relevance_threshold: 0.8
        max_results: 10

    memory_store:
      type: azure_cognitive_search
      collection: enterprise_knowledge
      connection:
        endpoint: "${AZURE_SEARCH_ENDPOINT}"
        api_key_ref: azure-search-key
        options:
          semantic_config: "enterprise-semantic"

    connectors:
      chat_completion:
        service_id: primary
        provider: azure_openai
        model_id: gpt-4
        endpoint: "${AZURE_OPENAI_ENDPOINT}"
        deployment_name: "gpt-4-turbo"
        api_key_ref: azure-openai-key
        options:
          temperature: 0.7
          max_tokens: 4096

      text_embedding:
        service_id: embeddings
        provider: azure_openai
        model_id: text-embedding-ada-002
        endpoint: "${AZURE_OPENAI_ENDPOINT}"
        api_key_ref: azure-openai-key
        dimensions: 1536

    filters:
      function_filters:
        - name: audit-logger
          type: both
          handler: "EnterpriseFilters.AuditLogger"
          config:
            log_inputs: true
            log_outputs: false

        - name: permission-checker
          type: pre
          handler: "EnterpriseFilters.PermissionChecker"

      prompt_filters:
        - name: pii-redactor
          type: pre_render
          handler: "EnterpriseFilters.PIIRedactor"

      auto_invoke_filters:
        - name: cost-limiter
          handler: "EnterpriseFilters.CostLimiter"
          terminate_on_match: true

    agent_config:
      type: chat_completion
      name: "EnterpriseAssistant"
      instructions: |
        You are an enterprise AI assistant. Follow company policies,
        protect sensitive information, and help users accomplish tasks.
      execution_settings:
        max_iterations: 15
        tool_choice: auto

    telemetry:
      enabled: true
      activity_source_name: "Enterprise.SemanticKernel"
      meter_name: "Enterprise.SemanticKernel"
      log_function_invocations: true
      log_prompt_template_content: false
      log_function_results: false

runtime:
  bindings:
    search_knowledge:
      capability: knowledge_search
      binding: azure_cognitive_search
      config:
        index: enterprise_knowledge
    create_document:
      capability: document_generation
      binding: document_service
    send_notification:
      capability: notifications
      binding: teams_webhook
```

## OpenAPI Plugin Integration

### Import OpenAPI Spec as Plugin

```yaml
extensions:
  semanticKernel:
    plugins:
      - name: GitHubAPI
        type: openapi
        source: "https://api.github.com/openapi.json"
        functions:
          - name: ListRepos
            operationId: "repos/list-for-authenticated-user"
          - name: CreateIssue
            operationId: "issues/create"

      - name: InternalAPI
        type: openapi
        source: "./specs/internal-api.yaml"
        authentication:
          type: bearer
          token_ref: internal-api-token
```

## Zod Validation Schema

For TypeScript/JavaScript runtimes, use this Zod schema for validation:

```typescript
import { z } from 'zod';

const SemanticKernelPluginSchema = z.object({
  name: z.string(),
  type: z.enum(['native', 'semantic', 'openapi', 'grpc']),
  source: z.string().optional(),
  functions: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    parameters: z.record(z.any()).optional(),
    returnType: z.string().optional(),
  })).optional(),
});

const SemanticKernelMemoryStoreSchema = z.object({
  type: z.enum([
    'volatile',
    'azure_cognitive_search',
    'qdrant',
    'chroma',
    'pinecone',
    'redis',
    'postgres',
    'sqlite'
  ]),
  collection: z.string().optional(),
  connection: z.object({
    endpoint: z.string().url().optional(),
    api_key_ref: z.string().optional(),
    options: z.record(z.any()).optional(),
  }).optional(),
});

const SemanticKernelConnectorSchema = z.object({
  service_id: z.string().default('default'),
  provider: z.enum([
    'azure_openai',
    'openai',
    'huggingface',
    'ollama',
    'anthropic',
    'google',
    'mistral'
  ]),
  model_id: z.string().optional(),
  endpoint: z.string().url().optional(),
  api_key_ref: z.string().optional(),
  deployment_name: z.string().optional(),
  dimensions: z.number().int().positive().optional(),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().int().positive().optional(),
    top_p: z.number().min(0).max(1).optional(),
  }).optional(),
});

const SemanticKernelFilterSchema = z.object({
  name: z.string(),
  type: z.enum(['pre', 'post', 'both', 'pre_render', 'post_render']).optional(),
  handler: z.string(),
  config: z.record(z.any()).optional(),
  terminate_on_match: z.boolean().optional(),
});

const SemanticKernelExtensionSchema = z.object({
  enabled: z.boolean().default(true),
  plugins: z.array(SemanticKernelPluginSchema).optional(),
  planner_type: z.enum([
    'sequential',
    'stepwise',
    'action',
    'handlebars',
    'function_calling',
    'none'
  ]).default('function_calling'),
  planner_options: z.object({
    max_iterations: z.number().int().positive().default(10),
    max_tokens: z.number().int().positive().default(4096),
    allow_loops: z.boolean().default(false),
    excluded_plugins: z.array(z.string()).optional(),
    excluded_functions: z.array(z.string()).optional(),
    semantic_memory_config: z.object({
      relevance_threshold: z.number().min(0).max(1).default(0.7),
      max_results: z.number().int().positive().default(5),
    }).optional(),
  }).optional(),
  memory_store: SemanticKernelMemoryStoreSchema.optional(),
  connectors: z.object({
    chat_completion: SemanticKernelConnectorSchema.optional(),
    text_embedding: SemanticKernelConnectorSchema.optional(),
    image_generation: SemanticKernelConnectorSchema.optional(),
    audio_to_text: SemanticKernelConnectorSchema.optional(),
    text_to_audio: SemanticKernelConnectorSchema.optional(),
  }).optional(),
  filters: z.object({
    function_filters: z.array(SemanticKernelFilterSchema).optional(),
    prompt_filters: z.array(SemanticKernelFilterSchema).optional(),
    auto_invoke_filters: z.array(SemanticKernelFilterSchema).optional(),
  }).optional(),
  agent_config: z.object({
    type: z.enum(['chat_completion', 'openai_assistant', 'azure_assistant']).default('chat_completion'),
    instructions: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    execution_settings: z.object({
      max_iterations: z.number().int().positive().default(10),
      enable_code_interpreter: z.boolean().default(false),
      enable_file_search: z.boolean().default(false),
      tool_choice: z.enum(['auto', 'required', 'none']).default('auto'),
    }).optional(),
  }).optional(),
  telemetry: z.object({
    enabled: z.boolean().default(true),
    activity_source_name: z.string().default('Microsoft.SemanticKernel'),
    meter_name: z.string().default('Microsoft.SemanticKernel'),
    log_function_invocations: z.boolean().default(true),
    log_prompt_template_content: z.boolean().default(false),
    log_function_results: z.boolean().default(false),
  }).optional(),
});

export { SemanticKernelExtensionSchema };
```

## Migration Guide

### From Semantic Kernel to OSSA

1. **Export plugins**: Convert native/semantic plugins to OSSA Tasks/Agents
2. **Map planners**: Convert planner usage to OSSA Workflows
3. **Configure memory**: Map memory stores to OSSA state configuration
4. **Add extension**: Include `extensions.semanticKernel` for bidirectional sync

### From OSSA to Semantic Kernel

1. **Generate kernel config**: Use OSSA manifest to configure Kernel
2. **Import plugins**: Convert OSSA capabilities to SK plugins
3. **Configure services**: Map runtime bindings to SK connectors
4. **Apply filters**: Convert safety policies to SK filters

## Validation

Validate your manifest using the OSSA CLI:

```bash
# Validate manifest with SK extension
ossa validate agent.yaml --extension semanticKernel

# Generate SK configuration from OSSA
ossa export --format semantic-kernel agent.yaml > kernel-config.json

# Import SK plugin as OSSA
ossa import --from semantic-kernel ./plugins/MyPlugin > tasks/my-plugin.yaml
```

## Best Practices

1. **Use function_calling planner**: Preferred for modern GPT-4 models
2. **Configure memory wisely**: Use volatile for development, persistent for production
3. **Apply filters for safety**: Always use function filters for production agents
4. **Monitor with telemetry**: Enable OpenTelemetry for observability
5. **Version your prompts**: Use prompt versioning for semantic functions
6. **Test planners thoroughly**: Validate planner output before production
7. **Secure credentials**: Use api_key_ref, never inline secrets
8. **Set appropriate limits**: Configure max_iterations and timeouts

## Related

- [Microsoft Semantic Kernel Documentation](https://learn.microsoft.com/en-us/semantic-kernel/)
- [Semantic Kernel GitHub](https://github.com/microsoft/semantic-kernel)
- [OSSA Manifest Schema](../ossa-0.3.4.schema.json)
- [OSSA Runtime Bindings](../runtime/bindings.yaml)
- [OSSA Safety Configuration](../schemas/safety.schema.json)
