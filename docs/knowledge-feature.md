# OSSA Knowledge Command

Index and query agent knowledge bases with semantic search.

## Overview

The `ossa knowledge` command provides tools for managing agent knowledge bases:

- **Index**: Scan and index markdown/text files with semantic embeddings
- **Query**: Search indexed knowledge with semantic similarity

## Commands

### Index Knowledge Base

Index all markdown and text files in a directory:

```bash
ossa knowledge index <path> [options]
```

**Options:**
- `-a, --agent <name>` - Agent name for the knowledge base (default: directory name)
- `-o, --output <path>` - Output path for knowledge.json (default: `<path>/knowledge.json`)
- `--incremental` - Only reindex changed files (faster for updates)
- `--output-format <format>` - Output format: json or text (default: text)
- `-v, --verbose` - Show detailed information

**Examples:**

```bash
# Index agent knowledge directory
ossa knowledge index .agent/agents/my-agent/knowledge

# Index with custom agent name
ossa knowledge index ./docs --agent my-agent

# Incremental update (only changed files)
ossa knowledge index ./docs --incremental

# JSON output for automation
ossa knowledge index ./docs --output-format json
```

### Query Knowledge Base

Search indexed knowledge with semantic similarity:

```bash
ossa knowledge query <query> [options]
```

**Options:**
- `-i, --index <path>` - Path to knowledge.json index file
- `-k, --knowledge <path>` - Path to knowledge directory (looks for knowledge.json inside)
- `-l, --limit <number>` - Maximum results (default: 10)
- `-t, --threshold <number>` - Minimum similarity score 0-1 (default: 0.5)
- `--no-excerpts` - Don't include text excerpts
- `--output-format <format>` - Output format: json or text (default: text)
- `-v, --verbose` - Show full document content

**Examples:**

```bash
# Query knowledge base
ossa knowledge query "How do I deploy agents?" --knowledge ./docs

# Query with index path
ossa knowledge query "OSSA manifests" --index ./docs/knowledge.json

# Limit results and set threshold
ossa knowledge query "agents" --knowledge ./docs --limit 5 --threshold 0.7

# JSON output
ossa knowledge query "deployment" --knowledge ./docs --output-format json

# Verbose output with full content
ossa knowledge query "agents" --knowledge ./docs --verbose
```

## Knowledge Index Format

The `knowledge.json` file contains:

```json
{
  "version": "1.0.0",
  "agentName": "my-agent",
  "documents": [
    {
      "id": "abc123",
      "filePath": "/path/to/doc.md",
      "content": "Document content...",
      "embedding": [0.1, 0.2, ...],
      "metadata": {
        "fileName": "doc.md",
        "fileType": ".md",
        "size": 1234,
        "lastModified": "2026-01-29T...",
        "hash": "sha256hash"
      }
    }
  ],
  "metadata": {
    "totalDocuments": 10,
    "totalSize": 50000,
    "lastIndexed": "2026-01-29T...",
    "indexPath": "/path/to/knowledge.json"
  }
}
```

## Embedding Provider

The default implementation uses a simple hash-based embedding for demonstration. For production use, configure a proper embedding provider:

### Future: OpenAI Embeddings

```typescript
import { KnowledgeService } from '@bluefly/openstandardagents';
import OpenAI from 'openai';

class OpenAIEmbeddingProvider {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    // ... implementation
  }
}

const service = new KnowledgeService(new OpenAIEmbeddingProvider());
```

### Future: Qdrant Integration

For production deployments, integrate with Qdrant vector database:

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

// Store vectors in Qdrant for scalable search
```

## Use Cases

### 1. Agent Documentation

Index agent documentation for quick reference:

```bash
ossa knowledge index .agent/agents/my-agent/knowledge --agent my-agent
ossa knowledge query "How do I use this agent?" --knowledge .agent/agents/my-agent/knowledge
```

### 2. Project Knowledge Base

Index project documentation:

```bash
ossa knowledge index ./docs --agent project-docs
ossa knowledge query "API endpoints" --knowledge ./docs
```

### 3. CI/CD Integration

Automate knowledge base updates:

```yaml
# .gitlab-ci.yml
index-knowledge:
  script:
    - ossa knowledge index ./docs --incremental --output-format json
  artifacts:
    paths:
      - docs/knowledge.json
```

### 4. Agent Context Retrieval

Retrieve relevant context for LLM prompts:

```bash
# Get relevant docs for agent context
ossa knowledge query "deployment process" \
  --knowledge ./docs \
  --limit 3 \
  --threshold 0.7 \
  --output-format json | jq '.results[].content'
```

## Performance

- **Indexing**: ~100 documents/second (depends on embedding provider)
- **Incremental Updates**: Only reprocesses changed files (faster)
- **Query**: ~1000 documents/second (in-memory search)

## Architecture

### Service Layer

- `KnowledgeService`: Core indexing and querying logic
- `EmbeddingProvider`: Interface for embeddings (pluggable)
- `SimpleEmbeddingProvider`: Default hash-based implementation

### CLI Layer

- `knowledge.command.ts`: Command group
- `knowledge-index.command.ts`: Index command
- `knowledge-query.command.ts`: Query command

### Testing

- `tests/services/knowledge.service.test.ts`: Unit tests
- `tests/cli/knowledge.command.test.ts`: Integration tests

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run service tests
npm test tests/services/knowledge.service.test.ts

# Run CLI tests
npm test tests/cli/knowledge.command.test.ts
```

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

## Future Enhancements

1. **Advanced Embedding Providers**
   - OpenAI embeddings
   - Anthropic embeddings
   - Local models (sentence-transformers)

2. **Vector Database Integration**
   - Qdrant
   - Pinecone
   - Weaviate

3. **Advanced Features**
   - Multi-language support
   - PDF/DOCX parsing
   - Code snippet extraction
   - Auto-summarization

4. **Query Features**
   - Hybrid search (semantic + keyword)
   - Filters (date, type, tags)
   - Aggregations
   - Related documents

## References

- [OSSA Specification](https://openstandardagents.org)
- [Knowledge Graph Protocol](../spec/v0.3/protocols/)
- [Vector Embeddings Guide](https://openai.com/blog/embeddings)
