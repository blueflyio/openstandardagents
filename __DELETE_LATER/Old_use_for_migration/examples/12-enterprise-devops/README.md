# Agent-to-Agent Communication Example

This example demonstrates how to enable direct communication between AI agents using the OAAS communication system.

## Overview

The OAAS communication system provides:
- **Protocol Adapters** - Translate messages between different agent frameworks
- **Communication Bridge** - Route messages to appropriate agents
- **Direct Messaging** - Real-time agent-to-agent messaging
- **Topic Subscription** - Publish/subscribe messaging patterns
- **Delivery Receipts** - Message delivery confirmation

## Quick Start

```typescript
import { 
  AgentCommunicationBridge, 
  DirectMessagingSystem,
  ProtocolAdapterFactory 
} from '@bluefly/oaas-services';

// Initialize communication system
const bridge = new AgentCommunicationBridge({
  agentId: 'my-agent',
  endpoint: 'http://localhost:3000',
  framework: 'oaas',
  enableEncryption: true
});

const protocolFactory = new ProtocolAdapterFactory();
const messaging = new DirectMessagingSystem(bridge, protocolFactory);

// Send direct message
const message = await messaging.sendDirectMessage(
  'my-agent',
  'target-agent',
  { task: 'analyze code', file: 'example.ts' }
);

// Subscribe to topics
await messaging.subscribeToTopic('my-agent', 'code-analysis');

// Publish to topic
await messaging.publishToTopic(
  'my-agent',
  'code-analysis',
  { results: 'analysis complete' }
);
```

## Framework Integration

### MCP (Model Context Protocol)
```typescript
// MCP agent automatically translates messages
const mcpMessage = {
  jsonrpc: '2.0',
  id: '123',
  method: 'agent/request',
  params: {
    from: 'mcp-agent',
    payload: { task: 'process data' }
  }
};
```

### LangChain
```typescript
// LangChain agent integration
const langchainMessage = {
  agent_id: 'langchain-agent',
  content: 'Process this data',
  message_type: 'human',
  metadata: { chain_type: 'sequential' }
};
```

### CrewAI
```typescript
// CrewAI task delegation
const crewaiTask = {
  agent: 'crew-member',
  description: 'Analyze requirements',
  type: 'task',
  priority: 'high'
};
```

### OpenAI Assistant
```typescript
// OpenAI Assistant communication
const openaiMessage = {
  role: 'user',
  content: JSON.stringify({
    from: 'coordinator',
    payload: { instruction: 'review code' }
  })
};
```

### Anthropic Claude
```typescript
// Claude agent integration
const claudeMessage = {
  model: 'claude-3-5-sonnet-20241022',
  messages: [{
    role: 'user',
    content: JSON.stringify({
      agent_communication: true,
      payload: { task: 'code review' }
    })
  }]
};
```

## Communication Patterns

### 1. Direct Messaging
```typescript
// One-to-one communication
await messaging.sendDirectMessage(
  'agent-a',
  'agent-b', 
  { request: 'analyze this file', file_path: '/path/to/file.ts' },
  { priority: 'high', require_receipt: true }
);
```

### 2. Broadcast Messaging
```typescript
// One-to-many communication
await messaging.broadcastMessage(
  'coordinator',
  ['worker-1', 'worker-2', 'worker-3'],
  { task: 'parallel processing', data: [...] },
  { exclude_offline: true }
);
```

### 3. Topic-Based Messaging
```typescript
// Subscribe to topics
await messaging.subscribeToTopic('analyzer', 'code-review');
await messaging.subscribeToTopic('security-agent', 'code-review');

// Publish to topic
await messaging.publishToTopic(
  'developer',
  'code-review',
  { pull_request: 'PR-123', files: ['src/index.ts'] }
);
```

### 4. Request-Response Pattern
```typescript
// Set up response handler
messaging.on('message_received', async (message) => {
  if (message.type === 'request') {
    const response = await processRequest(message.payload);
    
    await messaging.sendDirectMessage(
      message.to,
      message.from,
      response,
      { conversation_id: message.conversation_id }
    );
  }
});
```

## Agent Registration

```typescript
// Register agents for communication
const peers = [
  {
    id: 'code-analyzer',
    name: 'Code Analysis Agent',
    endpoint: 'http://localhost:3001',
    framework: 'langchain',
    capabilities: ['code_analysis', 'security_scanning'],
    status: 'online'
  },
  {
    id: 'test-generator', 
    name: 'Test Generation Agent',
    endpoint: 'http://localhost:3002',
    framework: 'crewai',
    capabilities: ['test_generation', 'coverage_analysis'],
    status: 'online'
  }
];

for (const peer of peers) {
  await bridge.registerPeer(peer);
}
```

## Message Types and Routing

### Message Structure
```typescript
interface AgentMessage {
  id: string;                    // Unique message ID
  from: string;                  // Sender agent ID
  to: string;                    // Recipient agent ID
  type: 'request' | 'response' | 'notification' | 'error';
  payload: any;                  // Message content
  timestamp: string;             // ISO timestamp
  conversation_id?: string;      // Groups related messages
  metadata?: {
    framework: string;           // Original framework
    priority?: string;           // Message priority
    timeout_ms?: number;         // Response timeout
  };
}
```

### Automatic Protocol Translation
The system automatically translates messages between frameworks:

```typescript
// MCP -> LangChain translation
const mcpRequest = {
  jsonrpc: '2.0',
  method: 'agent/request',
  params: { task: 'analyze' }
};

// Becomes LangChain format:
const langchainRequest = {
  agent_id: 'source-agent',
  content: { task: 'analyze' },
  message_type: 'human'
};
```

## Error Handling and Reliability

### Delivery Receipts
```typescript
// Enable delivery confirmation
const message = await messaging.sendDirectMessage(
  'sender',
  'recipient',
  { data: 'important' },
  { require_receipt: true, timeout_ms: 10000 }
);

// Check delivery status
messaging.on('delivery_confirmed', (receipt) => {
  console.log(`Message ${receipt.message_id} delivered`);
});
```

### Retry Logic
```typescript
// Automatic retry with exponential backoff
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000
};

await messaging.sendWithRetry(
  'sender',
  'recipient', 
  payload,
  retryConfig
);
```

### Health Monitoring
```typescript
// Monitor communication health
const health = await bridge.healthCheck();
console.log(`${health.peers_online} agents online`);
console.log(`${health.channels_active} active channels`);
```

## Security Features

### Message Encryption
```typescript
const secureBridge = new AgentCommunicationBridge({
  agentId: 'secure-agent',
  endpoint: 'https://localhost:3443',
  framework: 'oaas',
  enableEncryption: true,  // Enable E2E encryption
  certificatePath: '/path/to/cert.pem'
});
```

### Authentication
```typescript
// API key authentication
const authenticatedBridge = new AgentCommunicationBridge({
  agentId: 'auth-agent',
  endpoint: 'https://api.agents.com',
  framework: 'oaas',
  authentication: {
    type: 'api_key',
    key: process.env.AGENT_API_KEY
  }
});
```

## Performance Optimization

### Message Batching
```typescript
// Batch multiple messages for efficiency
const batch = [
  { to: 'worker-1', payload: { task: 'A' } },
  { to: 'worker-2', payload: { task: 'B' } },
  { to: 'worker-3', payload: { task: 'C' } }
];

await messaging.sendBatch('coordinator', batch);
```

### Connection Pooling
```typescript
// Reuse connections for better performance
const bridge = new AgentCommunicationBridge({
  agentId: 'efficient-agent',
  endpoint: 'http://localhost:3000',
  framework: 'oaas',
  connectionPool: {
    maxConnections: 10,
    keepAlive: true,
    timeout: 30000
  }
});
```

## Monitoring and Debugging

### Message Tracing
```typescript
// Enable detailed logging
messaging.on('message_sent', (message) => {
  console.log(`Sent: ${message.id} from ${message.from} to ${message.to}`);
});

messaging.on('message_received', (message) => {
  console.log(`Received: ${message.id} payload:`, message.payload);
});
```

### Statistics
```typescript
// Get communication statistics
const stats = messaging.getMessagingStats();
console.log(`Messages: ${stats.total_messages}`);
console.log(`Conversations: ${stats.active_conversations}`);
console.log(`Success Rate: ${stats.delivery_success_rate * 100}%`);
```

## Best Practices

1. **Use conversation IDs** to group related messages
2. **Set appropriate timeouts** for different message types  
3. **Handle offline agents** gracefully with queue persistence
4. **Monitor delivery receipts** for critical messages
5. **Use topic subscription** for broadcast scenarios
6. **Implement proper error handling** and retry logic
7. **Enable encryption** for sensitive communications
8. **Monitor performance** with built-in statistics

## Integration with OAAS Discovery

The communication system integrates seamlessly with OAAS agent discovery:

```typescript
// Discover and register all available agents
const discoveredAgents = await oaasService.discoverAgents();

for (const agent of discoveredAgents) {
  if (agent.oaas_spec?.capabilities?.includes('communication')) {
    await bridge.registerPeer({
      id: agent.id,
      name: agent.name,
      endpoint: agent.oaas_spec.endpoint || `http://localhost:${agent.port}`,
      framework: agent.format,
      capabilities: agent.capabilities.map(c => c.name),
      status: 'online'
    });
  }
}

// Now agents can communicate directly
await messaging.sendDirectMessage(
  'my-agent',
  discoveredAgents[0].id,
  { greeting: 'Hello from OAAS!' }
);
```

This communication system enables seamless agent-to-agent interaction regardless of the underlying framework, making it easy to build complex multi-agent workflows.