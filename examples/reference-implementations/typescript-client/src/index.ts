/**
 * OSSA TypeScript Client SDK
 *
 * Complete SDK for interacting with the OSSA Registry and Core API.
 *
 * @example
 * ```typescript
 * import { OSSA } from '@ossa/client';
 *
 * const client = new OSSA({
 *   bearerToken: 'ossa_tok_xxx'
 * });
 *
 * // Search for agents
 * const results = await client.agents.search({ domain: 'security' });
 *
 * // Get agent details
 * const agent = await client.agents.get('blueflyio', 'security-scanner');
 *
 * // Send A2A message
 * await client.messaging.sendMessage({
 *   from: { publisher: 'myorg', name: 'my-agent' },
 *   to: { publisher: 'blueflyio', name: 'security-scanner' },
 *   type: 'request',
 *   capability: 'vulnerability-scan',
 *   payload: { target: 'https://example.com' }
 * });
 * ```
 */

export { OSSAClient, OSSAClientConfig, OSSAAPIError } from './client.js';
export { AgentClient, AgentManifest, PublishRequest, SearchParams } from './agents.js';
export { DiscoveryClient, TaxonomyNode, DiscoveryFilters } from './discovery.js';
export { MessagingClient, A2AMessage, WebhookConfig, EventSubscription } from './messaging.js';

import { OSSAClient, OSSAClientConfig } from './client.js';
import { AgentClient } from './agents.js';
import { DiscoveryClient } from './discovery.js';
import { MessagingClient } from './messaging.js';

/**
 * Main OSSA SDK class
 */
export class OSSA {
  private client: OSSAClient;

  public readonly agents: AgentClient;
  public readonly discovery: DiscoveryClient;
  public readonly messaging: MessagingClient;

  constructor(config: OSSAClientConfig = {}) {
    this.client = new OSSAClient(config);
    this.agents = new AgentClient(this.client);
    this.discovery = new DiscoveryClient(this.client);
    this.messaging = new MessagingClient(this.client);
  }

  /**
   * Get the underlying client instance
   */
  getClient(): OSSAClient {
    return this.client;
  }
}

// Default export
export default OSSA;
