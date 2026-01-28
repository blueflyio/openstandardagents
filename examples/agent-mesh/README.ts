/**
 * Agent Mesh Communication Layer
 *
 * A comprehensive TypeScript implementation of the OSSA Agent-to-Agent (A2A) protocol
 * for inter-agent communication.
 *
 * ## Features
 *
 * - **Service Discovery**: Registry-based, broadcast, and multicast discovery mechanisms
 * - **Message Routing**: Direct, broadcast, topic-based, and request/response patterns
 * - **Multiple Transports**: HTTP, gRPC, WebSocket, MQTT support
 * - **Reliability**: Automatic retry, circuit breaker, and dead letter queue
 * - **Observability**: Built-in support for tracing, metrics, and logging
 * - **Security**: mTLS, bearer tokens, OIDC authentication
 * - **Type Safety**: Full TypeScript type definitions
 *
 * ## Architecture
 *
 * The agent mesh consists of several key components:
 *
 * 1. **Discovery Service**: Manages agent registration and discovery
 * 2. **Message Router**: Routes messages based on rules and patterns
 * 3. **Subscription Manager**: Manages channel subscriptions
 * 4. **Transport Layer**: Abstracts communication mechanisms
 * 5. **Agent Mesh Client**: Main API for agent-to-agent communication
 *
 * ## Quick Start
 *
 * ```typescript
 * import {
 *   AgentMeshClientBuilder,
 *   DiscoveryService,
 *   InMemoryAgentRegistry,
 * } from '@bluefly/openstandardagents/mesh';
 *
 * // 1. Create discovery service
 * const registry = new InMemoryAgentRegistry();
 * const discovery = new DiscoveryService(registry);
 *
 * // 2. Define your agent
 * const agent = {
 *   uri: 'agent://team/my-agent',
 *   name: 'My Agent',
 *   version: '1.0.0',
 *   ossaVersion: '0.3.0',
 *   capabilities: ['task-execution'],
 *   endpoints: { http: 'http://localhost:8080' },
 *   transport: ['http'],
 *   authentication: ['bearer'],
 *   encryption: { tlsRequired: true, minTlsVersion: '1.3' },
 * };
 *
 * // 3. Register agent
 * await discovery.registerSelf(agent);
 *
 * // 4. Create mesh client
 * const client = new AgentMeshClientBuilder()
 *   .withLocalAgent(agent)
 *   .withDiscovery(discovery)
 *   .build();
 *
 * // 5. Start communicating!
 * await client.publish('events.channel', { data: 'value' });
 * ```
 *
 * ## Examples
 *
 * Run the examples to see the agent mesh in action:
 *
 * ```bash
 * tsx examples/agent-mesh/basic-usage.ts
 * ```
 *
 * ## API Reference
 *
 * ### AgentMeshClient
 *
 * Main client for agent-to-agent communication.
 *
 * **Methods:**
 *
 * - `send(to, payload, options?)` - Send a message
 * - `request(to, payload, options?)` - Send request and wait for response
 * - `publish(channel, payload, options?)` - Publish event to topic
 * - `broadcast(namespace, payload, options?)` - Broadcast to all agents in namespace
 * - `subscribe(subscription, handler)` - Subscribe to channel
 * - `unsubscribe(channel, handler)` - Unsubscribe from channel
 * - `registerCommand(command, handler)` - Register command handler
 * - `invokeCommand(agentUri, commandName, input)` - Invoke command on another agent
 * - `handleMessage(message)` - Handle incoming message
 * - `getStats()` - Get routing statistics
 * - `close()` - Close the client
 *
 * ### DiscoveryService
 *
 * Manages agent discovery and registration.
 *
 * **Methods:**
 *
 * - `registerSelf(agentCard, heartbeatIntervalMs?)` - Register this agent
 * - `unregisterSelf()` - Unregister this agent
 * - `discoverByCapability(capability)` - Find agents by capability
 * - `discoverByUri(uri)` - Find agent by URI
 * - `listAgents()` - List all registered agents
 * - `findHealthyAgents()` - Find healthy agents only
 * - `isAgentAvailable(uri)` - Check if agent is available
 *
 * ## Message Patterns
 *
 * ### 1. Publish/Subscribe
 *
 * ```typescript
 * // Publisher
 * await client.publish('security.vulnerabilities', {
 *   vulnerability_id: 'vuln-001',
 *   severity: 'critical',
 * });
 *
 * // Subscriber
 * client.subscribe(
 *   {
 *     channel: 'security.vulnerabilities',
 *     handler: 'handleVulnerability',
 *     filter: {
 *       fields: { severity: ['high', 'critical'] }
 *     }
 *   },
 *   async (message) => {
 *     console.log('Received:', message.payload);
 *   }
 * );
 * ```
 *
 * ### 2. Request/Response
 *
 * ```typescript
 * // Requester
 * const response = await client.request(
 *   'agent://team/analyzer',
 *   { action: 'analyze', data: 'sample' },
 *   { timeoutMs: 30000 }
 * );
 *
 * // Responder (command handler)
 * client.registerCommand(
 *   {
 *     name: 'analyze',
 *     inputSchema: { type: 'object' },
 *   },
 *   async (input) => {
 *     // Process and return result
 *     return { result: 'success' };
 *   }
 * );
 * ```
 *
 * ### 3. Broadcast
 *
 * ```typescript
 * // Broadcast to all agents in namespace
 * await client.broadcast('workers', {
 *   event: 'shutdown',
 *   reason: 'maintenance',
 * });
 * ```
 *
 * ### 4. Direct Messaging
 *
 * ```typescript
 * // Send message directly to specific agent
 * await client.send('agent://team/specific-agent', {
 *   message: 'Hello!',
 * });
 * ```
 *
 * ## Routing Rules
 *
 * Define routing rules to control message flow:
 *
 * ```typescript
 * import { DefaultMessageRouter } from '@bluefly/openstandardagents/mesh';
 *
 * const router = new DefaultMessageRouter();
 *
 * router.addRule({
 *   source: 'agent://security/scanner',
 *   channel: 'security.vulnerabilities',
 *   targets: [
 *     'agent://compliance/auditor',
 *     'agent://monitoring/alerter',
 *   ],
 *   filter: {
 *     fields: { severity: ['critical', 'high'] }
 *   },
 *   priority: 'high',
 * });
 * ```
 *
 * ## Reliability Configuration
 *
 * Configure retry, circuit breaker, and dead letter queue:
 *
 * ```typescript
 * const client = new AgentMeshClientBuilder()
 *   .withLocalAgent(agent)
 *   .withDiscovery(discovery)
 *   .withReliability({
 *     deliveryGuarantee: 'at-least-once',
 *     retry: {
 *       maxAttempts: 3,
 *       backoff: 'exponential',
 *       initialDelayMs: 1000,
 *       maxDelayMs: 30000,
 *       multiplier: 2,
 *     },
 *     dlq: {
 *       enabled: true,
 *       channel: 'messaging.dlq',
 *       retentionDays: 30,
 *     },
 *   })
 *   .build();
 * ```
 *
 * ## Observability
 *
 * The agent mesh includes built-in observability features:
 *
 * - **Tracing**: W3C Trace Context propagation
 * - **Metrics**: Routing statistics and performance metrics
 * - **Logging**: Structured logging for all operations
 *
 * ```typescript
 * // Enable statistics
 * const client = new AgentMeshClientBuilder()
 *   .withLocalAgent(agent)
 *   .withDiscovery(discovery)
 *   .enableStats()
 *   .build();
 *
 * // Get statistics
 * const stats = client.getStats();
 * console.log('Total messages:', stats.totalMessages);
 * console.log('Average routing time:', stats.averageRoutingTimeMs);
 * console.log('Errors:', stats.routingErrors);
 * ```
 *
 * ## Advanced Topics
 *
 * ### Custom Transport
 *
 * Implement custom transport for different protocols:
 *
 * ```typescript
 * import { Transport, MessageEnvelope } from '@bluefly/openstandardagents/mesh';
 *
 * class MyCustomTransport implements Transport {
 *   async send(endpoint: string, message: MessageEnvelope): Promise<void> {
 *     // Custom implementation
 *   }
 *
 *   async close(): Promise<void> {
 *     // Cleanup
 *   }
 * }
 *
 * const client = new AgentMeshClientBuilder()
 *   .withLocalAgent(agent)
 *   .withDiscovery(discovery)
 *   .withTransport(new MyCustomTransport())
 *   .build();
 * ```
 *
 * ### Message Filtering
 *
 * Use filters to control which messages are processed:
 *
 * ```typescript
 * client.subscribe(
 *   {
 *     channel: 'security.*',  // Wildcard subscription
 *     handler: 'handleSecurity',
 *     filter: {
 *       fields: {
 *         severity: ['critical', 'high'],
 *         environment: 'production',
 *       },
 *       expression: "severity == 'critical'",
 *     },
 *   },
 *   async (message) => {
 *     // Only receives critical production messages
 *   }
 * );
 * ```
 *
 * ## Specification Compliance
 *
 * This implementation follows:
 *
 * - OSSA v0.3.0 Messaging Specification
 * - OSSA v0.2.9 A2A Protocol
 * - W3C Trace Context standard
 * - CloudEvents specification (message envelope)
 *
 * ## License
 *
 * Apache-2.0
 */

export {};
