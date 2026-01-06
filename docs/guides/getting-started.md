# Getting Started with OSSA APIs

This guide will walk you through building your first OSSA integration from scratch.

## Prerequisites

- API credentials (API key or OAuth client)
- Basic understanding of REST APIs
- Node.js 18+ or Python 3.9+ (for SDK examples)

## Step 1: Authentication

First, get your API credentials:

1. Log in to the [OSSA Dashboard](https://dashboard.llm.bluefly.io)
2. Navigate to **Settings** → **API Keys**
3. Click **Generate New API Key**
4. Save your key securely

Set up authentication:

```bash
export OSSA_API_KEY=ossa_ak_your_key_here
```

## Step 2: Test Connection

Verify your API access:

```bash
curl https://api.llm.bluefly.io/ossa/v1/health \
  -H "X-API-Key: $OSSA_API_KEY"
```

Expected response:

```json
{
  "status": "healthy",
  "version": "0.3.0"
}
```

## Step 3: Create Your First Agent

Create an agent manifest file `my-agent.json`:

```json
{
  "apiVersion": "ossa/v0.3.0",
  "kind": "Agent",
  "metadata": {
    "name": "my-first-agent",
    "version": "1.0.0",
    "description": "My first OSSA agent"
  },
  "spec": {
    "role": "You are a helpful assistant that summarizes text.",
    "llm": {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.7
    },
    "safety": {
      "content_filtering": {
        "block_pii": true
      },
      "rate_limiting": {
        "requests_per_minute": 60
      }
    }
  }
}
```

Validate the manifest:

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/specification/validate \
  -H "X-API-Key: $OSSA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @my-agent.json
```

Register the agent:

```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/agents \
  -H "X-API-Key: $OSSA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @my-agent.json
```

## Step 4: Discover Agents

Search for your agent:

```bash
curl "https://api.llm.bluefly.io/ossa/v1/agents?search=my-first-agent" \
  -H "X-API-Key: $OSSA_API_KEY"
```

## Step 5: Using the SDK

Install the SDK:

**JavaScript/TypeScript:**
```bash
npm install @bluefly/ossa-sdk
```

**Python:**
```bash
pip install ossa
```

Complete example:

**JavaScript/TypeScript:**
```typescript
import { OSSAClient } from '@bluefly/ossa-sdk';

const client = new OSSAClient({
  apiKey: process.env.OSSA_API_KEY
});

// Register agent
const agent = await client.registerAgent({
  apiVersion: 'ossa/v0.3.0',
  kind: 'Agent',
  metadata: {
    name: 'my-first-agent',
    version: '1.0.0'
  },
  spec: {
    role: 'You are a helpful assistant',
    llm: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022'
    }
  }
});

console.log(`Agent registered: ${agent.id}`);

// Search agents
const results = await client.searchAgents({
  q: 'helpful assistant'
});

console.log(`Found ${results.length} agents`);
```

**Python:**
```python
from ossa import Client

client = Client(api_key=os.getenv('OSSA_API_KEY'))

# Register agent
agent = client.register_agent({
    'apiVersion': 'ossa/v0.3.0',
    'kind': 'Agent',
    'metadata': {
        'name': 'my-first-agent',
        'version': '1.0.0'
    },
    'spec': {
        'role': 'You are a helpful assistant',
        'llm': {
            'provider': 'anthropic',
            'model': 'claude-3-5-sonnet-20241022'
        }
    }
})

print(f"Agent registered: {agent['id']}")

# Search agents
results = client.search_agents(q='helpful assistant')
print(f"Found {len(results)} agents")
```

## Next Steps

- Learn about [Agent Lifecycle Management](agent-lifecycle.md)
- Explore [Capability Development](capability-development.md)
- Review [API Examples](../api-reference/examples.md)
- Check out [Advanced Patterns](../openapi/messaging.md)

## Troubleshooting

See [Error Codes](../api-reference/errors.md) for common issues and solutions.
