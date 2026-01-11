# Discovery API

The Discovery API enables intelligent search and filtering of agents based on capabilities, taxonomies, metadata, and runtime characteristics.

## Overview

Discovery goes beyond simple listing by providing:

- **Capability-based search** - Find agents by what they can do
- **Taxonomy filtering** - Filter by domain, category, and industry taxonomies
- **Semantic search** - Natural language queries to find relevant agents
- **Advanced filtering** - Complex queries with multiple criteria
- **Federated discovery** - Search across multiple registries

## Endpoints

### Search Agents

Perform advanced agent discovery with multiple filter criteria.

```http
GET /discovery/search
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (supports natural language) |
| `capability` | string | Filter by capability (can specify multiple) |
| `taxonomy` | string | Filter by taxonomy path |
| `provider` | string | Filter by LLM provider |
| `min_version` | string | Minimum agent version (semantic versioning) |
| `status` | string | Filter by status (`active`, `deprecated`) |
| `labels` | string | Filter by labels (format: `key=value`) |
| `sort` | string | Sort field (`relevance`, `created_at`, `name`) |
| `order` | string | Sort order (`asc`, `desc`) |
| `limit` | integer | Results per page (default: 50, max: 100) |
| `offset` | integer | Pagination offset |

**Example Request:**

```bash
curl "https://api.llm.bluefly.io/ossa/v1/discovery/search?q=document+analysis&capability=text-extraction&provider=anthropic" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "results": [
    {
      "id": "agt_doc123",
      "name": "document-analyzer",
      "version": "2.1.0",
      "relevance_score": 0.95,
      "description": "Advanced document analysis with OCR and entity extraction",
      "capabilities": [
        "text-extraction",
        "entity-recognition",
        "document-classification"
      ],
      "taxonomy": {
        "domain": "document-processing",
        "category": "analysis",
        "industry": "legal"
      },
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "metadata": {
        "language": ["en", "es", "fr"],
        "supported_formats": ["pdf", "docx", "txt"]
      }
    }
  ],
  "total": 15,
  "query": {
    "q": "document analysis",
    "capability": "text-extraction",
    "provider": "anthropic"
  },
  "facets": {
    "capabilities": {
      "text-extraction": 15,
      "entity-recognition": 12,
      "sentiment-analysis": 8
    },
    "providers": {
      "anthropic": 15,
      "openai": 23,
      "azure": 8
    }
  }
}
```

**JavaScript/TypeScript:**

```typescript
interface DiscoveryParams {
  q?: string;
  capability?: string[];
  provider?: string;
  labels?: Record<string, string>;
}

async function discoverAgents(params: DiscoveryParams) {
  const queryParams = new URLSearchParams();

  if (params.q) queryParams.set('q', params.q);
  if (params.capability) {
    params.capability.forEach(cap => queryParams.append('capability', cap));
  }
  if (params.provider) queryParams.set('provider', params.provider);
  if (params.labels) {
    Object.entries(params.labels).forEach(([key, value]) => {
      queryParams.append('labels', `${key}=${value}`);
    });
  }

  const response = await fetch(
    `https://api.llm.bluefly.io/ossa/v1/discovery/search?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
}

// Usage
const results = await discoverAgents({
  q: 'document analysis',
  capability: ['text-extraction', 'entity-recognition'],
  provider: 'anthropic',
  labels: { environment: 'production' }
});

console.log(`Found ${results.total} matching agents`);
```

**Python:**

```python
import requests
from typing import List, Dict, Optional

def discover_agents(
    q: Optional[str] = None,
    capability: Optional[List[str]] = None,
    provider: Optional[str] = None,
    labels: Optional[Dict[str, str]] = None
):
    params = {}

    if q:
        params['q'] = q
    if capability:
        params['capability'] = capability
    if provider:
        params['provider'] = provider
    if labels:
        params['labels'] = [f"{k}={v}" for k, v in labels.items()]

    response = requests.get(
        'https://api.llm.bluefly.io/ossa/v1/discovery/search',
        params=params,
        headers={'Authorization': f'Bearer {token}'}
    )

    return response.json()

# Usage
results = discover_agents(
    q='document analysis',
    capability=['text-extraction', 'entity-recognition'],
    provider='anthropic',
    labels={'environment': 'production'}
)

print(f"Found {results['total']} matching agents")
```

---

### List Capabilities

Get a catalog of all available capabilities across registered agents.

```http
GET /discovery/capabilities
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by capability category |
| `search` | string | Search capability names and descriptions |

**Example Request:**

```bash
curl https://api.llm.bluefly.io/ossa/v1/discovery/capabilities \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "capabilities": [
    {
      "name": "text-generation",
      "category": "content-creation",
      "description": "Generate human-like text content",
      "agent_count": 47,
      "input_schema": {
        "type": "object",
        "properties": {
          "prompt": { "type": "string" },
          "max_tokens": { "type": "integer" }
        }
      },
      "output_schema": {
        "type": "object",
        "properties": {
          "text": { "type": "string" },
          "tokens_used": { "type": "integer" }
        }
      }
    },
    {
      "name": "document-analysis",
      "category": "document-processing",
      "description": "Analyze and extract information from documents",
      "agent_count": 23,
      "supported_formats": ["pdf", "docx", "txt", "html"]
    }
  ],
  "total": 156,
  "categories": [
    "content-creation",
    "document-processing",
    "data-analysis",
    "code-generation",
    "translation"
  ]
}
```

---

### List Taxonomies

Get the complete taxonomy hierarchy for agent categorization.

```http
GET /specification/taxonomies
```

**Example Request:**

```bash
curl https://api.llm.bluefly.io/ossa/v1/specification/taxonomies \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "taxonomies": {
    "domain": {
      "document-processing": {
        "description": "Document analysis and processing",
        "subcategories": [
          "analysis",
          "conversion",
          "extraction",
          "generation"
        ]
      },
      "data-analysis": {
        "description": "Data processing and analytics",
        "subcategories": [
          "statistical",
          "machine-learning",
          "visualization"
        ]
      }
    },
    "industry": {
      "legal": {
        "description": "Legal and compliance domain",
        "use_cases": [
          "contract-analysis",
          "compliance-auditing",
          "legal-research"
        ]
      },
      "healthcare": {
        "description": "Healthcare and medical domain",
        "use_cases": [
          "patient-records",
          "medical-imaging",
          "clinical-decision-support"
        ]
      }
    }
  }
}
```

---

### Find Similar Agents

Discover agents similar to a given agent based on capabilities and characteristics.

```http
GET /discovery/similar/{agentId}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | string | Reference agent ID |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Number of similar agents to return (default: 10) |
| `min_similarity` | float | Minimum similarity score (0.0-1.0, default: 0.5) |

**Example Request:**

```bash
curl "https://api.llm.bluefly.io/ossa/v1/discovery/similar/agt_doc123?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**

```json
{
  "reference_agent": {
    "id": "agt_doc123",
    "name": "document-analyzer",
    "capabilities": ["text-extraction", "entity-recognition"]
  },
  "similar_agents": [
    {
      "id": "agt_doc456",
      "name": "pdf-processor",
      "similarity_score": 0.89,
      "matching_capabilities": ["text-extraction", "entity-recognition"],
      "additional_capabilities": ["ocr", "table-extraction"]
    },
    {
      "id": "agt_doc789",
      "name": "contract-analyzer",
      "similarity_score": 0.76,
      "matching_capabilities": ["text-extraction"],
      "taxonomy_match": "legal"
    }
  ]
}
```

---

### Recommend Agents

Get agent recommendations based on use case description or requirements.

```http
POST /discovery/recommend
```

**Request Body:**

```json
{
  "use_case": "I need to analyze legal contracts and extract key terms",
  "requirements": {
    "capabilities": ["text-extraction", "entity-recognition"],
    "max_latency_ms": 5000,
    "min_accuracy": 0.95,
    "budget_per_1k_tokens": 0.05
  },
  "preferences": {
    "provider": "anthropic",
    "language": ["en", "es"]
  }
}
```

**Example Request:**

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/discovery/recommend \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "use_case": "analyze legal contracts and extract key terms",
    "requirements": {
      "capabilities": ["text-extraction", "entity-recognition"]
    }
  }'
```

**Example Response:**

```json
{
  "recommendations": [
    {
      "agent": {
        "id": "agt_legal123",
        "name": "contract-analyzer",
        "version": "3.2.0"
      },
      "score": 0.94,
      "reasoning": "Specialized in legal contract analysis with high accuracy",
      "pros": [
        "Optimized for legal domain",
        "Supports multi-language contracts",
        "High entity recognition accuracy (98%)"
      ],
      "cons": [
        "Higher cost per token than general-purpose agents"
      ],
      "estimated_cost_per_1k_tokens": 0.045,
      "average_latency_ms": 2100
    },
    {
      "agent": {
        "id": "agt_doc456",
        "name": "document-intelligence",
        "version": "2.5.0"
      },
      "score": 0.87,
      "reasoning": "General-purpose document analysis with good legal performance",
      "pros": [
        "Lower cost",
        "Faster processing",
        "Supports more document formats"
      ],
      "cons": [
        "Slightly lower accuracy on complex legal terminology"
      ],
      "estimated_cost_per_1k_tokens": 0.025,
      "average_latency_ms": 1500
    }
  ],
  "query_understanding": {
    "detected_domain": "legal",
    "detected_capabilities": ["text-extraction", "entity-recognition", "contract-analysis"],
    "confidence": 0.91
  }
}
```

---

## Advanced Discovery Patterns

### Multi-Capability Search

Find agents that support multiple capabilities:

```bash
curl "https://api.llm.bluefly.io/ossa/v1/discovery/search?capability=text-extraction&capability=entity-recognition&capability=sentiment-analysis" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

```typescript
// TypeScript
const agents = await discoverAgents({
  capability: [
    'text-extraction',
    'entity-recognition',
    'sentiment-analysis'
  ]
});
```

### Label-Based Filtering

Filter by multiple labels:

```bash
curl "https://api.llm.bluefly.io/ossa/v1/discovery/search?labels=environment=production&labels=team=data-science&labels=compliance=soc2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

```python
# Python
agents = discover_agents(
    labels={
        'environment': 'production',
        'team': 'data-science',
        'compliance': 'soc2'
    }
)
```

### Semantic Search

Use natural language queries:

```bash
curl "https://api.llm.bluefly.io/ossa/v1/discovery/search?q=analyze+customer+feedback+and+detect+sentiment+in+multiple+languages" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Version Range Filtering

Find agents within a version range:

```bash
curl "https://api.llm.bluefly.io/ossa/v1/discovery/search?min_version=2.0.0&max_version=3.0.0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Federated Discovery

Search across multiple OSSA registries simultaneously.

```http
POST /discovery/federated
```

**Request Body:**

```json
{
  "registries": [
    "https://registry1.example.com",
    "https://registry2.example.com"
  ],
  "query": {
    "capability": "text-generation",
    "provider": "anthropic"
  },
  "merge_strategy": "best_match"
}
```

**Example Response:**

```json
{
  "results": [
    {
      "agent": {
        "id": "agt_abc123",
        "name": "content-generator"
      },
      "registry": "https://registry1.example.com",
      "relevance_score": 0.95
    },
    {
      "agent": {
        "id": "agt_xyz789",
        "name": "text-composer"
      },
      "registry": "https://registry2.example.com",
      "relevance_score": 0.89
    }
  ],
  "registries_searched": 2,
  "total_results": 47,
  "search_time_ms": 234
}
```

---

## Discovery SDK

### JavaScript/TypeScript SDK

```typescript
import { OSSADiscovery } from '@bluefly/ossa-sdk';

const discovery = new OSSADiscovery({
  apiKey: process.env.OSSA_API_KEY
});

// Search by capability
const agents = await discovery.search({
  capability: ['text-generation', 'translation'],
  provider: 'anthropic'
});

// Get recommendations
const recommendations = await discovery.recommend({
  useCase: 'Translate customer support tickets',
  requirements: {
    capabilities: ['translation'],
    languages: ['en', 'es', 'fr']
  }
});

// Find similar agents
const similar = await discovery.findSimilar('agt_doc123', {
  limit: 5,
  minSimilarity: 0.7
});
```

### Python SDK

```python
from ossa import Discovery

discovery = Discovery(api_key=os.getenv('OSSA_API_KEY'))

# Search by capability
agents = discovery.search(
    capability=['text-generation', 'translation'],
    provider='anthropic'
)

# Get recommendations
recommendations = discovery.recommend(
    use_case='Translate customer support tickets',
    requirements={
        'capabilities': ['translation'],
        'languages': ['en', 'es', 'fr']
    }
)

# Find similar agents
similar = discovery.find_similar(
    'agt_doc123',
    limit=5,
    min_similarity=0.7
)
```

---

## Best Practices

### Use Semantic Search First

Start with natural language queries:

```typescript
// ✅ Good: Natural language describes intent
const agents = await discovery.search({
  q: 'analyze legal contracts for compliance violations'
});

// ❌ Less effective: Too specific, might miss relevant agents
const agents = await discovery.search({
  capability: 'contract-analysis',
  taxonomy: 'legal/compliance'
});
```

### Cache Discovery Results

Implement caching for frequently used searches:

```typescript
import { Cache } from '@bluefly/ossa-sdk';

const cache = new Cache({ ttl: 3600 }); // 1 hour TTL

async function getCachedAgents(capability: string) {
  const cacheKey = `agents:${capability}`;
  let agents = await cache.get(cacheKey);

  if (!agents) {
    agents = await discovery.search({ capability });
    await cache.set(cacheKey, agents);
  }

  return agents;
}
```

### Use Facets for Progressive Refinement

Guide users through refinement using facets:

```typescript
// Initial search
const results = await discovery.search({ q: 'document analysis' });

// Show facets to user
console.log('Available providers:', results.facets.providers);
console.log('Available capabilities:', results.facets.capabilities);

// Refine based on user selection
const refined = await discovery.search({
  q: 'document analysis',
  provider: 'anthropic',
  capability: 'text-extraction'
});
```

---

## Next Steps

- Learn about [Agent-to-Agent Messaging](messaging.md) for coordinating discovered agents
- See [Agent Registry API](agents.md) for registering discoverable agents
- Review [Capability Development Guide](../guides/capability-development.md)
- Explore [API Examples](../api-reference/examples.md) for discovery patterns
