/**
 * OSSA Messaging Runtime
 * Production-quality agent-to-agent messaging
 *
 * @fileoverview Pub/sub messaging, routing, and agent coordination
 * @module @ossa/messaging
 */

// Core service
export { MessagingService } from './messaging.service.js';
export type { AgentMessagingConfig } from './messaging.service.js';

// Message broker implementations
export { MemoryBroker } from './memory-broker.js';

// Types
export {
  // Core types
  MessageEnvelope,
  PublishedChannel,
  Subscription,
  Command,
  ReliabilityConfig,

  // Extended types
  DeliveryGuarantee,
  MessagePriority,
  AcknowledgmentMode,
  BackoffStrategy,
  MessageState,
  Channel,
  ActiveSubscription,
  MessageHandler,
  MessageAcknowledgment,
  SubscriptionFilter,

  // Broker interface
  MessageBroker,
  SubscriptionOptions,
  BrokerHealth,
  ChannelStats,

  // Routing and context
  RoutingContext,
  DeadLetterEntry,
  MessageMetrics,
  ValidationResult,
} from './messaging.types.js';

/**
 * Usage Example:
 *
 * ```typescript
 * import { MessagingService } from '@ossa/messaging';
 *
 * // Create messaging service for an agent
 * const messaging = new MessagingService({
 *   agentId: 'security-scanner',
 *   agentName: 'Security Scanner',
 *   messaging: {
 *     publishes: [{
 *       channel: 'security.vulnerabilities',
 *       schema: {
 *         type: 'object',
 *         properties: {
 *           severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
 *           cve: { type: 'string' },
 *           affectedPackage: { type: 'string' }
 *         },
 *         required: ['severity', 'cve', 'affectedPackage']
 *       }
 *     }],
 *     subscribes: [{
 *       channel: 'code.commits',
 *       handler: 'handleCommit'
 *     }]
 *   }
 * });
 *
 * // Start the service
 * await messaging.start();
 *
 * // Subscribe to a channel
 * await messaging.subscribe('code.commits', async (message) => {
 *   console.log('Received commit:', message.payload);
 *
 *   // Scan for vulnerabilities
 *   const vulnerabilities = await scanCommit(message.payload);
 *
 *   // Publish findings
 *   for (const vuln of vulnerabilities) {
 *     await messaging.publish('security.vulnerabilities', vuln);
 *   }
 * });
 *
 * // Publish a message
 * await messaging.publish('security.vulnerabilities', {
 *   severity: 'high',
 *   cve: 'CVE-2024-1234',
 *   affectedPackage: 'lodash@4.17.20'
 * });
 *
 * // Send a command to another agent
 * const result = await messaging.sendCommand(
 *   'remediation-agent',
 *   'apply_patch',
 *   { cve: 'CVE-2024-1234', package: 'lodash' }
 * );
 *
 * // Get metrics
 * const metrics = messaging.getMetrics();
 * console.log('Messages published:', metrics.published);
 * console.log('Average latency:', metrics.avgLatencyMs, 'ms');
 *
 * // Graceful shutdown
 * await messaging.stop();
 * ```
 */
