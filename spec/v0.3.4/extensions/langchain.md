# LangChain/LangGraph Extension for OSSA v0.3.4

**Version:** 0.3.4
**Status:** Stable
**Last Updated:** 2025-12-31

## Overview

The `extensions.langchain` schema provides comprehensive bidirectional mapping between LangChain/LangGraph constructs and OSSA manifest primitives. This extension enables:

- LCEL (LangChain Expression Language) chains to be represented as OSSA Workflows
- LangGraph state machines mapped to OSSA Workflow kind with conditional branching
- Tool/Function binding via OSSA capabilities abstraction
- Memory systems (ConversationBufferMemory, VectorStoreMemory) mapped to OSSA state
- Agent architectures (ReAct, OpenAI Functions, XML) to OSSA Agent kind
- Callbacks integration with OSSA observability
- Runnables as OSSA Task kind

## Schema Definition

```yaml
extensions:
  langchain:
    type: object
    description: "LangChain/LangGraph integration extension for OSSA v0.3.4"
    properties:
      enabled:
        type: boolean
        default: true
        description: "Enable LangChain extension"

      version:
        type: string
        pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$"
        description: "LangChain version compatibility (e.g., 0.3.0)"
        examples:
          - "0.3.0"
          - "0.2.16"

      chains:
        type: array
        description: "LCEL chain definitions mapped to OSSA constructs"
        items:
          $ref: "#/definitions/LangChainChainConfig"

      graphs:
        type: array
        description: "LangGraph state machine definitions"
        items:
          $ref: "#/definitions/LangGraphConfig"

      memory_type:
        type: string
        enum:
          - conversation_buffer
          - conversation_buffer_window
          - conversation_summary
          - vector_store
          - entity
          - combined
          - none
        default: none
        description: "Memory backend type for stateful interactions"

      memory_config:
        type: object
        description: "Memory-specific configuration"
        properties:
          max_token_limit:
            type: integer
            minimum: 100
            maximum: 128000
            description: "Maximum tokens for memory buffer"
          k:
            type: integer
            minimum: 1
            description: "Window size for conversation_buffer_window"
          vector_store:
            type: object
            properties:
              type:
                type: string
                enum: [chroma, qdrant, pinecone, weaviate, milvus, pgvector, faiss]
              collection_name:
                type: string
              embedding_model:
                type: string
                description: "Embedding model for vectorization"
              connection_string:
                type: string
                description: "Connection string reference (use env var)"

      callbacks:
        type: array
        description: "LangChain callback handlers mapped to OSSA observability"
        items:
          $ref: "#/definitions/LangChainCallbackConfig"

      runnable_config:
        type: object
        description: "Global RunnableConfig settings"
        properties:
          max_concurrency:
            type: integer
            minimum: 1
            maximum: 100
            default: 5
            description: "Maximum concurrent runnable executions"
          recursion_limit:
            type: integer
            minimum: 1
            maximum: 100
            default: 25
            description: "Maximum recursion depth for nested runnables"
          tags:
            type: array
            items:
              type: string
            description: "Tags for filtering callbacks"
          metadata:
            type: object
            additionalProperties: true
            description: "Arbitrary metadata passed to callbacks"
          configurable:
            type: object
            additionalProperties: true
            description: "Configurable fields for runtime configuration"

      agent_type:
        type: string
        enum:
          - react
          - openai_functions
          - openai_tools
          - xml
          - structured_chat
          - tool_calling
          - langgraph_react
          - custom
        description: "LangChain agent architecture type"

      agent_config:
        type: object
        description: "Agent-type-specific configuration"
        properties:
          handle_parsing_errors:
            type: boolean
            default: true
          max_iterations:
            type: integer
            minimum: 1
            maximum: 100
            default: 15
          early_stopping_method:
            type: string
            enum: [force, generate]
            default: generate
          return_intermediate_steps:
            type: boolean
            default: false
          trim_intermediate_steps:
            type: integer
            description: "Keep only last N intermediate steps"

definitions:
  LangChainChainConfig:
    type: object
    required:
      - name
      - type
    properties:
      name:
        type: string
        pattern: "^[a-z][a-z0-9_-]*$"
        description: "Chain identifier"
      type:
        type: string
        enum:
          - llm
          - prompt_template
          - retrieval
          - stuff_documents
          - map_reduce
          - refine
          - map_rerank
          - conversational_retrieval
          - sql_database
          - api
          - transformation
          - sequential
          - router
          - custom
        description: "Chain type"
      lcel_expression:
        type: string
        description: "LCEL expression string (e.g., 'prompt | llm | parser')"
      components:
        type: array
        description: "Chain components for sequential chains"
        items:
          type: object
          properties:
            type:
              type: string
              enum: [prompt, llm, parser, retriever, tool, function, passthrough, itemgetter]
            ref:
              type: string
              description: "Reference to component definition"
            config:
              type: object
              additionalProperties: true
      input_schema:
        $ref: "#/definitions/JSONSchemaDefinition"
      output_schema:
        $ref: "#/definitions/JSONSchemaDefinition"
      fallback:
        type: object
        description: "Fallback chain configuration"
        properties:
          chain_ref:
            type: string
          exceptions:
            type: array
            items:
              type: string
      batch_config:
        type: object
        properties:
          max_concurrency:
            type: integer
          return_exceptions:
            type: boolean
            default: false

  LangGraphConfig:
    type: object
    required:
      - name
      - nodes
    properties:
      name:
        type: string
        pattern: "^[a-z][a-z0-9_-]*$"
        description: "Graph identifier"
      state_schema:
        $ref: "#/definitions/JSONSchemaDefinition"
        description: "TypedDict/Pydantic state schema"
      nodes:
        type: array
        description: "Graph nodes"
        items:
          type: object
          required:
            - id
            - type
          properties:
            id:
              type: string
              description: "Node identifier"
            type:
              type: string
              enum:
                - agent
                - tool
                - function
                - subgraph
                - passthrough
                - conditional
                - human_in_loop
            handler:
              type: string
              description: "Handler function/class reference"
            ossa_ref:
              type: string
              description: "Reference to OSSA Task or Agent manifest"
      edges:
        type: array
        description: "Graph edges (transitions)"
        items:
          type: object
          required:
            - from
            - to
          properties:
            from:
              type: string
              description: "Source node ID or START"
            to:
              type: string
              description: "Target node ID or END"
            condition:
              type: string
              description: "Condition function reference for conditional edges"
            condition_map:
              type: object
              description: "Map of condition values to target nodes"
              additionalProperties:
                type: string
      entrypoint:
        type: string
        default: "START"
        description: "Entry point node ID"
      checkpointer:
        type: object
        description: "State persistence configuration"
        properties:
          type:
            type: string
            enum: [memory, sqlite, postgres, redis]
          connection_string:
            type: string
      interrupt_before:
        type: array
        items:
          type: string
        description: "Nodes to interrupt before (human-in-the-loop)"
      interrupt_after:
        type: array
        items:
          type: string
        description: "Nodes to interrupt after"

  LangChainCallbackConfig:
    type: object
    required:
      - type
    properties:
      type:
        type: string
        enum:
          - langchain_tracer
          - langsmith
          - stdout
          - file
          - opentelemetry
          - phoenix
          - wandb
          - mlflow
          - custom
        description: "Callback handler type"
      config:
        type: object
        additionalProperties: true
        description: "Handler-specific configuration"
      events:
        type: array
        items:
          type: string
          enum:
            - on_llm_start
            - on_llm_end
            - on_llm_error
            - on_chain_start
            - on_chain_end
            - on_chain_error
            - on_tool_start
            - on_tool_end
            - on_tool_error
            - on_agent_action
            - on_agent_finish
            - on_retriever_start
            - on_retriever_end
            - on_text
            - on_retry
        description: "Events to handle (empty = all)"
```

## Bidirectional Mapping Tables

### 1. LCEL Chains to OSSA Workflows

| LangChain Construct | OSSA Equivalent | Notes |
|---------------------|-----------------|-------|
| `prompt \| llm \| parser` | `Workflow.steps[]` with sequential `Task` refs | Pipe operator maps to step dependencies |
| `RunnableSequence` | `Workflow` with ordered `steps` | Each runnable becomes a step |
| `RunnableParallel` | `Workflow.steps[].kind: Parallel` | Parallel execution group |
| `RunnableBranch` | `Workflow.steps[].kind: Conditional` | Conditional branching |
| `RunnableLambda` | `Task` with `execution.type: deterministic` | Pure function wrapper |
| `RunnablePassthrough` | `Task` with identity transform | Input passthrough |
| `chain.with_fallbacks()` | `Workflow.error_handling.on_failure: fallback` | Error fallback chain |
| `chain.batch()` | `Task.batch.enabled: true` | Batch processing |
| `chain.astream()` | `runtime.transport: async` | Streaming execution |
| `chain.invoke()` | Standard workflow execution | Synchronous invocation |

### 2. LangGraph State Machines to OSSA Workflows

| LangGraph Construct | OSSA Equivalent | Notes |
|---------------------|-----------------|-------|
| `StateGraph` | `kind: Workflow` | Workflow with state context |
| `graph.add_node()` | `Workflow.steps[]` | Each node is a step |
| `graph.add_edge()` | `steps[].depends_on` | Explicit dependencies |
| `graph.add_conditional_edges()` | `steps[].kind: Conditional` with `branches` | Conditional routing |
| `START` | First step (no `depends_on`) | Entry point |
| `END` | Step with no dependents | Terminal state |
| `MemorySaver` | `spec.state.persistence` | State checkpointing |
| `graph.compile()` | Workflow validation | Compile-time checks |
| `interrupt_before` | Human-in-loop approval | `access.requires_approval` |
| `state.messages` | `spec.state.schema.messages` | Message history |
| `state.update` | `steps[].output.to` | State updates |

### 3. Tool/Function Binding to OSSA Capabilities

| LangChain Construct | OSSA Equivalent | Notes |
|---------------------|-----------------|-------|
| `@tool` decorator | `spec.tools[]` | Tool definition |
| `Tool(name, func, description)` | `Tool` definition | Explicit tool |
| `StructuredTool` | `Tool` with `parameters` schema | Typed parameters |
| `BaseTool` subclass | `Tool` with `implementation` | Custom tool class |
| `create_retriever_tool()` | `Tool` + `extensions.mcp.resources` | Retrieval tool |
| `bind_tools()` | `spec.tools` assignment | Bind tools to agent |
| `tool_choice` | `llm.tool_calling.mode` | Tool selection mode |
| `ToolExecutor` | `runtime.bindings` | Execution binding |
| `ToolMessage` | Messaging extension | Tool result message |

### 4. Memory to OSSA State

| LangChain Memory | OSSA State Config | Notes |
|------------------|-------------------|-------|
| `ConversationBufferMemory` | `state.schema: {messages: array}` | Full history |
| `ConversationBufferWindowMemory(k=5)` | `state.history.window_size: 5` | Sliding window |
| `ConversationSummaryMemory` | `state.summarization.enabled: true` | Summarized history |
| `VectorStoreRetrieverMemory` | `state.vector_store` + retriever tool | Semantic search |
| `EntityMemory` | `state.entities` schema | Entity extraction |
| `CombinedMemory` | Multiple state schemas | Combined approach |
| `memory.load_memory_variables()` | `state.load()` | State retrieval |
| `memory.save_context()` | `state.save()` | State persistence |
| `memory.clear()` | `state.clear()` | State reset |

### 5. LangChain Agents to OSSA Agent Kind

| LangChain Agent | OSSA Agent Config | Notes |
|-----------------|-------------------|-------|
| `create_react_agent()` | `type: specialist`, ReAct prompts | Reasoning + Acting |
| `create_openai_functions_agent()` | `llm.tool_calling.format: openai_functions` | Function calling |
| `create_openai_tools_agent()` | `llm.tool_calling.format: openai_tools` | Tool calling |
| `create_xml_agent()` | `llm.tool_calling.format: xml` | XML format tools |
| `create_structured_chat_agent()` | Structured output schema | Structured chat |
| `create_tool_calling_agent()` | `llm.tool_calling.enabled: true` | Generic tool calling |
| `AgentExecutor` | OSSA runtime execution | Agent execution loop |
| `agent.astream_events()` | `observability.streaming: true` | Event streaming |
| `max_iterations` | `constraints.max_iterations` | Iteration limit |
| `handle_parsing_errors` | `constraints.error_handling` | Error recovery |

### 6. Callbacks to OSSA Observability

| LangChain Callback | OSSA Observability | Notes |
|--------------------|---------------------|-------|
| `StdOutCallbackHandler` | `observability.logging.level: debug` | Console output |
| `FileCallbackHandler` | `observability.logging.file` | File logging |
| `LangChainTracer` | `observability.tracing.enabled: true` | Distributed tracing |
| `LangSmithCallbackHandler` | External service integration | LangSmith platform |
| `OpenTelemetryCallbackHandler` | `observability.otlp` | OpenTelemetry export |
| `ArizePhoenixCallbackHandler` | `observability.phoenix` | Phoenix observability |
| `WandbCallbackHandler` | `observability.wandb` | Weights & Biases |
| `on_llm_start` | `observability.events.llm_start` | LLM invocation start |
| `on_chain_end` | `observability.events.chain_end` | Chain completion |
| `on_tool_error` | `observability.events.tool_error` | Tool execution error |

### 7. Runnables to OSSA Task Kind

| LangChain Runnable | OSSA Task Config | Notes |
|--------------------|------------------|-------|
| `Runnable` (base) | `kind: Task` | Base task |
| `RunnableLambda` | `execution.type: deterministic` | Pure function |
| `RunnableGenerator` | `execution.type: generator` | Streaming output |
| `RunnableRetry` | `error_handling.retry` | Retry logic |
| `RunnableWithFallbacks` | `error_handling.fallback_task` | Fallback chain |
| `RunnableBinding` | `runtime.bindings` | Runtime binding |
| `RunnableConfigurableFields` | `runtime.configurable` | Runtime config |
| `RunnableConfigurableAlternatives` | Multiple task variants | A/B testing |
| `runnable.invoke()` | Task execution | Synchronous |
| `runnable.ainvoke()` | Async task execution | Asynchronous |
| `runnable.batch()` | `batch.enabled: true` | Batch processing |
| `runnable.stream()` | Streaming execution | Token streaming |

## Example Manifests

### 1. ReAct Agent with Tools

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: react-research-agent
  version: 1.0.0
  description: Research agent using ReAct pattern with web search and calculator

spec:
  role: |
    You are a research assistant that uses the ReAct pattern.
    Think step-by-step, use tools when needed, and provide accurate answers.

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.1

  tools:
    - name: web_search
      description: Search the web for current information
      parameters:
        type: object
        properties:
          query:
            type: string
            description: Search query
        required: [query]

    - name: calculator
      description: Perform mathematical calculations
      parameters:
        type: object
        properties:
          expression:
            type: string
            description: Mathematical expression to evaluate
        required: [expression]

  constraints:
    max_iterations: 15
    timeout_seconds: 120

  state:
    persistence:
      type: redis
      connection_string: ${REDIS_URL}
    schema:
      type: object
      properties:
        messages:
          type: array
          items:
            type: object
            properties:
              role:
                type: string
              content:
                type: string
        intermediate_steps:
          type: array

  observability:
    tracing:
      enabled: true
      exporter: otlp
    logging:
      level: info

extensions:
  langchain:
    enabled: true
    version: "0.3.0"
    agent_type: react
    agent_config:
      handle_parsing_errors: true
      max_iterations: 15
      return_intermediate_steps: true
    memory_type: conversation_buffer
    memory_config:
      max_token_limit: 4000
    callbacks:
      - type: langsmith
        config:
          project_name: research-agent
      - type: opentelemetry
        config:
          endpoint: ${OTEL_EXPORTER_ENDPOINT}
```

### 2. LangGraph Workflow with Conditional Edges

```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: content-moderation-graph
  version: 1.0.0
  description: Content moderation workflow using LangGraph state machine

spec:
  inputs:
    type: object
    properties:
      content:
        type: string
        description: Content to moderate
      content_type:
        type: string
        enum: [text, image, video]
    required: [content, content_type]

  outputs:
    type: object
    properties:
      approved:
        type: boolean
      flags:
        type: array
        items:
          type: string
      confidence:
        type: number

  steps:
    - id: classify
      name: Content Classification
      kind: Task
      ref: ./tasks/classify-content.yaml
      input:
        content: ${{ workflow.input.content }}
        content_type: ${{ workflow.input.content_type }}

    - id: route
      name: Route by Classification
      kind: Conditional
      condition: ${{ steps.classify.output.risk_level }}
      branches:
        - condition: ${{ steps.classify.output.risk_level == 'low' }}
          steps:
            - id: auto_approve
              kind: Task
              ref: ./tasks/auto-approve.yaml
        - condition: ${{ steps.classify.output.risk_level == 'medium' }}
          steps:
            - id: detailed_review
              kind: Agent
              ref: ./agents/content-reviewer.yaml
        - condition: ${{ steps.classify.output.risk_level == 'high' }}
          steps:
            - id: human_review
              kind: Task
              ref: ./tasks/queue-human-review.yaml

    - id: finalize
      name: Finalize Decision
      kind: Task
      ref: ./tasks/finalize-moderation.yaml
      depends_on: [route]

  context:
    variables:
      moderation_policy_version: "2.1"

  error_handling:
    on_failure: notify
    notification:
      channels: [slack]

extensions:
  langchain:
    enabled: true
    version: "0.3.0"
    graphs:
      - name: moderation-graph
        state_schema:
          type: object
          properties:
            content:
              type: string
            risk_level:
              type: string
              enum: [low, medium, high]
            flags:
              type: array
            decision:
              type: string
        nodes:
          - id: classify
            type: function
            handler: "moderation.classify_content"
            ossa_ref: ./tasks/classify-content.yaml
          - id: auto_approve
            type: function
            handler: "moderation.auto_approve"
          - id: detailed_review
            type: agent
            ossa_ref: ./agents/content-reviewer.yaml
          - id: human_review
            type: human_in_loop
            handler: "moderation.queue_human"
          - id: finalize
            type: function
            handler: "moderation.finalize"
        edges:
          - from: START
            to: classify
          - from: classify
            to: route
            condition: "route_by_risk"
            condition_map:
              low: auto_approve
              medium: detailed_review
              high: human_review
          - from: auto_approve
            to: finalize
          - from: detailed_review
            to: finalize
          - from: human_review
            to: finalize
          - from: finalize
            to: END
        checkpointer:
          type: postgres
          connection_string: ${DATABASE_URL}
        interrupt_before:
          - human_review
```

### 3. LCEL Chain as OSSA Task

```yaml
apiVersion: ossa/v0.3.4
kind: Task
metadata:
  name: summarization-chain
  version: 1.0.0
  description: Document summarization using LCEL chain

spec:
  execution:
    type: deterministic
    runtime: python
    entrypoint: chains.summarization:run_chain
    timeout_seconds: 60

  capabilities:
    - summarize_text
    - extract_entities

  input:
    type: object
    properties:
      document:
        type: string
        description: Document text to summarize
      max_length:
        type: integer
        default: 500
        description: Maximum summary length
      style:
        type: string
        enum: [concise, detailed, bullet_points]
        default: concise
    required: [document]

  output:
    type: object
    properties:
      summary:
        type: string
      key_points:
        type: array
        items:
          type: string
      entities:
        type: array
        items:
          type: object
          properties:
            name:
              type: string
            type:
              type: string

  batch:
    enabled: true
    parallelism: 5
    chunk_size: 10

  error_handling:
    on_error: retry
    error_mapping:
      rate_limit_exceeded: retry
      context_length_exceeded: fail

  observability:
    logging:
      level: info
    metrics:
      enabled: true
      custom_labels:
        chain_type: summarization

extensions:
  langchain:
    enabled: true
    version: "0.3.0"
    chains:
      - name: summarization
        type: sequential
        lcel_expression: "prompt | llm | parser"
        components:
          - type: prompt
            ref: prompts/summarization.yaml
            config:
              input_variables: [document, max_length, style]
          - type: llm
            ref: ${LLM_MODEL:-claude-sonnet-4-20250514}
            config:
              temperature: 0.3
          - type: parser
            ref: parsers/summary_output
        input_schema:
          type: object
          properties:
            document:
              type: string
            max_length:
              type: integer
            style:
              type: string
        output_schema:
          type: object
          properties:
            summary:
              type: string
            key_points:
              type: array
        fallback:
          chain_ref: chains/simple_summarization
          exceptions:
            - OutputParserException
    runnable_config:
      max_concurrency: 10
      recursion_limit: 5
      tags:
        - summarization
        - production
      metadata:
        version: "1.0"
```

### 4. Vector Store Memory Agent

```yaml
apiVersion: ossa/v0.3.4
kind: Agent
metadata:
  name: knowledge-assistant
  version: 1.0.0
  description: Knowledge assistant with vector store memory

spec:
  role: |
    You are a knowledge assistant with access to a vector store of documents.
    Use the retrieved context to answer questions accurately.
    If you don't find relevant information, say so clearly.

  llm:
    provider: openai
    model: gpt-4o
    temperature: 0.2

  tools:
    - name: search_knowledge_base
      description: Search the knowledge base for relevant documents
      parameters:
        type: object
        properties:
          query:
            type: string
            description: Search query
          k:
            type: integer
            default: 5
            description: Number of results
        required: [query]

  state:
    schema:
      type: object
      properties:
        messages:
          type: array
        retrieved_documents:
          type: array
        session_context:
          type: object
    persistence:
      type: postgres
      connection_string: ${DATABASE_URL}

  constraints:
    max_iterations: 10
    timeout_seconds: 90

extensions:
  langchain:
    enabled: true
    version: "0.3.0"
    agent_type: openai_tools
    memory_type: vector_store
    memory_config:
      vector_store:
        type: qdrant
        collection_name: knowledge_base
        embedding_model: text-embedding-3-small
        connection_string: ${QDRANT_URL}
      max_token_limit: 8000
    agent_config:
      max_iterations: 10
      handle_parsing_errors: true
      return_intermediate_steps: false
    callbacks:
      - type: phoenix
        config:
          project_name: knowledge-assistant
        events:
          - on_retriever_start
          - on_retriever_end
          - on_llm_start
          - on_llm_end
```

### 5. Multi-Agent Conversation with OpenAI Functions

```yaml
apiVersion: ossa/v0.3.4
kind: Workflow
metadata:
  name: multi-agent-conversation
  version: 1.0.0
  description: Multi-agent conversation using LangGraph

spec:
  steps:
    - id: coordinator
      kind: Agent
      ref: ./agents/coordinator.yaml
      input:
        task: ${{ workflow.input.task }}

    - id: research_agent
      kind: Agent
      ref: ./agents/researcher.yaml
      condition: ${{ steps.coordinator.output.needs_research }}
      input:
        query: ${{ steps.coordinator.output.research_query }}

    - id: writing_agent
      kind: Agent
      ref: ./agents/writer.yaml
      depends_on: [research_agent]
      condition: ${{ steps.coordinator.output.needs_writing }}
      input:
        research: ${{ steps.research_agent.output.findings }}
        style: ${{ workflow.input.style }}

    - id: review_agent
      kind: Agent
      ref: ./agents/reviewer.yaml
      depends_on: [writing_agent]
      input:
        content: ${{ steps.writing_agent.output.draft }}

  context:
    variables:
      conversation_id: ${{ uuid() }}

extensions:
  langchain:
    enabled: true
    version: "0.3.0"
    graphs:
      - name: multi-agent-graph
        state_schema:
          type: object
          properties:
            messages:
              type: array
              description: Shared message history
            current_agent:
              type: string
            task_status:
              type: string
              enum: [pending, researching, writing, reviewing, complete]
        nodes:
          - id: coordinator
            type: agent
            ossa_ref: ./agents/coordinator.yaml
          - id: research_agent
            type: agent
            ossa_ref: ./agents/researcher.yaml
          - id: writing_agent
            type: agent
            ossa_ref: ./agents/writer.yaml
          - id: review_agent
            type: agent
            ossa_ref: ./agents/reviewer.yaml
        edges:
          - from: START
            to: coordinator
          - from: coordinator
            to: route
            condition: "route_to_agent"
            condition_map:
              research: research_agent
              write: writing_agent
              review: review_agent
              done: END
          - from: research_agent
            to: coordinator
          - from: writing_agent
            to: coordinator
          - from: review_agent
            to: coordinator
        checkpointer:
          type: redis
          connection_string: ${REDIS_URL}
    memory_type: conversation_buffer
    memory_config:
      max_token_limit: 16000
    callbacks:
      - type: langsmith
        config:
          project_name: multi-agent-conversation
```

## Implementation Notes

### Converting LangChain to OSSA

1. **Chains to Workflows**:
   - Each pipe operator (`|`) becomes a step dependency
   - `RunnableParallel` becomes `kind: Parallel` step
   - `RunnableBranch` becomes `kind: Conditional` with branches

2. **LangGraph to Workflow**:
   - `StateGraph` state schema maps to `spec.context.variables`
   - Node handlers become Task or Agent refs
   - Conditional edges use OSSA expression syntax
   - Checkpointer maps to state persistence

3. **Memory to State**:
   - Memory variables become state schema properties
   - Window size maps to `state.history.window_size`
   - Vector store memory uses retriever tool + state

4. **Callbacks to Observability**:
   - Event handlers map to OSSA observability events
   - Tracers integrate via OpenTelemetry
   - Custom callbacks use webhook or custom handlers

### Converting OSSA to LangChain

1. **Workflow to LCEL**:
   - Sequential steps become pipe chains
   - Parallel steps use `RunnableParallel`
   - Conditional steps use `RunnableBranch`

2. **Agent to LangChain Agent**:
   - Map agent type to appropriate create_*_agent function
   - Tools become `@tool` decorated functions
   - Constraints become AgentExecutor parameters

3. **State to Memory**:
   - State schema drives memory type selection
   - Persistence config maps to memory backend
   - Window size determines BufferWindow k value

## Validation

Validate LangChain extension configuration:

```bash
# Validate manifest with LangChain extension
ossa validate manifest.yaml --extension langchain

# Check LangGraph graph definition
ossa validate manifest.yaml --check-graphs

# Verify callback configuration
ossa validate manifest.yaml --check-callbacks
```

## Best Practices

1. **Version Compatibility**: Always specify `version` to ensure LangChain API compatibility
2. **Memory Selection**: Choose memory type based on use case - buffer for short conversations, vector store for knowledge retrieval
3. **Callback Efficiency**: Only subscribe to needed events to reduce overhead
4. **State Schema**: Define explicit state schemas for type safety
5. **Error Handling**: Configure fallbacks for production chains
6. **Observability**: Enable tracing for debugging and monitoring
7. **Batch Processing**: Use batch configuration for high-throughput scenarios

## References

- [LangChain Documentation](https://python.langchain.com/docs/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [OSSA v0.3.4 Specification](../ossa-0.3.4.schema.json)
- [OSSA Workflow Specification](../UNIFIED-SCHEMA.md)
- [OSSA Observability Extension](./observability.md)
