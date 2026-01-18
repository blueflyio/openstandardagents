# API Examples

Practical code examples for common OSSA API operations in multiple languages.

## Quick Examples

### Register an Agent

**curl:**
```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "ossa/v0.3.0",
    "kind": "Agent",
    "metadata": {
      "name": "my-agent",
      "version": "1.0.0"
    },
    "spec": {
      "role": "You are a helpful assistant",
      "llm": {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022"
      }
    }
  }'
```

**JavaScript/TypeScript:**
```typescript
import { OSSAClient } from '@bluefly/ossa-sdk';

const client = new OSSAClient({
  apiKey: process.env.OSSA_API_KEY
});

const agent = await client.registerAgent({
  apiVersion: 'ossa/v0.3.0',
  kind: 'Agent',
  metadata: {
    name: 'my-agent',
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

console.log(`Registered agent: ${agent.id}`);
```

**Python:**
```python
from ossa import Client

client = Client(api_key=os.getenv('OSSA_API_KEY'))

agent = client.register_agent({
    'apiVersion': 'ossa/v0.3.0',
    'kind': 'Agent',
    'metadata': {
        'name': 'my-agent',
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

print(f"Registered agent: {agent['id']}")
```

### Search for Agents

**curl:**
```bash
curl "https://api.llm.bluefly.io/ossa/v1/discovery/search?q=document+analysis&capability=text-extraction" \
  -H "Authorization: Bearer $TOKEN"
```

**JavaScript/TypeScript:**
```typescript
const results = await client.searchAgents({
  q: 'document analysis',
  capability: ['text-extraction']
});

results.forEach(agent => {
  console.log(`${agent.name} - Score: ${agent.relevance_score}`);
});
```

**Python:**
```python
results = client.search_agents(
    q='document analysis',
    capability=['text-extraction']
)

for agent in results:
    print(f"{agent['name']} - Score: {agent['relevance_score']}")
```

### Publish a Message

**curl:**
```bash
curl -X POST https://api.llm.bluefly.io/ossa/v1/messaging/channels/tasks.pending/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "task_id": "task-123",
      "action": "process_document"
    }
  }'
```

**JavaScript/TypeScript:**
```typescript
await client.messaging.publish('tasks.pending', {
  message: {
    task_id: 'task-123',
    action: 'process_document'
  }
});
```

**Python:**
```python
client.messaging.publish(
    channel='tasks.pending',
    message={
        'task_id': 'task-123',
        'action': 'process_document'
    }
)
```

## Complete Examples

See [Getting Started Guide](../guides/getting-started.md) for complete end-to-end examples.

## SDK Documentation

- [JavaScript/TypeScript SDK](https://www.npmjs.com/package/@bluefly/ossa-sdk)
- [Python SDK](https://pypi.org/project/ossa/)
