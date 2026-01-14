# LlamaIndex Extension for OSSA v0.3.3

## Overview

The `extensions.llamaindex` schema provides comprehensive bidirectional mappings between LlamaIndex's data framework components and OSSA manifest constructs. LlamaIndex is a data framework for LLM applications that enables structured data access, indexing, and retrieval for AI agents.

This extension supports:
- **Agents**: ReAct, OpenAI, Custom agent types mapped to OSSA Agent kind
- **Tools**: LlamaIndex tools mapped to OSSA capabilities
- **Query Engines**: Query engines mapped to OSSA Task kind
- **Indices**: Vector, List, Tree, and custom indices as OSSA resources
- **Storage Context**: Persistence layer mapped to OSSA state
- **Service Context**: Runtime configuration as OSSA runtime settings
- **Callbacks**: Observability handlers mapped to OSSA observability
- **Workflows**: LlamaIndex Workflows mapped to OSSA Workflow kind

## Schema Definition

```yaml
extensions:
  llamaindex:
    type: object
    description: "LlamaIndex framework extension for OSSA v0.3.3"
    properties:
      agent_type:
        type: string
        enum:
          - react        # ReActAgent - reasoning + action loops
          - openai       # OpenAIAgent - OpenAI function calling
          - custom       # CustomAgent - user-defined agent logic
          - structured   # StructuredPlannerAgent - multi-step planning
          - lats         # LATSAgentWorker - language agent tree search
          - introspective # IntrospectiveAgent - self-reflection
        description: "LlamaIndex agent type classification"
        default: "react"

      index_config:
        type: object
        description: "Index configuration for retrieval-augmented generation"
        properties:
          type:
            type: string
            enum:
              - vector      # VectorStoreIndex - embedding similarity
              - list        # SummaryIndex - sequential document list
              - tree        # TreeIndex - hierarchical summarization
              - keyword     # KeywordTableIndex - keyword extraction
              - knowledge_graph  # KnowledgeGraphIndex - entity relationships
              - document_summary # DocumentSummaryIndex - per-document summaries
              - property_graph   # PropertyGraphIndex - property graph queries
              - sql          # SQLStructStoreIndex - SQL database
              - pandas       # PandasIndex - DataFrame operations
              - custom       # Custom index implementation
            description: "Index type for document retrieval"
            default: "vector"

          embed_model:
            type: object
            description: "Embedding model configuration"
            properties:
              provider:
                type: string
                enum: ["openai", "huggingface", "cohere", "ollama", "azure", "vertex", "bedrock", "custom"]
                description: "Embedding provider"
              model:
                type: string
                description: "Model identifier (e.g., text-embedding-3-large)"
                examples:
                  - "text-embedding-3-large"
                  - "text-embedding-ada-002"
                  - "BAAI/bge-large-en-v1.5"
              dimensions:
                type: integer
                description: "Embedding dimensions (for truncation/padding)"
                minimum: 1
                maximum: 8192

          similarity_top_k:
            type: integer
            description: "Number of similar documents to retrieve"
            default: 5
            minimum: 1
            maximum: 100

          similarity_cutoff:
            type: number
            description: "Minimum similarity score threshold"
            minimum: 0
            maximum: 1

          chunk_size:
            type: integer
            description: "Document chunk size for indexing"
            default: 1024
            minimum: 64
            maximum: 32768

          chunk_overlap:
            type: integer
            description: "Overlap between chunks"
            default: 20
            minimum: 0

          node_parser:
            type: string
            enum: ["simple", "sentence", "semantic", "hierarchical", "markdown", "json", "code", "custom"]
            description: "Node parser type for document chunking"
            default: "simple"

          transformations:
            type: array
            items:
              type: string
              enum: ["title_extractor", "keyword_extractor", "qa_extractor", "summary_extractor", "entity_extractor", "custom"]
            description: "Document transformation pipeline"

          reranker:
            type: object
            description: "Reranking configuration for improved retrieval"
            properties:
              type:
                type: string
                enum: ["cohere", "colbert", "bge", "sentence_transformer", "llm", "custom"]
              model:
                type: string
                description: "Reranker model identifier"
              top_n:
                type: integer
                description: "Number of documents after reranking"
                default: 3

      storage_context:
        type: object
        description: "Storage context configuration for persistence"
        properties:
          docstore:
            type: object
            description: "Document store configuration"
            properties:
              type:
                type: string
                enum: ["simple", "mongodb", "redis", "firestore", "dynamodb", "postgres", "custom"]
                default: "simple"
              connection_uri:
                type: string
                description: "Database connection URI (env var reference supported)"
              namespace:
                type: string
                description: "Namespace/collection for documents"

          index_store:
            type: object
            description: "Index metadata store"
            properties:
              type:
                type: string
                enum: ["simple", "mongodb", "redis", "postgres", "custom"]
                default: "simple"
              connection_uri:
                type: string

          vector_store:
            type: object
            description: "Vector store for embeddings"
            properties:
              type:
                type: string
                enum:
                  - simple       # In-memory
                  - chroma       # ChromaDB
                  - pinecone     # Pinecone
                  - weaviate     # Weaviate
                  - qdrant       # Qdrant
                  - milvus       # Milvus/Zilliz
                  - pgvector     # PostgreSQL pgvector
                  - faiss        # FAISS
                  - elasticsearch # Elasticsearch
                  - opensearch   # OpenSearch
                  - lancedb      # LanceDB
                  - deeplake     # Deep Lake
                  - custom
                description: "Vector database type"
              connection_uri:
                type: string
                description: "Vector store connection URI"
              collection_name:
                type: string
                description: "Collection/index name"
              dimension:
                type: integer
                description: "Vector dimensions"
              distance_metric:
                type: string
                enum: ["cosine", "euclidean", "dot_product", "ip"]
                default: "cosine"

          graph_store:
            type: object
            description: "Graph store for knowledge graphs"
            properties:
              type:
                type: string
                enum: ["simple", "neo4j", "nebula", "kuzu", "falkordb", "custom"]
              connection_uri:
                type: string

          persist_dir:
            type: string
            description: "Local directory for file-based persistence"

          persist_strategy:
            type: string
            enum: ["on_change", "on_shutdown", "periodic", "manual"]
            description: "When to persist state"
            default: "on_change"

      query_engine_config:
        type: object
        description: "Query engine configuration (maps to OSSA Task kind)"
        properties:
          type:
            type: string
            enum:
              - retriever       # Basic retrieval + synthesis
              - router          # Routes queries to sub-engines
              - sub_question    # Decomposes into sub-questions
              - citation        # Includes source citations
              - knowledge_graph # Graph-based queries
              - sql             # SQL generation + execution
              - pandas          # DataFrame operations
              - multi_step      # Multi-hop reasoning
              - flare           # Forward-looking active retrieval
              - custom
            description: "Query engine type"
            default: "retriever"

          response_synthesizer:
            type: object
            description: "Response synthesis configuration"
            properties:
              mode:
                type: string
                enum:
                  - refine          # Iterative refinement
                  - compact         # Compact context
                  - tree_summarize  # Hierarchical summarization
                  - simple          # Simple generation
                  - accumulate      # Accumulate responses
                  - compact_accumulate  # Compact + accumulate
                description: "Response synthesis mode"
                default: "compact"

              streaming:
                type: boolean
                description: "Enable streaming responses"
                default: false

          retriever:
            type: object
            description: "Retriever configuration"
            properties:
              type:
                type: string
                enum: ["vector", "bm25", "hybrid", "auto_merging", "recursive", "custom"]
                default: "vector"
              top_k:
                type: integer
                default: 5
              alpha:
                type: number
                description: "Hybrid search alpha (0=keyword, 1=vector)"
                minimum: 0
                maximum: 1

          post_processors:
            type: array
            description: "Post-processing nodes after retrieval"
            items:
              type: object
              properties:
                type:
                  type: string
                  enum:
                    - similarity_cutoff
                    - keyword_filter
                    - metadata_filter
                    - sentence_reorder
                    - time_weighted
                    - cohere_rerank
                    - llm_rerank
                    - custom
                config:
                  type: object
                  additionalProperties: true

      tools:
        type: array
        description: "LlamaIndex tool configurations (maps to OSSA capabilities)"
        items:
          type: object
          required: ["name", "type"]
          properties:
            name:
              type: string
              description: "Tool name"
            type:
              type: string
              enum:
                - query_engine    # QueryEngineTool
                - function        # FunctionTool
                - retriever       # RetrieverTool
                - on_demand_loader # OnDemandLoaderTool
                - load_and_search  # LoadAndSearchToolSpec
                - code_interpreter # CodeInterpreterToolSpec
                - wolfram         # WolframAlphaToolSpec
                - google_search   # GoogleSearchToolSpec
                - arxiv           # ArxivToolSpec
                - wikipedia       # WikipediaToolSpec
                - sql             # SQLToolSpec
                - mcp             # MCP server tool
                - custom
              description: "Tool type"
            description:
              type: string
              description: "Tool description for agent"
            return_direct:
              type: boolean
              description: "Return tool result directly without LLM processing"
              default: false
            mcp_server:
              type: string
              description: "MCP server name (for type: mcp)"
            config:
              type: object
              description: "Tool-specific configuration"
              additionalProperties: true

      service_context:
        type: object
        description: "Service context / runtime settings (DEPRECATED in favor of Settings)"
        properties:
          llm:
            type: object
            description: "LLM configuration (inherits from spec.llm)"
            properties:
              provider:
                type: string
                enum: ["openai", "anthropic", "azure", "huggingface", "ollama", "groq", "together", "bedrock", "vertex", "custom"]
              model:
                type: string
              temperature:
                type: number
              max_tokens:
                type: integer
              context_window:
                type: integer
                description: "Context window size"

          callback_manager:
            $ref: "#/definitions/CallbackManagerConfig"

          node_parser:
            type: string
            description: "Default node parser"

          prompt_helper:
            type: object
            description: "Prompt helper configuration"
            properties:
              context_window:
                type: integer
              num_output:
                type: integer
              chunk_overlap_ratio:
                type: number
              chunk_size_limit:
                type: integer

      callbacks:
        type: object
        description: "Callback/observability configuration (maps to OSSA observability)"
        properties:
          handlers:
            type: array
            description: "Callback handler configurations"
            items:
              type: object
              required: ["type"]
              properties:
                type:
                  type: string
                  enum:
                    - llama_debug      # LlamaDebugHandler
                    - wandb            # WandbCallbackHandler
                    - arize_phoenix    # ArizePhoenixCallbackHandler
                    - openinference    # OpenInferenceCallbackHandler
                    - langfuse         # LangfuseCallbackHandler
                    - aim              # AimCallback
                    - simple           # SimpleSpanHandler
                    - opentelemetry    # OpenTelemetry integration
                    - custom
                  description: "Callback handler type"
                config:
                  type: object
                  description: "Handler-specific configuration"
                  additionalProperties: true

          trace_events:
            type: array
            description: "Events to trace"
            items:
              type: string
              enum:
                - llm_start
                - llm_end
                - llm_stream
                - embedding_start
                - embedding_end
                - retrieval_start
                - retrieval_end
                - synthesize_start
                - synthesize_end
                - query_start
                - query_end
                - reranking_start
                - reranking_end
                - agent_step
                - tool_call
                - exception
            default: ["llm_start", "llm_end", "query_start", "query_end"]

      workflows:
        type: object
        description: "LlamaIndex Workflows configuration (maps to OSSA Workflow kind)"
        properties:
          enabled:
            type: boolean
            description: "Enable LlamaIndex Workflows integration"
            default: false

          events:
            type: array
            description: "Custom event type definitions"
            items:
              type: object
              properties:
                name:
                  type: string
                  description: "Event class name"
                schema:
                  $ref: "#/definitions/JSONSchemaDefinition"
                  description: "Event payload schema"

          steps:
            type: array
            description: "Workflow step definitions (alternative to OSSA Workflow steps)"
            items:
              type: object
              required: ["name", "handler"]
              properties:
                name:
                  type: string
                  description: "Step name (maps to @step decorator)"
                handler:
                  type: string
                  description: "Handler function path"
                input_events:
                  type: array
                  items:
                    type: string
                  description: "Events this step listens to"
                output_events:
                  type: array
                  items:
                    type: string
                  description: "Events this step emits"
                num_workers:
                  type: integer
                  description: "Parallel workers for this step"
                  default: 1

          context:
            type: object
            description: "Workflow context configuration"
            properties:
              collect_events:
                type: boolean
                default: false
              streaming:
                type: boolean
                default: false

    additionalProperties: true
```

## Bidirectional Mapping Tables

### Agent Type Mappings

| LlamaIndex Agent | OSSA Kind | OSSA spec.type | Notes |
|-----------------|-----------|----------------|-------|
| `ReActAgent` | Agent | orchestrator | Reasoning + action loops with tool use |
| `OpenAIAgent` | Agent | specialist | OpenAI function calling optimization |
| `CustomAgent` | Agent | worker | User-defined agent logic |
| `StructuredPlannerAgent` | Agent | orchestrator | Multi-step planning with structured output |
| `LATSAgentWorker` | Agent | orchestrator | Tree search for complex reasoning |
| `IntrospectiveAgent` | Agent | critic | Self-reflection and correction |
| `FunctionCallingAgent` | Agent | specialist | Generic function calling |
| `ParallelAgentRunner` | Workflow | - | Multi-agent coordination |

### Tool Mappings

| LlamaIndex Tool | OSSA Capability | OSSA Tool Type |
|-----------------|-----------------|----------------|
| `QueryEngineTool` | query_data | function |
| `FunctionTool` | (custom) | function |
| `RetrieverTool` | retrieve_documents | function |
| `OnDemandLoaderTool` | load_documents | function |
| `LoadAndSearchToolSpec` | search_and_load | function |
| `CodeInterpreterToolSpec` | execute_code | function |
| `WolframAlphaToolSpec` | compute_math | api |
| `GoogleSearchToolSpec` | web_search | api |
| `ArxivToolSpec` | search_papers | api |
| `WikipediaToolSpec` | search_wiki | api |
| `SQLToolSpec` | query_database | function |

### Index Type Mappings

| LlamaIndex Index | OSSA Resource | Use Case |
|-----------------|---------------|----------|
| `VectorStoreIndex` | vector_store | Semantic similarity search |
| `SummaryIndex` | document_list | Sequential document access |
| `TreeIndex` | tree_structure | Hierarchical summarization |
| `KeywordTableIndex` | keyword_index | Keyword-based retrieval |
| `KnowledgeGraphIndex` | knowledge_graph | Entity relationship queries |
| `DocumentSummaryIndex` | summary_store | Per-document summaries |
| `PropertyGraphIndex` | property_graph | Property graph queries |
| `SQLStructStoreIndex` | sql_database | Structured SQL queries |
| `PandasIndex` | dataframe | DataFrame operations |

### Query Engine to Task Mapping

| LlamaIndex Query Engine | OSSA Task execution.type | Description |
|------------------------|-------------------------|-------------|
| `RetrieverQueryEngine` | deterministic | Basic retrieve + synthesize |
| `RouterQueryEngine` | deterministic | Route to appropriate sub-engine |
| `SubQuestionQueryEngine` | deterministic | Decompose into sub-questions |
| `CitationQueryEngine` | deterministic | Include source citations |
| `KnowledgeGraphQueryEngine` | deterministic | Graph traversal queries |
| `NLSQLTableQueryEngine` | transactional | SQL generation + execution |
| `PandasQueryEngine` | idempotent | DataFrame operations |
| `MultiStepQueryEngine` | deterministic | Multi-hop reasoning |
| `FLAREInstructQueryEngine` | deterministic | Active retrieval |

### Callback Handler to Observability Mapping

| LlamaIndex Handler | OSSA Observability | Integration |
|-------------------|-------------------|-------------|
| `LlamaDebugHandler` | logging.level: debug | Development debugging |
| `WandbCallbackHandler` | metrics.enabled: true | Weights & Biases |
| `ArizePhoenixCallbackHandler` | tracing.enabled: true | Arize Phoenix |
| `OpenInferenceCallbackHandler` | tracing.enabled: true | OpenInference/Phoenix |
| `LangfuseCallbackHandler` | tracing.enabled: true | Langfuse |
| `AimCallback` | metrics.enabled: true | Aim |
| `OpenTelemetry` | tracing.enabled: true | OTEL export |

### Storage Context to State Mapping

| LlamaIndex Storage | OSSA State | Persistence |
|-------------------|------------|-------------|
| `SimpleDocumentStore` | state.type: in_memory | In-memory |
| `MongoDocumentStore` | state.type: external | MongoDB |
| `RedisDocumentStore` | state.type: external | Redis |
| `SimpleVectorStore` | state.type: in_memory | In-memory vectors |
| `ChromaVectorStore` | state.type: external | ChromaDB |
| `PineconeVectorStore` | state.type: external | Pinecone |
| `QdrantVectorStore` | state.type: external | Qdrant |
| `WeaviateVectorStore` | state.type: external | Weaviate |
| `PGVectorStore` | state.type: external | PostgreSQL |

### LlamaIndex Workflows to OSSA Workflow Mapping

| LlamaIndex Workflow | OSSA Workflow |
|--------------------|---------------|
| `@workflow` class | kind: Workflow |
| `@step` decorator | spec.steps[].kind: Task |
| `Event` class | spec.steps[].input/output |
| `Context` | spec.context.variables |
| `run()` | spec.triggers[].type: manual |
| `stream_events()` | spec.observability.tracing.enabled |
| `num_workers` | spec.steps[].parallel |

## Example Manifests

### 1. RAG Agent with Vector Index

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: rag-researcher
  version: 1.0.0
  description: "Research agent with RAG capabilities"
  labels:
    domain: research
    framework: llamaindex

spec:
  role: |
    You are a research assistant with access to a knowledge base.
    Use the query tool to find relevant information before answering.
    Always cite your sources.

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0.1
    maxTokens: 4096

  tools:
    - type: function
      name: query_knowledge_base
      description: "Search the research knowledge base"
      parameters:
        type: object
        properties:
          query:
            type: string
            description: "Search query"
        required: ["query"]

  autonomy:
    level: 3
    max_iterations: 10

  state:
    type: external
    persistence:
      type: vector_store
      location: qdrant://localhost:6333/research

extensions:
  llamaindex:
    agent_type: react

    index_config:
      type: vector
      embed_model:
        provider: openai
        model: text-embedding-3-large
        dimensions: 3072
      similarity_top_k: 10
      chunk_size: 512
      chunk_overlap: 50
      node_parser: semantic
      transformations:
        - title_extractor
        - keyword_extractor
      reranker:
        type: cohere
        model: rerank-english-v3.0
        top_n: 5

    storage_context:
      vector_store:
        type: qdrant
        connection_uri: "${QDRANT_URL:-http://localhost:6333}"
        collection_name: research_docs
        dimension: 3072
        distance_metric: cosine
      docstore:
        type: redis
        connection_uri: "${REDIS_URL:-redis://localhost:6379}"
        namespace: research

    query_engine_config:
      type: citation
      response_synthesizer:
        mode: tree_summarize
        streaming: true
      retriever:
        type: hybrid
        top_k: 10
        alpha: 0.7
      post_processors:
        - type: cohere_rerank
          config:
            model: rerank-english-v3.0
            top_n: 5

    callbacks:
      handlers:
        - type: arize_phoenix
          config:
            endpoint: "${PHOENIX_ENDPOINT:-http://localhost:6006}"
        - type: opentelemetry
          config:
            service_name: rag-researcher
            exporter: otlp
      trace_events:
        - llm_start
        - llm_end
        - retrieval_start
        - retrieval_end
        - reranking_start
        - reranking_end

runtime:
  type: unified
  supports:
    - local-execution
    - kubernetes
```

### 2. Multi-Tool OpenAI Agent

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: research-assistant
  version: 1.0.0
  description: "Multi-tool research assistant using OpenAI function calling"

spec:
  role: |
    You are a research assistant with access to multiple tools.
    Use the appropriate tools to answer questions comprehensively.

  llm:
    provider: openai
    model: gpt-4o
    temperature: 0.2

  tools:
    - type: function
      name: search_arxiv
      description: "Search academic papers on arXiv"
    - type: function
      name: search_wikipedia
      description: "Search Wikipedia for general knowledge"
    - type: function
      name: compute_math
      description: "Compute mathematical expressions"

  autonomy:
    level: 4
    max_iterations: 15

extensions:
  llamaindex:
    agent_type: openai

    tools:
      - name: search_arxiv
        type: arxiv
        description: "Search academic papers on arXiv"
        config:
          max_results: 10

      - name: search_wikipedia
        type: wikipedia
        description: "Search Wikipedia articles"
        config:
          load_all_available_meta: true

      - name: compute_math
        type: wolfram
        description: "Compute using Wolfram Alpha"
        config:
          api_key: "${WOLFRAM_API_KEY}"

      - name: query_docs
        type: query_engine
        description: "Query internal documentation"
        config:
          index_id: docs-index

    service_context:
      llm:
        provider: openai
        model: gpt-4o
        context_window: 128000
      callback_manager:
        handlers:
          - type: langfuse
            config:
              public_key: "${LANGFUSE_PUBLIC_KEY}"
              secret_key: "${LANGFUSE_SECRET_KEY}"

    callbacks:
      handlers:
        - type: langfuse
          config:
            public_key: "${LANGFUSE_PUBLIC_KEY}"
            secret_key: "${LANGFUSE_SECRET_KEY}"
      trace_events:
        - llm_start
        - llm_end
        - tool_call
        - agent_step
```

### 3. Query Engine as Task

```yaml
apiVersion: ossa/v0.3.3
kind: Task
metadata:
  name: document-qa
  version: 1.0.0
  description: "Document Q&A task using LlamaIndex query engine"

spec:
  execution:
    type: deterministic
    runtime: python
    entrypoint: "llamaindex_tasks.document_qa:execute"
    timeout_seconds: 60

  capabilities:
    - query_documents
    - synthesize_response

  input:
    type: object
    properties:
      query:
        type: string
        description: "User question"
      index_id:
        type: string
        description: "Index to query"
      top_k:
        type: integer
        default: 5
    required: ["query", "index_id"]

  output:
    type: object
    properties:
      response:
        type: string
      sources:
        type: array
        items:
          type: object
          properties:
            text:
              type: string
            score:
              type: number
            metadata:
              type: object

  error_handling:
    on_error: retry
    error_mapping:
      "429": retry  # Rate limit
      "503": retry  # Service unavailable

extensions:
  llamaindex:
    query_engine_config:
      type: retriever
      response_synthesizer:
        mode: compact
        streaming: false
      retriever:
        type: vector
        top_k: "${{ input.top_k }}"
      post_processors:
        - type: similarity_cutoff
          config:
            similarity_cutoff: 0.7

    index_config:
      type: vector
      embed_model:
        provider: openai
        model: text-embedding-3-small
      similarity_top_k: 10

runtime:
  type: unified
  bindings:
    query_documents:
      handler: "llamaindex.query_engine.RetrieverQueryEngine"
    synthesize_response:
      handler: "llamaindex.response_synthesizer.CompactAndRefine"
```

### 4. LlamaIndex Workflow

```yaml
apiVersion: ossa/v0.3.3
kind: Workflow
metadata:
  name: research-workflow
  version: 1.0.0
  description: "Multi-step research workflow using LlamaIndex Workflows"

spec:
  triggers:
    - type: webhook
      path: /api/research
    - type: manual

  inputs:
    type: object
    properties:
      topic:
        type: string
        description: "Research topic"
      depth:
        type: string
        enum: ["shallow", "medium", "deep"]
        default: "medium"
    required: ["topic"]

  outputs:
    type: object
    properties:
      report:
        type: string
      sources:
        type: array
        items:
          type: object

  steps:
    - id: search
      name: Search Sources
      kind: Task
      ref: ./tasks/search-sources.yaml
      input:
        topic: "${{ workflow.input.topic }}"

    - id: retrieve
      name: Retrieve Documents
      kind: Task
      ref: ./tasks/retrieve-docs.yaml
      input:
        sources: "${{ steps.search.output.sources }}"
      depends_on: [search]

    - id: synthesize
      name: Synthesize Report
      kind: Agent
      ref: ./agents/report-writer.yaml
      input:
        documents: "${{ steps.retrieve.output.documents }}"
        topic: "${{ workflow.input.topic }}"
      depends_on: [retrieve]

  error_handling:
    on_failure: compensate
    compensation_steps:
      - id: cleanup
        kind: Task
        inline:
          execution:
            type: idempotent
            entrypoint: "cleanup_cache"

  observability:
    tracing:
      enabled: true
      propagate_context: true
    metrics:
      enabled: true
      custom_labels:
        workflow_type: research

extensions:
  llamaindex:
    workflows:
      enabled: true

      events:
        - name: SearchCompleteEvent
          schema:
            type: object
            properties:
              sources:
                type: array
              query:
                type: string

        - name: RetrievalCompleteEvent
          schema:
            type: object
            properties:
              documents:
                type: array
              metadata:
                type: object

        - name: SynthesisCompleteEvent
          schema:
            type: object
            properties:
              report:
                type: string
              citations:
                type: array

      steps:
        - name: search_step
          handler: "research_workflow.steps:search_sources"
          input_events: ["StartEvent"]
          output_events: ["SearchCompleteEvent"]
          num_workers: 1

        - name: retrieve_step
          handler: "research_workflow.steps:retrieve_documents"
          input_events: ["SearchCompleteEvent"]
          output_events: ["RetrievalCompleteEvent"]
          num_workers: 4

        - name: synthesize_step
          handler: "research_workflow.steps:synthesize_report"
          input_events: ["RetrievalCompleteEvent"]
          output_events: ["SynthesisCompleteEvent", "StopEvent"]
          num_workers: 1

      context:
        collect_events: true
        streaming: true
```

### 5. Knowledge Graph Agent

```yaml
apiVersion: ossa/v0.3.3
kind: Agent
metadata:
  name: kg-analyst
  version: 1.0.0
  description: "Knowledge graph analysis agent"
  labels:
    domain: data
    index_type: knowledge_graph

spec:
  role: |
    You are a knowledge graph analyst. Use graph queries to explore
    relationships between entities and answer complex questions about
    entity connections.

  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    temperature: 0

  tools:
    - type: function
      name: query_graph
      description: "Execute Cypher query on knowledge graph"
    - type: function
      name: find_path
      description: "Find shortest path between entities"

  autonomy:
    level: 3

extensions:
  llamaindex:
    agent_type: react

    index_config:
      type: knowledge_graph
      node_parser: semantic

    storage_context:
      graph_store:
        type: neo4j
        connection_uri: "${NEO4J_URI:-bolt://localhost:7687}"
      vector_store:
        type: qdrant
        connection_uri: "${QDRANT_URL:-http://localhost:6333}"
        collection_name: kg_embeddings

    query_engine_config:
      type: knowledge_graph
      response_synthesizer:
        mode: tree_summarize

    tools:
      - name: query_graph
        type: custom
        description: "Execute graph queries"
        config:
          handler: "kg_tools:execute_cypher"
      - name: find_path
        type: custom
        description: "Find entity paths"
        config:
          handler: "kg_tools:find_shortest_path"

    callbacks:
      handlers:
        - type: arize_phoenix
          config:
            log_traces: true
      trace_events:
        - query_start
        - query_end
        - retrieval_start
        - retrieval_end
```

## Validation (Zod Schema)

```typescript
import { z } from 'zod';

// Embedding model configuration
const EmbedModelConfigSchema = z.object({
  provider: z.enum(['openai', 'huggingface', 'cohere', 'ollama', 'azure', 'vertex', 'bedrock', 'custom']),
  model: z.string(),
  dimensions: z.number().int().min(1).max(8192).optional(),
});

// Reranker configuration
const RerankerConfigSchema = z.object({
  type: z.enum(['cohere', 'colbert', 'bge', 'sentence_transformer', 'llm', 'custom']),
  model: z.string().optional(),
  top_n: z.number().int().min(1).default(3),
});

// Index configuration
const IndexConfigSchema = z.object({
  type: z.enum([
    'vector', 'list', 'tree', 'keyword', 'knowledge_graph',
    'document_summary', 'property_graph', 'sql', 'pandas', 'custom'
  ]).default('vector'),
  embed_model: EmbedModelConfigSchema.optional(),
  similarity_top_k: z.number().int().min(1).max(100).default(5),
  similarity_cutoff: z.number().min(0).max(1).optional(),
  chunk_size: z.number().int().min(64).max(32768).default(1024),
  chunk_overlap: z.number().int().min(0).default(20),
  node_parser: z.enum(['simple', 'sentence', 'semantic', 'hierarchical', 'markdown', 'json', 'code', 'custom']).default('simple'),
  transformations: z.array(z.enum([
    'title_extractor', 'keyword_extractor', 'qa_extractor',
    'summary_extractor', 'entity_extractor', 'custom'
  ])).optional(),
  reranker: RerankerConfigSchema.optional(),
});

// Vector store configuration
const VectorStoreConfigSchema = z.object({
  type: z.enum([
    'simple', 'chroma', 'pinecone', 'weaviate', 'qdrant', 'milvus',
    'pgvector', 'faiss', 'elasticsearch', 'opensearch', 'lancedb', 'deeplake', 'custom'
  ]),
  connection_uri: z.string().optional(),
  collection_name: z.string().optional(),
  dimension: z.number().int().optional(),
  distance_metric: z.enum(['cosine', 'euclidean', 'dot_product', 'ip']).default('cosine'),
});

// Storage context configuration
const StorageContextConfigSchema = z.object({
  docstore: z.object({
    type: z.enum(['simple', 'mongodb', 'redis', 'firestore', 'dynamodb', 'postgres', 'custom']).default('simple'),
    connection_uri: z.string().optional(),
    namespace: z.string().optional(),
  }).optional(),
  index_store: z.object({
    type: z.enum(['simple', 'mongodb', 'redis', 'postgres', 'custom']).default('simple'),
    connection_uri: z.string().optional(),
  }).optional(),
  vector_store: VectorStoreConfigSchema.optional(),
  graph_store: z.object({
    type: z.enum(['simple', 'neo4j', 'nebula', 'kuzu', 'falkordb', 'custom']),
    connection_uri: z.string().optional(),
  }).optional(),
  persist_dir: z.string().optional(),
  persist_strategy: z.enum(['on_change', 'on_shutdown', 'periodic', 'manual']).default('on_change'),
});

// Query engine configuration
const QueryEngineConfigSchema = z.object({
  type: z.enum([
    'retriever', 'router', 'sub_question', 'citation', 'knowledge_graph',
    'sql', 'pandas', 'multi_step', 'flare', 'custom'
  ]).default('retriever'),
  response_synthesizer: z.object({
    mode: z.enum(['refine', 'compact', 'tree_summarize', 'simple', 'accumulate', 'compact_accumulate']).default('compact'),
    streaming: z.boolean().default(false),
  }).optional(),
  retriever: z.object({
    type: z.enum(['vector', 'bm25', 'hybrid', 'auto_merging', 'recursive', 'custom']).default('vector'),
    top_k: z.number().int().default(5),
    alpha: z.number().min(0).max(1).optional(),
  }).optional(),
  post_processors: z.array(z.object({
    type: z.enum([
      'similarity_cutoff', 'keyword_filter', 'metadata_filter', 'sentence_reorder',
      'time_weighted', 'cohere_rerank', 'llm_rerank', 'custom'
    ]),
    config: z.record(z.unknown()).optional(),
  })).optional(),
});

// Tool configuration
const ToolConfigSchema = z.object({
  name: z.string(),
  type: z.enum([
    'query_engine', 'function', 'retriever', 'on_demand_loader', 'load_and_search',
    'code_interpreter', 'wolfram', 'google_search', 'arxiv', 'wikipedia', 'sql', 'mcp', 'custom'
  ]),
  description: z.string().optional(),
  return_direct: z.boolean().default(false),
  mcp_server: z.string().optional(),
  config: z.record(z.unknown()).optional(),
});

// Callback handler configuration
const CallbackHandlerSchema = z.object({
  type: z.enum([
    'llama_debug', 'wandb', 'arize_phoenix', 'openinference',
    'langfuse', 'aim', 'simple', 'opentelemetry', 'custom'
  ]),
  config: z.record(z.unknown()).optional(),
});

// Callbacks configuration
const CallbacksConfigSchema = z.object({
  handlers: z.array(CallbackHandlerSchema).optional(),
  trace_events: z.array(z.enum([
    'llm_start', 'llm_end', 'llm_stream', 'embedding_start', 'embedding_end',
    'retrieval_start', 'retrieval_end', 'synthesize_start', 'synthesize_end',
    'query_start', 'query_end', 'reranking_start', 'reranking_end',
    'agent_step', 'tool_call', 'exception'
  ])).default(['llm_start', 'llm_end', 'query_start', 'query_end']),
});

// Workflow event schema
const WorkflowEventSchema = z.object({
  name: z.string(),
  schema: z.record(z.unknown()).optional(),
});

// Workflow step schema
const WorkflowStepSchema = z.object({
  name: z.string(),
  handler: z.string(),
  input_events: z.array(z.string()).optional(),
  output_events: z.array(z.string()).optional(),
  num_workers: z.number().int().min(1).default(1),
});

// Workflows configuration
const WorkflowsConfigSchema = z.object({
  enabled: z.boolean().default(false),
  events: z.array(WorkflowEventSchema).optional(),
  steps: z.array(WorkflowStepSchema).optional(),
  context: z.object({
    collect_events: z.boolean().default(false),
    streaming: z.boolean().default(false),
  }).optional(),
});

// Main LlamaIndex extension schema
export const LlamaIndexExtensionSchema = z.object({
  agent_type: z.enum([
    'react', 'openai', 'custom', 'structured', 'lats', 'introspective'
  ]).default('react'),
  index_config: IndexConfigSchema.optional(),
  storage_context: StorageContextConfigSchema.optional(),
  query_engine_config: QueryEngineConfigSchema.optional(),
  tools: z.array(ToolConfigSchema).optional(),
  service_context: z.object({
    llm: z.object({
      provider: z.enum(['openai', 'anthropic', 'azure', 'huggingface', 'ollama', 'groq', 'together', 'bedrock', 'vertex', 'custom']).optional(),
      model: z.string().optional(),
      temperature: z.number().optional(),
      max_tokens: z.number().int().optional(),
      context_window: z.number().int().optional(),
    }).optional(),
    callback_manager: z.record(z.unknown()).optional(),
    node_parser: z.string().optional(),
    prompt_helper: z.object({
      context_window: z.number().int().optional(),
      num_output: z.number().int().optional(),
      chunk_overlap_ratio: z.number().optional(),
      chunk_size_limit: z.number().int().optional(),
    }).optional(),
  }).optional(),
  callbacks: CallbacksConfigSchema.optional(),
  workflows: WorkflowsConfigSchema.optional(),
}).passthrough();

// Type inference
export type LlamaIndexExtension = z.infer<typeof LlamaIndexExtensionSchema>;
```

## CRUD Patterns

### Create Agent from LlamaIndex

```python
from llama_index.core.agent import ReActAgent
from llama_index.core import VectorStoreIndex
from ossa.adapters.llamaindex import LlamaIndexAdapter

# Existing LlamaIndex setup
index = VectorStoreIndex.from_documents(documents)
agent = ReActAgent.from_tools(tools, llm=llm, verbose=True)

# Convert to OSSA manifest
adapter = LlamaIndexAdapter()
manifest = adapter.to_ossa_manifest(
    agent=agent,
    index=index,
    metadata={
        "name": "my-rag-agent",
        "version": "1.0.0"
    }
)

# Save manifest
manifest.save("agents/my-rag-agent.ossa.yaml")
```

### Read/Load OSSA Manifest to LlamaIndex

```python
from ossa.adapters.llamaindex import LlamaIndexAdapter

# Load OSSA manifest
adapter = LlamaIndexAdapter()
components = adapter.from_ossa_manifest("agents/my-rag-agent.ossa.yaml")

# Access components
agent = components.agent
index = components.index
query_engine = components.query_engine
storage_context = components.storage_context
```

### Update Manifest

```python
from ossa import OSSAManifest

# Load and update
manifest = OSSAManifest.load("agents/my-rag-agent.ossa.yaml")

# Update LlamaIndex extension
manifest.extensions.llamaindex.index_config.similarity_top_k = 10
manifest.extensions.llamaindex.storage_context.vector_store.collection_name = "new_collection"

# Bump version
manifest.metadata.version = "1.1.0"
manifest.save()
```

### Delete/Cleanup

```python
from ossa.adapters.llamaindex import LlamaIndexAdapter

adapter = LlamaIndexAdapter()

# Cleanup storage resources
adapter.cleanup_storage(
    manifest="agents/my-rag-agent.ossa.yaml",
    cleanup_vectors=True,
    cleanup_docstore=True
)
```

## OpenAPI Integration

```yaml
openapi: 3.1.0
info:
  title: OSSA LlamaIndex Extension API
  version: 0.3.3

paths:
  /api/v1/agents/{agent_id}/llamaindex/index:
    post:
      summary: Create or update index
      operationId: createIndex
      parameters:
        - name: agent_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/IndexConfig'
      responses:
        '201':
          description: Index created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/IndexStatus'

  /api/v1/agents/{agent_id}/llamaindex/query:
    post:
      summary: Execute query
      operationId: executeQuery
      parameters:
        - name: agent_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [query]
              properties:
                query:
                  type: string
                top_k:
                  type: integer
                  default: 5
                streaming:
                  type: boolean
                  default: false
      responses:
        '200':
          description: Query response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QueryResponse'

  /api/v1/agents/{agent_id}/llamaindex/documents:
    post:
      summary: Add documents to index
      operationId: addDocuments
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                documents:
                  type: array
                  items:
                    type: object
                    properties:
                      text:
                        type: string
                      metadata:
                        type: object
      responses:
        '201':
          description: Documents added

components:
  schemas:
    IndexConfig:
      $ref: '#/definitions/LlamaIndexExtension/properties/index_config'

    QueryResponse:
      type: object
      properties:
        response:
          type: string
        sources:
          type: array
          items:
            type: object
            properties:
              text:
                type: string
              score:
                type: number
              node_id:
                type: string
              metadata:
                type: object
        metadata:
          type: object
          properties:
            latency_ms:
              type: number
            tokens_used:
              type: integer
            model:
              type: string

    IndexStatus:
      type: object
      properties:
        index_id:
          type: string
        type:
          type: string
        document_count:
          type: integer
        vector_count:
          type: integer
        last_updated:
          type: string
          format: date-time
```

## Related

- [LlamaIndex Documentation](https://docs.llamaindex.ai/)
- [LlamaIndex Workflows](https://docs.llamaindex.ai/en/stable/module_guides/observability/observability/)
- [OSSA v0.3.3 Specification](../UNIFIED-SCHEMA.md)
- [MCP Extension](./mcp.md)
- [Drupal Extension](./drupal.md)
