# OSSA TypeScript Client

TypeScript reference implementation for the OSSA (Open Standards for Scalable Agents) API.

## Features

- **Full Type Safety**: Complete TypeScript definitions for all API operations
- **Agent Operations**: Search, publish, and manage agents
- **Discovery**: Find agents by taxonomy, capabilities, and compliance
- **A2A Messaging**: Agent-to-agent communication with webhooks and event streaming
- **Error Handling**: Comprehensive error handling with retries and rate limiting
- **Modern ES Modules**: Built with ES2022 modules

## Installation

```bash
npm install
npm run build
```

## Quick Start

```typescript
import { OSSA } from './src/index.js';

// Initialize the client
const client = new OSSA({
  bearerToken: process.env.OSSA_TOKEN,
});

// Search for agents
const results = await client.agents.search({
  domain: 'security',
  limit: 10,
});

// Get agent details
const agent = await client.agents.get('blueflyio', 'security-scanner');

// Send A2A message
await client.messaging.sendMessage({
  from: { publisher: 'myorg', name: 'my-agent' },
  to: { publisher: 'blueflyio', name: 'security-scanner' },
  type: 'request',
  capability: 'vulnerability-scan',
  payload: { target: 'https://example.com' },
});
```

## Examples

Run the included examples:

```bash
# Basic usage - search and get agent details
npm run example

# Search with various filters
npm run example:search

# Publish an agent (requires OSSA_TOKEN)
export OSSA_TOKEN=ossa_tok_xxx
npm run example:publish

# A2A messaging and webhooks
npm run example:messaging
```

## API Reference

### Client Initialization

```typescript
const client = new OSSA({
  baseUrl?: string;           // Default: https://registry.openstandardagents.org/api/v1
  bearerToken?: string;       // Bearer token for authentication
  apiKey?: string;            // Alternative: API key authentication
  timeout?: number;           // Request timeout in ms (default: 30000)
  retries?: number;           // Number of retries (default: 3)
});
```

### Agent Operations

```typescript
// Search agents
const results = await client.agents.search({
  q?: string;                 // Full-text search
  domain?: string;            // Filter by domain
  capability?: string;        // Filter by capability
  publisher?: string;         // Filter by publisher
  verified?: boolean;         // Only verified publishers
  min_rating?: number;        // Minimum rating (1-5)
  sort?: 'downloads' | 'rating' | 'updated' | 'created';
  limit?: number;             // Results per page (max 100)
  offset?: number;            // Pagination offset
});

// Get agent details
const agent = await client.agents.get(publisher, name);

// Get specific version
const version = await client.agents.getVersion(publisher, name, version);

// List versions
const versions = await client.agents.listVersions(publisher, name);

// Publish agent
const result = await client.agents.publish({
  manifest: {...},
  package: {
    tarball_url: string,
    shasum: string,
    size_bytes: number,
  },
  license: string,
  keywords?: string[],
});

// Get dependencies
const deps = await client.agents.getDependencies(publisher, name, version);
```

### Discovery Operations

```typescript
// List taxonomies
const taxonomies = await client.discovery.listTaxonomies();

// List capabilities
const capabilities = await client.discovery.listCapabilities(domain);

// Discover by taxonomy
const agents = await client.discovery.discoverByTaxonomy(
  'security',
  'vulnerability',
  'vulnerability-detection'
);

// Get recommendations
const recommendations = await client.discovery.getRecommendations({
  use_case: 'Scan web apps for vulnerabilities',
  requirements: {
    compliance: ['fedramp-moderate'],
    budget: '$100/month',
  },
  preferences: {
    verified_only: true,
    min_rating: 4.0,
  },
});
```

### Messaging Operations

```typescript
// Send A2A message
const result = await client.messaging.sendMessage({
  from: { publisher: string, name: string },
  to: { publisher: string, name: string },
  type: 'request' | 'response' | 'event' | 'broadcast',
  capability: string,
  payload: object,
  metadata?: {
    correlation_id?: string,
    priority?: 'low' | 'normal' | 'high' | 'critical',
    ttl?: number,
  },
});

// Send synchronous request
const response = await client.messaging.sendRequest(message, timeout);

// Register webhook
const webhook = await client.messaging.registerWebhook({
  url: string,
  events: string[],
  filters?: object,
  headers?: object,
});

// Stream events
for await (const event of client.messaging.streamEvents({
  agent: { publisher: 'blueflyio', name: 'security-scanner' },
  event_types: ['scan.completed'],
})) {
  console.log('Event:', event);
}
```

## Error Handling

```typescript
import { OSSAAPIError } from './src/index.js';

try {
  const agent = await client.agents.get('publisher', 'agent');
} catch (error) {
  if (error instanceof OSSAAPIError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Details:', error.apiError);
  }
}
```

## Configuration

Environment variables:

- `OSSA_TOKEN`: Bearer token for authentication
- `OSSA_BASE_URL`: Override base API URL

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.3.0

## License

Apache-2.0

## Resources

- [OSSA Documentation](https://docs.openstandardagents.org)
- [API Reference](https://registry.openstandardagents.org/docs)
- [GitHub Repository](https://github.com/openstandardagents/ossa)
