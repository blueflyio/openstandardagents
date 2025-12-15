/**
 * Agent Mesh Communication Layer
 *
 * A complete implementation of the OSSA Agent-to-Agent (A2A) protocol for inter-agent communication.
 *
 * Features:
 * - Service discovery (registry-based, broadcast, multicast)
 * - Message routing (direct, broadcast, topic-based, request/response)
 * - Multiple transport mechanisms (HTTP, gRPC, WebSocket, MQTT)
 * - Reliability patterns (retry, circuit breaker, dead letter queue)
 * - Observability (tracing, metrics, logging)
 * - Security (mTLS, bearer tokens, OIDC)
 *
 * @example
 * ```typescript
 * import { AgentMeshClientBuilder, DiscoveryService, InMemoryAgentRegistry } from '@bluefly/openstandardagents/mesh';
 *
 * // Create discovery service
 * const registry = new InMemoryAgentRegistry();
 * const discovery = new DiscoveryService(registry);
 *
 * // Define local agent
 * const localAgent = {
 *   uri: 'agent://team-a/my-agent',
 *   name: 'My Agent',
 *   version: '1.0.0',
 *   ossaVersion: '0.3.1',
 *   capabilities: ['task-execution', 'data-processing'],
 *   endpoints: { http: 'http://localhost:8080' },
 *   transport: ['http'],
 *   authentication: ['bearer'],
 *   encryption: { tlsRequired: true, minTlsVersion: '1.3' },
 * };
 *
 * // Register agent
 * await discovery.registerSelf(localAgent);
 *
 * // Create mesh client
 * const client = new AgentMeshClientBuilder()
 *   .withLocalAgent(localAgent)
 *   .withDiscovery(discovery)
 *   .enableStats()
 *   .build();
 *
 * // Subscribe to events
 * client.subscribe(
 *   {
 *     channel: 'security.vulnerabilities',
 *     handler: 'handleVulnerability',
 *   },
 *   async (message) => {
 *     console.log('Received vulnerability:', message.payload);
 *   }
 * );
 *
 * // Publish events
 * await client.publish('security.vulnerabilities', {
 *   vulnerability_id: 'vuln-123',
 *   severity: 'critical',
 *   cve_id: 'CVE-2024-1234',
 * });
 *
 * // Request/response
 * const response = await client.request(
 *   'agent://team-b/analyzer',
 *   { action: 'analyze', data: 'sample' }
 * );
 *
 * // Register commands
 * client.registerCommand(
 *   {
 *     name: 'scan_package',
 *     inputSchema: { type: 'object', properties: { package: { type: 'string' } } },
 *   },
 *   async (input) => {
 *     // Perform scan
 *     return { vulnerabilities: [], status: 'success' };
 *   }
 * );
 * ```
 *
 * @packageDocumentation
 */

// Types
export * from './types.js';

// Discovery
export {
  AgentRegistry,
  InMemoryAgentRegistry,
  DiscoveryService,
  AgentUriParser,
  TopicUriParser,
  type DiscoveryMethod,
} from './discovery.js';

// Routing
export {
  MessageRouter,
  SubscriptionManager,
  DefaultMessageRouter,
  DefaultSubscriptionManager,
  MessagePriorityQueue,
  MessageFilter,
  MessageTransform,
  RoutingStatsCollector,
  type RoutingStats,
} from './routing.js';

// Client
export {
  Transport,
  HttpTransport,
  AgentMeshClient,
  AgentMeshClientBuilder,
  type AgentMeshClientConfig,
} from './client.js';

// Re-export commonly used types for convenience
export type {
  MessageEnvelope,
  AgentCard,
  MessageType,
  MessagePriority,
  TaskState,
  A2AErrorCode,
  MessageHandler,
  CommandHandler,
  Subscription,
  Command,
  PublishedChannel,
  RoutingRule,
  MessagingExtension,
  AgentMeshConfig,
  ReliabilityConfig,
} from './types.js';
