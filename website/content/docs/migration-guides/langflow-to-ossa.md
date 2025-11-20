---
title: "Langflow to OSSA"
---

# Langflow to OSSA Migration Guide

**Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Key Concepts Mapping](#key-concepts-mapping)
3. [Architecture Comparison](#architecture-comparison)
4. [Migration Strategy](#migration-strategy)
5. [Component Mapping Reference](#component-mapping-reference)
6. [Migration Examples](#migration-examples)
7. [Advanced Patterns](#advanced-patterns)
8. [Testing & Validation](#testing--validation)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides a comprehensive methodology for migrating from Langflow's visual flow-based architecture to OSSA (Open Standards for Scalable Agents). While Langflow excels at rapid prototyping with visual workflows, OSSA provides production-grade agent orchestration with enhanced interoperability, type safety, and enterprise features.

### Why Migrate to OSSA?

- **Production-Ready Infrastructure**: Built-in monitoring, metrics, and compliance
- **Multi-Protocol Support**: HTTP, gRPC, WebSocket, stdio, A2A protocol bridges
- **Framework Interoperability**: Works with LangChain, CrewAI, AutoGen, and MCP
- **Type Safety**: Full JSON Schema validation and TypeScript definitions
- **Enterprise Features**: RBAC, encryption, audit logging, compliance frameworks
- **Cloud-Native**: Kubernetes-ready with resource management and auto-scaling
- **Version Control Friendly**: YAML-based configuration vs. JSON blobs

### Migration Effort Estimation

| Flow Complexity | Estimated Time | Difficulty |
|----------------|----------------|------------|
| Simple (1-5 nodes) | 30-60 minutes | Easy |
| Medium (6-15 nodes) | 2-4 hours | Moderate |
| Complex (16+ nodes) | 4-8 hours | Advanced |
| Multi-flow systems | 1-2 days | Advanced |

---

## Key Concepts Mapping

### Langflow → OSSA Terminology

| Langflow Concept | OSSA Equivalent | Description |
|-----------------|-----------------|-------------|
| **Flow** | **Agent Workflow** | Complete end-to-end process |
| **Node** | **Capability Operation** | Individual processing unit |
| **Edge** | **Workflow Step Connection** | Data flow between operations |
| **Component** | **Agent Capability** | Reusable functionality |
| **Input/Output** | **Input/Output Schema** | Data contracts with JSON Schema |
| **Template** | **Agent Manifest** | Configuration specification |
| **Variable** | **Environment Variable** | Runtime configuration |
| **API Key** | **Authentication Config** | Security credentials |
| **Prompt Template** | **LLM Configuration** | Model interaction setup |
| **Memory** | **Context Management** | State persistence |

### Data Flow Models

**Langflow (Node-Edge Graph)**:
```
ChatInput → PromptTemplate → OpenAI → ChatOutput
   ↓              ↓              ↓          ↓
 User Msg    Format Prompt   Generate    Display
```

**OSSA (Capability-Based Workflow)**:
```yaml
capabilities:
  - accept_input      # ChatInput
  - format_prompt     # PromptTemplate
  - llm_generation    # OpenAI
  - return_output     # ChatOutput

workflow:
  steps:
    - accept_input → format_prompt
    - format_prompt → llm_generation
    - llm_generation → return_output
```

---

## Architecture Comparison

### Langflow Architecture

```
┌─────────────────────────────────────┐
│      Visual Flow Builder (UI)       │
├─────────────────────────────────────┤
│  Nodes (Components) + Edges (Flows) │
├─────────────────────────────────────┤
│      Langflow Runtime Engine        │
├─────────────────────────────────────┤
│    Python Execution Environment     │
└─────────────────────────────────────┘
```

**Characteristics**:
- Visual-first design
- Python-centric execution
- JSON export format
- Single runtime model
- Limited interoperability

### OSSA Architecture

```
┌─────────────────────────────────────┐
│    Agent Manifest (YAML Config)     │
├─────────────────────────────────────┤
│  Capabilities + Operations + Schema │
├─────────────────────────────────────┤
│   Protocol Bridges (MCP/HTTP/A2A)   │
├─────────────────────────────────────┤
│ Multi-Runtime (Local/K8s/Serverless)│
├─────────────────────────────────────┤
│  Monitoring + Metrics + Compliance   │
└─────────────────────────────────────┘
```

**Characteristics**:
- Code and config as infrastructure
- Multi-language support (TypeScript, Python, Go, etc.)
- YAML manifest format
- Multiple deployment targets
- Universal interoperability via bridges

---

## Migration Strategy

### Phase 1: Analysis & Planning

#### 1.1 Export Langflow Configuration

```bash
# From Langflow UI
1. Open your flow
2. Click "Export" button
3. Select "Save with my API keys" (optional)
4. Save as FLOW_NAME.json
```

#### 1.2 Analyze Flow Structure

```bash
# Use jq to inspect flow structure
jq '.data.nodes[] | {id: .id, type: .data.type, display_name: .data.node.display_name}' flow.json

# Count components
jq '.data.nodes | length' flow.json

# List edges (connections)
jq '.data.edges[] | {source: .source, target: .target}' flow.json
```

#### 1.3 Identify Migration Patterns

- **Sequential Processing**: Linear node chains → Workflow steps
- **Conditional Logic**: Switch nodes → Conditional capabilities
- **Parallel Processing**: Multiple edge branches → Parallel execution
- **Memory/State**: Context nodes → Context management
- **API Integrations**: HTTP nodes → Integration endpoints

### Phase 2: Component Mapping

#### 2.1 Create Capability Inventory

Map each unique Langflow node type to OSSA capabilities:

```yaml
# Example mapping table
langflow_components:
  ChatInput: { ossa_capability: "accept_user_input", category: "input" }
  PromptTemplate: { ossa_capability: "format_prompt", category: "processing" }
  OpenAI: { ossa_capability: "llm_generation", category: "ai" }
  ConversationChain: { ossa_capability: "conversation_management", category: "ai" }
  ChatOutput: { ossa_capability: "return_response", category: "output" }
  VectorStore: { ossa_capability: "vector_storage", category: "storage" }
  Retriever: { ossa_capability: "semantic_search", category: "retrieval" }
```

#### 2.2 Define JSON Schemas

For each capability, create input/output schemas:

```yaml
capabilities:
  - name: format_prompt
    description: "Format user input into LLM prompt"
    input_schema:
      type: object
      required: ["user_message", "template"]
      properties:
        user_message:
          type: string
          description: "User's input message"
        template:
          type: string
          description: "Prompt template with placeholders"
        variables:
          type: object
          description: "Template variable values"
    output_schema:
      type: object
      required: ["formatted_prompt"]
      properties:
        formatted_prompt:
          type: string
          description: "Fully formatted prompt ready for LLM"
```

### Phase 3: OSSA Manifest Creation

#### 3.1 Base Agent Structure

```yaml
apiVersion: ossa/v1
kind: Agent
metadata:
  name: migrated-chatbot-agent
  version: 1.0.0
  description: "Migrated from Langflow chatbot flow"
  labels:
    migration_source: langflow
    original_flow: chatbot-v1
    created_date: "2025-11-10"

spec:
  role: workflow

  runtime:
    type: local
    command: [node, dist/index.js]
    resources:
      cpu: 500m
      memory: 512Mi

  capabilities:
    # Define all capabilities from mapping

  integration:
    protocol: http
    endpoints:
      base_url: http://localhost:3000
      execute: /api/v1/execute
    authentication:
      type: api-key

  monitoring:
    traces: true
    metrics: true
    logs: true
```

### Phase 4: Implementation

#### 4.1 Generate Agent Scaffold

```bash
# Use BuildKit to create agent structure
buildkit agents create \
  --name migrated-chatbot-agent \
  --type workflow \
  --capabilities "accept_input,format_prompt,llm_generation,return_response" \
  --enable-mcp \
  --interactive
```

#### 4.2 Implement Capability Handlers

```typescript
// src/capabilities/format-prompt.ts
import { CapabilityHandler } from '@ossa/agent-sdk';

export const formatPromptHandler: CapabilityHandler = async (input, context) => {
  const { user_message, template, variables } = input;

  // Replace template placeholders
  let formatted_prompt = template;
  for (const [key, value] of Object.entries(variables || {})) {
    formatted_prompt = formatted_prompt.replace(`{${key}}`, value);
  }
  formatted_prompt = formatted_prompt.replace('{user_input}', user_message);

  return { formatted_prompt };
};
```

### Phase 5: Testing & Validation

```bash
# Validate agent manifest
buildkit agents validate ./migrated-chatbot-agent.yaml

# Test individual capabilities
buildkit agents test \
  --name migrated-chatbot-agent \
  --capability format_prompt \
  --input '{"user_message": "Hello", "template": "User said: {user_input}"}'

# Integration test
buildkit agents deploy --name migrated-chatbot-agent --env dev
curl -X POST http://localhost:3000/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{"operation": "process_conversation", "input": {"message": "Hello world"}}'
```

---

## Component Mapping Reference

### Input Components

| Langflow Component | OSSA Capability Pattern | Notes |
|-------------------|------------------------|-------|
| `ChatInput` | `accept_user_input` | HTTP endpoint or stdio |
| `TextInput` | `accept_text_input` | Structured text input |
| `File` | `accept_file_upload` | File handling capability |
| `URLInput` | `fetch_url_content` | Web scraping capability |

### Processing Components

| Langflow Component | OSSA Capability Pattern | Notes |
|-------------------|------------------------|-------|
| `PromptTemplate` | `format_prompt` | Template string processing |
| `TextSplitter` | `split_text` | Chunking logic |
| `CharacterTextSplitter` | `split_by_character` | Character-based splitting |
| `RecursiveCharacterTextSplitter` | `recursive_split` | Recursive chunking |
| `PythonFunction` | `execute_custom_logic` | Custom code execution |
| `ConditionalRouter` | `route_conditionally` | Conditional branching |

### AI/LLM Components

| Langflow Component | OSSA Capability Pattern | Notes |
|-------------------|------------------------|-------|
| `OpenAI` | `openai_completion` | LLM generation |
| `ChatOpenAI` | `openai_chat` | Chat completion |
| `Anthropic` | `anthropic_completion` | Claude integration |
| `HuggingFace` | `huggingface_inference` | HF models |
| `Ollama` | `ollama_inference` | Local LLM |
| `ConversationChain` | `conversation_management` | Stateful conversation |
| `LLMChain` | `llm_chain_execution` | Chain processing |

### Vector Store Components

| Langflow Component | OSSA Capability Pattern | Notes |
|-------------------|------------------------|-------|
| `Chroma` | `chroma_vector_store` | Chroma DB integration |
| `Pinecone` | `pinecone_vector_store` | Pinecone integration |
| `FAISS` | `faiss_vector_store` | Local vector DB |
| `Qdrant` | `qdrant_vector_store` | Qdrant integration |
| `Weaviate` | `weaviate_vector_store` | Weaviate integration |

### Retrieval Components

| Langflow Component | OSSA Capability Pattern | Notes |
|-------------------|------------------------|-------|
| `VectorStoreRetriever` | `semantic_search` | Vector similarity search |
| `MultiQueryRetriever` | `multi_query_search` | Query expansion |
| `ContextualCompressionRetriever` | `compressed_retrieval` | Result compression |

### Memory Components

| Langflow Component | OSSA Capability Pattern | Notes |
|-------------------|------------------------|-------|
| `ConversationBufferMemory` | `buffer_memory_management` | Full history storage |
| `ConversationSummaryMemory` | `summary_memory_management` | Summarized history |
| `ConversationBufferWindowMemory` | `window_memory_management` | Sliding window |

### Output Components

| Langflow Component | OSSA Capability Pattern | Notes |
|-------------------|------------------------|-------|
| `ChatOutput` | `return_chat_response` | Chat response |
| `TextOutput` | `return_text_output` | Plain text output |
| `JSONOutput` | `return_json_output` | Structured JSON |

---

## Migration Examples

### Example 1: Simple Chatbot Flow

#### Langflow JSON Export

```json
{
  "data": {
    "nodes": [
      {
        "id": "ChatInput-abc123",
        "type": "ChatInput",
        "position": { "x": 100, "y": 100 },
        "data": {
          "node": {
            "display_name": "Chat Input",
            "description": "Accept user messages",
            "template": {
              "input_value": {
                "type": "str",
                "required": true,
                "placeholder": "Enter your message"
              }
            }
          }
        }
      },
      {
        "id": "PromptTemplate-def456",
        "type": "PromptTemplate",
        "position": { "x": 300, "y": 100 },
        "data": {
          "node": {
            "display_name": "Prompt Formatter",
            "template": {
              "template": {
                "type": "str",
                "value": "You are a helpful assistant. User: {user_input}\nAssistant:"
              }
            }
          }
        }
      },
      {
        "id": "OpenAI-ghi789",
        "type": "ChatOpenAI",
        "position": { "x": 500, "y": 100 },
        "data": {
          "node": {
            "display_name": "OpenAI GPT-4",
            "template": {
              "model_name": {
                "value": "gpt-4"
              },
              "temperature": {
                "value": 0.7
              },
              "max_tokens": {
                "value": 500
              }
            }
          }
        }
      },
      {
        "id": "ChatOutput-jkl012",
        "type": "ChatOutput",
        "position": { "x": 700, "y": 100 },
        "data": {
          "node": {
            "display_name": "Chat Output",
            "description": "Display response to user"
          }
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "ChatInput-abc123",
        "target": "PromptTemplate-def456",
        "sourceHandle": "output",
        "targetHandle": "user_input"
      },
      {
        "id": "edge-2",
        "source": "PromptTemplate-def456",
        "target": "OpenAI-ghi789",
        "sourceHandle": "prompt",
        "targetHandle": "messages"
      },
      {
        "id": "edge-3",
        "source": "OpenAI-ghi789",
        "target": "ChatOutput-jkl012",
        "sourceHandle": "response",
        "targetHandle": "input"
      }
    ]
  },
  "description": "Simple chatbot with OpenAI",
  "name": "Simple Chatbot"
}
```

#### OSSA YAML Manifest

```yaml
apiVersion: ossa/v1
kind: Agent
metadata:
  name: simple-chatbot
  version: 1.0.0
  description: "Simple chatbot with OpenAI - migrated from Langflow"
  labels:
    migration_source: langflow
    original_flow: simple-chatbot
  annotations:
    langflow.original_nodes: "4"
    langflow.original_edges: "3"

spec:
  role: workflow

  # LLM Configuration (from OpenAI node)
  llm:
    provider: openai
    model: gpt-4
    temperature: 0.7
    maxTokens: 500

  # Capabilities (mapped from nodes)
  capabilities:
    - name: accept_chat_input
      description: "Accept user messages (from ChatInput node)"
      input_schema:
        type: object
        required: ["message"]
        properties:
          message:
            type: string
            description: "User's chat message"
      output_schema:
        type: object
        properties:
          user_message:
            type: string

    - name: format_prompt
      description: "Format message into LLM prompt (from PromptTemplate node)"
      input_schema:
        type: object
        required: ["user_input"]
        properties:
          user_input:
            type: string
      output_schema:
        type: object
        properties:
          formatted_prompt:
            type: string

    - name: generate_response
      description: "Generate AI response (from ChatOpenAI node)"
      input_schema:
        type: object
        required: ["prompt"]
        properties:
          prompt:
            type: string
      output_schema:
        type: object
        properties:
          response:
            type: string
            description: "AI-generated response"

    - name: return_response
      description: "Return chat response (from ChatOutput node)"
      input_schema:
        type: object
        required: ["response"]
        properties:
          response:
            type: string
      output_schema:
        type: object
        properties:
          output:
            type: string

  # Runtime Configuration
  runtime:
    type: local
    command: [node, dist/index.js]
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      NODE_ENV: production
    resources:
      cpu: 500m
      memory: 512Mi

  # Integration Protocol
  integration:
    protocol: http
    endpoints:
      base_url: http://localhost:3000
      execute: /api/v1/chat
      health: /health
      metrics: /metrics
    authentication:
      type: api-key
      config:
        header: X-API-Key

  # Monitoring
  monitoring:
    traces: true
    metrics: true
    logs: true
    alerts:
      - type: error_rate
        threshold: 0.05
        action: notify

  # Policies
  policies:
    encryption: true
    audit: true
    compliance:
      - ISO42001
      - SOC2
```

#### Implementation Code

```typescript
// src/index.ts
import { OSSAAgent, CapabilityHandler } from '@ossa/agent-sdk';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Capability: accept_chat_input
const acceptChatInput: CapabilityHandler = async (input) => {
  return { user_message: input.message };
};

// Capability: format_prompt
const formatPrompt: CapabilityHandler = async (input) => {
  const template = "You are a helpful assistant. User: {user_input}\nAssistant:";
  const formatted_prompt = template.replace('{user_input}', input.user_input);
  return { formatted_prompt };
};

// Capability: generate_response
const generateResponse: CapabilityHandler = async (input) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: input.prompt }],
    temperature: 0.7,
    max_tokens: 500,
  });
  return { response: completion.choices[0].message.content };
};

// Capability: return_response
const returnResponse: CapabilityHandler = async (input) => {
  return { output: input.response };
};

// Agent initialization
const agent = new OSSAAgent({
  manifestPath: './simple-chatbot.yaml',
  capabilities: {
    accept_chat_input: acceptChatInput,
    format_prompt: formatPrompt,
    generate_response: generateResponse,
    return_response: returnResponse,
  },
});

// Workflow orchestration
agent.defineWorkflow('chat', async (input) => {
  const step1 = await agent.execute('accept_chat_input', { message: input.message });
  const step2 = await agent.execute('format_prompt', { user_input: step1.user_message });
  const step3 = await agent.execute('generate_response', { prompt: step2.formatted_prompt });
  const step4 = await agent.execute('return_response', { response: step3.response });
  return step4.output;
});

agent.start();
```

---

### Example 2: RAG System with Vector Store

#### Langflow JSON Export

```json
{
  "data": {
    "nodes": [
      {
        "id": "TextInput-rag001",
        "type": "TextInput",
        "data": {
          "node": {
            "display_name": "User Query",
            "template": {
              "input_value": { "type": "str" }
            }
          }
        }
      },
      {
        "id": "Embeddings-rag002",
        "type": "OpenAIEmbeddings",
        "data": {
          "node": {
            "display_name": "Query Embeddings",
            "template": {
              "model": { "value": "text-embedding-3-small" }
            }
          }
        }
      },
      {
        "id": "VectorStore-rag003",
        "type": "Qdrant",
        "data": {
          "node": {
            "display_name": "Vector Database",
            "template": {
              "collection_name": { "value": "knowledge_base" },
              "url": { "value": "http://localhost:6333" }
            }
          }
        }
      },
      {
        "id": "Retriever-rag004",
        "type": "VectorStoreRetriever",
        "data": {
          "node": {
            "display_name": "Semantic Search",
            "template": {
              "search_type": { "value": "similarity" },
              "k": { "value": 5 }
            }
          }
        }
      },
      {
        "id": "PromptTemplate-rag005",
        "type": "PromptTemplate",
        "data": {
          "node": {
            "template": {
              "template": {
                "value": "Context: {context}\n\nQuestion: {question}\n\nAnswer based on context:"
              }
            }
          }
        }
      },
      {
        "id": "LLM-rag006",
        "type": "ChatOpenAI",
        "data": {
          "node": {
            "template": {
              "model_name": { "value": "gpt-4" },
              "temperature": { "value": 0.3 }
            }
          }
        }
      },
      {
        "id": "Output-rag007",
        "type": "TextOutput",
        "data": {
          "node": { "display_name": "Final Answer" }
        }
      }
    ],
    "edges": [
      {
        "source": "TextInput-rag001",
        "target": "Embeddings-rag002"
      },
      {
        "source": "Embeddings-rag002",
        "target": "VectorStore-rag003"
      },
      {
        "source": "VectorStore-rag003",
        "target": "Retriever-rag004"
      },
      {
        "source": "Retriever-rag004",
        "target": "PromptTemplate-rag005",
        "sourceHandle": "documents",
        "targetHandle": "context"
      },
      {
        "source": "TextInput-rag001",
        "target": "PromptTemplate-rag005",
        "targetHandle": "question"
      },
      {
        "source": "PromptTemplate-rag005",
        "target": "LLM-rag006"
      },
      {
        "source": "LLM-rag006",
        "target": "Output-rag007"
      }
    ]
  },
  "name": "RAG Knowledge Base",
  "description": "RAG system with Qdrant vector store"
}
```

#### OSSA YAML Manifest

```yaml
apiVersion: ossa/v1
kind: Agent
metadata:
  name: rag-knowledge-base
  version: 1.0.0
  description: "RAG system with vector store - migrated from Langflow"
  labels:
    migration_source: langflow
    pattern: retrieval-augmented-generation
    vector_db: qdrant

spec:
  role: workflow

  # LLM Configuration
  llm:
    provider: openai
    model: gpt-4
    temperature: 0.3
    maxTokens: 1000

  # Capabilities
  capabilities:
    - name: accept_query
      description: "Accept user query"
      input_schema:
        type: object
        required: ["question"]
        properties:
          question:
            type: string
            description: "User's question"
      output_schema:
        type: object
        properties:
          query:
            type: string

    - name: generate_embeddings
      description: "Generate query embeddings"
      input_schema:
        type: object
        required: ["text"]
        properties:
          text:
            type: string
      output_schema:
        type: object
        properties:
          embeddings:
            type: array
            items:
              type: number

    - name: vector_search
      description: "Search vector database"
      input_schema:
        type: object
        required: ["embeddings", "k"]
        properties:
          embeddings:
            type: array
            items:
              type: number
          k:
            type: integer
            default: 5
            description: "Number of results to return"
          collection:
            type: string
            default: "knowledge_base"
      output_schema:
        type: object
        properties:
          documents:
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

    - name: format_rag_prompt
      description: "Format RAG prompt with context"
      input_schema:
        type: object
        required: ["question", "documents"]
        properties:
          question:
            type: string
          documents:
            type: array
            items:
              type: object
      output_schema:
        type: object
        properties:
          prompt:
            type: string

    - name: generate_answer
      description: "Generate contextual answer"
      input_schema:
        type: object
        required: ["prompt"]
        properties:
          prompt:
            type: string
      output_schema:
        type: object
        properties:
          answer:
            type: string
            description: "Generated answer with citations"

  # Runtime Configuration
  runtime:
    type: docker
    image: ossa/rag-agent:1.0.0
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      QDRANT_URL: http://qdrant:6333
      QDRANT_API_KEY: ${QDRANT_API_KEY}
      EMBEDDING_MODEL: text-embedding-3-small
    resources:
      cpu: 1000m
      memory: 1Gi

  # Integration
  integration:
    protocol: http
    endpoints:
      base_url: http://localhost:3000
      execute: /api/v1/query
      health: /health
    authentication:
      type: bearer
      config:
        token_env: API_TOKEN

  # External Integrations
  dependencies:
    - name: qdrant
      type: vector_database
      endpoint: http://qdrant:6333
      authentication:
        type: api-key
    - name: openai
      type: llm_provider
      endpoint: https://api.openai.com/v1

  # Monitoring
  monitoring:
    traces: true
    metrics: true
    logs: true
    custom_metrics:
      - name: retrieval_latency_ms
        type: histogram
      - name: embedding_generation_time_ms
        type: histogram
      - name: documents_retrieved
        type: gauge

  # Performance
  performance:
    throughput:
      requestsPerSecond: 20
      concurrentRequests: 5
    latency:
      p50: 2000
      p95: 5000
      p99: 8000
```

#### Implementation Code

```typescript
// src/index.ts
import { OSSAAgent } from '@ossa/agent-sdk';
import OpenAI from 'openai';
import { QdrantClient } from '@qdrant/js-client-rest';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });

const agent = new OSSAAgent({ manifestPath: './rag-knowledge-base.yaml' });

// Capability: accept_query
agent.registerCapability('accept_query', async (input) => {
  return { query: input.question };
});

// Capability: generate_embeddings
agent.registerCapability('generate_embeddings', async (input) => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: input.text,
  });
  return { embeddings: response.data[0].embedding };
});

// Capability: vector_search
agent.registerCapability('vector_search', async (input) => {
  const results = await qdrant.search(input.collection || 'knowledge_base', {
    vector: input.embeddings,
    limit: input.k || 5,
    with_payload: true,
  });

  const documents = results.map(result => ({
    content: result.payload?.text || '',
    score: result.score,
    metadata: result.payload || {},
  }));

  return { documents };
});

// Capability: format_rag_prompt
agent.registerCapability('format_rag_prompt', async (input) => {
  const context = input.documents
    .map((doc: any) => doc.content)
    .join('\n\n');

  const prompt = `Context: ${context}\n\nQuestion: ${input.question}\n\nAnswer based on context:`;
  return { prompt };
});

// Capability: generate_answer
agent.registerCapability('generate_answer', async (input) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: input.prompt }],
    temperature: 0.3,
    max_tokens: 1000,
  });

  return { answer: completion.choices[0].message.content };
});

// Workflow: RAG query processing
agent.defineWorkflow('rag_query', async (input) => {
  // Step 1: Accept and validate query
  const { query } = await agent.execute('accept_query', { question: input.question });

  // Step 2: Generate embeddings
  const { embeddings } = await agent.execute('generate_embeddings', { text: query });

  // Step 3: Search vector database
  const { documents } = await agent.execute('vector_search', {
    embeddings,
    k: input.k || 5,
    collection: input.collection || 'knowledge_base'
  });

  // Step 4: Format RAG prompt
  const { prompt } = await agent.execute('format_rag_prompt', {
    question: query,
    documents
  });

  // Step 5: Generate answer
  const { answer } = await agent.execute('generate_answer', { prompt });

  return {
    answer,
    sources: documents,
    metadata: {
      query,
      num_sources: documents.length,
      timestamp: new Date().toISOString(),
    }
  };
});

agent.start();
```

---

### Example 3: Multi-Agent Workflow with Conditional Routing

#### Langflow JSON Export

```json
{
  "data": {
    "nodes": [
      {
        "id": "Input-multi001",
        "type": "ChatInput",
        "data": {
          "node": {
            "display_name": "User Request"
          }
        }
      },
      {
        "id": "Classifier-multi002",
        "type": "ChatOpenAI",
        "data": {
          "node": {
            "display_name": "Intent Classifier",
            "template": {
              "system_message": {
                "value": "Classify user intent: QUESTION, CODE_HELP, or GENERAL_CHAT"
              }
            }
          }
        }
      },
      {
        "id": "Router-multi003",
        "type": "ConditionalRouter",
        "data": {
          "node": {
            "display_name": "Route by Intent",
            "template": {
              "rules": [
                { "condition": "intent == 'QUESTION'", "route": "qa_agent" },
                { "condition": "intent == 'CODE_HELP'", "route": "code_agent" },
                { "condition": "intent == 'GENERAL_CHAT'", "route": "chat_agent" }
              ]
            }
          }
        }
      },
      {
        "id": "QAAgent-multi004",
        "type": "ConversationChain",
        "data": {
          "node": {
            "display_name": "Q&A Specialist",
            "template": {
              "llm": { "value": "gpt-4" },
              "system_message": { "value": "You are a Q&A expert." }
            }
          }
        }
      },
      {
        "id": "CodeAgent-multi005",
        "type": "ConversationChain",
        "data": {
          "node": {
            "display_name": "Code Assistant",
            "template": {
              "llm": { "value": "gpt-4" },
              "system_message": { "value": "You are a coding expert." }
            }
          }
        }
      },
      {
        "id": "ChatAgent-multi006",
        "type": "ConversationChain",
        "data": {
          "node": {
            "display_name": "General Chatbot",
            "template": {
              "llm": { "value": "gpt-3.5-turbo" }
            }
          }
        }
      },
      {
        "id": "Merger-multi007",
        "type": "MergeData",
        "data": {
          "node": {
            "display_name": "Merge Responses"
          }
        }
      },
      {
        "id": "Output-multi008",
        "type": "ChatOutput",
        "data": {
          "node": {
            "display_name": "Final Response"
          }
        }
      }
    ],
    "edges": [
      { "source": "Input-multi001", "target": "Classifier-multi002" },
      { "source": "Classifier-multi002", "target": "Router-multi003" },
      { "source": "Router-multi003", "target": "QAAgent-multi004", "sourceHandle": "qa_agent" },
      { "source": "Router-multi003", "target": "CodeAgent-multi005", "sourceHandle": "code_agent" },
      { "source": "Router-multi003", "target": "ChatAgent-multi006", "sourceHandle": "chat_agent" },
      { "source": "QAAgent-multi004", "target": "Merger-multi007" },
      { "source": "CodeAgent-multi005", "target": "Merger-multi007" },
      { "source": "ChatAgent-multi006", "target": "Merger-multi007" },
      { "source": "Merger-multi007", "target": "Output-multi008" }
    ]
  },
  "name": "Multi-Agent Router",
  "description": "Intelligent routing to specialized agents"
}
```

#### OSSA YAML Manifest

```yaml
apiVersion: ossa/v1
kind: Agent
metadata:
  name: multi-agent-router
  version: 1.0.0
  description: "Multi-agent system with intelligent routing - migrated from Langflow"
  labels:
    migration_source: langflow
    pattern: multi-agent-orchestration
    routing: intent-based

spec:
  role: orchestration

  # Capabilities
  capabilities:
    - name: classify_intent
      description: "Classify user intent for routing"
      input_schema:
        type: object
        required: ["message"]
        properties:
          message:
            type: string
      output_schema:
        type: object
        required: ["intent", "confidence"]
        properties:
          intent:
            type: string
            enum: ["QUESTION", "CODE_HELP", "GENERAL_CHAT"]
          confidence:
            type: number
            minimum: 0
            maximum: 1

    - name: route_to_specialist
      description: "Route to appropriate specialist agent"
      input_schema:
        type: object
        required: ["intent", "message"]
        properties:
          intent:
            type: string
          message:
            type: string
      output_schema:
        type: object
        properties:
          agent_id:
            type: string
            description: "Selected specialist agent"

    - name: qa_specialist
      description: "Q&A expert agent"
      input_schema:
        type: object
        required: ["question"]
        properties:
          question:
            type: string
      output_schema:
        type: object
        properties:
          answer:
            type: string

    - name: code_specialist
      description: "Code assistant agent"
      input_schema:
        type: object
        required: ["code_query"]
        properties:
          code_query:
            type: string
      output_schema:
        type: object
        properties:
          code_response:
            type: string
            description: "Code help with examples"

    - name: chat_specialist
      description: "General conversation agent"
      input_schema:
        type: object
        required: ["message"]
        properties:
          message:
            type: string
      output_schema:
        type: object
        properties:
          chat_response:
            type: string

  # Sub-agents (specialist agents)
  agents:
    - id: qa-specialist-agent
      name: Q&A Specialist
      role: workflow
      llm:
        provider: openai
        model: gpt-4
        temperature: 0.2
        systemMessage: "You are a Q&A expert. Provide accurate, detailed answers."

    - id: code-specialist-agent
      name: Code Assistant
      role: workflow
      llm:
        provider: openai
        model: gpt-4
        temperature: 0.1
        systemMessage: "You are a coding expert. Provide code examples and explanations."

    - id: chat-specialist-agent
      name: General Chatbot
      role: workflow
      llm:
        provider: openai
        model: gpt-3.5-turbo
        temperature: 0.7
        systemMessage: "You are a friendly general chatbot."

  # Runtime
  runtime:
    type: kubernetes
    image: ossa/multi-agent-router:1.0.0
    replicas: 2
    resources:
      cpu: 1000m
      memory: 1Gi

  # Integration
  integration:
    protocol: http
    endpoints:
      base_url: http://localhost:3000
      execute: /api/v1/route

  # Monitoring
  monitoring:
    traces: true
    metrics: true
    logs: true
    custom_metrics:
      - name: intent_classification_accuracy
        type: gauge
      - name: routing_decisions
        type: counter
        labels: ["intent", "agent"]
      - name: specialist_response_time_ms
        type: histogram
        labels: ["agent"]
```

#### Implementation Code

```typescript
// src/index.ts
import { OSSAAgent, OrchestratorAgent } from '@ossa/agent-sdk';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Main orchestrator agent
const orchestrator = new OrchestratorAgent({
  manifestPath: './multi-agent-router.yaml',
});

// Capability: classify_intent
orchestrator.registerCapability('classify_intent', async (input) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Classify user intent. Respond ONLY with JSON: {"intent": "QUESTION"|"CODE_HELP"|"GENERAL_CHAT", "confidence": 0.0-1.0}',
      },
      { role: 'user', content: input.message },
    ],
    temperature: 0.1,
  });

  const result = JSON.parse(completion.choices[0].message.content);
  return result;
});

// Capability: route_to_specialist
orchestrator.registerCapability('route_to_specialist', async (input) => {
  const routingMap = {
    QUESTION: 'qa-specialist-agent',
    CODE_HELP: 'code-specialist-agent',
    GENERAL_CHAT: 'chat-specialist-agent',
  };

  return { agent_id: routingMap[input.intent] || 'chat-specialist-agent' };
});

// Specialist Agents
const qaAgent = new OSSAAgent({
  id: 'qa-specialist-agent',
  name: 'Q&A Specialist',
});

qaAgent.registerCapability('qa_specialist', async (input) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a Q&A expert. Provide accurate, detailed answers.',
      },
      { role: 'user', content: input.question },
    ],
    temperature: 0.2,
  });

  return { answer: completion.choices[0].message.content };
});

const codeAgent = new OSSAAgent({
  id: 'code-specialist-agent',
  name: 'Code Assistant',
});

codeAgent.registerCapability('code_specialist', async (input) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a coding expert. Provide code examples and explanations.',
      },
      { role: 'user', content: input.code_query },
    ],
    temperature: 0.1,
  });

  return { code_response: completion.choices[0].message.content };
});

const chatAgent = new OSSAAgent({
  id: 'chat-specialist-agent',
  name: 'General Chatbot',
});

chatAgent.registerCapability('chat_specialist', async (input) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a friendly general chatbot.',
      },
      { role: 'user', content: input.message },
    ],
    temperature: 0.7,
  });

  return { chat_response: completion.choices[0].message.content };
});

// Register specialist agents with orchestrator
orchestrator.registerAgent(qaAgent);
orchestrator.registerAgent(codeAgent);
orchestrator.registerAgent(chatAgent);

// Orchestration workflow
orchestrator.defineWorkflow('intelligent_routing', async (input) => {
  // Step 1: Classify intent
  const { intent, confidence } = await orchestrator.execute('classify_intent', {
    message: input.message,
  });

  // Step 2: Route to specialist
  const { agent_id } = await orchestrator.execute('route_to_specialist', {
    intent,
    message: input.message,
  });

  // Step 3: Execute on specialist agent
  let response;
  switch (agent_id) {
    case 'qa-specialist-agent':
      const qaResult = await orchestrator.delegateTo(agent_id, 'qa_specialist', {
        question: input.message,
      });
      response = qaResult.answer;
      break;

    case 'code-specialist-agent':
      const codeResult = await orchestrator.delegateTo(agent_id, 'code_specialist', {
        code_query: input.message,
      });
      response = codeResult.code_response;
      break;

    case 'chat-specialist-agent':
      const chatResult = await orchestrator.delegateTo(agent_id, 'chat_specialist', {
        message: input.message,
      });
      response = chatResult.chat_response;
      break;
  }

  return {
    response,
    metadata: {
      intent,
      confidence,
      routed_to: agent_id,
      timestamp: new Date().toISOString(),
    },
  };
});

orchestrator.start();
```

---

## Advanced Patterns

### Pattern 1: Memory/State Management

**Langflow**: `ConversationBufferMemory` node

**OSSA**: Context management capability

```yaml
capabilities:
  - name: manage_conversation_context
    description: "Manage conversation history and context"
    input_schema:
      type: object
      properties:
        session_id:
          type: string
        message:
          type: string
        action:
          type: string
          enum: ["add", "retrieve", "clear"]
    output_schema:
      type: object
      properties:
        context:
          type: array
          items:
            type: object
            properties:
              role:
                type: string
              content:
                type: string
              timestamp:
                type: string

configuration:
  context_management:
    backend: redis
    max_history: 10
    ttl_seconds: 3600
    compression: true
```

### Pattern 2: Parallel Processing

**Langflow**: Multiple parallel edge branches

**OSSA**: Parallel execution in workflow

```typescript
// Parallel execution
orchestrator.defineWorkflow('parallel_processing', async (input) => {
  // Execute multiple capabilities in parallel
  const [result1, result2, result3] = await Promise.all([
    orchestrator.execute('process_option_a', input),
    orchestrator.execute('process_option_b', input),
    orchestrator.execute('process_option_c', input),
  ]);

  // Merge results
  return {
    combined: [result1, result2, result3],
    best_result: selectBestResult([result1, result2, result3]),
  };
});
```

### Pattern 3: Error Handling & Retry

**Langflow**: Limited error handling

**OSSA**: Built-in retry policies and error handling

```yaml
policies:
  retry:
    max_attempts: 3
    backoff_strategy: exponential
    backoff_multiplier: 2
    initial_delay_ms: 1000
    max_delay_ms: 10000
    retry_on:
      - network_error
      - timeout
      - rate_limit

  circuit_breaker:
    enabled: true
    failure_threshold: 5
    recovery_timeout_ms: 30000

  fallback:
    enabled: true
    fallback_agent: backup-agent
    conditions:
      - primary_agent_unavailable
      - response_time_exceeded
```

---

## Testing & Validation

### Pre-Migration Testing Checklist

```bash
# 1. Export Langflow flow
# Download flow.json from Langflow UI

# 2. Validate JSON structure
jq '.' flow.json > /dev/null && echo "Valid JSON" || echo "Invalid JSON"

# 3. Document flow behavior
# Test in Langflow UI and record:
# - Input examples
# - Expected outputs
# - Edge cases
# - Error scenarios

# 4. Identify external dependencies
jq '.data.nodes[] | select(.data.node.template.api_key != null) | .data.node.display_name' flow.json
```

### Post-Migration Testing

```bash
# 1. Validate OSSA manifest
buildkit agents validate ./migrated-agent.yaml

# 2. Test individual capabilities
buildkit agents test \
  --name migrated-agent \
  --capability format_prompt \
  --input '{"user_input": "test message"}' \
  --expect-output '{"formatted_prompt": ".*test message.*"}'

# 3. Integration test
buildkit agents deploy --name migrated-agent --env test

# Test HTTP endpoint
curl -X POST http://localhost:3000/api/v1/execute \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "process_conversation",
    "input": {"message": "Hello world"},
    "context": {"session_id": "test-123"}
  }'

# 4. Load testing
npx autocannon -c 10 -d 30 http://localhost:3000/api/v1/execute \
  -m POST \
  -H "Content-Type: application/json" \
  -b '{"operation":"process_conversation","input":{"message":"test"}}'

# 5. Compare outputs
# Run same inputs through Langflow and OSSA
# Compare outputs for consistency
```

### Regression Test Suite

```typescript
// tests/migration-regression.test.ts
import { describe, test, expect } from 'vitest';
import { OSSAAgent } from '@ossa/agent-sdk';

describe('Migration Regression Tests', () => {
  const agent = new OSSAAgent({ manifestPath: './migrated-agent.yaml' });

  test('should match Langflow output for simple query', async () => {
    const input = { message: 'What is the capital of France?' };

    const ossaResult = await agent.executeWorkflow('chat', input);

    // Compare with known Langflow output
    expect(ossaResult.output).toContain('Paris');
  });

  test('should handle edge case: empty input', async () => {
    const input = { message: '' };

    await expect(
      agent.executeWorkflow('chat', input)
    ).rejects.toThrow('Input validation failed');
  });

  test('should preserve response quality', async () => {
    const input = { message: 'Explain quantum computing' };

    const result = await agent.executeWorkflow('chat', input);

    // Quality checks
    expect(result.output.length).toBeGreaterThan(100);
    expect(result.output).toMatch(/quantum|qubit|superposition/i);
  });
});
```

---

## Best Practices

### 1. Incremental Migration

Migrate flows incrementally rather than all at once:

```bash
# Phase 1: Migrate simple flows (1-5 nodes)
# Phase 2: Migrate medium flows (6-15 nodes)
# Phase 3: Migrate complex flows (16+ nodes)
# Phase 4: Integrate all migrated agents
```

### 2. Preserve Original Flows

Keep Langflow flows as reference:

```bash
# Create migration archive
mkdir -p ./migration-archive/langflow-exports
cp *.json ./migration-archive/langflow-exports/
git add ./migration-archive
git commit -m "Archive original Langflow flows for reference"
```

### 3. Documentation

Document migration decisions:

```yaml
# In agent manifest
metadata:
  annotations:
    migration.source: "langflow"
    migration.original_flow: "chatbot-v1.json"
    migration.date: "2025-11-10"
    migration.notes: |
      - Converted PromptTemplate node to format_prompt capability
      - Replaced ConversationBufferMemory with Redis-backed context management
      - Added retry policy for OpenAI API calls
      - Enhanced error handling with circuit breaker
```

### 4. Type Safety

Leverage OSSA's JSON Schema validation:

```yaml
capabilities:
  - name: process_data
    input_schema:
      type: object
      required: ["data", "format"]
      properties:
        data:
          type: string
          minLength: 1
          maxLength: 10000
        format:
          type: string
          enum: ["json", "xml", "yaml"]
        options:
          type: object
          additionalProperties: false
          properties:
            pretty:
              type: boolean
              default: false
    output_schema:
      type: object
      required: ["processed_data", "metadata"]
      properties:
        processed_data:
          type: string
        metadata:
          type: object
          required: ["processing_time_ms", "format"]
```

### 5. Monitoring & Observability

Add comprehensive monitoring:

```yaml
monitoring:
  traces: true
  metrics: true
  logs: true

  custom_metrics:
    - name: langflow_compatibility_score
      type: gauge
      description: "Compatibility with original Langflow flow behavior"

    - name: migration_regression_errors
      type: counter
      description: "Regression errors vs. original flow"

  alerts:
    - type: regression_detected
      condition: "migration_regression_errors > 0"
      action: notify
      channels: ["slack", "pagerduty"]

    - type: performance_degradation
      condition: "avg_response_time > langflow_baseline * 1.5"
      action: notify
```

### 6. Version Control Strategy

```bash
# Create migration branch
git checkout -b migration/langflow-to-ossa

# Commit structure
git add .agents/migrated-agent/
git commit -m "feat: migrate chatbot flow from Langflow to OSSA

- Convert 4 nodes to OSSA capabilities
- Add JSON Schema validation
- Implement error handling and retries
- Add comprehensive monitoring

Migration notes:
- Source: langflow-chatbot-v1.json
- All regression tests passing
- Performance within 5% of original"
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Missing Langflow Component Equivalent

**Problem**: Langflow component has no direct OSSA equivalent

**Solution**: Create custom capability

```typescript
// Example: Custom Langflow component
agent.registerCapability('custom_langflow_component', async (input) => {
  // Replicate Langflow component logic
  const result = await customLogic(input);
  return result;
});
```

#### Issue 2: Complex Edge Routing

**Problem**: Langflow has complex conditional edges

**Solution**: Implement workflow logic with conditionals

```typescript
orchestrator.defineWorkflow('complex_routing', async (input) => {
  const step1 = await orchestrator.execute('initial_process', input);

  // Conditional routing
  if (step1.condition === 'A') {
    return await orchestrator.execute('route_a', step1);
  } else if (step1.condition === 'B') {
    return await orchestrator.execute('route_b', step1);
  } else {
    return await orchestrator.execute('default_route', step1);
  }
});
```

#### Issue 3: State Management Differences

**Problem**: Langflow memory components work differently

**Solution**: Implement external state store

```yaml
configuration:
  state_management:
    backend: redis
    redis_url: redis://localhost:6379
    key_prefix: "agent:state:"
    ttl: 3600
```

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

agent.registerCapability('manage_state', async (input) => {
  const key = `agent:state:${input.session_id}`;

  if (input.action === 'save') {
    await redis.setex(key, 3600, JSON.stringify(input.state));
  } else if (input.action === 'retrieve') {
    const state = await redis.get(key);
    return { state: state ? JSON.parse(state) : null };
  }
});
```

#### Issue 4: Performance Degradation

**Problem**: OSSA agent slower than Langflow

**Solution**: Optimize capability execution and add caching

```yaml
configuration:
  caching:
    enabled: true
    backend: redis
    ttl_seconds: 300
    cache_key_strategy: input_hash

  performance:
    enable_parallel_execution: true
    max_concurrent_capabilities: 5
    timeout_ms: 5000
```

#### Issue 5: API Key Management

**Problem**: Langflow's API key handling differs

**Solution**: Use OSSA environment variables and secret management

```yaml
runtime:
  environment:
    OPENAI_API_KEY: ${OPENAI_API_KEY}
    QDRANT_API_KEY: ${QDRANT_API_KEY}

  secrets:
    - name: api-keys
      type: kubernetes-secret
      mount_path: /secrets
```

---

## Migration Automation Tools

### Langflow-to-OSSA CLI Tool

```bash
# Install migration tool
npm install -g @ossa/langflow-migrator

# Analyze Langflow flow
ossa-migrate analyze langflow-flow.json

# Output:
# Flow Complexity: Medium (7 nodes, 6 edges)
# Estimated Migration Time: 2-3 hours
# Components:
#   - ChatInput (1) → accept_user_input capability
#   - PromptTemplate (1) → format_prompt capability
#   - OpenAI (1) → llm_generation capability
#   - VectorStore (1) → vector_storage capability
#   - Retriever (1) → semantic_search capability
#   - ConversationMemory (1) → context_management capability
#   - ChatOutput (1) → return_response capability

# Generate OSSA manifest
ossa-migrate convert langflow-flow.json \
  --output ./agents/migrated-agent.yaml \
  --generate-code \
  --add-tests

# Output:
# ✓ Generated OSSA manifest: ./agents/migrated-agent.yaml
# ✓ Generated TypeScript implementation: ./agents/migrated-agent/src/index.ts
# ✓ Generated test suite: ./agents/migrated-agent/tests/
# ✓ Generated documentation: ./agents/migrated-agent/README.md

# Validate migration
ossa-migrate validate \
  --langflow langflow-flow.json \
  --ossa ./agents/migrated-agent.yaml \
  --test-inputs test-cases.json
```

---

## Additional Resources

### Documentation

- **OSSA Specification**: https://gitlab.bluefly.io/llm/ossa/-/wikis/home
- **OSSA Quick Reference**: [OSSA-QUICK-REFERENCE.md](../OSSA-QUICK-REFERENCE.md)
- **BuildKit CLI**: https://gitlab.bluefly.io/llm/documentation/-/wikis/BuildKit-CLI-Reference
- **Langflow Documentation**: https://docs.langflow.org/

### Example Repositories

- **OSSA Agent Examples**: `.agents/` directory in agent-buildkit
- **Migration Examples**: `examples/migrations/langflow/`

### Community & Support

- **GitLab Issues**: https://gitlab.bluefly.io/llm/documentation/-/issues
- **Migration Support**: Tag issues with `migration::langflow`

---

**Version:** 1.0
**Last Updated:** 2025-11-10
**Maintained By:** OSSA Team
**License:** MIT

**Feedback**: Please report issues or suggestions at https://gitlab.bluefly.io/llm/documentation/-/issues/new?issue[title]=Langflow%20Migration%20Guide%20Feedback
