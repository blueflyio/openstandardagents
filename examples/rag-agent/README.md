# RAG Agent Reference Implementation

This example demonstrates a Retrieval-Augmented Generation (RAG) agent using the `@ossa/runtime` SDK.

## Overview

The RAG agent combines semantic search with document retrieval to answer questions based on indexed knowledge. It demonstrates:

- Loading an agent from an OSSA manifest
- Registering multiple capabilities with handlers
- Using vector search for document retrieval
- Generating answers using retrieved context

## Capabilities

### 1. `search`
Search documents using semantic search.

**Input:**
```json
{
  "query": "string",
  "limit": 5
}
```

**Output:**
```json
{
  "results": [
    {
      "id": "doc1",
      "content": "...",
      "score": 0.95,
      "metadata": {}
    }
  ]
}
```

### 2. `answer`
Answer questions using the RAG pattern.

**Input:**
```json
{
  "question": "What is OSSA?",
  "context_limit": 3
}
```

**Output:**
```json
{
  "answer": "OSSA is...",
  "sources": [
    {
      "id": "doc1",
      "content": "...",
      "score": 0.95
    }
  ]
}
```

### 3. `index`
Index new documents into the vector store.

**Input:**
```json
{
  "documents": [
    {
      "id": "doc5",
      "content": "...",
      "metadata": {}
    }
  ]
}
```

**Output:**
```json
{
  "indexed": 1
}
```

## Usage

```typescript
import { createRagAgent } from './index.js';

// Create agent
const agent = await createRagAgent();

// Search documents
const result = await agent.execute('search', {
  query: 'OSSA runtime',
  limit: 5
});

// Answer question
const answer = await agent.execute('answer', {
  question: 'What is OSSA?'
});
```

## Running the Example

```bash
cd examples/rag-agent
npm install
npm run build
node dist/index.js
```

## Architecture

```
RAG Agent
├── Vector Store (semantic search)
├── Embeddings Service (text → vectors)
└── LLM (answer generation)
```

## Production Considerations

This is a reference implementation. For production use:

1. **Replace MockVectorStore** with a real vector database (Qdrant, Pinecone, Weaviate)
2. **Add embeddings service** for generating vectors from text
3. **Integrate LLM** for actual answer generation
4. **Add caching** for frequently accessed documents
5. **Implement error handling** and retry logic
6. **Add observability** (metrics, tracing, logging)
